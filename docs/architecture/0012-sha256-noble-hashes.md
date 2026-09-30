# ADR-0012: SHA-256 via `@noble/hashes` instead of the Web Crypto API

**Status:** Accepted
**Date:** 2026-05-27
**Slice:** Slice 2
**Refines:** —
**Category:** Data model

## Context

Library entries are identified by their SHA-256 hash (`LibraryItem.id`). The hash is computed
once at upload. It serves as the deduplication key: the same audio file (same content) always
gets the same hash ID.

The obvious implementation: `crypto.subtle.digest('SHA-256', buffer)` (Web Crypto API). This
API is, however, only available in a **secure context** (HTTPS).

**Problem:** during development the Vite dev server runs over HTTP on the local IP (e.g.
`http://192.168.1.x:5173`) for iPhone tests in the LAN. That is not a secure context →
`crypto.subtle` is not available there.

## Decision

SHA-256 is computed with `@noble/hashes/sha2.js`:

```typescript
import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';

export function computeHash(buf: ArrayBuffer): string {
  return bytesToHex(sha256(new Uint8Array(buf)));
}
```

`@noble/hashes` is a pure-JS implementation that needs no secure context. It works in every
browser context.

## Consequences

**Positive:**

- Hash computation works over HTTP (LAN dev server) and HTTPS (production).
- `@noble/hashes` is audited and widely used in the web crypto community.
- No conditional polyfill logic needed.

**Negative / Trade-offs:**

- An additional dependency (~14 KB gzip). Acceptable for a one-off upload step.
- Somewhat slower than the native Web Crypto API (pure JS vs. native). Not measurable for a
  single-file upload (5 MB audio file: <10 ms for SHA-256).

## Alternatives considered

**Web Crypto API (`crypto.subtle.digest`):** native, fast. Not usable over HTTP (LAN dev),
which would block testing on the primary target.

**Conditional:** `crypto.subtle` when available, otherwise a fallback. Would produce different
behaviour in dev and production — not good engineering practice (invariants should be the
same in every context).

**CRC32 / MD5:** would be faster, but are not cryptographic hashes. Collision resistance
matters for deduplication.

## Related

- **Files:** `v3/src/lib/upload.ts` (computeHash), `v3/package.json` (@noble/hashes dependency)
- **ADRs:** ADR-0006 (iOS LAN testing as a requirement), ADR-0011 (LibraryItem.id is the hash)
- **Source documents:** `CLAUDE.md §Deviations from plan`
- **Commits:** `c81992e` — feat(slice-2)
