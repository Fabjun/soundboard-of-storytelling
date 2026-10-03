/**
 * @fileoverview nanoid — unit tests (IDs for boards, decks and pads)
 */

import { nanoid } from '../../src/lib/nanoid';

describe('nanoid', () => {
  test('returns 21 URL-safe alphanumeric characters', () => {
    for (let i = 0; i < 200; i++) {
      expect(nanoid()).toMatch(/^[A-Za-z0-9]{21}$/);
    }
  });

  test('does not repeat across many calls', () => {
    const ids = new Set(Array.from({ length: 10_000 }, () => nanoid()));
    expect(ids.size).toBe(10_000);
  });
});
