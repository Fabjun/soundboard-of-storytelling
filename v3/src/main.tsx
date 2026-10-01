import { render } from 'preact';
import { effect } from '@preact/signals';
import { App } from './App';
// Fonts are self-hosted (OFL, from @fontsource) — no request to a third-party origin (audit A2).
import '@fontsource/press-start-2p';
import '@fontsource/vt323';
import '@fontsource/share-tech-mono';
import './styles/global.css';
import { initAudioBridge } from './audio/index';
import { pendingBoardSaves } from './state/boardWrites';

// Apply the design-system root class to <body>.
// All design tokens and layout utilities depend on this being present.
document.body.classList.add('sb');

// Wire the audio engine's pad-started/stopped events to Preact Signals.
// Must run before the first play() call; safe to call at module load time.
initAudioBridge();

// `data-saving` on <html> while a board save runs — a change shows before it is stored, so
// whatever must not lose it (E2E reloads, a future "Saving…" hint) waits for it to go away.
effect(() => {
  document.documentElement.toggleAttribute('data-saving', pendingBoardSaves.value > 0);
});

render(<App />, document.getElementById('app')!);
