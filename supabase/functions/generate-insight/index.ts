// =============================================================================
// Supabase Edge Function: generate-insight
//
// Looks at the user's recent task completion history (last 14 days) and active
// goals, asks Gemini to surface ONE specific, useful pattern, then persists
// it into public.ai_insights.
// =============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { jsonResponse, preflight, fetchWithRetry } from '../_shared/cors.ts'

interface AIInsight {
  title: string
  content: string
  insight_type: 'progress' | 'habit' | 'warning' | 'success'
}

Deno.serve(async (req) => {
  const pre = preflight(req)
  if (pre) return pre

  try {
    if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405)

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return jsonResponse({ error: 'Missing Authorization header' }, 401)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const geminiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiKey) return jsonResponse({ error: 'GEMINI_API_KEY is not configured' }, 500)

    const supa = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user }, error: userErr } = await supa.auth.getUser()
    if (userErr || !user) return jsonResponse({ error: 'Unauthorized' }, 401)

    const since = new Date()
    since.setDate(since.getDate() - 13)
    const sinceISO = since.toISOString().slice(0, 10)

    const [{ data: profile }, { data: goals }, { data: tasks }] = await Promise.all([
      supa.from('user_profiles').select('*').eq('id', user.id).single(),
      supa.from('goals').select('title, category, status, progress_percent').eq('user_id', user.id),
      supa.from('daily_tasks').select('due_date, is_completed, ai_generated, title').gte('due_date', sinceISO),
    ])

    const totals = (tasks ?? []).reduce(
      (acc, t) => {
        acc.total++
        if (t.is_completed) acc.completed++
        if (t.ai_generated) acc.ai++
        return acc
      },
      { total: 0, completed: 0, ai: 0 },
    )

    const byDay: Record<string, { c: number; t: number }> = {}
    for (const t of tasks ?? []) {
      const d = byDay[t.due_date] ?? { c: 0, t: 0 }
      d.t++
      if (t.is_completed) d.c++
      byDay[t.due_date] = d
    }
    const summary = Object.entries(byDay)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => `${date}: ${v.c}/${v.t}`)
      .join(', ')

    if (totals.total === 0) {
      return jsonResponse({ error: 'Not enough data yet — complete a few tasks first.' }, 400)
    }

    const goalsText = (goals ?? [])
      .map((g) => `- ${g.title} (${g.category ?? 'general'}, ${g.status}, ${g.progress_percent}%)`)
      .join('\n')

    const prompt = `You are FocusFlow's coach. Based on the user's last 14 days, surface ONE specific, actionable insight. Be concrete; use their own data.

USER PROFILE
- Focus area: ${profile?.main_focus_area ?? 'unspecified'}
- Motivation: ${profile?.motivation_level ?? 'medium'}
- Energy peak: ${profile?.energy_peak ?? 'unspecified'}
- Daily time commitment: ${profile?.daily_time_commitment ?? 'unspecified'}
- Experience: ${profile?.experience_level ?? 'unspecified'}
- Their stated blocker: ${profile?.biggest_blocker ?? 'unspecified'}
- Their definition of success: ${profile?.success_definition ?? 'unspecified'}

GOALS
${goalsText || '(none)'}

14-DAY TASK DATA
- Total: ${totals.total} tasks (${totals.completed} completed, ${totals.ai} AI-generated)
- Completion by day: ${summary || '(no data)'}

INSTRUCTIONS
- Choose insight_type: "progress" (improvement trend), "habit" (pattern observation), "warning" (something slipping), "success" (a clear win).
- Title: short and concrete (max 8 words).
- Content: 1-3 sentences. Refer to actual numbers/days where possible. If their stated blocker or success definition is relevant, weave that in.

Respond strictly as JSON: { "title": "...", "content": "...", "insight_type": "..." }`

    const model = Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.5-flash'
    const geminiUrl =
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=` +
      geminiKey

    const geminiRes = await fetchWithRetry(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              content: { type: 'string' },
              insight_type: { type: 'string', enum: ['progress', 'habit', 'warning', 'success'] },
            },
            required: ['title', 'content', 'insight_type'],
          },
        },
      }),
    })

    if (!geminiRes.ok) {
      const errText = await geminiRes.text()
      const friendly =
        geminiRes.status === 503 || geminiRes.status === 429
          ? 'The AI is busy right now. Please try again in a moment.'
          : 'AI call failed. Please try again.'
      return jsonResponse({ error: friendly, detail: errText.slice(0, 500) }, 502)
    }

    const geminiJson = await geminiRes.json()
    const text: string | undefined = geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) return jsonResponse({ error: 'Empty response from Gemini' }, 502)

    let parsed: AIInsight
    try {
      parsed = JSON.parse(text)
    } catch (_e) {
      return jsonResponse({ error: 'Could not parse Gemini output', raw: text }, 502)
    }

    if (!parsed?.title || !parsed?.content) {
      return jsonResponse({ error: 'AI insight missing required fields' }, 502)
    }

    const { data: inserted, error: insErr } = await supa
      .from('ai_insights')
      .insert({
        user_id: user.id,
        title: parsed.title.slice(0, 200),
        content: parsed.content.slice(0, 1000),
        insight_type: ['progress', 'habit', 'warning', 'success'].includes(parsed.insight_type)
          ? parsed.insight_type
          : 'progress',
      })
      .select()
      .single()

    if (insErr) return jsonResponse({ error: insErr.message }, 500)

    return jsonResponse({ insight: inserted })
  } catch (e) {
    return jsonResponse({ error: String(e) }, 500)
  }
})
