// v25-mode-awareness.jsx — Ambient mode-awareness cues for the Board.
//
// Four optional cues, each independently toggleable in Settings → Display →
// Mode awareness. Goal: peripheral mode awareness during long GM sessions.
// The GM looks at the pads, not the toggle — these cues land in the
// peripheral vision so "which mode am I in?" is answered without ever
// looking up.
//
// Cues (all keyed off the current mode color: --mode-setup / --gold):
//   1 · EDGE TINT       — inner outline on the workspace, width tunable 1–4px
//   2 · STATUS CHIP     — prominent coloured chip in the status-bar left slot
//   3 · ATMOSPHERE      — SETUP: grid bg · GAME: hearth glow + ambient embers
//   4 · SPINE SATURATION — pad's left-edge type-spine dims in SETUP, full
//                          saturation in GAME (so the grid looks "ready to
//                          fire" in GAME vs "configurable" in SETUP)
//
// Two artboards:
//   A · Live ambient-cues playground (interactive)
//   B · Settings mock (Settings → Display → Mode awareness)

// ─────────────────────────────────────────────────────────────────
// One-time styles. All new visual cues route through CSS custom
// properties on the board mock's outer container, so toggling
// happens by changing a single class or var rather than reshuffling
// the DOM.
// ─────────────────────────────────────────────────────────────────
const MODE_AWARENESS_CSS = `
/* Edge-tint cue — implemented as an inset box-shadow on the workspace
   container. Width controlled by --mode-edge-width (px). Color follows
   the active mode via --mode-edge-color. */
.sb-mode-aware {
  position: relative;
  --mode-edge-width: 0px;
  --mode-edge-color: transparent;
  --mode-tint: transparent;          /* faint corner vignette */
}
.sb-mode-aware.has-edge {
  box-shadow: inset 0 0 0 var(--mode-edge-width) var(--mode-edge-color);
}

/* Spine-saturation cue — when active in SETUP, dim every pad's
   left-edge spine to 45% opacity. Active in GAME (or whenever cue
   is off), spines render at the default .85. Targets the existing
   sb-pad::before spine, no markup change. */
.sb-mode-aware.has-spine-dim .sb-pad::before { opacity: .45 !important; }

/* Hearth glow — only in GAME atmosphere. Soft warm radial at the
   bottom edge of the canvas. Intensity via --mode-hearth-intensity
   (0–1). Sits at z-index 0 above the grid bg but below the pads. */
.sb-mode-aware-hearth {
  position: absolute;
  inset: auto 0 0 0;
  height: 55%;
  pointer-events: none;
  background:
    radial-gradient(70% 100% at 50% 100%,
      rgba(232, 130, 30, calc(.22 * var(--mode-hearth-intensity, .6))) 0%,
      transparent 70%);
  z-index: 0;
}

/* Mini ember field for the GAME atmosphere — adapted from
   v8-atmosphere.jsx AmbientEmbers but inlined and scoped so the
   playground does not depend on v8 internals. */
.sb-mode-aware-ember {
  position: absolute;
  width: 2px; height: 2px;
  background: var(--flame);
  opacity: .6;
  animation: sb-mode-aware-ember linear infinite;
  pointer-events: none;
  z-index: 0;
}
@keyframes sb-mode-aware-ember {
  0%   { transform: translateY(0)    translateX(0); opacity: 0; }
  15%  { opacity: var(--ember-peak, .8); }
  85%  { opacity: var(--ember-fade, .35); }
  100% { transform: translateY(-100%) translateX(var(--drift, 0)); opacity: 0; }
}

/* Bold status-chip cue — a full-fill mode badge much larger than the
   default sb-mode-badge. Lives at the left of the status bar.        */
.sb-mode-aware-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-ui);
  font-size: 13px;
  letter-spacing: .14em;
  text-transform: uppercase;
  padding: 3px 12px;
  --pix-step: 3px;
  background: var(--mode-chip-bg);
  color: var(--mode-chip-fg);
}
.sb-mode-aware-chip.is-setup {
  --mode-chip-bg: var(--mode-setup);
  --mode-chip-fg: var(--text-on-gold);
}
.sb-mode-aware-chip.is-game {
  --mode-chip-bg: var(--gold);
  --mode-chip-fg: var(--text-on-gold);
}
.sb-mode-aware-chip .sb-mode-aware-chip-dot {
  width: 6px; height: 6px;
  background: currentColor;
  box-shadow: 0 0 6px currentColor;
}
`;

