# ADR-0045: Two-axis adaptive model — one app, no separate systems

**Status:** Accepted
**Date:** 2026-06-04
**Slice:** cross-cutting
**Refines:** —
**Category:** UI architecture

## Context

The project originally held (docs/backlog.md, stable directions) the directional decision
"Desktop after mobile; two separate interaction systems": mobile and desktop as two separate
systems, split by **input type** (touch vs. mouse/keyboard), with desktop as a later separate
block. In parallel a question came up: how should the app switch between the mobile and the
desktop view, and how is the device detected?

This framing showed weaknesses:
- Modern devices blur the old mobile/desktop boundary (touch laptops, phones operated with a
  mouse, tablets with keyboards).
- The detection and version-switching problem is hard to solve in principle — there is no
  reliable automatic mechanism that classifies every hybrid device correctly.
- "Request Desktop Site" on iOS only changes the user-agent string, not the physical viewport
  and not the `pointer` media query — a UA-based switch would be unreliable.

## Decision

The app is **ONE adaptive application** — no separate versions, no version switch. The
presentation adapts along **two independent axes**:

### Axis 1 — screen format (spatial layout)

Determines **where** elements sit. Narrow/portrait → dock bar at the bottom, thumb zone.
Wide/landscape → side rail, more simultaneity, less "reach"-based layout. This is the
responsive axis (CSS breakpoints).

**Important:** the docking edge (bottom bar vs. side rail) depends on the **screen format**,
NOT on the input type. A phone operated with a mouse keeps its bar at the bottom — because a
side rail is unsuitable in narrow portrait, not because it is touch.

### Axis 2 — input type (additive capabilities)

Determines **what** one can do, without changing the spatial layout. Touch is always the base
(works everywhere): gestures (swipe, long hold), large targets. When a mouse/keyboard is
present, **ADDITIONAL** capabilities come on top: hover tooltips, right-click menus, keyboard
shortcuts. Progressive enhancement, not a separate version.

### Independence of the axes

All four combinations make sense: narrow + touch, narrow + mouse, wide + touch, wide + mouse.
The current mobile prototype is the "narrow + touch" region; the existing app code is the
"wide + mouse" region. Both are regions of ONE adaptive app.

### Boundary to ADR-0032

Axis-1 frame layout adaptation (where sidebar/bands sit, depending on the screen format) ≠ the
pad grid column reflow that ADR-0032 addresses. ADR-0032 forbids automatic reflow of the
**pad grid column count** (the pads themselves). Axis 1 concerns the **surrounding frame
layout**. Both are independent; no contradiction.

### Density / target size

"Denser targets" belongs to axis 1 (screen size → larger screens allow denser layouts), NOT
to axis 2 (input type). The touch minimum size (~44 px) applies as the base for all inputs. A
mouse hits large targets without problems; no input-type-driven density change is assumed. If
denser layouts are ever wanted, they belong to axis 1, large screen — not built in here.

### Detection

- **Screen format (axis 1):** standard CSS breakpoints. The exact thresholds are determined
  empirically on real devices — not fixed yet.
- **Input type (axis 2):** `pointer: coarse/fine` and `hover` media queries / Pointer Events
  API. That is the established, reliable web standard.
- **Not usable:** a browser UA-based switch ("Request Desktop Site" on iOS only changes the
  UA; viewport and the `pointer` query stay unchanged — unreliable and unnecessary under the
  adaptive model).

## Consequences

**Positive:**
- The detection and version-switch problem dissolves: no exclusive versions → nothing to
  switch, nothing to detect wrongly.
- Hybrid devices (touch laptop, mouse on a tablet) are handled correctly: axis 1 adapts the
  layout, axis 2 adds extras — no wrong classification into one category.
- The existing desktop app code and the mobile prototype are already two regions of the ONE
  app; no parallel development of two systems.
- A clear principle of responsibility: "Does where something sits change?" → axis 1. "Is an
  action added?" → axis 2.

**Negative / Trade-offs:**
- The exact breakpoint thresholds (from which point the sidebar moves from the bottom to the
  left) are not fixed yet — empirical calibration on real devices is needed.
- Existing code and design artefacts that imply the old split have to be adapted step by step
  (work that starts when the mobile prototype grows into the app).

## Alternatives considered

**Two separate systems (rejected):** the original direction — mobile and desktop as separate
systems, split by input type. Rejected because hybrid devices cannot be assigned cleanly to
either category and the detection/switch problem is unsolvable in principle.

**UA-based switch:** "Request Desktop Site" as the trigger. Rejected: iOS only changes the UA
string, not the viewport and the `pointer` query — a false positive on the most common use
case.

## Related

- **ADRs:** ADR-0006 (platform targets, API availability), ADR-0032 (pad grid 4 columns
  constant — boundary to axis 1, see above)
- **BACKLOG:** §Stable Directions → "Two-axis adaptive model" (replaces "Desktop after mobile;
  two separate interaction systems")
- **Source documents:** `docs/backlog.md §Stable Directions`
