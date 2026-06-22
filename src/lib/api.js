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
  const { data: task, error } = await supabase
    .from('daily_tasks')
    .update({
      is_completed: completed,
      completed_at: completed ? new Date().toISOString() : null,
    })
    .eq('id', taskId)
    .select('*, goals(title, category)')
    .single()
  if (error) return { data: null, error }

  // Side effect: log a progress_entries row when a task is marked complete.
  // Failure here shouldn't block the task toggle, so we don't surface its error.
  if (completed && task) {
    await supabase.from('progress_entries').insert({
      user_id: task.user_id,
      goal_id: task.goal_id,
      metric_value: 1,
      note: `Completed: ${task.title}`,
    })
  }

  return { data: task, error: null }
}

export async function deleteTask(taskId) {
  return supabase.from('daily_tasks').delete().eq('id', taskId)
}

// ---------- AI Insights & Recommendations ----------

export async function listInsights(userId, { limit = 5, unreadOnly = false } = {}) {
  let q = supabase
    .from('ai_insights')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (unreadOnly) q = q.eq('is_read', false)
  return q
}

export async function markInsightRead(id) {
  return supabase.from('ai_insights').update({ is_read: true }).eq('id', id).select().single()
}

export async function generateInsight() {
  const { data, error } = await supabase.functions.invoke('generate-insight', { body: {} })
  if (error) return { data: null, error }
  if (data && data.error) return { data: null, error: { message: data.error } }
  return { data, error: null }
}

export async function listRecommendations(userId, { limit = 5 } = {}) {
  return supabase
    .from('recommendations')
    .select('*, goals(title, category)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)
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

// ---------- Forum ----------

async function attachAuthors(rows) {
  if (!rows?.length) return rows || []
  const ids = [...new Set(rows.map((r) => r.user_id).filter(Boolean))]
  if (!ids.length) return rows
  const { data: profiles } = await supabase
    .from('user_profiles')
    .select('id, full_name, role')
    .in('id', ids)
  const map = new Map((profiles || []).map((p) => [p.id, p]))
  return rows.map((r) => ({ ...r, author: map.get(r.user_id) || null }))
}

export async function listForumPosts({ limit = 50 } = {}) {
  const { data, error } = await supabase
    .from('forum_posts')
    .select('*, comments:forum_comments(count)')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) return { data: null, error }
  return { data: await attachAuthors(data), error: null }
}

export async function fetchForumPost(postId) {
  const { data, error } = await supabase
    .from('forum_posts')
    .select('*')
    .eq('id', postId)
    .single()
  if (error) return { data: null, error }
  const [withAuthor] = await attachAuthors([data])
  return { data: withAuthor, error: null }
}

export async function listForumComments(postId) {
  const { data, error } = await supabase
    .from('forum_comments')
    .select('*')
    .eq('forum_post_id', postId)
    .order('created_at', { ascending: true })
  if (error) return { data: null, error }
  return { data: await attachAuthors(data), error: null }
}

export async function createForumPost(userId, payload) {
  const { data, error } = await supabase
    .from('forum_posts')
    .insert({ user_id: userId, ...payload })
    .select()
    .single()
  if (error) return { data: null, error }
  const [withAuthor] = await attachAuthors([data])
  return { data: withAuthor, error: null }
}

export async function deleteForumPost(postId) {
  return supabase.from('forum_posts').delete().eq('id', postId)
}

export async function createForumComment(userId, postId, content, parentCommentId = null) {
  const { data, error } = await supabase
    .from('forum_comments')
    .insert({
      user_id: userId,
      forum_post_id: postId,
      content,
      parent_comment_id: parentCommentId,
    })
    .select()
    .single()
  if (error) return { data: null, error }
  const [withAuthor] = await attachAuthors([data])
  return { data: withAuthor, error: null }
}

export async function deleteForumComment(commentId) {
  return supabase.from('forum_comments').delete().eq('id', commentId)
}

// ---------- Chat ----------

export async function listChatMessages(userId, limit = 50) {
  return supabase
    .from('chat_messages')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })
    .limit(limit)
}

export async function appendChatMessage(userId, content, isFromUser) {
  return supabase
    .from('chat_messages')
    .insert({ user_id: userId, content, is_from_user: isFromUser })
    .select()
    .single()
}

export async function clearChatHistory(userId) {
  return supabase.from('chat_messages').delete().eq('user_id', userId)
}

export async function chatWithAI(message) {
  // Calls the `chat` Edge Function. Returns the AI reply (also persisted by the function).
  const { data, error } = await supabase.functions.invoke('chat', {
    body: { message },
  })
  if (error) return { data: null, error }
  if (data && data.error) {
    return { data: null, error: { message: data.error } }
  }
  return { data, error: null }
}

// ---------- Admin ----------

export async function listAllUsers() {
  // Routes through the `admin-list-users` Edge Function so we can join in the
  // email + last_sign_in_at from auth.users (which the browser can't read
  // directly). The function verifies the caller is admin.
  const { data, error } = await supabase.functions.invoke('admin-list-users', { body: {} })
  if (error) return { data: null, error }
  if (data?.error) return { data: null, error: { message: data.error } }
  return { data: data?.users ?? [], error: null }
}

export async function setUserRole(userId, role) {
  return supabase
    .from('user_profiles')
    .update({ role })
    .eq('id', userId)
    .select()
    .single()
}

export async function deleteUserAccount(userId) {
  const { data, error } = await supabase.functions.invoke('admin-delete-user', {
    body: { user_id: userId },
  })
  if (error) return { error }
  if (data?.error) return { error: { message: data.error } }
  return { data }
}

export async function fetchAdminStats() {
  // Run independent counts in parallel and combine. Uses head:true + count for efficiency.
  const [users, goals, activeGoals, tasks, completedTasks, posts] = await Promise.all([
    supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
    supabase.from('goals').select('*', { count: 'exact', head: true }),
    supabase.from('goals').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('daily_tasks').select('*', { count: 'exact', head: true }),
    supabase.from('daily_tasks').select('*', { count: 'exact', head: true }).eq('is_completed', true),
    supabase.from('forum_posts').select('*', { count: 'exact', head: true }),
  ])

  // Tasks completed per day for last 14 days
  const since = new Date()
  since.setDate(since.getDate() - 13)
  const sinceISO = since.toISOString().slice(0, 10)

  const { data: recent } = await supabase
    .from('daily_tasks')
    .select('due_date,is_completed,ai_generated')
    .gte('due_date', sinceISO)

  return {
    counts: {
      users: users.count ?? 0,
      goals: goals.count ?? 0,
      activeGoals: activeGoals.count ?? 0,
      tasks: tasks.count ?? 0,
      completedTasks: completedTasks.count ?? 0,
      posts: posts.count ?? 0,
    },
    recent: recent || [],
  }
}

// ---------- Helpers ----------

export function todayISO() {
  // YYYY-MM-DD in local time
  const d = new Date()
  const tz = d.getTimezoneOffset() * 60_000
  return new Date(d.getTime() - tz).toISOString().slice(0, 10)
}
