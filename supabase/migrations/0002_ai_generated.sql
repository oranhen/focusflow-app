-- =============================================================================
-- Migration: mark AI-generated tasks
-- Run AFTER schema.sql + policies.sql on an existing project.
-- =============================================================================

alter table public.daily_tasks
  add column if not exists ai_generated boolean not null default false;

create index if not exists daily_tasks_ai_idx
  on public.daily_tasks(user_id, ai_generated);
