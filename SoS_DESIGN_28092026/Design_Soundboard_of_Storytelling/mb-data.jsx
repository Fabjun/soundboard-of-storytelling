// mb-data.jsx — pad/scene data + self-contained pixel icons for the prototype.

// ── Pixel icons (self-contained; rects/lines only, on-brand) ──────
function MBIcon({ name, size = 14, color = 'currentColor', style }) {
  const p = { width: size, height: size, viewBox: '0 0 16 16', fill: color, style };
  switch (name) {
    case 'menu':   return <svg {...p}><rect x="1" y="3" width="14" height="2"/><rect x="1" y="7" width="14" height="2"/><rect x="1" y="11" width="14" height="2"/></svg>;
    case 'play':   return <svg {...p}><path d="M4 2 L13 8 L4 14 Z"/></svg>;
    case 'loop':   return <svg {...p} fill="none" stroke={color} strokeWidth="1.6"><path d="M3 6 a5 5 0 0 1 9 -2"/><path d="M13 10 a5 5 0 0 1 -9 2"/><path d="M12 1 v4 h-4"/><path d="M4 15 v-4 h4"/></svg>;
    case 'list':   return <svg {...p}><rect x="2" y="3" width="12" height="2"/><rect x="2" y="7" width="12" height="2"/><rect x="2" y="11" width="9" height="2"/></svg>;
    case 'chain':  return <svg {...p} fill="none" stroke={color} strokeWidth="1.6"><rect x="2" y="6" width="6" height="4"/><rect x="8" y="6" width="6" height="4"/></svg>;
    case 'stop':   return <svg {...p}><rect x="3" y="3" width="10" height="10"/></svg>;
    case 'plus':   return <svg {...p}><rect x="7" y="2" width="2" height="12"/><rect x="2" y="7" width="12" height="2"/></svg>;
    case 'sliders':return <svg {...p}><rect x="2" y="3" width="12" height="2"/><rect x="2" y="11" width="12" height="2"/><rect x="10" y="1" width="2" height="6"/><rect x="4" y="9" width="2" height="6"/></svg>;
    case 'search': return <svg {...p} fill="none" stroke={color} strokeWidth="1.6"><circle cx="7" cy="7" r="4"/><path d="M10 10 L14 14"/></svg>;
    case 'chevD':  return <svg {...p}><path d="M3 5 L8 11 L13 5 Z"/></svg>;
    case 'chevU':  return <svg {...p}><path d="M3 11 L8 5 L13 11 Z"/></svg>;
    case 'chevR':  return <svg {...p}><path d="M5 3 L11 8 L5 13 Z"/></svg>;
    case 'chevL':  return <svg {...p}><path d="M11 3 L5 8 L11 13 Z"/></svg>;
    case 'dots':   return <svg {...p}><circle cx="5" cy="3" r="1.3"/><circle cx="11" cy="3" r="1.3"/><circle cx="5" cy="8" r="1.3"/><circle cx="11" cy="8" r="1.3"/><circle cx="5" cy="13" r="1.3"/><circle cx="11" cy="13" r="1.3"/></svg>;
    case 'lock':   return <svg {...p}><rect x="3" y="7" width="10" height="7"/><path d="M5 7 V5 a3 3 0 0 1 6 0 V7" fill="none" stroke={color} strokeWidth="1.6"/></svg>;
    case 'unlock': return <svg {...p}><rect x="3" y="7" width="10" height="7"/><path d="M5 7 V5 a3 3 0 0 1 6 0" fill="none" stroke={color} strokeWidth="1.6"/></svg>;
    case 'spark':  return <svg {...p}><path d="M8 1 L9.5 6.5 L15 8 L9.5 9.5 L8 15 L6.5 9.5 L1 8 L6.5 6.5 Z"/></svg>;
    case 'check':  return <svg {...p} fill="none" stroke={color} strokeWidth="2.4"><path d="M3 8 L7 12 L13 4"/></svg>;
    case 'x':      return <svg {...p}><path d="M3 4 L4 3 L8 7 L12 3 L13 4 L9 8 L13 12 L12 13 L8 9 L4 13 L3 12 L7 8 Z"/></svg>;
    case 'gear':   return <svg {...p}><path d="M8 5 a3 3 0 1 0 0 6 a3 3 0 0 0 0 -6 Z M7 1 h2 v2 h-2z M7 13 h2 v2 h-2z M1 7 h2 v2 h-2z M13 7 h2 v2 h-2z"/></svg>;
    case 'grid':   return <svg {...p}><rect x="2" y="2" width="5" height="5"/><rect x="9" y="2" width="5" height="5"/><rect x="2" y="9" width="5" height="5"/><rect x="9" y="9" width="5" height="5"/></svg>;
    case 'flame':  return <svg {...p}><path d="M8 1 C10 4 12 5 12 9 a4 4 0 0 1 -8 0 C4 6 6 6 6 3 C7 4 8 4 8 1 Z"/></svg>;
    case 'undo':   return <svg {...p} fill="none" stroke={color} strokeWidth="1.6"><path d="M5 5 H10 a3 3 0 0 1 0 8 H4"/><path d="M5 2 L2 5 L5 8"/></svg>;
    case 'redo':   return <svg {...p} fill="none" stroke={color} strokeWidth="1.6"><path d="M11 5 H6 a3 3 0 0 0 0 8 H12"/><path d="M11 2 L14 5 L11 8"/></svg>;
    case 'checkbox':    return <svg {...p} fill="none" stroke={color} strokeWidth="1.6"><rect x="2.5" y="2.5" width="11" height="11"/></svg>;
    case 'checkbox-on': return <svg {...p}><rect x="2" y="2" width="12" height="12" rx="1"/><path d="M5 8 L7 10 L11 5" fill="none" stroke="#04201f" strokeWidth="2"/></svg>;
    case 'eq':     return <svg {...p}><rect x="2" y="6" width="2" height="8"/><rect x="6" y="2" width="2" height="12"/><rect x="10" y="9" width="2" height="5"/></svg>;
    default:       return <svg {...p}><rect x="3" y="3" width="10" height="10"/></svg>;
  }
}

