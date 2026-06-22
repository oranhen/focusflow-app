// =============================================================================
// Supabase Edge Function: chat
//
// Receives a user message, calls Gemini with FocusFlow coaching context
// (the user's profile + active goals + recent task history) and persists
// BOTH the user message and the AI reply to public.chat_messages.
//
// Auth: bearer token from the client. All DB writes go through the user's
// JWT so RLS applies (each user only writes their own messages).
//
// Secrets required:
//   GEMINI_API_KEY — set via `supabase secrets set GEMINI_API_KEY=...`
// =============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { jsonResponse, preflight, fetchWithRetry } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  const pre = preflight(req)
  if (pre) return pre

  try {
    if (req.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405)
    }

    const { message } = await req.json().catch(() => ({}))
    if (!message || typeof message !== 'string' || !message.trim()) {
      return jsonResponse({ error: 'message is required' }, 400)
    }

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

    // Build coaching context
    const [{ data: profile }, { data: goals }, { data: recentMsgs }] = await Promise.all([
      supa.from('user_profiles').select('*').eq('id', user.id).single(),
      supa.from('goals').select('title, description, category, status, progress_percent').eq('status', 'active').limit(5),
      supa.from('chat_messages').select('content, is_from_user').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
    ])

    const history = (recentMsgs ?? []).reverse() // chronological
    const prompt = buildPrompt(message, profile, goals ?? [], history)

    const model = Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.5-flash'
    const geminiUrl =
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=` +
      geminiKey

    const geminiRes = await fetchWithRetry(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 512 },
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
    const reply: string =
      geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ''

    if (!reply) {
      return jsonResponse({ error: 'Empty response from Gemini' }, 502)
    }

    // Persist the AI reply. (The user message was already persisted client-side.)
    const { data: aiRow, error: insErr } = await supa
      .from('chat_messages')
      .insert({ user_id: user.id, content: reply, is_from_user: false })
      .select()
      .single()

    if (insErr) {
      return jsonResponse({ error: insErr.message }, 500)
    }

    return jsonResponse({ reply, message: aiRow })
  } catch (e) {
    return jsonResponse({ error: String(e) }, 500)
  }
})

function buildPrompt(
  message: string,
  profile: any,
  goals: any[],
  history: Array<{ content: string; is_from_user: boolean }>,
): string {
  const name = profile?.full_name?.split?.(' ')?.[0] ?? 'the user'
  const goalsText = goals.length
    ? goals.map((g) => `- ${g.title} (${g.category ?? 'general'}, ${g.progress_percent}% done)${g.description ? `: ${g.description}` : ''}`).join('\n')
    : '(no active goals)'

  const historyText = history.length
    ? history.map((m) => `${m.is_from_user ? 'User' : 'Coach'}: ${m.content}`).join('\n')
    : '(no prior messages)'

  return `You are FocusFlow, a warm, concise productivity coach. You help ${name} translate long-term goals into today's concrete actions. Keep replies short (2-5 sentences). Speak in plain English.

USER PROFILE
- Name: ${name}
- Main focus area: ${profile?.main_focus_area ?? 'unspecified'}
- Motivation level: ${profile?.motivation_level ?? 'medium'}
- Preferred focus time: ${profile?.preferred_task_time ?? 'unspecified'}
- Energy peak: ${profile?.energy_peak ?? 'unspecified'}
- Daily time commitment: ${profile?.daily_time_commitment ?? 'unspecified'}
- Experience with their goal: ${profile?.experience_level ?? 'unspecified'}
- What gets in their way: ${profile?.biggest_blocker ?? 'unspecified'}
- What success looks like in 3 months: ${profile?.success_definition ?? 'unspecified'}

ACTIVE GOALS
${goalsText}

RECENT CONVERSATION
${historyText}

NEW MESSAGE FROM ${name.toUpperCase()}:
${message}

INSTRUCTIONS
- Reference their actual goals AND profile signals (blocker, success definition) when relevant.
- If asked "what should I do today", suggest 1-2 specific tasks calibrated to their time commitment.
- Be encouraging but honest. Don't lecture. Don't dump generic advice.
- Reply directly in plain text. No JSON, no headers, no markdown.`
}
