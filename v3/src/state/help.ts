/**
 * @fileoverview help — opening the help at the topic of the place it is opened from (Slice 17a)
 *
 * The help screen opens at the topic of the screen it was opened from — on a board, of its mode —
 * and BACK returns there (src/lib/helpTopics.ts, topicForPlace).
 */

import { topicForPlace, type HelpTopicId } from '../lib/helpTopics';
import { currentMode, currentScreen, helpReturn, helpTopic } from './store';

/**
 * Opens the help at the topic of the current place, or at `topic` when given; BACK returns to
 * the screen it was opened from. From the help itself it does nothing.
 */
export function openHelp(topic?: HelpTopicId): void {
  const from = currentScreen.value;
  if (from === 'help') return;
  helpReturn.value = from;
  helpTopic.value = topic ?? topicForPlace(from, currentMode.value);
  currentScreen.value = 'help';
}

/** Leaves the help for the screen it was opened from. */
export function closeHelp(): void {
  currentScreen.value = helpReturn.value;
}
