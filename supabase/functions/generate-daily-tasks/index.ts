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
import { jsonResponse, preflight, fetchWithRetry } from '../_shared/cors.ts'

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

    // Load goal + profile + recent task history for prompt context
    const [{ data: goal, error: goalErr }, { data: profile }, { data: recentTasks }] = await Promise.all([
      supa.from('goals').select('*').eq('id', goal_id).single(),
      supa.from('user_profiles').select('*').eq('id', user.id).single(),
      supa
        .from('daily_tasks')
        .select('title, description, is_completed, completed_at, due_date, ai_generated')
        .eq('goal_id', goal_id)
        .order('due_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(30),
    ])
    if (goalErr || !goal) {
      return jsonResponse({ error: 'Goal not found' }, 404)
    }

    const prompt = buildPrompt(goal, profile, recentTasks ?? [])

    const geminiModel = Deno.env.get('GEMINI_MODEL') ?? 'gemini-2.5-flash'
    const geminiUrl =
      `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=` +
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
      const friendly =
        geminiRes.status === 503 || geminiRes.status === 429
          ? 'The AI is busy right now. Please try again in a moment.'
          : 'AI call failed. Please try again.'
      return jsonResponse(
        { error: friendly, detail: errText.slice(0, 500) },
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

    // Side effect: record a single recommendation that points back to this goal.
    // Surfaces a "what to focus on" suggestion in addition to the concrete tasks.
    const recDescription = parsedTasks
      .slice(0, 3)
      .map((t) => `• ${t.title}`)
      .join('\n')

    await supa.from('recommendations').insert({
      user_id: user.id,
      goal_id: goal.id,
      title: `Today's focus: ${goal.title}`,
      description: recDescription,
      priority: goal.progress_percent < 30 ? 'high' : goal.progress_percent < 70 ? 'medium' : 'low',
    })

    return jsonResponse({ tasks: inserted ?? [] })
  } catch (e) {
    return jsonResponse({ error: String(e) }, 500)
  }
})

