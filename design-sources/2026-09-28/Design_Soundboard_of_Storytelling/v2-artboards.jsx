// v2-artboards.jsx — Refined design-system artboards.
// SurfaceHierarchy · PadTypes · Modes · ProTool chrome demo · new screens.

// ═════════════════════════════════════════════════════════════════
// Surface hierarchy — visualize the 5-level surface stack so panel
// nesting reads at a glance.
// ═════════════════════════════════════════════════════════════════
function SurfaceHierarchyArtboard() {
  const LEVELS = [
    { tok: '--night',   role: 'Window / canvas',           use: 'Behind everything. Root background.' },
    { tok: '--deep',    role: 'Toolbar · status bar · rail', use: 'Persistent chrome. Slightly elevated from canvas.' },
    { tok: '--surface', role: 'Primary panel',             use: 'The "page" inside the window — main content surface.' },
    { tok: '--raised',  role: 'Card · input · nested panel', use: 'Anything sitting INSIDE --surface gets this tone.' },
    { tok: '--top',     role: 'Hover · active row · selection', use: 'The highest neutral; reserved for transient state.' },
  ];

  return (
    <div className="sb" style={{ padding: 28, overflow: 'auto', height: '100%' }}>
      <div style={{ marginBottom: 20 }}>
        <div className="sb-display" style={{ fontSize: 24 }}>Surface Hierarchy</div>
        <div className="sb-mono" style={{ fontSize: 13, marginTop: 6 }}>
          // five distinct tonal levels. The old 4-level palette had ~6 L*-points<br/>
          // between night and raised; v2 spreads that to ~8 so panels stack visibly.
        </div>
      </div>

      {/* Level table */}
      <div style={{
        display: 'grid', gridTemplateColumns: '120px 1fr 1fr', gap: 0,
        marginBottom: 24, border: '1px solid var(--border-soft)',
      }}>
        <div style={{ padding: 10, background: 'var(--deep)', fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--text-mute)', letterSpacing: '.1em', textTransform: 'uppercase', borderBottom: '1px solid var(--border-soft)' }}>SWATCH</div>
        <div style={{ padding: 10, background: 'var(--deep)', fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--text-mute)', letterSpacing: '.1em', textTransform: 'uppercase', borderBottom: '1px solid var(--border-soft)' }}>TOKEN · ROLE</div>
        <div style={{ padding: 10, background: 'var(--deep)', fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--text-mute)', letterSpacing: '.1em', textTransform: 'uppercase', borderBottom: '1px solid var(--border-soft)' }}>USE</div>
        {LEVELS.map(({ tok, role, use }) => (
          <React.Fragment key={tok}>
            <div style={{ background: `var(${tok})`, borderRight: '1px solid var(--border-soft)', borderBottom: '1px solid var(--border-soft)', minHeight: 64 }} />
            <div style={{ padding: 12, borderBottom: '1px solid var(--border-soft)', borderRight: '1px solid var(--border-soft)' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text)' }}>{tok}</div>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--text-dim)', letterSpacing: '.06em', textTransform: 'uppercase', marginTop: 3 }}>{role}</div>
            </div>
            <div style={{ padding: 12, borderBottom: '1px solid var(--border-soft)', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)' }}>{use}</div>
          </React.Fragment>
        ))}
      </div>

      {/* Live nesting demo */}
      <SectionLabel glyph="diamond">NESTING — EACH LEVEL INSIDE THE LAST</SectionLabel>
      <div style={{ background: 'var(--night)', padding: 20 }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-mute)', marginBottom: 8 }}>--night (canvas)</div>
        <div style={{ background: 'var(--deep)', padding: 16 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-mute)', marginBottom: 8 }}>--deep (toolbar / rail)</div>
          <div style={{ background: 'var(--surface)', padding: 16 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-mute)', marginBottom: 8 }}>--surface (panel)</div>
            <div style={{ background: 'var(--raised)', padding: 14 }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-mute)', marginBottom: 8 }}>--raised (card)</div>
              <div style={{ background: 'var(--top)', padding: 10 }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text)' }}>--top (active row)</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// PAD type system — 4 colours × 2 states + the visual cues
// ═════════════════════════════════════════════════════════════════
function PadV2({ type = 'single', hot, setup, title, meta, hotkey, count }) {
  const typeMeta = {
    single:   { color: 'var(--pad-single)',   glow: 'var(--pad-single-glow)',   icon: 'play',     tag: 'SINGLE' },
    loop:     { color: 'var(--pad-loop)',     glow: 'var(--pad-loop-glow)',     icon: 'loop',     tag: 'LOOP' },
    playlist: { color: 'var(--pad-playlist)', glow: 'var(--pad-playlist-glow)', icon: 'scroll',   tag: 'PLAYLIST' },
    combo:    { color: 'var(--pad-combo)',    glow: 'var(--pad-combo-glow)',    icon: 'rune',     tag: 'COMBO' },
  }[type];

  return (
    <div className={'sb-pad' + (hot ? ' is-hot' : '') + (setup ? ' is-setup' : '')}
      style={{ '--pad-color': typeMeta.color, '--pad-glow': typeMeta.glow }}>
      {hotkey && !setup && <span className="sb-pad-key">{hotkey}</span>}
      {setup && (
        <span style={{
          position: 'absolute', top: 6, left: 6,
          width: 14, height: 14, color: 'var(--mode-setup)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="9" height="11" viewBox="0 0 9 11" fill="currentColor"><circle cx="2" cy="2" r="1.1"/><circle cx="7" cy="2" r="1.1"/><circle cx="2" cy="5.5" r="1.1"/><circle cx="7" cy="5.5" r="1.1"/><circle cx="2" cy="9" r="1.1"/><circle cx="7" cy="9" r="1.1"/></svg>
        </span>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingLeft: 6 }}>
        <div style={{ color: typeMeta.color }}>
          <PixelIcon name={typeMeta.icon} size={14} />
        </div>
        <span style={{
          fontFamily: 'var(--font-ui)', fontSize: 11,
          color: typeMeta.color, letterSpacing: '.1em',
        }}>{typeMeta.tag}</span>
        {count && (
          <span style={{
            marginLeft: 'auto',
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--text-mute)',
            fontVariantNumeric: 'tabular-nums',
          }}>{count}</span>
        )}
      </div>

      <div style={{ paddingLeft: 6 }}>
        <div className="sb-pad-title">{title}</div>
        {meta && <div className="sb-pad-meta">{meta}</div>}
        {hot && (
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 1, height: 10 }}>
            {/* animated level meter behind */}
            {Array.from({ length: 28 }).map((_, i) => {
              const h = 2 + Math.abs(Math.sin((i + Math.random() * 0.6) * 0.7)) * 8;
              return <div key={i} style={{ flex: 1, height: h, background: typeMeta.color, opacity: 0.85 }} />;
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function PadTypesArtboard() {
  const TYPES = [
    { type: 'single',   title: 'Sword Clash',    meta: '0:02 · one-shot',   hotkey: 'F1' },
    { type: 'loop',     title: 'Rain Heavy',     meta: '∞ · ambient',        hotkey: 'F2', count: '02:14' },
    { type: 'playlist', title: 'Tavern Mix',     meta: '14 tracks',           hotkey: 'F3', count: '3/14' },
    { type: 'combo',    title: 'Boss Reveal',    meta: '4-step chain',        hotkey: 'F4', count: '1/4' },
  ];
  return (
    <div className="sb" style={{ padding: 28, overflow: 'auto', height: '100%' }}>
      <div style={{ marginBottom: 18 }}>
        <div className="sb-display" style={{ fontSize: 24 }}>PAD Types</div>
        <div className="sb-mono" style={{ fontSize: 13, marginTop: 6 }}>
          // four PAD personalities. Idle = colour spine on the left edge<br/>
          // only. Hot = full border + drop-shadow glow + level meter.
        </div>
      </div>

      <SectionLabel glyph="diamond">IDLE — passive identity via left-edge spine</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {TYPES.map((t) => <PadV2 key={t.type} {...t} />)}
      </div>

      <SectionLabel glyph="sparkle">HOT — playing / active</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {TYPES.map((t) => <PadV2 key={t.type} {...t} hot />)}
      </div>

      <SectionLabel glyph="key">SETUP — editable; dashed border, drag-handle visible</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {TYPES.map((t) => <PadV2 key={t.type} {...t} setup />)}
      </div>

      <SectionLabel glyph="scroll">TYPE LEGEND</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {[
          { type: 'single',   tag: 'SINGLE',   desc: 'Plays once, then stops. Stingers, doors, hits.' },
          { type: 'loop',     tag: 'LOOP',     desc: 'Continuous until stopped. Ambience, weather, drone.' },
          { type: 'playlist', tag: 'PLAYLIST', desc: 'Cycles a list of files. Background music sets.' },
          { type: 'combo',    tag: 'COMBO',    desc: 'Triggers a chain of pads. Reveals, climaxes, rituals.' },
        ].map((row) => (
          <div key={row.type} className="sb-card" style={{ '--pix-bg': 'var(--surface)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 4, height: 28, background: `var(--pad-${row.type})` }} />
              <span style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: `var(--pad-${row.type})`, letterSpacing: '.12em' }}>
                {row.tag}
              </span>
            </div>
            <div className="sb-mono" style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.4 }}>{row.desc}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-mute)', marginTop: 8 }}>
              var(--pad-{row.type})
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// SETUP vs GAME mode — multi-cue differentiation
// ═════════════════════════════════════════════════════════════════
function ModesArtboard() {
  const cues = [
    ['Accent colour',     'cool teal (--mode-setup)',  'warm gold (--mode-game)'],
    ['PAD border',        'dashed pixel-stripe',        'solid stepped corners'],
    ['Top-bar badge',     'hatched fill, teal stroke',  'solid amber pill'],
    ['Background hint',   'visible layout grid',        'subtle vignette / scanlines'],
    ['Right-rail panel',  'INSPECTOR — arrange tools',  'NOW PLAYING + transport'],
    ['Top-left of pad',   'drag-handle dots',           'hidden'],
    ['Top-right of pad',  'hidden',                     'key-cap label'],
    ['Tap on PAD',        'opens the PAD editor',       'triggers the sound'],
    ['Cursor over canvas','move + resize grips',        'no edit affordances'],
    ['Status bar text',   '"EDIT  ·  Board 1  ·  16 pads, 4 selected"', '"LIVE  ·  Board 1  ·  2 playing"'],
  ];

  return (
    <div className="sb" style={{ padding: 28, overflow: 'auto', height: '100%' }}>
      <div style={{ marginBottom: 18 }}>
        <div className="sb-display" style={{ fontSize: 24 }}>SETUP &middot; GAME</div>
        <div className="sb-mono" style={{ fontSize: 13, marginTop: 6 }}>
          // mode is signalled by colour AND four other cues so it's unambiguous<br/>
          // even at a glance — Lightroom's Library / Develop separation as inspiration.
        </div>
      </div>

      {/* Mode badges */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 22, alignItems: 'center' }}>
        <span className="sb-mode-badge is-setup">
          <PixelIcon name="edit" size={11} color="currentColor" /> SETUP
        </span>
        <span className="sb-mode-badge is-game">
          <PixelIcon name="play" size={11} color="currentColor" /> GAME
        </span>
        <div className="sb-mono" style={{ fontSize: 12, color: 'var(--text-dim)' }}>
          // the badge alone is loud enough — solid fill vs. diagonal hatch reads<br/>
          // even in mono / screenshot review.
        </div>
      </div>

      {/* Comparison grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 22 }}>
        {/* SETUP mock */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--mode-setup)' }}>
          <div style={{
            padding: '10px 14px', background: 'var(--deep)',
            display: 'flex', alignItems: 'center', gap: 12,
            borderBottom: '1px solid var(--border-soft)',
          }}>
            <span className="sb-mode-badge is-setup" style={{ fontSize: 11 }}>SETUP</span>
            <span className="sb-mono" style={{ fontSize: 12, color: 'var(--text-dim)' }}>The Tavern · arrange</span>
          </div>
          <div className="sb-grid-bg" style={{ padding: 14, background: 'var(--surface)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              <PadV2 type="single"   title="Door"   meta="0:04" setup />
              <PadV2 type="loop"     title="Rain"   meta="∞"    setup />
              <PadV2 type="playlist" title="Tavern" meta="14"   setup />
              <PadV2 type="combo"    title="Boss"   meta="4ch"  setup />
              <PadV2 type="single"   title="Sword"  meta="0:02" setup />
              <PadV2 type="loop"     title="Fire"   meta="∞"    setup />
            </div>
          </div>
          <div className="sb-status-bar" style={{ background: 'var(--deep)' }}>
            <span className="sb-status-section" style={{ color: 'var(--mode-setup)' }}>EDIT</span>
            <span className="sb-status-section">Board 1</span>
            <span className="sb-status-section">16 pads, 0 selected</span>
            <span style={{ marginLeft: 'auto' }}>16 × 9 grid</span>
          </div>
        </div>

        {/* GAME mock */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--gold-dim)', position: 'relative' }}>
          <div style={{
            padding: '10px 14px', background: 'var(--deep)',
            display: 'flex', alignItems: 'center', gap: 12,
            borderBottom: '1px solid var(--border-soft)',
          }}>
            <span className="sb-mode-badge is-game" style={{ fontSize: 11 }}>GAME</span>
            <span className="sb-mono" style={{ fontSize: 12, color: 'var(--text-dim)' }}>The Tavern · live</span>
          </div>
          <div className="sb-scanlines" style={{
            padding: 14,
            position: 'relative',
            background: 'radial-gradient(80% 60% at 50% 50%, transparent 0%, rgba(0,0,0,.3) 100%), var(--surface)',
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              <PadV2 type="single"   title="Door"   meta="0:04" hotkey="F1" />
              <PadV2 type="loop"     title="Rain"   meta="∞"    hotkey="F2" hot />
              <PadV2 type="playlist" title="Tavern" meta="3/14" hotkey="F3" hot count="3/14" />
              <PadV2 type="combo"    title="Boss"   meta="4ch"  hotkey="F4" />
              <PadV2 type="single"   title="Sword"  meta="0:02" hotkey="F5" />
              <PadV2 type="loop"     title="Fire"   meta="∞"    hotkey="F6" hot />
            </div>
          </div>
          <div className="sb-status-bar" style={{ background: 'var(--deep)' }}>
            <span className="sb-status-section" style={{ color: 'var(--gold)' }}>LIVE</span>
            <span className="sb-status-section">Board 1</span>
            <span className="sb-status-section">3 playing</span>
            <span style={{ marginLeft: 'auto' }}>Master 72%</span>
          </div>
        </div>
      </div>

      {/* Cue table */}
      <SectionLabel glyph="diamond">CUES</SectionLabel>
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0,
        border: '1px solid var(--border-soft)',
      }}>
        <div style={{ padding: 8, background: 'var(--deep)', borderBottom: '1px solid var(--border-soft)', fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--text-mute)', letterSpacing: '.1em', textTransform: 'uppercase' }}>CUE</div>
        <div style={{ padding: 8, background: 'var(--deep)', borderBottom: '1px solid var(--border-soft)', fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--mode-setup)', letterSpacing: '.1em', textTransform: 'uppercase' }}>SETUP</div>
        <div style={{ padding: 8, background: 'var(--deep)', borderBottom: '1px solid var(--border-soft)', fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--gold)', letterSpacing: '.1em', textTransform: 'uppercase' }}>GAME</div>
        {cues.map(([cue, setup, game], i) => (
          <React.Fragment key={cue}>
            <div style={{ padding: 8, fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--text)', borderBottom: i === cues.length - 1 ? 'none' : '1px solid var(--border-soft)', borderRight: '1px solid var(--border-soft)', letterSpacing: '.04em' }}>{cue}</div>
            <div style={{ padding: 8, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)', borderBottom: i === cues.length - 1 ? 'none' : '1px solid var(--border-soft)', borderRight: '1px solid var(--border-soft)' }}>{setup}</div>
            <div style={{ padding: 8, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)', borderBottom: i === cues.length - 1 ? 'none' : '1px solid var(--border-soft)' }}>{game}</div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// ProTool chrome — PanelHeader · StatusBar · Inspector · NumChip
// ═════════════════════════════════════════════════════════════════
function ProToolArtboard() {
  return (
    <div className="sb" style={{ padding: 28, overflow: 'auto', height: '100%' }}>
      <div style={{ marginBottom: 20 }}>
        <div className="sb-display" style={{ fontSize: 24 }}>Pro-tool Chrome</div>
        <div className="sb-mono" style={{ fontSize: 13, marginTop: 6 }}>
          // Lightroom / Premiere / Resolve density without losing atmosphere.
        </div>
      </div>

      <SectionLabel glyph="diamond">PANEL HEADER</SectionLabel>
      <div style={{ border: '1px solid var(--border)', marginBottom: 20 }}>
        <div className="sb-panel-header is-active">
          <PixelIcon name="cog" size={14} color="currentColor" />
          INSPECTOR
          <PixelIcon name="diamond" size={8} color="var(--gold)" />
          <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-mute)' }}>3 selected</span>
        </div>
        <div style={{ padding: 14, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)', background: 'var(--surface)' }}>
          Panel body. Headers sit on --deep so they read as armature, not content.
        </div>
        <div className="sb-panel-header">
          <PixelIcon name="potion" size={14} color="currentColor" />
          AUDIO
        </div>
        <div style={{ padding: 14, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)', background: 'var(--surface)' }}>
          Another section. Click the chevron to collapse.
        </div>
      </div>

      <SectionLabel glyph="hourglass">STATUS BAR</SectionLabel>
      <div style={{ marginBottom: 20 }}>
        <div className="sb-status-bar">
          <span className="sb-status-section" style={{ color: 'var(--gold)' }}>LIVE</span>
          <span className="sb-status-section">Board 1 · The Tavern</span>
          <span className="sb-status-section">2 playing</span>
          <span className="sb-status-section">8 / 16 pads</span>
          <span style={{ marginLeft: 'auto' }}>Master 72%</span>
          <span>48 kHz · 16 bit</span>
        </div>
      </div>

      <SectionLabel glyph="rune">NUMERIC SCRUBBERS</SectionLabel>
      <div style={{ display: 'flex', gap: 14, marginBottom: 20, alignItems: 'center' }}>
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--text-dim)', letterSpacing: '.08em' }}>VOLUME</div>
        <span className="sb-num">72%</span>
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--text-dim)', letterSpacing: '.08em' }}>FADE IN</div>
        <span className="sb-num is-active">0.8s</span>
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--text-dim)', letterSpacing: '.08em' }}>TRIM</div>
        <span className="sb-num">02:14</span>
        <div className="sb-mono" style={{ fontSize: 11, color: 'var(--text-mute)' }}>// drag horizontally to scrub</div>
      </div>

      <SectionLabel glyph="moon">INSPECTOR — REAL EXAMPLE</SectionLabel>
      <div style={{ width: 280, border: '1px solid var(--border)', background: 'var(--surface)' }}>
        <div className="sb-panel-header is-active">
          <PixelIcon name="cog" size={14} color="currentColor" />
          PAD · RAIN HEAVY
        </div>
        <div style={{ padding: 12, borderBottom: '1px solid var(--border-soft)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span className="sb-label" style={{ fontSize: 12, color: 'var(--text-dim)' }}>TYPE</span>
            <div style={{ display: 'flex', gap: 4 }}>
              <span className="sb-pill" style={{ fontSize: 9 }}>SINGLE</span>
              <span className="sb-pill is-loop" style={{ fontSize: 9 }}>LOOP</span>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span className="sb-label" style={{ fontSize: 12, color: 'var(--text-dim)' }}>KEY</span>
            <span className="sb-num">F2</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span className="sb-label" style={{ fontSize: 12, color: 'var(--text-dim)' }}>VOLUME</span>
            <span className="sb-num is-active">72%</span>
          </div>
        </div>
        <div className="sb-panel-header"><PixelIcon name="potion" size={12} color="currentColor" /> FILE</div>
        <div style={{ padding: 12, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)' }}>
          rain_heavy.ogg<br/>
          <span style={{ color: 'var(--text-mute)' }}>2:14 · 1.4 MB · 48 kHz</span>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { PadV2, SurfaceHierarchyArtboard, PadTypesArtboard, ModesArtboard, ProToolArtboard });
