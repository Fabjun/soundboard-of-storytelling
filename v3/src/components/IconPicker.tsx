/**
 * @fileoverview IconPicker — choose one icon from the collection (ADR-0070)
 *
 * Built on V1's picker: a search field (focused on open), the categories as sections that open
 * and close (their icons are drawn only while open — iPhone memory, as V1), a switch for the names
 * under the icons, a tap picks and closes. Beyond V1: the search reads names AND search words
 * (src/lib/iconSet.ts). The packs and the catalog load when the picker opens.
 *
 * Keyboard (W3C APG grid pattern, https://www.w3.org/WAI/ARIA/apg/patterns/grid/): each icon grid
 * is one Tab stop; the arrow keys move between its icons, Home and End to the ends of a row, Enter
 * or Space picks, Escape closes.
 *
 * A grid draws only its visible rows (owner decision 2026-10-04): a short search word or an open
 * category can hold thousands of icons — iPhone memory. Each grid has its own virtualizer
 * (`@tanstack/virtual-core`) on the overlay's scroll area, offset by where the grid starts
 * (`scrollMargin`); `aria-rowcount` and `aria-rowindex` tell assistive technology about the rows
 * not drawn (WAI-ARIA).
 */

import { useEffect, useLayoutEffect, useRef, useState } from 'preact/hooks';
import type { JSX } from 'preact';
import {
  elementScroll,
  observeElementOffset,
  observeElementRect,
  Virtualizer,
  type VirtualizerOptions,
} from '@tanstack/virtual-core';
import {
  getIconDrawing,
  ICON_CATEGORIES,
  iconsByCategory,
  loadIconCatalog,
  loadIconSets,
  searchIcons,
  type IconCatalog,
  type IconCategory,
} from '../lib/iconSet';
import { moveIndex, rowCount, rowKeys, trackCount } from '../lib/iconGrid';
import { IconGlyph } from './PadIcons';
import { PixelIcon } from './PixelIcon';

/** Rows drawn beyond the visible ones on each side, so a quick scroll shows no gap. */
const OVERSCAN = 4;

// Kept between openings (UI rule: an overlay reopens where it was left)
const memory = { open: new Set<IconCategory>(), scroll: 0, names: false };

interface IconPickerProps {
  /** Keys the pad has already — marked in the grid. */
  chosen: readonly string[];
  onPick: (key: string) => void;
  onClose: () => void;
}

