/**
 * @fileoverview whatsNew — unit tests: release notes in two levels (ADR-0063)
 *
 * What's new is for the people who use the app (plain sentences, no technical terms); the
 * changelog is the per-push developer record (every item starts with a commit type). From the
 * cutover on, every user-facing change in the changelog has a What's new entry for its version.
 */

import { CHANGELOG } from '../../src/lib/changelog';
import {
  versionLine,
  WHATS_NEW,
  WHATS_NEW_GROUPS,
  type WhatsNewEntry,
} from '../../src/lib/whatsNew';

/** First version written under ADR-0063 — earlier history is condensed, not checked item by item. */
const CUTOVER = '3.0.135';

const parse = (v: string): number[] => v.split('.').map(Number);
const compare = (a: string, b: string): number => {
  const [x, y] = [parse(a), parse(b)];
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i];
  return 0;
};
const sentences = (e: WhatsNewEntry): string[] => WHATS_NEW_GROUPS.flatMap(([key]) => e[key] ?? []);

/** Commit types (ADR-0060) plus the two older prefixes the history uses. */
const COMMIT_TYPE =
  /^(feat|fix|perf|refactor|docs|test|ci|build|chore|style|revert|a11y|security)(\([^)]+\))?!?: /;
/** Changes people notice — the scopes after them are internal even for a fix. */
const USER_FACING = /^(feat|fix|perf|a11y)(?!\((test|ci|docs|build)\))(\([^)]+\))?!?: /;
/** Personal address — documents never speak to the reader (owner rule 2026-10-03). */
const PERSONAL = /\b(you|your|yours|yourself)\b/i;
/** A sentence that opens with a command speaks to the reader too ("Sort …", "Drag …"). */
const COMMAND =
  /^(Add|Choose|Drag|Drop|Edit|Find|Go|Make|Move|Open|Pick|Press|Select|Set|Sort|Switch|Tap|Tick|Try|Turn|Use)\b/;
/** Words that belong to the workshop, not to release notes. */
const JARGON =
  /\b(slice|ADR|backlog|E2E|CI|PR|refactor|guard|IndexedDB|IDB|signals?|Preact|Vite|TypeScript|commit|token|engine)\b/i;

describe("What's new (in the app)", () => {
  it('has entries (sanity)', () => {
    expect(WHATS_NEW.length).toBeGreaterThan(5);
  });

  it('every entry has at least one sentence', () => {
    expect(WHATS_NEW.filter((e) => sentences(e).length === 0).map((e) => e.version)).toEqual([]);
  });

  it('every text is a full sentence in plain words — no commit type, no technical term', () => {
    const bad = WHATS_NEW.flatMap((e) =>
      sentences(e)
        .filter(
          (t) => !/^[A-Z"']/.test(t) || !/[.!]$/.test(t) || COMMIT_TYPE.test(t) || JARGON.test(t),
        )
        .map((t) => `${e.version}: ${t}`),
    );
    expect(bad, 'write what the user can now do, as a sentence').toEqual([]);
  });

  it('no sentence addresses the reader — no "you", no command; the app or the feature is the subject', () => {
    const bad = WHATS_NEW.flatMap((e) =>
      sentences(e)
        .filter((t) => PERSONAL.test(t) || COMMAND.test(t))
        .map((t) => `${e.version}: ${t}`),
    );
    expect(bad, 'e.g. "All pads can be sorted …" instead of "Sort All pads …"').toEqual([]);
  });

  it('no changelog item addresses the reader either', () => {
    const bad = CHANGELOG.flatMap((e) =>
      e.items.filter((t) => PERSONAL.test(t)).map((t) => `${e.version}: ${t}`),
    );
    expect(bad).toEqual([]);
  });

  it('versions exist in the changelog and come newest first', () => {
    const known = new Set(CHANGELOG.map((c) => c.version));
    expect(WHATS_NEW.filter((e) => !known.has(e.version)).map((e) => e.version)).toEqual([]);
    const order = WHATS_NEW.map((e) => e.version);
    expect(order).toEqual([...order].sort((a, b) => compare(b, a)));
  });

  it("from the cutover on, every user-facing change has a What's new entry for its version", () => {
    const covered = new Set(WHATS_NEW.map((e) => e.version));
    const missing = CHANGELOG.filter((c) => compare(c.version, CUTOVER) >= 0)
      .filter((c) => c.items.some((i) => USER_FACING.test(i)))
      .filter((c) => !covered.has(c.version))
      .map((c) => c.version);
    expect(missing, 'add an entry to src/lib/whatsNew.ts').toEqual([]);
  });
});

describe("versionLine (top of What's new)", () => {
  const entry = (version: string): WhatsNewEntry => ({
    version,
    date: '2026-10-03',
    fixed: ['X.'],
  });

  it('names only the version when the newest notes belong to it', () => {
    expect(versionLine('3.0.149', [entry('3.0.149'), entry('3.0.145')])).toBe('Version 3.0.149.');
  });

  it('names the version with the latest visible changes when later versions changed nothing visible', () => {
    expect(versionLine('3.0.155', [entry('3.0.149')])).toBe(
      'Version 3.0.155 — the latest visible changes came with 3.0.149.',
    );
  });

  it('names only the version when there are no notes at all', () => {
    expect(versionLine('3.0.1', [])).toBe('Version 3.0.1.');
  });
});

describe('changelog (for developers)', () => {
  it('every item starts with a commit type — CHANGELOG.md groups by it', () => {
    const bad = CHANGELOG.flatMap((c) =>
      c.items.filter((i) => !COMMIT_TYPE.test(i)).map((i) => `${c.version}: ${i.slice(0, 60)}`),
    );
    expect(bad).toEqual([]);
  });
});
