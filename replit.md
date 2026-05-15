# Laakso Labs Command Center

A private business dashboard for Laakso Labs — manage clients, tasks, revenue, campaigns, Happy Dog orders, and contacts across three divisions.

## Run & Operate

- `pnpm --filter @workspace/laaksolabs run dev` — run the frontend (Vite + React)
- `pnpm --filter @workspace/api-server run dev` — run the API server (Express, port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- Required env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` — Supabase project credentials
- Optional env: `SESSION_SECRET`, `ADMIN_USERNAME`, `ADMIN_PASSWORD` — auth config (defaults: admin / laakso2024)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, wouter (routing), Supabase JS client, Recharts
- API: Express 5, cookie-parser (HMAC session auth)
- No Tailwind in app CSS — pure CSS custom properties design system
- Supabase for all data (clients, tasks, revenue, contacts, campaigns, happy dog orders, activity log)

## Where things live

- `artifacts/laaksolabs/src/` — React frontend
  - `App.tsx` — auth gate + router + AppShell (sidebar + GlobalShortcuts)
  - `index.css` — full design system (CSS vars, dark default, `[data-theme="light"]`)
  - `lib/auth.ts` — login/logout/checkAuth against `/api/*`
  - `lib/supabase/` — Supabase client, typed queries per entity, shared types
  - `lib/constants.ts` — division labels/colors, status labels, revenue target
  - `components/layout/` — Sidebar, ThemeToggle, GlobalShortcuts, CommandPalette, QuickAddTask
  - `components/dashboard/` — MissionStrip, KpiStrip, RevenueChart, TaskList, ActivityFeed, ClientGrid
  - `components/clients/` — ClientsView, ClientDetail, AddClientModal
  - `components/tasks/` — TasksView
  - `components/revenue/` — RevenueView
  - `components/happydog/` — HappyDogView
  - `components/campaigns/` — CampaignsView
  - `components/contacts/` — ContactsView
  - `components/settings/` — SettingsView
- `artifacts/api-server/src/routes/auth.ts` — /api/login, /api/logout, /api/me

## Architecture decisions

- Auth is HMAC cookie session via Express (not Supabase auth) — single admin user, no user table needed
- Supabase is used directly from the browser client for all data reads/writes
- No Tailwind — all styling is plain CSS custom properties for full design system control
- Dark mode by default; light mode via `document.documentElement.dataset.theme = "light"`
- GlobalShortcuts is fully self-contained (manages CommandPalette + QuickAddTask state internally)

## Product

- Login gate → Dashboard with MRR progress, KPIs, revenue chart, task list, activity feed
- Clients CRM: pipeline view with status filters, detailed client page with tasks/orders/activity tabs
- Task manager: priority/status filtering, overdue highlighting, quick-add via keyboard (N)
- Happy Dog tracker: white-label order pipeline per client
- Revenue tracker: monthly entries by division, invoiced vs paid status
- Campaigns manager: Meta/Google ad campaigns per client
- Contacts directory: searchable contact list linked to clients
- Settings: app configuration
- Command palette (⌘K): global search across pages, clients, tasks

## User preferences

- Accent color: #B42020 (Laakso red)
- Dark-first design system
- Three divisions: div1 = AI Design & Marketing, div2 = AI Consulting & SEO, div3 = The Fund

## Gotchas

- The frontend uses `BASE_URL` from Vite for all API calls (`/api/*`). The API server must be co-deployed.
- Supabase env vars must be set as `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the laaksolabs artifact env.
- Change `ADMIN_PASSWORD` via env var before deploying to production.
- `GlobalShortcuts` is self-contained — do NOT pass props to it from App.tsx.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
