// ─────────────────────────────────────────────────────────────────────────────
// persistentStorage — D4: ask for persistent storage, never fail
// Cases: API missing, already persisted (no second request), granted, refused, throwing.
// ─────────────────────────────────────────────────────────────────────────────

import { requestPersistentStorage } from '../../src/db/persistentStorage';

afterEach(() => vi.unstubAllGlobals());

const stubStorage = (storage: Partial<StorageManager> | undefined) =>
  vi.stubGlobal('navigator', { storage });

describe('requestPersistentStorage', () => {
  it('is unsupported without navigator.storage.persist (iOS < 15.2)', async () => {
    stubStorage(undefined);
    expect(await requestPersistentStorage()).toBe('unsupported');
    stubStorage({});
    expect(await requestPersistentStorage()).toBe('unsupported');
  });

  it('does not ask again when the storage is already persistent', async () => {
    const persist = vi.fn(async () => true);
    stubStorage({ persisted: async () => true, persist });
    expect(await requestPersistentStorage()).toBe('persisted');
    expect(persist).not.toHaveBeenCalled();
  });

  it('reports whether the browser granted the request', async () => {
    stubStorage({ persisted: async () => false, persist: async () => true });
    expect(await requestPersistentStorage()).toBe('persisted');
    stubStorage({ persisted: async () => false, persist: async () => false });
    expect(await requestPersistentStorage()).toBe('not-granted');
  });

  it('never throws', async () => {
    stubStorage({
      persisted: async () => false,
      persist: async () => {
        throw new Error('denied');
      },
    });
    expect(await requestPersistentStorage()).toBe('not-granted');
  });
});
