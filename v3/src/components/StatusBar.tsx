/**
 * @fileoverview StatusBar — fixed bottom bar showing mode, board, and info
 *
 * Source: design-sources/2026-05-25/v2-screens.jsx StatusBarV2
 */

import type { ComponentChildren, JSX } from 'preact';
import type { AppMode } from '../types';

interface StatusBarProps {
  mode: AppMode;
  boardName?: string;
  infoText?: string;
  right?: ComponentChildren;
}

/** Shows the mode (LIVE in GAME, EDIT in SETUP), the board name, an info text and a right slot. */
export function StatusBar({ mode, boardName, infoText, right }: StatusBarProps): JSX.Element {
  const modeColor = mode === 'play' ? 'var(--gold)' : 'var(--mode-setup)';
  const modeLabel = mode === 'play' ? 'LIVE' : 'EDIT';

  return (
    <div class="sb-status-bar">
      <span class="sb-status-section" style={{ color: modeColor }}>
        {modeLabel}
      </span>
      {boardName && <span class="sb-status-section">{boardName}</span>}
      {infoText && <span class="sb-status-section">{infoText}</span>}
      {right && <span class="sb-status-right">{right}</span>}
    </div>
  );
}
