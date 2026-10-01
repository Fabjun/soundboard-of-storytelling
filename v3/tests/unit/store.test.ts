// ─────────────────────────────────────────────────────────────────────────────
// store — unit tests for Preact Signals mutations and computed reactivity
//
// Signals are module-level singletons. The beforeEach block resets all signals
// that the tests touch so tests are isolated from each other.
//
// Preact Signals are pure JS objects — no DOM required. jsdom env is fine.
// ─────────────────────────────────────────────────────────────────────────────

import type { Board } from '../../src/types';
import {
  boards,
  currentBoardId,
  currentDeckId,
  currentBoard,
  currentDeck,
  playingPads,
  loopingPads,
  upsertBoard,
  removeBoardFromStore,
  addPlayingPad,
  removePlayingPad,
  addLoopingPad,
  removeLoopingPad,
} from '../../src/state/store';

// ── Factories ─────────────────────────────────────────────────────────────────

function makeBoard(id: string, name = 'Test Board'): Board {
  return {
    id,
    name,
    themeId: 'hearth',
    pads: [],
    decks: [],
    quickAccess: [],
  };
}

// ── Reset signals before each test ───────────────────────────────────────────

beforeEach(() => {
  boards.value = [];
  currentBoardId.value = null;
  currentDeckId.value = null;
  playingPads.value = new globalThis.Set<string>();
  loopingPads.value = new globalThis.Set<string>();
});

// ── upsertBoard ───────────────────────────────────────────────────────────────

describe('upsertBoard', () => {
  test('adds a new board to empty store', () => {
    const b = makeBoard('b1');
    upsertBoard(b);
    expect(boards.value).toHaveLength(1);
    expect(boards.value[0].id).toBe('b1');
  });

  test('adds multiple boards', () => {
    upsertBoard(makeBoard('b1'));
    upsertBoard(makeBoard('b2'));
    expect(boards.value).toHaveLength(2);
  });

  test('updates existing board (same id, changed name)', () => {
    upsertBoard(makeBoard('b1', 'Original'));
    upsertBoard(makeBoard('b1', 'Updated'));
    expect(boards.value).toHaveLength(1);
    expect(boards.value[0].name).toBe('Updated');
  });

  test('update produces a new array reference (signal immutability)', () => {
    upsertBoard(makeBoard('b1'));
    const before = boards.value;
    upsertBoard(makeBoard('b1', 'Updated'));
    expect(boards.value).not.toBe(before);
  });
});

// ── removeBoardFromStore ──────────────────────────────────────────────────────

describe('removeBoardFromStore', () => {
  test('removes the matching board', () => {
    upsertBoard(makeBoard('b1'));
    upsertBoard(makeBoard('b2'));
    removeBoardFromStore('b1');
    expect(boards.value).toHaveLength(1);
    expect(boards.value[0].id).toBe('b2');
  });

  test('non-existent id is a no-op (no throw)', () => {
    upsertBoard(makeBoard('b1'));
    expect(() => removeBoardFromStore('MISSING')).not.toThrow();
    expect(boards.value).toHaveLength(1);
  });

  test('produces a new array reference', () => {
    upsertBoard(makeBoard('b1'));
    const before = boards.value;
    removeBoardFromStore('b1');
    expect(boards.value).not.toBe(before);
  });
});

// ── currentBoard (computed) ───────────────────────────────────────────────────

describe('currentBoard computed', () => {
  test('null when no board is selected', () => {
    upsertBoard(makeBoard('b1'));
    expect(currentBoard.value).toBeNull();
  });

  test('resolves correct board when currentBoardId is set', () => {
    upsertBoard(makeBoard('b1', 'First'));
    upsertBoard(makeBoard('b2', 'Second'));
    currentBoardId.value = 'b2';
    expect(currentBoard.value?.name).toBe('Second');
  });

  test('returns null when currentBoardId points to non-existent board', () => {
    currentBoardId.value = 'GHOST';
    expect(currentBoard.value).toBeNull();
  });

  test('reacts to currentBoardId change', () => {
    upsertBoard(makeBoard('b1', 'First'));
    upsertBoard(makeBoard('b2', 'Second'));
    currentBoardId.value = 'b1';
    expect(currentBoard.value?.name).toBe('First');
    currentBoardId.value = 'b2';
    expect(currentBoard.value?.name).toBe('Second');
  });
});

