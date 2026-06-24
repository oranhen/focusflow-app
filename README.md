# FocusFlow

> **FocusFlow turns your big goal into today's three actions — powered by AI.**

**Live demo:** https://focusflow-app-zeta.vercel.app/

**Repository:** https://github.com/oranhen/focusflow-app

**Author:** Oran Chen

---

## Overview

FocusFlow takes a user's high-level goals (career growth, studies, health, etc.), learns about them through a short onboarding questionnaire, and produces a small set of concrete, focused tasks for each day. The product's promise is *execution*, not just planning: every goal is translated into something the user can do today, in a 15-minute focus block.

## The problem we solve

People struggle to stay focused on their goals because of information overload and a lack of practical, day-to-day guidance. Productivity tools today either help you *plan* (Todoist, Notion) or *coach* you in the abstract (Rocky.ai, generic AI chatbots) — almost none translate a long-term ambition into the specific next action for *today*.

## Target audience

| Persona | Profile | Need |
|---|---|---|
| **Primary — Oran, 37** | Mid-career hi-tech professional, financially comfortable, technically fluent. Wants to grow within cybersecurity and broaden into new areas. | Doesn't know how to invest his most valuable resource — time — to actually reach the senior roles he's aiming at. |
| **Secondary — Moran, 28** | University student, mid technical proficiency. Struggling with procrastination and study overload. | Wants small, doable actions that don't make her feel overwhelmed; current notebook+journal habit is inconsistent. |

Both personas share the same root pain: *they know what they want, but not what to do today about it.*

## Competitors & differentiation

| Competitor | Type | Pricing | Strengths | Gaps |
|---|---|---|---|---|
| **Rocky.ai** | AI coaching | Freemium | Asks reflective questions, light personalization | Generic guidance; no link to daily action |
| **AI Coach** apps | Personal AI coach | Subscription | Personalized advice | Theoretical — doesn't drive execution |
| **Todoist** | Task management | Freemium | Excellent task organization | No context about the user's goals; no guidance on *what* to add |
| Manual fallback (Notes app, journal, spreadsheets) | DIY | Free | Total flexibility | No accountability, no AI insight, no continuity |

**Our differentiation:** FocusFlow is the only one of these that translates *long-term goals* into *today's specific micro-tasks*, using AI to personalize based on the user's profile, recent progress, and preferred work style. We're not a planner and not a generic coach — we're the bridge between intent and execution.

## The core loop — what makes FocusFlow different

```
[Big goal]
   ↓     "I want to land a senior cybersecurity role"
[AI breaks it down]
   ↓     personalized by your focus area + motivation level + current progress
[Today's 3 concrete actions]
   ↓     each one doable in 15-25 minutes, with a one-line reason
[You execute → tick boxes]
   ↓
[Streak, progress, AI insights]
```

The AI step is the differentiator. Other apps either help you *plan* (Todoist, Notion) or *coach* you abstractly (Rocky.ai, generic chatbots). FocusFlow is the bridge between the long-term goal and what to do today, served by a one-click button.

## Full user flow

1. **Sign up** — email + password via Supabase Auth.
2. **Onboard** — a full-screen 9-step wizard that asks for goal, focus area, experience level, motivation, daily time commitment, energy peak, preferred focus time, biggest blocker, and what success looks like in 3 months. All but the goal are optional — Skip is on every screen. Answers feed the AI's prompt context.
3. **Define a goal** — add more goals from `/goals` (title, description, target date, category, status, progress slider).
4. **✨ Generate today's tasks** — one click on a goal calls Google Gemini via a Supabase Edge Function. The function sees: your full profile + the goal + the **last 30 tasks you've done on this goal** + how many days remain until your target. The AI builds the *next logical step* — not a generic suggestion. Tasks land with an ✨ AI badge and a one-line reason.
5. **Execute & track** — tick boxes as you finish; the dashboard updates today's %, 7-day completion %, perfect-day streak, and per-goal progress.
6. **Get fresh insights** — Dashboard has a "Get a fresh insight" button. A second Edge Function reads your last 14 days of task data and surfaces ONE specific pattern (e.g. "You're stronger on weekdays — protect Monday morning").
7. **Chat with your coach** — `/chatbot` is a real conversation with the AI. It sees your active goals, profile, and recent chat history — and stays scoped to your real situation.
8. **Reflect & adjust** — Progress page shows the 14-day bar chart; Profile lets you adjust the onboarding signals any time.

