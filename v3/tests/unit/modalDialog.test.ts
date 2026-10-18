// @vitest-environment jsdom
/**
 * @fileoverview modalDialog — unit tests: a dialog is modal from its first paint on (ADR-0074)
 *
 * Edge-case checklist: open → the page outside inert, the focus on the data-autofocus element, else
 * the dialog itself, else the chosen element; close → the marks gone before the focus goes back
 * (an inert element takes no focus), to the opener or the chosen element, not to an opener that
 * left the page; a root keeps the inert marks inside it; inactive → nothing; an element inert
 * already stays inert after close.
 */

import { h, render } from 'preact';
import { useRef } from 'preact/hooks';
import { useModalDialog, type ModalDialogOptions } from '../../src/lib/modalDialog';

function Dialog({ options, autofocus }: { options?: ModalDialogOptions; autofocus?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useModalDialog(ref, options);
  return h(
    'div',
    { ref, tabIndex: -1, id: 'dialog' },
    h('button', { id: 'first' }, 'first'),
    h('button', { id: 'safe', 'data-autofocus': autofocus ? '' : undefined }, 'safe'),
  );
}

let page: HTMLElement;
let opener: HTMLButtonElement;
let host: HTMLElement;

beforeEach(() => {
  page = document.createElement('main');
  opener = document.createElement('button');
  page.append(opener);
  host = document.createElement('div');
  document.body.append(page, host);
  opener.focus();
});
afterEach(() => {
  render(null, host);
  document.body.innerHTML = '';
});

const byId = (id: string) => document.getElementById(id);

describe('useModalDialog', () => {
  it('makes the page outside inert and focuses the data-autofocus element at once', () => {
    render(h(Dialog, { autofocus: true }), host);
    expect(page.hasAttribute('inert')).toBe(true);
    expect(host.hasAttribute('inert')).toBe(false);
    expect(document.activeElement).toBe(byId('safe'));
  });

  it('focuses the dialog itself without a data-autofocus element — never a first field', () => {
    render(h(Dialog, { options: {} }), host);
    expect(document.activeElement).toBe(byId('dialog'));
  });

  it('focuses the chosen element when one is given', () => {
    render(h(Dialog, { options: { initialFocus: (el) => el.querySelector('#first') } }), host);
    expect(document.activeElement).toBe(byId('first'));
  });

  it('on close lifts the marks first, then gives the focus back to the opener', () => {
    // jsdom lets an inert element take the focus, so the order is read at the call itself
    const inertWhenFocused: boolean[] = [];
    vi.spyOn(opener, 'focus').mockImplementation(() => {
      inertWhenFocused.push(page.hasAttribute('inert'));
    });
    render(h(Dialog, { autofocus: true }), host);
    render(null, host);
    expect(page.hasAttribute('inert')).toBe(false);
    expect(inertWhenFocused).toEqual([false]);
  });

  it('gives the focus back to the chosen element instead', () => {
    const other = document.createElement('button');
    page.append(other);
    render(h(Dialog, { options: { returnFocus: () => other } }), host);
    render(null, host);
    expect(document.activeElement).toBe(other);
  });

  it('does not focus an opener that has left the page', () => {
    const focus = vi.spyOn(opener, 'focus');
    render(h(Dialog, { options: {} }), host);
    opener.remove();
    render(null, host);
    expect(focus).not.toHaveBeenCalled();
  });

  it('marks only up to the root', () => {
    render(h(Dialog, { options: { root: () => host } }), host);
    expect(page.hasAttribute('inert')).toBe(false);
  });

  it('does nothing while inactive, and becomes modal when it turns active', () => {
    render(h(Dialog, { options: { active: false } }), host);
    expect(page.hasAttribute('inert')).toBe(false);
    expect(document.activeElement).toBe(opener);
    render(h(Dialog, { options: { active: true } }), host);
    expect(page.hasAttribute('inert')).toBe(true);
    render(h(Dialog, { options: { active: false } }), host);
    expect(page.hasAttribute('inert')).toBe(false);
    expect(document.activeElement).toBe(opener);
  });

  it('leaves an element that was inert before inert after close', () => {
    page.setAttribute('inert', '');
    render(h(Dialog, { options: {} }), host);
    render(null, host);
    expect(page.hasAttribute('inert')).toBe(true);
  });
});
