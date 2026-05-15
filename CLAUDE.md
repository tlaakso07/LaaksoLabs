# CLAUDE.md — Laakso Labs Command Center

> **Obsidian Hub** — this file is the source of truth. All notes link back here.
> [[HOME.md]] | [[Divisions]] | [[Happy Dog Media Group]] | [[Revenue Targets]]
> Clients: [[Polish & Shine Exteriors]] · [[MemeMint]]
> Contacts: [[Dom]] · [[Ryan - Happy Dog]]
> Toolkit: [[TOOLKIT_TEMPLATE.md]]

---

## Current Build Status

**Last updated:** 2026-05-15
**Status:** 🚀 **LIVE — in active use** — https://laaksolabs.vercel.app (auth-gated, single-user, real data, live Meta + Google Ads sync)

### Done — Phase 1 & 2
- Full design system (`globals.css`) — dark/light mode, CSS vars, animations, dot/badge/chip classes, `.live-dot` pulse class
- Sidebar with MRR bar, all icons maroon (`var(--sidebar-accent)`)
- `suppressHydrationWarning` on `<html>` — hydration error fixed
- DB schema + seed data (`supabase/migrations/001`, `002`)
- Supabase query files for all tables (`src/lib/supabase/queries/`)
- Dashboard (`/`) — greeting, KPI strip, MRR Recharts area chart, client grid, task list, activity feed
- Clients list (`/clients`) — table with search/filter/status dropdown, kanban pipeline view, Add Client modal
- Client detail (`/clients/[id]`) — inline edit header, 5 tabs (Overview, Tasks, Happy Dog, Activity, Notes)
- Tasks page (`/tasks`) — Today/This Week/By Client/All tabs, overdue+today split sections, quick-add inline form (priority/category/client/due date), complete + delete with optimistic updates, show/hide completed toggle
- Happy Dog tracker (`/happydog`) — KPI strip (4 cards), status pipeline filter bar, full order table with inline edit, advance-status buttons, Add Order modal with live margin preview
- Revenue page (`/revenue`) — overdue alert banner, KPI strip (MRR progress bar, paid, outstanding, overdue), 6-month stacked area chart, division breakdown cards, month navigator, invoice table with advance-status + edit, Add Entry modal, month total footer
- Settings page (`/settings`) — Company Info (editable, localStorage), Revenue Target (editable, localStorage), Division Configuration (colors + target retainers), Tech Stack card, Keyboard Shortcuts reference, App Version card
- Contacts page (`/contacts`) — search bar, auto-grouped sections (Clients/Partners/Prospects/Other), initials avatar, tel:/mailto: quick-action links, linked client badge → client detail, hover-reveal notes + delete + **inline edit** (all fields), Add Contact form with role datalist. Email no longer truncated.
- Full ESLint + TypeScript audit — zero errors, zero warnings

### Done — Phase 3 (in progress)
- [x] **Real-time Supabase subscriptions** — `src/hooks/use-realtime-table.ts` generic hook wired into 6 components: TaskList, TasksView, ActivityFeed, ClientsView, HappyDogView, RevenueView. LIVE dot indicator on Tasks + Activity Feed headers.
- [x] **Supabase fully connected** — migrations `003` (realtime publication) + `004` (anon RLS policies) applied. Server reads (service role), client mutations (anon key), and real-time subscriptions all working.
- [x] **Mobile optimization** — Fixed bottom nav (`BottomNav` component exported separately from `sidebar.tsx`, rendered in `layout.tsx` OUTSIDE `app-sidebar-wrap`). Desktop sidebar hides on mobile via `app-sidebar-wrap { display: none !important }`. Bottom nav: Home / Clients / Tasks / Happy Dog / Revenue. Uses inline `display: none` + CSS `!important` override on mobile to prevent flex-layout bleed. CSS utility classes: `page-pad`, `kpi-grid`, `dashboard-grid`, `settings-grid`, `modal-overlay/sheet` (bottom sheet), `tab-row`, `table-scroll-wrap`, `mission-rail`. Viewport meta tags + safe-area-inset padding in `layout.tsx`.

