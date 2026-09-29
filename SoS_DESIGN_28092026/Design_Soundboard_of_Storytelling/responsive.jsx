// responsive.jsx — Tablet & phone variants of the key screens.
// They reuse the same atoms but lay them out vertically.

// ── Phone Home (375×812) ─────────────────────────────────────────
function PhoneHomeScreen() {
  return (
    <div className="sb" style={{ padding: '36px 18px', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'auto' }}>
      <div style={{ alignSelf: 'center', marginTop: 6, marginBottom: 10 }}>
        <FlameLogo size={52} />
      </div>
      <div className="sb-display" style={{ fontSize: 26, textAlign: 'center', marginBottom: 6 }}>
        Soundboard of<br/>Storytelling
      </div>
      <div className="sb-mono" style={{ fontSize: 12, textAlign: 'center', marginBottom: 22 }}>
        A tool for Game-Masters
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <MenuRow icon="flame" title="BOARD" sub="Board 1" active />
        <MenuRow icon="book"  title="LIBRARY" sub="Audio · icons · boards" />
        <MenuRow icon="cog"   title="SETTINGS" sub="Theme & start mode" />
        <MenuRow icon="bulb"  title="TIPS & TRICKS" sub="Key bindings" />
        <MenuRow icon="info"  title="ABOUT" sub="What this is" />
      </div>

      <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
        <div className="sb-menu-row" style={{ flex: 1, justifyContent: 'center', '--pix-border': 'var(--sb-border-danger)', padding: 10 }}>
          <div style={{ color: 'var(--sb-danger)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <PixelIcon name="save" size={14} />
            <span style={{ fontFamily: 'var(--sb-font-ui)', fontWeight: 700, fontSize: 12, letterSpacing: '.1em' }}>BACKUP</span>
            <span style={{ fontFamily: 'var(--sb-font-mono)', fontSize: 11, opacity: .7 }}>· never</span>
          </div>
        </div>
        <button className="sb-btn" style={{ fontSize: 11, padding: '8px 12px' }}>
          <PixelIcon name="download" size={12} />
        </button>
      </div>
    </div>
  );
}

// ── Phone Board (375×812) — pads only, edit mode hides chrome ────
function PhoneBoardScreen() {
  const PADS = [
    { t: 'Tavern Door',  m: '0:04', k: 'F1', tag: 'STINGER' },
    { t: 'Rain Heavy',   m: '2:14', k: 'F2', tag: 'AMBIENT', playing: true },
    { t: 'Fireplace',    m: '∞',    k: 'F3', tag: 'LOOP', loop: true },
    { t: 'Sword Clash',  m: '0:02', k: 'F4', tag: 'STINGER' },
    { t: 'Wolf Howl',    m: '0:08', k: 'F5', tag: 'STINGER' },
    { t: 'Crowd Murmur', m: '1:30', k: 'F6', tag: 'LOOP' },
    { t: 'Heartbeat',    m: '∞',    k: 'F7', tag: 'LOOP' },
    { t: 'Thunder',      m: '0:03', k: 'F8', tag: 'STINGER' },
  ];
  return (
    <div className="sb" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '14px 16px',
        borderBottom: '1px solid var(--sb-border)',
        background: 'var(--sb-bg-deep)',
      }}>
        <PixelIcon name="flame" size={18} />
        <div style={{ flex: 1 }}>
          <div className="sb-display" style={{ fontSize: 18 }}>The Tavern</div>
          <div className="sb-caption">Board 1 · 16 pads</div>
        </div>
        <PixelIcon name="search" size={14} />
        <PixelIcon name="cog" size={14} />
      </div>

      {/* Now-playing strip across the top */}
      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6, borderBottom: '1px solid var(--sb-border)' }}>
        <MixerStrip title="RAIN · HEAVY" sub="ambient · 38%" value={0.38} />
      </div>

      <div style={{ padding: 12, overflow: 'auto', flex: 1 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
          {PADS.map((p) => (
            <Pad key={p.t} title={p.t} meta={p.m} hotkey={p.k} tag={p.tag} playing={p.playing} loop={p.loop} />
          ))}
        </div>
      </div>

      {/* Bottom transport */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '12px 14px',
        borderTop: '1px solid var(--sb-border)',
        background: 'var(--sb-bg-deep)',
      }}>
        <button className="sb-btn sb-btn-ghost" style={{ padding: '6px 10px' }}><PixelIcon name="stop" size={10} /> STOP ALL</button>
        <div style={{ flex: 1 }}>
          <LabelSlider label="MASTER" value={0.72} />
        </div>
      </div>
    </div>
  );
}

