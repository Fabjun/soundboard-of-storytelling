/**
 * @fileoverview TopBar — the 48px header of the library, the board list, Settings and the help
 * (the board screen has its own, BoardTopBar); every one but the help's ends in the ? that opens
 * the help at the screen's topic (Slice 17b)
 *
 * Source: design-sources/2026-05-25/v2-screens.jsx TopBarV2
 */

import type { ComponentChildren, JSX } from 'preact';
import { UiIcon } from './UiIcon';
import { HelpButton } from './HelpButton';
import { currentScreen } from '../state/store';
import type { AppMode } from '../types';

interface TopBarProps {
  title: string;
  breadcrumb?: string;
  /** Present only on Board screen; omit on screens without a mode toggle. */
  mode?: AppMode;
  onModeSwap?: () => void;
  /** Right-aligned slot — icon buttons, etc. */
  right?: ComponentChildren;
}

/** Shows the flame logo, the screen title with an optional breadcrumb, and a right-hand slot. */
export function TopBar({ title, breadcrumb, mode, onModeSwap, right }: TopBarProps): JSX.Element {
  return (
    <div class="sb-topbar" data-testid="top-bar">
      {/* Flame logo */}
      <div class="sb-topbar-logo">
        <UiIcon name="app" size={20} />
      </div>

      {/* Title + breadcrumb */}
      <div class="sb-topbar-title-group">
        <span class="sb-display-vt sb-topbar-title is-app">{title}</span>
        {breadcrumb && <span class="sb-topbar-secondary">· {breadcrumb}</span>}
      </div>

      {/* Mode badge — only when mode is provided */}
      {mode && (
        <span
          class={'sb-mode-badge ' + (mode === 'play' ? 'is-game' : 'is-setup')}
          onClick={onModeSwap}
          style={{ cursor: onModeSwap ? 'pointer' : 'default' }}
        >
          <UiIcon name={mode === 'play' ? 'play' : 'edit'} size={11} color="currentColor" />
          {mode === 'play' ? 'GAME' : 'SETUP'}
        </span>
      )}

      {/* Right slot, then the ? of the screen (Slice 17b) — not on the help itself */}
      {right}
      {currentScreen.value !== 'help' && <HelpButton />}
    </div>
  );
}
