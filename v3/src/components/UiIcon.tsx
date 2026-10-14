/**
 * @fileoverview UiIcon — every icon of the interface, from the pad icon collection (ADR-0085)
 *
 * Owner decision 2026-10-14: the symbols of the menus, screens and buttons come from the icon
 * library, so the whole app keeps one style — the pads' (ADR-0070). One icon per meaning; the
 * meanings and the collection icons that draw them are listed in scripts/build-icons.ts
 * (UI_ICONS), which copies their drawings into src/icons/ui.json for the start bundle — every
 * screen shows some, so none waits for a pack to load.
 *
 * Decorative (`aria-hidden`): the meaning comes from the control's own name; a button that shows
 * only an icon has an aria-label (codeGuards, a11y.spec.ts). WAI, "Decorative Images".
 */

import type { JSX } from 'preact';
import ui from '../icons/ui.json';

/** The meanings an icon of the interface can show. */
export type UiIconName = keyof typeof ui;

/**
 * The side an icon is drawn at: the nearest whole multiple of its pixel grid, at least one — pixel
 * art scaled by a fraction blurs (11 px of a 16-pixel drawing smeared the back arrow, measured
 * 2026-10-14), so a pixel of the drawing always covers whole CSS pixels.
 */
export function pixelSide(size: number, grid: number): number {
  return Math.max(1, Math.round(size / grid)) * grid;
}

/** Draws the icon of `name` — about `size` CSS px square (16 by default), in `color` or the text color. */
export function UiIcon({
  name,
  size = 16,
  color = 'currentColor',
  class: className,
}: {
  name: UiIconName;
  size?: number;
  color?: string;
  /** Additional CSS class on the SVG element (e.g. a fixed size from the stylesheet). */
  class?: string;
}): JSX.Element {
  const { d, size: grid } = ui[name];
  const side = pixelSide(size, grid);
  return (
    <svg
      width={side}
      height={side}
      viewBox={`0 0 ${grid} ${grid}`}
      aria-hidden="true"
      class={'sb-ui-icon' + (className ? ' ' + className : '')}
    >
      <path d={d} fill={color} shape-rendering="crispEdges" />
    </svg>
  );
}
