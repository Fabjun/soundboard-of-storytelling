// screens.jsx — Full desktop screen mockups for the app.
// Each artboard is 1280×800 and uses tokens + components only — no
// new colors or one-off styles. Imports come from window.*

// ════════════════════════════════════════════════════════════════
// HOME — the entry screen. Recreates the structure from the user's
// screenshot but in our design-system pixels: pixel-flame logo,
// glowing CRT title, mono italic subtitle, 5 menu rows + footer.
// ════════════════════════════════════════════════════════════════
function HomeScreen({ compact }) {
  const titleSize = compact ? 36 : 56;
  return (
    <div className="sb" style={{ padding: compact ? 24 : 56, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
      {/* Logo with corner brackets — frames the emblem as the page's anchor */}
      <div style={{ position: 'relative', marginTop: compact ? 8 : 24, marginBottom: compact ? 12 : 18, padding: '10px 14px' }}>
        <FlameLogo size={compact ? 56 : 76} />
        <span style={{ position: 'absolute', top: 0, left: 0, width: 12, height: 12, borderTop: '2px solid var(--sb-amber)', borderLeft: '2px solid var(--sb-amber)' }} />
        <span style={{ position: 'absolute', top: 0, right: 0, width: 12, height: 12, borderTop: '2px solid var(--sb-amber)', borderRight: '2px solid var(--sb-amber)' }} />
        <span style={{ position: 'absolute', bottom: 0, left: 0, width: 12, height: 12, borderBottom: '2px solid var(--sb-amber)', borderLeft: '2px solid var(--sb-amber)' }} />
        <span style={{ position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderBottom: '2px solid var(--sb-amber)', borderRight: '2px solid var(--sb-amber)' }} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 14 }}>
        <PixelIcon name="sparkle" size={compact ? 14 : 18} color="var(--sb-amber)" />
        <div className="sb-display" style={{ fontSize: titleSize, textAlign: 'center' }}>
          Soundboard of Storytelling
        </div>
        <PixelIcon name="sparkle" size={compact ? 14 : 18} color="var(--sb-amber)" />
      </div>

      <div className="sb-mono" style={{ fontSize: compact ? 13 : 15, textAlign: 'center', maxWidth: 480, marginBottom: 6 }}>
        A tool for Game-Masters
      </div>
      <div className="sb-mono" style={{ fontSize: compact ? 13 : 15, textAlign: 'center', maxWidth: 480, marginBottom: 14 }}>
        and other creative Creatures
      </div>

      <div style={{ width: '100%', maxWidth: 320, marginBottom: 14 }}>
        <PixelDivider glyph="diamond" margin={0} />
      </div>

      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 20, color: 'var(--sb-text-mute)' }}>
        <span style={{ fontFamily: 'var(--sb-font-mono)', fontStyle: 'italic', fontSize: 12 }}>v 150</span>
        <PixelIcon name="save" size={12} />
      </div>

      <div style={{
        width: '100%', maxWidth: 880,
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14,
        marginBottom: 14,
      }}>
        <MenuRow icon="flame" title="BOARD" sub="Board 1" active />
        <MenuRow icon="book"  title="LIBRARY" sub="Audio, icons & boards" />
        <MenuRow icon="cog"   title="SETTINGS" sub="Theme, font size & start mode" />
        <MenuRow icon="bulb"  title="TIPS & TRICKS" sub="Controls and key bindings" />
        <MenuRow icon="info"  title="ABOUT" sub="What this is and how it works" />
      </div>

      <div style={{ width: '100%', maxWidth: 880, display: 'flex', gap: 14 }}>
        <div className="sb-menu-row" style={{
          flex: 1, justifyContent: 'center',
          '--pix-border': 'var(--sb-border-danger)',
          color: 'var(--sb-danger)',
          padding: '12px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--sb-danger)' }}>
            <PixelIcon name="save" size={16} />
            <span style={{ fontFamily: 'var(--sb-font-ui)', fontWeight: 700, letterSpacing: '.1em', fontSize: 13 }}>BACKUP</span>
            <span style={{ fontFamily: 'var(--sb-font-mono)', fontSize: 12, opacity: .75 }}>· never</span>
          </div>
        </div>
        <button className="sb-btn" style={{ minWidth: 140 }}>
          <PixelIcon name="download" size={14} /> IMPORT
        </button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// BOARD — the live soundboard. Left: scenes. Middle: pads. Right:
