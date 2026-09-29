// v26-pad-shape.jsx — Pad shape · square (default) vs rectangular.
//
// Adds a Settings → Display → Pad appearance shape control. SQUARE is the
// proposed default (1:1, all pads visually equal regardless of grid
// dimensions); RECTANGULAR is the current V3 behaviour (grid-stretched,
// pad height set by --pad-min-height, width by column count).
//
// Implementation route:
//   - new CSS custom property `--pad-aspect` on `.sb-pad`, default `auto`
//   - SQUARE mode sets `--pad-aspect: 1 / 1` and zeros `min-height`
//   - applied via a `has-square-pads` class on the board canvas — no
//     per-pad markup change, fully reversible by toggling the class
//
// Two artboards:
//   A · Side-by-side board mocks · SQUARE vs RECTANGULAR · both modes
//   B · Settings mock · Pad appearance · shape segmented control

const PAD_SHAPE_CSS = `
/* sb-pad-canvas — wrapper for any grid of .sb-pad children. Owns the
   shape-shared custom properties so a single class swap on the canvas
   reshapes every pad inside it. Production usage: wrap the board grid
   in <div class="sb-pad-canvas is-square">…</div> (or without is-square
   for rectangular).
   - --pad-aspect      · CSS aspect-ratio value applied to .sb-pad
   - --pad-min-height  · min-height applied to .sb-pad (must be 0 when
                         aspect-ratio is constrained, else the two fight) */
.sb-pad-canvas {
  --pad-aspect: auto;
  --pad-min-height: 110px;
}
.sb-pad-canvas .sb-pad {
  aspect-ratio: var(--pad-aspect);
  min-height: var(--pad-min-height);
}
.sb-pad-canvas.is-square {
  --pad-aspect: 1 / 1;
  --pad-min-height: 0;
}
`;

if (typeof document !== 'undefined' && !document.getElementById('sb-pad-shape-css')) {
  const s = document.createElement('style');
  s.id = 'sb-pad-shape-css';
  s.textContent = PAD_SHAPE_CSS;
  document.head.appendChild(s);
}

