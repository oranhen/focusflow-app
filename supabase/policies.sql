-- =============================================================================
-- FocusFlow — Row Level Security
-- Run after schema.sql.
--
-- Rules of thumb:
--   * Users may only read/write their OWN rows.
--   * Admins (user_profiles.role = 'admin') bypass ownership checks.
--   * subscription_plans and forum content are publicly READABLE.
--   * AI-generated rows (ai_insights, recommendations) are INSERTED by
--     trusted server code only — i.e. Edge Functions running with the
--     service_role key, which bypasses RLS. No client INSERT policy is granted.
-- =============================================================================

-- Enable RLS on every public table -------------------------------------------
alter table public.user_profiles       enable row level security;
alter table public.goals               enable row level security;
alter table public.daily_tasks         enable row level security;
alter table public.progress_entries    enable row level security;
alter table public.ai_insights         enable row level security;
alter table public.recommendations     enable row level security;
alter table public.subscription_plans  enable row level security;
alter table public.user_subscriptions  enable row level security;
alter table public.chat_messages       enable row level security;
alter table public.forum_posts         enable row level security;
alter table public.forum_comments      enable row level security;

-- =============================================================================
-- user_profiles
-- =============================================================================
drop policy if exists "user_profiles: read own or admin"   on public.user_profiles;
drop policy if exists "user_profiles: update own or admin" on public.user_profiles;
drop policy if exists "user_profiles: delete admin only"   on public.user_profiles;

create policy "user_profiles: read own or admin"
  on public.user_profiles for select
  using (id = auth.uid() or public.is_admin());

create policy "user_profiles: update own or admin"
  on public.user_profiles for update
  using (id = auth.uid() or public.is_admin())
  with check (id = auth.uid() or public.is_admin());

create policy "user_profiles: delete admin only"
  on public.user_profiles for delete
  using (public.is_admin());

-- =============================================================================
-- goals
-- =============================================================================
drop policy if exists "goals: read own or admin"   on public.goals;
drop policy if exists "goals: insert own"          on public.goals;
drop policy if exists "goals: update own or admin" on public.goals;
drop policy if exists "goals: delete own or admin" on public.goals;

create policy "goals: read own or admin"
  on public.goals for select
  using (user_id = auth.uid() or public.is_admin());

create policy "goals: insert own"
  on public.goals for insert
  with check (user_id = auth.uid());

create policy "goals: update own or admin"
  on public.goals for update
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create policy "goals: delete own or admin"
  on public.goals for delete
  using (user_id = auth.uid() or public.is_admin());

-- =============================================================================
-- daily_tasks
-- =============================================================================
drop policy if exists "daily_tasks: read own or admin"   on public.daily_tasks;
drop policy if exists "daily_tasks: insert own"          on public.daily_tasks;
drop policy if exists "daily_tasks: update own or admin" on public.daily_tasks;
drop policy if exists "daily_tasks: delete own or admin" on public.daily_tasks;

create policy "daily_tasks: read own or admin"
  on public.daily_tasks for select
  using (user_id = auth.uid() or public.is_admin());

create policy "daily_tasks: insert own"
  on public.daily_tasks for insert
  with check (user_id = auth.uid());

create policy "daily_tasks: update own or admin"
  on public.daily_tasks for update
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create policy "daily_tasks: delete own or admin"
  on public.daily_tasks for delete
  using (user_id = auth.uid() or public.is_admin());

-- =============================================================================
-- progress_entries
-- =============================================================================
drop policy if exists "progress_entries: read own or admin"   on public.progress_entries;
drop policy if exists "progress_entries: insert own"          on public.progress_entries;
drop policy if exists "progress_entries: update own or admin" on public.progress_entries;
drop policy if exists "progress_entries: delete own or admin" on public.progress_entries;

create policy "progress_entries: read own or admin"
  on public.progress_entries for select
  using (user_id = auth.uid() or public.is_admin());

create policy "progress_entries: insert own"
  on public.progress_entries for insert
  with check (user_id = auth.uid());

create policy "progress_entries: update own or admin"
  on public.progress_entries for update
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create policy "progress_entries: delete own or admin"
  on public.progress_entries for delete
  using (user_id = auth.uid() or public.is_admin());

-- =============================================================================
-- ai_insights  (read + insert-own + mark-as-read)
-- INSERTs are made by Edge Functions running under the caller's JWT.
-- =============================================================================
drop policy if exists "ai_insights: read own or admin"   on public.ai_insights;
drop policy if exists "ai_insights: insert own"          on public.ai_insights;
drop policy if exists "ai_insights: update own or admin" on public.ai_insights;
drop policy if exists "ai_insights: delete own or admin" on public.ai_insights;

create policy "ai_insights: read own or admin"
  on public.ai_insights for select
  using (user_id = auth.uid() or public.is_admin());