function buildPrompt(goal: any, profile: any, recentTasks: any[]): string {
  const name = profile?.full_name?.split?.(' ')?.[0] ?? 'the user'
  const motivation = profile?.motivation_level ?? 'medium'
  const focus = goal?.category ?? profile?.main_focus_area ?? 'general'
  const focusTime = profile?.preferred_task_time ?? '09:00'
  const commitment = profile?.daily_time_commitment ?? null
  const energyPeak = profile?.energy_peak ?? null
  const experience = profile?.experience_level ?? null
  const blocker = profile?.biggest_blocker ?? null
  const success = profile?.success_definition ?? null

  const taskSizeHint = (() => {
    switch (commitment) {
      case '15min': return 'Tasks should be tiny — 5 to 10 minutes each. Three small wins.'
      case '30min': return 'Tasks should be small — 10 to 15 minutes each.'
      case '1h':    return 'Tasks can be 15 to 25 minutes. Three meaningful pushes.'
      case '2h+':   return 'Tasks can be 20 to 40 minutes — deeper work blocks are OK.'
      default:      return 'Each task should be doable in 15-25 minutes.'
    }
  })()

  const experienceHint = (() => {
    switch (experience) {
      case 'beginner':    return 'They are JUST STARTING — favor fundamentals, gentle pace, low-jargon framing.'
      case 'some':        return 'They have some experience — assume basic familiarity but no expertise.'
      case 'experienced': return 'They are experienced — push them, suggest stretch tasks, no hand-holding.'
      default:            return ''
    }
  })()

  // ---- Trajectory: where the user is in their journey toward the goal ----
  const today = new Date()
  const todayIso = today.toISOString().slice(0, 10)
  let daysUntilTarget: number | null = null
  let phase = 'EARLY' // EARLY | MIDDLE | LATE | OVERDUE
  if (goal.target_date) {
    const target = new Date(goal.target_date)
    const diffMs = target.getTime() - today.getTime()
    daysUntilTarget = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
    const created = goal.created_at ? new Date(goal.created_at) : today
    const totalSpan = Math.max(1, Math.ceil((target.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)))
    const elapsed = Math.max(0, Math.ceil((today.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)))
    const ratio = elapsed / totalSpan
    if (daysUntilTarget < 0) phase = 'OVERDUE'
    else if (ratio < 0.33) phase = 'EARLY'
    else if (ratio < 0.66) phase = 'MIDDLE'
    else phase = 'LATE'
  }

  const completed = recentTasks.filter((t) => t.is_completed)
  const incomplete = recentTasks.filter((t) => !t.is_completed)

  // Compact, recent-first listing of completed work. The AI must NOT repeat these.
  const completedText = completed.length
    ? completed
        .slice(0, 12)
        .map((t) => `- [${t.due_date ?? '—'}${t.completed_at ? `, done ${t.completed_at.slice(0, 10)}` : ''}] ${t.title}`)
        .join('\n')
    : '(none yet — this is the user\'s first push on this goal)'

  // Incomplete tasks still standing — useful signal: these represent stuck or unaddressed steps.
  const incompleteText = incomplete.length
    ? incomplete
        .slice(0, 8)
        .map((t) => `- [${t.due_date ?? '—'}] ${t.title}`)
        .join('\n')
    : '(none)'

  const phaseHint = (() => {
    switch (phase) {
      case 'EARLY':   return 'EARLY PHASE — focus on foundations, exploration, learning the lay of the land. Reduce friction; build the habit.'
      case 'MIDDLE':  return 'MIDDLE PHASE — momentum should be visible. Push into the harder, more skill-specific work that compounds.'
      case 'LATE':    return 'LATE PHASE — final stretch. Tasks should be about polishing, removing the last blockers, executing on what was learned.'
      case 'OVERDUE': return 'PAST TARGET DATE — be honest. Tasks should either re-scope the goal or aggressively close it out.'
      default:        return ''
    }
  })()

  const horizonText = daysUntilTarget === null
    ? '(no target date set)'
    : daysUntilTarget < 0
      ? `${Math.abs(daysUntilTarget)} days past target`
      : `${daysUntilTarget} days remaining`

  return `You are FocusFlow's productivity coach. ${name} has a long-term goal. Your job is to look at where they ALREADY ARE in their journey and propose THREE small, concrete tasks for TODAY that move them to the NEXT logical step. ${taskSizeHint}

USER PROFILE
- Name: ${name}
- Main focus area: ${profile?.main_focus_area ?? 'unspecified'}
- Motivation level: ${motivation} (low = encouraging & easy; medium = steady; high = ambitious)
- Preferred focus time: ${focusTime}
- Energy peak: ${energyPeak ?? 'unspecified'}
- Daily time they can commit: ${commitment ?? 'unspecified'}
- Experience with this goal: ${experience ?? 'unspecified'}${experienceHint ? ` — ${experienceHint}` : ''}
- What gets in the way: ${blocker ?? 'unspecified'}
- What success looks like in 3 months: ${success ?? 'unspecified'}

GOAL
- Title: ${goal.title}
- Description: ${goal.description ?? 'not provided'}
- Category: ${focus}
- Current progress: ${goal.progress_percent}%
- Target date: ${goal.target_date ?? 'unspecified'} (${horizonText})
- Phase: ${phase} — ${phaseHint}

TASKS ALREADY COMPLETED (do NOT repeat these — build forward from them)
${completedText}

TASKS STILL OPEN (carryover signal — maybe they are too big or unclear)
${incompleteText}

TODAY: ${todayIso}

INSTRUCTIONS
- Produce exactly 3 tasks (or 2 if the goal is genuinely small).
- Each task must be SPECIFIC and ACTIONABLE today — start with a verb. Not a vague aspiration.
- Build a SEQUENCE, not a random pile. If the completed list shows the user already did "review job descriptions", today should be the next layer — e.g. "draft your senior-resume bullets using the keywords from those descriptions".
- DO NOT REPEAT a task that already appears in the completed list — even loosely. Move forward.
- If there are open carryover tasks, you may suggest a SMALLER variant of one of them to help unblock the user. Mark it as such in the reason.
- Calibrate task difficulty + framing to the user's experience, motivation, blocker, and the current phase.
- Anchor at least one task to the success-definition north star.
- For each task include a single-sentence "reason" that mentions how it builds on the user's progress so far.

Respond ONLY as JSON: { "tasks": [ { "title": "...", "reason": "..." }, ... ] }`
}
