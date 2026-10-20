# KeCup — Design System, Interaction & 3D

How the site looks, moves, and is built visually. Mood: **retro-diner meets playful fast-food** — checkerboard, groovy rounded type, kiss marks, sparkles, warm colors — pulled straight from the logo and the two printed menus. Everything has a calm `prefers-reduced-motion` fallback.

---

## 1. Brand palette (`globals.css` `@theme` tokens)

Derived from the logo (warm) with lime/burgundy accents from the printed menus.

| Token | Role | Approx. |
|-------|------|---------|
| `--cream` / `--cream-deep` | page background / section shade | `#FBF4E3` / `#F2E6C9` |
| `--butter` / `--sun` | arch / warm highlights | `#F7D774` / `#F2B705` |
| `--ketchup` | accent, lips, big headings | `#E23B2E` |
| `--checker` | checkerboard red (deeper) | `#B01E2E` |
| `--ink` | **body text** (maroon-brown, not black) | `#4A1512` |
| `--brick` | outlines / arch stroke | `#7A1F1A` |
| `--tangerine` | SVG text outline, accents | `#E8641E` |
| `--gold` | chip tone | `#E0A32E` |
| `--lime` | menu accent, "best value" chips | `#CBE07A` |

**Contrast rules (WCAG):** ketchup-on-cream fails 4.5:1 for body text, so **body copy uses `--ink`**; ketchup is reserved for large headings (≥ 3:1 is enough at display sizes). Verify white-on-ketchup for buttons passes. Status colors (low stock, sold out, open/closed) map onto the brand palette.

## 2. Typography

Self-hosted via `@fontsource` (no external requests — matters for GH Pages):

| Role | Font | Notes |
|------|------|-------|
| Display / headlines | **Fredoka** (variable, weight 600–700, width axis) | rounded, matches the "KeCup" wordmark |
| Chunky marquee / huge type | **Lilita One** / **Bagel Fat One** | fat retro display |
| Script accent ("cravings") | **Sacramento** | thin monoline, closest to the menu's cursive |
| Body | **Plus Jakarta Sans** | designed for Jakarta's city branding — nice narrative tie-in |
| Receipts / cashier / order codes | **Space Mono** | receipt motif |

Display scale uses `clamp()` for fluid oversized headings.

## 3. Recurring visual motifs (brand primitives)

Reusable components in `components/brand/`:

- **CheckerBand** — red/white checkerboard via CSS gradients (no image); animates in as a flipping wave.
- **Arch** — the logo's arch shape, reused as a frame for images/windows/3D stages, with a brick stroke.
- **Wordmark** — "KeCup" as **SVG text** with fill + stroke + `paint-order` (more reliable cross-browser than CSS text-stroke); ketchup fill, tangerine outline.
- **Lips** — custom SVG path; used for the cursor, click stamps, favicon, decorative scatter.
- **Sparkle** — the four-point star from the menus; gentle twinkle.
- **Drip** — SVG sauce drip for section-edge dividers; morphs between flavor colors.
- **Sticker** — rotated "NEW!" / "BEST VALUE" labels with ink border + offset shadow (neo-brutalist).
- **PriceTag** — sticker-style price chip, supports strike-through compare price.
- **Placeholder** — checkered frame + diagonal stripes + camera icon + label; stands in for every missing photo and doubles as a shot list (label = exactly what to photograph).
- **GrainOverlay** — subtle noise texture over the page.
- **Marquee** — tilted scrolling ribbon rows; velocity-reactive (Task 22).
- **Badge / Card** — ink border + offset shadow sticker cards.

Buttons: pill-shaped, thick ink border, squishy "pressed" animation (jelly), magnetic hover (follows cursor via GSAP `quickTo`) on fine-pointer devices.

## 4. Layout principles

Deliberately non-generic: broken grids, overlapping stickers, rotated text, horizontal-scroll sections, pinned 3D elements, oversized type. The **arch** is a recurring framing device. Each section transition is a real layer of the product (background shifts cream → chip-gold → sauce-red → foam-white → tea-amber as you descend "down the cup").

## 5. Interaction & animation layer

**Library division:** GSAP owns scroll, 3D scrubbing, and SVG (DrawSVG/MorphSVG/MotionPath); Motion owns component UI (modals, builder steps, layout). Lenis provides smooth scroll, **public layout only**, wired into the GSAP ticker; disabled entirely under reduced motion. Register **all** GSAP plugins in one central `anim/gsap.ts`; scope with `useGSAP` so ScrollTriggers clean up on unmount; reset scroll + `ScrollTrigger.refresh()` on route change.

Signature effects:

