import { supabase } from './supabase'

// ---------- Profile ----------

export async function fetchProfile(userId) {
  return supabase.from('user_profiles').select('*').eq('id', userId).single()
}

export async function updateProfile(userId, patch) {
  return supabase.from('user_profiles').update(patch).eq('id', userId).select().single()
}

// ---------- Goals ----------

export async function listGoals(userId) {
  return supabase
    .from('goals')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
}

export async function createGoal(userId, payload) {
  return supabase
    .from('goals')
    .insert({ user_id: userId, ...payload })
    .select()
    .single()
}

export async function updateGoal(goalId, patch) {
  return supabase.from('goals').update(patch).eq('id', goalId).select().single()
}

export async function deleteGoal(goalId) {
  return supabase.from('goals').delete().eq('id', goalId)
}

// ---------- Daily tasks ----------

export async function listTasksForDate(userId, date) {
  return supabase
    .from('daily_tasks')
    .select('*, goals(title, category)')
    .eq('user_id', userId)
    .eq('due_date', date)
    .order('created_at', { ascending: true })
}

export async function listRecentTasks(userId, limit = 30) {
  return supabase
    .from('daily_tasks')
    .select('*, goals(title, category)')
    .eq('user_id', userId)
    .order('due_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit)
}

export async function createTask(userId, payload) {
  return supabase
    .from('daily_tasks')
    .insert({ user_id: userId, ...payload })
    .select('*, goals(title, category)')
    .single()
}

export async function setTaskCompleted(taskId, completed) {
  return supabase
    .from('daily_tasks')
    .update({
      is_completed: completed,
      completed_at: completed ? new Date().toISOString() : null,
    })
    .eq('id', taskId)
    .select('*, goals(title, category)')
    .single()
}

export async function deleteTask(taskId) {
  return supabase.from('daily_tasks').delete().eq('id', taskId)
}

// ---------- AI ----------

export async function generateTasksForGoal(goalId) {
  // Calls the `generate-daily-tasks` Edge Function. Returns { data, error }.
  const { data, error } = await supabase.functions.invoke('generate-daily-tasks', {
    body: { goal_id: goalId },
  })
  if (error) return { data: null, error }

  // FunctionsHttpError surfaces non-2xx as `error`, but explicit body errors
  // still come back in `data`. Normalize.
  if (data && data.error) {
    return { data: null, error: { message: data.error } }
  }
  return { data, error: null }
}

// ---------- Subscription plans ----------

export async function listActivePlans() {
  return supabase
    .from('subscription_plans')
    .select('*')
    .eq('is_active', true)
    .order('price', { ascending: true })
}

export async function fetchCurrentSubscription(userId) {
  return supabase
    .from('user_subscriptions')
    .select('*, subscription_plans(*)')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle()
}

export async function chooseSubscriptionPlan(userId, planId) {
  // Cancel any other active subscription, then insert the new active one.
  await supabase
    .from('user_subscriptions')
    .update({ status: 'cancelled' })
    .eq('user_id', userId)
    .eq('status', 'active')

  return supabase
    .from('user_subscriptions')
    .insert({ user_id: userId, subscription_plan_id: planId, status: 'active' })
    .select('*, subscription_plans(*)')
    .single()
}

// ---------- Helpers ----------

export function todayISO() {
  // YYYY-MM-DD in local time
  const d = new Date()
  const tz = d.getTimezoneOffset() * 60_000
  return new Date(d.getTime() - tz).toISOString().slice(0, 10)
}
