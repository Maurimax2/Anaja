# Design direction — القابضة للتجارة والخدمات

Status: **awaiting sign-off.** Pages are not built yet. This document records what the
source files actually contain, the palette derived from the logo, and the four decisions
that need an answer before the build starts.

Visual version of this document: published as an artifact in the originating session.

---

## 1. What arrived

The upload (`AlQabida.zip`) is a flat folder of **34 JPEGs**. There is no
`assets/logo.zip` as the brief describes — the logo is one file sitting among the
photographs:

| | |
|---|---|
| Logo | `6891d4f1-b6d8-4fd0-af9c-fd6c78f7d06a.JPG`, 1024×1024 |
| Product/showroom photos | 33 files, phone-shot, 24 KB – 312 KB |
| Vector source | none |
| Transparent version | none |
| Alternate sizes | none |

`f3359d9f-…-83d265a30b6c.JPG` and `f3359d9f-… 2.JPG` are duplicates.

### Derived assets committed here

| Path | What it is |
|---|---|
| `assets/logo/logo-original.jpg` | untouched source |
| `assets/logo/logo-neon.png` | background keyed out by luminance, glow un-premultiplied, trimmed to content (848×516) |
| `assets/logo/logo-mark.png` | the Q device alone, for favicon and compact header (356×516) |

1024px is the ceiling. Good enough for a header lockup and a favicon; it will not hold up
on a large hero or in print. **Ask the client for the vector original.**

---

## 2. Palette

The brief asks for "one metallic accent (brass/gold) pulled from the logo itself."
The logo contains no gold. Sampled by hue — every 2nd pixel, 10° bins, filtered to
S > 0.25 and V > 0.30 to discard the navy ground and blown-out glow cores:

| Role | Hex | Share |
|---|---|---|
| Neon ground | `#14092B` | ~61% of pixels |
| Cyan — wordmark, inner ring | `#2FD4DC` | largest chromatic area |
| Electric blue — outer arc, faucet | `#2B4FC0` | |
| Amber — lightning bolt | `#F0951B` | |
| Bolt core | `#FFC845` | |

**Resolution.** The amber bolt is a legitimate parent for a brass tone: darkened and
desaturated it lands on a warm metallic that is genuinely logo-derived *and* passes text
contrast on bone. Cyan gets the same treatment and becomes the functional accent — links,
focus rings, in-stock dots — never a decorative surface, so it stays crisp instead of
fighting the warm ground.

Tokens live in `css/tokens.css`. Contrast, measured:

| Pair | Ratio | |
|---|---|---|
| Ink `#1B1630` on bone `#FAF8F5` | 16.45:1 | AA / AAA |
| Body `#3A3348` on bone | 11.34:1 | AA / AAA |
| Muted `#6B6478` on bone | 5.33:1 | AA |
| Brass `#8A6212` on bone | 5.16:1 | AA |
| Teal `#0E6A72` on bone | 5.96:1 | AA |
| Raw amber `#F0951B` on bone | 2.20:1 | **fails** |
| Raw cyan `#2FD4DC` on bone | 1.71:1 | **fails** |
| Bone on ink `#1B1630` | 17.54:1 | AA / AAA |
| Raw cyan on ink | 10.25:1 | AA / AAA |
| Raw amber on ink | 7.99:1 | AA / AAA |

The dark is **indigo-biased `#1B1630`**, not a neutral charcoal — descended from the
logo's own ground, which keeps brass warm against it.

---

## 3. The logo needs a dark ground

Not a taste call. The cyan wordmark on bone is 1.71:1, and because the glow was baked into
the JPEG, keying the background out leaves a halo that reads as grey smudge on anything
light.

**Treatment:** an ink header band and ink footer bracketing a bone-and-sand body. The mark
appears as drawn, the site gets a branded frame, and the two raw neon values become usable
at full strength inside those bands.

---

## 4. Typography

**IBM Plex Sans Arabic**, self-hosted in `fonts/`, eight `woff2` files, 251 KB total,
split by `unicode-range` so a typical Arabic page pulls ~86 KB. No CDN call.
Licence: SIL OFL 1.1, `fonts/OFL.txt`.

Chosen over Tajawal because it carries a true 500 and 600, so hierarchy can be built from
weight rather than size alone — which keeps a catalogue page calm. Arabic body copy runs
at 1.95–2.05 line-height.

---

## 5. The catalogue is not what the brief says

The brief lists lighting, ceramics, decor and furniture. All 33 photos reviewed:

| Category | Photos | Contents |
|---|---|---|
| **إضاءة** — Lighting | ~15 | LED ceiling plafonniers, crystal ring/square chandeliers, gold pendant clusters, fans with light rings |
| **أثاث الحمام** — Vanities | ~9 | Wall-hung units with marble/stone tops, ceramic and cabinet basins, mirror cabinets |
| **خلاطات** — Taps & showers | ~5 | Matte black and gunmetal mixers, thermostatic shower columns, bidet sprayers |
| **مرايا** — Mirrors | ~4 | LED backlit mirrors with touch switch, framed decorative mirrors |
| Ceramics / decor / furniture | 0 | Not stocked. Marble tile appears only as showroom floor and wall. |

The logo agrees with the photographs: a **faucet** and a **lightning bolt**. This is a
plumbing-and-electrical showroom, not a decor boutique.

The photographs are in-situ phone shots — stacked cartons, showroom mirrors, staff
reflected in them. They are **not** catalogue cutouts, which is why the brief's
"cut-out PNG on a sand tile" treatment cannot be applied uniformly.

---

## 6. Open decisions

1. **Categories** — ship إضاءة / أثاث الحمام / خلاطات ومغاسل / مرايا instead of decor and
   furniture? *Recommended: yes, and stub the other two as empty arrays in
   `products.json` so they can be filled without a code change.*

2. **Product images** — `rembg` will do a clean job on the ~8 product-on-white shots and a
   poor one on the in-situ photos. *Recommended: cutouts where they work, framed photo
   tiles where they don't, one card component handling both; `prepare-images.py` gets a
   `--frame-only` mode.*

3. **Prices** — nothing in the archive carries one. A WhatsApp order quoting an invented
   total is worse than no price. *Recommended: build a `"price": null` path rendering
   "السعر عند الطلب" and omitting the total from the order message.*

4. **Photo rights** — two images carry a **HYSHIN** supplier watermark and several are
   manufacturer catalogue renders rather than the client's own work; two showroom photos
   contain **identifiable staff faces** reflected in mirrors. *Recommended: exclude both
   sets from the seed data pending confirmation.*
