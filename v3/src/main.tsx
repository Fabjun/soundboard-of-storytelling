/**
 * @fileoverview App entry point — wires the global services, then renders the app
 *
 * Fonts, global styles, the audio bridge, the saving marker and the play history are set up at
 * module load; the first render waits until the stored state and the preferences are loaded
 * (CLAUDE.md, "Stored state loads before the first render").
 */

import { render } from 'preact';
import { effect } from '@preact/signals';
import { App } from './App';
// Fonts are self-hosted (OFL, from @fontsource) — no request to a third-party origin (audit A2).
import '@fontsource/press-start-2p';
import '@fontsource/vt323';
import '@fontsource/share-tech-mono';
import './styles/global.css';
import { initAudioBridge } from './audio/index';
import { pendingSaves } from './state/store';
import { loadPrefs } from './state/prefs';
import { startPlayHistory } from './state/playHistory';
import { startKeyControl } from './state/keyControl';
import { loadStoredState } from './state/boot';

// Apply the design-system root class to <body>.
// All design tokens and layout utilities depend on this being present.
document.body.classList.add('sb');

// Wire the audio engine's pad-started/stopped events to Preact Signals.
// Must run before the first play() call; safe to call at module load time.
initAudioBridge();

// `data-saving` on <html> while a board save runs — a change shows before it is stored, so
// whatever must not lose it (E2E reloads, a future "Saving…" hint) waits for it to go away.
effect(() => {
  document.documentElement.toggleAttribute('data-saving', pendingSaves.value > 0);
});

// Remember when each pad was last played ("Last played" sort in All pads).
startPlayHistory();

// Keys play pads in GAME (Slice 12a, ADR-0077).
startKeyControl();

// First render only once the stored state (src/state/boot.ts) and the preferences
// (src/state/prefs.ts) are loaded: nothing the user creates can be replaced by a late load, and
// no screen shows a default first and then jumps. allSettled, not all: one failing load must not
// let the app render before the other has finished.
void Promise.allSettled([loadStoredState(), loadPrefs()]).then(() =>
  render(<App />, document.getElementById('app')!),
);
