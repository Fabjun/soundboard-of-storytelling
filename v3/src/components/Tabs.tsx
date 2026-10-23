/**
 * @fileoverview Tabs — the one tab row of the app (WAI-ARIA APG "Tabs", automatic activation)
 *
 * A tablist of buttons in the `sb-tab` look: the chosen tab has `aria-selected` and is the only one
 * in the Tab order; Arrow Left / Right move between tabs and choose them, Home and End go to the
 * first and the last (APG keyboard interaction). The caller renders the panel of every tab with
 * `tabPanelProps`, the others `hidden`, so each tab's `aria-controls` names an element. Used by the
 * library's tabs and the PAD editor's SOUND / LIGHT. The deck row on a phone (DeckRail) is a
 * navigation, not tabs: it changes what the board shows and marks the deck with `aria-current`.
 */

import { useRef } from 'preact/hooks';
import type { ComponentChildren, JSX } from 'preact';

/** One tab: its id (unique in the row) and what it shows. */
export interface TabItem<T extends string> {
  id: T;
  label: ComponentChildren;
}

const tabId = (prefix: string, id: string) => `${prefix}-tab-${id}`;
const panelId = (prefix: string, id: string) => `${prefix}-panel-${id}`;

/** The attributes of a tab's panel: its role, its id, and the tab that names it. */
export function tabPanelProps(
  prefix: string,
  id: string,
): { role: 'tabpanel'; id: string; 'aria-labelledby': string } {
  return { role: 'tabpanel', id: panelId(prefix, id), 'aria-labelledby': tabId(prefix, id) };
}

/** Shows a row of tabs; `onSelect` gets the tab chosen by click, tap or arrow key. */
export function Tabs<T extends string>({
  label,
  prefix,
  tabs,
  selected,
  onSelect,
}: {
  /** What the row chooses between — the tablist's accessible name. */
  label: string;
  /** Unique on the screen: the ids of the tabs and panels start with it. */
  prefix: string;
  tabs: readonly TabItem<T>[];
  selected: T;
  onSelect: (id: T) => void;
}): JSX.Element {
  const row = useRef<HTMLDivElement>(null);

  function move(e: KeyboardEvent) {
    const i = tabs.findIndex((t) => t.id === selected);
    const to =
      e.key === 'ArrowRight'
        ? (i + 1) % tabs.length
        : e.key === 'ArrowLeft'
          ? (i - 1 + tabs.length) % tabs.length
          : e.key === 'Home'
            ? 0
            : e.key === 'End'
              ? tabs.length - 1
              : -1;
    if (to < 0) return;
    e.preventDefault();
    onSelect(tabs[to].id);
    row.current?.querySelector<HTMLElement>(`#${tabId(prefix, tabs[to].id)}`)?.focus();
  }

  return (
    <div class="sb-tabs" role="tablist" aria-label={label} ref={row} onKeyDown={move}>
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          role="tab"
          id={tabId(prefix, t.id)}
          aria-selected={t.id === selected}
          aria-controls={panelId(prefix, t.id)}
          tabIndex={t.id === selected ? 0 : -1}
          class={'sb-tab' + (t.id === selected ? ' is-active' : '')}
          onClick={() => onSelect(t.id)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
