// v2-screens.jsx — Refined screens for the v2 design system.
// StartScreen · BoardV2 · LibraryV2 · PadEditorScreen · ComboEditorScreen
// Pro-tool layout discipline: persistent top toolbar, status bar at the
// bottom, inspector rails on the right where editing is dense.

// ─────────────────────────────────────────────────────────────────
// Shared chrome: TopBar / StatusBar / PanelHeader
// ─────────────────────────────────────────────────────────────────
function TopBarV2({ title, breadcrumb, mode, modeOnSwap, right, icon = 'flame' }) {
  // Leading icon mirrors the main-menu icon for the same destination
  // (BOARD → flame, LIBRARY → book, SETTINGS → cog, TIPS → bulb,
  // ABOUT → info). Sub-screens inherit their parent's icon (PAD/Combo
  // editor → flame, since they descend from a board). Icon hue tracks
  // the title's gold-bright voice; only the flame keeps its brand red
  // because it's the app's signature mark.
  const iconColor = icon === 'flame' ? 'var(--flame)' : 'var(--gold)';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '10px 16px',
      background: 'var(--deep)',
      borderBottom: '1px solid var(--border)',
      height: 48,
    }}>
      <div style={{ color: iconColor }}>
        <PixelIcon name={icon} size={20} />
      </div>
      {/* Masthead — aligns with the system's "lantern" display voice
          (.sb-display-vt): VT323 pixel-marquee at 22px, UPPERCASE, in
          --gold-bright with a warm halo so it feels lit, not clinical.
          A small gold-dim pixel diamond trails the title — dezent
          TTRPG-style chapter mark — and the breadcrumb drops below as
          subordinate mono meta. Stack fits the 48px topbar unchanged. */}
      <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, lineHeight: 1, gap: 3 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <span style={{
            fontFamily: 'var(--font-ui)', fontSize: 22,
            color: 'var(--gold-bright)',
            textTransform: 'uppercase',
            letterSpacing: '.14em',
            whiteSpace: 'nowrap',
            textShadow: '0 0 4px rgba(245, 213, 122, .55), 0 0 14px rgba(245, 213, 122, .22)',
          }}>{title}</span>
          <span aria-hidden="true" style={{
            display: 'inline-block', width: 5, height: 5,
            background: 'var(--gold-dim)',
            transform: 'rotate(45deg)',
            flexShrink: 0,
            opacity: 0.85,
          }} />
        </div>
        {breadcrumb && (
          <span style={{
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--text-mute)', whiteSpace: 'nowrap',
            letterSpacing: '.02em',
          }}>{breadcrumb}</span>
        )}
      </div>

      {mode && (
        <div onClick={modeOnSwap} style={{ marginLeft: 8 }}>
          <span className={'sb-mode-badge ' + (mode === 'game' ? 'is-game' : 'is-setup')}>
            <PixelIcon name={mode === 'game' ? 'play' : 'edit'} size={11} color="currentColor" />
            {mode === 'game' ? 'GAME' : 'SETUP'}
          </span>
        </div>
      )}
      <div style={{ flex: 1 }} />
      {right}
    </div>
  );
}

function StatusBarV2({ mode, board, info, right }) {
  return (
    <div className="sb-status-bar">
      <span className="sb-status-section" style={{ color: mode === 'game' ? 'var(--gold)' : 'var(--mode-setup)' }}>
        {mode === 'game' ? 'LIVE' : 'EDIT'}
      </span>
      <span className="sb-status-section">{board}</span>
      <span className="sb-status-section">{info}</span>
      <span style={{ marginLeft: 'auto', display: 'flex', gap: 16 }}>{right}</span>
    </div>
  );
}

