/**
 * @fileoverview debugLog — the console's messages kept for the developer view (settings.md S8)
 * Cases: nothing kept while off; each level kept with its time while on, the console still
 * writing; started twice keeps once; the last 200 only; strings, errors, objects and values that
 * JSON cannot write; stopped → the console's own methods back, the kept messages stay; clear;
 * the copy text.
 */

import {
  DEBUG_LOG_MAX,
  clearDebugLog,
  debugLogEntries,
  debugLogText,
  formatArgs,
  startDebugLog,
  stopDebugLog,
} from '../../src/lib/debugLog';

/** A console of its own, so the test runner's console is never wrapped. */
function fakeConsole() {
  const written: string[] = [];
  const target = {
    log: (...a: unknown[]) => written.push(`log ${a.join(' ')}`),
    info: (...a: unknown[]) => written.push(`info ${a.join(' ')}`),
    warn: (...a: unknown[]) => written.push(`warn ${a.join(' ')}`),
    error: (...a: unknown[]) => written.push(`error ${a.join(' ')}`),
  };
  return { target: target as unknown as Console, written, originals: { ...target } };
}

afterEach(() => {
  stopDebugLog();
  clearDebugLog();
});

describe('debugLog', () => {
  it('keeps nothing while off; keeps every level while on, and the console still writes', () => {
    const c = fakeConsole();
    c.target.log('before');
    startDebugLog(c.target);
    c.target.log('one');
    c.target.info('two');
    c.target.warn('three');
    c.target.error('four');
    expect(debugLogEntries().map((e) => `${e.level} ${e.text}`)).toEqual([
      'log one',
      'info two',
      'warn three',
      'error four',
    ]);
    expect(c.written).toEqual(['log before', 'log one', 'info two', 'warn three', 'error four']);
    expect(debugLogEntries()[0].ts).toBeGreaterThan(0);
  });

  it('started twice keeps each message once', () => {
    const c = fakeConsole();
    startDebugLog(c.target);
    startDebugLog(c.target);
    c.target.warn('once');
    expect(debugLogEntries()).toHaveLength(1);
    expect(c.written).toEqual(['warn once']);
  });

  it(`keeps only the last ${DEBUG_LOG_MAX}`, () => {
    const c = fakeConsole();
    startDebugLog(c.target);
    for (let i = 0; i < DEBUG_LOG_MAX + 5; i++) c.target.log(`m${i}`);
    expect(debugLogEntries()).toHaveLength(DEBUG_LOG_MAX);
    expect(debugLogEntries()[0].text).toBe('m5');
  });

  it('stopped: the console has its own methods back; the kept messages stay until cleared', () => {
    const c = fakeConsole();
    startDebugLog(c.target);
    c.target.log('kept');
    stopDebugLog();
    expect(c.target.log).toBe(c.originals.log);
    c.target.log('not kept');
    expect(debugLogEntries().map((e) => e.text)).toEqual(['kept']);
    clearDebugLog();
    expect(debugLogEntries()).toEqual([]);
  });

  it('writes strings as they are, errors with their stack, the rest as JSON', () => {
    const err = new Error('boom');
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    expect(formatArgs(['a', 1, { b: 2 }, null])).toBe('a 1 {"b":2} null');
    expect(formatArgs([err])).toContain('boom');
    expect(formatArgs([undefined])).toBe('undefined');
    expect(formatArgs([circular])).toBe('[object Object]');
  });

  it('the copy text has one line per message: time, level, text', () => {
    const c = fakeConsole();
    startDebugLog(c.target);
    c.target.warn('careful');
    expect(debugLogText()).toMatch(/^\d{4}-\d\d-\d\dT[\d:.]+Z WARN careful$/);
  });
});
