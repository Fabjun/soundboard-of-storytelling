# dist/ — Drop-in code for Soundboard of Storytelling PWA

This folder contains **vanilla JS + CSS** translations of the design
system, ready to drop into your single-`index.html` PWA. No JSX, no
build step, no dependencies.

## Files

| File | Drop into | Use |
|---|---|---|
| `pad.css` | `<style>` block or `<link>` tag | All PAD styling — depth stack, type colours, hot / setup / hover states, optional aura + breathing |
| `icons.js` | `<script src>` tag | Pixel-art icon library (38 icons) + `pixelIcon(id, size, color)` returning an SVG string |
| `render-pad.js` | `<script src>` tag | `renderPad(padData)` returning a PAD HTML string for `innerHTML` |
| `quick-access.css` + `quick-access.js` | `<link>` + `<script src>` | The "★ pinned pads" strip across the top of the workspace |
| `command-palette.css` + `command-palette.js` | `<link>` + `<script src>` | ⌘K palette — jump to any pad, scene, action, setting by typing two letters |

`tokens.css` (from project root) is the prerequisite — it provides
all the CSS variables that `pad.css` consumes. Load it first.

## Load order

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="tokens.css">
  <link rel="stylesheet" href="dist/pad.css">
</head>
<body>
  <div class="sb" id="root">
    <div id="pgrid" class="pads-canvas--aura"></div>
  </div>

  <script src="dist/icons.js"></script>
  <script src="dist/render-pad.js"></script>
  <script>
    // your existing renderPerf() / renderSetup() can now call renderPad()
  </script>
</body>
</html>
```

## Example — render a board

```js
const board = [
  { id: 'p1', type: 'single',   name: 'Tavern Door', hotkey: 'F1', meta: '0:04' },
  { id: 'p2', type: 'loop',     name: 'Rain Heavy',  hotkey: 'F2', meta: '∞ · loop', hot: true },
  { id: 'p3', type: 'loop',     name: 'Fireplace',   hotkey: 'F3', meta: '∞ · loop', hot: true },
  { id: 'p4', type: 'single',   name: 'Sword Clash', hotkey: 'F4', meta: '0:02' },
  { id: 'p5', type: 'playlist', name: 'Tavern Mix',  hotkey: 'F5', meta: '14 tracks' },
  { id: 'p6', type: 'combo',    name: 'Boss Reveal', hotkey: 'F6', meta: '4-chain' },
];

document.getElementById('pgrid').innerHTML = board.map(renderPad).join('');

// Toggle SETUP mode without re-rendering everything:
document.getElementById('pgrid').querySelectorAll('.pad').forEach(el => {
  el.classList.toggle('pad--setup', currentMode === 'setup');
});

// Toggle hot on a specific pad:
const el = document.querySelector(`[data-pad-id="p1"]`);
el.classList.add('pad--hot');
```

## Custom PAD layouts

The `.pad` class is just a container — you can render anything inside
without breaking the depth/state styling. The renderer above is one
opinionated layout; the simplest possible PAD is:

```html
<div class="pad pad--loop pad--hot">
  Anything you want here
</div>
```

…and you'll still get the type spine, hot glow, drop-shadow, and bevel.

## Icon usage outside of pads

```js
element.innerHTML = pixelIcon('flame', 24);                  // currentColor
element.innerHTML = pixelIcon('moon',  16, 'var(--gold)');   // explicit
```

All 38 icons live in the `ICONS` array exported on `window`. Filter
by `cat` ('ui' | 'mystic') for an icon-picker UI.

**The full icon set:**

- **UI** (28) — flame · play · stop · loop · tag · book · cog · bulb · info · download · save · search · edit · keyboard · pin · star-fill · grip · arrow-up · arrow-down · chevron-right · chevron-down · enter · cmd · check · close · plus · minus · folder · bell · clock · volume · filter · list · grid · chain
- **Mystic** (11) — moon · star · sparkle · eye · potion · key · rune · skull · hourglass · diamond · scroll

## Quick Access strip

```js
document.getElementById('toolbar').innerHTML = renderQuickAccessStrip({
  pinned: [
    { id: 'p1', type: 'single',   name: 'Dice Roll', hotkey: '⌘1' },
    { id: 'p2', type: 'single',   name: 'Door Slam', hotkey: '⌘2' },
    { id: 'p3', type: 'loop',     name: 'Heartbeat', hotkey: '⌘5', hot: true },
    { id: 'p4', type: 'combo',    name: 'Stinger',   hotkey: '⌘6' },
  ],
  capacity: 8,  // total slots; one empty placeholder is shown
});

// Click handling — pinpoint to the chip with a data-pad-id
document.getElementById('toolbar').addEventListener('click', (e) => {
  const item = e.target.closest('.qa-item[data-pad-id]');
  if (item) triggerPad(item.dataset.padId);
});
```

The strip uses the same type colours as PADs. To mark a chip as "playing"
without re-rendering everything: `item.classList.toggle('qa-item--hot', isPlaying)`.

## Command palette (⌘K / Ctrl+K)

```js
const cp = createCommandPalette({
  items: [
    { kind: 'pad-loop',     label: 'Rain Heavy',  meta: 'F2 · 2:14',  run: () => triggerPad('p2') },
    { kind: 'pad-single',   label: 'Thunder',     meta: 'F8 · 0:03',  run: () => triggerPad('p8') },
    { kind: 'pad-playlist', label: 'Tavern Mix',  meta: 'F7 · 14',    run: () => triggerPad('p7') },
    { kind: 'scene',        label: 'The Tavern',  meta: 'Board 1',    run: () => openScene(2) },
    { kind: 'action',       label: 'Stop all',    meta: 'ENTER',      run: stopAll },
    { kind: 'action',       label: 'Crossfade to next', meta: 'SPACE', run: nextScene },
    { kind: 'setting',      label: 'Set crossfade duration…', meta: 'Settings → Audio', run: () => openSetting('audio.crossfade') },
  ],
  // optional — defaults to Cmd/Ctrl+K
  hotkey: (e) => (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k',
});

// Open programmatically — e.g. from a "/" key listener
document.addEventListener('keydown', (e) => {
  if (e.key === '/' && !isTyping()) { e.preventDefault(); cp.open(); }
});

// Refresh items when state changes (new pad created, scene renamed, etc.)
cp.setItems(buildPaletteIndex());
```

**Item kinds with built-in icons + accents** — `pad-single`, `pad-loop`,
`pad-playlist`, `pad-combo`, `scene`, `action`, `setting`, `board`, `audio`.
Add your own — they'll fall back to the diamond glyph in `--text-dim`.

The palette is **self-contained**: appends `<div class="cp-overlay">` to
`document.body`, listens for the hotkey globally, handles ↑↓ navigation,
Enter / Esc, click-outside-to-close. No external state required.

## Optional flourishes

Add these classes to a parent container that holds your pads:

| Class | Effect |
|---|---|
| `pads-canvas--aura` | Hot pads get a wider radial glow that breathes (3.4s) |
| `pads-canvas--breathing` | Idle Loop pads have a subtle spine pulse (5.2s) |

Both are pure CSS — no JS hooks needed.
