// mode-toggle-entwuerfe.jsx — 8 interactive EDIT/GAME toggle Entwürfe,
// laid out on a DesignCanvas. Each variant is a real switch (click to flip)
// shown inside a MiniBar TopBar with a mode-reactive BoardStrip beneath.
//
// Relies on window.DesignCanvas / DCSection / DCArtboard (design-canvas.jsx).
const { useState } = React;

// ── Icons (tiny functional UI glyphs) ──────────────────────────────
function SlidersIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6">
      <line x1="2" y1="4" x2="14" y2="4" /><rect x="9" y="2.4" width="3.2" height="3.2" fill="currentColor" stroke="none" />
      <line x1="2" y1="8" x2="14" y2="8" /><rect x="3.8" y="6.4" width="3.2" height="3.2" fill="currentColor" stroke="none" />
      <line x1="2" y1="12" x2="14" y2="12" /><rect x="10" y="10.4" width="3.2" height="3.2" fill="currentColor" stroke="none" />
    </svg>
  );
}
function PlayIcon() {
  return (
    <svg width="15" height="16" viewBox="0 0 15 16" fill="currentColor">
      <path d="M2 1.5 L13.5 8 L2 14.5 Z" />
    </svg>
  );
}
function FullscreenIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6">
      <path d="M1 4V1h3M11 4V1H8M1 8v3h3M11 8v3H8" />
    </svg>
  );
}

// ── MiniBar — the board's TopBar context ───────────────────────────
function MiniBar({ mode, align = 'center', tint = false, children }) {
  return (
    <div className={'mt-bar' + (align === 'left' ? ' align-left' : '') + (tint ? ' tint' : '')} data-mode={mode}>
      <div className="mt-bar-left">
        <span className="mt-menu">MENU</span>
        <span className="mt-crumb">· The Tavern · Board 1</span>
      </div>
      <div className="mt-bar-center">{children}</div>
      <div className="mt-bar-right">
        <span className="mt-ico">?</span>
        <span className="mt-ico"><FullscreenIcon /></span>
      </div>
    </div>
  );
}

