// @vitest-environment jsdom
/**
 * @fileoverview libDnd — unit tests: dragging a library row onto a pad cell
 *
 * Was exempt ("covered by E2E pad-creation test 14") until 2026-10-11, when the finger drag after a
 * short press (src/lib/touchDrag.ts) was added and the module's untested functions pulled the
 * coverage below its floor. jsdom has no layout: `document.elementFromPoint` is stubbed with the
 * cell under the pointer. Edge-case checklist: below and exactly at the threshold, a drop on a
 * cell, on no cell, on a cell with a broken position; the activation callback once; the target
 * marked and unmarked; a second drag while one runs; a mouse at once, a finger after the press.
 */

import { afterEach, beforeEach, vi } from 'vitest';
import { startLibDrag, type LibDndDropResult } from '../../src/lib/libDnd';
import { LONG_PRESS_MS } from '../../src/lib/touchDrag';

let row: HTMLElement;
let cell: HTMLElement;
let under: Element | null;
let onDrop: ReturnType<typeof vi.fn<(r: LibDndDropResult) => void>>;

const press = (pointerType = 'mouse', x = 10, y = 10, activated?: () => void) =>
  startLibDrag(
    { pointerType, pointerId: 1, clientX: x, clientY: y, preventDefault: () => {} } as PointerEvent,
    'item-1',
    row,
    onDrop,
    activated,
  );
const move = (x: number, y: number) =>
  document.dispatchEvent(Object.assign(new Event('pointermove'), { clientX: x, clientY: y }));
const up = () => document.dispatchEvent(new Event('pointerup'));
const ghost = () => document.body.querySelector(':scope > .ghost-probe');

beforeEach(() => {
  row = document.createElement('div');
  row.className = 'ghost-probe';
  row.setPointerCapture = vi.fn();
  cell = document.createElement('div');
  cell.dataset.pos = '2,1';
  document.body.append(cell);
  under = null;
  document.elementFromPoint = vi.fn(() => under);
  onDrop = vi.fn();
});

afterEach(() => {
  document.body.innerHTML = '';
  vi.useRealTimers();
});

describe('startLibDrag', () => {
  it('a press that moves less than the threshold cancels, without a ghost', () => {
    press();
    move(17, 10);
    expect(ghost()).toBeNull();
    up();
    expect(onDrop).toHaveBeenCalledWith({ kind: 'cancel' });
  });

  it('crossing the threshold shows a ghost and calls the activation once', () => {
    const activated = vi.fn();
    press('mouse', 10, 10, activated);
    // Exactly the threshold (8 px) is a drag already
    move(18, 10);
    expect(ghost()).not.toBeNull();
    move(40, 30);
    expect(activated).toHaveBeenCalledOnce();
    up();
    expect(ghost()).toBeNull();
  });

  it('a drop on a cell gives its position; the cell is marked while under the pointer', () => {
    press();
    under = cell;
    move(30, 30);
    expect(cell.classList.contains('is-lib-drag-target')).toBe(true);
    up();
    expect(onDrop).toHaveBeenCalledWith({
      kind: 'drop',
      itemId: 'item-1',
      targetPos: { col: 2, row: 1 },
    });
    expect(cell.classList.contains('is-lib-drag-target')).toBe(false);
  });

  it('moving off the cell unmarks it, and a drop on no cell cancels', () => {
    press();
    under = cell;
    move(30, 30);
    under = null;
    move(300, 300);
    expect(cell.classList.contains('is-lib-drag-target')).toBe(false);
    up();
    expect(onDrop).toHaveBeenCalledWith({ kind: 'cancel' });
  });

  it('a cell with a broken position cancels', () => {
    cell.dataset.pos = 'x,y';
    press();
    under = cell;
    move(30, 30);
    up();
    expect(onDrop).toHaveBeenCalledWith({ kind: 'cancel' });
  });

  it('a second drag while one runs is ignored', () => {
    press();
    const second = vi.fn();
    startLibDrag(
      {
        pointerType: 'mouse',
        pointerId: 2,
        clientX: 0,
        clientY: 0,
        preventDefault: () => {},
      } as PointerEvent,
      'item-2',
      row,
      second,
    );
    up();
    expect(second).not.toHaveBeenCalled();
    expect(onDrop).toHaveBeenCalledOnce();
  });

  it('a mouse captures the pointer at once; a finger only after the short press', () => {
    vi.useFakeTimers();
    press('touch');
    expect(row.setPointerCapture).not.toHaveBeenCalled();
    vi.advanceTimersByTime(LONG_PRESS_MS);
    expect(row.setPointerCapture).toHaveBeenCalledWith(1);
    up();
    document.dispatchEvent(new Event('touchend'));
  });
});
