# KeCup — Demo-Day Runbook

## 1. Before any demo (Supabase free tier pauses on inactivity)

1. Open the Supabase project dashboard → it wakes the database.
2. Confirm the project is **not** paused (top banner).
3. Re-seed so charts look fresh:
   ```powershell
   npm run seed -- --reset
   ```
   (~30 days / ~1200 sales regenerate deterministically; the `--reset` flag wipes
   sales, movements and overrides first.)
4. Run the backend verification and confirm all checks pass:
   ```powershell
   npm run verify:backend
   ```
   Expected: `verify: 13/13 checks passed` (RLS isolation, atomic sale, void
   rollback, column grants).

## 2. Environment checklist (`.env.local`, gitignored)

| Variable | Purpose |
|----------|---------|
| `VITE_SUPABASE_URL` | project URL (safe to ship) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | client key (safe to ship — RLS protects data) |
| `VITE_DEMO_LOGIN_EMAIL` | demo franchisee email (shown on the login demo button) |
| `VITE_DEMO_LOGIN_PASSWORD` | demo password (intentionally public — see risks) |
| `SEED_DEMO_PASSWORD` | same password, used by seed/verify (server-side) |
| `SUPABASE_SECRET_KEY` | service-role key — **server-side only, never `VITE_`** |

Without Supabase env vars the site runs in **static demo mode**: the portal works
against generated demo data, the public site uses the seeded dataset. This is the
fallback if the database is unreachable mid-presentation.

## 3. Demo script (5 minutes)

1. **Public site** — Home: hero, marquee, flavor switcher → Menu (combos first,
   printed-menu lightbox) → Builder: pick sauce + sip, watch the 3D cup update →
   Checkout → receipt → *Send via WhatsApp* (real `wa.me` link).
2. **Outlets** — Craving Line with live open/closed dots; Blok M shows Mushroom
   items auto-sold-out (stock is zero there).
3. **Portal** (`/portal/login` → *Use demo account*) — Dashboard KPIs + 7-day
   sparkline → Cashier: record a sale, watch the ingredient-deduction ticker and
   stock drop → Inventory: restock/waste + movement ledger → Sales: void a sale
   (stock restores) → Analytics: unit economics flags Bolognese at 63.6% and
   suggests Rp 26.500 → Settings: toggle "sold out" and open the public Menu to
   see it flip live.
4. **Wow layer** — click empty space for kiss stamps (footer kiss counter), type
   `kecup` anywhere for the lips burst.

## 4. Deployment

- **Vercel** (primary): import the repo — `vercel.json` rewrites all routes to
  `index.html`. Set the two `VITE_SUPABASE_*` env vars in project settings.
- **GitHub Pages** (secondary): push to `main` — the `deploy-pages.yml` workflow
  builds with `VITE_BASE=/<repo-name>/` and deploys `dist/` (includes `404.html`
  + `.nojekyll` for SPA routing).

## 5. Known demo risks

- The demo login password is public (it ships in the client bundle) — anyone can
  alter demo data. Keep `npm run seed -- --reset` handy, or set
  `showDemoLogin: false` in `src/config/site.ts` for a real deployment.
- WhatsApp numbers and the partnership email are **placeholders**; the order
  button opens a valid `wa.me` link that reaches nobody until replaced.
- Fizzy Tea's cost (Rp 2.600 base) is an assumption — replace in the portal
  costing tool when the real figure arrives.