- [x] **Keyboard shortcuts** — `Cmd+K` command palette (searches pages/clients/tasks, arrow key nav, Enter to go), `N` quick-add task modal from anywhere (priority pills, category, due date, client). Both in `GlobalShortcuts` client wrapper rendered in `layout.tsx`. Settings page updated with accurate shortcut reference.
- [x] **Export CSV** — `src/lib/export-csv.ts` utility. CSV button on Clients, Tasks, Happy Dog, Revenue pages. Downloads dated file with all visible data.
- [x] **Campaigns page + Meta MCP placeholder** — `/campaigns` route + sidebar entry. Meta Ads MCP + Google Ads MCP connection cards (Not Connected state, endpoint URLs, Connect button). KPI strip, platform filter, campaigns table, Add Campaign modal. Infrastructure ready — flip `connected` flag when MCP is wired. `campaigns` table already exists in DB with anon RLS. **Superseded in Phase 6** by live Meta + Google Ads API sync.
- [x] **Contacts inline edit** — hover any contact row → Edit button appears → inline form expands with all fields pre-filled (name, role, company, phone, email, linked client, notes) → saves to Supabase, updates state, collapses. Email display truncation fixed. Dynamic import replaced with static top-level import.
- [x] **Final audit** — all `@/` import paths verified, all 9 nav routes confirmed, `.env.local` vars confirmed, zero ESLint errors, zero TypeScript compiler errors.

### Phase 3 — COMPLETE ✓

**Viktor integration:** No webhook needed — Viktor accesses the repo via GitHub and writes directly to Supabase using the service role key. Give Viktor: GitHub repo + `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` + CLAUDE.md for full context.

### Phase 4 — LAUNCHED ✓ (2026-05-13)
- [x] **Vercel deploy live** — https://laaksolabs.vercel.app (HTTP 200, READY). Deployed via `vercel deploy --prod --force --yes` from repo root.
- [x] **Deployment Protection disabled** — `ssoProtection: null` via REST API PATCH on project. Aliased prod URL + per-deployment URLs both public.
- [x] **Preview deployments disabled** — `previewDeploymentsDisabled: true`. Only `main` branch builds.
- [x] **Auth gate / login screen** — Username/password gate over the entire dashboard. HMAC-signed cookie session (Web Crypto, Edge-runtime safe, no extra deps). Sign-out link in sidebar footer. Single user (creds in env vars, never in repo).
- [x] **Playwright smoke tests** — all 9 routes pass: unauth redirects to /login, wrong creds shows error, correct creds sets cookie + dashboard renders, navigation works authenticated, logout clears cookie + redirects.

### Phase 5 — GOING LIVE WITH REAL DATA ✓ (2026-05-14)
- [x] **Full seed wipe** — TRUNCATE-equivalent DELETE on all 7 tables via PostgREST + service role: `activity_log`, `tasks`, `happydog_orders`, `revenue_entries`, `campaigns`, `contacts`, `clients`. From 18 seeded rows → 0. Blank-slate smoke test confirmed every page renders cleanly with zero data and zero console errors.
- [x] **Real entities re-added** — Polish & Shine Exteriors (client, Div 1, Onboarding, owner Dom, (253) 237-2709, polishandshineexteriors@gmail.com, Federal Way WA, retainer pending). Dom (Client Owner contact linked to Polish & Shine). Ryan (White-Label Partner contact, Happy Dog Media Group).
- [x] **First revenue entries** — 2 expected entries for May 2026 totaling $4,999: $999/mo retainer ("Monthly Maintenance") + $4,000 project ("Website, 2 Landing Pages, Google/Meta Ads Set up"). Both `expected`, awaiting invoice → payment.

**Revenue MRR-tracking flow:** `expected` → `invoiced` → `paid`. **Only `paid` entries count toward MRR** — the chart, MRR Progress %, and "Paid This Month" KPI filter for `status === 'paid'`. Entries in `expected` or `invoiced` show only under "Outstanding". This is intentional (MRR = recurring revenue *received*). To advance, click the status button on each row.

### Phase 6 — LIVE AD-PLATFORM SYNC ✓ (2026-05-15)
- [x] **Meta Marketing API sync** — `POST /api/campaigns/sync/meta` pulls campaigns + this-month insights (spend, CTR, leads via `lead` or `onsite_conversion.lead_grouped` actions, computed CPL) from Graph API v20, normalizes to `NormalizedCampaign[]`, returns to client which upserts to Supabase.
- [x] **Google Ads OAuth flow** — 3 routes (`auth-start`, `oauth-callback`, `oauth-status/[state]`) backed by new `oauth_states` table (service-role only, migration `005`). 3-step `GoogleConnectWizard` modal walks user through Developer Token → Cloud OAuth client → authorize. Result page renders 5 secrets with copy-to-clipboard + Vercel env-var instructions.
- [x] **Google Ads sync** — `POST /api/campaigns/sync/google` exchanges refresh token for access token, runs GAQL query (`segments.date DURING THIS_MONTH`), normalizes ENABLED/PAUSED status, converts micros to dollars.
- [x] **Connection status API** — `GET /api/campaigns/connections` reads env vars, returns `{meta, google}: {connected, hint}`. UI uses this to show Connected pill + "Sync Now" button vs. Not Connected + required-vars list + "Connect" wizard launcher.
- [x] **Import flow for new campaigns** — When sync finds campaigns not already in DB (matched by `platform + lowercase(name)`), modal pops up letting user assign each to a client before importing. Matched campaigns update silently (status/budget/spend/leads/CPL/CTR/last_synced).
- [x] **Auth on all 6 routes** — New `src/lib/require-auth.ts` helper reuses existing HMAC `verifySession` to gate every campaign API route except `oauth-callback` (which Google calls directly with the state token).
- [x] **Replit rewrite branch archived** — Replit Agent's parallel rewrite (Vite + Express monorepo, 18 commits, +25k lines) preserved on `replit-rewrite` branch on GitHub. Only the campaigns sync logic was ported back into the Next.js app; the rest was superseded by what already exists here.