- **Preloader** — cream overlay, bouncing Fredoka wordmark, an SVG cup that fills as progress completes (progress weighted by `document.fonts.ready` + Canvas `onCreated`), then a checker-wipe reveal.
- **Page transitions** — a grid of checker cells scaling in/out from the click origin (~0.65s each way); simple fade under reduced motion; portal routes skip it.
- **Lips cursor** — only on fine-pointer devices; follows the mouse smoothly, puckers/scales on hover over interactive elements; native cursor hidden except over text inputs (switches to text caret). Click on empty space stamps a fading lip (randomized rotation/color, pooled to ~10). Never blocks keyboard scrolling.
- **Velocity marquee** — two rows opposite directions; speed tied to Lenis scroll velocity, direction flips on scroll-up.
- **Flavor switcher** — pick a sauce → background floods that sauce's color + a "splat" squash on the 3D cup + a morphing Drip divider between flavors (circular clip-path reveal).
- **Easter eggs** — type `kecup` anywhere → lips confetti (Physics2D); logo-tap → confetti; footer **kiss counter** (localStorage).
- **Micro-delight** — sticker hover wiggle, jelly wordmark in the footer, number-roll price tickers, receipt "print" slide-out, "KECUP!" stamp on WhatsApp send.
- **Sound** — optional "mwah" on stamp, **off by default** behind a toggle (and only if an audio asset is added).

## 6. Page specs

### Home (`/`)
Preloader → **pinned 3D hero "Assembly"**: before scroll, an autoplay intro — checker floor tiles flip in, the cup drops with squash-and-stretch, tea rises (ice plops in), the tray clicks on top, chips rain down (staggered instanced arcs), sauce lands, the straw stabs through, headline characters rise (SplitText), a kiss stamp slams onto the word "Cup" with a tiny camera shake, CTAs fade up, cup idles with a slow spin + bob. Then **scroll-driven**: headline exits, camera orbits, the cup **explodes** into an annotated exploded-view (tray / chips / sauce / tea / cup) with leader lines drawn via DrawSVG, then reassembles and spins 360° into the closing line *"Snack on top. Sip below. One hand."* Mobile: shorter pin, annotations stacked below; reduced motion: skip intro, static poster.

Then: velocity marquee → flavor switcher → **one-hand** section (hand SVG holds the cup, rolling text of what the free hand is doing) → combos (discounted sticker cards, "Save 7k") → draggable Instagram wall of polaroids (inertia; tap-to-front on touch) → outlets teaser (Craving Line preview) → franchise teaser (cups multiplying) → footer (kissing wordmark + kiss counter + disclaimer).

### Menu (`/menu`)
Header styled like the printed menu with a Sacramento "cravings" script overlay. Tabbed sections, **combos first** (the business push) with "Best value" stickers showing computed savings. Each card: Placeholder photo, name, i18n description, PriceTag (strike-through for combos), "Add to cup" with hover tilt (3D), peeling sticker corner, lips-stamp on add. An **outlet selector** at the top live-updates sold-out badges from availability. A lightbox shows the actual printed menu images (reused as real assets).

### Cup Builder (`/build`)
Left: step panel (bottom-sheet on mobile). Right: sticky 3D stage in an Arch frame on a checker floor. Flow: pick sauce (big circular blob buttons that recolor the cup) → pick sip (Cloudy/Fizzy — liquid changes) → make it a combo? / quantity → cart drawer. Cart: line items + qty steppers, outlet selector (open/closed status), customer name, pickup time picker (ASAP or 15-min slots within business hours, WIB), notes. Live price with rolling ticker + "you saved Rp 7.000". Checkout plays a receipt "print" animation, then a visible **"Send via WhatsApp"** anchor (`wa.me` deep link with the pre-filled, URL-encoded message — a real anchor, not `window.open`, to survive popup blockers) with a "KECUP!" stamp on tap. Standalone snacks/drinks are still orderable from the Menu's add-to-cart. Sold-out items are disabled with a reason; closed-outlet shows a notice but still allows messaging. Cart persists via Zustand `persist`.

