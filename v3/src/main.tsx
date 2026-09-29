import { render } from 'preact';
import { App } from './App';
import './styles/global.css';
import { initAudioBridge } from './audio/index';

// Apply the design-system root class to <body>.
// All design tokens and layout utilities depend on this being present.
document.body.classList.add('sb');

// Wire the audio engine's pad-started/stopped events to Preact Signals.
// Must run before the first play() call; safe to call at module load time.
initAudioBridge();

render(<App />, document.getElementById('app')!);
