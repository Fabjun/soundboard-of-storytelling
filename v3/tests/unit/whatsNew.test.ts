/**
 * @fileoverview whatsNew — unit tests: release notes in two levels (ADR-0063)
 *
 * What's new is for the people who use the app (plain sentences, no technical terms); the
 * changelog is the per-push developer record (every item starts with a commit type). From
 * NOTES_SINCE on, every version in the changelog has a hand-written What's new entry; before it,
 * withEarlyVersions generates one for each version without (owner decisions 2026-10-03).
 */

import { CHANGELOG, type ChangelogEntry } from '../../src/lib/changelog';
import {
  compareVersions,
  EARLY_VERSION_NOTE,
  NOTES_SINCE,
  versionLine,
  WHATS_NEW,
  WHATS_NEW_GROUPS,
  withEarlyVersions,
  type WhatsNewNotes,
} from '../../src/lib/whatsNew';

const compare = compareVersions;
const sentences = (e: WhatsNewNotes): string[] => WHATS_NEW_GROUPS.flatMap(([key]) => e[key] ?? []);

/** Commit types (ADR-0060) plus the two older prefixes the history uses. */
const COMMIT_TYPE =
  /^(feat|fix|perf|refactor|docs|test|ci|build|chore|style|revert|a11y|security)(\([^)]+\))?!?: /;
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

  it('from NOTES_SINCE on, every version has a hand-written entry — no gaps (Keep a Changelog)', () => {
    const covered = new Set(WHATS_NEW.map((e) => e.version));
    const missing = CHANGELOG.filter((c) => compare(c.version, NOTES_SINCE) >= 0)
      .filter((c) => !covered.has(c.version))
      .map((c) => c.version);
    expect(
      missing,
      'add an entry to src/lib/whatsNew.ts ("Behind the scenes" if nothing visible changed)',
    ).toEqual([]);
  });
});

describe('withEarlyVersions (every version in the app)', () => {
  const all = withEarlyVersions(WHATS_NEW, CHANGELOG);

  it('shows every changelog version exactly once, newest first', () => {
    expect(all.map((e) => e.version)).toEqual(
      CHANGELOG.map((c) => c.version).sort((a, b) => compare(b, a)),
    );
  });

  it('every entry carries the date of its version in the changelog — the date is never typed twice', () => {
    const dates = new Map(CHANGELOG.map((c) => [c.version, c.date]));
    expect(all.filter((e) => e.date !== dates.get(e.version))).toEqual([]);
    const notes = [{ version: '3.0.2', new: ['A thing.'] }];
    const log: ChangelogEntry[] = [{ version: '3.0.2', date: '2026-05-27', items: ['feat: x'] }];
    expect(withEarlyVersions(notes, log)).toEqual([
      { version: '3.0.2', date: '2026-05-27', new: ['A thing.'] },
    ]);
  });

  it('keeps the hand-written early entries and generates the others with the early note', () => {
    const first = all.find((e) => e.version === '3.0.4');
    const written = WHATS_NEW.find((e) => e.version === '3.0.4');
    expect(first).toEqual({ ...written, date: CHANGELOG.find((c) => c.version === '3.0.4')?.date });
    const generated = all.filter((e) => e.behindTheScenes?.[0] === EARLY_VERSION_NOTE);
    expect(generated.length).toBeGreaterThan(100); // sanity: the early development is there
    expect(generated.every((e) => compare(e.version, NOTES_SINCE) < 0)).toBe(true);
  });

  it('never generates an entry from NOTES_SINCE on — a missing hand-written one stays missing', () => {
    const log: ChangelogEntry[] = [
      { version: NOTES_SINCE, date: '2026-10-03', items: ['docs: x'] },
      { version: '3.0.1', date: '2026-05-27', items: ['docs: y'] },
    ];
    expect(withEarlyVersions([], log).map((e) => e.version)).toEqual(['3.0.1']);
  });

  it('the early note reads as plain words too', () => {
    expect(EARLY_VERSION_NOTE).toMatch(/^[A-Z].*\.$/);
    expect(EARLY_VERSION_NOTE).not.toMatch(JARGON);
    expect(EARLY_VERSION_NOTE).not.toMatch(PERSONAL);
  });
});

describe('compareVersions', () => {
  it('orders by number, not by text — 3.0.10 is newer than 3.0.9', () => {
    expect(compare('3.0.10', '3.0.9')).toBeGreaterThan(0);
    expect(compare('3.0.9', '3.1.0')).toBeLessThan(0);
    expect(compare('3.0.4', '3.0.4')).toBe(0);
  });
});

describe("versionLine (top of What's new)", () => {
  const entry = (version: string): WhatsNewNotes => ({ version, fixed: ['X.'] });

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
