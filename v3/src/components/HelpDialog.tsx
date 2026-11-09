/**
 * @fileoverview HelpDialog — the help as a dialog on top of the PAD editor (Slice 17b, BACKLOG
 * "Help screen and context help")
 *
 * The editor stays open below, with what was typed in it; closing the help returns to it. A modal
 * dialog after ADR-0074: the page behind is inert, the focus moves in and back, Escape closes this
 * dialog first. The search and the topics are HelpContent, as on the help screen.
 */

import type { JSX } from 'preact';
import { useRef } from 'preact/hooks';
import { UiIcon } from './UiIcon';
import { HelpContent } from './HelpContent';
import { useModalDialog } from '../lib/modalDialog';
import { useEscapeKey } from '../lib/escapeKey';
import type { HelpTopicId } from '../lib/helpTopics';

/** Shows the help over the page, at `topic`; `onClose` closes it. */
export function HelpDialog({
  topic,
  onClose,
}: {
  topic: HelpTopicId;
  onClose: () => void;
}): JSX.Element {
  const dialog = useRef<HTMLDivElement>(null);
  useModalDialog(dialog);
  useEscapeKey(onClose);

  return (
    <div
      ref={dialog}
      class="sb-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Help"
      tabIndex={-1}
      data-testid="help-dialog"
    >
      <div class="sb-overlay-header">
        <div class="sb-overlay-title sb-flex-1">HELP</div>
        <button class="sb-btn sb-btn-sm sb-btn-ghost" onClick={onClose} aria-label="Close the help">
          <UiIcon name="close" />
        </button>
      </div>
      <div class="sb-overlay-body">
        <HelpContent topic={topic} prefix="help-dialog" />
      </div>
    </div>
  );
}