// now-playing mixer + master.
// ════════════════════════════════════════════════════════════════
function BoardScreen() {
  const SCENES = ['Approach', 'The Tavern', 'Combat — Forest', 'Boss · Necromancer', 'Aftermath'];
  const PADS = [
    { t: 'Tavern Door',     m: '0:04 · one-shot', k: 'F1', tag: 'STINGER' },
    { t: 'Rain Heavy',      m: '2:14 · ambient',  k: 'F2', tag: 'AMBIENT', playing: true },
    { t: 'Fireplace',       m: '∞ · loop',        k: 'F3', tag: 'LOOP',    loop: true },
    { t: 'Sword Clash',     m: '0:02',            k: 'F4', tag: 'STINGER' },
    { t: 'Wolf Howl',       m: '0:08',            k: 'F5', tag: 'STINGER' },
    { t: 'Crowd Murmur',    m: '1:30 · loop',     k: 'F6', tag: 'LOOP' },
    { t: 'Heartbeat',       m: '∞ · loop',        k: 'F7', tag: 'LOOP' },
    { t: 'Thunder Crack',   m: '0:03',            k: 'F8', tag: 'STINGER' },
    { t: 'Footsteps Stone', m: '0:12 · loop',     k: 'Q',  tag: 'LOOP' },
    { t: 'Door Slam',       m: '0:01',            k: 'W',  tag: 'STINGER' },
    { t: 'Boss Theme',      m: '3:24 · music',    k: 'E',  tag: 'MUSIC' },
    { t: 'Whispers',        m: '0:30 · loop',     k: 'R',  tag: 'LOOP' },
    { t: 'Coin Drop',       m: '0:01',            k: 'T',  tag: 'STINGER' },
    { t: 'Owl Hoot',        m: '0:04',            k: 'Y',  tag: 'STINGER' },
    { t: 'Wind Soft',       m: '∞ · loop',        k: 'U',  tag: 'LOOP' },
    { t: 'Bell Toll',       m: '0:06',            k: 'I',  tag: 'STINGER' },
  ];

  return (
    <div className="sb" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <TopBar title="The Tavern" sub="// Board 1  ·  16 pads  ·  2 playing" right={
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="sb-btn"><PixelIcon name="edit" size={12} /> EDIT</button>
          <button className="sb-btn sb-btn-primary"><PixelIcon name="play" size={12} /> START</button>
        </div>
      } />

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 260px', gap: 0, flex: 1, minHeight: 0 }}>
        {/* Left rail · scenes */}
        <aside style={{ borderRight: '1px solid var(--sb-border)', padding: '14px 12px', overflow: 'auto', background: 'var(--sb-bg-deep)' }}>
          <SectionLabel glyph="moon">SCENES</SectionLabel>
          {SCENES.map((s, i) => (
            <div key={s} style={{
              padding: '8px 10px', borderRadius: 6, marginBottom: 4,
              background: i === 1 ? 'var(--sb-bg-panel-2)' : 'transparent',
              border: i === 1 ? '1px solid var(--sb-border-active)' : '1px solid transparent',
              fontFamily: 'var(--sb-font-ui)', fontWeight: 600, fontSize: 13,
              color: i === 1 ? 'var(--sb-amber)' : 'var(--sb-text-dim)',
              letterSpacing: '.04em',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <span style={{ width: 16, fontFamily: 'var(--sb-font-mono)', fontSize: 10, color: 'var(--sb-text-mute)' }}>{i + 1}.</span>
              {s}
            </div>
          ))}
          <button className="sb-btn sb-btn-ghost" style={{ width: '100%', marginTop: 10, fontSize: 11 }}>+ ADD SCENE</button>

          <div style={{ marginTop: 22 }}>
            <SectionLabel glyph="tag">TAGS</SectionLabel>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              <Pill on>AMBIENT</Pill>
              <Pill>STINGER</Pill>
              <Pill>LOOP</Pill>
              <Pill>MUSIC</Pill>
            </div>
          </div>
        </aside>

        {/* Centre · pad grid */}
        <main style={{ padding: 18, overflow: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
            <div className="sb-display" style={{ fontSize: 28 }}>The Tavern</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span className="sb-caption">FILTER</span>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '5px 10px',
                background: 'var(--sb-bg-panel-sunk)',
                border: '1px solid var(--sb-border)',
                borderRadius: 16,
                color: 'var(--sb-text-mute)',
              }}>
                <PixelIcon name="search" size={12} />
                <span className="sb-mono" style={{ fontSize: 11 }}>Search pads…</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {PADS.map((p) => (
              <Pad key={p.t} title={p.t} meta={p.m} hotkey={p.k} tag={p.tag} playing={p.playing} loop={p.loop} />
            ))}
          </div>
        </main>

        {/* Right rail · mixer */}
        <aside style={{ borderLeft: '1px solid var(--sb-border)', padding: '14px 14px', overflow: 'auto', background: 'var(--sb-bg-deep)' }}>
          <SectionLabel glyph="sparkle">NOW PLAYING</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 22 }}>
            <MixerStrip title="RAIN · HEAVY" sub="ambient · 38%" value={0.38} />
            <MixerStrip title="FIREPLACE"    sub="loop · 60%"     value={0.60} loop />
          </div>

          <SectionLabel glyph="diamond">MASTER</SectionLabel>
          <div className="sb-card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <LabelSlider label="MASTER" value={0.72} />
            <LabelSlider label="AMBIENT BUS" value={0.45} />
            <LabelSlider label="STINGER BUS" value={0.90} />
            <LabelSlider label="MUSIC BUS" value={0.60} />
          </div>

          <div style={{ marginTop: 22 }}>
            <SectionLabel glyph="rune">QUICK</SectionLabel>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <button className="sb-btn sb-btn-ghost"><PixelIcon name="stop" size={10} /> STOP ALL</button>
            <button className="sb-btn sb-btn-ghost"><PixelIcon name="loop" size={12} /> CROSSFADE TO NEXT</button>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// LIBRARY — three tabs: Sounds, Icons, Boards. Showing Sounds.
// ════════════════════════════════════════════════════════════════
function LibraryScreen() {
  const SOUNDS = [
    ['Tavern Door',     '0:04', 'stinger',  'door_tavern.ogg'],
    ['Rain Heavy',      '2:14', 'ambient',  'rain_heavy.ogg'],
    ['Rain Light',      '2:42', 'ambient',  'rain_light.ogg'],
    ['Fireplace',       '∞',   'loop',     'fire_loop.ogg'],
    ['Sword Clash',     '0:02', 'stinger',  'sword_01.ogg'],
    ['Wolf Howl',       '0:08', 'stinger',  'wolf.ogg'],
    ['Crowd Murmur',    '1:30', 'loop',     'crowd_murmur.ogg'],
    ['Heartbeat',       '∞',   'loop',     'heart.ogg'],
    ['Thunder Crack',   '0:03', 'stinger',  'thunder.ogg'],
    ['Whispers',        '0:30', 'loop',     'whispers.ogg'],
    ['Boss Theme',      '3:24', 'music',    'boss_theme.ogg'],
    ['Bell Toll',       '0:06', 'stinger',  'bell.ogg'],
  ];
  return (
    <div className="sb" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <TopBar title="Library" sub="// Audio, icons & boards" right={
        <button className="sb-btn sb-btn-primary"><PixelIcon name="download" size={12} /> IMPORT FILES</button>
      } />
      <div style={{ padding: '0 22px' }}>
        <Tabs items={['SOUNDS  · 124', 'ICONS  · 42', 'BOARDS  · 6']} active={'SOUNDS  · 124'} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 280px', gap: 0, flex: 1, minHeight: 0 }}>
        {/* Left · facet rail */}
        <aside style={{ padding: '16px 16px', borderRight: '1px solid var(--sb-border)', overflow: 'auto' }}>
          <SectionLabel glyph="book">CATEGORY</SectionLabel>
          {['All sounds', 'Ambient', 'Loops', 'Stingers', 'Music', 'Voice'].map((c, i) => (
            <div key={c} style={{
              padding: '6px 0', fontFamily: 'var(--sb-font-ui)', fontWeight: 500, fontSize: 13,
              color: i === 0 ? 'var(--sb-amber)' : 'var(--sb-text-dim)',
              display: 'flex', justifyContent: 'space-between',
            }}>
              <span>{c}</span>
              <span style={{ fontFamily: 'var(--sb-font-mono)', fontSize: 11, color: 'var(--sb-text-mute)' }}>
                {[124, 28, 32, 41, 14, 9][i]}
              </span>
            </div>
          ))}
          <div style={{ marginTop: 22 }}>
            <SectionLabel glyph="tag">TAGS</SectionLabel>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {['rain', 'forest', 'tavern', 'combat', 'magic', 'crowd', 'storm', 'night'].map((t) => (
              <span key={t} style={{
                fontFamily: 'var(--sb-font-mono)', fontStyle: 'italic', fontSize: 11,
                color: 'var(--sb-text-dim)',
                border: '1px solid var(--sb-border-soft)',
                borderRadius: 999, padding: '2px 8px',
              }}>{t}</span>
            ))}
          </div>
        </aside>

        {/* Centre · table */}
        <main style={{ padding: '16px 18px', overflow: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{
              flex: 1,
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 12px',
              background: 'var(--sb-bg-panel-sunk)',
              border: '1px solid var(--sb-border)',
              borderRadius: 8,
              color: 'var(--sb-text-mute)',
            }}>
              <PixelIcon name="search" size={14} />
              <span className="sb-mono" style={{ fontSize: 13 }}>Search 124 sounds…</span>
            </div>
            <button className="sb-btn sb-btn-ghost">SORT · NEWEST</button>
          </div>

          <div style={{
            background: 'var(--sb-bg-panel)',
            border: '1px solid var(--sb-border)',
            borderRadius: 10,
            overflow: 'hidden',
          }}>
            <div style={{
              display: 'grid', gridTemplateColumns: '32px 1fr 80px 110px 1fr 32px',
              gap: 10,
              padding: '10px 14px',
              background: 'var(--sb-bg-panel-sunk)',
              borderBottom: '1px solid var(--sb-border)',
              fontFamily: 'var(--sb-font-ui)', fontSize: 10, fontWeight: 700, color: 'var(--sb-text-mute)',
              letterSpacing: '.1em', textTransform: 'uppercase',
            }}>
              <div></div><div>NAME</div><div>LEN</div><div>TYPE</div><div>FILE</div><div></div>
            </div>
            {SOUNDS.map((s, i) => (
              <div key={s[0]} style={{
                display: 'grid', gridTemplateColumns: '32px 1fr 80px 110px 1fr 32px',
                gap: 10, alignItems: 'center',
                padding: '10px 14px',
                borderBottom: i === SOUNDS.length - 1 ? 'none' : '1px solid var(--sb-border-soft)',
                background: i === 1 ? 'var(--sb-bg-panel-2)' : 'transparent',
              }}>
                <div style={{ color: 'var(--sb-amber)' }}>
                  <PixelIcon name={s[2] === 'loop' ? 'loop' : 'play'} size={14} />
                </div>
                <div style={{ fontFamily: 'var(--sb-font-ui)', fontWeight: 600, fontSize: 13, color: 'var(--sb-text)' }}>{s[0]}</div>
                <div style={{ fontFamily: 'var(--sb-font-mono)', fontSize: 12, color: 'var(--sb-text-dim)', fontVariantNumeric: 'tabular-nums' }}>{s[1]}</div>
                <div><Pill on={s[2] === 'loop'}>{s[2]}</Pill></div>
                <div style={{ fontFamily: 'var(--sb-font-mono)', fontStyle: 'italic', fontSize: 11, color: 'var(--sb-text-mute)' }}>{s[3]}</div>
                <div style={{ color: 'var(--sb-text-mute)' }}><PixelIcon name="edit" size={12} /></div>
              </div>
            ))}
          </div>
        </main>

        {/* Right · preview */}
        <aside style={{ borderLeft: '1px solid var(--sb-border)', padding: '16px 16px', background: 'var(--sb-bg-deep)', overflow: 'auto' }}>
          <SectionLabel glyph="eye">SELECTED</SectionLabel>
          <div className="sb-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
              <div style={{ color: 'var(--sb-amber)' }}><PixelIcon name="play" size={24} /></div>
              <div>
                <div className="sb-label" style={{ fontSize: 14 }}>RAIN HEAVY</div>
                <div className="sb-mono" style={{ fontSize: 11 }}>rain_heavy.ogg · 2:14</div>
              </div>
            </div>
            {/* faux waveform */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 1, height: 56, marginBottom: 10 }}>
              {Array.from({ length: 60 }).map((_, i) => {
                const h = 6 + Math.abs(Math.sin(i * 0.6)) * 44 + (i % 3 === 0 ? 6 : 0);
                return <div key={i} style={{ flex: 1, height: h, background: i < 22 ? 'var(--sb-amber)' : 'var(--sb-border)', opacity: i < 22 ? 1 : 0.7 }} />;
              })}
            </div>
            <div className="sb-mono" style={{ fontSize: 11, marginBottom: 12 }}>
              tags: rain, storm, ambient, night
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="sb-btn sb-btn-primary" style={{ flex: 1 }}><PixelIcon name="play" size={12} /> PREVIEW</button>
              <button className="sb-btn sb-btn-ghost"><PixelIcon name="edit" size={12} /></button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// SETTINGS — grouped accordion with appearance, audio, behavior.
// ════════════════════════════════════════════════════════════════
function SettingsScreen() {
  return (
    <div className="sb" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <TopBar title="Settings" sub="// Theme, font size & start mode" />

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', flex: 1, minHeight: 0 }}>
        <aside style={{ padding: '18px 14px', borderRight: '1px solid var(--sb-border)' }}>
          {['Appearance', 'Audio', 'Behavior', 'Shortcuts', 'Data'].map((s, i) => (
            <div key={s} style={{
              padding: '8px 12px', borderRadius: 6, marginBottom: 4,
              background: i === 0 ? 'var(--sb-bg-panel-2)' : 'transparent',
              fontFamily: 'var(--sb-font-ui)', fontWeight: 600, fontSize: 13,
              color: i === 0 ? 'var(--sb-amber)' : 'var(--sb-text-dim)',
              borderLeft: i === 0 ? '2px solid var(--sb-amber)' : '2px solid transparent',
            }}>{s}</div>
          ))}
        </aside>

        <main style={{ padding: '24px 32px', overflow: 'auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <PixelIcon name="sparkle" size={18} color="var(--sb-amber)" />
            <div className="sb-display" style={{ fontSize: 32 }}>Appearance</div>
          </div>

          <SectionLabel glyph="potion">THEME</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
            {[
              { name: 'Hearth',  bg: '#181B33', accent: '#E5A937', selected: true },
              { name: 'Verdant', bg: '#142A20', accent: '#D8B14A' },
              { name: 'Neon',    bg: '#111A33', accent: '#3DD4F0' },
              { name: 'Crimson', bg: '#1F1213', accent: '#D63A3A' },
            ].map((t) => (
              <div key={t.name} style={{
                background: t.bg,
                border: '1px solid ' + (t.selected ? t.accent : 'var(--sb-border)'),
                borderRadius: 8,
                padding: 12,
                boxShadow: t.selected ? '0 0 0 1px ' + t.accent + ' inset, 0 0 18px ' + t.accent + '55' : 'none',
              }}>
                <div style={{ display: 'flex', gap: 4, marginBottom: 10 }}>
                  <div style={{ width: 16, height: 16, background: t.accent }} />
                  <div style={{ width: 16, height: 16, background: t.bg, border: '1px solid ' + t.accent }} />
                  <div style={{ width: 16, height: 16, background: '#fff2', border: '1px solid #fff3' }} />
                </div>
                <div style={{ fontFamily: 'var(--sb-font-ui)', fontWeight: 700, fontSize: 13, color: t.accent, letterSpacing: '.08em', textTransform: 'uppercase' }}>{t.name}</div>
              </div>
            ))}
          </div>

          <PixelDivider glyph="diamond" margin={6} />

          <SectionLabel glyph="scroll">TYPE SCALE</SectionLabel>
          <div className="sb-card" style={{ marginBottom: 18 }}>
            <LabelSlider label="FONT SIZE" value={0.55} />
            <div className="sb-mono" style={{ fontSize: 11, marginTop: 8 }}>
              Affects body copy. Pixel titles stay fixed for legibility.
            </div>
          </div>

          <PixelDivider glyph="diamond" margin={6} />

          <SectionLabel glyph="key">BEHAVIOR</SectionLabel>
          <div className="sb-card" style={{ padding: '0 18px' }}>
            <ToggleRow label="Crossfade between scenes"   sub="Old loops fade out as new ones come in" on />
            <ToggleRow label="Show keyboard hints on pads" sub="Tiny key cap in the upper-right corner" on />
            <ToggleRow label="Start in Edit Mode"          sub="Open the board ready to arrange pads" />
            <ToggleRow label="Autosave"                    sub="Write changes to disk every 30 seconds" on />
          </div>
        </main>
      </div>
    </div>
  );
}

Object.assign(window, { HomeScreen, BoardScreen, LibraryScreen, SettingsScreen });
