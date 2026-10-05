// @vitest-environment jsdom
/**
 * @fileoverview inertOutside — unit tests: the page around a modal dialog is inert while it is open
 *
 * Edge-case checklist: siblings on every level up to the root are marked, nothing inside the
 * dialog or above the root is; an element that was inert already stays inert after the restore;
 * the restore takes away only the marks it set; a dialog directly under the root.
 */

import { inertOutside } from '../../src/lib/inertOutside';

function page() {
  document.body.innerHTML = `
    <div id="outside"></div>
    <div id="root">
      <header id="top"></header>
      <div id="body">
        <nav id="rail"></nav>
        <main id="grid"></main>
        <section id="dialog"><button id="inside"></button></section>
      </div>
      <footer id="status" inert></footer>
    </div>`;
  const $ = (id: string) => document.getElementById(id)!;
  return $;
}

describe('inertOutside', () => {
  it('marks the siblings on every level up to the root, and nothing inside the dialog', () => {
    const $ = page();
    inertOutside($('dialog'), $('root'));
    for (const id of ['rail', 'grid', 'top', 'status'])
      expect($(id).hasAttribute('inert')).toBe(true);
    for (const id of ['dialog', 'inside', 'body', 'root', 'outside'])
      expect($(id).hasAttribute('inert')).toBe(false);
  });

  it('takes away only its own marks: what was inert before stays inert', () => {
    const $ = page();
    const restore = inertOutside($('dialog'), $('root'));
    restore();
    for (const id of ['rail', 'grid', 'top']) expect($(id).hasAttribute('inert')).toBe(false);
    expect($('status').hasAttribute('inert')).toBe(true);
  });

  it('marks the other children of the root when the dialog sits directly under it', () => {
    const $ = page();
    const restore = inertOutside($('body'), $('root'));
    expect($('top').hasAttribute('inert')).toBe(true);
    expect($('rail').hasAttribute('inert')).toBe(false);
    restore();
    expect($('top').hasAttribute('inert')).toBe(false);
  });
});