function PanelHeaderV2({ icon, title, right, active }) {
  return (
    <div className={'sb-panel-header' + (active ? ' is-active' : '')}>
      {icon && <PixelIcon name={icon} size={12} color="currentColor" />}
      {title}
      {right && <span style={{ marginLeft: 'auto' }}>{right}</span>}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// START — fire animation placeholder, tap to enter
// ═════════════════════════════════════════════════════════════════
function StartScreen() {
  return (
    <div className="sb sb-scanlines" style={{
      position: 'relative',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      height: '100%',
      background: `
        radial-gradient(60% 50% at 50% 65%, rgba(232,130,30,.15) 0%, transparent 70%),
        radial-gradient(120% 70% at 50% -10%, var(--glow-radial) 0%, transparent 65%),
        var(--night)
      `,
    }}>
      <div style={{
        width: 200, height: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        position: 'relative',
        marginBottom: 32,
      }}>
        <div style={{
          position: 'absolute', width: 220, height: 220, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(232,130,30,.32) 0%, transparent 60%)',
          animation: 'sb-flicker 1.6s ease-in-out infinite',
        }} />
        <FlameLogo size={120} />
      </div>

      <div className="sb-display" style={{ fontSize: 22, textAlign: 'center', marginBottom: 18 }}>
        SOUNDBOARD<br/>OF STORYTELLING
      </div>
      <div className="sb-mono is-italic" style={{ fontSize: 13, color: 'var(--text-dim)', marginBottom: 36 }}>
        // a tool for game-masters and other creative creatures
      </div>

      <button className="sb-btn sb-btn-primary" style={{ minWidth: 240, padding: '12px 24px' }}>
        <PixelIcon name="play" size={14} /> TAP TO UNLOCK
      </button>

      <div style={{ position: 'absolute', bottom: 18, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-mute)' }}>
        v 150  ·  audio context idle  ·  ready
      </div>

      <style>{`
        @keyframes sb-flicker {
          0%, 100% { transform: scale(1);   opacity: .85; }
          50%      { transform: scale(1.05); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// BOARD v2 — mode-aware; left rail = scenes, middle = pads,
// right rail switches: GAME shows NOW PLAYING + transport; SETUP
// shows the layout inspector.
// ═════════════════════════════════════════════════════════════════
function BoardV2({ mode = 'game' }) {
  const SCENES = ['Approach', 'The Tavern', 'Combat — Forest', 'Boss · Necromancer', 'Aftermath'];

  const PADS = [
    { type: 'single',   t: 'Tavern Door',  m: '0:04',        k: 'F1' },
    { type: 'loop',     t: 'Rain Heavy',   m: '∞',           k: 'F2', hot: true },
    { type: 'loop',     t: 'Fireplace',    m: '∞',           k: 'F3', hot: true },
    { type: 'single',   t: 'Sword Clash',  m: '0:02',        k: 'F4' },
    { type: 'single',   t: 'Wolf Howl',    m: '0:08',        k: 'F5' },
    { type: 'loop',     t: 'Crowd',        m: '∞',           k: 'F6' },
    { type: 'playlist', t: 'Tavern Mix',   m: '14 trax',     k: 'F7' },
    { type: 'single',   t: 'Thunder',      m: '0:03',        k: 'F8' },
    { type: 'combo',    t: 'Boss Reveal',  m: '4-chain',     k: 'Q' },
    { type: 'single',   t: 'Door Slam',    m: '0:01',        k: 'W' },
    { type: 'playlist', t: 'Combat Mix',   m: '6 trax',      k: 'E' },
    { type: 'loop',     t: 'Whispers',     m: '∞',           k: 'R' },
    { type: 'single',   t: 'Coin Drop',    m: '0:01',        k: 'T' },
    { type: 'single',   t: 'Owl Hoot',     m: '0:04',        k: 'Y' },
    { type: 'loop',     t: 'Wind',         m: '∞',           k: 'U' },
    { type: 'single',   t: 'Bell Toll',    m: '0:06',        k: 'I' },
  ];

  const isSetup = mode === 'setup';

  return (
    <div className="sb" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <TopBarV2
        title="The Tavern"
        breadcrumb="Board 1"
        mode={mode}
        right={
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="sb-btn sb-btn-sm sb-btn-ghost"><PixelIcon name="save" size={11} /> SAVE</button>
            <button className="sb-btn sb-btn-sm sb-btn-ghost"><PixelIcon name="download" size={11} /> EXPORT</button>
          </div>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 280px', flex: 1, minHeight: 0 }}>

        {/* ── Left rail · scenes ──────────────────────────────── */}
        <aside style={{ background: 'var(--deep)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
          <PanelHeaderV2 icon="moon" title="SCENES" active right={
            <PixelIcon name="edit" size={10} color="var(--text-mute)" />
          } />
          <div style={{ padding: 8, flex: 1, overflow: 'auto' }}>
            {SCENES.map((s, i) => (
              <div key={s} style={{
                padding: '7px 10px',
                background: i === 1 ? 'var(--top)' : 'transparent',
                borderLeft: i === 1 ? '2px solid var(--gold)' : '2px solid transparent',
                fontFamily: 'var(--font-ui)', fontSize: 14,
                letterSpacing: '.04em',
                color: i === 1 ? 'var(--gold)' : 'var(--text-dim)',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
                marginBottom: 1,
                minWidth: 0,
              }}>
                <span style={{ width: 18, flexShrink: 0, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-mute)' }}>{(i + 1).toString().padStart(2, '0')}</span>
                <span title={s} style={{ flex: 1, minWidth: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s}</span>
              </div>
            ))}
            <button className="sb-btn sb-btn-sm sb-btn-ghost" style={{ width: '100%', marginTop: 8 }}>+ ADD SCENE</button>
          </div>

          <PanelHeaderV2 icon="tag" title="FILTER" />
          <div style={{ padding: 10 }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
              <span className="sb-pill is-on">ALL</span>
              <span className="sb-pill is-loop">LOOP</span>
              <span className="sb-pill is-playlist">PLAY</span>
              <span className="sb-pill is-combo">COMBO</span>
            </div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '5px 8px',
              background: 'var(--sunk)',
              border: '1px solid var(--border-soft)',
              color: 'var(--text-mute)',
            }}>
              <PixelIcon name="search" size={11} />
              <span className="sb-mono" style={{ fontSize: 11 }}>Find by name…</span>
            </div>
          </div>
        </aside>

        {/* ── Middle · pad grid ─────────────────────────────── */}
        <main className={isSetup ? 'sb-grid-bg' : 'sb-scanlines'} style={{
          position: 'relative',
          padding: 18,
          overflow: 'auto',
          background: isSetup
            ? 'var(--surface)'
            : 'radial-gradient(70% 60% at 50% 50%, transparent 0%, rgba(0,0,0,.25) 100%), var(--surface)',
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
            <div className="sb-display" style={{ fontSize: 18 }}>The Tavern</div>
            {isSetup && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="sb-caption">GRID</span>
                <span className="sb-num">4 × 4</span>
                <span className="sb-caption">GAP</span>
                <span className="sb-num">10px</span>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {PADS.map((p) => (
              <PadV2 key={p.t} type={p.type} title={p.t} meta={p.m} hotkey={p.k} hot={p.hot && !isSetup} setup={isSetup} />
            ))}
          </div>
        </main>

        {/* ── Right rail · inspector OR transport ───────────── */}
        <aside style={{ background: 'var(--deep)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
          {isSetup ? <SetupInspector /> : <LiveTransport />}
        </aside>
      </div>

      <StatusBarV2
        mode={mode}
        board="Board 1 · The Tavern"
        info={isSetup ? '16 pads · 0 selected' : '3 playing'}
        right={
          <>
            <span>Master 72%</span>
            <span>48 kHz</span>
          </>
        }
      />
    </div>
  );
}

function LiveTransport() {
  return (
    <>
      <PanelHeaderV2 icon="sparkle" title="NOW PLAYING" active right={<span className="sb-caption">3</span>} />
      <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <MixerRowV2 type="loop"     title="RAIN HEAVY"  sub="0:42 / 2:14" value={0.5} />
        <MixerRowV2 type="loop"     title="FIREPLACE"   sub="∞ · 0:12" value={0.6} />
        <MixerRowV2 type="playlist" title="TAVERN MIX"  sub="3/14 · Lute Drone" value={0.45} />
      </div>

      <PanelHeaderV2 icon="diamond" title="MASTER" />
      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <LabelSliderV2 label="MASTER" value={0.72} />
        <LabelSliderV2 label="AMBIENT BUS" value={0.45} color="var(--pad-loop)" />
        <LabelSliderV2 label="STINGER BUS" value={0.90} color="var(--pad-single)" />
        <LabelSliderV2 label="MUSIC BUS"   value={0.60} color="var(--pad-playlist)" />
      </div>

      <PanelHeaderV2 icon="keyboard" title="TRANSPORT" />
      <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <button className="sb-btn sb-btn-sm sb-btn-ghost" style={{ justifyContent: 'flex-start' }}>
          <PixelIcon name="stop" size={10} /> STOP ALL  <span style={{ marginLeft: 'auto', color: 'var(--text-mute)' }}>ESC</span>
        </button>
        <button className="sb-btn sb-btn-sm sb-btn-ghost" style={{ justifyContent: 'flex-start' }}>
          <PixelIcon name="loop" size={12} /> CROSSFADE NEXT  <span style={{ marginLeft: 'auto', color: 'var(--text-mute)' }}>SPACE</span>
        </button>
      </div>
    </>
  );
}

function SetupInspector() {
  return (
    <>
      <PanelHeaderV2 icon="cog" title="INSPECTOR" active right={<span className="sb-caption">1 sel</span>} />
      <div style={{ padding: 12, borderBottom: '1px solid var(--border-soft)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <div style={{ width: 4, height: 24, background: 'var(--pad-loop)' }} />
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 15, color: 'var(--text)' }}>RAIN HEAVY</span>
        </div>
        <KvRow label="TYPE" right={<span className="sb-pill is-loop">LOOP</span>} />
        <KvRow label="KEY" right={<span className="sb-num">F2</span>} />
        <KvRow label="VOLUME" right={<span className="sb-num is-active">72%</span>} />
        <button className="sb-btn sb-btn-sm sb-btn-primary" style={{ width: '100%', marginTop: 10 }}>
          <PixelIcon name="edit" size={10} /> OPEN PAD EDITOR
        </button>
      </div>

      <PanelHeaderV2 icon="diamond" title="LAYOUT" />
      <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <KvRow label="COLUMNS"  right={<span className="sb-num">4</span>} />
        <KvRow label="ROWS"     right={<span className="sb-num">4</span>} />
        <KvRow label="GAP"      right={<span className="sb-num">10px</span>} />
        <KvRow label="PAD SIZE" right={<span className="sb-num">M</span>} />
        <KvRow label="SHAPE"    right={
          <div style={{ display: 'flex', gap: 4 }}>
            <span className="sb-pill is-on" style={{ fontSize: 9 }}>STEP</span>
            <span className="sb-pill" style={{ fontSize: 9 }}>RECT</span>
            <span className="sb-pill" style={{ fontSize: 9 }}>HEX</span>
          </div>
        } />
      </div>

      <PanelHeaderV2 icon="tag" title="FILTER" />
      <div style={{ padding: 10, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        <span className="sb-pill">SHOW ALL</span>
        <span className="sb-pill is-loop">LOOP ONLY</span>
        <span className="sb-pill">UNTAGGED</span>
      </div>

      <div style={{ flex: 1 }} />

      <div style={{ padding: 10, borderTop: '1px solid var(--border-soft)' }}>
        <button className="sb-btn sb-btn-sm" style={{ width: '100%' }}>
          + ADD PAD
        </button>
      </div>
    </>
  );
}

function KvRow({ label, right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0', gap: 8 }}>
      <span style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--text-dim)', letterSpacing: '.06em' }}>{label}</span>
      {right}
    </div>
  );
}

function MixerRowV2({ type = 'single', title, sub, value }) {
  const color = `var(--pad-${type})`;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '8px 10px',
      background: 'var(--raised)',
      borderLeft: `3px solid ${color}`,
    }}>
      <div style={{ color }}>
        <PixelIcon name={type === 'loop' ? 'loop' : type === 'playlist' ? 'scroll' : type === 'combo' ? 'rune' : 'play'} size={14} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color, letterSpacing: '.08em' }}>{title}</div>
        <div className="sb-mono" style={{ fontSize: 10, color: 'var(--text-mute)' }}>{sub}</div>
      </div>
      <div style={{ width: 60 }}>
        <div className="sb-slider"><div className="sb-slider-fill" style={{ width: (value * 100) + '%', background: color }} /></div>
      </div>
      <div style={{ color: 'var(--text-mute)', cursor: 'pointer' }}>
        <PixelIcon name="stop" size={10} />
      </div>
    </div>
  );
}

function LabelSliderV2({ label, value = 0.5, color, onChange }) {
  const handleClick = (e) => {
    if (!onChange) return;
    const track = e.currentTarget;
    const r = track.getBoundingClientRect();
    const v = Math.max(0, Math.min(1, (e.clientX - r.left) / r.width));
    onChange(v);
  };
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--text-dim)', letterSpacing: '.08em' }}>{label}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{Math.round(value * 100)}</span>
      </div>
      <div
        className="sb-slider"
        onClick={handleClick}
        style={onChange ? { cursor: 'pointer' } : undefined}
      >
        <div className="sb-slider-fill" style={{ width: (value * 100) + '%', background: color || 'var(--gold)' }} />
        <div className="sb-slider-thumb" style={{ left: (value * 100) + '%', background: color || 'var(--gold)' }} />
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// LIBRARY v2 — 4 tabs (AUDIO / ICONS / BOARDS / PADS).
// Shows AUDIO tab; the others render as compact previews.
// ═════════════════════════════════════════════════════════════════
function LibraryV2() {
  // Tags live in a disclosure so the rail stays as narrow as the
  // category names. Collapsed by default; click the TAGS header to
  // expand. The "7" count + caret telegraph the hidden content.
  const [tagsOpen, setTagsOpen] = React.useState(false);

  // View density — 'rows' shows each file as a full waveform row
  // (best for previewing one at a time); 'grid' is a 2-column compact
  // tile layout (best when browsing a large library at a glance).
  // Exposed via the segmented control in the toolbar.
  const [view, setView] = React.useState('rows');

  const SOUNDS = [
    { name: 'Rain Heavy',     dur: '2:14', size: '1.4 MB', tag: 'ambient',  file: 'rain_heavy.ogg' },
    { name: 'Fireplace',      dur: '0:42', size: '480 KB', tag: 'loop',     file: 'fire_loop.ogg' },
    { name: 'Tavern Door',    dur: '0:04', size: '60 KB',  tag: 'stinger',  file: 'door_tavern.ogg' },
    { name: 'Sword Clash',    dur: '0:02', size: '36 KB',  tag: 'stinger',  file: 'sword_01.ogg' },
    { name: 'Wolf Howl',      dur: '0:08', size: '120 KB', tag: 'stinger',  file: 'wolf.ogg' },
    { name: 'Boss Theme',     dur: '3:24', size: '4.8 MB', tag: 'music',    file: 'boss_theme.ogg' },
    { name: 'Whispers',       dur: '0:30', size: '360 KB', tag: 'loop',     file: 'whispers.ogg' },
    { name: 'Crowd Murmur',   dur: '1:30', size: '1.8 MB', tag: 'loop',     file: 'crowd.ogg' },
    { name: 'Thunder Crack',  dur: '0:03', size: '44 KB',  tag: 'stinger',  file: 'thunder.ogg' },
  ];

  return (
    <div className="sb" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <TopBarV2 title="Library" icon="book" breadcrumb="Audio, icons, boards & pad templates" right={
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="sb-btn sb-btn-sm sb-btn-ghost"><PixelIcon name="search" size={11} /> SEARCH</button>
          <button className="sb-btn sb-btn-sm sb-btn-primary"><PixelIcon name="download" size={11} /> IMPORT</button>
        </div>
      } />

      <div style={{ padding: '0 16px', background: 'var(--deep)' }}>
        <div className="sb-tabs">
          {[
            ['AUDIO',  124, true],
            ['ICONS',  42,  false],
            ['BOARDS', 6,   false],
            ['PADS',   38,  false],
          ].map(([label, n, active]) => (
            <div key={label} className={'sb-tab' + (active ? ' is-active' : '')}>
              {label}
              <span style={{ marginLeft: 6, color: 'var(--text-mute)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>{n}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'min-content 1fr 300px', flex: 1, minHeight: 0 }}>
        {/* Left rail */}
        <aside style={{ background: 'var(--deep)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
          <PanelHeaderV2 icon="book" title="CATEGORY" active />
          <div style={{ padding: 8 }}>
            {[
              ['All sounds', 124, true],
              ['Ambient',    28],
              ['Loops',      32],
              ['Stingers',   41],
              ['Music',      14],
              ['Voice',      9],
            ].map(([name, n, active]) => (
              <div key={name} style={{
                padding: '6px 10px',
                background: active ? 'var(--top)' : 'transparent',
                borderLeft: active ? '2px solid var(--gold)' : '2px solid transparent',
                fontFamily: 'var(--font-ui)', fontSize: 14,
                color: active ? 'var(--gold)' : 'var(--text-dim)',
                display: 'flex', justifyContent: 'space-between', gap: 24,
                letterSpacing: '.04em',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}>
                <span>{name}</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-mute)' }}>{n}</span>
              </div>
            ))}
          </div>

          <div onClick={() => setTagsOpen((o) => !o)} style={{ cursor: 'pointer' }}>
            <PanelHeaderV2 icon="tag" title="TAGS" right={
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-mute)' }}>7</span>
                {/* CSS-drawn pixel caret — right when collapsed, down when expanded. */}
                <span aria-hidden="true" style={{
                  display: 'inline-block', width: 0, height: 0,
                  ...(tagsOpen ? {
                    borderLeft: '4px solid transparent',
                    borderRight: '4px solid transparent',
                    borderTop: '5px solid var(--text-dim)',
                  } : {
                    borderTop: '4px solid transparent',
                    borderBottom: '4px solid transparent',
                    borderLeft: '5px solid var(--text-dim)',
                  }),
                }} />
              </span>
            } />
          </div>
          {tagsOpen && (
            <div style={{ padding: 10, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {['rain', 'tavern', 'combat', 'forest', 'storm', 'magic', 'night'].map((t) => (
                <span key={t} className="sb-pill">{t}</span>
              ))}
            </div>
          )}
        </aside>

        {/* Centre — list of audio files with waveform thumbnails */}
        <main style={{ padding: '14px 18px', background: 'var(--surface)', overflow: 'auto' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14,
            padding: '7px 12px',
            background: 'var(--sunk)',
            border: '1px solid var(--border)',
            color: 'var(--text-mute)',
          }}>
            <PixelIcon name="search" size={13} />
            <span className="sb-mono" style={{ fontSize: 13 }}>Search 124 sounds…</span>
            <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--text-dim)', letterSpacing: '.08em' }}>SORT · NEWEST</span>
            {/* View-density toggle — pixel-tab segmented control. ROWS = waveform list,
                GRID = 2-column compact tiles for at-a-glance browsing. */}
            <div style={{
              display: 'inline-flex',
              border: '1px solid var(--border-soft)',
              background: 'var(--deep)',
            }}>
              {['ROWS', 'GRID'].map((label) => {
                const mode = label.toLowerCase();
                const isOn = view === mode;
                return (
                  <button
                    key={label}
                    onClick={() => setView(mode)}
                    style={{
                      padding: '3px 10px',
                      background: isOn ? 'var(--top)' : 'transparent',
                      color: isOn ? 'var(--gold)' : 'var(--text-dim)',
                      fontFamily: 'var(--font-ui)', fontSize: 11,
                      letterSpacing: '.10em',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                  >{label}</button>
                );
              })}
            </div>
          </div>

          {view === 'rows' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {SOUNDS.map((s, i) => (
                <AudioRow key={s.name} {...s} selected={i === 0} />
              ))}
            </div>
          ) : (
            <div style={{
              display: 'grid',
              // Auto-fill responsive density: each tile gets at least 200px,
              // and as the artboard / window grows the grid packs in as many
              // columns as fit. On a typical 1280-wide library artboard this
              // lands at 4 columns; on a wider workspace it'll go 5–6+.
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: 6,
            }}>
              {SOUNDS.map((s, i) => (
                <AudioTile key={s.name} {...s} selected={i === 0} />
              ))}
            </div>
          )}
        </main>

        {/* Right — preview / inspector */}
        <aside style={{ background: 'var(--deep)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
          <PanelHeaderV2 icon="eye" title="PREVIEW" active />
          <div style={{ padding: 14 }}>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 16, color: 'var(--text)', marginBottom: 4 }}>RAIN HEAVY</div>
            <div className="sb-mono" style={{ fontSize: 11, color: 'var(--text-mute)' }}>rain_heavy.ogg · 1.4 MB</div>
          </div>

          <div style={{ padding: '0 14px' }}>
            <Waveform progress={0.0} height={70} />
          </div>

          <div style={{ padding: 14, display: 'flex', gap: 6 }}>
            <button className="sb-btn sb-btn-sm sb-btn-primary" style={{ flex: 1 }}>
              <PixelIcon name="play" size={10} /> PREVIEW
            </button>
            <button className="sb-btn sb-btn-sm sb-btn-ghost"><PixelIcon name="edit" size={10} /></button>
          </div>

          <PanelHeaderV2 icon="info" title="META" />
          <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <KvRow label="LENGTH"     right={<span className="sb-num">2:14</span>} />
            <KvRow label="SIZE"       right={<span className="sb-num">1.4 MB</span>} />
            <KvRow label="SAMPLE"     right={<span className="sb-num">48k</span>} />
            <KvRow label="BIT-DEPTH"  right={<span className="sb-num">16</span>} />
            <KvRow label="USED BY"    right={<span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)' }}>3 pads</span>} />
          </div>

          <PanelHeaderV2 icon="tag" title="TAGS" />
          <div style={{ padding: 10, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            <span className="sb-pill is-on">rain</span>
            <span className="sb-pill is-loop">ambient</span>
            <span className="sb-pill">storm</span>
            <span className="sb-pill" style={{ color: 'var(--text-mute)' }}>+ ADD</span>
          </div>
        </aside>
      </div>

      <StatusBarV2
        mode="setup"
        board="Library · Audio"
        info="124 sounds · 38.2 MB · 1 selected"
        right={<><span>48 kHz · 16 bit</span></>}
      />
    </div>
  );
}

function AudioRow({ name, dur, size, tag, file, selected }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '160px 1fr 70px 90px 28px',
      gap: 12, alignItems: 'center',
      padding: '8px 12px',
      background: selected ? 'var(--top)' : 'var(--raised)',
      borderLeft: selected ? '2px solid var(--gold)' : '2px solid transparent',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
        <div style={{ color: tag === 'loop' || tag === 'ambient' ? 'var(--pad-loop)' : tag === 'music' ? 'var(--pad-playlist)' : 'var(--gold)' }}>
          <PixelIcon name={tag === 'loop' || tag === 'ambient' ? 'loop' : 'play'} size={14} />
        </div>
        <div style={{ minWidth: 0, overflow: 'hidden' }}>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 14, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{name}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-mute)', whiteSpace: 'nowrap' }}>{file}</div>
        </div>
      </div>
      <Waveform progress={selected ? 0.0 : 0} height={28} dim={!selected} />
      <span className="sb-num" style={{ minWidth: 0, justifyContent: 'center' }}>{dur}</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)' }}>{size}</span>
      <PixelIcon name="edit" size={11} color="var(--text-mute)" />
    </div>
  );
}

// Compact tile — used in the Library's GRID view density. Drops the
// waveform thumbnail and file-size column so two files fit on a row
// at the same width that holds one AudioRow. Keeps the same icon →
// name/file → duration hierarchy so scanning skills transfer.
function AudioTile({ name, dur, tag, file, selected }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '6px 10px',
      background: selected ? 'var(--top)' : 'var(--raised)',
      borderLeft: selected ? '2px solid var(--gold)' : '2px solid transparent',
      minWidth: 0,
    }}>
      <div style={{
        color: tag === 'loop' || tag === 'ambient' ? 'var(--pad-loop)' :
               tag === 'music' ? 'var(--pad-playlist)' : 'var(--gold)',
        flexShrink: 0,
      }}>
        <PixelIcon name={tag === 'loop' || tag === 'ambient' ? 'loop' : 'play'} size={12} />
      </div>
      <div style={{ minWidth: 0, flex: 1, overflow: 'hidden' }}>
        <div style={{
          fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--text)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{name}</div>
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-mute)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>{file}</div>
      </div>
      <span className="sb-num" style={{ fontSize: 11, flexShrink: 0 }}>{dur}</span>
    </div>
  );
}

// Compact waveform — used in row previews and in the inspector
function Waveform({ progress = 0, height = 56, color, dim }) {
  const bars = 48;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 1, height }}>
      {Array.from({ length: bars }).map((_, i) => {
        const h = 4 + Math.abs(Math.sin(i * 0.6 + (i % 5))) * (height - 8) + (i % 3 === 0 ? 4 : 0);
        const played = i / bars < progress;
        return (
          <div key={i} style={{
            flex: 1, height: Math.min(h, height),
            background: played ? (color || 'var(--gold)') : (dim ? 'var(--border)' : 'var(--text-mute)'),
            opacity: dim ? .6 : 1,
          }} />
        );
      })}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// PAD EDITOR — the big one. Waveform canvas with trim/fade
// handles, file list, layered controls, icon picker, type selector.
// ═════════════════════════════════════════════════════════════════
function PadEditorScreen() {
  const [fadeIn,    setFadeIn]    = React.useState(0.12);
  const [fadeOut,   setFadeOut]   = React.useState(0.32);
  const [trimStart, setTrimStart] = React.useState(0.05);
  const [trimEnd,   setTrimEnd]   = React.useState(0.95);
  const [playhead,  setPlayhead]  = React.useState(0.42);
  const [loopPoint, setLoopPoint] = React.useState(0.06);
  const [volume,    setVolume]    = React.useState(0.72);
  const [padType,   setPadType]   = React.useState('loop');
  const [loopMode,  setLoopMode]  = React.useState('SEAMLESS');

  // Helper — total clip is 2:14 = 134 s; format trim positions into M:SS.
  const fmt = (frac) => {
    const total = 134;
    const s = Math.max(0, Math.round(frac * total));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };

  const typeColor = `var(--pad-${padType})`;

  return (
    <div className="sb" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <TopBarV2
        title="PAD Editor"
        breadcrumb="The Tavern · Rain Heavy"
        right={
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="sb-btn sb-btn-sm sb-btn-ghost">CANCEL</button>
            <button className="sb-btn sb-btn-sm sb-btn-filled">
              <PixelIcon name="save" size={11} /> SAVE
            </button>
          </div>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', flex: 1, minHeight: 0 }}>
        {/* ── Canvas / left column ─────────────────────────── */}
        <main style={{ background: 'var(--surface)', padding: 18, overflow: 'auto' }}>
          {/* Header chip with type + name */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <div style={{ width: 6, height: 56, background: typeColor }} />
            <div>
              <div className="sb-mono" style={{ fontSize: 11, color: 'var(--text-mute)', letterSpacing: '.1em', textTransform: 'uppercase' }}>EDITING</div>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: 26, color: 'var(--text)', letterSpacing: '.04em' }}>RAIN HEAVY</div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
              {['single', 'loop', 'playlist', 'combo'].map((t) => (
                <span
                  key={t}
                  className={'sb-pill ' + (t === padType ? `is-${t}` : '')}
                  onClick={() => setPadType(t)}
                  style={{ fontSize: 11, padding: '4px 14px', cursor: 'pointer' }}
                >{t.toUpperCase()}</span>
              ))}
            </div>
          </div>

          {/* Big waveform canvas with trim + fade markers + playhead */}
          <div style={{ background: 'var(--sunk)', border: '1px solid var(--border)', padding: 14, marginBottom: 14, position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--text-dim)', letterSpacing: '.1em' }}>WAVEFORM · rain_heavy.ogg</span>
              <div style={{ display: 'flex', gap: 6, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-mute)' }}>
                <span>2:14</span><span>·</span><span>48 kHz</span><span>·</span><span>1.4 MB</span>
              </div>
            </div>
            {/* Big waveform — all four trim/fade handles + playhead + loop-point are drag-interactive */}
            <BigWaveform
              fadeIn={fadeIn} fadeOut={fadeOut}
              trimStart={trimStart} trimEnd={trimEnd}
              playhead={playhead} loopPoint={padType === 'loop' ? loopPoint : undefined}
              onFadeIn={setFadeIn} onFadeOut={setFadeOut}
              onTrimStart={setTrimStart} onTrimEnd={setTrimEnd}
              onPlayhead={setPlayhead} onLoopPoint={setLoopPoint}
              fmt={fmt}
            />
          </div>

          {/* Below the waveform: file rows (playlist supports multiple) */}
          <SectionLabel glyph="potion">FILE</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 18 }}>
            <FileRow file="rain_heavy.ogg" dur="2:14" size="1.4 MB" selected />
            <FileRow file="rain_distant.ogg" dur="1:42" size="1.1 MB" dim />
            <button className="sb-btn sb-btn-sm sb-btn-ghost" style={{ alignSelf: 'flex-start' }}>+ ADD FILE</button>
          </div>

          {/* Controls grid */}
          <SectionLabel glyph="key">SHORTCUT &amp; ICON</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
            <div className="sb-card" style={{ '--pix-bg': 'var(--raised)' }}>
              <KvRow label="KEY" right={<span className="sb-num is-active">F2</span>} />
              <KvRow label="MIDI" right={<span className="sb-num">—</span>} />
              <KvRow label="GAMEPAD" right={<span className="sb-num">A · ↑</span>} />
            </div>
            <div className="sb-card" style={{ '--pix-bg': 'var(--raised)' }}>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--text-dim)', letterSpacing: '.08em', marginBottom: 8 }}>ICON</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6 }}>
                {['loop', 'flame', 'moon', 'star', 'potion', 'eye', 'rune', 'skull', 'hourglass', 'diamond', 'tag', 'scroll'].map((g) => (
                  <div key={g} style={{
                    aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: g === 'loop' ? 'var(--pad-loop-soft)' : 'var(--sunk)',
                    border: '1px solid ' + (g === 'loop' ? 'var(--pad-loop)' : 'var(--border-soft)'),
                    color: g === 'loop' ? 'var(--pad-loop)' : 'var(--text-dim)',
                    cursor: 'pointer',
                  }}>
                    <PixelIcon name={g} size={16} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>

        {/* ── Right inspector ─────────────────────────────── */}
        <aside className="sb-inspector">
          <PanelHeaderV2 icon="cog" title="AUDIO" active />
          <div className="sb-inspector-section" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <LabelSliderV2 label="VOLUME"   value={volume} color={typeColor} onChange={setVolume} />
            <LabelSliderV2 label="FADE IN"  value={fadeIn}  color="var(--fade)" onChange={setFadeIn}  />
            <LabelSliderV2 label="FADE OUT" value={fadeOut} color="var(--fade)" onChange={setFadeOut} />
            <KvRow label="TRIM START" right={<span className="sb-num">{fmt(trimStart)}</span>} />
            <KvRow label="TRIM END"   right={<span className="sb-num">{fmt(trimEnd)}</span>} />
          </div>

          <PanelHeaderV2 icon="loop" title="LOOP" />
          <div className="sb-inspector-section" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <KvRow label="MODE" right={
              <div style={{ display: 'flex', gap: 4 }}>
                {['SEAMLESS', 'CROSSFADE'].map((m) => (
                  <span
                    key={m}
                    className={'sb-pill ' + (m === loopMode ? 'is-loop' : '')}
                    onClick={() => setLoopMode(m)}
                    style={{ fontSize: 10, cursor: 'pointer' }}
                  >{m}</span>
                ))}
              </div>
            } />
            <KvRow label="LOOP POINT"  right={<span className="sb-num">{fmt(loopPoint)}</span>} />
            <KvRow label="CROSSFADE"   right={<span className="sb-num">200ms</span>} />
          </div>

          <PanelHeaderV2 icon="tag" title="META" />
          <div className="sb-inspector-section" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <KvRow label="SCENE"   right={<span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)' }}>The Tavern</span>} />
            <KvRow label="TAGS"    right={
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                <span className="sb-pill is-loop" style={{ fontSize: 9 }}>rain</span>
                <span className="sb-pill" style={{ fontSize: 9 }}>storm</span>
              </div>
            } />
          </div>

          <div style={{ flex: 1 }} />

          <div style={{ padding: 12, borderTop: '1px solid var(--border-soft)', display: 'flex', gap: 6 }}>
            <button className="sb-btn sb-btn-sm sb-btn-ghost" style={{ flex: 1 }}>
              <PixelIcon name="play" size={11} /> PREVIEW
            </button>
            <button className="sb-btn sb-btn-sm sb-btn-danger">
              <PixelIcon name="stop" size={11} /> DELETE
            </button>
          </div>
        </aside>
      </div>

      <StatusBarV2 mode="setup" board="PAD Editor · Rain Heavy" info="loop · F2 · 72%" right={<><span>unsaved</span></>} />
    </div>
  );
}

function FileRow({ file, dur, size, selected, dim }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '20px 1fr 70px 80px 28px',
      gap: 10, alignItems: 'center',
      padding: '8px 12px',
      background: selected ? 'var(--top)' : 'var(--raised)',
      borderLeft: selected ? '2px solid var(--pad-loop)' : '2px solid transparent',
      opacity: dim ? .6 : 1,
    }}>
      <PixelIcon name={selected ? 'play' : 'diamond'} size={selected ? 14 : 8} color={selected ? 'var(--pad-loop)' : 'var(--text-mute)'} />
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text)' }}>{file}</div>
      <span className="sb-num">{dur}</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)' }}>{size}</span>
      <PixelIcon name="edit" size={11} color="var(--text-mute)" />
    </div>
  );
}

function BigWaveform({
  trimStart = 0.05, trimEnd = 0.95,
  fadeIn = 0.12, fadeOut = 0.32,    // both 0..1 as fraction of trim length
  playhead = 0.42,
  loopPoint,                         // 0..1; rendered only if defined
  onTrimStart, onTrimEnd, onFadeIn, onFadeOut, onPlayhead, onLoopPoint,
  fmt,
}) {
  const trackRef = React.useRef(null);
  const bars = 120;

  // Resolve absolute positions in 0..1 along the waveform.
  const trimLen = Math.max(trimEnd - trimStart, 0.001);
  const fadeInClamped  = Math.max(0, Math.min(fadeIn,  1 - fadeOut));
  const fadeOutClamped = Math.max(0, Math.min(fadeOut, 1 - fadeIn));
  const fadeInEnd    = trimStart + fadeInClamped  * trimLen;
  const fadeOutStart = trimEnd   - fadeOutClamped * trimLen;

  // Generic drag — captures pointer, calls handler with x-fraction
  // until pointer-up. Also fires once on click for instant snap.
  const startDrag = (handler) => (e) => {
    if (!trackRef.current) return;
    e.preventDefault();
    e.stopPropagation();
    const apply = (clientX) => {
      const r = trackRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
      handler(x);
    };
    apply(e.clientX);
    const move = (ev) => apply(ev.clientX);
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };

  const MIN_TRIM = 0.05;   // smallest allowed trim window
  const dragTrimStart = (x) => onTrimStart && onTrimStart(Math.max(0, Math.min(x, trimEnd - MIN_TRIM)));
  const dragTrimEnd   = (x) => onTrimEnd   && onTrimEnd  (Math.max(trimStart + MIN_TRIM, Math.min(x, 1)));
  const dragFadeIn = (x) => {
    if (!onFadeIn) return;
    const v = (x - trimStart) / trimLen;
    onFadeIn(Math.max(0, Math.min(v, 1 - fadeOut)));
  };
  const dragFadeOut = (x) => {
    if (!onFadeOut) return;
    const v = (trimEnd - x) / trimLen;
    onFadeOut(Math.max(0, Math.min(v, 1 - fadeIn)));
  };
  const dragPlayhead = (x) => onPlayhead && onPlayhead(Math.max(trimStart, Math.min(x, trimEnd)));
  const dragLoopPoint = (x) => onLoopPoint && onLoopPoint(Math.max(trimStart, Math.min(x, trimEnd)));

  return (
    <div ref={trackRef} style={{ position: 'relative', height: 140 }}>
      {/* Waveform — amplitude ramps inside fade zones */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 140, position: 'relative', zIndex: 1 }}>
        {Array.from({ length: bars }).map((_, i) => {
          const p = i / bars;
          const baseH = 16 + Math.abs(Math.sin(i * 0.5)) * 80 + Math.abs(Math.sin(i * 0.13)) * 24;
          let amp = 1;
          if (p >= trimStart && p < fadeInEnd && fadeInEnd > trimStart) {
            amp = (p - trimStart) / (fadeInEnd - trimStart);
          } else if (p > fadeOutStart && p <= trimEnd && trimEnd > fadeOutStart) {
            amp = (trimEnd - p) / (trimEnd - fadeOutStart);
          }
          const inTrim = p >= trimStart && p <= trimEnd;
          const h = inTrim ? Math.max(2, baseH * amp) : baseH * 0.35;
          const played = p <= playhead;
          const color = inTrim
            ? (played ? 'var(--gold-bright)' : 'var(--pad-loop)')
            : 'var(--border)';
          return (
            <div key={i} style={{
              flex: 1, height: Math.min(h, 140),
              background: color,
            }} />
          );
        })}
      </div>

      {/* Fade zones — drawn UNDER markers so the line + handle sit on top */}
      <FadeZone start={trimStart}    end={fadeInEnd} />
      <FadeZone start={fadeOutStart} end={trimEnd}   />

      {/* Fade markers — green vertical line + grab handle on the inner edge */}
      <FadeMarker at={fadeInEnd}    label={`FADE IN · ${Math.round(fadeInClamped * 100)}%`}  onDragStart={startDrag(dragFadeIn)}  />
      <FadeMarker at={fadeOutStart} label={`FADE OUT · ${Math.round(fadeOutClamped * 100)}%`} right onDragStart={startDrag(dragFadeOut)} />

      {/* Trim markers — teal, on top of everything */}
      <TrimMarker at={trimStart} label={fmt ? fmt(trimStart) : '0:00'} onDragStart={startDrag(dragTrimStart)} />
      <TrimMarker at={trimEnd}   label={fmt ? fmt(trimEnd)   : '2:14'} right onDragStart={startDrag(dragTrimEnd)} />

      {/* Loop point — violet vertical marker (only if loopPoint is set) */}
      {loopPoint != null && (
        <LoopMarker at={loopPoint} onDragStart={startDrag(dragLoopPoint)} />
      )}

      {/* Playhead — gold; draggable to scrub */}
      <div style={{
        position: 'absolute', top: -4, bottom: -4, left: `${playhead * 100}%`,
        width: 2, background: 'var(--gold-bright)', zIndex: 4,
        boxShadow: '0 0 6px var(--gold-bright)',
      }}>
        <div
          onPointerDown={onPlayhead ? startDrag(dragPlayhead) : undefined}
          style={{
            position: 'absolute', top: -10, bottom: -8, left: -10, width: 22,
            cursor: onPlayhead ? 'ew-resize' : 'default',
            touchAction: 'none',
          }}
        />
        <div style={{
          position: 'absolute', top: -8, left: -6,
          width: 14, height: 14, background: 'var(--gold-bright)',
          clipPath: 'polygon(50% 100%, 0 0, 100% 0)',
          pointerEvents: 'none',
        }} />
      </div>
    </div>
  );
}

function TrimMarker({ at, label, right, onDragStart }) {
  return (
    <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${at * 100}%`, zIndex: 3 }}>
      {/* Wide invisible hit area so the marker is easy to grab */}
      <div
        onPointerDown={onDragStart}
        style={{
          position: 'absolute', top: -10, bottom: -24,
          left: -10, width: 22,
          cursor: onDragStart ? 'ew-resize' : 'default',
          touchAction: 'none',
        }}
      />
      <div style={{ width: 2, height: '100%', background: 'var(--mode-setup)', pointerEvents: 'none' }} />
      <div style={{
        position: 'absolute', top: -2, [right ? 'left' : 'right']: 2,
        width: 8, height: 14, background: 'var(--mode-setup)',
        clipPath: right ? 'polygon(0 0, 100% 50%, 0 100%)' : 'polygon(100% 0, 0 50%, 100% 100%)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: -22, [right ? 'right' : 'left']: -6,
        fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--mode-setup)',
        background: 'var(--sunk)', padding: '1px 4px',
        whiteSpace: 'nowrap', pointerEvents: 'none',
      }}>{label}</div>
    </div>
  );
}