### Outlets (`/outlets`, `/outlets/:slug`)
**"The Craving Line"** — a transit-map metaphor: an animated SVG line (station positions via `getPointAtLength` so they're not hand-placed) that draws in on scroll, a tiny cup icon traveling along it, station dots that pop open into outlet cards (hours, WhatsApp, Maps link, "Order from here"), live open/closed dots computed against WIB. Plain-list fallback for accessibility. Avoids any mapping dependency. Detail page: hero, status badge, today-highlighted hours table, live availability, quick WA + Maps actions. Unknown slug → 404.

### Franchise (`/franchise`)
Hero: a 3D grid of low-poly MiniCups popping up in a rippling checkerboard ("one cup becomes many"); 2D fallback. Stats (grounded fictional unit economics — drink HPP%, avg profit/cup, break-even cups). Packages: Regular / Large / Jumbo as cups of increasing size with a hover liquid-fill, each listing investment range, space/staff, inclusions, "Pick this size" (preselects the apply form). Illustrative **profit calculator** with sliders → animated results card (revenue/COGS/opex/profit bar chart, payback, break-even cups/day) + disclaimer. A 5-step "how it works" scroll path with a chip rolling along it. FAQ accordion (Radix). Multi-step apply form (About you / Location & budget / Message) with Zod validation → WhatsApp or mailto, lips-confetti on send.

### Hidden lab (`/lab/cup`, `/lab/brand`)
Not in nav, reachable by URL. `/lab/cup`: toon vs realistic cup side-by-side with FPS readout and tiny custom sliders (no `leva`). `/lab/brand`: the styleguide of all primitives.

### Portal (`/portal/*`)
Calmer on-brand mode: cream background, neo-brutalist sticker cards (ink border + offset shadow), checkered sidebar.
- **Login** — split screen, animated lips; shake-on-error, kiss-stamp + circular clip-path reveal on success; optional "use demo account" button.
- **Dashboard** — greeting, today's KPIs, stock alerts, status toggle, 7-day sparkline.
- **Cashier** — tablet-friendly, large flavor-colored item tiles, combo popover, cart sidebar, Cash/QRIS with quick-tender buttons + change calculator, charge button, success toast with ingredient-deduction ticker, items auto-disable on insufficient live stock.
- **Inventory** — stock table (item / category / on-hand / threshold / status chip), restock / adjust / waste modals, movement ledger.
- **Sales** — list, expand, void, CSV export.
- **Analytics** — daily revenue+profit area chart, top-items bar, product-mix + payment-split donuts, hour×weekday CSS-grid heatmap, unit-economics table (price / HPP / profit / units sold) with pricing-insight flags when HPP% > 60%, payback widget (capital → cups needed), editable costing what-if cards ("apply new cost" → updates outlet `unit_cost`). All brand-colored (Recharts).
- **Settings** — outlet profile (WhatsApp/IG, validated), per-day hours editor (close-after-open validation), temporary-closure toggle, per-item "sold out today" switches; optimistic save + toast; changes go live immediately (Realtime).

## 7. 3D cup implementation (`src/three/`)

**Styles:** **toon** (default, `CUP_STYLE='toon'` in `config/site.ts`) and **realistic** (lab comparison). A material-factory hook composes parts so both styles share geometry.

- **Toon:** `MeshToonMaterial` with a 3-tone gradient map + drei `Outlines` (world-unit thickness, crease angle) for the inked edge. Use the `flat` Canvas prop / `toneMapped={false}` (R3F defaults to ACES tone mapping which would shift brand colors). Transparent canvas background so a CSS gradient shows through.
- **Realistic:** `MeshTransmissionMaterial` (glass cup/tray) with a `MeshPhysicalMaterial` fallback on low-end devices; chips get a procedural noise speckle; sauce a clearcoat. Lighting from procedural `Lightformer` children (no external HDRI) + `ContactShadows`.

**Geometry (`geometry.ts`):**
- **Cup** — tapered lathe/cylinder (logo proportions).
- **Tray/bowl** — lathe with a curved outer wall + a central cylindrical **straw sleeve**, nested into the cup rim (~y≈1.92).
- **Chips** — 36 rounded-triangle extruded shapes, slightly bent per instance, placed in a seeded random mound (instanced, per-chip tilt + slight color variance), some poking above the rim.
- **Sauce** — simplex-noise-displaced icosahedron flattened onto the mound + a few animated drip capsules + scattered tiny dodecahedrons for "bits" (bolognese/mushroom/cheese variants with their own colors).
- **Drink** — stacked individual cylinder layers (each its own color) matching the logo's layered look; fill animated via a **clipping plane** at the fill height + a cap disc at that radius (not geometry regeneration — the taper would make scaling poke through the walls). `localClippingEnabled` set on the GL instance in `onCreated` (not as a prop). Outlines skipped on the hidden drink. Cloudy = darker base → warm mid → creamy foam top; Fizzy = two-tone + rising bubble instances. Ice = light-blue translucent `RoundedBox`, visible once fill rises past them.
- **Straw** — translucent cylinder through the sleeve.

**Animation state:** a plain proxy object (`fill`, `drop`, `chips`, `sauce`, `explode`, …) tweened by GSAP and read in `useFrame` — **never per-frame React state**. The clipping-plane constant is recomputed each frame relative to the cup group's world position (the group bobs/drops/scrolls). Flavor swap: sauce squashes down, swaps, pops back (elastic), chips wobble.

**`CanvasShell`:** WebGL2 check → static Arch+logo poster fallback for unsupported/reduced-motion/low-end; one Canvas per section with capped `dpr`; `frameloop` toggled by an IntersectionObserver (pause offscreen); drei `PerformanceMonitor` drops `dpr` / disables transmission on decline; three.js lazy-loaded behind Suspense (keeps the home bundle light). Home uses at most two canvases (shared hero↔exploded sequence + flavor switcher); the Builder has its own; the franchise grid uses lightweight MiniCup instances (cup + tray + blob only) to keep ~35 instances performant.

**Testing:** 3D visuals aren't unit-tested — cover pure logic (chip placement, radius math, layer configs) and rely on a Playwright smoke test that the canvas mounts without console errors; `CanvasShell` is mocked in jsdom.
