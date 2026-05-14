# CLAUDE.md — Laakso Labs Command Center

> **Obsidian Hub** — this file is the source of truth. All notes link back here.
> [[HOME.md]] | [[Divisions]] | [[Happy Dog Media Group]] | [[Revenue Targets]]
> Clients: [[Polish & Shine Exteriors]] · [[MemeMint]]
> Contacts: [[Dom]] · [[Ryan - Happy Dog]]
> Toolkit: [[TOOLKIT_TEMPLATE.md]]

---

## Current Build Status

**Last updated:** 2026-05-15

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
- [x] **Campaigns page + Meta MCP placeholder** — `/campaigns` route + sidebar entry. Meta Ads MCP + Google Ads MCP connection cards (Not Connected state, endpoint URLs, Connect button). KPI strip, platform filter, campaigns table, Add Campaign modal. Infrastructure ready — flip `connected` flag when MCP is wired. `campaigns` table already exists in DB with anon RLS.
- [x] **Contacts inline edit** — hover any contact row → Edit button appears → inline form expands with all fields pre-filled (name, role, company, phone, email, linked client, notes) → saves to Supabase, updates state, collapses. Email display truncation fixed. Dynamic import replaced with static top-level import.
- [x] **Final audit** — all `@/` import paths verified, all 9 nav routes confirmed, `.env.local` vars confirmed, zero ESLint errors, zero TypeScript compiler errors.

### Phase 3 — COMPLETE ✓

**Viktor integration:** No webhook needed — Viktor accesses the repo via GitHub and writes directly to Supabase using the service role key. Give Viktor: GitHub repo + `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` + CLAUDE.md for full context.

---

## Deployment — Vercel (In Progress)

**Repo:** https://github.com/tlaakso07/LaaksoLabs.git
**Vercel team:** tlaakso11-3399 (Hobby)
**Project name:** laaksolabs
**Current deployment URL:** https://laaksolabs-rm773kezn-tlaakso11-3399s-projects.vercel.app

### Vercel Settings — Configured
- Root Directory: `laaksolabs`
- Framework Preset: Next.js (was "Other", caused the initial 404)

### Vercel Settings — Still Needed
1. Add 4 env vars (values in `laaksolabs/.env.local`):
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `NEXT_PUBLIC_APP_URL`
2. Redeploy with "Use existing build cache" **unchecked** so the Next.js framework setting applies.

See `handoff/HANDOFF.md` for full deployment context.

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
