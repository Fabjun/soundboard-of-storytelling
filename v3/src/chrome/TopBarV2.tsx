// ─────────────────────────────────────────────────────────────────────────────
// TopBarV2 — persistent 48px header used on all screens
//
// Source: design-sources/2026-05-25/v2-screens.jsx TopBarV2
// ─────────────────────────────────────────────────────────────────────────────

import type { ComponentChildren, JSX } from 'preact';
import { PixelIcon } from '../components/PixelIcon';
import type { AppMode } from '../types';

interface TopBarV2Props {
  title: string;
  breadcrumb?: string;
  /** Present only on Board screen; omit on screens without a mode toggle. */
  mode?: AppMode;
  onModeSwap?: () => void;
  /** Right-aligned slot — icon buttons, etc. */
  right?: ComponentChildren;
}

export function TopBarV2({
  title,
  breadcrumb,
  mode,
  onModeSwap,
  right,
}: TopBarV2Props): JSX.Element {
  return (
    <div class="sb-topbar">
      {/* Flame logo */}
      <div class="sb-topbar-logo">
        <PixelIcon name="flame" size={20} />
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
          <PixelIcon name={mode === 'play' ? 'play' : 'edit'} size={11} color="currentColor" />
          {mode === 'play' ? 'GAME' : 'SETUP'}
        </span>
      )}

      {/* Right slot */}
      {right}
    </div>
  );
}
