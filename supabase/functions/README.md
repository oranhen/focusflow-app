# FocusFlow — Edge Functions

These are Deno-based serverless functions that run on Supabase. They're how
FocusFlow calls external APIs (currently Google Gemini) without exposing
secrets to the browser.

## Functions

| Name | What it does |
|---|---|
| `generate-daily-tasks` | Given a goal, calls Gemini and inserts 3 small actionable tasks for today into `daily_tasks`. Also writes a single matching row into `recommendations`. |
| `chat` | Receives a chat message, calls Gemini with the user's profile + active goals + recent chat history as context, persists both turns to `chat_messages`. Powers the Chatbot page. |
| `generate-insight` | Reads the user's last 14 days of task data + goals, asks Gemini to surface ONE specific insight, persists into `ai_insights`. Triggered by the "Get a fresh insight" button on the Dashboard. |

## One-time setup (~15 minutes)

### 1. Get a Gemini API key (free)

1. Open https://aistudio.google.com/apikey
2. Sign in with the same Google account you used for everything else.
3. Click **Create API key** → choose any project (or create one). Copy the key.

### 2. Install the Supabase CLI

```bash
brew install supabase/tap/supabase
```

> If you're on a different OS, see the [official guide](https://supabase.com/docs/guides/cli).

### 3. Link this folder to your Supabase project

From the `FocusFlow/` directory:

```bash
supabase login
supabase link --project-ref znvgaavlddnmubkmuhqm
```

The project ref comes from your Supabase URL (the subdomain). It's also visible
in the Supabase dashboard URL bar.

### 4. Store the Gemini key as a function secret

```bash
supabase secrets set GEMINI_API_KEY=YOUR-KEY-HERE
```

The key now lives only on Supabase's side. The browser never sees it.

### 5. Apply the AI migration (one-time, in the SQL Editor)

Open the Supabase Dashboard → SQL Editor → paste the contents of
[`../migrations/0002_ai_generated.sql`](../migrations/0002_ai_generated.sql)
and run.

### 6. Deploy the functions

```bash
supabase functions deploy generate-daily-tasks
supabase functions deploy chat
supabase functions deploy generate-insight
```

That's it. The "✨ Generate today's tasks" button, the Chatbot, and the "Get a fresh insight" card on the Dashboard will all work.

## Day-to-day

Update the function code → redeploy:

```bash
supabase functions deploy generate-daily-tasks
```

Stream logs while testing:

```bash
supabase functions logs generate-daily-tasks --follow
```

Test locally before deploying (optional):

```bash
supabase functions serve generate-daily-tasks --env-file ./supabase/.env.local
# then point the frontend at http://localhost:54321/functions/v1/
```

## How it works

```
Browser
   │  supabase.functions.invoke('generate-daily-tasks', { body: { goal_id } })
   ▼
Supabase Edge Function (Deno, hosted by Supabase)
   │  reads GEMINI_API_KEY from secrets (never sent to client)
   ▼
Google Gemini API ─► JSON tasks
   │
   ▼
Insert into public.daily_tasks (under the user's JWT — RLS still applies)
   │
   ▼
Browser ◄── tasks (with title + reason + ai_generated=true)
```

## Security

- The function reads the calling user from the bearer token, so it can only act
  on their own data.
- All inserts go through the user-scoped client, so RLS still enforces
  `user_id = auth.uid()`.
- The Gemini key is loaded from `Deno.env`, set via `supabase secrets set`. It
  is **not** committed to the repo and **not** shipped to the browser.
