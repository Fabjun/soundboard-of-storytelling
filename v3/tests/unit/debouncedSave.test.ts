/**
 * @fileoverview debouncedSave — unit tests (fake timers)
 */

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { debouncedSave } from '../../src/lib/debouncedSave';
import { pendingSaves } from '../../src/state/store';

beforeEach(() => {
  vi.useFakeTimers();
  pendingSaves.value = 0;
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

describe('debouncedSave — a waiting value counts as a running save', () => {
  test('counts once from the first schedule until it is written, however often it is rescheduled', () => {
    const { save } = setup();
    save.schedule('a');
    expect(pendingSaves.value).toBe(1);
    save.schedule('ab');
    expect(pendingSaves.value).toBe(1);
    vi.advanceTimersByTime(500);
    expect(pendingSaves.value).toBe(0);
  });

  test('the count never drops to 0 between waiting and saving — the write counts itself first', () => {
    const seen: number[] = [];
    const save = debouncedSave(() => {
      pendingSaves.value++; // as a board save does, synchronously
      seen.push(pendingSaves.value);
    }, 500);
    save.schedule('x');
    save.flush();
    expect(seen).toEqual([2]); // the waiting value and the save
    expect(pendingSaves.value).toBe(1); // the save still runs
  });

  test('a flush with nothing waiting and a write that throws leave the count right', () => {
    const save = debouncedSave(() => {
      throw new Error('disk full');
    }, 500);
    save.flush();
    expect(pendingSaves.value).toBe(0);
    save.schedule('x');
    expect(() => save.flush()).toThrow('disk full');
    expect(pendingSaves.value).toBe(0);
  });
});
