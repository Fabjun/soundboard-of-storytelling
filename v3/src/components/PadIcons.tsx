/**
 * @fileoverview PadIcons — a pad's icons, or the placeholder of its type (ADR-0070)
 *
 * One to four icons in V1's arrangement: one alone, two side by side, three as two plus one wide
 * below, four as two by two. A pad without icons shows the placeholder of its type (owner decision
 * 2026-10-04), so all pads look alike and the type stays visible. The icon packs load on demand;
 * until a pack is there, the icon's place stays empty instead of flashing the placeholder. An own
 * icon (`own:<id>`, ADR-0092) is drawn only as an `<img>`; one that was deleted is left out.
 */

import { useEffect, useRef, useState } from 'preact/hooks';
import type { JSX } from 'preact';
import type { PadType } from '../types';
import { getIconDrawing, loadIconSetsFor, type IconDrawing } from '../lib/iconSet';
import { ownIconId, ownIcons, ownIconUrl } from '../state/ownIcons';
import placeholders from '../icons/placeholders.json';

/**
 * The placeholder per pad type (owner decision 2026-10-04): a circle for Single, an infinity sign
 * for Loop, a double circle for Combo — collection icons whose drawings build-icons copies into the
 * start bundle, so a board draws them without loading a pack.
 */
const PLACEHOLDER: Record<PadType, IconDrawing & { key: string }> = placeholders;

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

/**
 * Draws an own icon (ADR-0092) as an image of its SVG — never inline, so a script in the file
 * never runs; empty until its file is read, and when it is gone.
 */
export function OwnIconImage({ id }: { id: string }): JSX.Element {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    void ownIconUrl(id).then((u) => live && setUrl(u));
    return () => {
      live = false;
    };
  }, [id]);
  return url ? <img class="sb-icon-glyph" src={url} alt="" /> : <span class="sb-icon-glyph" />;
}

/** One icon a pad shows: a drawing of the collection, or the id of an own icon. */
type Shown = { drawing: IconDrawing } | { own: string };

/** The picture area of a pad: its icons in V1's arrangement, or its type's placeholder. */
export function PadIcons({ icons = [], type }: PadIconsProps): JSX.Element {
  // Own keys are not in any pack: they would count as still loading
  const collection = icons.filter((k) => ownIconId(k) === null);
  const drawings = useIconDrawings(collection);
  const drawingOf = new Map(collection.map((k, i) => [k, drawings?.[i]]));
  const ownIds = new Set(ownIcons.value.map((i) => i.id));
  const shown = icons.flatMap((key): Shown[] => {
    const own = ownIconId(key);
    if (own !== null) return ownIds.has(own) ? [{ own }] : [];
    const drawing = drawingOf.get(key);
    return drawing ? [{ drawing }] : [];
  });
  if (collection.length > 0 && drawings === null) {
    return <div class="sb-pad-icons" aria-hidden="true" data-testid="pad-icons" />;
  }
  if (shown.length === 0) {
    return (
      <div class="sb-pad-icons is-placeholder" aria-hidden="true" data-testid="pad-icons">
        <IconGlyph drawing={PLACEHOLDER[type]} />
      </div>
    );
  }
  return (
    <div class={`sb-pad-icons is-count-${shown.length}`} aria-hidden="true" data-testid="pad-icons">
      {shown.map((s, i) =>
        'own' in s ? (
          <OwnIconImage key={i} id={s.own} />
        ) : (
          <IconGlyph key={i} drawing={s.drawing} />
        ),
      )}
    </div>
  );
}
