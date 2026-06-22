-- =============================================================================
-- FocusFlow — Database schema
-- Run this in the Supabase SQL editor on a fresh project (or via the CLI).
-- Order: schema.sql  →  policies.sql  →  seed.sql
-- =============================================================================

-- Required extensions ---------------------------------------------------------
create extension if not exists "pgcrypto";  -- gen_random_uuid()

-- =============================================================================
-- ENUM types
-- =============================================================================
do $$ begin
  create type user_role            as enum ('user', 'admin');
  create type focus_area           as enum ('career', 'study', 'health', 'personal', 'other');
  create type motivation_level     as enum ('low', 'medium', 'high');
  create type goal_status          as enum ('active', 'completed', 'paused');
  create type insight_type         as enum ('progress', 'habit', 'warning', 'success');
  create type recommendation_priority as enum ('low', 'medium', 'high');
  create type subscription_status  as enum ('active', 'cancelled', 'expired');
exception when duplicate_object then null;
end $$;

-- =============================================================================
-- Helper: keep updated_at fresh
-- =============================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- =============================================================================
-- user_profiles
-- One-to-one with auth.users. Created automatically on signup via trigger.
--
-- NOTE: this table is created before is_admin() because is_admin() is a
-- `language sql` function whose body is validated at creation time, and it
-- references public.user_profiles.
-- =============================================================================
create table if not exists public.user_profiles (
  id                    uuid primary key references auth.users(id) on delete cascade,
  full_name             text,
  role                  user_role not null default 'user',
  main_focus_area       focus_area,
  motivation_level      motivation_level,
  preferred_task_time   time,
  onboarding_completed  boolean not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

drop trigger if exists user_profiles_set_updated_at on public.user_profiles;
create trigger user_profiles_set_updated_at
  before update on public.user_profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile row when a new auth user is created
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================================
-- Helper: is_admin()  (SECURITY DEFINER to avoid RLS recursion)
-- Defined after user_profiles because a `language sql` function validates its
-- body at creation time.
-- =============================================================================
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

-- =============================================================================
-- goals
-- =============================================================================
create table if not exists public.goals (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  title             text not null,
  description       text,
  category          focus_area,
  target_date       date,
  status            goal_status not null default 'active',
  progress_percent  smallint not null default 0 check (progress_percent between 0 and 100),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists goals_user_id_idx       on public.goals(user_id);
create index if not exists goals_user_status_idx   on public.goals(user_id, status);

drop trigger if exists goals_set_updated_at on public.goals;
create trigger goals_set_updated_at
  before update on public.goals
  for each row execute function public.set_updated_at();

-- =============================================================================
-- daily_tasks
-- =============================================================================
create table if not exists public.daily_tasks (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  goal_id       uuid references public.goals(id) on delete cascade,
  title         text not null,
  description   text,
  due_date      date not null default current_date,
  is_completed  boolean not null default false,
  completed_at  timestamptz,
  created_at    timestamptz not null default now()
);

create index if not exists daily_tasks_user_due_idx     on public.daily_tasks(user_id, due_date);
create index if not exists daily_tasks_goal_idx         on public.daily_tasks(goal_id);

-- =============================================================================
-- progress_entries
-- =============================================================================
create table if not exists public.progress_entries (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  goal_id       uuid references public.goals(id) on delete cascade,
  metric_value  numeric,
  note          text,
  created_at    timestamptz not null default now()
);

create index if not exists progress_entries_user_idx       on public.progress_entries(user_id, created_at desc);
create index if not exists progress_entries_goal_idx       on public.progress_entries(goal_id);

-- =============================================================================
-- ai_insights
-- =============================================================================
create table if not exists public.ai_insights (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  title         text not null,
  content       text not null,
  insight_type  insight_type not null default 'progress',
  is_read       boolean not null default false,
  created_at    timestamptz not null default now()
);

create index if not exists ai_insights_user_idx on public.ai_insights(user_id, created_at desc);

-- =============================================================================
-- recommendations
-- =============================================================================
create table if not exists public.recommendations (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  goal_id       uuid references public.goals(id) on delete set null,
  title         text not null,
  description   text,
  priority      recommendation_priority not null default 'medium',
  is_read       boolean not null default false,
  created_at    timestamptz not null default now()
);

create index if not exists recommendations_user_idx on public.recommendations(user_id, created_at desc);

-- =============================================================================
-- subscription_plans  (catalog, managed by admin)
-- =============================================================================
create table if not exists public.subscription_plans (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  price       numeric(10,2) not null default 0,
  description text,
  features    text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now()
);

-- =============================================================================
-- user_subscriptions
-- =============================================================================
create table if not exists public.user_subscriptions (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references auth.users(id) on delete cascade,
  subscription_plan_id  uuid not null references public.subscription_plans(id) on delete restrict,
  status                subscription_status not null default 'active',
  created_at            timestamptz not null default now()
);

create index if not exists user_subscriptions_user_idx on public.user_subscriptions(user_id);

-- Only one active subscription per user at a time
create unique index if not exists user_subscriptions_one_active_per_user
  on public.user_subscriptions(user_id)
  where status = 'active';

-- =============================================================================
-- chat_messages
-- =============================================================================
create table if not exists public.chat_messages (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  content       text not null,
  is_from_user  boolean not null,
  created_at    timestamptz not null default now()
);

create index if not exists chat_messages_user_time_idx on public.chat_messages(user_id, created_at);

-- =============================================================================
-- forum_posts
-- =============================================================================
create table if not exists public.forum_posts (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  title       text not null,
  content     text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists forum_posts_created_idx on public.forum_posts(created_at desc);

drop trigger if exists forum_posts_set_updated_at on public.forum_posts;
create trigger forum_posts_set_updated_at
  before update on public.forum_posts
  for each row execute function public.set_updated_at();

-- =============================================================================
-- forum_comments
-- =============================================================================
create table if not exists public.forum_comments (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  forum_post_id   uuid not null references public.forum_posts(id) on delete cascade,
  content         text not null,
  created_at      timestamptz not null default now()
);

create index if not exists forum_comments_post_idx on public.forum_comments(forum_post_id, created_at);
