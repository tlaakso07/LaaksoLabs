---
tags: [hub, dashboard]
---

# Laakso Labs — Command Center

> **Mission:** $200K MRR | 3 divisions | AI-first execution
> **Status:** 🚀 **LAUNCHED** — https://laaksolabs.vercel.app (auth-gated, single-user)
> **Hub:** [[CLAUDE.md]] is the source of truth for all project instructions, data models, and build order.

---

## Active Clients

| Client | Division | Status | Retainer |
|---|---|---|---|
| [[Polish & Shine Exteriors]] | Div 1 | Onboarding | TBD |
| [[MemeMint]] | Div 3 | Active | Equity |
| [[Cascade Home Remodeling]] | Div 1 | Paused | — |

---

## Business

- [[Divisions]] — Div 1 (Marketing), Div 2 (Consulting), Div 3 (Fund)
- [[Happy Dog Media Group]] — White-label creative partner, ~50–66% margins
- [[Revenue Targets]] — $200K MRR breakdown

---

## Contacts

- [[Dom]] — Polish & Shine Exteriors owner
- [[Ryan - Happy Dog]] — Happy Dog Media Group, creative fulfillment

---

## App

- [[CLAUDE.md]] — Full project spec, data models, pages, build order
- `laaksolabs/PRODUCT.md` — Product purpose + brand register
- `laaksolabs/DESIGN.md` — Design system (colors, typography, components)
- [[TOOLKIT_TEMPLATE.md]] — Skills, MCPs, CLIs directory

---

## Build Phase Tracker

- [x] Phase 1: Foundation — Next.js + Tailwind + shadcn + Supabase + DB schema + design system
- [x] Phase 2: Core Features — Dashboard, Clients, Client detail, Tasks, Happy Dog tracker, Revenue, Contacts, Settings, Campaigns
- [x] Phase 3: Polish & Integrations — Real-time subscriptions, mobile optimization, keyboard shortcuts (Cmd+K, N), CSV export, Meta MCP placeholder
- [x] Phase 4: **LAUNCHED** (2026-05-13) — Vercel production deploy, Deployment Protection off, preview deploys off, username/password auth gate with HMAC-signed cookie session

---

## Production

- **Live URL:** https://laaksolabs.vercel.app
- **Auth:** Username/password gate over entire app. Credentials in env vars only — see `CLAUDE.md` → Authentication section.
- **Deploy command** (from repo root): `vercel deploy --prod --force --yes`
- **Known limitation:** Auth protects UI only. Supabase anon key is public (`NEXT_PUBLIC_*`) and migration `004` grants anon CRUD — full lockdown would need RLS tightening + Supabase Auth integration.

---

> Source of truth: [[CLAUDE.md]] · Clients: [[Polish & Shine Exteriors]] · [[MemeMint]] · [[Cascade Home Remodeling]] · Partners: [[Happy Dog Media Group]] · Contacts: [[Dom]] · [[Ryan - Happy Dog]] · Strategy: [[Divisions]] · [[Revenue Targets]]
