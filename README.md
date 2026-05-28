# FocusFlow — Frontend (Vite + React)

This repository contains a Vite + React frontend scaffold for the FocusFlow final project assignment.

Installation
1. Install dependencies: `npm install`
2. Run the dev server: `npm run dev`
3. Build for production: `npm run build`
4. Preview production build: `npm run preview`

Project structure
- `src/components` — shared UI components
- `src/pages` — page-level components (routes)
- `src/styles/globals.css` — CSS variables + global styles

Routing
- Routing uses `react-router-dom` in `src/App.jsx`. Main routes:
  - `/` LandingPage
  - `/pricing` PricingPage
  - `/dashboard` DashboardPage
  - `/progress` ProgressPage
  - Other pages: register/login/profile/settings etc.

Assumptions
- No backend: pages use placeholder content.
- Focus on layout, responsiveness, and componentization.
