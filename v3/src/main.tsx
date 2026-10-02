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

// Preferences (last view, last backup …) are read before the first render, so no screen shows a
// default first and then jumps (src/state/prefs.ts).
void loadPrefs().finally(() => render(<App />, document.getElementById('app')!));
