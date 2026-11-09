/**
 * @fileoverview HelpScreen — the help as a screen of its own (Slice 17a, BACKLOG "Help screen and
 * context help")
 *
 * Opened from the main menu and from the ? of a screen's header (src/state/help.ts), at the topic
 * of the place it came from; BACK returns there. The search and the topics are HelpContent, which
 * the help dialog over the PAD editor shows too.
 */

import type { JSX } from 'preact';
import { TopBar } from '../components/TopBar';
import { UiIcon } from '../components/UiIcon';
import { HelpContent } from '../components/HelpContent';
import { closeHelp } from '../state/help';
import { helpTopic } from '../state/store';

/** Shows the help topics, the one of the place it came from open. */
export function HelpScreen(): JSX.Element {
  return (
    <div class="sb-screen" data-testid="help-screen">
      <TopBar
        title="Help"
        right={
          <button class="sb-btn sb-btn-sm sb-btn-ghost" onClick={closeHelp}>
            <UiIcon name="back" size={11} />
            BACK
          </button>
        }
      />
      <div class="sb-page">
        <HelpContent topic={helpTopic.value} prefix="help-screen" />
      </div>
    </div>
  );
}
