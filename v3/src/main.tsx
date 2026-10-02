import { render } from 'preact';
import { App } from './App';
// Fonts are self-hosted (OFL, from @fontsource) — no request to a third-party origin (audit A2).
import '@fontsource/press-start-2p';
import '@fontsource/vt323';
import '@fontsource/share-tech-mono';
import './styles/global.css';
import { initAudioBridge } from './audio/index';
import { loadStoredState } from './state/boot';

// Apply the design-system root class to <body>.
// All design tokens and layout utilities depend on this being present.
document.body.classList.add('sb');

// Wire the audio engine's pad-started/stopped events to Preact Signals.
// Must run before the first play() call; safe to call at module load time.
initAudioBridge();

// First render only once the stored state is loaded: nothing the user creates can be replaced
// by a late load (src/state/boot.ts).
void loadStoredState().finally(() => render(<App />, document.getElementById('app')!));
