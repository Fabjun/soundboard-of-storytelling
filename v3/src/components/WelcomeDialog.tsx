/**
 * @fileoverview WelcomeDialog — three cards on the first start: what the app is, how it works, the
 * first steps (Slice 17d, BACKLOG "Help screen and context help")
 *
 * Shown over the main menu on the first start of a fresh installation and from the help at any
 * time (src/state/help.ts). SKIP on every card but the last, BACK from the second on, NEXT and on
 * the last card DONE; Escape skips. A modal dialog after ADR-0074: the page behind is inert, the
 * focus starts on NEXT and goes back to where it was. The texts are WELCOME_CARDS in
 * src/lib/helpTopics.ts.
 */

import type { JSX } from 'preact';
import { useRef, useState } from 'preact/hooks';
import { useModalDialog } from '../lib/modalDialog';
import { useEscapeKey } from '../lib/escapeKey';
import { WELCOME_CARDS } from '../lib/helpTopics';
import { closeWelcome } from '../state/help';

/** Shows the welcome's cards one at a time; closing it in any way marks it as seen. */
export function WelcomeDialog(): JSX.Element {
  const dialog = useRef<HTMLDivElement>(null);
  const primary = useRef<HTMLButtonElement>(null);
  const [index, setIndex] = useState(0);
  useModalDialog(dialog);
  useEscapeKey(closeWelcome);
  const card = WELCOME_CARDS[index];
  const last = index === WELCOME_CARDS.length - 1;

  return (
    <div
      ref={dialog}
      class="sb-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="welcome-dialog-title"
      tabIndex={-1}
      data-testid="welcome-dialog"
    >
      <div class="sb-overlay-header">
        <div class="sb-overlay-title sb-flex-1" id="welcome-dialog-title">
          {card.title}
        </div>
        <span class="sb-caption" data-testid="welcome-dialog-step-text">
          {index + 1} of {WELCOME_CARDS.length}
        </span>
      </div>
      <div class="sb-overlay-body">
        <div class="sb-help-text">
          {card.text.map((p) => (
            <p key={p} class="sb-caption">
              {p}
            </p>
          ))}
        </div>
      </div>
      <div class="sb-dialog-actions">
        {!last && (
          <button class="sb-btn sb-btn-sm sb-btn-ghost" onClick={closeWelcome}>
            SKIP
          </button>
        )}
        <span class="sb-flex-1" />
        {index > 0 && (
          <button
            class="sb-btn sb-btn-sm sb-btn-ghost"
            onClick={() => {
              setIndex(index - 1);
              // BACK goes away on the first card; the focus must not fall to the page
              primary.current?.focus();
            }}
          >
            BACK
          </button>
        )}
        <button
          ref={primary}
          class="sb-btn sb-btn-sm sb-btn-primary sb-dialog-action-btn"
          data-autofocus
          onClick={() => (last ? closeWelcome() : setIndex(index + 1))}
        >
          {last ? 'DONE' : 'NEXT'}
        </button>
      </div>
    </div>
  );
}