if (typeof document !== 'undefined' && !document.getElementById('sb-mode-awareness-css')) {
  const s = document.createElement('style');
  s.id = 'sb-mode-awareness-css';
  s.textContent = MODE_AWARENESS_CSS;
  document.head.appendChild(s);
}

// ─────────────────────────────────────────────────────────────────
// Cue defaults — what Settings remembers per user.
// ─────────────────────────────────────────────────────────────────
const CUE_DEFAULTS = {
  edge:       true,
  edgeWidth:  2,
  statusChip: true,
  atmosphere: true,
  hearthIntensity: 0.6,
  spine:      true,
};

// ─────────────────────────────────────────────────────────────────
// Mini ember field — small scoped pixel-particle layer for the GAME
// atmosphere. ~12 sprites, deterministic seeded positions.
// ─────────────────────────────────────────────────────────────────
function MiniEmbers({ count = 12 }) {
  const sprites = React.useMemo(() => Array.from({ length: count }).map((_, i) => {
    const seed = i * 73.13 + 9.7;
    return {
      left:    (seed * 1.7) % 100,
      delay:   -((seed * 0.31) % 14),
      dur:     10 + (seed % 12),
      drift:   ((seed * 0.7) % 40) - 20,
      opacity: 0.4 + ((seed * 0.13) % 0.4),
    };
  }), [count]);
  return (
    <>
      {sprites.map((p, i) => (
        <span key={i} className="sb-mode-aware-ember" style={{
          left:  `${p.left}%`,
          bottom: -6,
          opacity: p.opacity,
          animationDuration: `${p.dur}s`,
          animationDelay: `${p.delay}s`,
          ['--drift']: `${p.drift}px`,
        }} />
      ))}
    </>
  );
}

