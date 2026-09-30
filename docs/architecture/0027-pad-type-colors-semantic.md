# ADR-0027: PAD-Typ-Farben sind semantisch reserviert

**Status:** Accepted
**Date:** 2026-05-27
**Slice:** cross-cutting

**Category:** UI architecture

## Context

Die vier PAD-Typen (SINGLE, LOOP, PLAYLIST, COMBO) haben dedizierte Farben.
Diese Farben erscheinen an vielen Stellen: Pad-Spine (linke Leiste), Typ-Pill,
Mixer-Strip-Border, Bulk-Select-Highlight, Icon-Farbe. Das macht die Farbe zum
primären semantischen Signal für den Pad-Typ.

`design-sources/2026-05-25/HANDOFF.md §4.3` ist explizit: "Don't reuse these colors
for anything else."

> *Die Reservierung ist nicht als explizite Verbots-Regel in einem separaten
> Dokument festgehalten, aber konsistent im Design-System und in CLAUDE.md
> impliziert. Dieser ADR macht sie explizit.*

## Decision

Die vier PAD-Typ-Farben sind **exklusiv** für ihren Typ reserviert:

| Typ | Token | Farbe |
|-----|-------|-------|
| SINGLE | `--pad-single` | Warm Gold |
| LOOP | `--pad-loop` | Teal |
| PLAYLIST | `--pad-playlist` | Violet |
| COMBO | `--pad-combo` | Rose Magenta (#C9529D) |

Diese Farben und ihre Varianten (`--pad-*-soft`, `--pad-*-glow`) dürfen nicht
für andere semantische Zwecke verwendet werden (z.B. "success" oder "warning").

Für andere Semantiken: `--success` (teal alias), `--danger`, `--blood-bright`,
`--flame`.

## Consequences

**Positiv:**
- User lernen die Farbe → Typ-Mapping einmal; danach parst die UI bei einem
  Blick. Das ist ein nachgewiesenes Design-Prinzip aus V1.
- Theme-Anpassungen (Slice 8) können Pad-Typ-Farben pro Theme überschreiben,
  ohne die Semantik zu brechen (z.B. `.sb-theme-crimson { --pad-single: ... }`).

**Negativ / Trade-offs:**
- `--pad-combo` (Rose Magenta) ist nach einem Farbwechsel (Kupfer → Rose Magenta)
  ungewöhnlich. Das war eine bewusste Entscheidung um COMBO klar von SINGLE
  (Gold/Warm) und von LOOP/SETUP (Teal) zu trennen.

## Alternatives Considered

**Farben für andere Zwecke recyclen:** Z.B. Teal (`--pad-loop`) für "success".
Das würde "ist dieser Pad LOOP oder ist das eine Erfolgs-Anzeige?" mehrdeutig
machen. Klar nicht gewählt.

## Related

- **Dateien:** `v3/src/styles/tokens.css` (--pad-single, --pad-loop, --pad-playlist, --pad-combo und ihre Varianten)
- **ADRs:** ADR-0022 (Design Tokens), ADR-0026 (Mode-Toggle Tokens)
- **Quelldokumente:** `design-sources/2026-05-25/HANDOFF.md §4.3`, `CLAUDE.md §Design language §Color code rule`
- **Commits:** `eac8690` — refactor: align slice 1+2 (--pad-combo Kupfer→Rose Magenta)
