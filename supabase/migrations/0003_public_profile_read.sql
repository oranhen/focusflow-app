-- =============================================================================
-- Migration: allow public read of user_profiles
-- Run AFTER schema.sql + policies.sql + 0002.
--
-- Why: the Forum needs to display each post/comment author's display name and
-- role badge, and the Admin pages need to list all users. The previous policy
-- only allowed reading your own row + admin. We loosen this to public read.
-- All other policies (insert/update/delete) remain restricted as before.
-- =============================================================================

drop policy if exists "user_profiles: read own or admin" on public.user_profiles;

create policy "user_profiles: read all"
  on public.user_profiles for select
  using (true);