// Green drag handle on the inner edge of a FadeZone. Sits on top of the
// zone band so the line + handle are draggable; the band itself stays
// pointer-events:none so it doesn't intercept clicks.
function FadeMarker({ at, label, right, onDragStart }) {
  return (
    <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${at * 100}%`, zIndex: 2 }}>
      <div
        onPointerDown={onDragStart}
        style={{
          position: 'absolute', top: -10, bottom: -24,
          left: -10, width: 22,
          cursor: onDragStart ? 'ew-resize' : 'default',
          touchAction: 'none',
        }}
      />
      <div style={{
        width: 0, height: '100%',
        borderLeft: '1px dashed var(--fade)',
        pointerEvents: 'none',
      }} />
      {/* Square handle (pixel-style, no border-radius) */}
      <div style={{
        position: 'absolute', top: '50%', [right ? 'right' : 'left']: -3,
        marginTop: -4,
        width: 7, height: 8, background: 'var(--fade)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', top: 4, [right ? 'right' : 'left']: 6,
        fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--fade)',
        letterSpacing: '.08em', whiteSpace: 'nowrap',
        pointerEvents: 'none',
      }}>{label}</div>
    </div>
  );
}

function FadeZone({ start, end }) {
  return (
    <div style={{
      position: 'absolute', top: 0, bottom: 0,
      left: `${start * 100}%`, width: `${(end - start) * 100}%`,
      background: 'linear-gradient(90deg, var(--fade-soft), transparent)',
      borderTop: '1px dashed var(--fade)',
      borderBottom: '1px dashed var(--fade)',
      zIndex: 1,
      pointerEvents: 'none',
    }} />
  );
}

// Violet draggable handle for the loop-restart point inside the audio.
function LoopMarker({ at, onDragStart }) {
  return (
    <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${at * 100}%`, zIndex: 3 }}>
      <div
        onPointerDown={onDragStart}
        style={{
          position: 'absolute', top: -10, bottom: -24, left: -10, width: 22,
          cursor: onDragStart ? 'ew-resize' : 'default',
          touchAction: 'none',
        }}
      />
      <div style={{
        width: 0, height: '100%',
        borderLeft: '1px dotted var(--pad-playlist)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', top: 4, left: -3, width: 7, height: 7,
        background: 'var(--pad-playlist)',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: -22, left: -8,
        fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--pad-playlist)',
        background: 'var(--sunk)', padding: '1px 4px',
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
      }}>LOOP</div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// COMBO EDITOR — chained sequence builder
