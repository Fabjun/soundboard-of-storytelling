# Product — Soundboard of Storytelling

> **Hub document** for the product concept: what the app is, how it is used, and what its
> parts mean. Structure and rules: [ADR-0047](../architecture/0047-documentation-architecture.md).
>
> **Status:** Skeleton — sections are filled in dialogue with the product owner.
> Until a section is filled, the previous sources remain authoritative
> (`V3_CONCEPT_BRIEF.md`, `BACKLOG.md`, `DESIGN_NOTES.md`).

## Status legend

| Marker | Meaning |
|---|---|
| **Decided** | Confirmed by the product owner. Binding. |
| **Open** | Question not yet answered. Do not assume an answer. |
| **Parked** | Idea recorded for later. Not to be built without explicit go-ahead. |

---

## 1. Purpose & audience

_Pending — to be filled in dialogue._

## 2. A game session

_Pending — to be filled in dialogue._

## 3. App modes: GAME and SETUP

_Pending — to be filled in dialogue._

## 4. Screens & navigation

_Pending — to be filled in dialogue._

## 5. Core concepts

_Pending — to be filled in dialogue._

## 6. Platforms & input

_Pending — to be filled in dialogue._

## 7. Design principles

_Pending — to be filled in dialogue._

## 8. Out of scope

_Pending — to be filled in dialogue._

## 9. Glossary

_Pending — to be filled in dialogue._

## 10. Open questions

| # | Question | Status | Notes |
|---|---|---|---|
| Q1 | Is "Scene" the right user-facing term for the board-level pad arrangement? | **Open** | Raised 2026-09-28: the term feels misleading. "Category" collides with the Library's existing CATEGORY filter. Candidates: Tab, Page, Section, Group. A UI-only rename (code keeps `Scene`) would be cheap; a full code + data rename requires an IDB migration. Decision for now: keep "Scene". |