create policy "ai_insights: insert own"
  on public.ai_insights for insert
  with check (user_id = auth.uid());

create policy "ai_insights: update own or admin"
  on public.ai_insights for update
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create policy "ai_insights: delete own or admin"
  on public.ai_insights for delete
  using (user_id = auth.uid() or public.is_admin());

-- =============================================================================
-- recommendations  (same pattern as ai_insights)
-- =============================================================================
drop policy if exists "recommendations: read own or admin"   on public.recommendations;
drop policy if exists "recommendations: insert own"          on public.recommendations;
drop policy if exists "recommendations: update own or admin" on public.recommendations;
drop policy if exists "recommendations: delete own or admin" on public.recommendations;

create policy "recommendations: read own or admin"
  on public.recommendations for select
  using (user_id = auth.uid() or public.is_admin());

create policy "recommendations: insert own"
  on public.recommendations for insert
  with check (user_id = auth.uid());

create policy "recommendations: update own or admin"
  on public.recommendations for update
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create policy "recommendations: delete own or admin"
  on public.recommendations for delete
  using (user_id = auth.uid() or public.is_admin());

-- =============================================================================
-- subscription_plans  (public catalog; admin writes)
-- =============================================================================
drop policy if exists "subscription_plans: read all"   on public.subscription_plans;
drop policy if exists "subscription_plans: write admin" on public.subscription_plans;

create policy "subscription_plans: read all"
  on public.subscription_plans for select
  using (true);

create policy "subscription_plans: write admin"
  on public.subscription_plans for all
  using (public.is_admin())
  with check (public.is_admin());

-- =============================================================================
-- user_subscriptions
-- =============================================================================
drop policy if exists "user_subscriptions: read own or admin"   on public.user_subscriptions;
drop policy if exists "user_subscriptions: insert own"          on public.user_subscriptions;
drop policy if exists "user_subscriptions: update own or admin" on public.user_subscriptions;
drop policy if exists "user_subscriptions: delete admin"        on public.user_subscriptions;

create policy "user_subscriptions: read own or admin"
  on public.user_subscriptions for select
  using (user_id = auth.uid() or public.is_admin());

create policy "user_subscriptions: insert own"
  on public.user_subscriptions for insert
  with check (user_id = auth.uid());

create policy "user_subscriptions: update own or admin"
  on public.user_subscriptions for update
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create policy "user_subscriptions: delete admin"
  on public.user_subscriptions for delete
  using (public.is_admin());

-- =============================================================================
-- chat_messages
-- =============================================================================
drop policy if exists "chat_messages: read own or admin"   on public.chat_messages;
drop policy if exists "chat_messages: insert own"          on public.chat_messages;
drop policy if exists "chat_messages: delete own or admin" on public.chat_messages;

create policy "chat_messages: read own or admin"
  on public.chat_messages for select
  using (user_id = auth.uid() or public.is_admin());

create policy "chat_messages: insert own"
  on public.chat_messages for insert
  with check (user_id = auth.uid());

create policy "chat_messages: delete own or admin"
  on public.chat_messages for delete
  using (user_id = auth.uid() or public.is_admin());

-- =============================================================================
-- forum_posts  (public read; authenticated write own; admin override)
-- =============================================================================
drop policy if exists "forum_posts: read all"          on public.forum_posts;
drop policy if exists "forum_posts: insert authed"     on public.forum_posts;
drop policy if exists "forum_posts: update own/admin"  on public.forum_posts;
drop policy if exists "forum_posts: delete own/admin"  on public.forum_posts;

create policy "forum_posts: read all"
  on public.forum_posts for select
  using (true);

create policy "forum_posts: insert authed"
  on public.forum_posts for insert
  with check (user_id = auth.uid());

create policy "forum_posts: update own/admin"
  on public.forum_posts for update
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create policy "forum_posts: delete own/admin"
  on public.forum_posts for delete
  using (user_id = auth.uid() or public.is_admin());

-- =============================================================================
-- forum_comments  (public read; authenticated write own; admin override)
-- =============================================================================
drop policy if exists "forum_comments: read all"          on public.forum_comments;
drop policy if exists "forum_comments: insert authed"     on public.forum_comments;
drop policy if exists "forum_comments: update own/admin"  on public.forum_comments;
drop policy if exists "forum_comments: delete own/admin"  on public.forum_comments;

create policy "forum_comments: read all"
  on public.forum_comments for select
  using (true);

create policy "forum_comments: insert authed"
  on public.forum_comments for insert
  with check (user_id = auth.uid());

create policy "forum_comments: update own/admin"
  on public.forum_comments for update
  using (user_id = auth.uid() or public.is_admin())
  with check (user_id = auth.uid() or public.is_admin());

create policy "forum_comments: delete own/admin"
  on public.forum_comments for delete
  using (user_id = auth.uid() or public.is_admin());
