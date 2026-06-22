// =============================================================================
// Supabase Edge Function: admin-list-users
//
// Returns the merged list of user_profiles + their auth.users email
// (and last_sign_in_at) for the Admin Users page. Admin-only.
//
// Auth: bearer token from the client. Admin check is performed using the
// caller's JWT, then the actual read runs under the service-role key
// (which can see auth.users).
// =============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { jsonResponse, preflight } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  const pre = preflight(req)
  if (pre) return pre

  try {
    if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405)

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return jsonResponse({ error: 'Missing Authorization header' }, 401)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!serviceRoleKey) {
      return jsonResponse({ error: 'SUPABASE_SERVICE_ROLE_KEY is not configured' }, 500)
    }

    // Verify caller is admin via their JWT
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user: caller }, error: callerErr } = await userClient.auth.getUser()
    if (callerErr || !caller) return jsonResponse({ error: 'Unauthorized' }, 401)

    const { data: callerProfile, error: profileErr } = await userClient
      .from('user_profiles')
      .select('role')
      .eq('id', caller.id)
      .single()

    if (profileErr) return jsonResponse({ error: profileErr.message }, 500)
    if (callerProfile?.role !== 'admin') {
      return jsonResponse({ error: 'Forbidden — admin only' }, 403)
    }

    // Use service-role for the actual data fetch
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { data: authData, error: listErr } = await adminClient.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    })
    if (listErr) return jsonResponse({ error: listErr.message }, 500)

    const ids = authData.users.map((u) => u.id)
    const { data: profiles, error: profilesErr } = await adminClient
      .from('user_profiles')
      .select('*')
      .in('id', ids)

    if (profilesErr) return jsonResponse({ error: profilesErr.message }, 500)

    const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]))

    const merged = authData.users.map((u) => {
      const p = profileMap.get(u.id) ?? null
      return {
        id: u.id,
        email: u.email ?? null,
        last_sign_in_at: u.last_sign_in_at ?? null,
        // Fields from user_profiles (may be null if profile row missing)
        full_name: p?.full_name ?? null,
        role: p?.role ?? 'user',
        main_focus_area: p?.main_focus_area ?? null,
        motivation_level: p?.motivation_level ?? null,
        preferred_task_time: p?.preferred_task_time ?? null,
        onboarding_completed: p?.onboarding_completed ?? false,
        created_at: p?.created_at ?? u.created_at,
        updated_at: p?.updated_at ?? null,
      }
    }).sort((a, b) => (b.created_at ?? '').localeCompare(a.created_at ?? ''))

    return jsonResponse({ users: merged })
  } catch (e) {
    return jsonResponse({ error: String(e) }, 500)
  }
})