// ─────────────────────────────────────────────────────────────────
// Shared demo pads (re-using v25's vocabulary — kept inline so this
// file is self-contained for handoff)
// ─────────────────────────────────────────────────────────────────
const SHAPE_DEMO_PADS = [
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
const SHAPE_TYPE_COLOR = {
  loop:     'var(--pad-loop)',
  single:   'var(--pad-single)',
  playlist: 'var(--pad-playlist)',
  combo:    'var(--pad-combo)',
};
const SHAPE_TYPE_GLOW = {
  loop:     'var(--pad-loop-glow)',
  single:   'var(--pad-single-glow)',
  playlist: 'var(--pad-playlist-glow)',
  combo:    'var(--pad-combo-glow)',
};

// ─────────────────────────────────────────────────────────────────
// <PadShapeBoardMock> — board mock parameterised by shape + mode.
// ─────────────────────────────────────────────────────────────────
function PadShapeBoardMock({ mode, setMode, shape = 'square', cols = 4, height }) {
  const isSetup = mode === 'setup';
  const pads = SHAPE_DEMO_PADS.slice(0, cols * 3);

  return (
    <div style={{
      border: '1px solid var(--border-soft)',
      background: 'var(--night)',
    }}>
      <BoardTopBarV3 breadcrumb={`· The Tavern · ${cols}×3 grid`} mode={mode} onMode={setMode} forceMotion />

      <div
        className={'sb-pad-canvas' + (shape === 'square' ? ' is-square' : '') + (isSetup ? ' sb-grid-bg' : '')}
        style={{
          padding: 16,
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gap: 10,
          minHeight: height || 'auto',
          background: isSetup
            ? `linear-gradient(var(--mode-setup-soft), var(--mode-setup-soft)), var(--night)`
            : `radial-gradient(80% 60% at 50% 120%, var(--mode-game-soft), transparent 60%), var(--night)`,
        }}
      >
        {pads.map((p, i) => {
          const hot = !isSetup && p.hot;
          return (
            <div
              key={i}
              className={'sb-pad' + (isSetup ? ' is-setup' : '') + (hot ? ' is-hot' : '')}
              style={{
                position: 'relative',
                ['--pad-color']: SHAPE_TYPE_COLOR[p.type],
                ['--pad-glow']:  SHAPE_TYPE_GLOW[p.type],
              }}
            >
              {!isSetup && <span className="sb-pad-key">{p.hotkey}</span>}
              {isSetup && (
                <span style={{
                  position: 'absolute', top: 6, left: 6,
                  color: 'var(--mode-setup)',
                }}>
                  <svg width="9" height="11" viewBox="0 0 9 11" fill="currentColor">
                    <circle cx="2" cy="2" r="1.1"/><circle cx="7" cy="2" r="1.1"/>
                    <circle cx="2" cy="5.5" r="1.1"/><circle cx="7" cy="5.5" r="1.1"/>
                    <circle cx="2" cy="9" r="1.1"/><circle cx="7" cy="9" r="1.1"/>
                  </svg>
                </span>
              )}
              <div style={{ paddingLeft: 8, color: SHAPE_TYPE_COLOR[p.type], fontSize: 10, letterSpacing: '.08em', fontFamily: 'var(--font-ui)', textTransform: 'uppercase' }}>
                {p.type}
              </div>
              <div className="sb-pad-title" style={{ paddingLeft: 8, fontSize: 13 }}>{p.title}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// ARTBOARD A · COMPARISON — square vs rectangular, both modes
// ═════════════════════════════════════════════════════════════════
function PadShapeCompareArtboard() {
  const [mSetup, setMSetup] = React.useState('setup');
  const [mGame, setMGame]   = React.useState('game');
  return (
    <div className="sb" style={{ padding: 28, overflow: 'auto', height: '100%' }}>
      <div style={{ marginBottom: 18 }}>
        <div className="sb-display-vt" style={{ fontSize: 26 }}>Pad shape · square (default) vs rectangular</div>
        <div className="sb-mono" style={{ fontSize: 13, marginTop: 6, lineHeight: 1.6 }}>
          // square (proposed default): every pad is 1:1, board reads as a grid of equal tiles regardless of column count.<br/>
          // rectangular (current V3): pad height fixed at --pad-min-height (110px), width set by the grid. Pads stretch wider as columns shrink.
        </div>
      </div>

      {/* SETUP mode comparison */}
      <div style={{
        fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--mode-setup)',
        letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 8,
      }}>SETUP mode</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <ShapeCell label="SQUARE · 1:1 · all tiles equal">
          <PadShapeBoardMock mode={mSetup} setMode={setMSetup} shape="square" cols={4} />
        </ShapeCell>
        <ShapeCell label="RECTANGULAR · grid-stretched · current V3">
          <PadShapeBoardMock mode={mSetup} setMode={setMSetup} shape="rect" cols={4} />
        </ShapeCell>
      </div>

      {/* GAME mode comparison */}
      <div style={{
        fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--gold)',
        letterSpacing: '.14em', textTransform: 'uppercase', marginTop: 24, marginBottom: 8,
      }}>GAME mode</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <ShapeCell label="SQUARE · 1:1 · all tiles equal">
          <PadShapeBoardMock mode={mGame} setMode={setMGame} shape="square" cols={4} />
        </ShapeCell>
        <ShapeCell label="RECTANGULAR · grid-stretched · current V3">
          <PadShapeBoardMock mode={mGame} setMode={setMGame} shape="rect" cols={4} />
        </ShapeCell>
      </div>

      {/* Grid-density comparison — how shape responds to different column counts */}
      <div style={{
        fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--text-mute)',
        letterSpacing: '.14em', textTransform: 'uppercase', marginTop: 28, marginBottom: 8,
      }}>density behaviour · SQUARE at 3 / 4 / 6 cols</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[3, 4, 6].map(c => (
          <ShapeCell key={c} label={`${c} cols · square`}>
            <PadShapeBoardMock mode="game" setMode={() => {}} shape="square" cols={c} />
          </ShapeCell>
        ))}
      </div>

      <div style={{ marginTop: 28, padding: 16, background: 'var(--raised)', border: '1px solid var(--border-soft)' }}>
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--gold)', letterSpacing: '.14em', textTransform: 'uppercase' }}>WHY SQUARE AS DEFAULT</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.7, marginTop: 8 }}>
          ▸ visual rhythm: a grid of equal squares reads as a single board, regardless of column count<br/>
          ▸ predictability: pad area doesn't shift dramatically when the GM resizes the window<br/>
          ▸ icon-friendly: 1:1 is the natural shape for the pixel icons (rune, scroll, play, etc.) that live in pads<br/>
          ▸ keeps the type-spine prominent — the left edge stays visually proportional<br/>
          <br/>
          RECTANGULAR is kept as an opt-out for users on narrow / tall displays where wider tiles fit more pads in
          the vertical real estate. Also matches the V2 visual you've shipped so far — no forced migration.
        </div>
      </div>
    </div>
  );
}

function ShapeCell({ label, children }) {
  return (
    <div>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-mute)',
        letterSpacing: '.06em', marginBottom: 6,
      }}>{label}</div>
      {children}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// ARTBOARD B · SETTINGS · Pad appearance · shape control
// Integrates into the existing v17 Pad Appearance settings page as a
// new row above DEPTH TREATMENT.
// ═════════════════════════════════════════════════════════════════
function PadShapeSettingsArtboard() {
  const [shape, setShape] = React.useState('square');
  const [mode,  setMode]  = React.useState('setup');

  return (
    <div className="sb" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <TopBarV2 title="Settings · Display · Pad Appearance" icon="cog" breadcrumb="Settings · Display" mode="setup" />

      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        {/* Left submenu rail */}
        <aside style={{ width: 220, background: 'var(--deep)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
          <PanelHeaderV2 icon="cog" title="DISPLAY" active />
          <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {['Theme', 'Atmosphere', 'Pad appearance', 'Mode awareness', 'Animations'].map((label) => (
              <div key={label} style={{
                padding: '6px 10px',
                fontFamily: 'var(--font-ui)', fontSize: 13,
                color: label === 'Pad appearance' ? 'var(--gold)' : 'var(--text-dim)',
                letterSpacing: '.08em', textTransform: 'uppercase',
                background: label === 'Pad appearance' ? 'var(--top)' : 'transparent',
                borderLeft: label === 'Pad appearance' ? '2px solid var(--gold)' : '2px solid transparent',
              }}>{label}</div>
            ))}
          </div>
        </aside>

        {/* MAIN */}
        <main style={{ flex: 1, overflow: 'auto', background: 'var(--surface)' }}>
          <div style={{ padding: '20px 32px 8px' }}>
            <div className="sb-display-vt" style={{ fontSize: 20 }}>Pad appearance</div>
            <div className="sb-mono" style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 4 }}>
              // shape · depth · glow · drop shadow. all global, applied to every pad on every board.
            </div>
          </div>

          <div style={{ padding: '12px 32px 8px' }}>
            <SectionLabel glyph="diamond">SHAPE</SectionLabel>
          </div>

          <SettingRow
            label="Pad shape"
            desc="SQUARE makes every pad 1:1 — uniform tiles regardless of column count. RECTANGULAR uses the current V3 behaviour: fixed height (110px), width stretched by the grid."
            control={
              <ChunkySegmented
                options={['SQUARE', 'RECTANGULAR']}
                active={shape === 'square' ? 'SQUARE' : 'RECTANGULAR'}
                onPick={(v) => setShape(v === 'SQUARE' ? 'square' : 'rect')}
                color="var(--gold)"
              />
            }
          />

          {/* placeholder rows for the rest of the v17 Pad Appearance section */}
          <div style={{ padding: '24px 32px 8px' }}>
            <SectionLabel glyph="diamond">DEPTH TREATMENT</SectionLabel>
          </div>
          <div style={{ padding: '0 32px 16px', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-mute)', fontStyle: 'italic' }}>
            // depth · inner-glow · outer-glow · drop-shadow rows (from v17-pad-appearance.jsx) sit below this row in the real settings page.
          </div>

          <div style={{ padding: '24px 32px 8px' }}>
            <SectionLabel glyph="moon">PREVIEW STATE</SectionLabel>
          </div>
          <SettingRow
            label="Mode for preview"
            desc="See the shape in both SETUP and GAME — pad-spine, hotkey caps, drag-handles all interact differently with each shape."
            control={
              <div style={{ display: 'flex', gap: 6 }}>
                <OptBtn on={mode === 'setup'} onClick={() => setMode('setup')}>SETUP</OptBtn>
                <OptBtn on={mode === 'game'}  onClick={() => setMode('game')}>GAME</OptBtn>
              </div>
            }
          />

          <div style={{ height: 24 }} />
        </main>

        {/* RIGHT — sticky live preview */}
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
            <PadShapeBoardMock mode={mode} setMode={setMode} shape={shape} cols={4} />
          </div>
          <div style={{ marginTop: 'auto', paddingTop: 16, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.6 }}>
            ▸ implementation: `--pad-aspect` custom property on the board canvas (.sb-pad-canvas)<br/>
            ▸ SQUARE sets `aspect-ratio: 1/1` + zeros `min-height` via the `is-square` state class; RECTANGULAR leaves both at defaults<br/>
            ▸ no per-pad markup change — fully reversible by toggling the single `is-square` class on the canvas
          </div>
        </aside>
      </div>
    </div>
  );
}

Object.assign(window, {
  PadShapeBoardMock,
  PadShapeCompareArtboard, PadShapeSettingsArtboard,
});
