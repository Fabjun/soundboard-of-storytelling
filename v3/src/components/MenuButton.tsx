/**
 * @fileoverview MenuButton — a "⋯" button that opens a short menu of actions
 *
 * The W3C APG menu button pattern for actions
 * (https://www.w3.org/WAI/ARIA/apg/patterns/menubutton/): the button has `aria-haspopup="menu"`
 * and `aria-expanded`; the menu is `role="menu"` with `menuitem` entries. Opening it puts the
 * focus on the first entry; ↑ / ↓ / Home / End move between the entries; Escape closes it and
 * gives the focus back to the button (through `useEscapeKey`, ADR-0074); Tab and a press outside
 * close it. First used for the deck actions (one 44 px button instead of three 28 px ones, owner
 * decision 2026-10-11 — docs/architecture/0083-menu-button.md).
 */

import { useId, useLayoutEffect, useRef, useState } from 'preact/hooks';
import type { JSX } from 'preact';
import { useEscapeKey } from '../lib/escapeKey';

/** One action of the menu. */
export interface MenuAction {
  /** What the entry says — also its accessible name. */
  label: string;
  /** Runs the action. Returns true to keep the menu open (a delete waiting for its second tap). */
  onSelect: () => boolean | void;
  /** Its test ID (`<component>-<element>-button`). */
  testid: string;
  /** Shown in the danger color (a delete). */
  danger?: boolean;
}

interface MenuButtonProps {
  /** The button's accessible name, e.g. "Actions for deck Deck 1". */
  label: string;
  /** The button's test ID. */
  testid: string;
  actions: MenuAction[];
}

/** Shows a "⋯" button that opens the menu of `actions` below it. */
export function MenuButton({ label, testid, actions }: MenuButtonProps): JSX.Element {
  const [open, setOpen] = useState(false);
  const menuId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const items = () => [
    ...(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? []),
  ];

  function close(refocus: boolean) {
    setOpen(false);
    if (refocus) buttonRef.current?.focus();
  }

  // The first entry gets the focus when the menu opens — before it is painted (layout effect)
  useLayoutEffect(() => {
    if (open) items()[0]?.focus();
  }, [open]);

  // A press outside closes it
  useLayoutEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!menuRef.current?.contains(t) && !buttonRef.current?.contains(t)) close(false);
    };
    document.addEventListener('pointerdown', onDown);
    return () => document.removeEventListener('pointerdown', onDown);
  }, [open]);

  useEscapeKey(() => close(true), open);

  function onMenuKey(e: KeyboardEvent) {
    const list = items();
    const at = list.indexOf(document.activeElement as HTMLElement);
    const go = (i: number) => {
      e.preventDefault();
      list[(i + list.length) % list.length]?.focus();
    };
    if (e.key === 'ArrowDown') go(at + 1);
    else if (e.key === 'ArrowUp') go(at - 1);
    else if (e.key === 'Home') go(0);
    else if (e.key === 'End') go(list.length - 1);
    else if (e.key === 'Tab') close(false);
  }

  return (
    <span class="sb-menu">
      <button
        ref={buttonRef}
        type="button"
        class="sb-btn sb-btn-sm sb-btn-ghost"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        data-testid={testid}
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
      >
        ⋯
      </button>
      {open && (
        <div
          ref={menuRef}
          id={menuId}
          class="sb-menu-list"
          role="menu"
          aria-label={label}
          onKeyDown={onMenuKey}
        >
          {actions.map((a) => (
            <button
              key={a.testid}
              type="button"
              role="menuitem"
              tabIndex={-1}
              class={a.danger ? 'sb-menu-item is-danger' : 'sb-menu-item'}
              data-testid={a.testid}
              onClick={(e) => {
                e.stopPropagation();
                if (a.onSelect() !== true) close(true);
              }}
            >
              {a.label}
            </button>
          ))}
        </div>
      )}
    </span>
  );
}