// ─────────────────────────────────────────────────────────────────
// Demo pads — same shape used by the toggle's live playground but
// extracted for reuse here.
// ─────────────────────────────────────────────────────────────────
const DEMO_PADS = [
  { type: 'loop',     title: 'Tavern hum',  hotkey: 'Q' },
  { type: 'single',   title: 'Door slam',   hotkey: 'W' },
  { type: 'playlist', title: 'Battle set',  hotkey: 'E' },
  { type: 'single',   title: 'Coin drop',   hotkey: 'R' },
  { type: 'loop',     title: 'Wind low',    hotkey: 'T' },
  { type: 'combo',    title: 'Reveal',      hotkey: 'Y' },
  { type: 'loop',     title: 'Rain heavy',  hotkey: 'A', hot: true },
  { type: 'single',   title: 'Bell',        hotkey: 'S' },
  { type: 'playlist', title: 'Forest mix',  hotkey: 'D' },
  { type: 'single',   title: 'Wolf howl',   hotkey: 'F' },
  { type: 'combo',    title: 'Boss intro',  hotkey: 'G' },
  { type: 'loop',     title: 'Crowd low',   hotkey: 'H' },
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

// ─────────────────────────────────────────────────────────────────
// <ModeAwareBoardMock> — a board frame with all four cues wired up
// to the cues object. The single integration point that the artboards
// and the settings preview share.
// ─────────────────────────────────────────────────────────────────
function ModeAwareBoardMock({ mode, setMode, cues, compact = false, height = 460 }) {
  const isSetup = mode === 'setup';
  const modeColor = isSetup ? 'var(--mode-setup)' : 'var(--gold)';

  // Outer container styles driven by cue toggles
  const wrapClass = [
    'sb-mode-aware',
    cues.edge       ? 'has-edge'     : '',
    cues.spine && isSetup ? 'has-spine-dim' : '',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={wrapClass}
      style={{
        position: 'relative',
        border: '1px solid var(--border-soft)',
        background: 'var(--night)',
        ['--mode-edge-width']: `${cues.edge ? cues.edgeWidth : 0}px`,
        ['--mode-edge-color']: modeColor,
        ['--mode-hearth-intensity']: cues.atmosphere ? cues.hearthIntensity : 0,
        transition: 'box-shadow 280ms ease',
      }}
    >
      <BoardTopBarV3
        breadcrumb="· The Tavern · Board 1"
        mode={mode}
        onMode={setMode}
        compact={compact}
        forceMotion
      />

      {/* Canvas area */}
      <div
        className={cues.atmosphere && isSetup ? 'sb-grid-bg' : ''}
        style={{
          position: 'relative',
          padding: 20,
          display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10,
          minHeight: height,
          background: cues.atmosphere && !isSetup
            ? `linear-gradient(var(--mode-game-soft), var(--mode-game-soft)), var(--night)`
            : cues.atmosphere && isSetup
              ? `linear-gradient(var(--mode-setup-soft), var(--mode-setup-soft)), var(--night)`
              : 'var(--night)',
          transition: 'background 280ms ease',
        }}
      >
        {/* GAME atmosphere overlays — hearth glow + embers */}
        {cues.atmosphere && !isSetup && (
          <>
            <div className="sb-mode-aware-hearth" />
            <MiniEmbers count={14} />
          </>
        )}

        {DEMO_PADS.map((p, i) => {
          const hot = !isSetup && p.hot;
          return (
            <div
              key={i}
              className={'sb-pad' + (isSetup ? ' is-setup' : '') + (hot ? ' is-hot' : '')}
              style={{
                position: 'relative',
                zIndex: 1,
                minHeight: 70,
                ['--pad-color']: TYPE_COLOR[p.type],
                ['--pad-glow']:  TYPE_GLOW[p.type],
              }}
            >
              {!isSetup && <span className="sb-pad-key">{p.hotkey}</span>}
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
              <div style={{ paddingLeft: 8, color: TYPE_COLOR[p.type], fontSize: 10, letterSpacing: '.08em', fontFamily: 'var(--font-ui)', textTransform: 'uppercase' }}>
                {p.type}
              </div>
              <div className="sb-pad-title" style={{ paddingLeft: 8, fontSize: 13 }}>{p.title}</div>
            </div>
          );
        })}
      </div>

      {/* Status bar with optional bold status-chip cue */}
      <div className="sb-status-bar" style={{ height: 28, paddingLeft: 10, paddingRight: 10 }}>
        {cues.statusChip ? (
          <span className={'sb-pix sb-mode-aware-chip ' + (isSetup ? 'is-setup' : 'is-game')}>
            <span className="sb-mode-aware-chip-dot" />
            {isSetup ? 'EDIT MODE' : 'LIVE MODE'}
          </span>
        ) : (
          <span className="sb-status-section" style={{ color: modeColor }}>
            {isSetup ? 'EDIT' : 'LIVE'}
          </span>
        )}
        <span className="sb-status-section">The Tavern · Board 1</span>
        <span className="sb-status-section">12 pads · {isSetup ? 'idle' : '1 playing'}</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Small atomic UI for the playground's toggles. Same visual idiom
// as `<ToggleRow>` in v17 but cheap and inline.
// ─────────────────────────────────────────────────────────────────
function CueRow({ label, desc, on, onToggle, control }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr auto',
      gap: 16,
      alignItems: 'center',
      padding: '10px 14px',
      borderBottom: '1px solid var(--border-soft)',
    }}>
      <div>
        <div style={{
          fontFamily: 'var(--font-ui)', fontSize: 14, color: 'var(--text)',
          letterSpacing: '.08em', textTransform: 'uppercase',
        }}>{label}</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', marginTop: 2, lineHeight: 1.4 }}>
          {desc}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {control}
        <div className={'sb-toggle' + (on ? ' is-on' : '')} onClick={onToggle} style={{ cursor: 'pointer' }} />
      </div>
    </div>
  );
}

