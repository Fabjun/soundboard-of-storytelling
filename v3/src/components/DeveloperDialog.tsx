/**
 * @fileoverview DeveloperDialog — what the app holds and what it wrote, for finding a problem
 * (docs/product/features/settings.md S8, Slice 14e)
 *
 * V1's DEVELOPER view (log, stats, LRU) as one full-screen dialog with three sections one under
 * the other — STATS (library, boards, pads, cache, log, version), CACHE (the decoded audio in
 * memory, the most recently used first; iPhone memory rule 7) and LOG (the console's messages
 * kept while the debug log is on, with COPY ALL and CLEAR). A modal dialog (ADR-0074): the page
 * behind is inert, the focus starts on CLOSE and Escape closes it.
 */

import { useRef, useState } from 'preact/hooks';
import type { JSX } from 'preact';
import { UiIcon } from './UiIcon';
import { boards, libraryItems } from '../state/store';
import { audioCacheState } from '../audio/index';
import { formatBytes, totalLibraryBytes } from '../lib/upload';
import {
  DEBUG_LOG_MAX,
  clearDebugLog,
  debugLogEntries,
  debugLogText,
  debugLogVersion,
} from '../lib/debugLog';
import { useModalDialog } from '../lib/modalDialog';
import { useEscapeKey } from '../lib/escapeKey';
import { APP_VERSION } from '../lib/changelog';

declare const __BUILD_DATE__: string;

/** Shows the developer view; when it closes, the focus goes back to the control that opened it. */
export function DeveloperDialog({
  debugLogOn,
  onClose,
}: {
  /** Whether the debug log keeps messages now — said above the log. */
  debugLogOn: boolean;
  onClose: () => void;
}): JSX.Element {
  void debugLogVersion.value; // re-render when a message is kept or the log is cleared
  const dialog = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState<string | null>(null);

  useEscapeKey(onClose);
  useModalDialog(dialog);

  const items = libraryItems.value;
  const allBoards = boards.value;
  const cache = audioCacheState();
  const names = new Map(items.map((i) => [i.id, i.name]));
  const log = debugLogEntries();

  const stats: [string, string][] = [
    ['Audio files', String(items.length)],
    ['Audio size', formatBytes(totalLibraryBytes(items))],
    ['Boards', String(allBoards.length)],
    ['Decks', String(allBoards.reduce((n, b) => n + b.decks.length, 0))],
    ['Pads', String(allBoards.reduce((n, b) => n + b.pads.length, 0))],
    ['Decoded audio', `${formatBytes(cache.bytes)} of ${formatBytes(cache.maxBytes)}`],
    ['Decoded files', String(cache.entries.length)],
    ['Log messages', `${log.length} of ${DEBUG_LOG_MAX}`],
    ['Version', `${APP_VERSION} · build ${__BUILD_DATE__}`],
  ];

  async function copyAll() {
    try {
      await navigator.clipboard.writeText(debugLogText());
      setCopied('Copied.');
    } catch {
      setCopied('Could not copy — the browser refused the clipboard. Try again after a tap here.');
    }
  }

  return (
    <div
      ref={dialog}
      class="sb-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="developer-dialog-title"
      data-testid="developer-dialog"
    >
      <div class="sb-overlay-header">
        <h2 class="sb-overlay-title" id="developer-dialog-title">
          DEVELOPER
        </h2>
        <button
          class="sb-btn sb-btn-sm sb-btn-ghost"
          aria-label="Close the developer view"
          data-testid="developer-dialog-close-button"
          data-autofocus
          onClick={onClose}
        >
          <UiIcon name="close" />
        </button>
      </div>

      <div class="sb-overlay-body sb-settings">
        <section class="sb-settings-group" aria-labelledby="developer-dialog-stats-title">
          <h3 class="sb-settings-group-title" id="developer-dialog-stats-title">
            STATS
          </h3>
          <dl class="sb-dev-stats" data-testid="developer-dialog-stats-region">
            {stats.map(([k, v]) => (
              <div key={k} class="sb-row">
                <dt class="sb-flex-1">{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section class="sb-settings-group" aria-labelledby="developer-dialog-cache-title">
          <h3 class="sb-settings-group-title" id="developer-dialog-cache-title">
            CACHE
          </h3>
          {cache.entries.length === 0 ? (
            <div class="sb-caption" data-testid="developer-dialog-cache-text">
              No audio decoded yet — the cache fills when pads play.
            </div>
          ) : (
            <dl class="sb-dev-stats" data-testid="developer-dialog-cache-region">
              {cache.entries.map(({ hash, bytes }) => (
                <div key={hash} class="sb-row">
                  <dt class="sb-flex-1">{names.get(hash) ?? hash.slice(0, 12)}</dt>
                  <dd>{formatBytes(bytes)}</dd>
                </div>
              ))}
            </dl>
          )}
        </section>

        <section class="sb-settings-group" aria-labelledby="developer-dialog-log-title">
          <h3 class="sb-settings-group-title" id="developer-dialog-log-title">
            LOG
          </h3>
          <div class="sb-caption">
            {debugLogOn
              ? `The last ${DEBUG_LOG_MAX} messages of the app are kept while the debug log is on.`
              : 'The debug log is off — switch it on in Settings to keep messages.'}
          </div>
          <div class="sb-row">
            <button
              class="sb-btn sb-btn-sm sb-btn-ghost"
              data-testid="developer-dialog-copy-button"
              disabled={log.length === 0}
              onClick={() => void copyAll()}
            >
              COPY ALL
            </button>
            <button
              class="sb-btn sb-btn-sm sb-btn-ghost"
              data-testid="developer-dialog-clear-button"
              disabled={log.length === 0}
              onClick={() => {
                clearDebugLog();
                setCopied(null);
              }}
            >
              CLEAR
            </button>
          </div>
          <div class="sb-caption" role="status">
            {copied}
          </div>
          <pre class="sb-dev-log" data-testid="developer-dialog-log-text">
            {debugLogText() || 'No messages.'}
          </pre>
        </section>
      </div>
    </div>
  );
}
