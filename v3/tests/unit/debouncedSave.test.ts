// ─────────────────────────────────────────────────────────────────────────────
// debouncedSave — unit tests (fake timers)
// ─────────────────────────────────────────────────────────────────────────────

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { debouncedSave } from '../../src/lib/debouncedSave';

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

function setup() {
  const write = vi.fn<(value: string) => void>();
  return { write, save: debouncedSave(write, 500) };
}

describe('debouncedSave', () => {
  test('writes the latest value once the delay has passed since the last change', () => {
    const { write, save } = setup();
    save.schedule('a');
    vi.advanceTimersByTime(300);
    save.schedule('ab');
    vi.advanceTimersByTime(499);
    expect(write).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(write.mock.calls).toEqual([['ab']]);
  });

  test('flush writes the pending value at once, and the delay does not write it again', () => {
    const { write, save } = setup();
    save.schedule('Leer');
    save.flush();
    expect(write.mock.calls).toEqual([['Leer']]);
    vi.advanceTimersByTime(1000);
    expect(write).toHaveBeenCalledTimes(1);
  });

  test('flush without a pending value writes nothing; a second flush writes nothing more', () => {
    const { write, save } = setup();
    save.flush();
    expect(write).not.toHaveBeenCalled();
    save.schedule('x');
    save.flush();
    save.flush();
    expect(write).toHaveBeenCalledTimes(1);
  });

  test('after a flush, a new change is written after its own delay', () => {
    const { write, save } = setup();
    save.schedule('first');
    save.flush();
    save.schedule('second');
    vi.advanceTimersByTime(500);
    expect(write.mock.calls).toEqual([['first'], ['second']]);
  });

  test('an empty value is a value: it is written, not skipped', () => {
    const { write, save } = setup();
    save.schedule('');
    save.flush();
    expect(write.mock.calls).toEqual([['']]);
  });
});
