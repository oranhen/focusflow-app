# FocusFlow — Design System

A short reference for the visual language used across the app. The single source of truth is [`src/styles/globals.css`](src/styles/globals.css); this document explains the intent.

## Brand voice

**Optimistic productivity.** Warm off-white backgrounds, calm purple as the lead, and a sunlight-yellow + mint accent pair to signal progress and energy without feeling clinical.

## Color tokens

| Token | Value | Usage |
|---|---|---|
| `--bg` | `#fbf9f4` | Page background — warm off-white |
| `--surface` | `#ffffff` | Top-level surfaces |
| `--card-bg` | `#ffffff` | Cards, panels |
| `--text` | `#1b1c19` | Primary text |
| `--muted` | `#6b6b74` | Secondary / helper text |
| `--primary` | `#6B46C1` | Primary actions, brand mark, focus states |
| `--secondary` | `#FBD38D` | Sunlight-yellow accent |
| `--tertiary` | `#9AE6B4` | Soft-mint accent (progress, success) |
| `--border` | `#E2E8F0` | Card borders, subtle dividers |

## Typography

- **Font family:** Manrope (400 / 500 / 600 / 700 / 800), loaded from Google Fonts, with a full system-font fallback stack.
- **Heading 1:** 32px
- **Heading 2:** 24px
- **Body:** 16px

## Spacing & layout

- **Base unit:** 8px
- **Default padding:** 16px (`--spacing`)
- **Max content width:** 1200px (`--max-width`)
- **Radius:** 12px standard (`--radius`), 24px for hero / featured surfaces (`--radius-xl`)
- **Shadow:** `0 4px 20px rgba(107,70,193,0.05)` — a soft, primary-tinted lift

## Responsive breakpoints

| Range | Adjustments |
|---|---|
| ≤ 1000px | Dashboard collapses to single column; hero stacks vertically; pricing cards stack |
| ≤ 420px | Tighter spacing; smaller hero typography; hamburger menu replaces nav links |

## Component vocabulary

- **Navbar / Sidebar** — top nav with backdrop blur; off-canvas mobile drawer
- **Button** — `.btn-primary` (purple pill) and `.btn-outline` (transparent + border)
- **Card** — base content surface, optional `.rounded-xl` for hero / featured
- **Pricing card** — three-tier grid; `.recommended` variant lifts the middle plan
- **Feature card** — icon + title + description
- **Dashboard widgets** — `GoalStatusCard`, `DailyTaskCard`, `ProgressCard`, `AIInsightsCard`, `DailyTipCard`
- **Testimonial card** — italicized quote + attribution
- **Footer** — minimal, muted text

All component source lives in [`src/components/`](src/components/).