/** The overlay to choose one icon. */
export function IconPicker({ chosen, onPick, onClose }: IconPickerProps): JSX.Element {
  const [catalog, setCatalog] = useState<IconCatalog | null>(null);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(() => new Set(memory.open));
  const [names, setNames] = useState(memory.names);
  const body = useRef<HTMLDivElement>(null);
  const search = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let live = true;
    void Promise.all([loadIconSets(), loadIconCatalog()]).then(([, c]) => live && setCatalog(c));
    search.current?.focus();
    return () => {
      live = false;
    };
  }, []);

  // Back to where the list was left, once the icons are there
  useEffect(() => {
    if (catalog && body.current) body.current.scrollTop = memory.scroll;
  }, [catalog]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const groups = catalog ? iconsByCategory() : null;
  const total = groups ? [...groups.values()].reduce((n, keys) => n + keys.length, 0) : 0;
  const results = catalog && query.trim() ? searchIcons(query, catalog) : null;

  function toggle(cat: IconCategory): void {
    const next = new Set(open);
    if (next.has(cat)) next.delete(cat);
    else next.add(cat);
    memory.open = next;
    setOpen(next);
  }

  function toggleNames(): void {
    memory.names = !names;
    setNames(!names);
  }

  return (
    <div
      class="sb-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Choose an icon"
      data-testid="icon-picker"
    >
      <div class="sb-overlay-header">
        <div class="sb-overlay-title">CHOOSE ICON</div>
        <button
          class="sb-btn sb-btn-sm sb-btn-ghost"
          onClick={onClose}
          aria-label="Close the icon list"
          data-testid="icon-picker-close-button"
        >
          ×
        </button>
      </div>
      <div class="sb-search-bar">
        <div class="sb-search-field">
          <PixelIcon name="search" size={12} color="var(--text-mute)" />
          <input
            ref={search}
            class="sb-search-input sb-flex-1"
            type="search"
            aria-label="Search icons by name or word"
            placeholder={catalog ? `Search ${total} icons…` : 'Loading icons…'}
            value={query}
            onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
            data-testid="icon-picker-search-input"
          />
          {query && (
            <button class="sb-btn-clear" onClick={() => setQuery('')} aria-label="Clear the search">
              ×
            </button>
          )}
        </div>
        <button
          class="sb-btn sb-btn-sm sb-btn-ghost"
          aria-pressed={names}
          onClick={toggleNames}
          data-testid="icon-picker-names-button"
        >
          NAMES
        </button>
      </div>
      <div
        class="sb-overlay-body"
        ref={body}
        onScroll={(e) => (memory.scroll = (e.currentTarget as HTMLElement).scrollTop)}
      >
        {!groups && <p class="sb-caption">Loading icons…</p>}
        {results && (
          <>
            <p class="sb-caption" data-testid="icon-picker-result-count-text">
              {results.length === 0
                ? 'No icon matches. Try another word, e.g. "sword", "night" or "rain".'
                : `${results.length} ${results.length === 1 ? 'icon matches' : 'icons match'}.`}
            </p>
            <IconGrid
              keys={results}
              chosen={chosen}
              names={names}
              onPick={onPick}
              label="Search results"
              scroller={body}
            />
          </>
        )}
        {groups &&
          !results &&
          ICON_CATEGORIES.map((cat) => {
            const keys = groups.get(cat) ?? [];
            if (keys.length === 0) return null;
            const isOpen = open.has(cat);
            return (
              <section key={cat} class="sb-col">
                <button
                  class="sb-icon-picker-category"
                  aria-expanded={isOpen}
                  onClick={() => toggle(cat)}
                  data-testid={`icon-picker-category-button-${cat}`}
                >
                  <span aria-hidden="true">{isOpen ? '▼' : '▶'}</span>
                  <span class="sb-flex-1">{cat.toUpperCase()}</span>
                  <span class="sb-count-text">{keys.length}</span>
                </button>
                {isOpen && (
                  <IconGrid
                    keys={keys}
                    chosen={chosen}
                    names={names}
                    onPick={onPick}
                    label={cat}
                    scroller={body}
                  />
                )}
              </section>
            );
          })}
      </div>
    </div>
  );
}

type VirtualRows = Virtualizer<HTMLElement, HTMLElement>;
type RowOptions = Omit<
  VirtualizerOptions<HTMLElement, HTMLElement>,
  'observeElementRect' | 'observeElementOffset' | 'scrollToFn' | 'onChange'
>;

/**
 * A virtualizer for Preact, with the lifecycle of TanStack's own React adapter: new options on
 * every render, mounted once, updated after every render, drawn again when its range changes.
 */
function useVirtualRows(options: RowOptions): VirtualRows {
  const [, setTick] = useState(0);
  const resolved: VirtualizerOptions<HTMLElement, HTMLElement> = {
    observeElementRect,
    observeElementOffset,
    scrollToFn: elementScroll,
    ...options,
    onChange: () => setTick((n) => n + 1),
  };
  const [rows] = useState(() => new Virtualizer(resolved));
  rows.setOptions(resolved);
  useLayoutEffect(() => rows._didMount(), [rows]);
  useLayoutEffect(() => rows._willUpdate());
  return rows;
}

/** What a grid reads from its CSS layout: columns, row gap, where it starts, a row's height. */
type GridShape = { cols: number; gap: number; margin: number; rowSize: number };

interface IconGridProps {
  keys: readonly string[];
  chosen: readonly string[];
  names: boolean;
  onPick: (key: string) => void;
  label: string;
  /** The overlay's scroll area, which the grid's rows scroll in. */
  scroller: { current: HTMLElement | null };
}

