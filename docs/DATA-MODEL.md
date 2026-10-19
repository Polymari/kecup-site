# KeCup — Data Model, Costing & Business Logic

Single source of truth for brand data. These modules live in `src/data/*` as pure, framework-free TypeScript (relative imports only) so they can be imported by both the app and the `scripts/seed.ts` seed script. All money is in Indonesian Rupiah (Rp). "k" = thousands on customer-facing surfaces (e.g. `25k`); the portal shows full `Rp 25.000`.

> **Verification:** every HPP figure below reconciles with the team's own numbers. Reproduce the arithmetic in `lib/recipes.test.ts` so TS and SQL stay in agreement.

---

## 1. Menu items (`data/menu.ts`)

Each item has: `id`, `kind` (`snack` | `drink` | `combo`), `flavorKey?`, `drinkKey?`, `price`, `comparePrice?` (combos only), `photoKey`, and i18n `nameKey`/`descKey` (names stay untranslated; descriptions translate — see [`CONTENT.md`](./CONTENT.md)).

### À la carte

| id | Name | kind | Price | Description (EN) |
|----|------|------|-------|------------------|
| `nachos-bolo` | Meaty Bolognese Nachos | snack | 25.000 | Crunchy tortilla chips with rich minced beef sauce |
| `nachos-mush` | Creamy Mushroom Nachos | snack | 20.000 | Crunchy tortilla chips drizzled with creamy mushroom sauce |
| `nachos-cheese` | Golden Cheese Nachos | snack | 17.000 | Crunchy tortilla chips with rich melted cheese |
| `tea-cloudy` | Cloudy Tea | drink | 17.000 | Fresh brewed tea topped with silky cheese foam |
| `tea-fizzy` | Fizzy Tea | drink | 17.000 | Bubbly, tangy, ice-cold lemon tea |

### Combos — "Craving Cups" (snack + choice of drink + stacked cup)

Each combo references a snack + a drink choice (`tea-cloudy` or `tea-fizzy`); price is fixed regardless of drink. `comparePrice` = snack + drink à la carte, used to show the strike-through and computed savings.

| id | Name | Price | Compare (à la carte) | Savings |
|----|------|-------|----------------------|---------|
| `combo-bolo` | Bolognese Craving Cup | 35.000 | 42.000 | **7.000** |
| `combo-mush` | Mushroom Craving Cup | 31.000 | 37.000 | **6.000** |
| `combo-cheese` | Cheesy Craving Cup | 28.000 | 34.000 | **6.000** |

Drink choices surfaced to the customer: **Cloudy Tea** / **Fizzy Tea**.

## 2. Costing batches (`data/costing.ts`)