// Interactive: steps are drag-reorderable, pad pills swap between
// steps, and the docked palette at the bottom lets you pull pads
// out of a step (drop on palette) or push them in (drop on a step).
// ═════════════════════════════════════════════════════════════════
function ComboEditorScreen() {
  const initialSteps = [
    { kind: 'play',  type: 'loop',     pad: 'Heartbeat',    dur: 'until next', note: 'set tension' },
    { kind: 'wait',  dur: '4.0s' },
    { kind: 'play',  type: 'single',   pad: 'Thunder',      dur: '0:03', note: 'one-shot stinger' },
    { kind: 'wait',  dur: '1.5s' },
    { kind: 'stop',  type: 'loop',     pad: 'Heartbeat' },
    { kind: 'play',  type: 'playlist', pad: 'Boss Theme',   dur: '3:24', note: 'loop until manual stop' },
  ];
  const initialPalette = [
    { type: 'single',   pad: 'Sword Clash',  dur: '0:02' },
    { type: 'loop',     pad: 'Rain Heavy',   dur: 'until next' },
    { type: 'single',   pad: 'Wolf Howl',    dur: '0:08' },
    { type: 'playlist', pad: 'Tavern Mix',   dur: '14 trax' },
  ];

  const [steps, setSteps]     = React.useState(initialSteps);
  const [palette, setPalette] = React.useState(initialPalette);
  // Tracks the active drag. type=step → reorder; type=pad → swap/move pad
  //   src.from = 'step' | 'palette'
  //   src.idx  = source index in that list
  const [drag, setDrag]       = React.useState(null);
  const [hover, setHover]     = React.useState(null);  // { zone: 'step'|'palette', idx: number|null }

  const handleStepDragStart = (e, idx) => {
    setDrag({ type: 'step', from: 'step', idx });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', 'step:' + idx);
  };
  const handlePadDragStart = (e, from, idx) => {
    e.stopPropagation();
    setDrag({ type: 'pad', from, idx });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', 'pad:' + from + ':' + idx);
  };
  const handleDragEnd = () => {
    setDrag(null);
    setHover(null);
  };
  const handleStepDragOver = (e, idx) => {
    if (!drag) return;
    e.preventDefault();
    setHover({ zone: 'step', idx });
  };
  const handlePaletteDragOver = (e) => {
    if (!drag || drag.type !== 'pad' || drag.from !== 'step') return;
    e.preventDefault();
    setHover({ zone: 'palette', idx: null });
  };

  const dropOnStep = (e, dstIdx) => {
    e.preventDefault();
    if (!drag) { handleDragEnd(); return; }

    if (drag.type === 'step') {
      // Reorder
      if (drag.idx === dstIdx) { handleDragEnd(); return; }
      setSteps((prev) => {
        const next = [...prev];
        const [moved] = next.splice(drag.idx, 1);
        next.splice(dstIdx, 0, moved);
        return next;
      });
    } else if (drag.type === 'pad') {
      // Pad drop on a step body
      const dst = steps[dstIdx];
      if (dst.kind === 'wait') {
        // Promote wait → play with the new pad
        if (drag.from === 'palette') {
          const src = palette[drag.idx];
          setSteps((prev) => prev.map((s, i) => i === dstIdx ? { kind: 'play', ...src, note: '' } : s));
          setPalette((prev) => prev.filter((_, i) => i !== drag.idx).concat({ ...dst, type: 'single', pad: '—' }));
        }
        // From step → can't drop pad onto wait without source rules; ignore for now
      } else {
        // dst is play/stop — swap pad content
        if (drag.from === 'step') {
          const src = steps[drag.idx];
          if (src.kind === 'wait' || drag.idx === dstIdx) { handleDragEnd(); return; }
          setSteps((prev) => prev.map((s, i) => {
            if (i === drag.idx) return { ...s, pad: dst.pad, type: dst.type, dur: dst.dur, note: dst.note };
            if (i === dstIdx)   return { ...s, pad: src.pad, type: src.type, dur: src.dur, note: src.note };
            return s;
          }));
        } else {
          // From palette → swap dst's pad into palette, take palette pad into dst
          const src = palette[drag.idx];
          setSteps((prev) => prev.map((s, i) => i === dstIdx ? { ...s, pad: src.pad, type: src.type, dur: src.dur } : s));
          setPalette((prev) => prev.map((p, i) => i === drag.idx ? { type: dst.type, pad: dst.pad, dur: dst.dur } : p));
        }
      }
    }
    handleDragEnd();
  };

  const dropOnPalette = (e) => {
    e.preventDefault();
    if (!drag || drag.type !== 'pad' || drag.from !== 'step') { handleDragEnd(); return; }
    const src = steps[drag.idx];
    if (src.kind === 'wait') { handleDragEnd(); return; }
    setSteps((prev) => prev.map((s, i) => i === drag.idx ? { kind: 'wait', dur: '1.0s' } : s));
    setPalette((prev) => prev.concat({ type: src.type, pad: src.pad, dur: src.dur }));
    handleDragEnd();
  };

  return (
    <div className="sb" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <TopBarV2 title="Combo Editor" breadcrumb="The Tavern · Boss Reveal" right={
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="sb-btn sb-btn-sm sb-btn-ghost"><PixelIcon name="play" size={11} /> PREVIEW</button>
          <button className="sb-btn sb-btn-sm sb-btn-filled"><PixelIcon name="save" size={11} /> SAVE</button>
        </div>
      } />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', flex: 1, minHeight: 0 }}>
        <main style={{ background: 'var(--surface)', padding: 18, overflow: 'auto', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <div style={{ width: 6, height: 48, background: 'var(--pad-combo)' }} />
            <div>
              <div className="sb-mono" style={{ fontSize: 11, color: 'var(--text-mute)', letterSpacing: '.1em', textTransform: 'uppercase' }}>COMBO</div>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: 22, color: 'var(--text)', letterSpacing: '.04em' }}>BOSS REVEAL</div>
            </div>
            <div style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-mute)' }}>
              {steps.length} steps
            </div>
          </div>

          <SectionLabel glyph="rune">SEQUENCE</SectionLabel>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {steps.map((s, i) => (
              <ComboStep
                key={i} idx={i + 1} {...s}
                last={i === steps.length - 1}
                isDragging={drag?.from === 'step' && drag.idx === i}
                isOver={hover?.zone === 'step' && hover.idx === i && !(drag?.from === 'step' && drag.idx === i)}
                hoverKind={drag?.type}
                onStepDragStart={(e) => handleStepDragStart(e, i)}
                onPadDragStart={(e) => handlePadDragStart(e, 'step', i)}
                onDragOver={(e) => handleStepDragOver(e, i)}
                onDragLeave={() => setHover(null)}
                onDragEnd={handleDragEnd}
                onDrop={(e) => dropOnStep(e, i)}
              />
            ))}
            <button className="sb-btn sb-btn-sm sb-btn-ghost" style={{ alignSelf: 'flex-start', marginTop: 10 }}>+ ADD STEP</button>
          </div>

          {/* ── Pad palette ── drag pads in to fill a step, or out
              by dropping a step's pad onto the palette area ── */}
          <div
            onDragOver={handlePaletteDragOver}
            onDragLeave={() => setHover(null)}
            onDrop={dropOnPalette}
            style={{
              marginTop: 24, marginBottom: 4,
              padding: 12,
              background: 'var(--deep)',
              border: '1px dashed ' + (hover?.zone === 'palette' ? 'var(--gold-bright)' : 'var(--border-soft)'),
              transition: 'border-color .12s',
            }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
              <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11, letterSpacing: '.14em', color: 'var(--gold)', textTransform: 'uppercase' }}>Pad Palette</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-mute)' }}>
                {hover?.zone === 'palette'
                  ? '↳ drop hier um aus Step zu entfernen'
                  : 'drag in einen Step · oder ziehe einen Step-Pad heraus'}
              </span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {palette.length === 0 ? (
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-mute)', fontStyle: 'italic' }}>// palette leer</span>
              ) : palette.map((p, i) => (
                <span
                  key={p.pad + i}
                  draggable
                  onDragStart={(e) => handlePadDragStart(e, 'palette', i)}
                  onDragEnd={handleDragEnd}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '5px 10px',
                    background: 'var(--raised)',
                    borderLeft: '2px solid var(--pad-' + p.type + ')',
                    fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--text)',
                    cursor: 'grab',
                    userSelect: 'none',
                    opacity: drag?.from === 'palette' && drag.idx === i ? 0.4 : 1,
                  }}>
                  <span className={'sb-pill is-' + (p.type === 'loop' ? 'loop' : p.type === 'playlist' ? 'playlist' : p.type === 'combo' ? 'combo' : 'on')} style={{ fontSize: 8, padding: '0 5px' }}>{p.type.toUpperCase()}</span>
                  {p.pad}
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-mute)' }}>{p.dur}</span>
                </span>
              ))}
            </div>
          </div>
        </main>

        <aside className="sb-inspector">
          <PanelHeaderV2 icon="cog" title="STEP — THUNDER" active />
          <div className="sb-inspector-section" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <KvRow label="ACTION"  right={
              <div style={{ display: 'flex', gap: 4 }}>
                <span className="sb-pill is-on" style={{ fontSize: 9 }}>PLAY</span>
                <span className="sb-pill" style={{ fontSize: 9 }}>STOP</span>
                <span className="sb-pill" style={{ fontSize: 9 }}>WAIT</span>
              </div>
            } />
            <KvRow label="PAD"     right={<span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)' }}>Thunder ▾</span>} />
            <KvRow label="WAIT"    right={<span className="sb-num">1.5s</span>} />
            <KvRow label="FADE"    right={<span className="sb-num">0.2s</span>} />
            <KvRow label="VOL OFS" right={<span className="sb-num">+0 dB</span>} />
          </div>

          <PanelHeaderV2 icon="key" title="TRIGGER" />
          <div className="sb-inspector-section" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <KvRow label="KEY"    right={<span className="sb-num is-active">Q</span>} />
            <KvRow label="MODE"   right={
              <div style={{ display: 'flex', gap: 4 }}>
                <span className="sb-pill is-on" style={{ fontSize: 9 }}>AUTO</span>
                <span className="sb-pill" style={{ fontSize: 9 }}>STEP</span>
              </div>
            } />
            <KvRow label="REPEAT" right={<span className="sb-num">1×</span>} />
          </div>

          <div style={{ flex: 1 }} />
          <div style={{ padding: 12, borderTop: '1px solid var(--border-soft)' }}>
            <button className="sb-btn sb-btn-sm sb-btn-danger" style={{ width: '100%' }}>
              <PixelIcon name="stop" size={10} /> DELETE STEP
            </button>
          </div>
        </aside>
      </div>

      <StatusBarV2 mode="setup" board="Combo Editor · Boss Reveal" info={steps.length + ' steps · ' + palette.length + ' in palette'} right={<><span>auto-advance</span></>} />
    </div>
  );
}

