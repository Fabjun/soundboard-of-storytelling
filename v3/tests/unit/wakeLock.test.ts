/**
 * @fileoverview wakeLock — the screen stays on while wanted, and comes back after the page was hidden
 */
import { describe, it, expect, vi } from 'vitest';
import { createScreenKeeper, type WakeLockSentinelLike } from '../../src/lib/wakeLock';

/** A fake browser: a wake lock API that records requests, and a page that can be hidden. */
function fakeBrowser(options: { refuse?: boolean } = {}) {
  const sentinels: (WakeLockSentinelLike & { released: number; drop: () => void })[] = [];
  const visibility: { state: DocumentVisibilityState } = { state: 'visible' };
  const listeners: (() => void)[] = [];
  let resolveNext: (() => void) | null = null;
  let hold = false;
  const api = {
    request: vi.fn(async () => {
      if (options.refuse) throw new DOMException('refused', 'NotAllowedError');
      if (hold) await new Promise<void>((r) => (resolveNext = r));
      const onRelease: (() => void)[] = [];
      const sentinel = {
        released: 0,
        release: async () => {
          sentinel.released++;
        },
        addEventListener: (_: 'release', fn: () => void) => onRelease.push(fn),
        // The browser releases the lock itself (page hidden)
        drop: () => onRelease.forEach((fn) => fn()),
      };
      sentinels.push(sentinel);
      return sentinel;
    }),
  };
  const doc = {
    get visibilityState() {
      return visibility.state;
    },
    addEventListener: (_: string, fn: () => void) => listeners.push(fn),
  } as unknown as Pick<Document, 'visibilityState' | 'addEventListener'>;
  return {
    api,
    doc,
    sentinels,
    show: (state: DocumentVisibilityState) => {
      visibility.state = state;
      listeners.forEach((fn) => fn());
    },
    holdRequests: () => (hold = true),
    finishRequest: () => resolveNext?.(),
  };
}

const flush = () => new Promise((r) => setTimeout(r, 0));

describe('screen keeper', () => {
  it('holds the lock while wanted and releases it when not', async () => {
    const b = fakeBrowser();
    const changes: boolean[] = [];
    const keeper = createScreenKeeper(b.api, b.doc, (held) => changes.push(held));
    keeper.set(true);
    await flush();
    expect(b.api.request).toHaveBeenCalledWith('screen');
    expect(changes).toEqual([true]);
    keeper.set(false);
    expect(b.sentinels[0].released).toBe(1);
    expect(changes).toEqual([true, false]);
  });

  it('asks once, however often it is wanted again', async () => {
    const b = fakeBrowser();
    const keeper = createScreenKeeper(b.api, b.doc, () => {});
    keeper.set(true);
    keeper.set(true);
    await flush();
    keeper.set(true);
    await flush();
    expect(b.api.request).toHaveBeenCalledTimes(1);
  });

  it('takes the lock again when the page comes back after the browser released it', async () => {
    const b = fakeBrowser();
    const changes: boolean[] = [];
    const keeper = createScreenKeeper(b.api, b.doc, (held) => changes.push(held));
    keeper.set(true);
    await flush();
    b.show('hidden');
    b.sentinels[0].drop(); // the browser releases the lock of a hidden page
    await flush();
    expect(changes).toEqual([true, false]);
    b.show('visible');
    await flush();
    expect(b.api.request).toHaveBeenCalledTimes(2);
    expect(changes).toEqual([true, false, true]);
  });

  it('does not ask while the page is hidden, and not again once it is not wanted', async () => {
    const b = fakeBrowser();
    const keeper = createScreenKeeper(b.api, b.doc, () => {});
    b.show('hidden');
    keeper.set(true);
    await flush();
    expect(b.api.request).not.toHaveBeenCalled();
    keeper.set(false);
    b.show('visible');
    await flush();
    expect(b.api.request).not.toHaveBeenCalled();
  });

  it('gives back a lock that arrives after it stopped being wanted', async () => {
    const b = fakeBrowser();
    const changes: boolean[] = [];
    const keeper = createScreenKeeper(b.api, b.doc, (held) => changes.push(held));
    b.holdRequests();
    keeper.set(true);
    keeper.set(false); // GAME left while the browser was still answering
    b.finishRequest();
    await flush();
    expect(b.sentinels[0].released).toBe(1);
    expect(changes).toEqual([]);
  });

  it('a refused request or a browser without the API changes nothing and throws nothing', async () => {
    const refusing = fakeBrowser({ refuse: true });
    const changes: boolean[] = [];
    createScreenKeeper(refusing.api, refusing.doc, (held) => changes.push(held)).set(true);
    await flush();
    expect(refusing.api.request).toHaveBeenCalledTimes(1);
    const none = fakeBrowser();
    const keeper = createScreenKeeper(undefined, none.doc, (held) => changes.push(held));
    keeper.set(true);
    keeper.set(false);
    await flush();
    expect(changes).toEqual([]);
  });
});
