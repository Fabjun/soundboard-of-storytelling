/**
 * @fileoverview StatusBar — fixed bottom bar showing mode, board, and info
 *
 * Source: design-sources/2026-05-25/v2-screens.jsx StatusBarV2
 */

import type { ComponentChildren, JSX } from 'preact';
import type { AppMode } from '../types';
import { saveState, screenKeptOn } from '../state/store';

/** The words for each save state (Slice 12e). */
const SAVE_LABELS = { saving: 'SAVING…', failed: 'NOT SAVED', saved: 'SAVED' } as const;

interface StatusBarProps {
  mode: AppMode;
  boardName?: string;
  infoText?: string;
  right?: ComponentChildren;
}

/**
 * Shows the mode (LIVE in GAME, EDIT in SETUP), whether changes are saved (SAVING… / SAVED /
 * NOT SAVED, Slice 12e), SCREEN ON while the screen is kept on, the board name, an info text and
 * a right slot.
 */
export function StatusBar({ mode, boardName, infoText, right }: StatusBarProps): JSX.Element {
  const modeColor = mode === 'play' ? 'var(--gold)' : 'var(--mode-setup)';
  const modeLabel = mode === 'play' ? 'LIVE' : 'EDIT';
  const save = saveState.value;

  return (
    <div class="sb-status-bar">
      <span class="sb-status-section" style={{ color: modeColor }}>
        {modeLabel}
      </span>
      {/* A failed save is announced (role alert) and says what happened in plain words
          (Nielsen 9); saving / saved stay quiet — they change with every edit */}
      <span
        class={save === 'failed' ? 'sb-status-section sb-error-label' : 'sb-status-section'}
        data-testid="status-bar-save-text"
        role={save === 'failed' ? 'alert' : undefined}
        title={
          save === 'failed'
            ? 'The last change could not be stored; the board shows what is stored. Free up storage space, then make the change again.'
            : undefined
        }
      >
        {SAVE_LABELS[save]}
      </span>
      {screenKeptOn.value && (
        <span class="sb-status-section" data-testid="status-bar-screen-on-text">
          SCREEN ON
        </span>
      )}
      {boardName && <span class="sb-status-section">{boardName}</span>}
      {infoText && <span class="sb-status-section">{infoText}</span>}
      {right && <span class="sb-status-right">{right}</span>}
    </div>
  );
}
