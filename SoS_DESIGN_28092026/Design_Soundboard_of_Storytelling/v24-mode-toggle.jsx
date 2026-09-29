// v24-mode-toggle.jsx — Mode Toggle as Interactive Screen Header (Board only).
//
// New component: `sb-mode-toggle`. Lives in the title-slot of the board's
// TopBar, replacing the current small `sb-mode-badge`. Two halves
// (SETUP · GAME) separated by a vertical rule; the active half carries the
// mode color, the other is dimmed. Clicking the inactive half flips the
// mode and fires a directional pixel-spark animation (color = destination
// mode, direction = source → destination), 420ms total. Reduced-motion
// users get a non-flying drop-shadow flash instead.
//
// Five artboards:
//   1 · Idle states — desktop + mobile, both modes
//   2 · Mid-flight — frozen sparks, both directions
//   3 · Reduced-motion — flash variant
//   4 · Live playground — clickable, real animation, in TopBar context
//   5 · Notes — class inventory, §6 row, token rationale

// ─────────────────────────────────────────────────────────────────
// Styles — one-time injection. Component is sb-pix-family, so it
// inherits the pixel-frame from tokens.css; we only set the
// --pix-* overrides and the toggle-specific bits.
// ─────────────────────────────────────────────────────────────────
const MODE_TOGGLE_CSS = `
/* sb-mode-toggle — interactive Board screen header.
   Pixel-frame from sb-pix family. Two halves + a separator rule.
   Sparks live in a sibling layer so clip-path doesn't eat them. */
.sb-mode-toggle {
  --pix-step: 4px;
  --pix-bg: var(--sunk);
  --pix-border: var(--border);
  display: inline-flex;
  align-items: stretch;
  font-family: var(--font-ui);
  font-size: var(--fs-pixel-sm);     /* 22px — bigger than 16px static titles */
  letter-spacing: 0.14em;
  text-transform: uppercase;
  line-height: 1;
  padding: 0;
  user-select: none;
}
.sb-mode-toggle.is-compact {
  font-size: var(--fs-md);            /* 16px — mobile */
  --pix-step: 3px;
}

.sb-mode-toggle-half {
  background: transparent;
  border: 0;
  font: inherit;
  letter-spacing: inherit;
  text-transform: inherit;
  color: var(--text-mute);
  padding: 8px 18px;
  cursor: pointer;
  transition: color .22s ease, text-shadow .22s ease;
}
.sb-mode-toggle.is-compact .sb-mode-toggle-half { padding: 6px 12px; }

.sb-mode-toggle-half:focus-visible {
  outline: 2px solid var(--border-strong);
  outline-offset: 2px;
}

/* Active-half coloring. Each mode pulls its own --mode-*-glow token for
   text-shadow — the -glow alpha tier introduced alongside this component
   (see tokens.css §MODE) so we're not mixing -soft (page wash) with -glow
   (text/drop-shadow). The pixel-frame border also follows the active mode
   so the entire chrome carries the colour, not just the text. */
.sb-mode-toggle.is-setup { --pix-border: var(--mode-setup); }
.sb-mode-toggle.is-game  { --pix-border: var(--gold); }

.sb-mode-toggle.is-setup .sb-mode-toggle-half[data-side="setup"] {
  color: var(--mode-setup);
  text-shadow: 0 0 8px var(--mode-setup-glow);
}
.sb-mode-toggle.is-game .sb-mode-toggle-half[data-side="game"] {
  color: var(--gold-bright);
  text-shadow: 0 0 8px var(--mode-game-glow);
}

/* Separator — pure | drawn as a 1px rule, color follows the dim half so
   it doesn't compete with either color. */
.sb-mode-toggle-sep {
  width: 1px;
  align-self: stretch;
  background: var(--border);
  margin: 6px 0;
  pointer-events: none;
}

/* Spark layer — sibling to the toggle so clip-path on .sb-pix doesn't
   clip the particles. Positioned to overlap the toggle exactly. */
.sb-mode-toggle-sparks {
  position: absolute;
  inset: 0;
  pointer-events: none;
  overflow: visible;
}
.sb-mode-toggle-spark {
  position: absolute;
  width: 3px; height: 3px;
  /* Background = base mode token (vibrant solid); drop-shadow uses the
     matching --mode-*-glow so the bloom matches the active-half glow. */
  background: var(--spark-color, var(--gold));
  filter: drop-shadow(0 0 4px var(--spark-glow, var(--gold-bright)));
  /* CSS custom props supply trajectory; one keyframe handles both directions. */
  opacity: 0;
  animation: sb-mode-spark-fly var(--spark-dur, 380ms) cubic-bezier(.22,.6,.36,1) var(--spark-delay, 0ms) forwards;
}

@keyframes sb-mode-spark-fly {
  /* Hammer-strike trajectory: origin = strike point (centre of the half
     being switched to), each spark flies outward radially to (dx, dy)
     offsets supplied per-element as CSS custom properties. Bias toward
     destination side comes from the angle distribution in buildSparks(),
     not from the keyframe. */
  0%   { transform: translate(var(--spark-ox), var(--spark-oy))                                      scale(1);   opacity: 0; }
  10%  { transform: translate(var(--spark-ox), var(--spark-oy))                                      scale(1.2); opacity: 1; }
  100% { transform: translate(calc(var(--spark-ox) + var(--spark-dx)),
                              calc(var(--spark-oy) + var(--spark-dy)))                               scale(.3);  opacity: 0; }
}

/* Color-transition cue: during flight, the destination half fades IN its
   color so the swarm visually carries the hue across. Handled by setting
   data-flight on the toggle. */
.sb-mode-toggle[data-flight="to-game"] .sb-mode-toggle-half[data-side="game"] {
  animation: sb-mode-half-ignite-game 380ms ease-out forwards;
}
.sb-mode-toggle[data-flight="to-setup"] .sb-mode-toggle-half[data-side="setup"] {
  animation: sb-mode-half-ignite-setup 380ms ease-out forwards;
}
@keyframes sb-mode-half-ignite-game {
  0%   { color: var(--text-mute);    text-shadow: none; }
  60%  { color: var(--gold);         text-shadow: 0 0 4px var(--mode-game-glow); }
  100% { color: var(--gold-bright);  text-shadow: 0 0 8px var(--mode-game-glow); }
}
@keyframes sb-mode-half-ignite-setup {
  0%   { color: var(--text-mute);    text-shadow: none; }
  100% { color: var(--mode-setup);   text-shadow: 0 0 8px var(--mode-setup-glow); }
}

/* Reduced-motion: no flying particles. The newly active half pulses a
   single 220ms drop-shadow flash — quick, unambiguous, no movement. */
@media (prefers-reduced-motion: reduce) {
  .sb-mode-toggle-spark { display: none; }
  .sb-mode-toggle[data-flight] .sb-mode-toggle-half[data-side="game"],
  .sb-mode-toggle[data-flight] .sb-mode-toggle-half[data-side="setup"] {
    animation: none;
  }
  .sb-mode-toggle[data-flight="to-game"]  .sb-mode-toggle-half[data-side="game"]  { animation: sb-mode-flash-game  220ms ease-out forwards; }
  .sb-mode-toggle[data-flight="to-setup"] .sb-mode-toggle-half[data-side="setup"] { animation: sb-mode-flash-setup 220ms ease-out forwards; }
}
@keyframes sb-mode-flash-game {
  0%   { color: var(--text-mute); filter: drop-shadow(0 0 0 transparent); }
  40%  { color: var(--gold-bright); filter: drop-shadow(0 0 12px var(--gold-bright)); }
  100% { color: var(--gold-bright); filter: drop-shadow(0 0 0 transparent); }
}
@keyframes sb-mode-flash-setup {
  0%   { color: var(--text-mute); filter: drop-shadow(0 0 0 transparent); }
  40%  { color: var(--mode-setup); filter: drop-shadow(0 0 12px var(--mode-setup)); }
  100% { color: var(--mode-setup); filter: drop-shadow(0 0 0 transparent); }
}

/* Force-reduced variant — class-toggled for the artboard demo, since
   prefers-reduced-motion is a real OS setting we can't fake. */
.sb-mode-toggle.is-reduced .sb-mode-toggle-spark { display: none; }
.sb-mode-toggle.is-reduced[data-flight] .sb-mode-toggle-half[data-side="game"],
.sb-mode-toggle.is-reduced[data-flight] .sb-mode-toggle-half[data-side="setup"] {
  animation: none;
}
.sb-mode-toggle.is-reduced[data-flight="to-game"]  .sb-mode-toggle-half[data-side="game"]  { animation: sb-mode-flash-game  220ms ease-out forwards; }
.sb-mode-toggle.is-reduced[data-flight="to-setup"] .sb-mode-toggle-half[data-side="setup"] { animation: sb-mode-flash-setup 220ms ease-out forwards; }

/* Force-motion variant — overrides the prefers-reduced-motion media query
   for design-system documentation. Applied to the SPARKS LAYER (sibling of
   the toggle, not a descendant) so the selector resolves cleanly. Used on
   all in-artboard ModeToggles so the spark animation is visible to
   reviewers regardless of their OS setting. NEVER use this in production
   code paths — production must honour the user's reduced-motion preference. */
.sb-mode-toggle-sparks.is-force-motion .sb-mode-toggle-spark { display: block; }
.sb-mode-toggle.is-force-motion[data-flight="to-game"] .sb-mode-toggle-half[data-side="game"] {
  animation: sb-mode-half-ignite-game 380ms ease-out forwards;
}
.sb-mode-toggle.is-force-motion[data-flight="to-setup"] .sb-mode-toggle-half[data-side="setup"] {
  animation: sb-mode-half-ignite-setup 380ms ease-out forwards;
}
`;