// ── Tablet Board (834×1112 landscape-ish) — 2-column ────────────
function TabletBoardScreen() {
  const PADS = [
    { t: 'Tavern Door',  m: '0:04 · one-shot', k: 'F1', tag: 'STINGER' },
    { t: 'Rain Heavy',   m: '2:14 · ambient',  k: 'F2', tag: 'AMBIENT', playing: true },
    { t: 'Fireplace',    m: '∞ · loop',         k: 'F3', tag: 'LOOP', loop: true },
    { t: 'Sword Clash',  m: '0:02',             k: 'F4', tag: 'STINGER' },
    { t: 'Wolf Howl',    m: '0:08',             k: 'F5', tag: 'STINGER' },
    { t: 'Crowd Murmur', m: '1:30 · loop',      k: 'F6', tag: 'LOOP' },
    { t: 'Heartbeat',    m: '∞ · loop',          k: 'F7', tag: 'LOOP' },
    { t: 'Thunder',      m: '0:03',             k: 'F8', tag: 'STINGER' },
    { t: 'Footsteps',    m: '0:12 · loop',      k: 'Q',  tag: 'LOOP' },
    { t: 'Door Slam',    m: '0:01',             k: 'W',  tag: 'STINGER' },
    { t: 'Boss Theme',   m: '3:24 · music',     k: 'E',  tag: 'MUSIC' },
    { t: 'Whispers',     m: '0:30 · loop',      k: 'R',  tag: 'LOOP' },
  ];
  return (
    <div className="sb" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <TopBar title="The Tavern" sub="// Board 1 · 12 pads" right={
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="sb-btn"><PixelIcon name="edit" size={12} /></button>
          <button className="sb-btn sb-btn-primary"><PixelIcon name="play" size={12} /></button>
        </div>
      } />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', flex: 1, minHeight: 0 }}>
        <main style={{ padding: 18, overflow: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {PADS.map((p) => (
              <Pad key={p.t} title={p.t} meta={p.m} hotkey={p.k} tag={p.tag} playing={p.playing} loop={p.loop} />
            ))}
          </div>
        </main>
        <aside style={{ borderLeft: '1px solid var(--sb-border)', padding: 14, background: 'var(--sb-bg-deep)' }}>
          <div className="sb-label" style={{ fontSize: 11, color: 'var(--sb-text-dim)', marginBottom: 10 }}>NOW PLAYING</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 18 }}>
            <MixerStrip title="RAIN" sub="ambient · 38%" value={0.38} />
            <MixerStrip title="FIRE" sub="loop · 60%" value={0.6} loop />
          </div>
          <div className="sb-label" style={{ fontSize: 11, color: 'var(--sb-text-dim)', marginBottom: 10 }}>MASTER</div>
          <div className="sb-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <LabelSlider label="MASTER" value={0.72} />
            <LabelSlider label="AMBIENT" value={0.45} />
            <LabelSlider label="STINGER" value={0.9} />
          </div>
        </aside>
      </div>
    </div>
  );
}

// ── Hierarchy diagram — a simple site map of the menu structure ─
function HierarchyArtboard() {
  const Node = ({ label, sub, color, big }) => (
    <div style={{
      padding: big ? '10px 14px' : '7px 11px',
      background: 'var(--sb-bg-panel)',
      border: '1px solid ' + (color || 'var(--sb-border)'),
      borderRadius: 6,
      fontFamily: 'var(--sb-font-ui)',
      fontWeight: 600,
      fontSize: big ? 13 : 12,
      color: color || 'var(--sb-text)',
      letterSpacing: '.06em',
      textTransform: 'uppercase',
      textAlign: 'center',
      minWidth: 100,
    }}>
      <div>{label}</div>
      {sub && <div className="sb-mono" style={{ fontSize: 10, marginTop: 2, textTransform: 'none', letterSpacing: 0 }}>{sub}</div>}
    </div>
  );
  const Branch = ({ children }) => (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
      {children}
    </div>
  );
  return (
    <div className="sb" style={{ padding: 28, overflow: 'auto', height: '100%' }}>
      <div style={{ marginBottom: 18 }}>
        <div className="sb-display" style={{ fontSize: 36 }}>Information Hierarchy</div>
        <div className="sb-mono" style={{ fontSize: 13, marginTop: 4 }}>
          // five top-level destinations. Board is primary; everything else supports it.
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
        <Node label="HOME" sub="entry / launcher" color="var(--sb-amber)" big />
      </div>

      <div style={{
        height: 24, position: 'relative', marginBottom: -1,
        backgroundImage: 'linear-gradient(var(--sb-border), var(--sb-border))',
        backgroundSize: '1px 100%',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 18, alignItems: 'start' }}>
        <Branch>
          <Node label="BOARD" color="var(--sb-amber)" big />
          <div style={{ height: 12, width: 1, background: 'var(--sb-border)' }} />
          <Node label="Scene list" />
          <Node label="Pad grid" sub="play / loop / edit" />
          <Node label="Mixer" sub="now playing · master" />
        </Branch>

        <Branch>
          <Node label="LIBRARY" big />
          <div style={{ height: 12, width: 1, background: 'var(--sb-border)' }} />
          <Node label="Sounds" sub="audio files" />
          <Node label="Icons" sub="pad art" />
          <Node label="Boards" sub="saved layouts" />
        </Branch>

        <Branch>
          <Node label="SETTINGS" big />
          <div style={{ height: 12, width: 1, background: 'var(--sb-border)' }} />
          <Node label="Appearance" sub="theme · size" />
          <Node label="Audio" sub="buses · output" />
          <Node label="Behavior" sub="crossfade · autosave" />
          <Node label="Shortcuts" />
          <Node label="Data" sub="backup · import" />
        </Branch>

        <Branch>
          <Node label="TIPS & TRICKS" big />
          <div style={{ height: 12, width: 1, background: 'var(--sb-border)' }} />
          <Node label="Key bindings" />
          <Node label="Workflows" />
        </Branch>

        <Branch>
          <Node label="ABOUT" big />
          <div style={{ height: 12, width: 1, background: 'var(--sb-border)' }} />
          <Node label="Version" />
          <Node label="Credits" />
          <Node label="License" />
        </Branch>
      </div>

      <div style={{ marginTop: 30, padding: 14, background: 'var(--sb-bg-panel-sunk)', border: '1px solid var(--sb-border-soft)', borderRadius: 8 }}>
        <div className="sb-label" style={{ fontSize: 10, color: 'var(--sb-text-dim)', marginBottom: 4 }}>RULE</div>
        <div className="sb-mono" style={{ fontSize: 12 }}>
          Two levels deep. Anything that would push to a third level becomes a tab or accordion inside its parent —
          never a new screen. This is what keeps orientation easy: every destination is one click from Home.
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { PhoneHomeScreen, PhoneBoardScreen, TabletBoardScreen, HierarchyArtboard });