// ── BoardStrip — six mini pads that react to the mode ──────────────
const STRIP_PADS = [
  { c: 'loop', k: 'Q' }, { c: 'single', k: 'W' }, { c: 'playlist', k: 'E' },
  { c: 'single', k: 'R' }, { c: 'loop', k: 'A', hot: true }, { c: 'combo', k: 'G' },
];
function BoardStrip({ mode }) {
  const isSetup = mode === 'setup';
  return (
    <div className={'mt-board ' + (isSetup ? 'is-setup sb-grid-bg' : 'is-game')}>
      {STRIP_PADS.map((p, i) => (
        <div key={i} className={'mt-pad ' + p.c + (isSetup ? ' is-setup' : (p.hot ? ' is-hot' : ''))}>
          {isSetup
            ? <span className="mt-pad-handle">⠿</span>
            : <span className="mt-pad-key">{p.k}</span>}
        </div>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// THE 8 TOGGLES
// ════════════════════════════════════════════════════════════════

// 1 · SPLIT — two halves, active half colored (refined current)
function Toggle1({ mode, onChange }) {
  return (
    <div className={'sb-pix mt1 ' + (mode === 'game' ? 'is-game' : 'is-setup')} role="group" aria-label="Board-Modus">
      <button className="mt1-half" data-side="setup" aria-pressed={mode === 'setup'} onClick={() => onChange('setup')}>EDIT</button>
      <span className="mt1-sep" aria-hidden="true" />
      <button className="mt1-half" data-side="game" aria-pressed={mode === 'game'} onClick={() => onChange('game')}>GAME</button>
    </div>
  );
}

// 2 · SLIDING SEGMENT — filled thumb glides between halves
function Toggle2({ mode, onChange }) {
  return (
    <div className={'sb-pix mt2 ' + (mode === 'game' ? 'is-game' : 'is-setup')} role="group" aria-label="Board-Modus">
      <span className="mt2-thumb" aria-hidden="true" />
      <button className="mt2-half" data-side="setup" aria-pressed={mode === 'setup'} onClick={() => onChange('setup')}>EDIT</button>
      <button className="mt2-half" data-side="game" aria-pressed={mode === 'game'} onClick={() => onChange('game')}>GAME</button>
    </div>
  );
}

// 3 · HARDWARE ROCKER — chunky knob slides in a pixel track
function Toggle3({ mode, onChange }) {
  const flip = () => onChange(mode === 'game' ? 'setup' : 'game');
  return (
    <div className={'mt3 ' + (mode === 'game' ? 'is-game' : 'is-setup')} role="group" aria-label="Board-Modus">
      <button className="mt3-side" data-side="setup" onClick={() => onChange('setup')}>EDIT</button>
      <button className="sb-pix mt3-track" onClick={flip} aria-label="Modus umschalten">
        <span className="mt3-knob" aria-hidden="true"><i /><i /><i /></span>
      </button>
      <button className="mt3-side" data-side="game" onClick={() => onChange('game')}>GAME</button>
    </div>
  );
}

// 4 · KNIFE-SWITCH LEVER — handle throws between two seats (physical)
function Toggle4({ mode, onChange }) {
  const flip = () => onChange(mode === 'game' ? 'setup' : 'game');
  return (
    <div className={'mt4 ' + (mode === 'game' ? 'is-game' : 'is-setup')} role="group" aria-label="Board-Modus">
      <button className="mt4-seat" data-side="setup" onClick={() => onChange('setup')}>EDIT</button>
      <button className="mt4-throw" onClick={flip} aria-label="Hebel umlegen">
        <span className="mt4-plate" aria-hidden="true" />
        <span className="mt4-lever" aria-hidden="true"><span className="mt4-ball" /></span>
      </button>
      <button className="mt4-seat" data-side="game" onClick={() => onChange('game')}>GAME</button>
    </div>
  );
}

// Shared lever arm + ball
function LeverArm() {
  return <span className="lev-arm" aria-hidden="true"><span className="lev-ball" /></span>;
}

// 4A · KONSOLEN-PLATTE — lever on a beveled, screw-mounted console
function Toggle4A({ mode, onChange }) {
  const flip = () => onChange(mode === 'game' ? 'setup' : 'game');
  return (
    <div className={'lev mt4a ' + (mode === 'game' ? 'is-game' : 'is-setup')} role="group" aria-label="Board-Modus">
      <div className="sb-pix mt4a-console">
        <span className="lev-screw" aria-hidden="true" /><span className="lev-screw" aria-hidden="true" />
        <button className="lev-engrave" data-side="setup" onClick={() => onChange('setup')}>EDIT</button>
        <button className="lev-throw mt4a-throw" onClick={flip} aria-label="Hebel umlegen">
          <span className="mt4a-mount" aria-hidden="true" />
          <LeverArm />
        </button>
        <button className="lev-engrave" data-side="game" onClick={() => onChange('game')}>GAME</button>
        <span className="lev-screw" aria-hidden="true" /><span className="lev-screw" aria-hidden="true" />
      </div>
    </div>
  );
}

// 4B · EINGELASSENE MULDE — lever rises out of a carved recess
function Toggle4B({ mode, onChange }) {
  const flip = () => onChange(mode === 'game' ? 'setup' : 'game');
  return (
    <div className={'lev mt4b ' + (mode === 'game' ? 'is-game' : 'is-setup')} role="group" aria-label="Board-Modus">
      <div className="sb-pix mt4b-well">
        <button className="lev-engrave" data-side="setup" onClick={() => onChange('setup')}>EDIT</button>
        <button className="lev-throw mt4b-throw" onClick={flip} aria-label="Hebel umlegen">
          <span className="mt4b-slot" aria-hidden="true" />
          <LeverArm />
        </button>
        <button className="lev-engrave" data-side="game" onClick={() => onChange('game')}>GAME</button>
      </div>
    </div>
  );
}

// 4C · SCHALTKULISSE — ball rides a milled slot between two detents
function Toggle4C({ mode, onChange }) {
  const flip = () => onChange(mode === 'game' ? 'setup' : 'game');
  return (
    <div className={'lev mt4c ' + (mode === 'game' ? 'is-game' : 'is-setup')} role="group" aria-label="Board-Modus">
      <div className="sb-pix mt4c-gate">
        <button className="mt4c-track" onClick={flip} aria-label="Schalthebel bewegen">
          <span className="mt4c-slot" aria-hidden="true" />
          <span className="mt4c-detent l" aria-hidden="true" />
          <span className="mt4c-detent r" aria-hidden="true" />
          <span className="mt4c-ball" aria-hidden="true" />
        </button>
        <div className="mt4c-labels">
          <button className="lev-engrave" data-side="setup" onClick={() => onChange('setup')}>EDIT</button>
          <button className="lev-engrave" data-side="game" onClick={() => onChange('game')}>GAME</button>
        </div>
      </div>
    </div>
  );
}

// ── Hebel-Kopf · Charakter — swappable lever heads on the console ──
function LeverHead({ head }) {
  if (head === 'ribbed' || head === 'knurl') {
    return (
      <>
        <span className="lh-collar" aria-hidden="true" />
        <span className="lh-arm" aria-hidden="true"><span className="lh-knob" /></span>
      </>
    );
  }
  return <span className="lh-arm" aria-hidden="true"><span className="lh-knob" /></span>;
}

function ConsoleToggle({ mode, onChange, head }) {
  const flip = () => onChange(mode === 'game' ? 'setup' : 'game');
  return (
    <div className={'lev mt4a lhead-' + head + ' ' + (mode === 'game' ? 'is-game' : 'is-setup')} role="group" aria-label="Board-Modus">
      <div className="sb-pix mt4a-console">
        <span className="lev-screw" aria-hidden="true" /><span className="lev-screw" aria-hidden="true" />
        <button className="lev-engrave" data-side="setup" onClick={() => onChange('setup')}>EDIT</button>
        <button className="lev-throw mt4a-throw" onClick={flip} aria-label="Hebel umlegen">
          <span className="mt4a-mount" aria-hidden="true" />
          <LeverHead head={head} />
        </button>
        <button className="lev-engrave" data-side="game" onClick={() => onChange('game')}>GAME</button>
        <span className="lev-screw" aria-hidden="true" /><span className="lev-screw" aria-hidden="true" />
      </div>
    </div>
  );
}

// 5 · FADER — cap slides along a track, fill follows
const ConsolePixel  = (p) => <ConsoleToggle {...p} head="pixel" />;
const ConsoleRibbed = (p) => <ConsoleToggle {...p} head="ribbed" />;
const ConsoleBat    = (p) => <ConsoleToggle {...p} head="bat" />;
const ConsoleKnurl  = (p) => <ConsoleToggle {...p} head="knurl" />;

// ── engraved ornament cut into the brass cog face — a bezel of radial
// strokes + a beaded ring, drawn in the marker colour so it changes with
// the mode like the hand. Lives inside .cog, so it rotates with the wheel.
function CogOrnament() {
  const cx = 50, cy = 50, ticks = [], beads = [];
  // one bead per tick, on the SAME angle, just inside the tick's inner end —
  // so each dot sits exactly beneath the end of its line.
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const c = Math.cos(a), s = Math.sin(a);
    ticks.push(`M${(cx + c * 33).toFixed(2)} ${(cy + s * 33).toFixed(2)} L${(cx + c * 42).toFixed(2)} ${(cy + s * 42).toFixed(2)}`);
    beads.push([cx + c * 28.5, cy + s * 28.5]);
  }
  return (
    <svg className="cog-orn" viewBox="0 0 100 100" aria-hidden="true">
      <circle data-orn="rim" cx="50" cy="50" r="43" />
      <circle data-orn="ring" cx="50" cy="50" r="20" />
      {ticks.map((d, i) => <path key={'t' + i} data-orn="tick" d={d} />)}
      {beads.map(([x, y], i) => <circle key={'b' + i} data-orn="bead" cx={x.toFixed(2)} cy={y.toFixed(2)} r="1.5" />)}
    </svg>
  );
}

// ── Zahnrad — brass cog half-out of a shaft with a real clock hand ──

// Brass linear gradient (top-lit) shared shape for all pointers.
function BrassDefs({ id }) {
  return (
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="var(--gold-bright, #f5d57a)" />
        <stop offset=".45" stopColor="var(--gold, #d4b25c)" />
        <stop offset="1" stopColor="#6f5420" />
      </linearGradient>
    </defs>
  );
}

// the original flat, single-colour hand — kept for comparison.
function HandLegacy() {
  return (
    <svg className="cog-hand" viewBox="0 0 24 64"><path fillRule="evenodd" d="M10.5 54 L10.5 30 C10.5 27 5 25 5 19 C5 12 9 6 12 3 C15 6 19 12 19 19 C19 25 13.5 27 13.5 30 L13.5 54 Z M12 13.4 a2.6 2.6 0 1 0 0.01 0 Z" /></svg>
  );
}

// A · brass spear-leaf with a glowing pierced "eye" (lume window).
function HandEye() {
  const g = React.useId() + '-b';
  return (
    <svg className="cog-hand cog-hand--brass" viewBox="0 0 24 64" aria-hidden="true">
      <BrassDefs id={g} />
      <g>
        <path className="ch-body" fill={`url(#${g})`} d="M12 2 C16 8 19 13.5 19 19.5 C19 25.5 13.5 27.5 13.5 31 L13.5 50 A1.6 1.6 0 0 1 10.5 50 L10.5 31 C10.5 27.5 5 25.5 5 19.5 C5 13.5 8 8 12 2 Z" />
        <path className="ch-edge" d="M12 4.6 C15 9.6 17.3 14 17.3 19.3" />
        <ellipse className="ch-ring" cx="12" cy="18.5" rx="3.4" ry="4.4" />
        <ellipse className="ch-orn" cx="12" cy="18.5" rx="2.4" ry="3.4" />
        <circle className="ch-spec" cx="11" cy="16.6" r=".7" />
      </g>
    </svg>
  );
}

// B · slim brass lance with a luminous engraved channel down the spine.
function HandLance() {
  const g = React.useId() + '-b';
  return (
    <svg className="cog-hand cog-hand--brass" viewBox="0 0 24 64" aria-hidden="true">
      <BrassDefs id={g} />
      <g>
        <path className="ch-body" fill={`url(#${g})`} d="M12 2 L17 21 L13 28 L13 50 A1.4 1.4 0 0 1 11 50 L11 28 L7 21 Z" />
        <path className="ch-edge" d="M12 4 L15.6 20.4" />
        <path className="ch-orn-line" strokeWidth="1.9" d="M12 7.5 L12 26" />
        <circle className="ch-orn" cx="12" cy="29.4" r="1.5" />
      </g>
    </svg>
  );
}

// C · brass arrow — broad head, narrow shaft, faceted gem set in the head.
function HandArrow() {
  const g = React.useId() + '-b';
  return (
    <svg className="cog-hand cog-hand--brass" viewBox="0 0 24 64" aria-hidden="true">
      <BrassDefs id={g} />
      <g>
        <path className="ch-body" fill={`url(#${g})`} d="M12 2 L18.5 15 L14 15 L14 49 A2 2 0 0 1 10 49 L10 15 L5.5 15 Z" />
        <path className="ch-edge" d="M12 4.6 L16.3 13.4" />
        <circle className="ch-ring" cx="12" cy="10.6" r="3.4" />
        <circle className="ch-orn" cx="12" cy="10.6" r="2.4" />
        <circle className="ch-spec" cx="11" cy="9.1" r=".7" />
      </g>
    </svg>
  );
}

// D · Breguet-style needle with a pierced brass ring near the tip; the
// bored moon glows in the marker colour.
function HandMoon() {
  const u = React.useId();
  const g = u + '-b';   // brass body
  const s = u + '-s';   // shaft: brass at top, darkening as it sinks into the socket
  return (
    <svg className="cog-hand cog-hand--brass" viewBox="0 0 24 64" aria-hidden="true">
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--gold-bright, #f5d57a)" />
          <stop offset=".45" stopColor="var(--gold, #d4b25c)" />
          <stop offset="1" stopColor="#6f5420" />
        </linearGradient>
        <linearGradient id={s} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--gold, #d4b25c)" />
          <stop offset=".55" stopColor="#7a5d24" />
          <stop offset="1" stopColor="#180f06" />
        </linearGradient>
      </defs>
      <g>
        <path className="ch-body ch-shaft" fill={`url(#${s})`} d="M9.7 17 L9.7 55 Q9.7 58.5 12 58.5 Q14.3 58.5 14.3 55 L14.3 17 Z" />
        <path className="ch-body" fill={`url(#${g})`} d="M12 2.5 L15 14 L9 14 Z" />
        <path className="ch-body" fillRule="evenodd" fill={`url(#${g})`} d="M12 11.3 A6.2 6.2 0 1 1 11.99 11.3 Z M12 14.5 A3 3 0 1 0 12.01 14.5 Z" />
        <circle className="ch-orn" cx="12" cy="17.5" r="2.6" />
        <circle className="ch-spec" cx="11" cy="16" r=".6" />
      </g>
    </svg>
  );
}

// ── Jugendstil base: big brass head canvas with a set cabochon, brass
// bezel, discreet engraved shaft-vine + socket shaft. `tip` is a
// render-prop that draws the framing scrollwork (gets the brass id). ──
function JugHand({ tip, gemY = 20, gemR = 4.2, gemRX, gemRY, vineClass = 'ch-glow-line', dotClass = 'ch-bud', bezel = true, vinePath = 'M15 41 q3 4 0 8 q-3 4 0 8', dots = [40.5, 57.5], noShaft = false, mode }) {
  const u = React.useId();
  const g = u + '-b';   // brass body
  const s = u + '-s';   // shaft, darkening into the socket
  const rx = gemRX || gemR, ry = gemRY || gemR;
  return (
    <svg className="cog-hand cog-hand--brass cog-hand--jug" viewBox="0 0 30 80" aria-hidden="true">
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--gold-bright, #f5d57a)" />
          <stop offset=".45" stopColor="var(--gold, #d4b25c)" />
          <stop offset="1" stopColor="#6f5420" />
        </linearGradient>
        <linearGradient id={s} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--gold, #d4b25c)" />
          <stop offset=".5" stopColor="#6f5420" />
          <stop offset=".8" stopColor="#160f06" />
          <stop offset="1" stopColor="#160f06" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g>
        {noShaft ? null : <path className="ch-body ch-shaft" fill={`url(#${s})`} d="M11.7 27 L11.7 63 Q11.7 66 15 66 Q18.3 66 18.3 63 L18.3 27 Z" />}
        <path className={vineClass} d={vinePath} />
        {dots.map((dy, i) => <circle key={i} className={dotClass} cx="15" cy={dy} r=".9" />)}
        {tip(g)}
        <ellipse className="ch-orn" cx="15" cy={gemY} rx={rx} ry={ry} />
        <ellipse className="ch-core" cx="15" cy={gemY} rx={rx * 0.55} ry={ry * 0.55} />
        {bezel ? <ellipse className="ch-ring2" cx="15" cy={gemY} rx={rx + 1.1} ry={ry + 1.1} /> : null}
        <g className="ch-spec-wrap" style={{ transformBox: 'view-box', transformOrigin: `15px ${gemY}px`, transform: mode ? `rotate(${mode === 'game' ? -65 : 65}deg)` : undefined }}>
          <circle className="ch-spec" cx={15 - rx * 0.42} cy={gemY - ry * 0.5} r=".9" />
        </g>
      </g>
    </svg>
  );
}

// H · Lilie (geschlossen) — the three lily prongs merged into ONE solid
// pointed tip; the stone is framed by a glowing engraved almond, and the
// shaft ornament glows too — both flip colour like the wheel's engraving.
function HandLilyClosed() {
  return (
    <JugHand gemY={18} gemR={4.3} bezel={false} vineClass="ch-glow-line" dotClass="ch-bud" tip={(g) => (
      <g>
        <path className="ch-body" fill={`url(#${g})`} d="M15 2 C19 7 21 12 21 16.5 C21 21 19 24 18.3 27.5 L11.7 27.5 C11 24 9 21 9 16.5 C9 12 11 7 15 2 Z" />
        <path className="ch-edge" d="M15 4.5 C18.4 9 20 13 20 17" />
        <path className="ch-glow-line" d="M15 9.4 Q20.6 18 15 26.4 Q9.4 18 15 9.4 Z" />
        <circle className="ch-bud" cx="15" cy="8.5" r="1.1" />
        <circle className="ch-bud" cx="15" cy="27.3" r="1.1" />
      </g>
    )} />
  );
}

// E · Lilie — a stylised Art-Nouveau lily: tall central petal + two
// side petals that curl around and frame the cabochon.
function HandLily() {
  return (
    <JugHand gemY={20} gemR={4.2} tip={(g) => (
      <g>
        <path className="ch-body" fill={`url(#${g})`} d="M15 2 C20 10 20 23 15 31 C10 23 10 10 15 2 Z" />
        <g transform="rotate(-54 15 20)"><path className="ch-body" fill={`url(#${g})`} d="M15 5 C18.2 11 18.2 17 15 21 C11.8 17 11.8 11 15 5 Z" /></g>
        <g transform="rotate(54 15 20)"><path className="ch-body" fill={`url(#${g})`} d="M15 5 C18.2 11 18.2 17 15 21 C11.8 17 11.8 11 15 5 Z" /></g>
        <path className="ch-edge" d="M15 5 C18.8 12 18.8 22 15.4 29" />
        <circle className="ch-bud" cx="6.7" cy="11.3" r="1.3" />
        <circle className="ch-bud" cx="23.3" cy="11.3" r="1.3" />
      </g>
    )} />
  );
}

// F · Iris — narrow upright bud flanked by two long whiplash leaves
// sweeping out and curling back toward the stone.
function HandIris() {
  return (
    <JugHand gemY={22} gemR={4} tip={(g) => (
      <g>
        <path className="ch-body" fill={`url(#${g})`} d="M15 2 C17.6 9 17.6 16 15 22 C12.4 16 12.4 9 15 2 Z" />
        <path className="ch-body" fill={`url(#${g})`} d="M15.6 22 C22 19 25.5 12 23.5 4 C26 11.5 24 20 17.5 25 Z" />
        <path className="ch-body" fill={`url(#${g})`} d="M14.4 22 C8 19 4.5 12 6.5 4 C4 11.5 6 20 12.5 25 Z" />
        <path className="ch-edge" d="M15 4 C17 9.5 17 15 15 20" />
        <circle className="ch-bud" cx="23.4" cy="5.4" r="1.2" />
        <circle className="ch-bud" cx="6.6" cy="5.4" r="1.2" />
      </g>
    )} />
  );
}

// G · Volute — a teardrop tip with two C-scroll whiplash volutes
// curling symmetrically around a large cabochon.
function HandVolute() {
  return (
    <JugHand gemY={21} gemR={4.6} tip={(g) => (
      <g>
        <path className="ch-body" fill={`url(#${g})`} d="M15 2 C19.5 11 19 24 15 32 C11 24 10.5 11 15 2 Z" />
        <path className="ch-body" fill={`url(#${g})`} d="M21 16 C25 14 26 9 23 6 C27 8 27.5 15 23 19 C20.5 21.2 18 21.4 16.5 21 C18 20.4 19.6 18.8 21 16 Z" />
        <path className="ch-body" fill={`url(#${g})`} d="M9 16 C5 14 4 9 7 6 C3 8 2.5 15 7 19 C9.5 21.2 12 21.4 13.5 21 C12 20.4 10.4 18.8 9 16 Z" />
        <path className="ch-edge" d="M15 5 C18.4 12 18 23 15.4 30" />
      </g>
    )} />
  );
}

// ════════════════════════════════════════════════════════════════
// SPITZEN-VARIATIONEN — alle auf der Volute-Basis (Schaft fadet ins
// Loch, farbwechselnder Stein + glühende Ranke). Nur die Spitze variiert.
// ════════════════════════════════════════════════════════════════

// 1 · Tropfen — pure ogee teardrop, no ornament but the set stone. Restraint.
function HandDrop() {
  return (
    <JugHand gemY={18} gemR={4.5} tip={(g) => (
      <g>
        <path className="ch-body" fill={`url(#${g})`} d="M15 2 C20.5 12 20.5 24 15 31 C9.5 24 9.5 12 15 2 Z" />
        <path className="ch-edge" d="M15 4.5 C19.4 13 19.4 23 15.4 29" />
      </g>
    )} />
  );
}

// 2 · Facette — geometric kite with an engraved inner diamond framing the stone.
function HandFacet() {
  return (
    <JugHand gemY={18} gemR={3.6} bezel={false} tip={(g) => (
      <g>
        <path className="ch-body" fill={`url(#${g})`} d="M15 2 L21.5 18 L15 31 L8.5 18 Z" />
        <path className="ch-edge" d="M15 4 L20 17.4" />
        <path className="ch-glow-line" d="M15 9 L20 18 L15 27 L10 18 Z" />
      </g>
    )} />
  );
}

// 3 · Pfauenauge — feather ogive with engraved barbs radiating from the eye.
function HandPeacock() {
  return (
    <JugHand gemY={20} gemR={4.1} tip={(g) => (
      <g>
        <path className="ch-body" fill={`url(#${g})`} d="M15 2 C18.6 8 20.5 13 20.5 17.5 C20.5 22 18.6 25.5 18.3 28.5 L11.7 28.5 C11.4 25.5 9.5 22 9.5 17.5 C9.5 13 11.4 8 15 2 Z" />
        <path className="ch-edge" d="M15 4.5 C18.4 10 20 14 20 17.6" />
        <path className="ch-glow-line" d="M15 13 L15 6" />
        <path className="ch-glow-line" d="M11.6 15 L9 9.5" />
        <path className="ch-glow-line" d="M18.4 15 L21 9.5" />
        <path className="ch-glow-line" d="M10.6 18.5 L7.6 16.5" />
        <path className="ch-glow-line" d="M19.4 18.5 L22.4 16.5" />
      </g>
    )} />
  );
}

// 4 · Flamme — a central tongue flanked by two outward licks; stone = ember.
function HandFlame() {
  return (
    <JugHand gemY={20} gemR={3.9} tip={(g) => (
      <g>
        <path className="ch-body" fill={`url(#${g})`} d="M15 2 C18.4 9 18.4 16 15 23 C11.6 16 11.6 9 15 2 Z" />
        <path className="ch-body" fill={`url(#${g})`} d="M12.5 19 C8 17 6.8 11.5 9 7 C9.4 12 11 15.5 14 18.5 Z" />
        <path className="ch-body" fill={`url(#${g})`} d="M17.5 19 C22 17 23.2 11.5 21 7 C20.6 12 19 15.5 16 18.5 Z" />
        <path className="ch-glow-line" d="M15 7 C16.6 11 16.6 14 15 17" />
      </g>
    )} />
  );
}

// 5 · Sonne — a slim brass spike with a fan of glowing rays; stone = sun.
function HandSun() {
  const rays = [];
  const cx = 15, cy = 20;
  for (let k = 0; k < 9; k++) {
    const ang = (-162 + k * (144 / 8)) * Math.PI / 180;
    const r1 = 6.4, len = 6.5 - Math.abs(k - 4) * 0.7;
    rays.push([cx + Math.cos(ang) * r1, cy + Math.sin(ang) * r1, cx + Math.cos(ang) * (r1 + len), cy + Math.sin(ang) * (r1 + len)]);
  }
  return (
    <JugHand gemY={20} gemR={4} tip={(g) => (
      <g>
        <path className="ch-body" fill={`url(#${g})`} d="M13.4 21 L15 3 L16.6 21 Z" />
        <path className="ch-edge" d="M15 5 L15.7 20" />
        {rays.map((p, i) => <path key={i} className="ch-glow-line" d={`M${p[0].toFixed(1)} ${p[1].toFixed(1)} L${p[2].toFixed(1)} ${p[3].toFixed(1)}`} />)}
      </g>
    )} />
  );
}

// 6 · Kleeblatt — three rounded brass lobes (trefoil) cradling the stone.
function HandTrefoil() {
  return (
    <JugHand gemY={15} gemR={3.7} tip={(g) => (
      <g>
        <path className="ch-body" fill={`url(#${g})`} d="M13.2 17 L13.2 28 L16.8 28 L16.8 17 Z" />
        <circle className="ch-body" fill={`url(#${g})`} cx="15" cy="8.4" r="4.4" />
        <circle className="ch-body" fill={`url(#${g})`} cx="9.4" cy="15.4" r="4" />
        <circle className="ch-body" fill={`url(#${g})`} cx="20.6" cy="15.4" r="4" />
      </g>
    )} />
  );
}

// 7 · Lyra — two brass horns sweep up and out, cradling the stone between them.
function HandLyra() {
  return (
    <JugHand gemY={21} gemR={4} tip={(g) => (
      <g>
        <path className="ch-body" fill={`url(#${g})`} d="M13.5 25 C8 23 4.5 16 6 8 C6.6 4.6 8 3 8 3 C8.5 9 10.5 17 15 22 Z" />
        <path className="ch-body" fill={`url(#${g})`} d="M16.5 25 C22 23 25.5 16 24 8 C23.4 4.6 22 3 22 3 C21.5 9 19.5 17 15 22 Z" />
        <path className="ch-edge" d="M7.4 8 C7 13 9 18 12 21" />
      </g>
    )} />
  );
}

// 8 · Schild — a heraldic heater shield with the stone as its boss.
function HandShield() {
  return (
    <JugHand gemY={16} gemR={4.2} tip={(g) => (
      <g>
        <path className="ch-body" fill={`url(#${g})`} d="M15 3 C18 6 21.5 6.5 21.5 6.5 C21.5 16 19 25 15 31 C11 25 8.5 16 8.5 6.5 C8.5 6.5 12 6 15 3 Z" />
        <path className="ch-edge" d="M15 5.5 C17.6 8 20 8.6 20 8.6" />
        <path className="ch-glow-line" d="M15 24 L15 9" />
      </g>
    )} />
  );
}

// ════════════════════════════════════════════════════════════════
// AUS DEINER SKIZZE — diamond head, tall oval stone, organic lobed
// frame, apex knot, shoulder ticks, long serpentine shaft.
// ════════════════════════════════════════════════════════════════

// S1 · skizzentreu — the drawing read literally: lobed glowing frame
// hugging an oval cabochon, little glowing knot at the apex.
function EngravedPath({ d }) {
  return (
    <g>
      <path className="ch-eng-l" d={d} transform="translate(0,.6)" />
      <path className="ch-eng-d" d={d} />
    </g>
  );
}

function HandSketch({ mode }) {
  const cb = React.useId() + '-cb';
  const rg = React.useId() + '-rec';
  const mk = React.useId() + '-mk';
  // single chevron engraving per sketch: apex ~1/3 between tip and stone,
  // legs parallel to the diamond's roof, ending just above the setting.
  // chevron legs share the head's slope (dx:dy = 10:18) so the engraving
  // sits perfectly parallel to the diamond's roof.
  const engraving = (
    <g>
      {/* recessed inner face: soft shade, darkest at the groove, fading toward the stone */}
      <path fill={`url(#${rg})`} d="M15 6.55 L17.95 11.85 L12.05 11.85 Z" style={{ filter: 'blur(.35px)' }} />
      <EngravedPath d="M12.05 11.8 L15 6.5 L17.95 11.8" />
    </g>
  );
  return (
    <JugHand mode={mode} gemY={18} gemRX={3} gemRY={3} bezel={false} dots={[]} vinePath="" noShaft={true}
      tip={(g) => (
        <g>
          <defs>
            <mask id={mk} maskUnits="userSpaceOnUse" x="0" y="0" width="30" height="80">
              {/* shimmer fade: breathes in below the setting, full through the
                  middle, and sinks away with the shaft into the socket */}
              <linearGradient id={mk + 'g'} gradientUnits="userSpaceOnUse" x1="0" y1="24.5" x2="0" y2="60">
                <stop offset="0" stopColor="#000" />
                <stop offset=".22" stopColor="#fff" />
                <stop offset=".55" stopColor="#fff" />
                <stop offset="1" stopColor="#000" />
              </linearGradient>
              <rect x="0" y="0" width="30" height="80" fill={`url(#${mk}g)`} />
            </mask>
            <linearGradient id={rg} gradientUnits="userSpaceOnUse" x1="15" y1="6.5" x2="15" y2="12.4">
              <stop offset="0" stopColor="rgba(20,13,4,.28)" />
              <stop offset=".55" stopColor="rgba(20,13,4,.13)" />
              <stop offset="1" stopColor="rgba(20,13,4,0)" />
            </linearGradient>
            <linearGradient id={cb} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="var(--gold-bright, #f5d57a)" />
              <stop offset=".26" stopColor="var(--gold, #d4b25c)" />
              <stop offset=".46" stopColor="#8a6e34" />
              <stop offset=".8" stopColor="#160f06" />
              <stop offset="1" stopColor="#160f06" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path className="ch-body" fill={`url(#${cb})`} d="M15 1 L25 19 L18.3 27 L18.3 63 Q18.3 66 15 66 Q11.7 66 11.7 63 L11.7 27 L5 19 Z" />
          <path className="ch-edge" d={mode === 'game' ? "M15 3.5 L7 17.6" : "M15 3.5 L23 17.6"} />
          {engraving}
          {/* colour-changing serpentine — a magical shimmer along the shaft: fades in
              below the setting, fades out into the socket darkness */}
          <path className="ch-glow-line ch-shimmer" mask={`url(#${mk})`} style={{ strokeWidth: .9 }} d="M15 24.5 C17.8 29.2 12.2 33.9 15 38.6 C17.8 43.3 12.2 48 15 52.7 C16.8 55.6 14.2 57.8 15 60" />
          <g style={{ transformBox: 'view-box', transformOrigin: '15px 18px', transform: mode ? `rotate(${mode === 'game' ? -65 : 65}deg)` : undefined }}>
            <ellipse className="ch-set-shadow" cx="16.5" cy="19.8" rx="4.5" ry="4.5" />
          </g>
          <ellipse className="ch-set" cx="15" cy="18" rx="4.4" ry="4.4" />
        </g>
      )} />
  );
}

// S2 · symmetrisch veredelt — same silhouette, but the frame becomes a
// tidy beaded brass ring and the knot a neat brass trefoil.
function HandSketchRefined() {
  const beads = [];
  const cx = 15, cy = 16, brx = 5.6, bry = 7.4;
  for (let k = 0; k < 14; k++) { const a = (k / 14) * Math.PI * 2 - Math.PI / 2; beads.push([cx + Math.cos(a) * brx, cy + Math.sin(a) * bry]); }
  const knot = [[15, 4], [12.9, 5.5], [17.1, 5.5]];
  return (
    <JugHand gemY={16} gemRX={3.5} gemRY={5} bezel={true} dots={[38, 50]}
      vinePath="M15 31 C18 35 18 40 15 44 C12 48 12 52 15 56"
      tip={(g) => (
        <g>
          <path className="ch-body" fill={`url(#${g})`} d="M15 1 L24 17 L18.3 31 L11.7 31 L6 17 Z" />
          <path className="ch-edge" d="M15 3.5 L22.4 15.8" />
          {beads.map((b, i) => <circle key={i} className="ch-body" fill={`url(#${g})`} cx={b[0].toFixed(2)} cy={b[1].toFixed(2)} r="1" />)}
          {knot.map((k, i) => <circle key={'k' + i} className="ch-body" fill={`url(#${g})`} cx={k[0]} cy={k[1]} r="1.6" />)}
          <path className="ch-glow-line" d="M8.6 14.6 L8.6 18.2" />
          <path className="ch-glow-line" d="M21.4 14.6 L21.4 18.2" />
        </g>
      )} />
  );
}

// S3 · Schlange — the squiggle + apex knot reimagined as a brass serpent
// coiling up around the egg-stone, head crowning the tip with a glowing eye.
function HandSerpent() {
  const snake = "M15 61 C18.2 56 12.6 51 15 46 C17.4 41 12.6 37 15 33 C16.6 30.6 19 29 20.4 25.5 C22.4 21 22 14.5 19 11 C18.2 10 17.2 9.2 16.2 8.8";
  return (
    <JugHand gemY={17} gemRX={3.5} gemRY={5} bezel={true} dots={[]} vinePath=""
      tip={(g) => (
        <g>
          <path className="ch-body" fill={`url(#${g})`} d="M15 1 L24 17 L18.3 31 L11.7 31 L6 17 Z" />
          <path className="ch-edge" d="M15 3.5 L22.4 15.8" />
          <path d={snake} fill="none" stroke="#140e05" strokeWidth="3.4" strokeLinecap="round" />
          <path d={snake} fill="none" stroke={`url(#${g})`} strokeWidth="2.1" strokeLinecap="round" />
          <path className="ch-body" fill={`url(#${g})`} d="M16.2 8.8 C15 7.6 13.2 7.7 12.6 9 C12.1 10.1 12.7 11.4 14.1 11.7 C15.8 12 17.3 9.9 16.2 8.8 Z" />
          <circle className="ch-orn" cx="14.6" cy="9.6" r="0.95" />
          <path className="ch-glow-line" d="M12.8 8.6 C11.6 7.6 11.2 6.6 11.5 5.7" />
          <path className="ch-glow-line" d="M12.6 9.4 C11.4 9.2 10.6 8.6 10.4 7.8" />
        </g>
      )} />
  );
}

function ConsoleGear({ mode, onChange }) {
  const flip = () => onChange(mode === 'game' ? 'setup' : 'game');
  return (
    <div className={'lev mt4a gear-clock ' + (mode === 'game' ? 'is-game' : 'is-setup')} role="group" aria-label="Board-Modus">
      <div className="sb-pix mt4a-console">
        <span className="lev-screw" aria-hidden="true" /><span className="lev-screw" aria-hidden="true" />
        <button className="lev-engrave" data-side="setup" onClick={() => onChange('setup')}>EDIT</button>
        <button className="cogw" onClick={flip} aria-label="Zahnrad drehen">
          <span className="cog" aria-hidden="true"><span className="cog-teeth" /><span className="cog-body" /><CogOrnament /><svg className="cog-hand" viewBox="0 0 24 64"><path fillRule="evenodd" d="M10.5 54 L10.5 30 C10.5 27 5 25 5 19 C5 12 9 6 12 3 C15 6 19 12 19 19 C19 25 13.5 27 13.5 30 L13.5 54 Z M12 13.4 a2.6 2.6 0 1 0 0.01 0 Z" /></svg><span className="cog-hub" /></span>
          <span className="cog-lip" aria-hidden="true" />
        </button>
        <button className="lev-engrave" data-side="game" onClick={() => onChange('game')}>GAME</button>
        <span className="lev-screw" aria-hidden="true" /><span className="lev-screw" aria-hidden="true" />
      </div>
    </div>
  );
}
const Gear = (p) => <ConsoleGear {...p} />;

// XL version — wheel nearly fills the switch, emerges >half, with a small
// gear at the centre that the clock hand is fixed to.
function ConsoleGearXL({ mode, onChange, hand: Hand = HandLegacy, extra = '' }) {
  const flip = () => onChange(mode === 'game' ? 'setup' : 'game');
  return (
    <div className={'lev mt4a gear-clock gear-xl ' + extra + ' ' + (mode === 'game' ? 'is-game' : 'is-setup')} role="group" aria-label="Board-Modus">
      <div className="sb-pix mt4a-console">
        <span className="lev-screw" aria-hidden="true" /><span className="lev-screw" aria-hidden="true" />
        <button className="lev-engrave" data-side="setup" onClick={() => onChange('setup')}>EDIT</button>
        <button className="cogw" onClick={flip} aria-label="Zahnrad drehen">
          <span className="cog-slotback" aria-hidden="true" />
          <span className="cog" aria-hidden="true">
            <span className="cog-teeth" />
            <span className="cog-body" />
            <CogOrnament />
            <span className="cog-mini"><span className="cog-mini-teeth" /></span>
            <Hand mode={mode} />
          </span>
          <span className="cog-lip" aria-hidden="true"><span className="cog-slit" /><span className="cog-bolt" data-side="l" /><span className="cog-bolt" data-side="r" /></span>
        </button>
        <button className="lev-engrave" data-side="game" onClick={() => onChange('game')}>GAME</button>
        <span className="lev-screw" aria-hidden="true" /><span className="lev-screw" aria-hidden="true" />
      </div>
    </div>
  );
}
const GearXL = (p) => <ConsoleGearXL {...p} />;
const GearXLEye = (p) => <ConsoleGearXL {...p} hand={HandEye} />;
const GearXLLance = (p) => <ConsoleGearXL {...p} hand={HandLance} />;
const GearXLArrow = (p) => <ConsoleGearXL {...p} hand={HandArrow} />;
const GearXLMoon = (p) => <ConsoleGearXL {...p} hand={HandMoon} extra="gear-socket" />;
const GearXLLily = (p) => <ConsoleGearXL {...p} hand={HandLily} extra="gear-socket gear-jug" />;
const GearXLLilyClosed = (p) => <ConsoleGearXL {...p} hand={HandLilyClosed} extra="gear-socket gear-jug" />;
const GearXLIris = (p) => <ConsoleGearXL {...p} hand={HandIris} extra="gear-socket gear-jug" />;
const GearXLVolute = (p) => <ConsoleGearXL {...p} hand={HandVolute} extra="gear-socket gear-jug" />;
const GearXLDrop = (p) => <ConsoleGearXL {...p} hand={HandDrop} extra="gear-socket gear-jug" />;
const GearXLFacet = (p) => <ConsoleGearXL {...p} hand={HandFacet} extra="gear-socket gear-jug" />;
const GearXLPeacock = (p) => <ConsoleGearXL {...p} hand={HandPeacock} extra="gear-socket gear-jug" />;
const GearXLFlame = (p) => <ConsoleGearXL {...p} hand={HandFlame} extra="gear-socket gear-jug" />;
const GearXLSun = (p) => <ConsoleGearXL {...p} hand={HandSun} extra="gear-socket gear-jug" />;
const GearXLTrefoil = (p) => <ConsoleGearXL {...p} hand={HandTrefoil} extra="gear-socket gear-jug" />;
const GearXLLyra = (p) => <ConsoleGearXL {...p} hand={HandLyra} extra="gear-socket gear-jug" />;
const GearXLShield = (p) => <ConsoleGearXL {...p} hand={HandShield} extra="gear-socket gear-jug" />;
const GearXLSketch = (p) => <ConsoleGearXL {...p} hand={HandSketch} extra="gear-socket gear-jug" />;
const GearXLSketchBrass = (p) => <ConsoleGearXL {...p} hand={HandSketch} extra="gear-socket gear-jug gear-brassbox" />;
const GearXLSketchFlush = (p) => <ConsoleGearXL {...p} hand={HandSketch} extra="gear-socket gear-jug gear-flush" />;
const GearXLSketchRef = (p) => <ConsoleGearXL {...p} hand={HandSketchRefined} extra="gear-socket gear-jug" />;
const GearXLSerpent = (p) => <ConsoleGearXL {...p} hand={HandSerpent} extra="gear-socket gear-jug" />;

// Label-Entwürfe — gleiches Skizzen-Rad, nur die EDIT/GAME-Beschriftung variiert
const GearLabInk   = (p) => <ConsoleGearXL {...p} hand={HandSketch} extra="gear-socket gear-jug lab-ink" />;
const GearLabPlate = (p) => <ConsoleGearXL {...p} hand={HandSketch} extra="gear-socket gear-jug lab-plate" />;
const GearLabSlate = (p) => <ConsoleGearXL {...p} hand={HandSketch} extra="gear-socket gear-jug lab-slate" />;
const GearLabPixel = (p) => <ConsoleGearXL {...p} hand={HandSketch} extra="gear-socket gear-jug lab-pixel" />;
const GearLabTight = (p) => <ConsoleGearXL {...p} hand={HandSketch} extra="gear-socket gear-jug lab-tight" />;
const GearLabDeep  = (p) => <ConsoleGearXL {...p} hand={HandSketch} extra="gear-socket gear-jug lab-deep" />;
const GearLabBE    = (p) => <ConsoleGearXL {...p} hand={HandSketch} extra="gear-socket gear-jug gear-flush lab-be" />;

// Kompakt-Varianten der B+E-Kombi — kleinerer Außenrahmen
const GearBETrim  = (p) => <ConsoleGearXL {...p} hand={HandSketch} extra="gear-socket gear-jug gear-flush lab-be compact-trim" />;
const GearBEAxle  = (p) => <ConsoleGearXL {...p} hand={HandSketch} extra="gear-socket gear-jug gear-flush lab-be compact-trim compact-axle" />;
const GearBERivet = (p) => <ConsoleGearXL {...p} hand={HandSketch} extra="gear-socket gear-jug gear-flush lab-be compact-rivet" />;
const GearBESmall = (p) => <ConsoleGearXL {...p} hand={HandSketch} extra="gear-socket gear-jug gear-flush lab-be compact-small" />;
const GearBEFinal = (p) => <ConsoleGearXL {...p} hand={HandSketch} extra="gear-socket gear-jug gear-flush lab-be compact-rivet compact-small" />;

function Toggle5({ mode, onChange }) {
  const flip = () => onChange(mode === 'game' ? 'setup' : 'game');
  return (
    <div className={'mt5 ' + (mode === 'game' ? 'is-game' : 'is-setup')} role="group" aria-label="Board-Modus">
      <button className="mt5-end" data-side="setup" onClick={() => onChange('setup')}>EDIT</button>
      <button className="mt5-track" onClick={flip} aria-label="Modus schieben">
        <span className="mt5-fill" aria-hidden="true" />
        <span className="mt5-cap" aria-hidden="true" />
      </button>
      <button className="mt5-end" data-side="game" onClick={() => onChange('game')}>GAME</button>
    </div>
  );
}

// 6 · ARCADE LIGHT-BUTTONS — two illuminated push buttons
function Toggle6({ mode, onChange }) {
  return (
    <div className="mt6" role="group" aria-label="Board-Modus">
      <button className={'sb-pix mt6-btn setup' + (mode === 'setup' ? ' lit' : '')} aria-pressed={mode === 'setup'} onClick={() => onChange('setup')}>
        <span className="mt6-led" aria-hidden="true" />EDIT
      </button>
      <button className={'sb-pix mt6-btn game' + (mode === 'game' ? ' lit' : '')} aria-pressed={mode === 'game'} onClick={() => onChange('game')}>
        <span className="mt6-led" aria-hidden="true" />GAME
      </button>
    </div>
  );
}

// 7 · TABS — sliding underline indicator (minimal)
function Toggle7({ mode, onChange }) {
  return (
    <div className={'mt7 ' + (mode === 'game' ? 'is-game' : 'is-setup')} role="group" aria-label="Board-Modus">
      <button className="mt7-tab" data-side="setup" aria-pressed={mode === 'setup'} onClick={() => onChange('setup')}>EDIT</button>
      <button className="mt7-tab" data-side="game" aria-pressed={mode === 'game'} onClick={() => onChange('game')}>GAME</button>
      <span className="mt7-ind" aria-hidden="true" />
    </div>
  );
}

// 8 · MODE-PLATE — one big stamped plate, dramatic flip + bar tint
function Toggle8({ mode, onChange }) {
  const isGame = mode === 'game';
  const [stamp, setStamp] = useState(false);
  const flip = () => {
    setStamp(true);
    onChange(isGame ? 'setup' : 'game');
    window.setTimeout(() => setStamp(false), 380);
  };
  return (
    <button
      className={'sb-pix mt8 ' + (isGame ? 'is-game' : 'is-setup') + (stamp ? ' is-stamp' : '')}
      onClick={flip} aria-label={'Modus: ' + (isGame ? 'GAME' : 'EDIT') + ' — umschalten'}
    >
      <span className="mt8-icon">{isGame ? <PlayIcon /> : <SlidersIcon />}</span>
      <span className="mt8-label">{isGame ? 'GAME' : 'EDIT'}</span>
      <span className="mt8-hint">TIPPEN ZUM WECHSELN →</span>
    </button>
  );
}

// ── Demo frame — wraps one toggle in MiniBar + BoardStrip ──────────
function DemoFrame({ Toggle, align, tint, note }) {
  const [mode, setMode] = useState('setup');
  return (
    <div className="gv-board">
      <div className="mt-frame">
        <MiniBar mode={mode} align={align} tint={tint}>
          <Toggle mode={mode} onChange={setMode} />
        </MiniBar>
        <BoardStrip mode={mode} />
      </div>
      <div className="gv-note">{note}</div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// CANVAS
// ════════════════════════════════════════════════════════════════
const AW = 600, AH = 250, AW8 = 660;

function ModeToggleApp() {
  return (
    <DesignCanvas>
      <DCSection
        id="im-system"
        title="Im System"
        subtitle="Nah am bestehenden Pixel-/CRT-Stil — austauschbar im aktuellen TopBar. Jeder Schalter ist live: klicke eine Hälfte / den Schalter."
      >
        <DCArtboard id="split" label="1 · Split (verfeinert)" width={AW} height={AH}>
          <DemoFrame Toggle={Toggle1} note={<><b>1 · Split</b> — zwei Hälften, aktive Hälfte trägt die Modusfarbe (Füllung + Glow + Rahmen). Verfeinerung des aktuellen Stands. Platzierung: zentriert im Titel-Slot.</>} />
        </DCArtboard>
        <DCArtboard id="segment" label="2 · Schiebe-Segment" width={AW} height={AH}>
          <DemoFrame Toggle={Toggle2} note={<><b>2 · Schiebe-Segment</b> — ein gefüllter Block gleitet zwischen den Hälften (220 ms, leichter Überschwung). Aktives Label wird dunkel auf Farbe. Sehr klare Zustands­anzeige.</>} />
        </DCArtboard>
        <DCArtboard id="tabs" label="3 · Reiter + Gleit-Linie" width={AW} height={AH}>
          <DemoFrame Toggle={Toggle7} align="left" note={<><b>3 · Reiter</b> — minimal: zwei Tabs, eine farbige Unterstrich-Linie gleitet darunter. Hier <b>links</b> angedockt statt zentriert — fühlt sich wie eine Titelzeile an.</>} />
        </DCArtboard>
        <DCArtboard id="fader" label="4 · Fader" width={AW} height={AH}>
          <DemoFrame Toggle={Toggle5} note={<><b>4 · Fader</b> — greift die Regler-Sprache des Boards auf: ein Cap gleitet über die Schiene, die Füllung läuft mit. Zwei Endpunkte = zwei Modi.</>} />
        </DCArtboard>
      </DCSection>

      <DCSection
        id="physisch"
        title="Physische Schalter"
        subtitle="Mutiger — echte Hardware-Metaphern. Tippen wirft den Schalter um."
      >
        <DCArtboard id="rocker" label="5 · Hardware-Wippe" width={AW} height={AH}>
          <DemoFrame Toggle={Toggle3} note={<><b>5 · Wippe</b> — ein griffiger Knubbel mit Rillen schiebt in einer Pixel-Schiene von EDIT nach GAME. Flankierende Labels leuchten je nach Seite.</>} />
        </DCArtboard>
        <DCArtboard id="lever" label="6 · Kippschalter / Hebel" width={AW} height={AH}>
          <DemoFrame Toggle={Toggle4} note={<><b>6 · Hebel</b> — Messerschalter: der Hebel mit Kugelgriff kippt mit Schwung zwischen zwei Kontakten. Stärkste haptische Metapher, klares „Umlegen".</>} />
        </DCArtboard>
        <DCArtboard id="arcade" label="7 · Leuchttaster" width={AW} height={AH}>
          <DemoFrame Toggle={Toggle6} note={<><b>7 · Leuchttaster</b> — zwei Arcade-Taster, der aktive leuchtet (LED + Wash + Rahmen), der andere liegt dunkel. Drücken senkt den Taster kurz ab.</>} />
        </DCArtboard>
      </DCSection>

      <DCSection
        id="hebel-integration"
        title="Hebel · Integration"
        subtitle="Der Hebel (6) gefällt — aber er soll nicht aufgeklebt wirken. Drei Wege, ihn ins Gehäuse einzubauen. Original links zum Vergleich."
      >
        <DCArtboard id="lever-orig" label="Original (frei)" width={AW} height={AH}>
          <DemoFrame Toggle={Toggle4} note={<><b>Original</b> — der Hebel schwebt über einer dünnen Platte. Wirkt „aufgeklebt", weil Montage, Fase und Tiefe fehlen.</>} />
        </DCArtboard>
        <DCArtboard id="lever-console" label="A · Konsolen-Platte" width={AW} height={AH}>
          <DemoFrame Toggle={Toggle4A} note={<><b>A · Konsole</b> — der Hebel sitzt auf einer gefasten, verschraubten Platte mit Sockel. Licht-von-oben-Fase + Schrauben lassen ihn wie ein montiertes Bauteil wirken.</>} />
        </DCArtboard>
        <DCArtboard id="lever-well" label="B · Eingelassene Mulde" width={AW} height={AH}>
          <DemoFrame Toggle={Toggle4B} note={<><b>B · Mulde</b> — eine in die Leiste <b>eingefräste</b> Vertiefung (umgekehrte Fase, dunkel oben). Der Hebel wächst durch einen Schlitz heraus — Teil der Leiste, nicht darauf.</>} />
        </DCArtboard>
        <DCArtboard id="lever-gate" label="C · Schaltkulisse" width={AW} height={AH}>
          <DemoFrame Toggle={Toggle4C} note={<><b>C · Kulisse</b> — Gangschaltungs-Metapher: der Kugelgriff läuft in einem gefrästen Schlitz und rastet in zwei Mulden. Das Gehäuse <b>ist</b> der Schalter.</>} />
        </DCArtboard>
      </DCSection>

      <DCSection
        id="hebel-kopf"
        title="Hebel-Kopf · Charakter"
        subtitle="Gehäuse = Konsolen-Platte (gewählt). Jetzt bekommt der Hebel selbst Charakter — vier Köpfe vs. der glatte zum Vergleich. Umlegen per Klick."
      >
        <DCArtboard id="head-smooth" label="Glatt (aktuell)" width={AW} height={AH}>
          <DemoFrame Toggle={Toggle4A} note={<><b>Glatt</b> — der aktuelle Hebel: glatter Stab, glatte Kugel. Wirkt neutral / charakterlos.</>} />
        </DCArtboard>
        <DCArtboard id="head-pixel" label="A · Pixel-Knauf" width={AW} height={AH}>
          <DemoFrame Toggle={ConsolePixel} note={<><b>A · Pixel-Knauf</b> — facettierter, gestufter Knauf mit Innen-Pip; zweifarbiger Schaft. Passt am besten zur Pixel-/CRT-Sprache.</>} />
        </DCArtboard>
        <DCArtboard id="head-ribbed" label="B · Geriffelt" width={AW} height={AH}>
          <DemoFrame Toggle={ConsoleRibbed} note={<><b>B · Geriffelt</b> — horizontale Griff-Riffelung am Schaft + Sockel-Manschette. Liest sich wie ein gummierter Metallhebel.</>} />
        </DCArtboard>
        <DCArtboard id="head-bat" label="C · Bat-Griff" width={AW} height={AH}>
          <DemoFrame Toggle={ConsoleBat} note={<><b>C · Bat-Griff</b> — klassischer Kippschalter: schmale Basis, breites Paddel oben. Stärkste „echter-Schalter"-Anmutung.</>} />
        </DCArtboard>
        <DCArtboard id="head-knurl" label="D · Rändel-Kugel" width={AW} height={AH}>
          <DemoFrame Toggle={ConsoleKnurl} note={<><b>D · Rändel-Kugel</b> — kreuzgerändelte (geknurlte) Kugel + Manschette. Feine Textur, griffig, ohne die Silhouette zu ändern.</>} />
        </DCArtboard>
      </DCSection>

      <DCSection
        id="zahnrad"
        title="Zahnrad-Idee"
        subtitle="Statt Hebel: ein altes Messing-Zahnrad, das zur Hälfte aus einem Schacht ragt. Ein echter Uhrzeiger sitzt darauf und springt als Markierung zwischen EDIT und GAME hin und her. Klicken dreht das Rad."
      >
        <DCArtboard id="gear-clock" label="Zahnrad · Uhrzeiger" width={AW} height={AH}>
          <DemoFrame Toggle={Gear} note={<><b>Uhrzeiger</b> — ein speerförmiger Zeiger ist auf dem Messingrad montiert und springt mit Schwung zwischen EDIT (links) und GAME (rechts). Das Rad ragt tiefer aus dem Schacht.</>} />
        </DCArtboard>
        <DCArtboard id="gear-clock-xl" label="Zahnrad · Uhrzeiger XL" width={AW} height={AH}>
          <DemoFrame Toggle={GearXL} note={<><b>Uhrzeiger XL</b> — das Messingrad füllt fast die ganze Schalterfläche und ragt zu mehr als der Hälfte heraus. In der Mitte sitzt ein <b>kleines Zahnrad</b>, an dem der Zeiger befestigt ist.</>} />
        </DCArtboard>
      </DCSection>

      <DCSection
        id="zahnrad-zeiger"
        title="Zahnrad · Zeiger aus Messing"
        subtitle="Der XL-Zeiger gefällt, wirkt aber „aufgeklebt“. Jetzt aus demselben Messing wie das Rad gegossen (Goldverlauf + dunkle Konturlinie), mit schmalem Schaft und breiterer Spitze. Eine eingelegte Zierde glüht in der Modusfarbe und wechselt sie wie zuvor. Klicken legt um."
      >
        <DCArtboard id="hand-orig" label="Original (flach)" width={AW} height={AH}>
          <DemoFrame Toggle={GearXL} note={<><b>Original</b> — der Zeiger ist komplett in der Modusfarbe gefärbt und liegt flach auf. Kein Material, keine Tiefe — wirkt aufgesetzt.</>} />
        </DCArtboard>
        <DCArtboard id="hand-eye" label="A · Auge / Leuchtfenster" width={AW} height={AH}>
          <DemoFrame Toggle={GearXLEye} note={<><b>A · Auge</b> — Messing-Speerblatt mit durchbrochenem <b>Leuchtfenster</b>: der Messing­körper bleibt, nur die Öffnung glüht in der Modusfarbe. Schmaler Schaft, breites Blatt.</>} />
        </DCArtboard>
        <DCArtboard id="hand-lance" label="B · Lanze + Leuchtgrat" width={AW} height={AH}>
          <DemoFrame Toggle={GearXLLance} note={<><b>B · Lanze</b> — schlanke Messing­lanze; ein <b>eingravierter Grat</b> läuft die Spitze hinauf und leuchtet in der Modusfarbe. Sehr feine, präzise Anmutung.</>} />
        </DCArtboard>
        <DCArtboard id="hand-arrow" label="C · Pfeil + Edelstein" width={AW} height={AH}>
          <DemoFrame Toggle={GearXLArrow} note={<><b>C · Pfeil</b> — breite Messing-Pfeilspitze auf schmalem Schaft, mit einem gefassten <b>Edelstein</b> im Kopf, der die Modusfarbe trägt. Klare Richtungs­anzeige.</>} />
        </DCArtboard>
        <DCArtboard id="hand-moon" label="D · Breguet-Mond" width={AW} height={AH}>
          <DemoFrame Toggle={GearXLMoon} note={<><b>D · Mond</b> — klassische Breguet-Nadel: durchbrochener Messing­ring nahe der Spitze, der <b>gebohrte Mond</b> glüht in der Modusfarbe. Antik-uhrmacherisch.</>} />
        </DCArtboard>
      </DCSection>

      <DCSection
        id="zahnrad-jugendstil"
        title="Zahnrad · Zeiger im Jugendstil"
        subtitle="Aufbauend auf dem Mond-Zeiger: größere, ornamentale Messing-Köpfe im Jugendstil. Der gefasste Stein bleibt das farbwechselnde Herzstück, gerahmt von floralem Schmuckwerk; der Schaft trägt eine dezent eingravierte Ranke und taucht wie zuvor ins Mittelloch ein."
      >
        <DCArtboard id="hand-lily" label="E · Lilie" width={AW} height={AH}>
          <DemoFrame Toggle={GearXLLily} note={<><b>E · Lilie</b> — eine stilisierte Jugendstil-<b>Lilie</b>: hohes Mittelblatt, zwei seitliche Blütenblätter rahmen den gefassten Stein. Kleine Knospen an den Spitzen glühen mit. Ranke am Schaft.</>} />
        </DCArtboard>
        <DCArtboard id="hand-lily-closed" label="H · Lilie (geschlossen)" width={AW} height={AH}>
          <DemoFrame Toggle={GearXLLilyClosed} note={<><b>H · Lilie geschlossen</b> — die drei Zacken zu <b>einer geschlossenen Spitze</b> verbunden. Der Stein wird von einem gravierten Mandel-Rahmen gefasst; Rahmen <b>und</b> Schaft-Ranke glühen und <b>wechseln die Farbe</b> wie die Gravur auf dem Zahnrad.</>} />
        </DCArtboard>
        <DCArtboard id="hand-iris" label="F · Iris / Whiplash-Blätter" width={AW} height={AH}>
          <DemoFrame Toggle={GearXLIris} note={<><b>F · Iris</b> — schmale Knospe, flankiert von zwei langen <b>Whiplash-Blättern</b>, die ausschwingen und zum Stein zurückkurven. Typische Jugendstil-Peitschenlinie.</>} />
        </DCArtboard>
        <DCArtboard id="hand-volute" label="G · Volute" width={AW} height={AH}>
          <DemoFrame Toggle={GearXLVolute} note={<><b>G · Volute</b> — Tropfenspitze mit zwei symmetrischen <b>C-Voluten</b>, die sich um eine große Cabochon-Fassung rollen. Schmiedeeisen-Anmutung eines Métro-Eingangs.</>} />
        </DCArtboard>
      </DCSection>

      <DCSection
        id="zahnrad-spitzen"
        title="Zahnrad · Spitzen-Variationen"
        subtitle="Basis = die Volute, die dir am besten gefällt (Schaft fadet ins Loch, gefasster farbwechselnder Stein, glühende Ranke). Variiert wird nur die Spitze — von minimalistisch bis überraschend. Klicken legt um."
      >
        <DCArtboard id="tip-drop" label="1 · Tropfen (pur)" width={AW} height={AH}>
          <DemoFrame Toggle={GearXLDrop} note={<><b>1 · Tropfen</b> — reine Ogival-Tropfenspitze, nur der gefasste Stein, kein Zierwerk. Die ruhigste, eleganteste Antwort auf deine Spitzen-Unsicherheit.</>} />
        </DCArtboard>
        <DCArtboard id="tip-facet" label="2 · Facette" width={AW} height={AH}>
          <DemoFrame Toggle={GearXLFacet} note={<><b>2 · Facette</b> — geometrische Rautenspitze mit eingravierter, glühender Innen-Raute, die den Stein fasst. Klar, modern, fast schon kristallin.</>} />
        </DCArtboard>
        <DCArtboard id="tip-peacock" label="3 · Pfauenauge" width={AW} height={AH}>
          <DemoFrame Toggle={GearXLPeacock} note={<><b>3 · Pfauenauge</b> — Federblatt mit gravierten Federästen, die wie eine Iris vom „Auge" (Stein) ausstrahlen. Glühen und Stein wechseln gemeinsam die Farbe.</>} />
        </DCArtboard>
        <DCArtboard id="tip-flame" label="4 · Flamme" width={AW} height={AH}>
          <DemoFrame Toggle={GearXLFlame} note={<><b>4 · Flamme</b> — eine zentrale Zunge, flankiert von zwei züngelnden Messing-Flammen; der Stein ist die glühende Glut im Herzen.</>} />
        </DCArtboard>
        <DCArtboard id="tip-sun" label="5 · Sonne" width={AW} height={AH}>
          <DemoFrame Toggle={GearXLSun} note={<><b>5 · Sonne</b> — eine schmale Messing-Spitze mit einem Fächer glühender Strahlen; der Stein ist die Sonnenscheibe. Strahlt buchstäblich in der Modusfarbe.</>} />
        </DCArtboard>
        <DCArtboard id="tip-trefoil" label="6 · Kleeblatt" width={AW} height={AH}>
          <DemoFrame Toggle={GearXLTrefoil} note={<><b>6 · Kleeblatt</b> — drei runde Messing-Lappen (Dreiblatt) betten den Stein in ihre Mitte. Weich, heraldisch, ungewohnt für einen Zeiger.</>} />
        </DCArtboard>
        <DCArtboard id="tip-lyra" label="7 · Lyra" width={AW} height={AH}>
          <DemoFrame Toggle={GearXLLyra} note={<><b>7 · Lyra</b> — zwei Messing-Hörner schwingen aus und umfassen den Stein wie eine Leier. Skulptural, offen, asymmetrisch im Detail.</>} />
        </DCArtboard>
        <DCArtboard id="tip-shield" label="8 · Schild" width={AW} height={AH}>
          <DemoFrame Toggle={GearXLShield} note={<><b>8 · Schild</b> — ein heraldischer Wappenschild, der Stein als Buckel (Boss) in der Mitte, eine glühende Mittelgrat-Gravur darunter.</>} />
        </DCArtboard>
      </DCSection>

      <DCSection
        id="zahnrad-skizze"
        title="Zahnrad · Aus deiner Skizze"
        subtitle="Eine durchgehende Messing-Raute (keine zusammengesetzten Flächen): scharfe Spitze, breite Schultern. Mittig ein kleiner runder Stein mit Glanzpunkt, umschlossen von einem gravierten, gelappten Rahmen; Knoten an der Spitze, Schulter-Kerben, lange Schlangenlinie am Schaft. Stein und Gravur glühen in der Modusfarbe und tauchen in das Loch ein. Klicken legt um."
      >
        <DCArtboard id="sketch-true" label="Skizze · umgesetzt" width={AW} height={AH}>
          <DemoFrame Toggle={GearXLSketch} note={<><b>Aus deiner Skizze</b> — eine einzige Gravur: ein Winkel parallel zum Dach der Spitze, zwischen Spitze und Stein. Echte Kerbe (dunkle Rille + Lichtgrat), kein Farbwechsel. Glanzpunkt oben-links, Schatten unten-rechts, Kantenlicht oben.</>} />
        </DCArtboard>
        <DCArtboard id="sketch-brassbox" label="Messing-Fassung" width={AW} height={AH}>
          <DemoFrame Toggle={GearXLSketchBrass} note={<><b>Messing-Fassung</b> — statt der dunklen Öffnung eine sichtbare Vorrichtung: ein gefräster Messing-Lagerbock mit dunklem Lagerschlitz, in dem sich das Rad dreht, fixiert mit zwei Nieten. Gleiches Licht wie Rad & Platte.</>} />
        </DCArtboard>
        <DCArtboard id="sketch-flush" label="Bündig zum Rahmen" width={AW} height={AH}>
          <DemoFrame Toggle={GearXLSketchFlush} note={<><b>Bündig zum Rahmen</b> — keine Box, keine Fassung: das Rad läuft einfach bis zur unteren Rahmenkante und wird dort beschnitten, als drehte es sich in einem Ausschnitt der Platte.</>} />
        </DCArtboard>
      </DCSection>

      <DCSection
        id="zahnrad-label"
        title="Zahnrad · Beschriftung"
        subtitle="EDIT und GAME sollen markanter und besser lesbar werden. Sechs Behandlungen auf dem Skizzen-Rad — Original oben links zum Vergleich. Klicken legt um."
      >
        <DCArtboard id="lab-orig" label="Original (Vergleich)" width={AW} height={AH}>
          <DemoFrame Toggle={GearXLSketch} note={<><b>Original</b> — 16 px, weiter Buchstabenabstand, gedämpfte Farbe. Die Gravur ist fein, geht aber auf dem dunklen Gehäuse unter.</>} />
        </DCArtboard>
        <DCArtboard id="lab-ink" label="A · Schwarze Kontur" width={AW} height={AH}>
          <DemoFrame Toggle={GearLabInk} note={<><b>A · Kontur</b> — deine Idee: größer (21 px), engerer Abstand, jede Letter mit <b>schwarzer Umrandung</b>. Hebt die Schrift vom Gehäuse ab, der Modus-Glow bleibt.</>} />
        </DCArtboard>
        <DCArtboard id="lab-plate" label="B · Messing-Plakette" width={AW} height={AH}>
          <DemoFrame Toggle={GearLabPlate} note={<><b>B · Plakette</b> — deine Messing-Idee: kleine gravierte Namensschilder aus demselben Messing wie das Rad. Die aktive Plakette leuchtet voll und bekommt einen Modus-Ring, die inaktive liegt im Schatten.</>} />
        </DCArtboard>
        <DCArtboard id="lab-slate" label="C · Anzeigefenster" width={AW} height={AH}>
          <DemoFrame Toggle={GearLabSlate} note={<><b>C · Fenster</b> — eigene Idee: zwei dunkle, eingelassene Sichtfenster; die aktive Seite glüht darin wie eine beleuchtete Anzeige. Maximaler Kontrast bei Aktivierung.</>} />
        </DCArtboard>
        <DCArtboard id="lab-pixel" label="D · Pixel-Versalien" width={AW} height={AH}>
          <DemoFrame Toggle={GearLabPixel} note={<><b>D · Pixel</b> — eigene Idee: die Display-Pixelschrift des Systems mit hartem Pixel-Schlagschatten. Blockig, markant, sehr „Gerät".</>} />
        </DCArtboard>
        <DCArtboard id="lab-tight" label="E · Größer & enger" width={AW} height={AH}>
          <DemoFrame Toggle={GearLabTight} note={<><b>E · Minimal</b> — die leiseste Korrektur: 23 px statt 16, Buchstabenabstand fast auf null, hellere Grundfarbe, feine dunkle Kante. Kein neues Bauteil.</>} />
        </DCArtboard>
        <DCArtboard id="lab-deep" label="F · Tiefe Gravur" width={AW} height={AH}>
          <DemoFrame Toggle={GearLabDeep} note={<><b>F · Gravur</b> — eigene Idee: die Buchstaben sind tief ins Gehäuse <b>gekerbt</b> (dunkle Rille, Lichtgrat unten). Die aktive Seite füllt sich von innen mit Modus-Licht.</>} />
        </DCArtboard>
        <DCArtboard id="lab-be" label="★ B + E · Plakette, größer & enger (bündig)" width={AW} height={AH}>
          <DemoFrame Toggle={GearLabBE} note={<><b>B + E · Kombi</b> — Messing-Plaketten mit der <b>größeren, enger gesetzten</b> Gravur-Schrift, das Rad läuft <b>bündig</b> bis zur unteren Rahmenkante. Aktive Plakette: volle Helligkeit + Modus-Ring.</>} />
        </DCArtboard>
      </DCSection>

      <DCSection
        id="zahnrad-kompakt"
        title="Zahnrad · Kompakter"
        subtitle="Die B+E-Kombi gefällt — aber der Außenrahmen ist zu groß. Vier Wege, Platz zu sparen und die Elemente dichter zu setzen. Ausgang links zum Vergleich, Varianten kombinierbar."
      >
        <DCArtboard id="komp-orig" label="Ausgang · B + E" width={AW} height={AH}>
          <DemoFrame Toggle={GearLabBE} note={<><b>Ausgang</b> — die gewählte Kombi unverändert: 22 px Seitenpolster, 16/14 px oben/unten, 13 px Lücke zwischen Plakette und Rad.</>} />
        </DCArtboard>
        <DCArtboard id="komp-trim" label="K1 · Getrimmt" width={AW} height={AH}>
          <DemoFrame Toggle={GearBETrim} note={<><b>K1 · Getrimmt</b> — nur Luft raus: Polster 12/8/6 px, Lücke 8 px, kleinere Eckschrauben. Gleiche Anordnung, spürbar schmaler und flacher.</>} />
        </DCArtboard>
        <DCArtboard id="komp-axle" label="K2 · Plaketten an der Achse" width={AW} height={AH}>
          <DemoFrame Toggle={GearBEAxle} note={<><b>K2 · Achse</b> — getrimmt + die Plaketten rutschen nach <b>unten auf Höhe der Radachse</b>. Liest sich mechanischer: Schilder und Welle auf einer Linie, oben bleibt Raum fürs Rad.</>} />
        </DCArtboard>
        <DCArtboard id="komp-rivet" label="K3 · Genietete Plaketten" width={AW} height={AH}>
          <DemoFrame Toggle={GearBERivet} note={<><b>K3 · Genietet</b> — die vier Eckschrauben entfallen; stattdessen trägt <b>jede Plakette zwei eigene Nieten</b>. Das Gehäuse kann noch enger ans Material, wirkt aufgeräumter.</>} />
        </DCArtboard>
        <DCArtboard id="komp-small" label="K4 · Kleineres Rad" width={AW} height={AH}>
          <DemoFrame Toggle={GearBESmall} note={<><b>K4 · Kleineres Rad</b> — der größte Hebel: das Rad schrumpft von ⌀ 80 auf ⌀ 64 px, Zeiger und Mittelrad skalieren mit, das Gehäuse folgt. Deutlich flacher, Plaketten bleiben gleich groß.</>} />
        </DCArtboard>
        <DCArtboard id="komp-final" label="★ K3 + K4 · Genietet, kleines Rad" width={AW} height={AH}>
          <DemoFrame Toggle={GearBEFinal} note={<><b>K3 + K4 · Kombi</b> — genietete Plaketten ohne Eckschrauben <b>und</b> das kleinere ⌀-64-Rad, Gehäuse <b>flach</b>: kaum Luft über den Plaketten. Der Zeiger wirft bei ±60° auf die <b>oberen</b> Plakettenecken.</>} />
        </DCArtboard>
      </DCSection>

      <DCSection
        id="dramatisch"
        title="Dramatisch"
        subtitle="Der Moduswechsel soll sich ereignishaft anfühlen — Schalter + getönte Leiste."
      >
        <DCArtboard id="plate" label="8 · Modus-Stempel" width={AW8} height={AH}>
          <DemoFrame Toggle={Toggle8} tint note={<><b>8 · Modus-Stempel</b> — eine große Platte zeigt den aktuellen Modus mit Icon; beim Umschalten „stempelt" das Label kurz auf und die <b>ganze Leiste</b> tönt sich zur Modusfarbe. Breite, zentrale Platzierung.</>} />
        </DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<ModeToggleApp />);
