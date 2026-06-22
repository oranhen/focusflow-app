# FocusFlow — Supabase backend

This folder is the source of truth for the FocusFlow database, RLS policies, and seed data. Everything here is meant to be applied to a Supabase project (managed Postgres + Auth + Edge Functions).

## Files

| File | Purpose |
|---|---|
| [`schema.sql`](schema.sql) | Tables, enums, indexes, triggers, helper functions (`is_admin()`, auto-create profile on signup, `updated_at` maintenance). |
| [`policies.sql`](policies.sql) | Row-Level Security policies for every table. |
| [`seed.sql`](seed.sql) | Default catalog data — the Free / Pro / Premium subscription plans. Idempotent. |

## One-time setup

1. Create a new project at https://supabase.com (region: closest to you).
2. From the project dashboard, copy:
   - **Project URL** → goes into `VITE_SUPABASE_URL`
   - **anon public key** → goes into `VITE_SUPABASE_ANON_KEY`
   - (Optional for later) **service_role key** → used only by Edge Functions; never expose to the client.
3. Put those into the frontend's `.env.local` (see [`../.env.example`](../.env.example)).

## Applying the SQL

Open the Supabase **SQL Editor** and run the files in this order, each as a separate query:

1. `schema.sql`
2. `policies.sql`
3. `seed.sql`

Re-running is safe — every statement is guarded with `if not exists` / `on conflict` / `drop policy if exists`.

### Or via the Supabase CLI

```bash
# from the FocusFlow/ directory
supabase link --project-ref <your-project-ref>
supabase db execute --file supabase/schema.sql
supabase db execute --file supabase/policies.sql
supabase db execute --file supabase/seed.sql
```

## How auth integrates

- We do **not** maintain our own `users` table. The canonical user record lives in `auth.users`, managed by Supabase Auth.
- The `public.user_profiles` table is one-to-one with `auth.users` (same primary key). A row is created automatically on signup by the `handle_new_user()` trigger.
- The `role` column on `user_profiles` (`'user'` | `'admin'`) drives admin access via the SQL function `public.is_admin()`. To grant admin to yourself after signup, run:

  ```sql
  update public.user_profiles
  set role = 'admin'
  where id = '<your-auth-user-id>';
  ```

## RLS at a glance

| Table | Read | Write |
|---|---|---|
| `user_profiles` | own + admin | own + admin (delete: admin only) |
| `goals` | own + admin | own + admin |
| `daily_tasks` | own + admin | own + admin |
| `progress_entries` | own + admin | own + admin |
| `ai_insights` | own + admin | own + admin (server-side INSERT only — Edge Functions using the service role) |
| `recommendations` | own + admin | own + admin (server-side INSERT only) |
| `subscription_plans` | **public** | admin |
| `user_subscriptions` | own + admin | own (insert/update) + admin |
| `chat_messages` | own + admin | own |
| `forum_posts` | **public** | authenticated owner + admin |
| `forum_comments` | **public** | authenticated owner + admin |

The unique partial index `user_subscriptions_one_active_per_user` enforces *at most one* `status='active'` subscription per user.

## Edge Functions (later)

The Gemini API key must live only as a Supabase Edge Function secret:

```bash
supabase secrets set GEMINI_API_KEY=<your-key>
```

Functions to be added in a later step:
- `generate-daily-tasks` — given a goal, call Gemini and insert rows into `daily_tasks`.
- `generate-insight` — produce an `ai_insights` row from recent activity.
- `chat` — proxy a user message to Gemini, persist both turns to `chat_messages`.

## ERD

After running `schema.sql`, the diagram can be exported from **Supabase Dashboard → Database → Schema Visualizer**, or generated from this folder with `dbdiagram.io` / Mermaid for embedding in the main [`../README.md`](../README.md).
