// ─────────────────────────────────────────────────────────────────────────────
// Audio buffer LRU — property-based tests (T11b)
//
// iOS memory rule 7 (CLAUDE.md): the decoded-buffer cache stays below 150 MB — for EVERY
// sequence of inserts and deletes. On failure fast-check prints the seed and the shrunk
// counterexample; pass `{ seed, path }` as fc options to reproduce it.
// Example-based tests: lru.test.ts.
// ─────────────────────────────────────────────────────────────────────────────

import { fc, test } from '@fast-check/vitest';
import { beforeEach, describe, expect } from 'vitest';
import { bufDecodedBytes, libBufs, lruDelete, lruSet } from '../../../src/audio/engine';

const MAX_BYTES = 150 * 1024 * 1024; // the cap of engine.ts (iOS memory rule 7)

/** A decoded buffer of the given size; no sample memory is allocated. */
const buffer = (bytes: number): AudioBuffer =>
  ({ length: Math.ceil(bytes / 4), numberOfChannels: 1 }) as unknown as AudioBuffer;

const op = fc.oneof(
  fc.record({
    kind: fc.constant('set'),
    key: fc.integer({ min: 0, max: 9 }),
    mb: fc.integer({ min: 1, max: 120 }),
  }),
  fc.record({ kind: fc.constant('delete'), key: fc.integer({ min: 0, max: 9 }) }),
);

const cached = (): number => Object.values(libBufs).reduce((sum, b) => sum + bufDecodedBytes(b), 0);

describe('buffer cache', () => {
  beforeEach(() => {
    for (const k of Object.keys(libBufs)) lruDelete(k);
  });

  test.prop([fc.array(op, { maxLength: 40 })])(
    'stays within 150 MB (a single oversized buffer is kept) and keeps the newest buffer',
    (ops) => {
      for (const k of Object.keys(libBufs)) lruDelete(k);
      for (const o of ops) {
        const key = `h${o.key}`;
        if (o.kind === 'delete') {
          lruDelete(key);
          continue;
        }
        if (!libBufs[key]) libBufs[key] = buffer(o.mb * 1024 * 1024);
        lruSet(key);
        expect(libBufs[key]).toBeDefined();
        const count = Object.keys(libBufs).length;
        expect(count === 1 || cached() <= MAX_BYTES).toBe(true);
      }
    },
  );
});
