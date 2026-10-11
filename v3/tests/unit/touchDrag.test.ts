// @vitest-environment jsdom
/**
 * @fileoverview touchDrag — unit tests: a finger drags only after a short press (2026-10-11)
 * Edge-case checklist: mouse and pen at once; a finger that rests the full time, a moment too
 * short, moves past the tolerance first, moves within it, lifts or is canceled first; scrolling
 * blocked only after the start and free again after the lift; another pointer's moves ignored.
 */

import { LONG_PRESS_MS, pressToDrag } from '../../src/lib/touchDrag';

const press = (pointerType: string, x = 100, y = 100) =>
  ({ pointerType, pointerId: 1, clientX: x, clientY: y }) as PointerEvent;

/** Dispatches a pointer event with the given fields on the document. */
function pointer(type: string, fields: Partial<PointerEvent> = {}) {
  document.dispatchEvent(Object.assign(new Event(type), { pointerId: 1, ...fields }));
}

/** Dispatches a touchmove and tells whether its default (the scroll) was prevented. */
function touchmoveBlocked(): boolean {
  const ev = new Event('touchmove', { cancelable: true });
  document.dispatchEvent(ev);
  return ev.defaultPrevented;
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  document.dispatchEvent(new Event('touchend'));
  vi.useRealTimers();
});

describe('pressToDrag', () => {
  it('a mouse or a pen starts at once', () => {
    for (const kind of ['mouse', 'pen']) {
      const start = vi.fn();
      pressToDrag(press(kind), 8, start);
      expect(start).toHaveBeenCalledTimes(1);
    }
  });

  it('a finger that rests the full time starts, not a moment earlier', () => {
    const start = vi.fn();
    pressToDrag(press('touch'), 8, start);
    vi.advanceTimersByTime(LONG_PRESS_MS - 1);
    expect(start).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(start).toHaveBeenCalledTimes(1);
  });

  it('a finger that moves past the tolerance first scrolls — nothing starts', () => {
    const start = vi.fn();
    pressToDrag(press('touch'), 8, start);
    pointer('pointermove', { clientX: 100, clientY: 109 });
    vi.advanceTimersByTime(LONG_PRESS_MS);
    expect(start).not.toHaveBeenCalled();
  });

  it('a small move within the tolerance, or another pointer, does not stop it', () => {
    const start = vi.fn();
    pressToDrag(press('touch'), 8, start);
    pointer('pointermove', { clientX: 104, clientY: 107 });
    pointer('pointermove', { pointerId: 2, clientX: 300, clientY: 300 });
    vi.advanceTimersByTime(LONG_PRESS_MS);
    expect(start).toHaveBeenCalledTimes(1);
  });

  it('a finger lifted or canceled first starts nothing', () => {
    for (const type of ['pointerup', 'pointercancel']) {
      const start = vi.fn();
      pressToDrag(press('touch'), 8, start);
      pointer(type);
      vi.advanceTimersByTime(LONG_PRESS_MS);
      expect(start).not.toHaveBeenCalled();
    }
  });

  it('scrolling is blocked only after the start, and free again after the lift', () => {
    pressToDrag(press('touch'), 8, () => {});
    expect(touchmoveBlocked()).toBe(false);
    vi.advanceTimersByTime(LONG_PRESS_MS);
    expect(touchmoveBlocked()).toBe(true);
    document.dispatchEvent(new Event('touchend'));
    expect(touchmoveBlocked()).toBe(false);
  });
});