if (typeof document !== 'undefined' && !document.getElementById('sb-mode-toggle-css')) {
  const s = document.createElement('style');
  s.id = 'sb-mode-toggle-css';
  s.textContent = MODE_TOGGLE_CSS;
  document.head.appendChild(s);
}

// ─────────────────────────────────────────────────────────────────
// Deterministic spark distribution. Identical seed → identical
// trajectories every render (avoids reshuffle on parent re-render).
//
// Hammer-strike model: when the user clicks, the destination half is
// the strike point. Sparks spawn at that point and fly outward in a
// wide arc — like sparks from a struck hot iron. The arc is biased
// AWAY from the toggle (toward the destination side and upward) so
// the swarm reads as "leaving the toggle", not crossing through it.
// ─────────────────────────────────────────────────────────────────
function buildSparks({ count, direction, width, height }) {
  const sparks = [];
  // Strike origin: centre of the destination half, vertically centred.
  const ox = direction === 'to-game' ? width * 0.72 : width * 0.28;
  const oy = height / 2;
  // Angle distribution: a ~220° fan biased away from the toggle and
  // upward. For to-game the fan centres on the upper-right (-45°);
  // for to-setup it centres on the upper-left (-135°). Half the
  // sparks go above the toggle, half below — but more upward overall.
  const angleCenter = direction === 'to-game' ? -Math.PI * 0.25 : -Math.PI * 0.75;
  const angleSpread = Math.PI * 1.1;  // ~198° fan, plenty of spread
  for (let i = 0; i < count; i++) {
    const seed = i * 73.13 + 5.7;
    const t1 = (seed * 0.41) % 1;
    const t2 = (seed * 0.29) % 1;
    const t3 = (seed * 0.17) % 1;
    const t4 = (seed * 0.11) % 1;
    const angle = angleCenter + (t1 - 0.5) * angleSpread;
    const distance = 50 + t2 * 90;          // 50..140 px outward
    const dx = Math.cos(angle) * distance;
    const dy = Math.sin(angle) * distance;
    const delay = Math.round(t3 * 70);      // 0..70 ms stagger
    const dur   = 380 + Math.round(t4 * 200); // 380..580 ms
    sparks.push({ i, ox, oy, dx, dy, delay, dur });
  }
  return sparks;
}