const MB_TYPE_ICON = { single: 'play', loop: 'loop', playlist: 'list', combo: 'chain' };

// ── Scenes ────────────────────────────────────────────────────────
const MB_SCENES = ['Approach', 'The Tavern', 'Combat', 'Boss', 'Aftermath'];

// ── Pads for the active scene (~64 slots incl. intentional gaps) ──
// Each entry: { id, type, t, k } or null (an intentional empty grouping gap).
function buildPads() {
  const names = [
    ['single', 'Tavern Door', 'F1'], ['loop', 'Rain Heavy', 'F2'], ['loop', 'Fireplace', 'F3'], ['single', 'Sword Clash', 'F4'],
    ['single', 'Wolf Howl', 'F5'], ['loop', 'Crowd Murmur', 'F6'], ['playlist', 'Tavern Mix', 'F7'], ['single', 'Thunder', 'F8'],
    null, null,
    ['combo', 'Boss Reveal', 'Q'], ['single', 'Door Slam', 'W'], ['playlist', 'Battle Set', 'E'], ['loop', 'Whispers', 'R'],
    ['single', 'Coin Drop', 'T'], ['single', 'Owl Hoot', 'Y'], ['loop', 'Wind', 'U'], ['single', 'Glass Break', 'I'],
    ['playlist', 'Market', 'O'], ['loop', 'River', 'P'], null, null,
    ['single', 'Arrow', 'A'], ['single', 'Shield Bash', 'S'], ['combo', 'Ambush', 'D'], ['loop', 'Heartbeat', 'F'],
    ['single', 'Bell Toll', 'G'], ['loop', 'Cave Drip', 'H'], ['playlist', 'Ritual', 'J'], ['single', 'Spell Fizz', 'K'],
    ['single', 'Footsteps', 'L'], ['loop', 'Torch', 'Z'], null,
    ['combo', 'Dragon', 'X'], ['single', 'Roar', 'C'], ['loop', 'Lava', 'V'], ['single', 'Crackle', 'B'],
    ['playlist', 'Chase', 'N'], ['single', 'Gasp', 'M'], ['loop', 'Storm', '1'], ['single', 'Crash', '2'],
    ['single', 'Knock', '3'], ['loop', 'Chant', '4'], ['playlist', 'Festival', '5'], ['combo', 'Portal', '6'],
    ['single', 'Splash', '7'], ['single', 'Creak', '8'], ['loop', 'Drone', '9'], ['single', 'Snap', '0'],
    null, null,
    ['single', 'Hiss', 'F9'], ['loop', 'Embers', 'F10'], ['playlist', 'Victory', 'F11'], ['single', 'Coin Purse', 'F12'],
    ['single', 'Latch', '!'], ['loop', 'Nightfall', '@'], ['single', 'Whoosh', '#'], ['combo', 'Finale', '$'],
    ['single', 'Tick', '%'], ['loop', 'Murk', '^'],
  ];
  let n = 0;
  return names.map((e, i) => {
    if (!e) return { id: 'gap-' + i, gap: true };
    n++;
    return { id: 'pad-' + i, type: e[0], t: e[1], k: e[2] };
  });
}

const MB_INITIAL_HOT = ['pad-1', 'pad-2']; // Rain Heavy + Fireplace looping

Object.assign(window, { MBIcon, MB_TYPE_ICON, MB_SCENES, buildPads, MB_INITIAL_HOT });
