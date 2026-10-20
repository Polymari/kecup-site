# KeCup — Copy Deck, Messaging & Asset Shot List

Bilingual content (English / Bahasa Indonesia), WhatsApp/mailto templates, and the full placeholder asset list. All user-facing strings live in `src/i18n/en.json` + `id.json`; a parity test asserts both files have identical key sets. **Brand name and menu item names stay untranslated**; descriptions, labels, and prose translate. Default language is detected from the browser locale (`id` prefix → Indonesian) and persisted to localStorage.

---

## 1. Voice

Playful, pun-forward, a little flirty but class-appropriate — the "kecup" (kiss) wordplay runs throughout. Keep it warm and confident ("big brand" energy) without overpromising. The tagline **"Keep Cravings in One Cup"** stays in English in both locales; the Indonesian build may add a subtitle.

## 2. Copy deck (selected keys)

### Navigation
| Key | EN | ID |
|-----|----|----|
| `nav.menu` | Menu | Menu |
| `nav.build` | Build a Cup | Rakit Cup |
| `nav.outlets` | Outlets | Outlet |
| `nav.franchise` | Franchise | Kemitraan |
| `nav.order` | Order | Pesan |
| `nav.cart` | Cart | Keranjang |

### Home / hero
| Key | EN | ID |
|-----|----|----|
| `hero.tagline` | Keep Cravings in One Cup | Keep Cravings in One Cup |
| `hero.sub` | Nachos on top. Tea below. One hand, zero drama. | Nachos di atas. Teh di bawah. Satu tangan, tanpa ribet. |
| `hero.ctaOrder` | Build your cup | Rakit cup-mu |
| `hero.ctaMenu` | See the menu | Lihat menu |
| `scroll.end` | Snack on top. Sip below. One hand. | Camilan di atas. Seruput di bawah. Satu tangan. |
| `explode.tray` | A tray of crunchy nachos, loaded with sauce | Nampan nachos renyah, penuh saus |
| `explode.tea` | Layered tea, chilled and ready to sip | Teh berlapis, dingin dan siap seruput |
| `explode.cup` | One connected cup — carry it all in one hand | Satu cup menyatu — bawa semua dengan satu tangan |

### Flavors / combos
| Key | EN | ID |
|-----|----|----|
| `flavors.title` | Pick your craving | Pilih cravings-mu |
| `combo.title` | The full kecup | Paket kecup lengkap |
| `combo.save` | Save up to Rp 7.000 vs ordering separately | Hemat sampai Rp 7.000 dibanding beli terpisah |
| `combo.bestValue` | Best value | Paling hemat |

### Builder steps
| Key | EN | ID |
|-----|----|----|
| `build.sauce` | Choose your sauce | Pilih saus |
| `build.sip` | Choose your sip | Pilih minuman |
| `build.combo` | Make it a Craving Cup? | Jadikan Craving Cup? |
| `build.qty` | How many? | Berapa banyak? |
| `build.review` | Review your order | Tinjau pesanan |
| `build.pickup` | Pickup time | Waktu ambil |
| `build.notes` | Notes | Catatan |
| `build.send` | Send via WhatsApp | Kirim via WhatsApp |
| `build.saved` | You saved Rp {amount} | Kamu hemat Rp {amount} |
| `build.closedNotice` | This outlet is closed right now — you can still send your order for later. | Outlet ini sedang tutup — kamu tetap bisa kirim pesanan untuk nanti. |

### Outlets
| Key | EN | ID |
|-----|----|----|
| `outlets.title` | Ride the Craving Line | Naik Craving Line |
| `outlets.open` | Open now | Buka sekarang |
| `outlets.closed` | Closed | Tutup |
| `outlets.orderHere` | Order from here | Pesan dari sini |

### Franchise
| Key | EN | ID |
|-----|----|----|
| `franchise.title` | Every neighborhood deserves a KeCup | Setiap lingkungan layak punya KeCup |
| `franchise.sub` | Own a KeCup cart, kiosk, or café. | Miliki gerobak, kios, atau kafe KeCup. |
| `franchise.calcTitle` | Estimate your earnings | Perkirakan pendapatanmu |
| `franchise.disclaimer` | Illustrative only, based on KeCup's recipe costs — not an earnings guarantee. | Hanya ilustrasi, berdasarkan biaya resep KeCup — bukan jaminan pendapatan. |

