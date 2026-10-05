/**
 * @fileoverview updateCheck — unit tests: the UPDATE button's check (owner decision 2026-10-05)
 *
 * Edge-case checklist: offline (nothing asked), no registration, a version already waiting (the
 * prompt comes back, nothing asked), update() finds one installing, finds one waiting, finds
 * none, throws; offline wins over a missing registration; a message for every result.
 */

import {
  checkForUpdateNow,
  updateCheckMessage,
  updatePromptRequests,
  type UpdatableRegistration,
  type UpdateCheckResult,
} from '../../src/lib/updateCheck';

/** A fake registration; `after` is what update() leaves behind. */
function fakeRegistration(
  before: { waiting?: boolean } = {},
  after: { installing?: boolean; waiting?: boolean; throws?: boolean } = {},
) {
  const sw = {} as ServiceWorker;
  const reg = {
    installing: null as ServiceWorker | null,
    waiting: before.waiting ? sw : (null as ServiceWorker | null),
    update: vi.fn(async () => {
      if (after.throws) throw new Error('network');
      if (after.installing) reg.installing = sw;
      if (after.waiting) reg.waiting = sw;
    }),
  };
  return reg as UpdatableRegistration & { update: ReturnType<typeof vi.fn> };
}

describe('checkForUpdateNow', () => {
  it('asks nothing while offline', async () => {
    const reg = fakeRegistration();
    expect(await checkForUpdateNow(reg, false)).toBe('offline');
    expect(reg.update).not.toHaveBeenCalled();
  });

  it('says offline before it says unavailable', async () => {
    expect(await checkForUpdateNow(null, false)).toBe('offline');
  });

  it('is unavailable without a registration', async () => {
    expect(await checkForUpdateNow(null, true)).toBe('unavailable');
    expect(await checkForUpdateNow(undefined, true)).toBe('unavailable');
  });

  it('finds a version that already waits, asks nothing and brings the prompt back', async () => {
    const reg = fakeRegistration({ waiting: true });
    const before = updatePromptRequests.value;
    expect(await checkForUpdateNow(reg, true)).toBe('found');
    expect(reg.update).not.toHaveBeenCalled();
    expect(updatePromptRequests.value).toBe(before + 1);
  });

  it('finds a version that starts installing', async () => {
    const before = updatePromptRequests.value;
    expect(await checkForUpdateNow(fakeRegistration({}, { installing: true }), true)).toBe('found');
    // The prompt shows on its own once the version is installed
    expect(updatePromptRequests.value).toBe(before);
  });

  it('finds a version that is waiting after the check', async () => {
    expect(await checkForUpdateNow(fakeRegistration({}, { waiting: true }), true)).toBe('found');
  });

  it('reports the newest version when the check finds nothing', async () => {
    const reg = fakeRegistration();
    expect(await checkForUpdateNow(reg, true)).toBe('newest');
    expect(reg.update).toHaveBeenCalledOnce();
  });

  it('reports a failed check when the server does not answer', async () => {
    expect(await checkForUpdateNow(fakeRegistration({}, { throws: true }), true)).toBe('failed');
  });
});

describe('updateCheckMessage', () => {
  const results: UpdateCheckResult[] = ['found', 'newest', 'offline', 'unavailable', 'failed'];

  it('has a different, non-empty message for every result', () => {
    const messages = results.map((r) => updateCheckMessage(r, '3.0.1'));
    expect(messages.every((m) => m.length > 0)).toBe(true);
    expect(new Set(messages).size).toBe(results.length);
  });

  it('names the version when it is the newest', () => {
    expect(updateCheckMessage('newest', '3.0.1')).toContain('3.0.1');
  });
});