/** Icons as a grid of buttons, drawn row by row as they scroll into view (APG grid). */
function IconGrid({ keys, chosen, names, onPick, label, scroller }: IconGridProps): JSX.Element {
  const grid = useRef<HTMLDivElement>(null);
  const [focus, setFocus] = useState(0);
  // The icon a key moved to, until it is drawn and focused
  const pending = useRef<number | null>(null);
  // Until the first layout: one column, a touch-target row (sub-token: iOS minimum touch target)
  const [shape, setShape] = useState<GridShape>({ cols: 1, gap: 0, margin: 0, rowSize: 44 });
  const rows = useVirtualRows({
    count: rowCount(keys.length, shape.cols),
    getScrollElement: () => scroller.current,
    estimateSize: () => shape.rowSize,
    gap: shape.gap,
    scrollMargin: shape.margin,
    overscan: OVERSCAN,
  });

  // The shape comes from the CSS (auto-fill columns, row gap) and from where the grid sits in the
  // scroll area — both change when the width changes or a category above opens or closes
  // eslint-disable-next-line react-hooks/exhaustive-deps -- measured after every layout (as TanStack's adapter updates the virtualizer); setShape runs only when a value changed
  useLayoutEffect(() => {
    const el = grid.current;
    const area = scroller.current;
    if (!el || !area) return;
    const style = getComputedStyle(el);
    const firstRow = el.querySelector<HTMLElement>('[role="row"]');
    const next: GridShape = {
      cols: trackCount(style.gridTemplateColumns),
      gap: parseFloat(style.rowGap) || 0,
      margin: el.getBoundingClientRect().top - area.getBoundingClientRect().top + area.scrollTop,
      rowSize: firstRow?.offsetHeight || shape.rowSize,
    };
    if (Object.entries(next).some(([k, v]) => shape[k as keyof GridShape] !== v)) setShape(next);
  });

  // Rows change height with the names switch and with the column count: measure them again
  useEffect(() => rows.measure(), [rows, names, shape.cols]);

  // A move by key may land on a row not drawn yet: it is focused once it is drawn
  const current = Math.min(focus, Math.max(0, keys.length - 1));
  useLayoutEffect(() => {
    if (pending.current === null) return;
    const button = grid.current?.querySelector<HTMLButtonElement>(
      `[data-testid="icon-picker-icon-button-${keys[pending.current]}"]`,
    );
    if (!button) return;
    pending.current = null;
    button.focus();
  });

  function onKey(e: KeyboardEvent, index: number): void {
    // A key pressed before the last move's icon is drawn and focused moves on from that icon
    const next = moveIndex(pending.current ?? index, e.key, shape.cols, keys.length);
    if (next === null) return;
    e.preventDefault();
    pending.current = next;
    setFocus(next);
    rows.scrollToIndex(Math.floor(next / shape.cols));
  }

  const drawn = rows.getVirtualItems();
  // One Tab stop: the focused icon, or the first drawn one while the focused row is not drawn
  const focusRow = Math.floor(current / shape.cols);
  const tabStop = drawn.some((r) => r.index === focusRow)
    ? current
    : (drawn[0]?.index ?? 0) * shape.cols;

  return (
    <div
      ref={grid}
      class={names ? 'sb-icon-grid has-names' : 'sb-icon-grid'}
      role="grid"
      aria-label={label}
      aria-rowcount={rowCount(keys.length, shape.cols)}
      aria-colcount={shape.cols}
      style={{ height: `${rows.getTotalSize()}px` }}
    >
      {drawn.map((row) => (
        <div
          key={row.key}
          ref={rows.measureElement}
          data-index={row.index}
          class="sb-icon-grid-row"
          role="row"
          aria-rowindex={row.index + 1}
          style={{ transform: `translateY(${row.start - shape.margin}px)` }}
        >
          {rowKeys(keys, row.index, shape.cols).map((key, col) => {
            const i = row.index * shape.cols + col;
            const drawing = getIconDrawing(key);
            const name = key.slice(key.indexOf(':') + 1);
            const isChosen = chosen.includes(key);
            return (
              <div key={key} class="sb-icon-grid-cell" role="gridcell">
                {drawing && (
                  <button
                    class={isChosen ? 'sb-icon-cell is-chosen' : 'sb-icon-cell'}
                    tabIndex={i === tabStop ? 0 : -1}
                    aria-label={`${name}${isChosen ? ', already on the pad' : ''}`}
                    title={key}
                    onClick={() => onPick(key)}
                    onKeyDown={(e) => onKey(e, i)}
                    onFocus={() => setFocus(i)}
                    data-testid={`icon-picker-icon-button-${key}`}
                  >
                    <IconGlyph drawing={drawing} />
                    {names && <span class="sb-icon-cell-name">{name}</span>}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