### Footer / misc
| Key | EN | ID |
|-----|----|----|
| `footer.tagline` | Sealed with a kecup. | Disegel dengan kecup. |
| `footer.disclaimer` | A BINUS venture-creation project. Outlets beyond BINUS Anggrek are illustrative. | Proyek venture-creation BINUS. Outlet selain BINUS Anggrek bersifat ilustrasi. |
| `error.404` | This cup's empty — let's get you a refill. | Cup ini kosong — ayo isi ulang. |

### Portal (abbreviated)
Keys cover: login (email/password/sign-in/error/demo button), dashboard KPIs, cashier (charge/payment/change/confirm/insufficient-stock), inventory (restock/count/waste/status), analytics labels, settings. Error strings like `portal.insufficientStock` ("Not enough stock to complete this sale" / "Stok tidak cukup untuk menyelesaikan penjualan ini").

## 3. WhatsApp order template (`lib/whatsapp.ts`)

Phone sanitized to digits with country code; message URL-encoded; opened via a real `wa.me` anchor. A short order code `KC-XXXX` (crypto-random) is generated client-side for reference.

**EN**
```
Hi KeCup {outlet}! 🧋🧀 I'd like to order:

{for each line}• {qty}× {item}{drink?} — Rp {lineTotal}
Total: Rp {total}
Pickup: {time}
Name: {name}
Notes: {notes}

Order code: {KC-XXXX}
(sent from the KeCup website)
```

**ID**
```
Halo KeCup {outlet}! 🧋🧀 Mau pesan:

{tiap baris}• {qty}× {item}{drink?} — Rp {lineTotal}
Total: Rp {total}
Ambil: {time}
Nama: {name}
Catatan: {notes}

Kode pesanan: {KC-XXXX}
(dikirim dari website KeCup)
```

Franchise apply uses a parallel builder (About you / Location & budget / Message) → WhatsApp or `mailto:` with a prefilled, locale-aware body.

## 4. Asset manifest & shot list (`data/photos.ts`)

Current real assets (move to `public/brand/`): `logo.jpeg`, `menu-1.jpeg` ("Make Your Own Cup"), `menu2.jpeg` ("Menu / cravings"). A `photos.ts` manifest maps each `photoKey` to a source or marks it missing, so photos drop in later with **no code changes**. Every missing photo renders the `Placeholder` component whose label **is** the shot instruction. The 3D cup covers the hero (a photo can't do the self-assembly), so these are mostly for cards and lifestyle.

| photoKey | Shot | Ratio |
|----------|------|-------|
| `hero-lifestyle` | Hand holding the stacked cup, outdoors/campus, cup self-assembling vibe | 4:5 |
| `combo-bolo` | Top-down Bolognese Craving Cup on cream | 1:1 |
| `combo-mush` | Top-down Mushroom Craving Cup on cream | 1:1 |
| `combo-cheese` | Top-down Cheesy Craving Cup on cream | 1:1 |
| `nachos-bolo` | Bolognese nachos tray, 45° | 1:1 |
| `nachos-mush` | Mushroom nachos tray, 45° | 1:1 |
| `nachos-cheese` | Cheese nachos tray, 45° | 1:1 |
| `tea-cloudy` | Cloudy (cheese-foam) tea, side-lit | 3:4 |
| `tea-fizzy` | Fizzy tea with ice, side-lit | 3:4 |
| `booth` | Campus booth / cart with branding | 16:9 |
| `team-1..n` | Team polaroids on checkered cloth | 1:1 |
| `ig-1..n` | Instagram-wall lifestyle shots | 1:1 |
| `outlet-{slug}` | Each outlet storefront | 4:3 |

Logo reused: footer, Story page, portal login. Favicon: a dedicated **lips SVG** (`public/favicon.svg`, referenced as `%BASE_URL%favicon.svg`).

> Note: `logo.jpeg` has a cream background that blends with the site background — fine for footer/about/favicon contexts; the hero uses the CSS-built Arch + 3D cup rather than the JPEG.
