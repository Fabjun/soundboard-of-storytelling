/**
 * @fileoverview Vitest global setup for unit tests
 *
 * fake-indexeddb/auto patches globalThis with all IDB class constructors:
 *   IDBRequest, IDBTransaction, IDBFactory, IDBKeyRange, etc.
 *
 * jsdom does not implement IndexedDB. Without this import, any test that
 * imports idb.ts (which calls openDB from the 'idb' package) would fail with
 * "IDBRequest is not defined".
 *
 * The auto-import runs once. Per-test isolation (fresh database per test) is
 * handled in idb.test.ts by replacing globalThis.indexedDB per beforeEach.
 */

import 'fake-indexeddb/auto';
