-- =============================================================================
-- Migration: richer onboarding context on user_profiles
--
-- All five fields are goal-agnostic (work for career, study, health, etc.)
-- and optional — users can skip during onboarding and fill them in later
-- on the Profile page.
--
-- Stored as text (not enums) on purpose: the values are validated in app
-- code and we want flexibility to evolve the option lists without
-- database migrations.
-- =============================================================================

alter table public.user_profiles
  add column if not exists daily_time_commitment text,  -- '15min' | '30min' | '1h' | '2h+'
  add column if not exists energy_peak text,            -- 'morning' | 'afternoon' | 'evening' | 'variable'
  add column if not exists experience_level text,       -- 'beginner' | 'some' | 'experienced'
  add column if not exists biggest_blocker text,        -- free text
  add column if not exists success_definition text;     -- free text