// ─────────────────────────────────────────────────────────────────
// <ModeToggle> — the live component.
//   props:
//     mode         'setup' | 'game'          controlled mode
//     onChange(m)  callback                  fires on flip
//     compact      bool                      mobile sizing
//     reduced      bool                      force flash variant (for artboard demo)
//     sparkCount   number                    default 10 (desktop), 6 (compact)
// ─────────────────────────────────────────────────────────────────
function ModeToggle({ mode, onChange, compact, reduced, forceMotion, sparkCount }) {
  const [flight, setFlight] = React.useState(null);   // 'to-game' | 'to-setup' | null
  const [sparks, setSparks] = React.useState([]);
  const ref = React.useRef(null);

  const count = sparkCount ?? (compact ? 8 : 14);

  function flip(target) {
    if (target === mode || flight) return;
    const dir = target === 'game' ? 'to-game' : 'to-setup';
    const rect = ref.current?.getBoundingClientRect();
    const w = rect?.width  ?? (compact ? 180 : 260);
    const h = rect?.height ?? (compact ? 36  : 48);
    setSparks(reduced ? [] : buildSparks({ count, direction: dir, width: w, height: h }));
    setFlight(dir);
    // Flip the mode mid-flight so the destination half is "lit" by the time
    // the swarm arrives.
    window.setTimeout(() => { onChange && onChange(target); }, 160);
    window.setTimeout(() => { setFlight(null); setSparks([]); }, 460);
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <div
        ref={ref}
        className={
          'sb-pix sb-mode-toggle ' +
          (mode === 'game' ? 'is-game' : 'is-setup') +
          (compact ? ' is-compact' : '') +
          (reduced ? ' is-reduced' : (forceMotion ? ' is-force-motion' : ''))
        }
        data-flight={flight || undefined}
        role="group"
        aria-label="Board mode"
      >
        <button
          type="button"
          className="sb-mode-toggle-half"
          data-side="setup"
          aria-pressed={mode === 'setup'}
          onClick={() => flip('setup')}
        >SETUP</button>
        <span className="sb-mode-toggle-sep" aria-hidden="true" />
        <button
          type="button"
          className="sb-mode-toggle-half"
          data-side="game"
          aria-pressed={mode === 'game'}
          onClick={() => flip('game')}
        >GAME</button>
      </div>
      {sparks.length > 0 && (
        <div className={'sb-mode-toggle-sparks' + (forceMotion && !reduced ? ' is-force-motion' : '')}>
          {sparks.map(s => (
            <span
              key={s.i + ':' + flight}
              className="sb-mode-toggle-spark"
              style={{
                ['--spark-color']: flight === 'to-game' ? 'var(--gold-bright)' : 'var(--mode-setup)',
                ['--spark-glow']:  flight === 'to-game' ? 'var(--mode-game-glow)' : 'var(--mode-setup-glow)',
                ['--spark-ox']:    `${s.ox}px`,
                ['--spark-oy']:    `${s.oy}px`,
                ['--spark-dx']:    `${s.dx}px`,
                ['--spark-dy']:    `${s.dy}px`,
                ['--spark-delay']: `${s.delay}ms`,
                ['--spark-dur']:   `${s.dur}ms`,
                top: 0, left: 0,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// <FrozenModeToggle> — non-interactive variant for the mid-flight
// artboard. Statically positions sparks at 50% of their trajectory
// with peak opacity so the still frame reads as "animation in motion".
// ─────────────────────────────────────────────────────────────────
function FrozenModeToggle({ mode, direction, compact, progress = 0.5 }) {
  const w = compact ? 180 : 260;
  const h = compact ? 36  : 48;
  const count = compact ? 8 : 14;
  const sparks = buildSparks({ count, direction, width: w, height: h });
  const color = direction === 'to-game' ? 'var(--gold-bright)' : 'var(--mode-setup)';
  const glow  = direction === 'to-game' ? 'var(--mode-game-glow)' : 'var(--mode-setup-glow)';

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <div
        className={'sb-pix sb-mode-toggle is-force-motion ' + (mode === 'game' ? 'is-game' : 'is-setup') + (compact ? ' is-compact' : '')}
        role="group" aria-label="Board mode (frozen)"
      >
        <button type="button" className="sb-mode-toggle-half" data-side="setup"
          style={direction === 'to-setup' ? igniteStyle('setup', progress) : undefined}>SETUP</button>
        <span className="sb-mode-toggle-sep" aria-hidden="true" />
        <button type="button" className="sb-mode-toggle-half" data-side="game"
          style={direction === 'to-game' ? igniteStyle('game', progress) : undefined}>GAME</button>
      </div>
      <div className="sb-mode-toggle-sparks is-force-motion">
        {sparks.map(s => {
          // Position at `progress` along the radial trajectory.
          const px = s.ox + s.dx * progress;
          const py = s.oy + s.dy * progress;
          const opacity = progress < 0.1 ? progress * 10 : Math.max(0, 1 - (progress - 0.1) * 1.1);
          const scale   = progress < 0.1 ? 1 + progress * 2 : Math.max(0.3, 1.2 - progress);
          return (
            <span
              key={s.i}
              className="sb-mode-toggle-spark"
              style={{
                top: 0, left: 0,
                transform: `translate(${px}px, ${py}px) scale(${scale})`,
                background: color,
                filter: `drop-shadow(0 0 4px ${glow})`,
                opacity,
                animation: 'none',
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

function igniteStyle(side, progress) {
  // Interpolate text-mute → mode color along progress
  if (side === 'game') {
    if (progress < 0.6) return { color: 'var(--text-dim)' };
    return { color: 'var(--gold-bright)', textShadow: '0 0 8px var(--mode-game-glow)' };
  }
  if (progress < 0.6) return { color: 'var(--text-dim)' };
  return { color: 'var(--mode-setup)', textShadow: '0 0 8px var(--mode-setup-glow)' };
}

// ─────────────────────────────────────────────────────────────────
// <BoardTopBarV3> — board's TopBar variant. 3-column grid (1fr auto 1fr)
// gives the toggle a true center; left = flame + breadcrumb,
// right = help/fullscreen. Compare with TopBarV2 (single flex row with
// left-aligned title) — that one stays for non-board screens.
// ─────────────────────────────────────────────────────────────────
function BoardTopBarV3({ breadcrumb, mode, onMode, compact, reduced, forceMotion }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr auto 1fr',
      alignItems: 'center',
      gap: 12,
      padding: compact ? '6px 10px' : '8px 16px',
      background: 'var(--deep)',
      borderBottom: '1px solid var(--border)',
      minHeight: compact ? 44 : 60,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
        <div style={{
          padding: compact ? '3px 8px' : '5px 12px',
          border: '1px solid var(--gold)',
          color: 'var(--gold)',
          fontFamily: 'var(--font-ui)',
          fontSize: compact ? 12 : 14, letterSpacing: '.1em',
        }}>MENU</div>
        {!compact && breadcrumb && (
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 12,
            color: 'var(--text-mute)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>{breadcrumb}</span>
        )}
      </div>

      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <ModeToggle mode={mode} onChange={onMode} compact={compact} reduced={reduced} forceMotion={forceMotion} />
      </div>

      <div style={{ display: 'flex', gap: 8, color: 'var(--gold)', justifyContent: 'flex-end' }}>
        <div style={{ border: '1px solid var(--gold-dim)', width: compact ? 24 : 28, height: compact ? 24 : 28, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-ui)', fontSize: compact ? 12 : 14 }}>?</div>
        <div style={{ border: '1px solid var(--gold-dim)', width: compact ? 24 : 28, height: compact ? 24 : 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M1 4V1h3M11 4V1H8M1 8v3h3M11 8v3H8" />
          </svg>
        </div>
      </div>
    </div>
  );
}

// Same shape but with a FROZEN toggle inside (for the mid-flight artboard).
function BoardTopBarV3Frozen({ breadcrumb, mode, direction, compact, progress }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center', gap: 12,
      padding: compact ? '6px 10px' : '8px 16px',
      background: 'var(--deep)', borderBottom: '1px solid var(--border)',
      minHeight: compact ? 44 : 60,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          padding: '5px 12px', border: '1px solid var(--gold)', color: 'var(--gold)',
          fontFamily: 'var(--font-ui)', fontSize: 14, letterSpacing: '.1em',
        }}>MENU</div>
        {breadcrumb && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-mute)' }}>{breadcrumb}</span>}
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <FrozenModeToggle mode={mode} direction={direction} compact={compact} progress={progress} />
      </div>
      <div style={{ display: 'flex', gap: 8, color: 'var(--gold)', justifyContent: 'flex-end' }}>
        <div style={{ border: '1px solid var(--gold-dim)', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-ui)', fontSize: 14 }}>?</div>
        <div style={{ border: '1px solid var(--gold-dim)', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M1 4V1h3M11 4V1H8M1 8v3h3M11 8v3H8" />
          </svg>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Small label helpers
// ─────────────────────────────────────────────────────────────────
function NoteLabel({ children, color = 'var(--text-mute)' }) {
  return (
    <div style={{
      fontFamily: 'var(--font-ui)', fontSize: 12, letterSpacing: '.14em',
      textTransform: 'uppercase', color,
    }}>{children}</div>
  );
}
function MonoNote({ children }) {
  return <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.6 }}>{children}</div>;
}

// ═════════════════════════════════════════════════════════════════
// ARTBOARD 1 · IDLE STATES — desktop both modes + mobile both modes
// ═════════════════════════════════════════════════════════════════
function ModeToggleIdleArtboard() {
  const [m1, setM1] = React.useState('setup');
  const [m2, setM2] = React.useState('game');
  return (
    <div className="sb" style={{ padding: 28, overflow: 'auto', height: '100%' }}>
      <div style={{ marginBottom: 20 }}>
        <div className="sb-display-vt" style={{ fontSize: 26 }}>Mode Toggle · Idle states</div>
        <div className="sb-mono" style={{ fontSize: 13, marginTop: 6 }}>
          // sits in the title-slot of the board's TopBar. center-anchored via a 3-column grid<br/>
          // (1fr auto 1fr) — same Präzedenz as `LibChrome` in v4-library.jsx.<br/>
          // visual weight: --fs-pixel-sm (22px VT323) — clearly bigger than 16px static titles.
        </div>
      </div>

      <NoteLabel>· Desktop · SETUP active</NoteLabel>
      <div style={{
        border: '1px solid var(--border-soft)', background: 'var(--night)',
        marginTop: 8, marginBottom: 20,
      }}>
        <BoardTopBarV3 breadcrumb="· The Tavern · Board 1" mode={m1} onMode={setM1} forceMotion />
        <div style={{ height: 60, background: 'var(--surface)' }} />
      </div>

      <NoteLabel>· Desktop · GAME active</NoteLabel>
      <div style={{
        border: '1px solid var(--border-soft)', background: 'var(--night)',
        marginTop: 8, marginBottom: 28,
      }}>
        <BoardTopBarV3 breadcrumb="· The Tavern · Board 1" mode={m2} onMode={setM2} forceMotion />
        <div style={{ height: 60, background: 'var(--surface)' }} />
      </div>

      <NoteLabel>· Mobile · phone-portrait</NoteLabel>
      <div style={{ display: 'flex', gap: 20, marginTop: 8, alignItems: 'flex-start' }}>
        {[
          { mode: 'setup', label: 'SETUP active' },
          { mode: 'game',  label: 'GAME active' },
        ].map((p) => (
          <PhoneFrame key={p.mode} label={p.label}>
            <BoardTopBarV3 mode={p.mode} onMode={() => {}} compact forceMotion />
            <div style={{ flex: 1, background: 'var(--surface)' }} />
          </PhoneFrame>
        ))}
      </div>

      <div style={{ marginTop: 32, padding: 16, background: 'var(--raised)', border: '1px solid var(--border-soft)' }}>
        <NoteLabel color="var(--gold)">CLICK ANY HALF TO TRY THE ANIMATION</NoteLabel>
        <MonoNote>
          ▸ both desktop bars above are live. clicking the inactive half flips the mode<br/>
          ▸ hammer-strike model: each click spawns a radial spark shower from the destination half<br/>
          ▸ sparks fly OUTWARD from the toggle, biased toward the destination side and upward<br/>
          ▸ the destination color also ignites the half mid-flight, so the chrome "carries" the hue
        </MonoNote>
      </div>
    </div>
  );
}

function PhoneFrame({ children, label }) {
  return (
    <div style={{ width: 375 }}>
      <NoteLabel color="var(--text-dim)">{label}</NoteLabel>
      <div style={{
        marginTop: 6,
        width: 375, height: 320,
        background: 'var(--night)',
        border: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>{children}</div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// ARTBOARD 2 · MID-FLIGHT — frozen sparks, both directions
// ═════════════════════════════════════════════════════════════════
function ModeToggleFlightArtboard() {
  // Top two boards are LIVE — click the inactive half to play the real
  // animation. The frame sequence at the bottom stays truly static (it's
  // a t=15%/50%/85% reference, not a demo).
  const [m1, setM1] = React.useState('setup');
  const [m2, setM2] = React.useState('game');
  return (
    <div className="sb" style={{ padding: 28, overflow: 'auto', height: '100%' }}>
      <div style={{ marginBottom: 20 }}>
        <div className="sb-display-vt" style={{ fontSize: 26 }}>Mode Toggle · Animation mid-flight</div>
        <div className="sb-mono" style={{ fontSize: 13, marginTop: 6 }}>
          // top two boards are LIVE — click the inactive half to play the real animation.<br/>
          // hammer-strike model: sparks spawn at the destination half and spray outward<br/>
          // in a ~200° fan biased upward and toward the destination side. ~14 sparks,<br/>
          // 380–580ms each, staggered. Frame also recolours to the new mode.
        </div>
      </div>

      <NoteLabel>· Switch to GAME · click GAME · hammer-strike, sparks spray outward (gold)</NoteLabel>
      <div style={{ border: '1px solid var(--border-soft)', background: 'var(--night)', marginTop: 8, marginBottom: 28 }}>
        <BoardTopBarV3 breadcrumb="· The Tavern · Board 1" mode={m1} onMode={setM1} forceMotion />
        <div style={{ height: 60, background: 'var(--surface)' }} />
      </div>

      <NoteLabel>· Switch to SETUP · click SETUP · hammer-strike, sparks spray outward (teal)</NoteLabel>
      <div style={{ border: '1px solid var(--border-soft)', background: 'var(--night)', marginTop: 8, marginBottom: 28 }}>
        <BoardTopBarV3 breadcrumb="· The Tavern · Board 1" mode={m2} onMode={setM2} forceMotion />
        <div style={{ height: 60, background: 'var(--surface)' }} />
      </div>

      <NoteLabel>· Frame sequence · same flight at 15% / 50% / 85% progress (static reference)</NoteLabel>
      <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
        {[0.15, 0.5, 0.85].map(p => (
          <div key={p} style={{ background: 'var(--deep)', padding: 16, border: '1px solid var(--border-soft)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <FrozenModeToggle mode="setup" direction="to-game" progress={p} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-mute)' }}>t = {Math.round(p*100)}%</span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 28, padding: 16, background: 'var(--raised)', border: '1px solid var(--border-soft)' }}>
        <NoteLabel color="var(--gold)">SPARK MECHANICS · HAMMER-STRIKE MODEL</NoteLabel>
        <MonoNote>
          ▸ metaphor: clicking a half is a hammer-blow on hot iron — sparks fly outward from the impact, not across<br/>
          ▸ each spark = 3×3px absolutely positioned div, colour = destination mode token, drop-shadow uses --mode-*-glow<br/>
          ▸ origin: centre of the destination half (the strike point)<br/>
          ▸ trajectory: radial outward, 50–140 px, ~200° fan biased upward and toward the destination side<br/>
          ▸ stagger: 0–70 ms, duration 380–580 ms (faster centre, longer-arc edges trail)<br/>
          ▸ sparks live in a SIBLING `.sb-mode-toggle-sparks` layer (clip-path on the toggle doesn't eat them; §8.8 honoured)<br/>
          ▸ in parallel: the toggle's `--pix-border` and the destination half's text colour both ignite — frame carries the hue too
        </MonoNote>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// ARTBOARD 3 · REDUCED-MOTION VARIANT
// ═════════════════════════════════════════════════════════════════
function ModeToggleReducedArtboard() {
  const [mode, setMode] = React.useState('setup');
  return (
    <div className="sb" style={{ padding: 28, overflow: 'auto', height: '100%' }}>
      <div style={{ marginBottom: 20 }}>
        <div className="sb-display-vt" style={{ fontSize: 26 }}>Mode Toggle · Reduced motion</div>
        <div className="sb-mono" style={{ fontSize: 13, marginTop: 6 }}>
          // honors `prefers-reduced-motion: reduce`. No flying particles.<br/>
          // Replacement cue: a 220ms drop-shadow flash on the destination half —<br/>
          // unambiguous state change, zero translation.
        </div>
      </div>

      <NoteLabel>· LIVE · forced reduced-motion variant (try clicking)</NoteLabel>
      <div style={{ border: '1px solid var(--border-soft)', background: 'var(--night)', marginTop: 8, marginBottom: 28 }}>
        <BoardTopBarV3 breadcrumb="· The Tavern · Board 1" mode={mode} onMode={setMode} reduced />
        <div style={{ height: 60, background: 'var(--surface)' }} />
      </div>

      <NoteLabel>· Side-by-side · with sparks vs. flash-only</NoteLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginTop: 12 }}>
        <ReducedCompareCol kind="full" />
        <ReducedCompareCol kind="reduced" />
      </div>

      <div style={{ marginTop: 28, padding: 16, background: 'var(--raised)', border: '1px solid var(--border-soft)' }}>
        <NoteLabel color="var(--gold)">DESIGN RATIONALE</NoteLabel>
        <MonoNote>
          ▸ flash variant is 220ms (≈ half the spark duration) — quick enough to feel responsive, slow enough to register<br/>
          ▸ same color tokens as the full variant — so the user still gets the chromatic information<br/>
          ▸ uses `filter: drop-shadow` (token-faithful: same vehicle as --glow-gold)<br/>
          ▸ keyframe peaks at 40% so the flash front-loads — feels like a quick "ignite", not a slow fade
        </MonoNote>
      </div>
    </div>
  );
}

function ReducedCompareCol({ kind }) {
  const [mode, setMode] = React.useState('setup');
  return (
    <div style={{ background: 'var(--deep)', padding: 16, border: '1px solid var(--border-soft)' }}>
      <NoteLabel color={kind === 'full' ? 'var(--gold)' : 'var(--mode-setup)'}>
        {kind === 'full' ? '· FULL · spark animation' : '· REDUCED · flash only'}
      </NoteLabel>
      <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
        <ModeToggle mode={mode} onChange={setMode} reduced={kind === 'reduced'} forceMotion={kind === 'full'} />
      </div>
      <MonoNote>
        {kind === 'full'
          ? '~10 sparks, 320–460ms, color = destination'
          : 'no movement · 220ms drop-shadow flash on the destination half'}
      </MonoNote>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// ARTBOARD 4 · LIVE PLAYGROUND
// ═════════════════════════════════════════════════════════════════
function ModeTogglePlaygroundArtboard() {
  const [mode, setMode] = React.useState('setup');
  const [reduced, setReduced] = React.useState(false);
  const [compact, setCompact] = React.useState(false);

  // Twelve demo pads with named types + labels so the mode change has
  // something concrete to act on. In GAME mode, one pad runs hot to
  // illustrate the "live" state.
  const PADS = [
    { type: 'loop',     title: 'Tavern hum',  icon: 'loop',   hotkey: 'Q' },
    { type: 'single',   title: 'Door slam',   icon: 'play',   hotkey: 'W' },
    { type: 'playlist', title: 'Battle set',  icon: 'scroll', hotkey: 'E' },
    { type: 'single',   title: 'Coin drop',   icon: 'play',   hotkey: 'R' },
    { type: 'loop',     title: 'Wind low',    icon: 'loop',   hotkey: 'T' },
    { type: 'combo',    title: 'Reveal',      icon: 'rune',   hotkey: 'Y' },
    { type: 'loop',     title: 'Rain heavy',  icon: 'loop',   hotkey: 'A', hot: true },
    { type: 'single',   title: 'Bell',        icon: 'play',   hotkey: 'S' },
    { type: 'playlist', title: 'Forest mix',  icon: 'scroll', hotkey: 'D' },
    { type: 'single',   title: 'Wolf howl',   icon: 'play',   hotkey: 'F' },
    { type: 'combo',    title: 'Boss intro',  icon: 'rune',   hotkey: 'G' },
    { type: 'loop',     title: 'Crowd low',   icon: 'loop',   hotkey: 'H' },
  ];
  const TYPE_COLOR = {
    loop:     'var(--pad-loop)',
    single:   'var(--pad-single)',
    playlist: 'var(--pad-playlist)',
    combo:    'var(--pad-combo)',
  };
  const TYPE_GLOW = {
    loop:     'var(--pad-loop-glow)',
    single:   'var(--pad-single-glow)',
    playlist: 'var(--pad-playlist-glow)',
    combo:    'var(--pad-combo-glow)',
  };

  const isSetup = mode === 'setup';
  const boardBg = isSetup
    ? `linear-gradient(var(--mode-setup-soft), var(--mode-setup-soft)), var(--night)`
    : `radial-gradient(80% 60% at 50% 120%, var(--mode-game-soft), transparent 60%), var(--night)`;

  return (
    <div className="sb" style={{ padding: 28, overflow: 'auto', height: '100%' }}>
      <div style={{ marginBottom: 20 }}>
        <div className="sb-display-vt" style={{ fontSize: 26 }}>Mode Toggle · Live playground</div>
        <div className="sb-mono" style={{ fontSize: 13, marginTop: 6 }}>
          // click either half to flip — pads, canvas tint and chrome all follow the mode.<br/>
          // SETUP: grid background, dashed pad borders, drag handles. GAME: hearth glow, hotkey caps, one pad runs hot.
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
        <OptBtn on={!reduced} onClick={() => setReduced(false)}>FULL · sparks</OptBtn>
        <OptBtn on={reduced}  onClick={() => setReduced(true)}>REDUCED · flash</OptBtn>
        <div style={{ flex: 1 }} />
        <OptBtn on={!compact} onClick={() => setCompact(false)}>DESKTOP</OptBtn>
        <OptBtn on={compact}  onClick={() => setCompact(true)}>MOBILE</OptBtn>
      </div>

      <div style={{ border: '1px solid var(--border-soft)', background: 'var(--night)' }}>
        <BoardTopBarV3 breadcrumb="· The Tavern · Board 1" mode={mode} onMode={setMode} compact={compact} reduced={reduced} forceMotion={!reduced} />
        <div
          className={isSetup ? 'sb-grid-bg' : ''}
          style={{
            padding: 28,
            display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 12,
            background: boardBg,
            transition: 'background 280ms ease',
          }}
        >
          {PADS.map((p, i) => {
            const showHot = !isSetup && p.hot;
            return (
              <div
                key={i}
                className={'sb-pad' + (isSetup ? ' is-setup' : '') + (showHot ? ' is-hot' : '')}
                style={{
                  minHeight: 78,
                  ['--pad-color']: TYPE_COLOR[p.type],
                  ['--pad-glow']:  TYPE_GLOW[p.type],
                }}
              >
                {/* GAME mode: hotkey cap top-right */}
                {!isSetup && <span className="sb-pad-key">{p.hotkey}</span>}
                {/* SETUP mode: drag-handle dots top-left */}
                {isSetup && (
                  <span style={{
                    position: 'absolute', top: 6, left: 6,
                    color: 'var(--mode-setup)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <svg width="9" height="11" viewBox="0 0 9 11" fill="currentColor">
                      <circle cx="2" cy="2" r="1.1"/><circle cx="7" cy="2" r="1.1"/>
                      <circle cx="2" cy="5.5" r="1.1"/><circle cx="7" cy="5.5" r="1.1"/>
                      <circle cx="2" cy="9" r="1.1"/><circle cx="7" cy="9" r="1.1"/>
                    </svg>
                  </span>
                )}
                <div style={{ paddingLeft: 8, color: TYPE_COLOR[p.type], fontSize: 11, letterSpacing: '.08em', fontFamily: 'var(--font-ui)', textTransform: 'uppercase' }}>
                  {p.type}
                </div>
                <div className="sb-pad-title" style={{ paddingLeft: 8 }}>{p.title}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ marginTop: 18, padding: 14, background: 'var(--raised)', border: '1px solid var(--border-soft)' }}>
        <NoteLabel color="var(--gold)">CURRENT STATE</NoteLabel>
        <MonoNote>
          mode = <span style={{ color: mode === 'game' ? 'var(--gold-bright)' : 'var(--mode-setup)' }}>{mode.toUpperCase()}</span>{' · '}
          board = {isSetup ? 'grid visible, pads draggable (dashed border + handle), no hotkeys' : 'hearth glow, hotkeys shown, RAIN HEAVY running hot'}{' · '}
          motion = {reduced ? 'reduced (flash)' : 'full (sparks)'}{' · '}
          size = {compact ? 'compact (mobile, 8 sparks)' : 'desktop (14 sparks)'}
        </MonoNote>
      </div>
    </div>
  );
}

function OptBtn({ on, onClick, children }) {
  return (
    <button onClick={onClick} className={'sb-pix sb-btn ' + (on ? 'sb-btn-primary' : 'sb-btn-ghost')}
      style={{ cursor: 'pointer' }}>
      {children}
    </button>
  );
}

// ═════════════════════════════════════════════════════════════════
// ARTBOARD 5 · NOTES — §6 entry, class inventory, token rationale
// ═════════════════════════════════════════════════════════════════
function ModeToggleNotesArtboard() {
  return (
    <div className="sb" style={{ padding: 24, overflow: 'auto', height: '100%' }}>
      <div className="sb-display-vt" style={{ fontSize: 22 }}>Notes & inventory</div>
      <div className="sb-mono" style={{ fontSize: 12, marginTop: 6, color: 'var(--text-dim)' }}>
        // copy these into DESIGN_SYSTEM.md in the same commit that introduces v24
      </div>

      <div style={{ height: 18 }} />

      <NoteLabel color="var(--gold)">§6 · INVENTORY ROW (CHROME)</NoteLabel>
      <pre style={{
        marginTop: 8, padding: 12, background: 'var(--sunk)', color: 'var(--text)',
        fontFamily: 'var(--font-mono)', fontSize: 12, lineHeight: 1.5,
        whiteSpace: 'pre-wrap', border: '1px solid var(--border-soft)',
      }}>{`| \`sb-mode-toggle\`    | Interactive screen header · SETUP⇄GAME, Board only | tokens.css       |`}</pre>

      <div style={{ height: 18 }} />

      <NoteLabel color="var(--gold)">CLASS INVENTORY</NoteLabel>
      <ClassTable />

      <div style={{ height: 18 }} />

      <NoteLabel color="var(--gold)">STATE VOCABULARY (§3 · NO CHANGES)</NoteLabel>
      <MonoNote>
        ▸ <code>is-setup</code> · already in §3 (used on sb-pad, sb-mode-badge) — applies to sb-mode-toggle as-is<br/>
        ▸ <code>is-game</code> · already in §3 (used on sb-mode-badge) — sb-mode-toggle is the second consumer<br/>
        → recommend updating the §3 "Used on" column to list <code>sb-mode-toggle</code> alongside <code>sb-mode-badge</code><br/>
        ▸ <code>is-compact</code> · new modifier, scoped to this block only — does not enter §3 (compact is not transient state, it's a sizing flag — same shape as <code>sb-btn-sm</code>)
      </MonoNote>

      <div style={{ height: 18 }} />

      <NoteLabel color="var(--gold)">TOKENS · TWO NEW (COMMITTED IN THIS CHANGE)</NoteLabel>
      <MonoNote>
        ▸ active SETUP half · <code>var(--mode-setup)</code> · text-shadow <code>var(--mode-setup-glow)</code><br/>
        ▸ active GAME half  · <code>var(--gold-bright)</code> · text-shadow <code>var(--mode-game-glow)</code><br/>
        ▸ inactive half     · <code>var(--text-mute)</code><br/>
        ▸ separator         · <code>var(--border)</code><br/>
        ▸ frame             · sb-pix · <code>--pix-bg: var(--sunk)</code> · <code>--pix-border: var(--border)</code><br/>
        ▸ spark · GAME      · background <code>var(--gold-bright)</code> · drop-shadow <code>var(--mode-game-glow)</code><br/>
        ▸ spark · SETUP     · background <code>var(--mode-setup)</code> · drop-shadow <code>var(--mode-setup-glow)</code><br/>
        <br/>
        <strong>New tokens added to tokens.css §MODE in the same commit:</strong><br/>
        ▸ <code>--mode-setup-glow: rgba(141, 213, 216, 0.55)</code><br/>
        ▸ <code>--mode-game-glow:  rgba(245, 213, 122, 0.55)</code><br/>
        <br/>
        Rationale: pad-type tokens have the <code>-soft</code> + <code>-glow</code> alpha pair already
        (e.g. <code>--pad-loop-soft</code> + <code>--pad-loop-glow</code>); mode-tokens only had <code>-soft</code>.
        Closes the symmetry gap. Glow values mirror <code>--pad-loop-glow</code> / <code>--pad-single-glow</code>
        intentionally — SETUP shares the loop hue family, GAME shares the single hue family.<br/>
        DESIGN_SYSTEM.md §A Mode row updated to list both alpha tiers.
      </MonoNote>

      <div style={{ height: 18 }} />

      <NoteLabel color="var(--gold)">SCOPE & POSITION (RECAP)</NoteLabel>
      <MonoNote>
        ▸ Board screen only. Library / Settings / Tips &amp; About keep static headlines<br/>
        ▸ Lives in TITLE SLOT of the board's TopBar (new variant <code>BoardTopBarV3</code> with 3-column grid: <code>1fr auto 1fr</code>)<br/>
        ▸ Size: <code>--fs-pixel-sm</code> (22px VT323) — 6px bigger than the static 16px titles, justifying its "interactive headline" claim<br/>
        ▸ Mobile: <code>is-compact</code> drops to <code>--fs-md</code> (16px), spark count from 10 → 6, choreography unchanged
      </MonoNote>

      <div style={{ height: 18 }} />

      <NoteLabel color="var(--gold)">DEPRECATION · sb-mode-badge</NoteLabel>
      <MonoNote>
        the existing <code>sb-mode-badge</code> is still useful for COMPACT contexts (status bar, condensed top bars in <code>v11-mobile.jsx</code>).<br/>
        sb-mode-toggle is its INTERACTIVE-HEADER form. they coexist:<br/>
        ▸ <code>sb-mode-badge</code> · small, indicator-style, may be tappable but reads as a chip<br/>
        ▸ <code>sb-mode-toggle</code> · large, screen-header-class, primary mode-switch UI on the Board
      </MonoNote>
    </div>
  );
}

function ClassTable() {
  const rows = [
    { cls: 'sb-mode-toggle',        kind: 'block',       role: 'pixel-frame container · two halves + separator' },
    { cls: 'sb-mode-toggle.is-setup',     kind: 'state', role: 'SETUP half is active (teal)' },
    { cls: 'sb-mode-toggle.is-game',      kind: 'state', role: 'GAME half is active (gold)' },
    { cls: 'sb-mode-toggle.is-compact',   kind: 'mod',   role: 'mobile sizing · smaller font, smaller padding' },
    { cls: 'sb-mode-toggle.is-reduced',   kind: 'mod',   role: 'force flash variant (artboard demo · prefers-reduced-motion handles this automatically in real use)' },
    { cls: 'sb-mode-toggle-half',         kind: 'part',  role: 'one side · button element with data-side="setup|game"' },
    { cls: 'sb-mode-toggle-sep',          kind: 'part',  role: 'vertical 1px rule between halves' },
    { cls: 'sb-mode-toggle-spark',        kind: 'part',  role: 'transient 3×3px pixel-spark sprite, lives in a sibling .sb-mode-toggle-sparks layer' },
  ];
  return (
    <div style={{ marginTop: 8, border: '1px solid var(--border-soft)' }}>
      {rows.map((r, i) => (
        <div key={r.cls} style={{
          display: 'grid', gridTemplateColumns: '200px 60px 1fr',
          padding: '6px 10px',
          borderBottom: i < rows.length - 1 ? '1px solid var(--border-soft)' : 'none',
          fontFamily: 'var(--font-mono)', fontSize: 12,
          background: i % 2 === 0 ? 'var(--sunk)' : 'transparent',
        }}>
          <code style={{ color: 'var(--gold)' }}>{r.cls}</code>
          <span style={{ color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '.1em', fontSize: 11 }}>{r.kind}</span>
          <span style={{ color: 'var(--text-dim)' }}>{r.role}</span>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Exports
// ─────────────────────────────────────────────────────────────────
Object.assign(window, {
  ModeToggle, FrozenModeToggle, BoardTopBarV3, BoardTopBarV3Frozen, OptBtn,
  ModeToggleIdleArtboard, ModeToggleFlightArtboard, ModeToggleReducedArtboard,
  ModeTogglePlaygroundArtboard, ModeToggleNotesArtboard,
});
