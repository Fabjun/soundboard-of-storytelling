/**
 * @fileoverview IconPicker — choose one icon from the collection (ADR-0070)
 *
 * Built on V1's picker: a search field (focused on open), the categories as sections that open
 * and close (their icons are drawn only while open — iPhone memory, as V1), a switch for the names
 * under the icons, a tap picks and closes. Beyond V1: the search reads names AND search words
 * (src/lib/iconSet.ts). The packs and the catalog load when the picker opens.
 *
 * Keyboard (W3C APG grid pattern, https://www.w3.org/WAI/ARIA/apg/patterns/grid/): each icon grid
 * is one Tab stop; the arrow keys move between its icons, Enter or Space picks, Escape closes.
 */

import { useEffect, useRef, useState } from 'preact/hooks';
import type { JSX } from 'preact';
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
import { IconGlyph } from './PadIcons';
import { PixelIcon } from './PixelIcon';

/** At most this many search results are drawn at once — a short word can match thousands. */
const MAX_RESULTS = 240;

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
                : results.length > MAX_RESULTS
                  ? `${results.length} icons match — the first ${MAX_RESULTS} are shown; add a word to narrow it.`
                  : `${results.length} ${results.length === 1 ? 'icon matches' : 'icons match'}.`}
            </p>
            <IconGrid
              keys={results.slice(0, MAX_RESULTS)}
              chosen={chosen}
              names={names}
              onPick={onPick}
              label="Search results"
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
                  <IconGrid keys={keys} chosen={chosen} names={names} onPick={onPick} label={cat} />
                )}
              </section>
            );
          })}
      </div>
    </div>
  );
}

interface IconGridProps {
  keys: readonly string[];
  chosen: readonly string[];
  names: boolean;
  onPick: (key: string) => void;
  label: string;
}

/** Icons as a grid of buttons: one Tab stop, arrow keys between the icons (APG grid). */
function IconGrid({ keys, chosen, names, onPick, label }: IconGridProps): JSX.Element {
  const [focus, setFocus] = useState(0);
  const grid = useRef<HTMLDivElement>(null);

  /** Moves the focus by `step` cells; up and down move by the number of columns shown. */
  function move(e: KeyboardEvent, index: number): void {
    const cells = [...(grid.current?.querySelectorAll<HTMLButtonElement>('button') ?? [])];
    const top = cells[0]?.offsetTop;
    const cols = Math.max(
      1,
      cells.findIndex((c) => c.offsetTop !== top),
    );
    const perRow = cells.every((c) => c.offsetTop === top) ? cells.length : cols;
    const step = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: perRow, ArrowUp: -perRow }[e.key];
    if (step === undefined) return;
    e.preventDefault();
    const next = Math.min(cells.length - 1, Math.max(0, index + step));
    setFocus(next);
    cells[next]?.focus();
  }

  return (
    <div
      ref={grid}
      class={names ? 'sb-icon-grid has-names' : 'sb-icon-grid'}
      role="group"
      aria-label={label}
    >
      {keys.map((key, i) => {
        const drawing = getIconDrawing(key);
        if (!drawing) return null;
        const name = key.slice(key.indexOf(':') + 1);
        const isChosen = chosen.includes(key);
        return (
          <button
            key={key}
            class={isChosen ? 'sb-icon-cell is-chosen' : 'sb-icon-cell'}
            tabIndex={i === focus ? 0 : -1}
            aria-label={`${name}${isChosen ? ', already on the pad' : ''}`}
            title={key}
            onClick={() => onPick(key)}
            onKeyDown={(e) => move(e, i)}
            onFocus={() => setFocus(i)}
            data-testid={`icon-picker-icon-button-${key}`}
          >
            <IconGlyph drawing={drawing} />
            {names && <span class="sb-icon-cell-name">{name}</span>}
          </button>
        );
      })}
    </div>
  );
}
