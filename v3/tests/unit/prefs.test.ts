// @vitest-environment jsdom
// ─────────────────────────────────────────────────────────────────────────────
// prefs — UI preferences in localStorage (ADR-0014): the last view of a board
// Cases: nothing stored, each view kind, unknown values, per-board keys with the sos-v3 prefix,
// storage unavailable (throws) — never an error for a preference.
// ─────────────────────────────────────────────────────────────────────────────

import {
  clearLastView,
  getLastBackup,
  getLastView,
  setLastBackup,
  setLastView,
} from '../../src/db/prefs';

beforeEach(() => localStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe('last view of a board', () => {
  it('is null when nothing is stored', () => {
    expect(getLastView('b1')).toBeNull();
  });

  it('round-trips a deck and the All pads view, per board', () => {
    setLastView('b1', { kind: 'deck', deckId: 'd7' });
    setLastView('b2', { kind: 'all-pads' });
    expect(getLastView('b1')).toEqual({ kind: 'deck', deckId: 'd7' });
    expect(getLastView('b2')).toEqual({ kind: 'all-pads' });
  });

  it('stores under the sos-v3 prefix — V1 shares the origin', () => {
    setLastView('b1', { kind: 'all-pads' });
    expect(localStorage.getItem('sos-v3:last-view:b1')).toBe('all-pads');
    expect(localStorage).toHaveLength(1);
  });

  it('ignores a value it does not know', () => {
    localStorage.setItem('sos-v3:last-view:b1', 'something-else');
    expect(getLastView('b1')).toBeNull();
  });

  it('clear forgets one board only', () => {
    setLastView('b1', { kind: 'all-pads' });
    setLastView('b2', { kind: 'all-pads' });
    clearLastView('b1');
    expect(getLastView('b1')).toBeNull();
    expect(getLastView('b2')).toEqual({ kind: 'all-pads' });
  });

  it('never throws when storage is unavailable', () => {
    const fail = () => {
      throw new DOMException('denied', 'SecurityError');
    };
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(fail);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(fail);
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(fail);
    expect(() => setLastView('b1', { kind: 'all-pads' })).not.toThrow();
    expect(getLastView('b1')).toBeNull();
    expect(() => clearLastView('b1')).not.toThrow();
  });
});

describe('last backup (D3)', () => {
  it('is null before the first backup, then the stored time', () => {
    expect(getLastBackup()).toBeNull();
    setLastBackup(1_700_000_000_000);
    expect(getLastBackup()).toBe(1_700_000_000_000);
    expect(localStorage.getItem('sos-v3:last-backup')).toBe('1700000000000');
  });

  it('ignores a value that is not a time; never throws without storage', () => {
    localStorage.setItem('sos-v3:last-backup', 'soon');
    expect(getLastBackup()).toBeNull();
    localStorage.setItem('sos-v3:last-backup', '0');
    expect(getLastBackup()).toBeNull();
    const fail = () => {
      throw new DOMException('denied', 'SecurityError');
    };
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(fail);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(fail);
    expect(() => setLastBackup(1)).not.toThrow();
    expect(getLastBackup()).toBeNull();
  });
});
