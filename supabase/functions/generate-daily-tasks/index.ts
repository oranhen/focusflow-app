// =============================================================================
// Supabase Edge Function: generate-daily-tasks
//
// Given a goal_id, calls Google Gemini with the user's profile + goal context
// and inserts 3 small, actionable tasks for today into public.daily_tasks.
//
// Auth: bearer token from the client. Inserts run under the user's JWT, so
// RLS still applies (users can only insert their own tasks).
//
// Secrets required:
//   GEMINI_API_KEY — set via `supabase secrets set GEMINI_API_KEY=...`
// =============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, jsonResponse, preflight } from '../_shared/cors.ts'

interface AITask {
  title: string
  reason: string
}

Deno.serve(async (req) => {
  const pre = preflight(req)
  if (pre) return pre

  try {
    if (req.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405)
    }

    const { goal_id } = await req.json().catch(() => ({}))
    if (!goal_id) {
      return jsonResponse({ error: 'goal_id is required' }, 400)
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return jsonResponse({ error: 'Missing Authorization header' }, 401)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const geminiKey = Deno.env.get('GEMINI_API_KEY')
    if (!geminiKey) {
      return jsonResponse({ error: 'GEMINI_API_KEY is not configured' }, 500)
    }

    // Client scoped to the calling user — RLS applies on reads + inserts.
    const supa = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const {
      data: { user },
      error: userErr,
    } = await supa.auth.getUser()
    if (userErr || !user) {
      return jsonResponse({ error: 'Unauthorized' }, 401)
    }

    // Load goal + profile for prompt context
    const [{ data: goal, error: goalErr }, { data: profile }] = await Promise.all([
      supa.from('goals').select('*').eq('id', goal_id).single(),
      supa.from('user_profiles').select('*').eq('id', user.id).single(),
    ])
    if (goalErr || !goal) {
      return jsonResponse({ error: 'Goal not found' }, 404)
    }

    const prompt = buildPrompt(goal, profile)

    const geminiUrl =
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=' +
      geminiKey

    const geminiRes = await fetch(geminiUrl, {
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
              tasks: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    reason: { type: 'string' },
                  },
                  required: ['title', 'reason'],
                },
              },
            },
            required: ['tasks'],
          },
        },
      }),
    })

    if (!geminiRes.ok) {
      const errText = await geminiRes.text()
      return jsonResponse(
        { error: 'Gemini call failed', detail: errText.slice(0, 500) },
        502,
      )
    }

    const geminiJson = await geminiRes.json()
    const text: string | undefined =
      geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) {
      return jsonResponse({ error: 'Empty response from Gemini' }, 502)
    }

    let parsedTasks: AITask[] = []
    try {
      const parsed = JSON.parse(text)
      parsedTasks = Array.isArray(parsed?.tasks) ? parsed.tasks : []
    } catch (_e) {
      return jsonResponse({ error: 'Could not parse Gemini output', raw: text }, 502)
    }

    parsedTasks = parsedTasks
      .filter((t) => t && typeof t.title === 'string' && t.title.trim())
      .slice(0, 5)

    if (parsedTasks.length === 0) {
      return jsonResponse({ error: 'Gemini returned no usable tasks' }, 502)
    }

    const today = new Date().toISOString().slice(0, 10)
    const rows = parsedTasks.map((t) => ({
      user_id: user.id,
      goal_id: goal.id,
      title: t.title.trim().slice(0, 200),
      description: (t.reason || '').trim().slice(0, 500) || null,
      due_date: today,
      ai_generated: true,
    }))

    const { data: inserted, error: insErr } = await supa
      .from('daily_tasks')
      .insert(rows)
      .select('*, goals(title, category)')

    if (insErr) {
      return jsonResponse({ error: insErr.message }, 500)
    }

    return jsonResponse({ tasks: inserted ?? [] })
  } catch (e) {
    return jsonResponse({ error: String(e) }, 500)
  }
})

function buildPrompt(goal: any, profile: any): string {
  const motivation = profile?.motivation_level ?? 'medium'
  const focus =
    goal?.category ?? profile?.main_focus_area ?? 'general'
  const focusTime = profile?.preferred_task_time ?? '09:00'
  const name = profile?.full_name?.split?.(' ')?.[0] ?? 'the user'

  return `You are FocusFlow's productivity coach. ${name} has a long-term goal and needs THREE small, concrete tasks to do TODAY that move them toward it. Each task must be doable in 15-25 minutes.

USER PROFILE
- Main focus area: ${profile?.main_focus_area ?? 'unspecified'}
- Motivation level: ${motivation} (low = encouraging & easy; medium = steady; high = ambitious)
- Preferred focus time: ${focusTime}

GOAL
- Title: ${goal.title}
- Description: ${goal.description ?? 'not provided'}
- Category: ${focus}
- Current progress: ${goal.progress_percent}%
- Target date: ${goal.target_date ?? 'unspecified'}

INSTRUCTIONS
- Produce exactly 3 tasks (or 2 if the goal is genuinely small).
- Each task must be SPECIFIC and ACTIONABLE today — start with a verb. Not a vague aspiration.
- Avoid generic advice like "set goals" or "make a plan". Tie tasks to the concrete goal title.
- For each task, include a single-sentence "reason" explaining how it advances the goal.
- Calibrate difficulty to motivation level "${motivation}".

Respond ONLY as JSON: { "tasks": [ { "title": "...", "reason": "..." }, ... ] }`
}
