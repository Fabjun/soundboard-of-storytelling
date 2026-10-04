/**
 * @fileoverview PadIcons — a pad's icons, or the placeholder of its type (ADR-0070)
 *
 * One to four icons in V1's arrangement: one alone, two side by side, three as two plus one wide
 * below, four as two by two. A pad without icons shows the placeholder of its type (owner decision
 * 2026-10-04), so all pads look alike and the type stays visible. The icon packs load on demand;
 * until a pack is there, the icon's place stays empty instead of flashing the placeholder.
 */

import { useEffect, useRef, useState } from 'preact/hooks';
import type { JSX } from 'preact';
import type { PadType } from '../types';
import { getIconDrawing, loadIconSetsFor, type IconDrawing } from '../lib/iconSet';
import { PixelIcon, type PixelIconName } from './PixelIcon';

/** The placeholder per pad type: the UI icons that already stand for the types. */
const PLACEHOLDER: Record<PadType, PixelIconName> = {
  single: 'play',
  loop: 'loop',
  combo: 'sparkle',
};

/** Draws one icon of the collection; an unknown key draws nothing. */
export function IconGlyph({
  drawing,
  label,
}: {
  drawing: IconDrawing;
  label?: string;
}): JSX.Element {
  return (
    <svg
      class="sb-icon-glyph"
      viewBox={`0 0 ${drawing.size} ${drawing.size}`}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <path fill="currentColor" d={drawing.d} shape-rendering="crispEdges" />
    </svg>
  );
}

/** The drawings of `keys`, loading their packs on first use; null while a pack is loading. */
export function useIconDrawings(keys: readonly string[]): (IconDrawing | undefined)[] | null {
  const [, setLoaded] = useState(0);
  const missing = keys.some((k) => !getIconDrawing(k));
  // The keys count by their joined value: a new array with the same keys loads nothing again
  const id = keys.join(' ');
  const current = useRef(keys);
  current.current = keys;
  useEffect(() => {
    if (!missing) return;
    let live = true;
    void loadIconSetsFor(current.current).then(() => live && setLoaded((n) => n + 1));
    return () => {
      live = false;
    };
  }, [id, missing]);
  const drawings = keys.map(getIconDrawing);
  // Keys of a pack that is not loaded yet give undefined; once loading has finished, an
  // undefined drawing means the key is unknown (it is then left out).
  return missing && drawings.every((d) => !d) ? null : drawings;
}

interface PadIconsProps {
  icons: readonly string[] | undefined;
  type: PadType;
}

/** The picture area of a pad: its icons in V1's arrangement, or its type's placeholder. */
export function PadIcons({ icons = [], type }: PadIconsProps): JSX.Element {
  const drawings = useIconDrawings(icons);
  const shown = (drawings ?? []).filter((d): d is IconDrawing => !!d);
  if (icons.length > 0 && drawings === null) {
    return <div class="sb-pad-icons" aria-hidden="true" data-testid="pad-icons" />;
  }
  if (shown.length === 0) {
    return (
      <div class="sb-pad-icons is-placeholder" aria-hidden="true" data-testid="pad-icons">
        <PixelIcon name={PLACEHOLDER[type]} size={24} />
      </div>
    );
  }
  return (
    <div class={`sb-pad-icons is-count-${shown.length}`} aria-hidden="true" data-testid="pad-icons">
      {shown.map((d, i) => (
        <IconGlyph key={i} drawing={d} />
      ))}
    </div>
  );
}
