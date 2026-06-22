// =============================================================================
// Supabase Edge Function: admin-delete-user
//
// Deletes a user from auth.users (which cascades via on-delete-cascade to
// user_profiles + all owned rows). Only callable by admins. Self-deletion
// is rejected to avoid locking yourself out of the dashboard.
//
// Auth: bearer token from the client. Admin check is performed using the
// caller's JWT, then the actual deletion runs under the service-role key.
//
// Secrets required:
//   SUPABASE_SERVICE_ROLE_KEY — provided automatically by Supabase to Edge
//   Functions. NOT something you set manually.
// =============================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { jsonResponse, preflight } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  const pre = preflight(req)
  if (pre) return pre

  try {
    if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405)

    const { user_id } = await req.json().catch(() => ({}))
    if (!user_id || typeof user_id !== 'string') {
      return jsonResponse({ error: 'user_id is required' }, 400)
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return jsonResponse({ error: 'Missing Authorization header' }, 401)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    if (!serviceRoleKey) {
      return jsonResponse({ error: 'SUPABASE_SERVICE_ROLE_KEY is not configured' }, 500)
    }

    // Verify the caller via their JWT and confirm they are an admin.
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

    if (user_id === caller.id) {
      return jsonResponse(
        { error: 'You cannot delete your own account from here. Demote yourself first or ask another admin.' },
        400,
      )
    }

    // Now use service-role to actually delete the auth user. Cascades to
    // user_profiles + goals + daily_tasks + everything else via FK ON DELETE CASCADE.
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })

    const { error: delErr } = await adminClient.auth.admin.deleteUser(user_id)
    if (delErr) return jsonResponse({ error: delErr.message }, 500)

    return jsonResponse({ ok: true })
  } catch (e) {
    return jsonResponse({ error: String(e) }, 500)
  }
})
