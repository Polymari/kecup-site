# KeCup — Project Plan

Markdown plans for the **KeCup** website + franchisee portal (university Venture Creation project). KeCup sells nachos (Bolognese / Mushroom / Cheese sauce) stacked on a tea drink (Cloudy cheese-foam tea / Fizzy tea) in one connected cup — *snack on top, sip below, one hand.* Tagline: **"Keep Cravings in One Cup."**

## Read in this order

1. **[PLAN.md](./PLAN.md)** — problem, scope, open questions, requirements, architecture, tech stack, folder layout, the 25-task build order, executor conventions, human prerequisites.
2. **[DATA-MODEL.md](./DATA-MODEL.md)** — menu, costing/HPP (reconciled with the team's numbers), recipes, stock, outlets, franchise packages, business-logic libraries, seed model.
3. **[BACKEND.md](./BACKEND.md)** — Supabase schema (full DDL), RLS, SQL function contracts, sale-flow sequence, seed/verify scripts, security.
4. **[DESIGN.md](./DESIGN.md)** — brand palette & type, visual motifs, animation/interaction layer, per-page specs, 3D cup implementation.
5. **[CONTENT.md](./CONTENT.md)** — bilingual (EN/ID) copy deck, WhatsApp/mailto templates, asset shot list.

## At a glance

- **Stack:** Vite + React 19 + TypeScript · Tailwind v4 · three.js/R3F · GSAP + Lenis + Motion · React Router v7 · Supabase (Auth + Postgres + RLS + RPC + Realtime) · TanStack Query · Zustand · Recharts · react-i18next.
- **Three parts:** public brand site (3D cup, menu, cup builder → WhatsApp) · franchisee portal (cashier with recipe-based inventory deduction, inventory, sales, analytics, settings) · Supabase backend.
- **Hosting:** Vercel (primary) + GitHub Pages (secondary), both free.
- **Languages:** English + Bahasa Indonesia.

## Confirm before/while building (see PLAN.md §3)

1. Bolognese Nachos is **63.6%** HPP (> 60% target) → suggest raising to **Rp 26.500**.
2. Golden Cheese Nachos is borderline at **60.9%** → suggest **Rp 17.500**.
3. **Fizzy Tea has no cost data** — assumed Rp 4.840 (same as Cloudy); replace later.
4. "Frizzy Tea" → standardized to **"Fizzy Tea"**.
5. WhatsApp numbers / email are **placeholders** until replaced.
6. 25 tasks in ~2 days is ambitious — order guarantees a shippable site early; 3D + polish trim first.

> These plans were reconstructed from a prior planning session's reasoning trace (`../New Text Document.txt`), which had already incorporated the team's answers (Vercel OK, packaging costs, etc.). Delete that scratch file once these docs are confirmed.

## Build progress

| Tasks | Status |
|-------|--------|
| 1 Scaffold (Vite/React/TS/Tailwind/Vitest/Playwright/ESLint, brand assets → `public/brand/`) | ✅ done |
| 2 Design system (tokens, fonts, brand primitives + tests) | ✅ done |
| 3 Domain logic (`data/*`, `lib/*`, TDD — 85 tests, HPP reconciled) | ✅ done |
| 4 App shell (router, layouts, i18n EN/ID parity, Lenis, checker transitions, 404) | ✅ done |
| 5 Menu page (tabs, cart store, live availability, printed-menu lightbox) | ✅ done |
| 6 Cup builder + checkout (steps → cart → receipt → WhatsApp link) | ✅ done |
| 7 Outlets (Craving Line SVG, cards, detail pages, bad-slug 404) | ✅ done |
| 8 Story + Franchise (calculator, multi-step Zod apply form → WA/mailto) | ✅ done |
| 9 Home 2D (skeleton-complete milestone) | ✅ done |
| 11 Supabase backend (4 migrations, seed.ts, verify-backend.ts, typed client) | ✅ done — needs human Supabase setup to run |
| 12–17 Portal (login/auth, dashboard, cashier POS, inventory, sales, analytics, settings) | ✅ done (static demo data + live RPC path) |
| 18–20 3D cup (toon model, CanvasShell, builder + lab integration) | ✅ done (realistic variant pending) |
| 21–23 Wow layer (lips cursor, kiss stamps + counter, `kecup` easter egg, magnetic CTAs, velocity marquee) | ✅ done |
| 24 QA | ✅ unit 147 · e2e 7 · lint/typecheck/build clean |
| 10 / 25 Deploy | 🔒 human-gated (Vercel + GH Pages accounts) — runbook in `RUNBOOK.md` |

Validation: `npm test` (147) · `npm run test:e2e` (7) · `npm run typecheck` · `npm run lint` · `npm run build` all green.
