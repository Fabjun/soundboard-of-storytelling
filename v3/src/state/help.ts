/**
 * @fileoverview help — opening the help at the topic of the place it is opened from (Slice 17a),
 * and the welcome (Slice 17d)
 *
 * The help screen opens at the topic of the screen it was opened from — on a board, of its mode —
 * and BACK returns there (src/lib/helpTopics.ts, topicForPlace).
 *
 * The welcome: three cards on the first start, skippable, shown again from the help. NN/g ("Mobile
 * Tutorials", "Mobile-App Onboarding") measured that card tutorials hardly make users faster — so
 * few cards, one subject each, always skippable.
 */

import { topicForPlace, type HelpTopicId } from '../lib/helpTopics';
import {
  boards,
  currentMode,
  currentScreen,
  helpReturn,
  helpTopic,
  libraryItems,
  welcomeOpen,
} from './store';
import { getWelcomeSeen, setWelcomeSeen } from './prefs';

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

/** Shows the welcome — from the help, at any time. */
export function openWelcome(): void {
  welcomeOpen.value = true;
}

/** Closes the welcome, finished or skipped; from then on the first start no longer shows it. */
export function closeWelcome(): void {
  welcomeOpen.value = false;
  setWelcomeSeen();
}

/**
 * Shows the welcome on the first start: never closed before, and nothing made yet — no board and
 * no audio. An installation already in use does not get it after an update; the help has it.
 */
export function welcomeOnFirstStart(): void {
  if (getWelcomeSeen() || boards.value.length > 0 || libraryItems.value.length > 0) return;
  welcomeOpen.value = true;
}
