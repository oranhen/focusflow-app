# FocusFlow

> **FocusFlow turns your big goal into today's three actions — powered by AI.**

**Live demo:** _TBD — deploying to Vercel before submission._
**Repository:** https://github.com/oranhen/focusflow-app
**Author:** Oran Chen

---

## Screenshots

_Will be added after the live deployment. Placeholder location: [`docs/screenshots/`](docs/screenshots/)._

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

1. **Onboard** — sign up, complete a short questionnaire (focus area, motivation level, preferred task time).
2. **Define a goal** — add one or more goals (title, description, target date, category).
3. **✨ Generate today's tasks** — one click on a goal calls Google Gemini (via a Supabase Edge Function, so the API key never reaches the browser). Three concrete tasks land in your day, each with a "why this task" reason.
4. **Execute & track** — tick boxes as you finish; the dashboard updates today's %, the 7-day streak, and per-goal progress.
5. **Reflect** — over time, AI insights and recommendations surface on the Progress page.

## Tech stack

- **Frontend:** React 18, Vite 5, React Router v6, vanilla CSS with design tokens (`src/styles/globals.css`)
- **Backend / Database:** Supabase (PostgreSQL + Row-Level Security)
- **Authentication:** Supabase Auth (email/password)
- **AI:** Google Gemini (`gemini-1.5-flash`) called from a Supabase Edge Function so API keys never reach the client
- **Hosting:** Vercel (frontend) + Supabase managed services (backend)

## External services & integrations

| Service | Type | Used for |
|---|---|---|
| Supabase Auth | Authentication | User signup, login, session management |
| Supabase Postgres | Database | All persistent data (users, goals, tasks, progress, chat, forum) |
| Supabase Edge Functions | Serverless logic | Securely calling the Gemini API and any other server-side logic |
| Google Gemini API | LLM | Generating daily tasks, AI insights/recommendations, chat responses |
| Vercel | Hosting / CDN | Serving the production frontend build |

> Keys for any third-party API (Gemini, etc.) are stored as Supabase Edge Function secrets and **never** shipped to the client.

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
        text content
    }
```

> A native Schema-Visualizer screenshot from the Supabase dashboard will also be added here once the project is provisioned.

## Project structure

```
FocusFlow/
├── src/
│   ├── components/   # Reusable UI (Navbar, Sidebar, cards, Button, Footer)
│   ├── pages/        # Route-level components (Landing, Login, Dashboard, ...)
│   ├── styles/       # globals.css — design tokens & base styles
│   ├── App.jsx       # Router
│   └── main.jsx      # Entry point
├── DESIGN.md         # Design system summary
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

## Submission checklist

- [ ] Live URL on Vercel (main flow working end-to-end)
- [ ] Public GitHub repo (this one)
- [ ] README covers overview, problem, audience, competitors, differentiation
- [ ] ERD diagram embedded
- [ ] External services table filled in
- [ ] Demo user / demo data documented (if required to test)

**Submission deadline:** 26/06/2026

---

_FocusFlow is the final project for the AI Product Development course. Authored by Oran Chen._
