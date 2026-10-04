# ADR-0070: Pad icons — IconifyJSON sets, `set:name` keys, up to 4 per pad

**Status:** Proposed
**Date:** 2026-10-04
**Slice:** Slice 15
**Refines:** ADR-0057
**Category:** Data model

## Context

The PAD editor keeps V1's scope (docs/product/README.md, pad options): up to 4 icons per pad.
V1 shipped about 2,300 pixel icons (813 pixelarticons and the 1,476 icons of Nikoichu's "1-bit
Pixel Icons", CC0) as SVG paths in one script file; a pad stored `icons: [{b: "<id>"}]`, up to
four, and showed one to four icons in a fixed arrangement. V3 so far has a single
`PadBase.iconRef` that nothing draws.

The owner chose the collection on 2026-10-04 from five free packs, on a selection page outside the
repository: 2,150 icons from Nikoichu (1,137), Kenney's "1-Bit Pack" (622), pixelarticons (358) and
Kacper Woźniak's "1-Bit Icons" (33); brand logos left out; Urizen set aside. Every icon got a
name, a category and search words, checked by the owner.

## Decision

Owner decisions 2026-10-04 (scheme, categories, keys, storage format, placeholder); the rest is
proposed for the owner's review.

1. **Storage: IconifyJSON**, one file per pack in `v3/src/icons/sets/<prefix>.json`
   ([IconifyJSON](https://iconify.design/docs/types/iconify-json.html)): `prefix`, `info` (name,
   version, author, license with SPDX id), `width`/`height`, `icons` (`body` = one SVG path of
   pixel rectangles, `fill="currentColor"`) and `categories`. A license that must travel with
   copies (MIT) has its text in `<prefix>.LICENSE.txt` next to the set.
2. **Keys `set:name`** (Iconify style, e.g. `nikoichu:dragon`): names are lower-case kebab-case and
   unique within a set ([Iconify icon names](https://iconify.design/docs/icons/icon-basics.html)).
   A name says what the icon shows, the object first, then the modifier
   ([Lucide naming conventions](https://lucide.dev/contribute/icons/naming-conventions),
   [Font Awesome](https://blog.fontawesome.com/icon-naming-conventions/)).
3. **Categories:** one per icon from a fixed list of 17 (people, creatures, animals, nature,
   weather, places, travel, weapons, magic, items, food, clothing, games, music, emotions,
   symbols, interface) — `ICON_CATEGORIES` in `v3/src/lib/iconSet.ts`.
4. **Search words:** `v3/src/icons/catalog.json` holds, per key, 1–8 lower-case English search
   words (synonyms and uses, not the name itself —
   [Lucide metadata conventions](https://lucide.dev/contribute/icons/metadata-conventions)) and
   the icon's original reference in its pack (provenance; no icon implemented twice).
5. **Generated, checked:** `npm run build:icons` writes sets and catalog from the curated working
   data in the owner's archive (the original packs are not part of the public repository);
   `v3/tests/unit/iconGuards.test.ts` checks every rule above, plus: no drawing twice, no brand
   name.
6. **Loading on demand:** nothing loads at start. `v3/src/lib/iconSet.ts` imports a set as its
   own chunk when a board shows its icons or the icon picker opens; the build precaches the
   chunks for offline use (ADR-0057). Measured: all four sets 993 KB, 145 KB gzipped.
7. **License notices:** `third-party-licenses.txt` gets a section "Icons", written from the sets'
   `info` and license texts (refines ADR-0057). CC0 asks for nothing; the authors are credited
   anyway. MIT requires its notice in copies.
8. **Pads** (owner decision 2026-10-04 — "up to 4 per pad", as V1): `PadBase.icons?: string[]`,
   up to `PAD_ICONS_MAX` = 4 keys, replacing `iconRef`. A pad without icons shows a placeholder
   per pad type (owner decision 2026-10-04).

## Consequences

**Positive:**

- One standard format for every pack; another pack (an own set, an AI test) is one more file.
- The key carries the provenance, so the same name in two packs is no conflict.
- Every rule of the scheme is checked by a test, not by memory.

**Negative / Trade-offs:**

- The sets are rebuilt from data outside the repository; without the archive only the shipped
  files can be edited.
- The packs mix grids (pixelarticons 24 px, the others 16 px) and drawing styles.

## Alternatives considered

**A compact bitmap per icon** (a hex string of the 1-bit grid): about a third of the gzipped size
(54 KB instead of 145 KB, measured on 2,605 icons), but an own format with own drawing code that
no tool reads — rejected by the owner for the standard.

**Unique names across all packs** (Lucide / Font Awesome style): needs invented modifiers for
about 93 names and more with every new pack — rejected by the owner for `set:name` keys.

## Related

- **Files:** `v3/src/icons/`, `v3/src/lib/iconSet.ts`, `v3/scripts/build-icons.ts`,
  `v3/tests/unit/iconGuards.test.ts`, `v3/vite.config.ts`
- **ADRs:** ADR-0057 (self-hosted assets and license notices), ADR-0048 (pad types)
- **Source documents:** [docs/product/README.md §5 Pad options](../product/README.md#pad-options),
  [v1-v2-inventory.md](../product/v1-v2-inventory.md)
- **Sources:** https://iconify.design/docs/types/iconify-json.html ·
  https://iconify.design/docs/icons/icon-basics.html ·
  https://lucide.dev/contribute/icons/naming-conventions ·
  https://lucide.dev/contribute/icons/metadata-conventions ·
  https://blog.fontawesome.com/icon-naming-conventions/
