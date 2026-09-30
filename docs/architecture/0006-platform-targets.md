# ADR-0006: iOS Safari 15+ minimum, iPhone 13 Pro as primary target

**Status:** Accepted
**Date:** 2026-05-27
**Slice:** cross-cutting
**Refines:** —
**Category:** Platform constraints

## Context

V3 is used primarily on an iPhone 13 Pro + Brave browser (live use during tabletop
role-playing). At the same time the app should be usable on desktop and other mobile devices.
The question: which browser APIs can be assumed as guaranteed, which need graceful
degradation, and which are explicitly excluded?

This decision was documented as a formal entry in `docs/architecture/concept-brief.md §4.13`
and `CLAUDE.md §Supported Platforms` after an iOS incompatibility bug caused by missing
platform awareness had occurred in Slice 3 (HTML5 drag and drop — see ADR-0007).

## Decision

**Primary target:** iPhone 13 Pro (iOS 17/18) + Brave browser.

**Minimum:** iOS Safari 15+ (iPhone 6s, 2015, and newer).

**Guaranteed APIs (no polyfill needed):**

- Pointer Events API (iOS 13+)
- IndexedDB
- Web Audio API (with user-gesture unlock)
- Service worker / PWA / Add to Home Screen
- CSS `clamp()`, `prefers-reduced-motion`
- IntersectionObserver, ResizeObserver

**Graceful degradation:**

- Container queries (iOS 16+) — fall back to media queries on iOS 15
- View Transitions API (iOS 18+) — optional polish, never a hard dependency

**Explicitly excluded:**

- HTML5 drag and drop (`draggable`, `ondragstart`, `ondrop`) — not on iOS Safari/Brave. Every
  DnD interaction must use pointer events.
- Any API that requires iOS 17+ as a hard dependency.

## Consequences

**Positive:**

- A clear feature set: development can rely on guaranteed APIs without checking every
  feature.
- The DnD ban is documented explicitly → prevents a repeat of the Slice 3 bug.

**Negative / Trade-offs:**

- Container queries cannot be the only layout strategy; media-query fallbacks have to ship as
  well.
- Some modern CSS features (e.g. `:has()`, `@layer`) are risky on iOS 15 and have to be
  checked.

## Alternatives considered

**iOS 17+ as minimum:** would unlock View Transitions and other modern features. But iPhone
6s/7/8 (iOS 15/16) are still in circulation; an unnecessary restriction.

**Desktop first:** the app would be used primarily on the desktop for TTRPG hosting. Against
desktop first: the user builds V3 explicitly for live use at the gaming table on the iPhone.

## Related

- **Files:** `v3/src/lib/padDnd.ts`, `v3/src/lib/libDnd.ts` (canonical pointer events implementations)
- **ADRs:** ADR-0007 (pointer events DnD), ADR-0024 (clip-path consequence)
- **Source documents:** `docs/architecture/concept-brief.md §4.13`, `CLAUDE.md §Supported Platforms`
- **Commits:** `8b2aef1` — docs: define platform support matrix