## Tech stack

- **Frontend:** React 18, Vite 5, React Router v6, vanilla CSS with design tokens (`src/styles/globals.css`)
- **State / Auth context:** React Context (`AuthContext`, `ToastProvider`, `ConfirmProvider`) + `ErrorBoundary`
- **Backend / Database:** Supabase (PostgreSQL + Row-Level Security)
- **Authentication:** Supabase Auth (email + password, password recovery flow)
- **AI:** Google Gemini (`gemini-2.5-flash`) called from Supabase Edge Functions — API keys never reach the client
- **Hosting:** Vercel (frontend) + Supabase managed services (backend)

## External services & integrations

The product depends on the following external services. Every secret lives on the server side — the browser only ever sees the **Supabase anon public key** (designed to be public).

| # | Service | Type | What it does for FocusFlow | Secret location |
|---|---|---|---|---|
| 1 | **Supabase Auth** | Authentication | Email/password signup, login, session refresh, password-recovery email + reset link, server-side admin user management | Service-role key only in Edge Function env (never shipped) |
| 2 | **Supabase PostgreSQL** | Database | All persistent data — 11 tables (users, profiles, goals, daily_tasks, progress_entries, ai_insights, recommendations, subscription_plans, user_subscriptions, chat_messages, forum_posts, forum_comments) | n/a — accessed via Supabase client with RLS |
| 3 | **Supabase Edge Functions** | Serverless compute (Deno) | Five functions — see table below. Each verifies the caller's JWT before doing work. | n/a |
| 4 | **Google Gemini API** (`gemini-2.5-flash`) | LLM | Generates daily tasks (plan-aware, history-aware), generates insights, powers chat | `GEMINI_API_KEY` stored as a Supabase Edge Function secret via `supabase secrets set` |
| 5 | **Vercel** | Hosting / CDN | Builds + serves the production Vite bundle; auto-deploys from GitHub `main` | Vercel-managed |
| 6 | **GitHub** | Source control + Vercel trigger | Hosts the public repo; pushes trigger Vercel rebuilds | Personal access token used only locally to push |

### Edge Functions (the AI integrations in detail)

| Function | Triggered by | What it does |
|---|---|---|
| `generate-daily-tasks` | Dashboard / Goals "✨ Generate today's tasks" button | Loads the goal + the user's profile + last 30 tasks on this goal + computes phase (early / middle / late / overdue) based on target date. Asks Gemini for THREE small, sequential tasks that build forward and don't repeat completed work. Also writes a row into `recommendations`. |
| `chat` | `/chatbot` page send button | Loads the user's profile + active goals + last 10 chat messages. Asks Gemini for a short coaching reply. Persists both turns into `chat_messages`. |
| `generate-insight` | Dashboard "Get a fresh insight" button | Loads last 14 days of `daily_tasks` + the user's profile. Asks Gemini for ONE specific insight (progress / habit / warning / success). Persists into `ai_insights`. |
| `admin-list-users` | `/admin/users` page load | Admin only — verifies caller is admin, then uses service-role to merge `auth.users` (for email + last_sign_in) with `user_profiles`. |
| `admin-delete-user` | `/admin/users` Delete button | Admin only — verifies caller is admin, blocks self-deletion, then uses Supabase Auth Admin API to fully delete the user (cascades through every FK). |

All five functions:
- Run on Deno via Supabase's runtime
- Verify the caller's JWT before doing work
- Use `fetchWithRetry` (exponential backoff on 429 / 503 / 504)
- Surface user-friendly errors ("The AI is busy right now") instead of raw API messages

