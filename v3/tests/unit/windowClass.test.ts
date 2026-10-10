/**
 * @fileoverview windowClass — narrow below 600 px, wide from it; follows a resize (Slice 13a)
 * Edge-case checklist: the value at start (before the first render), a change in both
 * directions, the exact query at the boundary, and nothing after it is stopped.
 */

import {
  NARROW_QUERY,
  narrowWindow,
  startWindowClass,
  WIDE_MIN_WIDTH,
} from '../../src/state/windowClass';

/** A window whose width is set by the test; matchMedia answers the one query the module asks. */
function fakeWindow(width: number) {
  const listeners = new Set<() => void>();
  const asked: string[] = [];
  let w = width;
  const query = {
    get matches() {
      return w <= WIDE_MIN_WIDTH - 0.02;
    },
    addEventListener: (_: string, l: () => void) => listeners.add(l),
    removeEventListener: (_: string, l: () => void) => listeners.delete(l),
  };
  return {
    win: {
      matchMedia: (q: string) => {
        asked.push(q);
        return query as unknown as MediaQueryList;
      },
    },
    asked,
    resize(to: number) {
      w = to;
      listeners.forEach((l) => l());
    },
    listeners,
  };
}

let stop: () => void = () => {};
afterEach(() => {
  stop();
  narrowWindow.value = false;
});

describe('windowClass', () => {
  it('asks for widths below 600 px, at .02 px below the boundary', () => {
    expect(NARROW_QUERY).toBe('(max-width: 599.98px)');
    const f = fakeWindow(390);
    stop = startWindowClass(f.win);
    expect(f.asked).toEqual([NARROW_QUERY]);
  });

  it('knows the class at start: narrow at 599 px, wide at 600 px', () => {
    stop = startWindowClass(fakeWindow(599).win);
    expect(narrowWindow.value).toBe(true);
    stop();
    stop = startWindowClass(fakeWindow(600).win);
    expect(narrowWindow.value).toBe(false);
  });

  it('follows a resize or a rotation in both directions', () => {
    const f = fakeWindow(1280);
    stop = startWindowClass(f.win);
    f.resize(390);
    expect(narrowWindow.value).toBe(true);
    f.resize(844);
    expect(narrowWindow.value).toBe(false);
  });

  it('follows nothing once it is stopped', () => {
    const f = fakeWindow(1280);
    stop = startWindowClass(f.win);
    stop();
    expect(f.listeners.size).toBe(0);
    f.resize(390);
    expect(narrowWindow.value).toBe(false);
  });
});