function PxSlider({ value, onChange, min, max, step = 1, color = 'var(--gold)', width = 110 }) {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div
        className="sb-slider"
        style={{ width, height: 6, position: 'relative', cursor: 'pointer' }}
        onMouseDown={(e) => {
          const trackEl = e.currentTarget;
          const rect = trackEl.getBoundingClientRect();
          const apply = (clientX) => {
            const t = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
            const raw = min + t * (max - min);
            const snapped = Math.round(raw / step) * step;
            onChange(Math.max(min, Math.min(max, snapped)));
          };
          apply(e.clientX);
          const move = (ev) => apply(ev.clientX);
          const up = () => {
            window.removeEventListener('mousemove', move);
            window.removeEventListener('mouseup', up);
          };
          window.addEventListener('mousemove', move);
          window.addEventListener('mouseup', up);
        }}
      >
        <div className="sb-slider-fill" style={{ width: `${pct}%`, background: color }} />
        <div className="sb-slider-thumb" style={{ left: `${pct}%`, background: color, boxShadow: `0 0 6px ${color}` }} />
      </div>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', minWidth: 32, textAlign: 'right' }}>
        {step < 1 ? value.toFixed(1) : value + 'px'}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// <ModeAwareBoardMockMini> — compact variant of the full mock for
// side-by-side comparison. Same cue plumbing, smaller demo grid (6
// pads in 3 cols), no breadcrumb, fixed mode (no click handler).
// ─────────────────────────────────────────────────────────────────
function ModeAwareBoardMockMini({ mode, cues, height = 220 }) {
  const isSetup = mode === 'setup';
  const modeColor = isSetup ? 'var(--mode-setup)' : 'var(--gold)';
  const wrapClass = [
    'sb-mode-aware',
    cues.edge ? 'has-edge' : '',
    cues.spine && isSetup ? 'has-spine-dim' : '',
  ].filter(Boolean).join(' ');

  const MINI_PADS = DEMO_PADS.slice(0, 6);

  return (
    <div
      className={wrapClass}
      style={{
        position: 'relative',
        border: '1px solid var(--border-soft)',
        background: 'var(--night)',
        ['--mode-edge-width']: `${cues.edge ? cues.edgeWidth : 0}px`,
        ['--mode-edge-color']: modeColor,
        ['--mode-hearth-intensity']: cues.atmosphere ? cues.hearthIntensity : 0,
      }}
    >
      {/* mini TopBar with the toggle in the middle */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr auto 1fr', alignItems: 'center',
        gap: 8, padding: '6px 10px',
        background: 'var(--deep)', borderBottom: '1px solid var(--border)',
        minHeight: 36,
      }}>
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--gold)', letterSpacing: '.08em' }}>MENU</span>
        <ModeToggle mode={mode} onChange={() => {}} compact forceMotion />
        <span />
      </div>

      <div
        className={cues.atmosphere && isSetup ? 'sb-grid-bg' : ''}
        style={{
          position: 'relative',
          padding: 10,
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6,
          minHeight: height,
          background: cues.atmosphere && !isSetup
            ? `linear-gradient(var(--mode-game-soft), var(--mode-game-soft)), var(--night)`
            : cues.atmosphere && isSetup
              ? `linear-gradient(var(--mode-setup-soft), var(--mode-setup-soft)), var(--night)`
              : 'var(--night)',
        }}
      >
        {cues.atmosphere && !isSetup && (
          <>
            <div className="sb-mode-aware-hearth" />
            <MiniEmbers count={8} />
          </>
        )}
        {MINI_PADS.map((p, i) => {
          const hot = !isSetup && p.hot;
          return (
            <div key={i}
              className={'sb-pad' + (isSetup ? ' is-setup' : '') + (hot ? ' is-hot' : '')}
              style={{
                position: 'relative', zIndex: 1, minHeight: 56,
                ['--pad-color']: TYPE_COLOR[p.type],
                ['--pad-glow']:  TYPE_GLOW[p.type],
              }}
            >
              {!isSetup && <span className="sb-pad-key" style={{ fontSize: 9, padding: '0 4px' }}>{p.hotkey}</span>}
              <div style={{ paddingLeft: 6, color: TYPE_COLOR[p.type], fontSize: 9, letterSpacing: '.06em', fontFamily: 'var(--font-ui)', textTransform: 'uppercase' }}>
                {p.type}
              </div>
              <div className="sb-pad-title" style={{ paddingLeft: 6, fontSize: 11 }}>{p.title}</div>
            </div>
          );
        })}
      </div>

      <div className="sb-status-bar" style={{ height: 22, paddingLeft: 8, paddingRight: 8, fontSize: 10 }}>
        {cues.statusChip ? (
          <span className={'sb-pix sb-mode-aware-chip ' + (isSetup ? 'is-setup' : 'is-game')}
            style={{ fontSize: 10, padding: '1px 8px' }}>
            <span className="sb-mode-aware-chip-dot" />
            {isSetup ? 'EDIT MODE' : 'LIVE MODE'}
          </span>
        ) : (
          <span className="sb-status-section" style={{ color: modeColor }}>
            {isSetup ? 'EDIT' : 'LIVE'}
          </span>
        )}
        <span className="sb-status-section">Board 1</span>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// ARTBOARD A · COMPARE — 4 cues isolated, baseline above.
// Each row: SETUP and GAME mini-boards with ONE cue active. The
// Slice-8 builder picks the loudest single cue from this matrix.
// ═════════════════════════════════════════════════════════════════
function ModeAwarenessCompareArtboard() {
  const OFF = { edge: false, edgeWidth: 2, statusChip: false, atmosphere: false, hearthIntensity: 0.6, spine: false };
  const ROWS = [
    {
      key: 'baseline',
      title: 'Baseline · no extra cues',
      desc: 'What V3 ships today: the v24 toggle (with frame colour + hammer-strike), the existing is-setup pad treatment (dashed border + handle), and the EDIT/LIVE text in the status bar. The honest "is this enough?" reference frame.',
      cues: OFF,
      tone: 'var(--text-mute)',
    },
    {
      key: 'atmosphere',
      title: '1 · Atmosphere',
      desc: 'SETUP: grid background, cool wash. GAME: hearth glow at the bottom + drifting embers. Wires the existing v8 atmosphere work to mode. Highest impact, lowest new-code cost.',
      cues: { ...OFF, atmosphere: true, hearthIntensity: 0.6 },
      tone: 'var(--gold)',
    },
    {
      key: 'chip',
      title: '2 · Status chip',
      desc: 'Bold full-fill mode badge in the status-bar left slot. EDIT MODE / LIVE MODE. Anchors the bottom of the screen with mode colour. Minimal extra UI, but instantly readable.',
      cues: { ...OFF, statusChip: true },
      tone: 'var(--gold)',
    },
    {
      key: 'edge',
      title: '3 · Edge tint',
      desc: 'Inset outline on the workspace in mode colour, 2 px. Pure peripheral cue — the GM never looks at it directly, but the rim of the screen always carries the answer.',
      cues: { ...OFF, edge: true, edgeWidth: 2 },
      tone: 'var(--gold)',
    },
    {
      key: 'spine',
      title: '4 · Spine saturation',
      desc: 'Pad type-spines dim to 45% opacity in SETUP, full saturation in GAME. Caveat: spine already carries pad-TYPE (loop / single / playlist / combo). Risk of two semantics on one pixel-area — debug-confusing.',
      cues: { ...OFF, spine: true },
      tone: 'var(--blood-bright)',
    },
  ];

  return (
    <div className="sb" style={{ padding: 28, overflow: 'auto', height: '100%' }}>
      <div style={{ marginBottom: 16 }}>
        <div className="sb-display-vt" style={{ fontSize: 24 }}>Mode awareness · 4 cues compared in isolation</div>
        <div className="sb-mono" style={{ fontSize: 13, marginTop: 6, lineHeight: 1.6 }}>
          // exploration · slice-8 polish · final selection at build time.<br/>
          // each row activates ONE cue (and nothing else) so you can judge its standalone weight.<br/>
          // baseline at the top = the V3 default (toggle + existing is-setup pad treatment + EDIT/LIVE text).
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr 1fr', gap: 16, alignItems: 'start' }}>
        <div />
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--mode-setup)', letterSpacing: '.14em', textTransform: 'uppercase', textAlign: 'center' }}>SETUP</div>
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--gold)', letterSpacing: '.14em', textTransform: 'uppercase', textAlign: 'center' }}>GAME</div>

        {ROWS.map((r) => (
          <React.Fragment key={r.key}>
            <div>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: 14, color: r.tone, letterSpacing: '.08em', textTransform: 'uppercase' }}>{r.title}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', marginTop: 6, lineHeight: 1.55 }}>{r.desc}</div>
            </div>
            <ModeAwareBoardMockMini mode="setup" cues={r.cues} height={210} />
            <ModeAwareBoardMockMini mode="game"  cues={r.cues} height={210} />
          </React.Fragment>
        ))}
      </div>

      <div style={{ marginTop: 28, padding: 16, background: 'var(--raised)', border: '1px solid var(--border-soft)' }}>
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--gold)', letterSpacing: '.14em', textTransform: 'uppercase' }}>RECOMMENDED EVALUATION ORDER</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.7, marginTop: 8 }}>
          ▸ <strong>1 · Atmosphere</strong> — strongest standalone effect, reuses v8 infrastructure (AmbientEmbers, HearthGlow), already aligned with existing v3 conventions. Start here.<br/>
          ▸ <strong>2 · Status chip</strong> — cheap polish on top, anchors the bottom. Skip only if status bar is going to be redesigned anyway.<br/>
          ▸ <strong>3 · Edge tint</strong> — peripheral reinforcement. Pair with #1 or #2 if you find the mode still feels under-communicated.<br/>
          ▸ <strong>4 · Spine saturation</strong> — last to ship. The pad spine carries TYPE colour already; layering mode dimming risks debug-time confusion ("why is my loop pad pale?"). Only if other three are not enough.
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// ARTBOARD B · SETTINGS MOCK
// Shows how the four cues integrate into the existing Settings →
// Display submenu, using the v5/v17 SettingRow layout with a sticky
// preview on the right.
// ═════════════════════════════════════════════════════════════════
function ModeAwarenessSettingsArtboard() {
  const [mode, setMode] = React.useState('setup');
  const [cues, setCues] = React.useState(CUE_DEFAULTS);
  const set = (k, v) => setCues(c => ({ ...c, [k]: v }));

  return (
    <div className="sb" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <TopBarV2 title="Settings · Display · Mode awareness" icon="cog" breadcrumb="Settings · Display" mode="setup" />

      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>

        {/* LEFT submenu rail — same pattern as v5/v17 settings */}
        <aside style={{ width: 220, background: 'var(--deep)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
          <PanelHeaderV2 icon="cog" title="DISPLAY" active />
          <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {['Theme', 'Atmosphere', 'Pad appearance', 'Mode awareness', 'Animations'].map((label, i) => (
              <div key={label} style={{
                padding: '6px 10px',
                fontFamily: 'var(--font-ui)', fontSize: 13,
                color: label === 'Mode awareness' ? 'var(--gold)' : 'var(--text-dim)',
                letterSpacing: '.08em', textTransform: 'uppercase',
                background: label === 'Mode awareness' ? 'var(--top)' : 'transparent',
                borderLeft: label === 'Mode awareness' ? '2px solid var(--gold)' : '2px solid transparent',
              }}>{label}</div>
            ))}
          </div>
        </aside>

        {/* MAIN settings panel */}
        <main style={{ flex: 1, overflow: 'auto', background: 'var(--surface)' }}>
          <div style={{ padding: '20px 32px 8px' }}>
            <div className="sb-display-vt" style={{ fontSize: 20 }}>Mode awareness</div>
            <div className="sb-mono" style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>
              // peripheral cues that tell you which mode you're in without looking up
            </div>
          </div>

          <div style={{ padding: '12px 32px 8px' }}>
            <SectionLabel glyph="diamond">CUES</SectionLabel>
          </div>

          <SettingRow
            label="Edge tint"
            desc="Inset outline on the workspace in the active mode colour. Always-on, peripheral. Width 1–4px."
            control={
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <PxSlider value={cues.edgeWidth} onChange={v => set('edgeWidth', v)} min={1} max={4} color={mode === 'game' ? 'var(--gold)' : 'var(--mode-setup)'} width={100} />
                <div className={'sb-toggle' + (cues.edge ? ' is-on' : '')} onClick={() => set('edge', !cues.edge)} style={{ cursor: 'pointer' }} />
              </div>
            }
          />
          <SettingRow
            label="Status chip"
            desc="Bold mode badge in the status-bar left slot. EDIT MODE / LIVE MODE."
            control={
              <div className={'sb-toggle' + (cues.statusChip ? ' is-on' : '')} onClick={() => set('statusChip', !cues.statusChip)} style={{ cursor: 'pointer' }} />
            }
          />
          <SettingRow
            label="Atmosphere"
            desc="SETUP shows the layout grid. GAME adds a hearth-glow gradient at the bottom and drifting pixel embers. Intensity controls the GAME glow."
            control={
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <PxSlider value={cues.hearthIntensity} onChange={v => set('hearthIntensity', v)} min={0.2} max={1} step={0.1} color="var(--gold)" width={100} />
                <div className={'sb-toggle' + (cues.atmosphere ? ' is-on' : '')} onClick={() => set('atmosphere', !cues.atmosphere)} style={{ cursor: 'pointer' }} />
              </div>
            }
          />
          <SettingRow
            label="Spine saturation"
            desc="Pad type-spine dims to 45% in SETUP, full saturation in GAME — so the whole grid feels 'configurable' vs 'ready to fire'."
            control={
              <div className={'sb-toggle' + (cues.spine ? ' is-on' : '')} onClick={() => set('spine', !cues.spine)} style={{ cursor: 'pointer' }} />
            }
          />

          <div style={{ padding: '24px 32px 8px' }}>
            <SectionLabel glyph="moon">PREVIEW</SectionLabel>
          </div>
          <SettingRow
            label="Mode for preview"
            desc="Switch the live preview between SETUP and GAME to see the cues in both contexts."
            control={
              <div style={{ display: 'flex', gap: 6 }}>
                <OptBtn on={mode === 'setup'} onClick={() => setMode('setup')}>SETUP</OptBtn>
                <OptBtn on={mode === 'game'}  onClick={() => setMode('game')}>GAME</OptBtn>
              </div>
            }
          />

          <div style={{ height: 24 }} />
        </main>

        {/* RIGHT — sticky live preview, same pattern as v17 */}
        <aside style={{
          background: 'var(--deep)',
          borderLeft: '1px solid var(--border)',
          width: 480,
          padding: 16,
          display: 'flex', flexDirection: 'column',
          position: 'sticky', top: 0, height: '100%',
        }}>
          <PanelHeaderV2 icon="sparkle" title="LIVE PREVIEW" active />
          <div style={{ marginTop: 12 }}>
            <ModeAwareBoardMock mode={mode} setMode={setMode} cues={cues} compact height={360} />
          </div>
          <div style={{ marginTop: 'auto', paddingTop: 16, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.6 }}>
            ▸ all four cues honour theme overrides — verdant/neon/crimson swap colours but not behaviour<br/>
            ▸ disabled cues fall back to the default chrome (1px hairline, plain status text, no atmosphere, full-saturation spines)<br/>
            ▸ values persist per user in project settings
          </div>
        </aside>
      </div>
    </div>
  );
}

Object.assign(window, {
  ModeAwareBoardMock, ModeAwareBoardMockMini, MiniEmbers, CueRow, PxSlider,
  ModeAwarenessCompareArtboard, ModeAwarenessSettingsArtboard,
  CUE_DEFAULTS,
});
