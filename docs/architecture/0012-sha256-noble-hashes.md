# ADR-0012: SHA-256 via `@noble/hashes` statt Web Crypto API

**Status:** Accepted
**Date:** 2026-05-27
**Slice:** Slice 2

**Category:** Data model

## Context

Library-Einträge werden über ihren SHA-256-Hash identifiziert (`LibraryItem.id`).
Der Hash wird einmalig beim Upload berechnet. Er dient als Deduplizierungs-Key:
dieselbe Audio-Datei (gleicher Inhalt) erhält immer denselben Hash-ID.

Die naheliegende Implementierung: `crypto.subtle.digest('SHA-256', buffer)`
(Web Crypto API). Diese API ist jedoch nur in einem **Secure Context** (HTTPS)
verfügbar.

**Problem:** Während der Entwicklung läuft der Vite-Dev-Server unter HTTP auf
dem lokalen IP (z.B. `http://192.168.1.x:5173`) für iPhone-Tests im LAN.
Das ist kein Secure Context → `crypto.subtle` ist dort nicht verfügbar.

## Decision

SHA-256 wird mit `@noble/hashes/sha2.js` berechnet:

```typescript
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';

export function computeHash(buf: ArrayBuffer): string {
  return bytesToHex(sha256(new Uint8Array(buf)));
}
```

`@noble/hashes` ist eine pure-JS-Implementierung, die keinen Secure Context
benötigt. Sie funktioniert in jedem Browser-Kontext.

## Consequences

**Positiv:**
- Hash-Berechnung funktioniert auf HTTP (LAN-Dev-Server) und HTTPS (Production).
- `@noble/hashes` ist auditiert, weit verbreitet in der Web-Crypto-Community.
- Keine conditional-polyfill-Logik nötig.

**Negativ / Trade-offs:**
- Zusätzliche Dependency (~14 KB gzip). Für einen einmaligen Upload-Schritt
  akzeptabel.
- Etwas langsamer als native Web Crypto API (pure JS vs. native). Bei
  Single-File-Upload nicht messbar (Audio-File von 5 MB: <10 ms für SHA-256).

## Alternatives Considered

**Web Crypto API (`crypto.subtle.digest`):** Nativ, schnell. Nicht verwendbar
auf HTTP (LAN-Dev), was das Primärtarget-Testing blockieren würde.

**Conditional:** `crypto.subtle` wenn verfügbar, sonst Fallback. Würde
unterschiedliches Verhalten in Dev und Production produzieren — keine gute
Engineering-Praxis (Invarianten sollen in allen Kontexten gleich sein).

**CRC32 / MD5:** Wären schneller, aber keine kryptografischen Hashes.
Kollisionsresistenz ist für Deduplizierung relevant.

## Related

- **Dateien:** `v3/src/lib/upload.ts` (computeHash), `v3/package.json` (@noble/hashes dependency)
- **ADRs:** ADR-0006 (iOS LAN-Testing als Anforderung), ADR-0011 (LibraryItem.id ist der Hash)
- **Quelldokumente:** `CLAUDE.md §Deviations from plan`
- **Commits:** `c81992e` — feat(slice-2)
