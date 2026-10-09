/**
 * @fileoverview PixelIcon — the app's own 16×16 pixel-art UI icons (ADR-0072)
 *
 * The icons are the IconifyJSON set `sos-ui` (src/icons/sets/sos-ui.json), the same format as the
 * pad icon packs (ADR-0070): one path of pixel rectangles per icon, drawn crisp in currentColor.
 * They were first drawn in design-sources/2026-05-25/foundations.jsx (PIXEL_ICONS). The set is
 * the project's own work — not in the icon picker and not in the third-party notices — and is part
 * of the start bundle, since the first screen already shows these icons.
 */

import type { CSSProperties, JSX } from 'preact';
import uiIcons from '../icons/sets/sos-ui.json';
import { iconPath } from '../lib/iconSet';

/** The names of the pixel icons `PixelIcon` can draw. */
export type PixelIconName = keyof typeof uiIcons.icons;

interface PixelIconProps {
  name: PixelIconName;
  size?: number;
  color?: string;
  /** Additional CSS class applied to the SVG element. */
  class?: string;
  style?: CSSProperties;
}

/**
 * Renders a crisp 16×16 pixel-art icon as an SVG.
 * Set `size` to scale (default 16). Color inherits from `currentColor`.
 *
 * Decorative (`aria-hidden`): the icon's name ("book", "flame") is an identifier, not a label —
 * screen readers read "book LIB" or just "flame" otherwise. Meaning comes from the control's own
 * name; a button that shows only an icon has an aria-label (codeGuards, a11y.spec.ts). WAI,
 * "Decorative Images".
 */
export function PixelIcon({
  name,
  size = 16,
  color = 'currentColor',
  class: className,
  style,
}: PixelIconProps): JSX.Element {
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${uiIcons.width} ${uiIcons.height}`}
      aria-hidden="true"
      class={'sb-pixel-icon' + (className ? ' ' + className : '')}
      style={style}
    >
      <path d={iconPath(uiIcons.icons[name].body)} fill={color} shape-rendering="crispEdges" />
    </svg>
  );
}
