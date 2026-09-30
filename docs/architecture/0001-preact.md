# ADR-0001: Preact instead of React

**Status:** Accepted
**Date:** 2026-05-27
**Slice:** cross-cutting
**Refines:** —
**Category:** Tech stack

## Context

V3 is a PWA that runs on the iPhone 13 Pro (Brave browser). Bundle size is a measurable
factor: every KB that has to be loaded over the network lengthens the first load. React
(~45 KB gzip) and Preact (~3 KB gzip) offer the same JSX compatibility.

The design system (`design-sources/2026-05-25/`) delivered JSX components as source material.
A JSX-based solution was therefore a given; the only question was which runtime to use.

Source document: `docs/architecture/concept-brief.md §1` — "Preact (not React) — smaller bundle,
same JSX".

## Decision

Preact is used as the UI runtime. React is not installed; all imports use `preact` and
`@preact/signals`. The JSX transform in `vite.config.ts` points to `preact/jsx-runtime`.

## Consequences

**Positive:**
- The bundle stays small: JS currently ~100 KB gzip (incl. app code), Preact's share ~3 KB.
- Preact Signals are a first-party addition: no impedance mismatch with the state
  management (ADR-0002).
- JSX compatibility: the design-system JSX did not have to be rewritten for Slice 1.

**Negative / Trade-offs:**
- Preact's ecosystem is smaller than React's. Some React libraries are not directly
  compatible (React-only hooks, React Testing Library). In practice not a blocker so far.
- Vitest + Playwright test the code directly, without jsdom/React Testing Library — that was
  the approach anyway (ADR-0033).

## Alternatives considered

**React 18:** would be directly compatible with the React ecosystem, but ~42 KB larger in the
bundle. Not justified for a PWA with the iPhone as the primary target.

**Vanilla JS / Lit:** could not use the design-system JSX directly. More porting effort
without added value.

**Solid.js:** signals-based like Preact, similar bundle size. No JSX compatibility advantage
with respect to the design system; ecosystem even smaller.

## Related

- **Files:** `v3/package.json` (preact, @preact/signals dependency), `v3/vite.config.ts` (JSX transform)
- **ADRs:** ADR-0002 (Preact Signals), ADR-0003 (Vite)
- **Source documents:** `docs/architecture/concept-brief.md §1`
- **Commits:** `8be64d4` — Slice 1: Vite + Preact scaffold