**Required env vars to enable sync** (all optional — campaigns page works without them, shows "Not Connected"):
- Meta: `META_ACCESS_TOKEN`, `META_AD_ACCOUNT_ID`
- Google Ads: `GOOGLE_ADS_DEVELOPER_TOKEN`, `GOOGLE_ADS_CUSTOMER_ID`, `GOOGLE_ADS_CLIENT_ID`, `GOOGLE_ADS_CLIENT_SECRET`, `GOOGLE_ADS_REFRESH_TOKEN`

**Migration `005_oauth_states.sql`** — ✅ applied 2026-05-15. Google connect wizard is now unblocked at the DB level. Meta sync needs no migration.

### Enable sync — checklist (do when ready, in any order)

The campaigns page works without these. Connection cards just show "Not Connected" until env vars are set.

**Step A — Meta Ads sync** (~5 min)
1. Open [Graph API Explorer](https://developers.facebook.com/tools/explorer/) → select your Business app → grant `ads_read` + `ads_management` permissions → click **Generate Access Token**.
2. (Optional but recommended) Exchange the short-lived token for a 60-day token:
   ```
   curl "https://graph.facebook.com/v20.0/oauth/access_token?grant_type=fb_exchange_token&client_id=APP_ID&client_secret=APP_SECRET&fb_exchange_token=SHORT_TOKEN"
   ```
3. Get the ad account ID from [Meta Ads Manager](https://adsmanager.facebook.com) URL (number after `act_`).
4. Add both to Vercel (Production scope):
   ```
   vercel env add META_ACCESS_TOKEN production --value 'EAAxxxxx...' --yes
   vercel env add META_AD_ACCOUNT_ID production --value '1234567890' --yes
   ```
5. Redeploy: `vercel deploy --prod --force --yes` (from repo root).
6. Open `/campaigns` → Meta card should show **Connected** → click **Sync Now**.

**Step B — Google Ads sync** (~10 min, wizard does most of it)
1. Open `/campaigns` → click **Connect** on the Google Ads card.
2. Wizard step 1: get Developer Token from [Google Ads → Tools → API Center](https://ads.google.com/aw/apicenter) (apply for Basic Access if first time).
3. Wizard step 1: create OAuth client at [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials) — Web application type, enable Google Ads API. Add `https://laaksolabs.vercel.app/api/campaigns/google/oauth-callback` to Authorized redirect URIs.
4. Wizard step 2: paste Developer Token + Customer ID (from Google Ads top-right, dashes OK) + Client ID + Client Secret → click **Sign in with Google**.
5. Google popup → authorize → success tab opens with 5 secrets and copy buttons.
6. Paste all 5 into Vercel:
   ```
   vercel env add GOOGLE_ADS_DEVELOPER_TOKEN production --value '...' --yes
   vercel env add GOOGLE_ADS_CUSTOMER_ID production --value '...' --yes
   vercel env add GOOGLE_ADS_CLIENT_ID production --value '...' --yes
   vercel env add GOOGLE_ADS_CLIENT_SECRET production --value '...' --yes
   vercel env add GOOGLE_ADS_REFRESH_TOKEN production --value '...' --yes
   ```
7. Redeploy: `vercel deploy --prod --force --yes`.
8. Google card on `/campaigns` shows **Connected** → click **Sync Now**.

**If sync finds new campaigns** (ones not already in the DB), an Import modal pops up letting you assign each to a client before they're saved.

---

## Deployment — LIVE on Vercel

**Production URL:** https://laaksolabs.vercel.app
**GitHub:** https://github.com/tlaakso07/LaaksoLabs.git
**Vercel team:** `team_9Ko73rYykksswuIUw85JT8Gu` (tlaakso11-3399s-projects, Hobby)
**Vercel project:** `prj_SlqnQTfnUCvOiRwjQ2fZ5di5D4Ji` (`laaksolabs`)
**Local `.vercel/`:** repo root (`/Users/trevorlaakso/Desktop/LaaksoLabs/.vercel`) — NOT inside `laaksolabs/`. Project Root Directory is `laaksolabs/`, so running CLI from the inner dir causes path doubling.

### Vercel Settings (configured)
- Root Directory: `laaksolabs`
- Framework Preset: Next.js
- Deployment Protection: **OFF** (`ssoProtection: null`)
- Preview Deployments: **OFF** (`previewDeploymentsDisabled: true`)
- Env vars in Production + Preview + Development:
  - **Core (7, required):** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL`, `AUTH_USERNAME`, `AUTH_PASSWORD`, `AUTH_SECRET` (96 hex chars)
  - **Ad-platform sync (7, optional — set to enable Phase 6 features):** `META_ACCESS_TOKEN`, `META_AD_ACCOUNT_ID`, `GOOGLE_ADS_DEVELOPER_TOKEN`, `GOOGLE_ADS_CUSTOMER_ID`, `GOOGLE_ADS_CLIENT_ID`, `GOOGLE_ADS_CLIENT_SECRET`, `GOOGLE_ADS_REFRESH_TOKEN`

### Redeploy commands
```bash
# from repo root /Users/trevorlaakso/Desktop/LaaksoLabs/
vercel deploy --prod --force --yes
```

### Vercel CLI gotchas
- Always run from repo root, never from `laaksolabs/` subdir.
- `vercel env add NAME preview` without git-branch arg prompts interactively. Non-interactive form: `vercel env add NAME preview '' --value 'val' --yes` (empty git-branch arg).

See `handoff/HANDOFF.md` for legacy deployment context (now stale — reflects pre-launch state).

---

## Authentication

**Type:** Single-user username + password gate. Protects the entire dashboard. Cookie-based session.

**Credentials** (in env vars only — `laaksolabs/.env.local` locally, Vercel env vars in prod):
- `AUTH_USERNAME` — username
- `AUTH_PASSWORD` — password
- `AUTH_SECRET` — 96-char hex string for HMAC signing the session cookie

**Rotate credentials:** change env var in Vercel (`vercel env rm NAME production` → `vercel env add NAME production --value '...' --yes`) + locally + redeploy.

### Auth files
| File | Purpose |
|---|---|
| `src/lib/auth.ts` | HMAC-SHA256 sign/verify session (Web Crypto, no deps). `signSession`, `verifySession`, `checkCredentials`, `getAuthSecret/Username`. |
| `src/middleware.ts` | Gates every route except `/login`, `/api/login`, `/_next/*`, `/favicon*`, `/robots.txt`, `/sitemap.xml`. Verifies HMAC cookie. Sets `x-pathname` header so root layout can skip sidebar on `/login`. |
| `src/app/login/page.tsx` | Server-rendered login UI. Reads `?error=1` and `?next=...` server-side so error UI shows without waiting for hydration. |
| `src/app/login/login-form.tsx` | Plain `<form action="/api/login" method="POST">` — no JS required to log in. |
| `src/app/api/login/route.ts` | POST handler. Validates creds → sets cookie via `NextResponse.cookies.set` → 303 redirect to `next` or `/`. On failure → 303 redirect to `/login?error=1`. |
| `src/app/logout/route.ts` | GET/POST handler. Deletes cookie → 303 redirect to `/login`. |
| `src/components/layout/sidebar.tsx` | Sign-out link in sidebar footer linking to `/logout`. |
| `src/app/layout.tsx` | Reads `x-pathname` header, skips sidebar/bottom nav on `/login` (renders just `{children}`). |

### Why this design
- **Native form POST + route handler instead of server action:** Next.js 16 server actions don't reliably propagate `cookies().set()` through `redirect()` — the Set-Cookie header gets dropped. Route handler with `NextResponse.cookies.set` + `NextResponse.redirect` works.
- **Server-side error rendering instead of `useSearchParams`:** Client-only hook means error UI shows only after hydration; reading `searchParams` server-side and passing as prop makes the error visible immediately and works without JS.
- **Web Crypto over jose/jwt libs:** Edge-runtime native, no extra dep, no install/build cost.

### Cookie
- Name: `laakso_session`
- HttpOnly, Secure (in prod), SameSite=Lax, Path=/
- TTL: 30 days
- Payload: `{u: username, exp: unix_seconds}` base64url-encoded + HMAC-SHA256 signature

### Known limitation
The login screen protects the **UI**. The Supabase anon key is embedded in the client bundle (`NEXT_PUBLIC_*` env vars), and migration `004_anon_rls_policies` grants anon full CRUD. Someone who knows the URL + anon key could query Supabase directly without going through the app. To fully lock down later: tighten RLS to deny anon, refactor client mutations into server actions using service role, and either drop real-time updates or wire Supabase Auth properly.

---

## Campaigns Sync (Meta + Google Ads)

**Endpoints:** all gated by `requireAuth` (cookie HMAC) except the OAuth callback, which Google calls directly with a state token.

| File | Purpose |
|---|---|
| `src/lib/require-auth.ts` | Wraps existing `verifySession` for use inside Route Handlers. Returns `{ok: true}` or `{ok: false, status: 401}`. |
| `src/app/api/campaigns/connections/route.ts` | GET — reads env-var presence, returns `{meta: {connected, hint}, google: {connected, hint}}`. |
| `src/app/api/campaigns/sync/meta/route.ts` | POST — Graph API v20 `/campaigns` + `/insights` (date_preset=this_month). Returns normalized array. Client upserts to Supabase. |
| `src/app/api/campaigns/sync/google/route.ts` | POST — refresh→access token swap, then GAQL query against `googleads.googleapis.com/v17`. |
| `src/app/api/campaigns/google/auth-start/route.ts` | POST — generates random state via Web Crypto, writes `oauth_states` row with credentials, returns Google OAuth URL. |
| `src/app/api/campaigns/google/oauth-callback/route.ts` | GET — Google redirects here. Exchanges code for refresh_token, stores it back to `oauth_states` row, renders HTML success page with 5 secrets + Vercel env-var instructions. Renders error page on failure. |
| `src/app/api/campaigns/google/oauth-status/[state]/route.ts` | GET — polled by `GoogleConnectWizard` every 2 s. Returns `pending` / `complete` / `error` / `expired`. Deletes row on complete or error. |
| `src/components/campaigns/google-connect-wizard.tsx` | Client modal — 3 steps (prereqs → credentials → authorizing) → done or error. Opens Google sign-in in `window.open` popup. |
| `src/components/campaigns/campaigns-view.tsx` | `ConnectionCard` pair, `ImportModal`, `AddCampaignModal`. `syncPlatform()` diffs synced campaigns vs. local state by `platform + lowercase(name)` — matches update silently, new ones queue for import. |
| `supabase/migrations/005_oauth_states.sql` | Service-role-only `oauth_states` table. No RLS policies, so anon and authenticated can't read or write. 15-minute TTL enforced inside handlers (no separate cleanup job). |

**Why a Supabase table instead of an in-process Map:** Vercel serverless invocations may hit different instances. The Replit source used `new Map<state, OAuthState>()` which would silently fail on Vercel between the `auth-start` invocation and the `oauth-callback` invocation. The `oauth_states` table guarantees both reach the same state.

**Why no OAuth flow for Meta:** Meta uses a long-lived access token you generate manually in the Graph API Explorer. No browser handshake needed — paste token + ad account ID into Vercel env, redeploy, done.

**Adding a Meta token:** Graph API Explorer → select your app → permissions `ads_read` + `ads_management` → "Generate Access Token". For long-lived (60-day) token, exchange it via `https://graph.facebook.com/v20.0/oauth/access_token?grant_type=fb_exchange_token&...`.

**Refreshing the Google refresh token:** if revoked, re-run the connect wizard. New refresh token replaces the env var.

---

### Color overrides (supersede original spec)
| Element | Color |
|---|---|
| Div 1 (Marketing) | Charcoal `#6C6C70` |
| Div 2 (Consulting) | Muted violet `#8A78B4` |
| Div 3 (Fund) | Charcoal `#6C6C70` |
| Accent / buttons | Maroon `#B42020` |

---

## Project Overview

This is the **Laakso Labs Command Center** — a single-user dashboard for managing a three-division AI services company targeting $200K MRR. It tracks clients, revenue, campaigns, white-label partner deliverables, and daily priorities.

The founder (Trevor Laakso) has ADHD — the UI must be **scannable, visual, and low-friction**. Think: bold KPIs, color-coded statuses, minimal clicks to update anything.

**Company:** Laakso Labs
**Name origin:** "Laakso" is Finnish, pronounced "Lockso" — lock = trust, security, locking in results. Lab = innovation, experimentation, cutting-edge AI.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS + shadcn/ui components
- **Database:** Supabase (PostgreSQL + Auth + Real-time)
- **Charts:** Recharts
- **Hosting:** Vercel
- **Package Manager:** pnpm

## Business Context

Laakso Labs has three divisions:

| Division | Focus | Target Retainer |
|---|---|---|
| **Div 1 — AI Design & Marketing** | White-label creative + Meta/Google ad management for home services | ~$7.5K/mo |
| **Div 2 — AI Consulting & SEO** | AI workflow audits, tool installs (Viktor, Claude, Firecrawl, Apollo), proprietary SEO stack | ~$15K/mo |
| **Div 3 — The Fund** | Equity positions in best consulting clients | Equity deals |

**Revenue target:** $200K MRR = 7 Div 1 clients + 6 Div 2 clients + 1 project/month ($25K) + $30K other

**White-label partner:** Happy Dog Media Group (happydogmg.com) — handles creative fulfillment (brand kits, landing pages, ad creative, websites, video). Laakso Labs marks up ~2x for 50-66% margins. Contact: Ryan (Trevor's former creative director from Renewal by Andersen).

**AI advantage:** Viktor (AI coworker) handles ad management, reporting, automation. Meta Ads MCP (mcp.facebook.com/ads) for programmatic ad management. AI speed-to-lead for instant response.

**Trevor's unfair advantage:** Home services sales background — $12.9M net revenue, 43% close rates, cut CAC from 140% to 19%.

## Data Models

### Clients
```
clients {
  id: uuid
  name: string
  owner_name: string
  division: enum('div1', 'div2', 'div3')
  status: enum('prospect', 'lead', 'proposal', 'onboarding', 'active', 'paused', 'churned')
  retainer_amount: number (monthly, dollars)
  phone: string
  email: string
  website: string
  location: string
  services: string[] (e.g. ['meta_ads', 'google_ads', 'seo', 'brand_kit'])
  notes: text
  created_at: timestamp
  updated_at: timestamp
}
```

### Revenue Entries
```
revenue_entries {
  id: uuid
  client_id: uuid (FK -> clients)
  amount: number
  type: enum('retainer', 'project', 'equity', 'other')
  month: date (first of month)
  status: enum('expected', 'invoiced', 'paid', 'overdue')
  notes: text
  created_at: timestamp
}
```

### Tasks
```
tasks {
  id: uuid
  title: string
  description: text
  client_id: uuid (FK -> clients, nullable)
  priority: enum('urgent', 'high', 'medium', 'low')
  status: enum('todo', 'in_progress', 'waiting', 'done')
  due_date: date (nullable)
  category: enum('sales', 'delivery', 'operations', 'creative', 'campaigns')
  created_at: timestamp
  completed_at: timestamp (nullable)
}
```

### Happy Dog Commissions
```
happydog_orders {
  id: uuid
  client_id: uuid (FK -> clients)
  deliverable: string (e.g. 'Brand Kit', 'Landing Page - Windows')
  status: enum('not_ordered', 'ordered', 'in_progress', 'review', 'delivered', 'revision')
  hd_cost: number (what Happy Dog charges)
  client_price: number (what Trevor charges client)
  margin: number (computed)
  ordered_date: date (nullable)
  delivered_date: date (nullable)
  notes: text
  created_at: timestamp
}
```

### Contacts
```
contacts {
  id: uuid
  name: string
  role: string (e.g. 'Client Owner', 'White-Label Partner', 'Prospect')
  company: string
  phone: string
  email: string
  notes: text
  client_id: uuid (FK -> clients, nullable)
  created_at: timestamp
}
```

### Campaign Performance (Phase 2)
```
campaigns {
  id: uuid
  client_id: uuid (FK -> clients)
  platform: enum('meta', 'google', 'other')
  campaign_name: string
  status: enum('draft', 'active', 'paused', 'completed')
  daily_budget: number
  spend_mtd: number
  leads_mtd: number
  cost_per_lead: number (computed)
  ctr: number
  notes: text
  last_synced: timestamp
}
```

### Activity Log
```
activity_log {
  id: uuid
  client_id: uuid (FK -> clients, nullable)
  type: enum('note', 'call', 'email', 'meeting', 'milestone', 'payment')
  content: text
  created_at: timestamp
}
```

## Pages & Features

### 1. Dashboard (`/`)
The main view Trevor sees every day. Must be instantly scannable.

**Top KPI Bar:**
- Current MRR (sum of active retainers) vs $200K target — progress bar
- Active clients by division (Div 1 | Div 2 | Div 3)
- Pipeline value (sum of proposal + lead retainer amounts)
- Tasks due today / overdue count

**Revenue Chart:**
- Monthly MRR trend line (Recharts area chart)
- Stacked by division (Div 1, Div 2, Div 3, Projects)
- Target line at $200K

**Today's Priorities:**
- Top 5 tasks sorted by priority + due date
- Quick-complete buttons (checkbox)
- "Add task" inline

**Client Status Grid:**
- Card per active client showing: name, division badge, retainer amount, status dot (green/yellow/red), next action
- Click to open full client view

**Recent Activity:**
- Last 10 activity log entries across all clients
- Compact timeline view

### 2. Clients (`/clients`)
Full CRM view.

**List View (default):**
- Sortable/filterable table: Name, Division, Status, Retainer, Location, Next Action
- Status badges with color coding
- Quick-action buttons: Add Note, Create Task, Log Call

**Pipeline View (toggle):**
- Kanban columns: Prospect → Lead → Proposal → Onboarding → Active
- Drag and drop to change status
- Card shows: name, retainer value, days in stage

**Client Detail (`/clients/[id]`):**
- Header: Name, owner, division, status, retainer, contact info
- Tabs: Overview | Tasks | Happy Dog Orders | Campaigns | Activity | Notes
- Overview: KPIs (MRR from this client, total spend on Happy Dog, margin), quick actions
- Inline editing for all fields

### 3. Tasks (`/tasks`)
ADHD-friendly task management.

**Views:**
- **Today:** Tasks due today + overdue, sorted by priority
- **This Week:** Tasks due this week
- **By Client:** Grouped by client
- **All:** Full list with filters

**Features:**
- Quick-add task (title + priority + optional client + optional due date)
- Drag to reorder priority
- Color-coded priority badges (🔴 Urgent, 🟠 High, 🟡 Medium, ⚪ Low)
- Complete with single click
- Bulk actions (complete, reschedule, delete)

### 4. Happy Dog Tracker (`/happydog`)
White-label commission management.

**Dashboard:**
- Total ordered / delivered / in review
- Total HD cost vs total client revenue → margin summary
- Orders by status (pie chart)

**Order Table:**
- Client, Deliverable, Status, HD Cost, Your Price, Margin, Ordered Date, Delivered Date
- Status badges with workflow: Not Ordered → Ordered → In Progress → Review → Delivered
- Quick status update buttons
- Add new order form

### 5. Revenue (`/revenue`)
Financial tracking.

**Monthly View:**
- MRR breakdown by client + division
- Month-over-month comparison
- Projected vs actual
- Target gap analysis

**Invoice Tracker:**
- Which clients have been invoiced this month
- Payment status (expected → invoiced → paid → overdue)
- Overdue alerts

### 6. Contacts (`/contacts`)
Quick-reference directory.

- Searchable list of all contacts
- Grouped by: Clients, Partners, Prospects
- Click to call/email (tel: / mailto: links for mobile)
- Linked to client records

### 7. Settings (`/settings`)
- Company info
- Revenue targets (editable)
- Division configuration
- Notification preferences

## Design Principles

1. **Dark mode default** — easier on the eyes, looks professional
2. **Large KPI numbers** — scannable from arm's length
3. **Color-coded everything** — status, priority, division all have consistent colors
4. **Minimal clicks** — inline editing, quick-add, single-click complete
5. **Mobile responsive** — works on phone for checking while out
6. **Real-time** — Supabase subscriptions for live updates
7. **Fast** — no loading spinners, optimistic UI updates

## Color System

| Element | Color |
|---|---|
| Div 1 (Marketing) | Blue (#3B82F6) |
| Div 2 (Consulting) | Purple (#8B5CF6) |
| Div 3 (Fund) | Emerald (#10B981) |
| Urgent | Red (#EF4444) |
| High | Orange (#F97316) |
| Medium | Yellow (#EAB308) |
| Low | Gray (#6B7280) |
| Active | Green (#22C55E) |
| Onboarding | Yellow (#EAB308) |
| Prospect/Lead | Blue (#3B82F6) |
| Paused/Churned | Red (#EF4444) |

## Division Color Badges

Always show division as a small colored badge next to client names:
- `Div 1` — blue badge
- `Div 2` — purple badge  
- `Div 3` — emerald badge

## Build Order (Phases)

### Phase 1 — Foundation (build first)
1. Project setup (Next.js + Tailwind + shadcn/ui + Supabase)
2. Auth (simple email/password, single user)
3. Database schema (run migrations)
4. Dashboard page with KPI bar + placeholder sections
5. Client CRUD (list + detail + create + edit)
6. Task CRUD with today/this week views

### Phase 2 — Core Features
7. Happy Dog order tracker
8. Revenue tracking + monthly view
9. Activity log (notes, calls, milestones per client)
10. Contacts directory
11. Pipeline kanban view for clients
12. Dashboard charts (MRR trend, revenue by division)

### Phase 3 — Polish & Integrations
13. Real-time subscriptions (Supabase)
14. Mobile optimization
15. Keyboard shortcuts (Cmd+K for search, N for new task, etc.)
16. Export to CSV
17. Meta MCP integration placeholder (campaign performance sync)
18. Webhook endpoint for Viktor to push updates

## File Structure

```
src/
├── app/
│   ├── layout.tsx           # Root layout with sidebar nav
│   ├── page.tsx             # Dashboard
│   ├── clients/
│   │   ├── page.tsx         # Client list + pipeline view
│   │   └── [id]/
│   │       └── page.tsx     # Client detail
│   ├── tasks/
│   │   └── page.tsx         # Task management
│   ├── happydog/
│   │   └── page.tsx         # Happy Dog tracker
│   ├── revenue/
│   │   └── page.tsx         # Revenue tracking
│   ├── contacts/
│   │   └── page.tsx         # Contact directory
│   └── settings/
│       └── page.tsx         # Settings
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── dashboard/           # Dashboard-specific components
│   ├── clients/             # Client-specific components
│   ├── tasks/               # Task-specific components
│   ├── happydog/            # Happy Dog components
│   ├── layout/
│   │   ├── sidebar.tsx      # Main navigation sidebar
│   │   └── header.tsx       # Page headers
│   └── shared/              # Shared components (badges, cards, etc.)
├── lib/
│   ├── supabase/
│   │   ├── client.ts        # Supabase client setup
│   │   ├── types.ts         # Generated types from schema
│   │   └── queries/         # Data access functions per table
│   ├── utils.ts             # Utility functions
│   └── constants.ts         # Colors, statuses, divisions
└── hooks/                   # Custom React hooks
    ├── use-clients.ts
    ├── use-tasks.ts
    └── use-revenue.ts
```

## Supabase Setup

1. Create new Supabase project
2. Run schema migrations (see `supabase/migrations/`)
3. Enable Row Level Security (RLS) with simple auth policy
4. Set environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (for server-side operations)

## Seed Data

Pre-populate with current known data:

**Clients:**
- Polish & Shine Exteriors (Div 1, Onboarding, Federal Way WA)
- MemeMint (Div 3, Active, equity deal)
- Cascade Home Remodeling (Div 1, Paused)

**Contacts:**
- Dom — Polish & Shine owner, (253) 237-2709, polishandshineexteriors@gmail.com
- Ryan — Happy Dog Media Group, Trevor's former CD from Renewal by Andersen

**Happy Dog Orders:**
- Brand kit refresh (Polish & Shine) — Not ordered, HD cost $2,500, client price $5-6K
- Landing page — Windows (Polish & Shine) — Not ordered, HD cost $1-2K, client price $3-5K
- Landing page — Gutters (Polish & Shine) — Not ordered, HD cost $1-2K, client price $3-5K
- Meta ad creative batch (Polish & Shine) — Not ordered, HD cost $500-1K

**Tasks:**
- Set retainer price with Dom (urgent, sales)
- Connect Meta MCP to Dom's ad account (high, campaigns)
- Commission Happy Dog for brand kit + landing pages (high, creative)
- Launch Meta campaigns for windows + gutters (high, campaigns)
- Draft scope brief for Ryan (medium, creative)
- Set up Google Ads for Federal Way (medium, campaigns)
- Build reporting workflow (medium, operations)

## Key UX Notes

- **Trevor has ADHD** — keep everything visual, scannable, low-friction
- **Single user** — no team features needed initially, simple auth
- **Home services focus** — clients are small local businesses (pressure washing, windows, remodeling)
- **Revenue obsession** — the $200K MRR target should be visible everywhere
- **Happy Dog is key** — the white-label margin tracker is a core feature, not an afterthought
- **Mobile matters** — Trevor checks things on his phone throughout the day

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Commands

```bash
pnpm dev          # Start dev server
pnpm build        # Production build
pnpm lint         # Lint
pnpm db:migrate   # Run Supabase migrations
pnpm db:seed      # Seed initial data
pnpm db:reset     # Reset and re-seed database
```

---

> Obsidian: [[HOME.md]] · [[Polish & Shine Exteriors]] · [[MemeMint]] · [[Dom]] · [[Ryan - Happy Dog]] · [[Happy Dog Media Group]] · [[Divisions]] · [[Revenue Targets]] · [[TOOLKIT_TEMPLATE.md]]