// ── currentDeck (computed) ───────────────────────────────────────────────────

describe('currentDeck computed', () => {
  test('null when no board is selected', () => {
    expect(currentDeck.value).toBeNull();
  });

  test('null when board has no decks', () => {
    upsertBoard(makeBoard('b1'));
    currentBoardId.value = 'b1';
    expect(currentDeck.value).toBeNull();
  });

  test('resolves correct deck when currentDeckId is set', () => {
    const board: Board = {
      ...makeBoard('b1'),
      decks: [
        {
          id: 's1',
          name: 'Intro',
          order: 0,
          gridConfig: { cols: 4, rows: 4, gap: 8, padSize: '1fr' },
          placements: [],
        },
        {
          id: 's2',
          name: 'Act 1',
          order: 1,
          gridConfig: { cols: 4, rows: 4, gap: 8, padSize: '1fr' },
          placements: [],
        },
      ],
    };
    upsertBoard(board);
    currentBoardId.value = 'b1';
    currentDeckId.value = 's2';
    expect(currentDeck.value?.name).toBe('Act 1');
  });

  test('returns null for unknown deck id', () => {
    const board: Board = {
      ...makeBoard('b1'),
      decks: [
        {
          id: 's1',
          name: 'Intro',
          order: 0,
          gridConfig: { cols: 4, rows: 4, gap: 8, padSize: '1fr' },
          placements: [],
        },
      ],
    };
    upsertBoard(board);
    currentBoardId.value = 'b1';
    currentDeckId.value = 'GHOST';
    expect(currentDeck.value).toBeNull();
  });
});

// ── playingPads ───────────────────────────────────────────────────────────────

describe('addPlayingPad / removePlayingPad', () => {
  test('addPlayingPad adds id to set', () => {
    addPlayingPad('pad-1');
    expect(playingPads.value.has('pad-1')).toBe(true);
  });

  test('addPlayingPad produces a new Set reference (immutable)', () => {
    const before = playingPads.value;
    addPlayingPad('pad-1');
    expect(playingPads.value).not.toBe(before);
  });

  test('removePlayingPad removes id', () => {
    addPlayingPad('pad-1');
    removePlayingPad('pad-1');
    expect(playingPads.value.has('pad-1')).toBe(false);
  });

  test('removePlayingPad on non-existent id is a no-op', () => {
    expect(() => removePlayingPad('GHOST')).not.toThrow();
    expect(playingPads.value.size).toBe(0);
  });

  test('multiple pads can play simultaneously', () => {
    addPlayingPad('pad-1');
    addPlayingPad('pad-2');
    expect(playingPads.value.size).toBe(2);
  });
});

// ── loopingPads ───────────────────────────────────────────────────────────────

describe('addLoopingPad / removeLoopingPad', () => {
  test('addLoopingPad adds id to set', () => {
    addLoopingPad('pad-1');
    expect(loopingPads.value.has('pad-1')).toBe(true);
  });

  test('removeLoopingPad removes id', () => {
    addLoopingPad('pad-1');
    removeLoopingPad('pad-1');
    expect(loopingPads.value.has('pad-1')).toBe(false);
  });

  test('looping and playing sets are independent', () => {
    addPlayingPad('pad-1');
    addLoopingPad('pad-2');
    expect(playingPads.value.has('pad-2')).toBe(false);
    expect(loopingPads.value.has('pad-1')).toBe(false);
  });
});
