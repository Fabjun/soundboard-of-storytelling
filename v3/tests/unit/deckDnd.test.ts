/**
 * @fileoverview deckDnd — unit tests: where a dragged deck lands (Slice 13g)
 * Edge-case checklist: above the first row, below the last, between two rows, on its own place
 * (stays), exactly on a center, a list of one deck, the first and the last deck dragged.
 */

import { deckDropIndex } from '../../src/lib/deckDnd';

// Four rows of 44 px: centers 22, 66, 110, 154
const centers = [22, 66, 110, 154];

describe('deckDropIndex', () => {
  it('above the first row the deck goes first; below the last row it goes last', () => {
    expect(deckDropIndex(0, centers, 2)).toBe(0);
    expect(deckDropIndex(500, centers, 1)).toBe(3);
  });

  it('between two rows it goes between them', () => {
    // the first deck dragged between the third and fourth row
    expect(deckDropIndex(130, centers, 0)).toBe(2);
    // the last deck dragged between the first and second row
    expect(deckDropIndex(40, centers, 3)).toBe(1);
  });

  it('stays where it is near its own row', () => {
    expect(deckDropIndex(70, centers, 1)).toBe(1);
    expect(deckDropIndex(60, centers, 1)).toBe(1);
  });

  it('a pointer exactly on a center does not pass that row', () => {
    expect(deckDropIndex(66, centers, 0)).toBe(0);
    expect(deckDropIndex(67, centers, 0)).toBe(1);
  });

  it('one deck alone always stays at 0', () => {
    expect(deckDropIndex(-100, [22], 0)).toBe(0);
    expect(deckDropIndex(100, [22], 0)).toBe(0);
  });
});