> The Gemini key is set with `supabase secrets set GEMINI_API_KEY=...` and is **never** included in the frontend build or in this repo.

## Data model (ERD)

The schema is defined in [`supabase/schema.sql`](supabase/schema.sql) and protected by RLS in [`supabase/policies.sql`](supabase/policies.sql). The canonical user record is `auth.users` (managed by Supabase Auth); all application tables key off it.

```mermaid
erDiagram
    auth_users ||--|| user_profiles : "1:1 (id)"
    auth_users ||--o{ goals : owns
    auth_users ||--o{ daily_tasks : owns
    auth_users ||--o{ progress_entries : owns
    auth_users ||--o{ ai_insights : receives
    auth_users ||--o{ recommendations : receives
    auth_users ||--o{ chat_messages : sends
    auth_users ||--o{ forum_posts : authors
    auth_users ||--o{ forum_comments : authors
    auth_users ||--o{ user_subscriptions : has

    goals ||--o{ daily_tasks : "drives"
    goals ||--o{ progress_entries : "tracks"
    goals ||--o{ recommendations : "for"

    subscription_plans ||--o{ user_subscriptions : "selected by"

    forum_posts ||--o{ forum_comments : "has"
    forum_comments ||--o{ forum_comments : "threaded reply"

    auth_users {
        uuid id PK
        text email
    }

    user_profiles {
        uuid id PK_FK
        text full_name
        enum role
        enum main_focus_area
        enum motivation_level
        time preferred_task_time
        bool onboarding_completed
        text daily_time_commitment
        text energy_peak
        text experience_level
        text biggest_blocker
        text success_definition
    }

    goals {
        uuid id PK
        uuid user_id FK
        text title
        text description
        enum category
        date target_date
        enum status
        int progress_percent
    }

    daily_tasks {
        uuid id PK
        uuid user_id FK
        uuid goal_id FK
        text title
        text description
        date due_date
        bool is_completed
        timestamptz completed_at
        bool ai_generated
    }

    progress_entries {
        uuid id PK
        uuid user_id FK
        uuid goal_id FK
        numeric metric_value
        text note
    }

    ai_insights {
        uuid id PK
        uuid user_id FK
        text title
        text content
        enum insight_type
        bool is_read
    }

    recommendations {
        uuid id PK
        uuid user_id FK
        uuid goal_id FK
        text title
        text description
        enum priority
        bool is_read
    }

    subscription_plans {
        uuid id PK
        text name UK
        numeric price
        text description
        text features
        bool is_active
    }

    user_subscriptions {
        uuid id PK
        uuid user_id FK
        uuid subscription_plan_id FK
        enum status
    }

    chat_messages {
        uuid id PK
        uuid user_id FK
        text content
        bool is_from_user
    }

    forum_posts {
        uuid id PK
        uuid user_id FK
        text title
        text content
    }

    forum_comments {
        uuid id PK
        uuid user_id FK
        uuid forum_post_id FK
        uuid parent_comment_id FK
        text content
    }
```

> A native Schema-Visualizer screenshot from the Supabase dashboard will also be added here once the project is provisioned.

## Project structure

