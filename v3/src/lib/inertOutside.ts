/**
 * @fileoverview inertOutside — everything around a modal dialog is made inert while it is open
 *
 * A modal dialog keeps the keyboard and screen readers inside (WAI-ARIA APG, Dialog (Modal)
 * pattern: "content outside a modal dialog is inert"). The HTML `inert` attribute does that for
 * every element it is set on; this marks every sibling on the way from the dialog up to a root
 * — the same walk as react-aria's ariaHideOutside. Elements that were inert already stay so.
 * Browsers without `inert` (iOS before 15.5) ignore the attribute; the dialog still covers the
 * page, only Tab can then reach the page behind it.
 */

/**
 * Marks every element outside `dialog`, up to and including the children of `root`, as inert.
 * Returns the function that takes the marks away again (only the ones set here).
 */
export function inertOutside(dialog: Element, root: Element): () => void {
  const marked: Element[] = [];
  let node: Element | null = dialog;
  while (node && node !== root && node.parentElement) {
    for (const sibling of Array.from(node.parentElement.children)) {
      if (sibling === node || sibling.hasAttribute('inert')) continue;
      sibling.setAttribute('inert', '');
      marked.push(sibling);
    }
    node = node.parentElement;
  }
  return () => {
    for (const el of marked) el.removeAttribute('inert');
  };
}
