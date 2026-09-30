# ADR-0019: iOS Memory Safety Rules (150 MB LRU-Cache, serielles Decode)

**Status:** Accepted
**Date:** 2026-05-27
**Slice:** cross-cutting

**Category:** Audio engine & iOS memory

## Context

iOS Safari killt den Browser-Tab, wenn der JS-Heap eine Grenze überschreitet:
~600 MB auf älteren iPhones (iPhone 8 und früher), ~1–1.5 GB auf neueren
(iPhone 12+). Das ist V1's härteste Lektion — mehrfach beim Live-Einsatz
erfahren.

Das `CLAUDE.md §iPhone / iOS Safari — memory & stability rules` dokumentiert
7 Kern-Prinzipien aus V1, die 1:1 für V3 gelten. Diese Regeln sind nicht
verhandelbar — Verstöße führen zu Tab-Kills im Live-Gaming-Einsatz.

## Decision

**7 Verbotene Muster (aus V1 übernommen):**

1. **Nie alle Audio-Buffers in RAM laden.** Library-Listing, Filtering, Rename
   brauchen keine Audio-Daten — Metadata-only Query.
2. **Nie Audio parallel dekodieren.** Seriell: ein File zur Zeit; Buffer des
   vorigen nullen bevor der nächste startet.
3. **Nie raw Audio in Component-State.** Nur `{name, hash, size}` Referenzen;
   Buffers lazy über `libGet(id)` (Slice 4+).
4. **Nie komplette Library-JSON für Export laden.** Streaming: ein Entry pro Zeit
   in einen Blob.
5. **Immer decoded Buffers nach Playback freigeben.** `onended`-Handler must
   `source.buffer = null` setzen.
6. **Immer große Strings sofort nullen.** Base64, JSON nach dem Parsen.
7. **LRU-Cache cap: 150 MB.** V1's bewährte Grenze. Nicht erhöhen ohne Messung.

**Implementierungskonsequenz:**
- `libGetAllMeta()` verwendet Cursor und referenziert nie `cursor.value.blob`
  (ADR-0011).
- `processFilesSerial()` in `upload.ts` dekodiert ein File zur Zeit.
- `libraryItems` Signal enthält nur `LibraryItemMeta[]`, nie `LibraryItem[]`
  (ADR-0011).

**Verbotene Muster in neuem Code (CLAUDE.md §Banned patterns):**

| Pattern | Warum | Alternative |
|---------|-------|-------------|
| Alle Library-Buffers laden für Non-Playback | 150–240 MB RAM | Metadata-only cursor |
| Parallel `decodeAudioData` für N Files | N × 50–100 MB PCM = OOM | Seriell, Buffer dazwischen freigeben |
| Raw Audio in State-Arrays | Komprimiert + Decoded im RAM | `{name, hash, size}`, lazy load |
| Komplette Library JSON für Export | 150–300 MB String | Stream Entry für Entry |
| `FileReader` Loop parallel | N Reads + N Decodes | Seriell |

## Consequences

**Positiv:**
- Tab-Kills im Live-Einsatz werden verhindert.
- Die Regeln sind defensiv genug für ältere iPhones (600 MB Limit).

**Negativ / Trade-offs:**
- Code, der intuitiv "alle Files auf einmal laden" würde, muss streaming-mäßig
  umstrukturiert werden. Das ist mehr Entwicklungsaufwand.
- Debugging ist schwieriger: Memory-Leaks auf iOS sind nicht direkt sichtbar
  (kein Memory Profiler im Brave-Browser auf dem Gerät).

## Alternatives Considered

**Keine spezifischen iOS-Regeln:** Würde Tab-Kills im Live-Einsatz produzieren.
Das ist das tatsächliche V1-Ergebnis vor diesen Regeln — nicht akzeptabel.

## Related

- **Dateien:** `v3/src/db/idb.ts` (libGetAllMeta cursor), `v3/src/lib/upload.ts` (processFilesSerial), `v3/src/state/store.ts` (libraryItems = Meta only)
- **ADRs:** ADR-0006 (iPhone als Primärtarget), ADR-0011 (LibraryItem-Split), ADR-0018 (V1 Audio Engine), ADR-0020 (AudioContext Lifecycle)
- **Quelldokumente:** `CLAUDE.md §iPhone / iOS Safari — memory & stability rules`, `v1-reference/CLAUDE.md`