Brand-level reference data (not per-outlet). Each line carries a `cost` and an optional `estimate: true` flag (surfaced in the portal's "what-if" costing tool). Per-portion costs:

| Component | Per-portion cost | Basis |
|-----------|------------------|-------|
| Tortilla chips | 7.000 | flat (no batch detail available) |
| Bolognese sauce | 7.400 | batch of 6 |
| Mushroom sauce | 2.900 | batch of 6 ≈ Rp 17.450 |
| Cheese sauce | 1.850 | batch |
| Tea bag | 240 | per cup |
| Cheese foam | 2.600 | per portion |
| Fizzy base | 2.600 | **estimate** (assumed = cheese foam; no real cost provided) |
| Packaging — food tray | 1.500 | per snack |
| Packaging — drink cup + lid + straw | 2.000 | per drink |
| Packaging — stacked KeCup set | 3.500 | per combo (= tray + cup) |
| Ice | — | excluded from costing |

## 3. Recipes / Bill of Materials (`data/recipes.ts`)

Stock items are tagged by `category`: `food` | `drink` | `packaging`. A recipe is a list of `{ stockItemId, qty }`. **Combo deduction** pulls the **non-packaging** lines of its snack + its chosen drink, then adds its own `pack-stack` line (not the individual tray/cup). This is why `expand_requirements` in [`BACKEND.md`](./BACKEND.md) handles combos specially.

| Menu item | Recipe (stock item × qty) | HPP (sum) |
|-----------|---------------------------|-----------|
| Meaty Bolognese Nachos | chips 1 + sauce-bolo 1 + pack-food 1 | 15.900 |
| Creamy Mushroom Nachos | chips 1 + sauce-mush 1 + pack-food 1 | 11.400 |
| Golden Cheese Nachos | chips 1 + sauce-cheese 1 + pack-food 1 | 10.350 |
| Cloudy Tea | tea-bag 1 + cheese-foam 1 + pack-drink 1 | 4.840 |
| Fizzy Tea | tea-bag 1 + fizzy-base 1 + pack-drink 1 | 4.840 |
| Bolognese Craving Cup | chips 1 + sauce-bolo 1 + tea-bag 1 + (drink base) 1 + pack-stack 1 | ≈ 20.740 |
| Mushroom Craving Cup | chips 1 + sauce-mush 1 + tea-bag 1 + (drink base) 1 + pack-stack 1 | ≈ 16.240 |
| Cheesy Craving Cup | chips 1 + sauce-cheese 1 + tea-bag 1 + (drink base) 1 + pack-stack 1 | ≈ 15.190 |

"(drink base)" = `cheese-foam` if Cloudy chosen, `fizzy-base` if Fizzy chosen (both 2.600).

## 4. Unit economics (reconciled)

Target HPP ratio: **≤ 60%**. Pricing-insight rule: when HPP% > 60%, suggest a price = `ceil(HPP / 0.60)` rounded **up to the nearest 500**.

| Item | Price | HPP | HPP% | Profit | Flag |
|------|------:|----:|-----:|-------:|------|
| Meaty Bolognese Nachos | 25.000 | 15.900 | **63.6%** | 9.100 | ⚠ > 60% → suggest **26.500** |
| Creamy Mushroom Nachos | 20.000 | 11.400 | 57.0% | 8.600 | ok |
| Golden Cheese Nachos | 17.000 | 10.350 | **60.9%** | 6.650 | ⚠ borderline → suggest **17.500** |
| Cloudy Tea | 17.000 | 4.840 | 28.5% | 12.160 | ok |
| Fizzy Tea | 17.000 | 4.840* | 28.5% | 12.160 | *cost estimated |
| Bolognese Craving Cup | 35.000 | 20.740 | 59.3% | 14.260 | ok |
| Mushroom Craving Cup | 31.000 | 16.240 | 52.4% | 14.760 | ok |
| Cheesy Craving Cup | 28.000 | 15.190 | 54.3% | 12.810 | ok |

**Average combo profit ≈ Rp 13.950** (total 41.820 / 3). Payback (combo cups to recoup capital):

| Capital | Cups to break even |
|---------|-------------------:|
| Rp 500.000 | 36 |
| Rp 1.000.000 | 72 |
| Rp 2.000.000 | 144 |

## 5. Stock items & per-outlet levels (`data/stock.ts`)

Stock items (brand-level definitions): `chips`, `sauce-bolo`, `sauce-mush`, `sauce-cheese`, `tea-bag`, `cheese-foam`, `fizzy-base`, `pack-food`, `pack-drink`, `pack-stack`. Each tagged `food`/`drink`/`packaging`. `unit_cost` lives **per outlet** in `outlet_stock` (purchase prices differ by location); defaults seeded from §2.

Seeded initial levels create demo conditions:

- **BINUS Anggrek (flagship):** `sauce-bolo` **low** (below threshold → low-stock alert); `pack-stack` **low**.
- **Blok M:** `sauce-mush` **out (0)** → Mushroom Nachos **and** Mushroom Craving Cup auto-show **sold out** on the public site (good live demo).
- **Rawamangun:** `fizzy-base` **low**.
- All outlets: `pack-food` + `pack-drink` seeded healthy; one outlet carries a zero-stock item so a category auto-sells-out publicly.

Availability is computed from stock (see `get_outlet_stock_flags` in [`BACKEND.md`](./BACKEND.md)) and merged with manual sold-out overrides — the public site never sees raw stock numbers.

## 6. Outlets (`data/outlets.ts`)

Six outlets. **Only BINUS Anggrek is real** (real hours); the rest are fictional for the "big brand" presentation and are labelled in a configurable footer disclaimer. Each: `slug`, `name`, `area`, `address`, `mapsQuery`, `whatsapp` (placeholder), `hours` (per-weekday `{ open, close, closed }`), `lineOrder` (position on the Craving Line map).

| slug | Name | Area | Role |
|------|------|------|------|
| `anggrek` | KeCup BINUS Anggrek | Kemanggisan | Flagship (real) |
| `kemanggisan` | KeCup Kemanggisan | Kemanggisan | fictional demo |
| `blok-m` | KeCup Blok M | Jakarta Selatan | fictional |
| `kelapa-gading` | KeCup Kelapa Gading | Jakarta Utara | fictional |
| `rawamangun` | KeCup Rawamangun | Jakarta Timur | fictional |
| `bsd` | KeCup BSD | Tangerang Selatan | fictional |

Footer disclaimer (configurable in `config/site.ts`): a line noting this is a university venture-creation project and that outlets beyond BINUS Anggrek are illustrative.

## 7. Franchise packages (`data/packages.ts`)

Three cup-sized tiers. **All figures illustrative** and shown with a disclaimer (not an earnings guarantee).

| Tier | Format | Investment (illustrative) | Space | Staff | Default cups/day | Illustrative payback |
|------|--------|---------------------------|-------|-------|-----------------:|---------------------|
| Regular | Cart | Rp 15–25 jt | 2–4 m² | 1 | 40 | ~3.8 months |
| Large | Kiosk | Rp 40–70 jt | 6–12 m² | 2–3 | 90 | net ≈ Rp 12 jt/mo |
| Jumbo | Café | Rp 120–200 jt | 20–40 m² | 4–6 | 200 | ~9.5 months |

Fictional royalty 5% of revenue, marketing 2%. The default of **40 cups/day** for a cart (not 60) keeps the Regular payback realistic.

### Earnings calculator (`lib/franchise.ts`)

Inputs: daily cup volume, operating days/month, combo mix %, average combo & à-la-carte price/COGS (defaults from §4), monthly rent, staffing, utilities, royalty %, marketing %.
Outputs: revenue, COGS, gross profit, royalty + marketing spend, fixed opex, **net monthly profit**, **payback period** (investment / net monthly profit), and **break-even cups/day** = `fixed costs ÷ margin per cup`.
Pure and unit-tested with the expected outputs per tier.

## 8. Business logic libraries (`src/lib/*`, all TDD)

| Module | Responsibility | Key test cases |
|--------|----------------|----------------|
| `money.ts` | `formatRupiah` (id-ID; strip the non-breaking space), `formatK` ("25k") | NBSP handling; rounding |
| `wib.ts` | Asia/Jakarta (UTC+7, no DST) helpers: components, `dateKey` (`YYYY-MM-DD`), key→UTC-midnight | boundary crossings |
| `hours.ts` | `isOpenNow(outlet, now)` → status + reason; `pickupSlots` (15-min, within open hours; "ASAP") | closed day, before open, after close |
| `recipes.ts` | `expandRequirements(lines)`, `computeCogs`, `checkAvailability(flags, overrides)`, `fulfilCheck(onHand)` | combo expansion; fractional usage; matches SQL COGS |
| `pricing.ts` | HPP%, 60% target, suggested price (ceil → nearest 500) | Bolognese→26.500, Cheese→17.500 |
| `whatsapp.ts` | sanitize phone, build order message (items/total/pickup/notes, URL-encoded, emoji), `KC-XXXX` order code (crypto) | phone sanitization; URL encoding |
| `franchise.ts` | calculator (§7) | per-tier expected outputs |
| `analytics.ts` | summarize revenue/COGS/profit/avg-ticket; by-day (zero-fill); hour×weekday matrix; top items; product mix; payment split; unit economics; payback | **voided sales excluded**; WIB bucketing |
| `prng.ts` | deterministic seeded PRNG (seed from outlet slug + date) | reproducible sequence |

## 9. Seed data model (synthetic sales — `scripts/seed.ts`)

Generates ~30 days / ~1200 sales so analytics look real. Deterministic PRNG seeded per outlet + date.

- **Per-outlet daily volume:** flagship busier on weekdays, closed Sundays; mall outlets vary weekday/weekend.
- **Hourly weights:** campus profile (lunch + afternoon peaks) vs mall profile (lunch + evening); filtered to open hours.
- **Trend:** gradual ramp-up over the window + one promo spike ("Kecup Day").
- **Basket:** 1–N line items; combo-heavy mix (combos are the push), plus à-la-carte snacks/drinks.
- **Payment:** QRIS vs cash split; cash rounded.
- **Voids:** ~1% with a fixed reason code (excluded from analytics).
- **COGS:** computed with the same `computeCogs` the app uses (consistency).
- Final stock levels set directly (not deducted sale-by-sale) and nudged to create the low/zero conditions in §5.
- Demo franchisee: `anggrek.franchisee@example.com` (safe `.example` domain), password from env.

See [`BACKEND.md`](./BACKEND.md) for how these rows map to the schema and the atomic sale flow.