```
FocusFlow/
├── public/
│   └── favicon.svg
├── docs/
│   └── screenshots/                 # Live-app screenshots + ERD export
├── src/
│   ├── components/                  # Navbar, Sidebar, Footer, Modal, Toast/Confirm providers, ErrorBoundary, EmptyState, Spinner, cards
│   ├── contexts/
│   │   └── AuthContext.jsx          # Supabase session + profile state
│   ├── hooks/
│   │   └── useDocumentTitle.js
│   ├── lib/
│   │   ├── supabase.js              # Supabase client
│   │   └── api.js                   # Typed helpers for every table + Edge Function
│   ├── pages/                       # Landing, Register, Login, ForgotPassword, ResetPassword, Onboarding, Dashboard, Goals, Progress, Profile, Settings, Chatbot, Forum, Pricing, AdminUsers, AdminStatistics, NotFound
│   ├── styles/
│   │   └── globals.css              # Design tokens + every component style
│   ├── App.jsx                      # Router with public / authed / admin route groups
│   └── main.jsx                     # Entry — wraps with ErrorBoundary + providers
├── supabase/
│   ├── schema.sql                   # 11 tables, 7 enums, indexes, triggers, helper functions
│   ├── policies.sql                 # RLS for every table
│   ├── seed.sql                     # Free / Pro / Premium subscription plans
│   ├── migrations/                  # Incremental schema migrations (0002-0006)
│   ├── functions/                   # Edge Functions (Deno) — see Integrations section
│   │   ├── generate-daily-tasks/
│   │   ├── chat/
│   │   ├── generate-insight/
│   │   ├── admin-list-users/
│   │   ├── admin-delete-user/
│   │   └── _shared/                 # CORS helpers + fetchWithRetry
│   └── README.md                    # How to apply schema + deploy functions
├── DESIGN.md                        # Design-system reference
├── index.html
├── package.json
└── vite.config.js
```

## Running locally

```bash
npm install
npm run dev      # http://localhost:5177
npm run build    # production build
npm run preview  # preview the build locally
```

### Environment variables

A `.env.local` file is required for the frontend to talk to Supabase:

```
VITE_SUPABASE_URL=<your-project-url>
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

> The Gemini API key lives **only** as a Supabase Edge Function secret — it is not used by the client and must not be added to `.env.local`.

## How AI was used to build FocusFlow

This project itself was developed with the help of AI tools — both inside the product (Gemini-powered task generation, insights, and chat) and as part of the development workflow ("vibe coding"). Concretely:

- **Ideation & research:** GPT/Claude were used as sparring partners while drafting personas, competitor analysis, and the MoSCoW prioritization in the early worksheets.
- **Design:** the design system tokens and component layouts were iterated visually with Stitch and then formalized in [`DESIGN.md`](DESIGN.md) and [`src/styles/globals.css`](src/styles/globals.css).
- **Frontend scaffolding:** the React component tree, routing, and CSS layout were generated and refined through AI-assisted pair-programming.
- **Backend & schema:** the Supabase schema, RLS policies, and Edge Functions were planned and reviewed with AI assistance to make sure secrets never leak to the client.
- **Documentation:** this README, the data-design worksheet, and the system-design diagram were drafted and tightened with AI in the loop.

In every case the AI output was reviewed and edited manually — it accelerated the work, but the design and product decisions are the author's.

## Demo & test data

You can register a fresh account from the landing page — onboarding takes about 30 seconds. Once on the Dashboard:

1. The seed data already includes the **Free / Pro / Premium** plans on the Pricing page.
2. Add a goal at `/goals` (e.g. "Land a senior cybersecurity role" or whatever you'd like).
3. Click **✨ Generate today's tasks** on the goal — three AI-personalized tasks appear on the Dashboard.
4. Tick a couple → "Get a fresh insight" on the Dashboard pulls a coaching observation.
5. Try `/chatbot` to chat with the AI coach about your goal.
6. Visit `/forum` to see (or start) a thread.

To see the **Admin** pages (`/admin/users`, `/admin/statistics`), promote yourself to admin once (run in Supabase SQL Editor while signed in):

```sql
update public.user_profiles set role = 'admin' where id = auth.uid();
```

## Submission checklist

- [x] Live URL on Vercel (main flow working end-to-end)
- [x] Public GitHub repo
- [x] README covers overview, problem, audience, competitors, differentiation
- [x] ERD diagram embedded (Mermaid + Schema-Visualizer screenshot in `docs/screenshots/`)
- [x] External services table filled in
- [x] Demo user / demo data documented

**Submission deadline:** 26/06/2026

---

_FocusFlow is the final project for the AI Product Development course. Authored by Oran Chen._
