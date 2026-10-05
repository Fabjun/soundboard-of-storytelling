// @vitest-environment jsdom
/**
 * @fileoverview escapeKey — unit tests: a dialog closes on Escape from its first paint on
 *
 * Edge-case checklist: a key pressed in the same task as the render (no effect flush — the race
 * found in CI 2026-10-05); other keys; inactive; a dialog on top makes the one below inactive and
 * only the top one closes; the newest handler is called; the listener goes with the component.
 */

import { h, render } from 'preact';
import { useEscapeKey } from '../../src/lib/escapeKey';

function Dialog({ onEscape, active }: { onEscape: () => void; active?: boolean }) {
  useEscapeKey(onEscape, active);
  return h('div', null);
}

const press = (key: string) => document.dispatchEvent(new KeyboardEvent('keydown', { key }));

let root: HTMLElement;
beforeEach(() => {
  root = document.createElement('div');
  document.body.appendChild(root);
});
afterEach(() => {
  render(null, root);
  root.remove();
});

describe('useEscapeKey', () => {
  it('hears Escape pressed right after the render, before any passive effect could run', () => {
    const onEscape = vi.fn();
    render(h(Dialog, { onEscape }), root);
    press('Escape');
    expect(onEscape).toHaveBeenCalledOnce();
  });

  it('ignores other keys', () => {
    const onEscape = vi.fn();
    render(h(Dialog, { onEscape }), root);
    press('Enter');
    expect(onEscape).not.toHaveBeenCalled();
  });

  it('does nothing while inactive', () => {
    const onEscape = vi.fn();
    render(h(Dialog, { onEscape, active: false }), root);
    press('Escape');
    expect(onEscape).not.toHaveBeenCalled();
  });

  it('closes only the dialog on top: the one below turns inactive in the same render', () => {
    const below = vi.fn();
    const top = vi.fn();
    render(
      h('div', null, h(Dialog, { onEscape: below, active: false }), h(Dialog, { onEscape: top })),
      root,
    );
    press('Escape');
    expect(top).toHaveBeenCalledOnce();
    expect(below).not.toHaveBeenCalled();
  });

  it('calls the newest handler after a re-render', () => {
    const first = vi.fn();
    const second = vi.fn();
    render(h(Dialog, { onEscape: first }), root);
    render(h(Dialog, { onEscape: second }), root);
    press('Escape');
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledOnce();
  });

  it('stops listening when the component goes', () => {
    const onEscape = vi.fn();
    render(h(Dialog, { onEscape }), root);
    render(null, root);
    press('Escape');
    expect(onEscape).not.toHaveBeenCalled();
  });
});
