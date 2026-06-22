-- =============================================================================
-- Migration: allow users to INSERT their own ai_insights and recommendations
--
-- Background: the original policies.sql intentionally omitted INSERT policies
-- for these tables, expecting the Edge Functions to use the service_role key.
-- In practice the functions run under the calling user's JWT (so RLS applies)
-- and write `user_id = auth.uid()` rows. Adding an explicit own-row INSERT
-- policy makes the existing functions work cleanly without service-role.
-- =============================================================================

drop policy if exists "ai_insights: insert own" on public.ai_insights;
create policy "ai_insights: insert own"
  on public.ai_insights for insert
  with check (user_id = auth.uid());

drop policy if exists "recommendations: insert own" on public.recommendations;
create policy "recommendations: insert own"
  on public.recommendations for insert
  with check (user_id = auth.uid());
