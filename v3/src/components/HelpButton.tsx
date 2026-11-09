/**
 * @fileoverview HelpButton — the ? of a header: the help at the topic of the place (Slice 17b,
 * BACKLOG "Help screen and context help")
 *
 * One icon button in the header's style, named "Help" (an icon button carries its name). By
 * default it opens the help screen at the place's topic (src/state/help.ts); the PAD editor passes
 * its own `onOpen` to show the help as a dialog on top of it.
 */

import type { JSX } from 'preact';
import { UiIcon } from './UiIcon';
import { openHelp } from '../state/help';

/** Shows the ? that opens the help. */
export function HelpButton({ onOpen }: { onOpen?: () => void }): JSX.Element {
  return (
    <button
      type="button"
      class="sb-btn sb-btn-sm sb-btn-ghost sb-topbar-icon-btn"
      aria-label="Help"
      title="Help for this screen"
      onClick={() => (onOpen ? onOpen() : openHelp())}
    >
      <UiIcon name="help" class="sb-toolbar-icon" />
    </button>
  );
}