function ComboStep({
  idx, kind, type, pad, dur, note, last,
  isDragging, isOver, hoverKind,
  onStepDragStart, onPadDragStart, onDragOver, onDragLeave, onDragEnd, onDrop,
}) {
  const color = kind === 'wait' ? 'var(--text-mute)' : kind === 'stop' ? 'var(--blood)' : `var(--pad-${type || 'single'})`;
  return (
    <div
      draggable
      onDragStart={onStepDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDragEnd={onDragEnd}
      onDrop={onDrop}
      style={{
        display: 'flex', alignItems: 'stretch', gap: 0,
        opacity: isDragging ? 0.4 : 1,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}>
      {/* Step number gutter */}
      <div style={{ width: 36, position: 'relative', flex: '0 0 36px' }}>
        <div style={{
          width: 26, height: 26,
          background: kind === 'wait' ? 'var(--sunk)' : color,
          color: kind === 'wait' ? 'var(--text-mute)' : 'var(--text-on-gold)',
          margin: '6px auto 0',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-ui)', fontSize: 13,
          position: 'relative', zIndex: 1,
        }}>{idx}</div>
        {!last && <div style={{ position: 'absolute', top: 32, bottom: -8, left: '50%', width: 2, background: 'var(--border)', transform: 'translateX(-50%)' }} />}
      </div>

      <div style={{
        flex: 1,
        background: 'var(--raised)',
        borderLeft: `3px solid ${color}`,
        // Outline reflects drop intent: gold-bright for step reorder,
        // teal for pad-swap to make the affordance distinct.
        outline: isOver
          ? '2px solid ' + (hoverKind === 'pad' ? 'var(--mode-setup)' : 'var(--gold-bright)')
          : 'none',
        outlineOffset: '-2px',
        padding: '10px 14px',
        marginBottom: 6,
        display: 'flex', alignItems: 'center', gap: 14,
        transition: 'outline-color .12s',
      }}>
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color, letterSpacing: '.14em', minWidth: 56 }}>
          {kind.toUpperCase()}
        </span>
        {kind !== 'wait' && (
          <>
            <span className={'sb-pill is-' + (type === 'loop' ? 'loop' : type === 'playlist' ? 'playlist' : type === 'combo' ? 'combo' : 'on')} style={{ fontSize: 9 }}>
              {(type || 'single').toUpperCase()}
            </span>
            {/* Pad name itself is the drag handle for moving pads
                between steps or out to the palette. */}
            <span
              draggable
              onDragStart={onPadDragStart}
              onDragEnd={onDragEnd}
              style={{
                fontFamily: 'var(--font-ui)', fontSize: 14, color: 'var(--text)',
                cursor: 'grab',
                padding: '1px 4px',
                marginLeft: -4,
                borderBottom: '1px dotted var(--text-mute)',
                userSelect: 'none',
              }}>{pad}</span>
          </>
        )}
        {dur && <span className="sb-num">{dur}</span>}
        {note && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-mute)', marginLeft: 'auto' }}>// {note}</span>}
        <PixelIcon name="edit" size={11} color="var(--text-mute)" />
      </div>
    </div>
  );
}

Object.assign(window, {
  StartScreen, BoardV2, LibraryV2, PadEditorScreen, ComboEditorScreen,
  TopBarV2, StatusBarV2, PanelHeaderV2, KvRow, MixerRowV2, LabelSliderV2,
});
