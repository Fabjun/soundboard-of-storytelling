/**
 * @fileoverview BarToggle — a toolbar icon that folds a bar of the board screen (2026-10-11)
 *
 * Owner decision 2026-10-11: the search bar, the quick-access bar and the deck tabs fold behind an
 * icon each — a magnifying glass, a star, a hand of cards — like the Lock, to give the pads room;
 * the icons come from the pad icon collection, in the pads' style. The toggle is a disclosure
 * button (`aria-expanded`, W3C APG disclosure pattern); a folded bar stays folded after a reload
 * (src/state/prefs.ts). When a folded bar holds something that is in effect — a search, pads in
 * the quick-access bar — the icon carries a dot, so nothing changes without a visible reason
 * (Nielsen heuristic 1, visibility of system status).
 */

import type { JSX } from 'preact';
import { IconGlyph } from './PadIcons';
import toolbar from '../icons/toolbar.json';

/** The toolbar's icons, bundled at build time (scripts/build-icons.ts TOOLBAR). */
export type ToolbarIconName = keyof typeof toolbar;

/** Draws one of the toolbar's collection icons, in the current text color. */
export function ToolbarIcon({ name }: { name: ToolbarIconName }): JSX.Element {
  return (
    <span class="sb-toolbar-icon">
      <IconGlyph drawing={toolbar[name]} />
    </span>
  );
}

interface BarToggleProps {
  icon: ToolbarIconName;
  /** What the bar is, e.g. "search bar" — the button says "Show the search bar" / "Hide …". */
  bar: string;
  open: boolean;
  /** Something in the folded bar is in effect: the icon carries a dot. */
  marked?: boolean;
  /** The id of the bar's element, for `aria-controls` while it is shown. */
  controls?: string;
  testid: string;
  onToggle: () => void;
}

/** Shows the icon that shows or folds a bar. */
export function BarToggle({
  icon,
  bar,
  open,
  marked = false,
  controls,
  testid,
  onToggle,
}: BarToggleProps): JSX.Element {
  const label = `${open ? 'Hide' : 'Show'} the ${bar}`;
  return (
    <button
      type="button"
      class={`sb-btn sb-btn-sm ${open ? 'sb-btn-primary' : 'sb-btn-ghost'} sb-topbar-icon-btn${marked && !open ? ' has-marker' : ''}`}
      aria-expanded={open}
      aria-controls={open ? controls : undefined}
      aria-label={marked && !open ? `${label} — it is in effect` : label}
      title={label}
      data-testid={testid}
      onClick={onToggle}
    >
      <ToolbarIcon name={icon} />
    </button>
  );
}
