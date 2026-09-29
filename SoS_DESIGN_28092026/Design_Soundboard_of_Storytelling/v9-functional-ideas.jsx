// v9-functional-ideas.jsx — Functional proposals for clarity & organisation.
// Not decorative — each idea solves a concrete workflow problem during
// a live game-master session. Mock-ups are illustrative, not final.

// ════════════════════════════════════════════════════════════════
// 1 · COMMAND PALETTE (⌘K)
//    Press a single hotkey, type two letters, jump anywhere — to any
//    pad, scene, setting, board, or action. Universal in pro tools
//    (Lightroom Library, Figma, Linear, VSCode) — the single highest-
//    leverage shortcut you can add. For a GM mid-session, this means
//    "find Thunder" without breaking eye contact with the table.
// ════════════════════════════════════════════════════════════════
function CommandPaletteDemo() {
  const RESULTS = [
    { icon: 'flame', kind: 'PAD',    label: 'Thunder',          meta: 'F8 · single · 0:03',     hot: true },
    { icon: 'loop',  kind: 'PAD',    label: 'Thunder distant',  meta: '— · loop · 0:42' },
    { icon: 'moon',  kind: 'SCENE',  label: 'Storm approach',   meta: 'Board 1 · scene 02' },
    { icon: 'cog',   kind: 'ACTION', label: 'Set Crossfade…',   meta: 'Settings → Audio' },
    { icon: 'search',kind: 'ACTION', label: 'Stop everything',  meta: 'ENTER' },
  ];
  return (
    <div style={{ position: 'relative', height: 360, background: 'var(--surface)', overflow: 'hidden' }}>
      {/* Dim background */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(8,8,26,.7)',
        backdropFilter: 'blur(0)',
      }} />
      {/* Palette */}
      <div style={{
        position: 'absolute', top: 32, left: '50%', transform: 'translateX(-50%)',
        width: 520,
        background: 'var(--raised)',
        border: '2px solid var(--gold)',
        boxShadow: '0 0 0 1px var(--gold) inset, 0 12px 36px rgba(0,0,0,.6)',
      }}>
        {/* Input row */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 14px',
          borderBottom: '1px solid var(--border)',
        }}>
          <PixelIcon name="search" size={14} color="var(--gold)" />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 16, color: 'var(--text)' }}>thunder</span>
          <span style={{ width: 2, height: 18, background: 'var(--gold)', animation: 'sb-caret 1s steps(1) infinite' }} />
          <div style={{ flex: 1 }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-mute)' }}>5 results · enter to run</span>
        </div>
        {/* Results */}
        <div>
          {RESULTS.map((r, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '20px 64px 1fr auto 16px', gap: 12, alignItems: 'center',
              padding: '8px 14px',
              background: r.hot ? 'var(--top)' : 'transparent',
              borderLeft: r.hot ? '2px solid var(--gold)' : '2px solid transparent',
            }}>
              <PixelIcon name={r.icon} size={14} color={r.hot ? 'var(--gold)' : 'var(--text-dim)'} />
              <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--text-mute)', letterSpacing: '.14em' }}>{r.kind}</span>
              <span style={{ fontFamily: 'var(--font-ui)', fontSize: 14, color: r.hot ? 'var(--gold)' : 'var(--text)' }}>
                <mark style={{ background: 'rgba(212,178,92,.25)', color: 'inherit' }}>Thunder</mark>{r.label.slice(7)}
              </span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-mute)' }}>{r.meta}</span>
              {r.hot && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--gold)' }}>↵</span>}
            </div>
          ))}
        </div>
        <div style={{ padding: '8px 14px', borderTop: '1px solid var(--border-soft)', display: 'flex', gap: 14, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-mute)' }}>
          <span>↑↓ navigate</span>
          <span>↵ trigger / open</span>
          <span>⇧↵ preview</span>
          <span style={{ marginLeft: 'auto' }}>esc close</span>
        </div>
      </div>
      <style>{`@keyframes sb-caret{50%{opacity:0}}`}</style>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 2 · QUICK ACCESS STRIP — persistent favourite pads
//    A small strip across the top of the workspace with 4–8 pinned
//    pads that DON'T disappear when you switch scenes. The "always-
//    available stingers": door-slam, dice-roll, stop-all, narrator
//    breath, transition whoosh. Pinned via right-click → ★ PIN.
// ════════════════════════════════════════════════════════════════
function QuickAccessStripDemo() {
  const PINNED = [
    { type: 'single',   t: 'Dice Roll',  k: '⌘1' },
    { type: 'single',   t: 'Door Slam',  k: '⌘2' },
    { type: 'single',   t: 'Page Turn',  k: '⌘3' },
    { type: 'single',   t: 'Whoosh',     k: '⌘4' },
    { type: 'loop',     t: 'Heartbeat',  k: '⌘5' },
    { type: 'combo',    t: 'Stinger',    k: '⌘6' },
  ];
  return (
    <div style={{ padding: 14, background: 'var(--surface)' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '8px 12px',
        background: 'var(--deep)',
        borderTop: '2px solid var(--gold)',
      }}>
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--gold)', letterSpacing: '.16em' }}>
          ★ QUICK ACCESS
        </span>
        <div style={{ width: 1, height: 24, background: 'var(--border-soft)' }} />
        <div style={{ display: 'flex', gap: 6, flex: 1 }}>
          {PINNED.map((p) => (
            <div key={p.t} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '4px 10px',
              background: 'var(--raised)',
              border: '1px solid var(--border)',
              borderLeft: `3px solid var(--pad-${p.type})`,
            }}>
              <PixelIcon name={p.type === 'loop' ? 'loop' : p.type === 'combo' ? 'rune' : 'play'} size={11} color={`var(--pad-${p.type})`} />
              <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--text)' }}>{p.t}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-mute)', padding: '1px 4px', background: 'var(--sunk)' }}>{p.k}</span>
            </div>
          ))}
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-mute)' }}>6 / 8 pinned</span>
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-mute)', marginTop: 8 }}>
        // pinned pads survive scene switches · right-click any pad → ★ PIN
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 3 · CUE STACK — "queue the next sound"
//    Pre-load up to 3 pads that fire in order on a single key press.
//    Mid-session: you know the players are about to enter the cave;
//    you queue HEART-BEAT, WIND, BAT-SHRIEK, then trigger them one
//    by one with TAB. Eliminates fumbling.
// ════════════════════════════════════════════════════════════════
function CueStackDemo() {
  return (
    <div style={{
      padding: 12,
      background: 'var(--deep)',
      border: '1px solid var(--border)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <PixelIcon name="hourglass" size={14} color="var(--gold)" />
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--gold)', letterSpacing: '.14em' }}>CUE STACK</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-mute)' }}>· TAB to advance</span>
        <div style={{ flex: 1 }} />
        <button className="sb-btn sb-btn-sm sb-btn-ghost" style={{ padding: '2px 8px' }}>CLEAR</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <CueRow idx={1} type="loop" name="Heartbeat" hot />
        <CueRow idx={2} type="loop" name="Cave Wind" />
        <CueRow idx={3} type="single" name="Bat Shriek" />
        <div style={{
          padding: '6px 10px', border: '1px dashed var(--border)', textAlign: 'center',
          fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-mute)',
        }}>+ drop a pad here to queue</div>
      </div>
    </div>
  );
}
function CueRow({ idx, type, name, hot }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '6px 10px',
      background: hot ? 'var(--top)' : 'var(--raised)',
      borderLeft: `3px solid var(--pad-${type})`,
    }}>
      <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: hot ? 'var(--gold)' : 'var(--text-mute)' }}>
        {hot ? '▶' : idx}
      </span>
      <PixelIcon name={type === 'loop' ? 'loop' : 'play'} size={12} color={`var(--pad-${type})`} />
      <span style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--text)', flex: 1 }}>{name}</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-mute)', textTransform: 'uppercase' }}>{type}</span>
      {hot && <span className="sb-pill is-on" style={{ fontSize: 9 }}><span className="sb-dot"/>NEXT</span>}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 4 · SESSION TIMELINE — what played, when, how
//    Bottom strip showing the last ~15 minutes as a horizontal track
//    of pad-coloured blocks. Hover a block to see name + duration +
//    "played 4m ago". Click to replay. Doubles as a session log you
//    can export — a recap after the game ends.
// ════════════════════════════════════════════════════════════════
function SessionTimelineDemo() {
  const EVENTS = [
    { at: 0,    dur: 4,   type: 'loop',     name: 'Rain Heavy' },
    { at: 0,    dur: 18,  type: 'loop',     name: 'Fireplace' },
    { at: 6,    dur: 1,   type: 'single',   name: 'Door Slam' },
    { at: 7,    dur: 1,   type: 'single',   name: 'Boots' },
    { at: 9,    dur: 1,   type: 'single',   name: 'Glass break' },
    { at: 12,   dur: 1,   type: 'single',   name: 'Sword' },
    { at: 14,   dur: 0.6, type: 'combo',    name: 'Boss Reveal' },
    { at: 15,   dur: 4,   type: 'playlist', name: 'Combat Mix' },
    { at: 18,   dur: 1,   type: 'single',   name: 'Whoosh' },
    { at: 19,   dur: 1,   type: 'loop',     name: 'Crowd' },
  ];
  const TOTAL = 24; // minutes
  return (
    <div style={{
      background: 'var(--deep)',
      border: '1px solid var(--border)',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '6px 12px',
        borderBottom: '1px solid var(--border-soft)',
      }}>
        <PixelIcon name="hourglass" size={12} color="var(--gold)" />
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--gold)', letterSpacing: '.14em' }}>SESSION TIMELINE</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-mute)' }}>· 24 min · 10 events · export → .csv</span>
        <div style={{ flex: 1 }} />
        <button className="sb-btn sb-btn-sm sb-btn-ghost" style={{ padding: '2px 8px' }}>SCROLL ←</button>
        <button className="sb-btn sb-btn-sm sb-btn-ghost" style={{ padding: '2px 8px' }}>NOW</button>
      </div>

      {/* Track */}
      <div style={{ position: 'relative', height: 80, padding: '10px 12px' }}>
        {/* 4 lanes — one per pad type */}
        {['single', 'loop', 'playlist', 'combo'].map((kind, lane) => (
          <div key={kind} style={{
            position: 'absolute',
            left: 60, right: 60, height: 12,
            top: 10 + lane * 14,
            background: 'var(--sunk)',
            border: '1px solid var(--border-soft)',
          }}>
            <span style={{
              position: 'absolute', left: -54, top: -2,
              fontFamily: 'var(--font-mono)', fontSize: 9,
              color: `var(--pad-${kind})`,
              letterSpacing: '.1em', textTransform: 'uppercase',
            }}>{kind === 'playlist' ? 'list' : kind === 'single' ? 'solo' : kind}</span>
            {EVENTS.filter((e) => e.type === kind).map((e, i) => (
              <div key={i} style={{
                position: 'absolute',
                left: `${(e.at / TOTAL) * 100}%`,
                width: `${(e.dur / TOTAL) * 100}%`,
                top: 0, bottom: 0,
                background: `var(--pad-${kind})`,
                opacity: .85,
              }} title={e.name} />
            ))}
          </div>
        ))}
        {/* Playhead */}
        <div style={{
          position: 'absolute', top: 6, bottom: 6,
          left: `calc(60px + ${(19 / TOTAL) * (100 - 0)}% - ${(60 + 60) * (19 / TOTAL)}px)`,
          width: 2, background: 'var(--gold-bright)',
          boxShadow: '0 0 6px var(--gold-bright)',
        }} />
        {/* Tick marks */}
        <div style={{ position: 'absolute', left: 60, right: 60, bottom: 4, display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-mute)' }}>
          {[0, 5, 10, 15, 20].map((t) => <span key={t}>{t}m</span>)}
          <span style={{ color: 'var(--gold)' }}>NOW</span>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 5 · SMART GROUPS (saved searches)
//    Dynamic folders defined by query, not by manual drag:
//      "all loops over 1 minute"     → loops curated for ambience
//      "stingers untagged"           → cleanup helper
//      "used 0 times"                → orphans to consider deleting
//      "tagged combat"               → quick scene-building
//    Updates automatically as pads are added/edited.
// ════════════════════════════════════════════════════════════════
function SmartGroupsDemo() {
  const GROUPS = [
    { glyph: 'rune',     name: 'Combat-ready',     query: 'tag:combat OR tag:fight', count: 12 },
    { glyph: 'loop',     name: 'Long loops',       query: 'type:loop  duration:>60s', count: 8  },
    { glyph: 'skull',    name: 'Horror stingers',  query: 'tag:horror type:single',  count: 18 },
    { glyph: 'eye',      name: 'Orphan files',     query: 'used:0',                   count: 12, danger: true },
    { glyph: 'sparkle',  name: 'Recently added',   query: 'created:<7d',              count: 6 },
  ];
  return (
    <div style={{ background: 'var(--deep)', padding: 12, border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <PixelIcon name="diamond" size={12} color="var(--gold)" />
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--gold)', letterSpacing: '.14em' }}>SMART GROUPS</span>
        <div style={{ flex: 1 }} />
        <button className="sb-btn sb-btn-sm sb-btn-ghost" style={{ padding: '2px 8px' }}>+ NEW</button>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {GROUPS.map((g) => (
          <div key={g.name} style={{
            display: 'grid', gridTemplateColumns: '14px 1fr auto', gap: 10, alignItems: 'center',
            padding: '7px 10px',
            background: 'var(--raised)',
            borderLeft: `2px solid ${g.danger ? 'var(--blood)' : 'var(--gold-dim)'}`,
            cursor: 'pointer',
          }}>
            <PixelIcon name={g.glyph} size={12} color={g.danger ? 'var(--blood-bright)' : 'var(--gold)'} />
            <div>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--text)' }}>{g.name}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-mute)' }}>{g.query}</div>
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: g.danger ? 'var(--blood-bright)' : 'var(--text-dim)', fontVariantNumeric: 'tabular-nums' }}>{g.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 6 · BULK SELECT & BATCH EDIT
//    SETUP mode: click to select, ⇧-click to range-select, ⌘-click
//    to multi-select. Bottom action bar appears: bus, fade, tag, key
//    region, type conversion, delete. Crucial when re-tuning a board.
// ════════════════════════════════════════════════════════════════
function BulkSelectDemo() {
  return (
    <div style={{ background: 'var(--surface)', position: 'relative', padding: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <span className="sb-mode-badge is-setup" style={{ fontSize: 10 }}>SETUP</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-mute)' }}>· ⇧-click for range · ⌘-click to add</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6 }}>
        {[
          { t: 'Dice',   type: 'single' },
          { t: 'Door',   type: 'single', sel: true },
          { t: 'Boots',  type: 'single', sel: true },
          { t: 'Sword',  type: 'single', sel: true },
          { t: 'Wind',   type: 'loop' },
          { t: 'Crowd',  type: 'loop' },
          { t: 'Rain',   type: 'loop' },
          { t: 'Fire',   type: 'loop' },
          { t: 'Tavern', type: 'playlist' },
          { t: 'Boss',   type: 'combo' },
          { t: 'Coin',   type: 'single' },
          { t: 'Owl',    type: 'single' },
        ].map((p, i) => (
          <div key={i} style={{
            background: 'var(--raised)',
            borderLeft: `3px solid var(--pad-${p.type})`,
            border: '1px solid ' + (p.sel ? 'var(--gold)' : 'var(--border)'),
            padding: '8px 8px',
            position: 'relative',
            boxShadow: p.sel ? '0 0 0 1px var(--gold) inset' : 'none',
          }}>
            {p.sel && <span style={{ position: 'absolute', top: 3, right: 3, width: 10, height: 10, background: 'var(--gold)' }} />}
            <PixelIcon name={p.type === 'loop' ? 'loop' : p.type === 'playlist' ? 'scroll' : p.type === 'combo' ? 'rune' : 'play'} size={12} color={`var(--pad-${p.type})`} />
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--text)', marginTop: 4 }}>{p.t}</div>
          </div>
        ))}
      </div>

      {/* Floating bulk action bar */}
      <div style={{
        position: 'absolute', left: '50%', bottom: 16, transform: 'translateX(-50%)',
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '6px 10px',
        background: 'var(--deep)',
        border: '2px solid var(--gold)',
        boxShadow: '0 8px 24px rgba(0,0,0,.5)',
      }}>
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--gold)', letterSpacing: '.1em', padding: '0 6px' }}>3 SELECTED</span>
        <div style={{ width: 1, height: 22, background: 'var(--border)' }} />
        <button className="sb-btn sb-btn-sm sb-btn-ghost" style={{ padding: '2px 8px' }}><PixelIcon name="tag" size={10} /> TAG</button>
        <button className="sb-btn sb-btn-sm sb-btn-ghost" style={{ padding: '2px 8px' }}>BUS</button>
        <button className="sb-btn sb-btn-sm sb-btn-ghost" style={{ padding: '2px 8px' }}>FADE</button>
        <button className="sb-btn sb-btn-sm sb-btn-ghost" style={{ padding: '2px 8px' }}>FOLDER</button>
        <button className="sb-btn sb-btn-sm sb-btn-ghost" style={{ padding: '2px 8px' }}>CONVERT</button>
        <div style={{ width: 1, height: 22, background: 'var(--border)' }} />
        <button className="sb-btn sb-btn-sm sb-btn-danger" style={{ padding: '2px 8px' }}>× DELETE</button>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 7 · WORKSPACE PRESETS — saved layouts
//    "Live session" hides the library, makes the mixer big.
//    "Tuning" shows the inspector and library side-by-side.
//    "Performance" hides every panel except the pad grid.
//    Save / restore with one keystroke; like Lightroom's modules.
// ════════════════════════════════════════════════════════════════
function WorkspacePresetsDemo() {
  const PRESETS = [
    { name: 'PERFORMANCE', desc: 'pads only · max focus', shortcut: '⌘0', layout: [0, 1, 0] },
    { name: 'LIVE SESSION', desc: 'mixer wide · library hidden', shortcut: '⌘1', active: true, layout: [0, 0.7, 0.3] },
    { name: 'TUNING',      desc: 'inspector + library', shortcut: '⌘2', layout: [0.25, 0.5, 0.25] },
    { name: 'OVERVIEW',    desc: 'all rails visible', shortcut: '⌘3', layout: [0.2, 0.55, 0.25] },
  ];
  return (
    <div style={{ background: 'var(--deep)', padding: 12, border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <PixelIcon name="cog" size={12} color="var(--gold)" />
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--gold)', letterSpacing: '.14em' }}>WORKSPACE PRESETS</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
        {PRESETS.map((p) => (
          <div key={p.name} style={{
            background: 'var(--raised)',
            border: '1px solid ' + (p.active ? 'var(--gold)' : 'var(--border)'),
            borderLeft: p.active ? '3px solid var(--gold)' : '3px solid var(--border)',
            padding: 8,
            display: 'flex', flexDirection: 'column', gap: 4,
            cursor: 'pointer',
          }}>
            {/* Mini layout preview */}
            <div style={{ display: 'flex', gap: 1, height: 28, marginBottom: 2 }}>
              <div style={{ flex: p.layout[0] || 0.02, background: p.layout[0] ? 'var(--deep)' : 'transparent', border: p.layout[0] ? '1px solid var(--border-soft)' : 'none' }} />
              <div style={{ flex: p.layout[1], background: p.active ? 'rgba(212,178,92,.18)' : 'var(--surface)', border: '1px solid ' + (p.active ? 'var(--gold-dim)' : 'var(--border-soft)') }} />
              <div style={{ flex: p.layout[2] || 0.02, background: p.layout[2] ? 'var(--deep)' : 'transparent', border: p.layout[2] ? '1px solid var(--border-soft)' : 'none' }} />
            </div>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: p.active ? 'var(--gold)' : 'var(--text)', letterSpacing: '.08em' }}>{p.name}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-mute)' }}>{p.desc}</div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-mute)', padding: '1px 5px', background: 'var(--sunk)', alignSelf: 'flex-start', marginTop: 2 }}>{p.shortcut}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 8 · KEYBOARD MAP — visual hotkey assignment
//    A diagrammatic keyboard with every assigned key tinted in its
//    pad's type colour. Hover/tap a key to see which pad fires.
//    Solves the "what keys are still free?" problem instantly and
//    surfaces conflicts visually.
// ════════════════════════════════════════════════════════════════
function KeyboardMapDemo() {
  const ROWS = [
    ['F1','F2','F3','F4','F5','F6','F7','F8','F9','F10','F11','F12'],
    ['1','2','3','4','5','6','7','8','9','0'],
    ['Q','W','E','R','T','Y','U','I','O','P'],
    ['A','S','D','F','G','H','J','K','L'],
    ['Z','X','C','V','B','N','M'],
  ];
  // Map of key → pad type
  const A = {
    F1:'single', F2:'loop', F3:'loop', F4:'single', F5:'single',
    F6:'loop', F7:'playlist', F8:'single',
    1:'single', 2:'combo', 3:'single', 5:'single', 6:'single', 7:'single',
    Q:'combo', W:'single', E:'playlist', R:'loop',
    A:'single', S:'loop', D:'single',
  };
  // Conflicts (orange ring)
  const CONFLICTS = ['F4'];

  return (
    <div style={{ background: 'var(--surface)', padding: 14, border: '1px solid var(--border)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <PixelIcon name="keyboard" size={14} color="var(--gold)" />
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--gold)', letterSpacing: '.14em' }}>KEYBOARD MAP · BOARD 1</span>
        <div style={{ flex: 1 }} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-mute)' }}>22 assigned · 1 conflict · 75 free</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        {ROWS.map((row, ri) => (
          <div key={ri} style={{ display: 'flex', gap: 3, marginLeft: ri === 2 ? 16 : ri === 3 ? 24 : ri === 4 ? 36 : 0 }}>
            {row.map((k) => {
              const type = A[k];
              const conflict = CONFLICTS.includes(k);
              const color = type ? `var(--pad-${type})` : 'transparent';
              return (
                <div key={k} style={{
                  width: 32, height: 28,
                  background: type ? `var(--pad-${type}-soft)` : 'var(--raised)',
                  border: '1px solid ' + (conflict ? 'var(--blood)' : type ? color : 'var(--border-soft)'),
                  borderLeft: type ? `3px solid ${color}` : '1px solid var(--border-soft)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: 'var(--font-ui)', fontSize: 11,
                  color: type ? color : 'var(--text-mute)',
                  cursor: 'pointer',
                  position: 'relative',
                  boxShadow: conflict ? '0 0 0 1px var(--blood) inset' : 'none',
                }}>
                  {k}
                  {conflict && <span style={{ position: 'absolute', top: -3, right: -3, width: 7, height: 7, background: 'var(--blood)', border: '1px solid var(--night)' }} />}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 14, marginTop: 12, paddingTop: 10, borderTop: '1px solid var(--border-soft)', flexWrap: 'wrap' }}>
        {['single', 'loop', 'playlist', 'combo'].map((t) => (
          <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 12, height: 12, background: `var(--pad-${t})` }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', textTransform: 'uppercase' }}>{t}</span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 12, height: 12, background: 'transparent', border: '1px solid var(--blood)', boxShadow: '0 0 0 1px var(--blood) inset' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--blood-bright)' }}>CONFLICT</span>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 9 · SCENE NOTES — markdown pinned per scene
//    A small notes panel that swaps with the scene. The GM types
//    "remember Vorian's accent / NPCs: Jarn (gruff), Lenya (sly)"
//    once at prep time. During play it's right there when the scene
//    activates. Hides on TAB to avoid clutter.
// ════════════════════════════════════════════════════════════════
function SceneNotesDemo() {
  return (
    <div style={{
      background: 'var(--deep)',
      border: '1px solid var(--border)',
      borderLeft: '3px solid var(--gold)',
      padding: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <PixelIcon name="scroll" size={12} color="var(--gold)" />
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--gold)', letterSpacing: '.14em' }}>SCENE NOTES · THE TAVERN</span>
        <div style={{ flex: 1 }} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-mute)' }}>4 lines · auto</span>
      </div>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)',
        lineHeight: 1.6,
        background: 'var(--sunk)', padding: '8px 10px',
        border: '1px solid var(--border-soft)',
      }}>
        <div style={{ color: 'var(--gold-bright)' }}># vorian's accent — gruff, slow</div>
        <div>npcs: <span style={{ color: 'var(--text)' }}>jarn</span> (gruff), <span style={{ color: 'var(--text)' }}>lenya</span> (sly)</div>
        <div>* trigger <span style={{ color: 'var(--gold)' }}>RAIN</span> when door opens</div>
        <div>* if combat starts → <span style={{ color: 'var(--pad-loop)' }}>HEARTBEAT</span> queued</div>
        <div style={{ marginTop: 6, color: 'var(--text-mute)' }}>// markdown · trigger refs auto-highlight</div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// 10 · SCENE TRANSITIONS — explicit transition pads
//     Between every two scenes a configurable transition: crossfade
//     duration, transition stinger to play, target master volume.
//     Single key press (SPACE in GAME mode) goes to next scene with
//     all the loops crossfaded correctly. No more frantic stopping.
// ════════════════════════════════════════════════════════════════
function SceneTransitionsDemo() {
  return (
    <div style={{
      background: 'var(--deep)', border: '1px solid var(--border)', padding: 14,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <PixelIcon name="loop" size={12} color="var(--gold)" />
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--gold)', letterSpacing: '.14em' }}>SCENE TRANSITIONS</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
        <SceneNode kind="tavern" label="THE TAVERN" active />
        <div style={{ flex: 1, padding: '0 14px', position: 'relative' }}>
          {/* Transition arc */}
          <div style={{
            height: 2,
            background: 'repeating-linear-gradient(90deg, var(--gold) 0 4px, transparent 4px 8px)',
            margin: '20px 0',
          }} />
          <div style={{
            position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
          }}>
            <div style={{
              padding: '3px 8px',
              background: 'var(--raised)', border: '1px solid var(--gold)',
              fontFamily: 'var(--font-ui)', fontSize: 10, color: 'var(--gold)', letterSpacing: '.1em',
            }}>CROSSFADE 1.6s</div>
            <div style={{
              padding: '2px 6px',
              fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--pad-single)',
            }}>+ stinger: page turn</div>
            <div style={{
              padding: '2px 6px',
              fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-mute)',
            }}>SPACE to advance →</div>
          </div>
        </div>
        <SceneNode kind="combat" label="COMBAT" />
      </div>
    </div>
  );
}
function SceneNode({ kind, label, active }) {
  const meta = SCENE_RUNES[kind] || { icon: 'diamond' };
  return (
    <div style={{
      width: 140, padding: 12,
      background: active ? 'var(--top)' : 'var(--raised)',
      border: '1px solid ' + (active ? 'var(--gold)' : 'var(--border)'),
      borderLeft: active ? '3px solid var(--gold)' : '3px solid var(--border)',
      textAlign: 'center',
    }}>
      <div style={{ color: active ? 'var(--gold-bright)' : 'var(--gold-dim)', marginBottom: 4 }}>
        <PixelIcon name={meta.icon} size={20} />
      </div>
      <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: active ? 'var(--gold)' : 'var(--text-dim)', letterSpacing: '.1em' }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontStyle: 'italic', fontSize: 10, color: 'var(--text-mute)', marginTop: 2 }}>// {meta.label}</div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════
// THE BIG ARTBOARD — all ideas in one document
// ════════════════════════════════════════════════════════════════
function FunctionalIdeasArtboard() {
  const Idea = ({ n, title, tag, value, priority, children }) => (
    <div style={{
      background: 'var(--raised)',
      border: '1px solid var(--border)',
      borderLeft: '4px solid ' + (priority === 'A' ? 'var(--gold)' : priority === 'B' ? 'var(--pad-loop)' : 'var(--border-strong)'),
      marginBottom: 18,
    }}>
      <div style={{
        display: 'grid', gridTemplateColumns: '60px 1fr auto', gap: 12, alignItems: 'baseline',
        padding: '12px 16px',
        borderBottom: '1px solid var(--border-soft)',
      }}>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontSize: 14, color: 'var(--gold-bright)',
          letterSpacing: '.04em',
        }}>{String(n).padStart(2, '0')}</div>
        <div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 18, color: 'var(--text)', letterSpacing: '.04em' }}>{title}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--gold)', textTransform: 'uppercase', letterSpacing: '.12em' }}>{tag}</span>
          </div>
          <div className="sb-mono" style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 4, lineHeight: 1.5 }}>{value}</div>
        </div>
        <div>
          <span style={{
            padding: '3px 10px',
            background: priority === 'A' ? 'rgba(212,178,92,.18)' : priority === 'B' ? 'rgba(109,181,184,.18)' : 'rgba(83,82,160,.18)',
            border: '1px solid ' + (priority === 'A' ? 'var(--gold)' : priority === 'B' ? 'var(--pad-loop)' : 'var(--border-strong)'),
            color: priority === 'A' ? 'var(--gold)' : priority === 'B' ? 'var(--pad-loop)' : 'var(--text-dim)',
            fontFamily: 'var(--font-ui)', fontSize: 10, letterSpacing: '.14em',
          }}>PRIO · {priority}</span>
        </div>
      </div>
      <div style={{ padding: 16 }}>{children}</div>
    </div>
  );

  return (
    <div className="sb" style={{ padding: 28, overflow: 'auto', height: '100%' }}>
      <div style={{ marginBottom: 22 }}>
        <div className="sb-display" style={{ fontSize: 20 }}>Functional Ideas</div>
        <div className="sb-mono" style={{ fontSize: 13, marginTop: 6 }}>
          // ten organisation & clarity features beyond layout. Each one solves a real<br/>
          // workflow problem a game-master hits during a live session. Priority A = the<br/>
          // four I'd build first.
        </div>
      </div>

      <Idea n={1} title="Command palette" tag="⌘K" priority="A"
        value="Press ⌘K, type two letters, jump anywhere — pad, scene, setting, action. The single highest-leverage shortcut in any pro tool. For a GM mid-session: 'find Thunder' without breaking eye contact with the table.">
        <CommandPaletteDemo />
      </Idea>

      <Idea n={2} title="Quick Access strip" tag="favourites" priority="A"
        value="A persistent strip across the top of the workspace with 4–8 pinned pads that DON'T disappear when scenes change. The 'always-available stingers' — dice roll, door slam, narrator breath, transition whoosh.">
        <QuickAccessStripDemo />
      </Idea>

      <Idea n={3} title="Cue Stack" tag="queue + advance" priority="A"
        value="Pre-load up to 3 pads that fire in order on TAB. You know the players are about to enter the cave; queue HEARTBEAT → CAVE WIND → BAT SHRIEK, then trigger them one by one with no fumbling.">
        <CueStackDemo />
      </Idea>

      <Idea n={4} title="Keyboard map" tag="visual hotkey atlas" priority="A"
        value="A diagrammatic keyboard with every assigned key tinted in its pad-type colour. Hover a key to see what fires. Solves 'what keys are still free?' instantly and surfaces conflicts visually.">
        <KeyboardMapDemo />
      </Idea>

      <Idea n={5} title="Session timeline" tag="what played, when" priority="B"
        value="Bottom strip showing the last ~15 minutes as a horizontal track of pad-coloured blocks. Hover a block: name + duration + 'played 4 min ago'. Click to replay. Exports to .csv as a session log.">
        <SessionTimelineDemo />
      </Idea>

      <Idea n={6} title="Smart Groups" tag="saved searches" priority="B"
        value="Dynamic folders defined by query, not by manual drag: 'all loops over 1 minute', 'orphan files (used 0 times)', 'tagged combat'. Updates automatically as you add or edit pads.">
        <SmartGroupsDemo />
      </Idea>

      <Idea n={7} title="Bulk Select & Batch Edit" tag="multi-pad operations" priority="B"
        value="SETUP mode: click to select, ⇧-click for range, ⌘-click to add. Floating action bar appears with bus / fade / tag / convert / delete. Critical when re-tuning a board grown unwieldy.">
        <BulkSelectDemo />
      </Idea>

      <Idea n={8} title="Workspace Presets" tag="saved layouts" priority="C"
        value="'Performance' hides all panels. 'Live Session' makes the mixer wide. 'Tuning' shows inspector + library. One keystroke each. Like Lightroom's Library / Develop modules — reduces decision-cost mid-session.">
        <WorkspacePresetsDemo />
      </Idea>

      <Idea n={9} title="Scene Notes" tag="markdown per scene" priority="C"
        value="A small notes panel that swaps when the scene swaps. Type your accent reminders, NPC names, trigger cues once at prep; during play they're right there. Hides on TAB.">
        <SceneNotesDemo />
      </Idea>

      <Idea n={10} title="Scene Transitions" tag="single-key crossfade" priority="C"
        value="Configure crossfade duration + transition stinger + target master volume between every pair of scenes. Press SPACE in GAME mode → next scene with all loops crossfaded correctly. No frantic stopping.">
        <SceneTransitionsDemo />
      </Idea>

      <PixelDivider glyph="sparkle" />

      <SectionLabel glyph="star">RECOMMENDED ORDER</SectionLabel>
      <div className="sb-mono" style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.6 }}>
        <span style={{ color: 'var(--gold)' }}>PRIO A</span> — Command Palette, Quick Access, Cue Stack, Keyboard Map.<br/>
        Each is a small, focused feature with outsized impact during live use. Ship these first.<br/>
        <br/>
        <span style={{ color: 'var(--pad-loop)' }}>PRIO B</span> — Session Timeline, Smart Groups, Bulk Select.<br/>
        Worth shipping once the basics feel right; each takes ~1 week of work.<br/>
        <br/>
        <span style={{ color: 'var(--text-dim)' }}>PRIO C</span> — Workspace Presets, Scene Notes, Scene Transitions.<br/>
        Polish layer. The product is great without them, but they make it feel "considered".
      </div>

      <div style={{ height: 24 }} />
      <SectionLabel glyph="skull">EXPLICITLY NOT RECOMMENDED</SectionLabel>
      <div className="sb-mono" style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.6 }}>
        ▸ <b>Voice-trigger / hot-word activation</b> — too unreliable during live conversation.<br/>
        ▸ <b>Real-time pitch / time-stretch UI</b> — drift away from "live-tool" simplicity into "DAW".<br/>
        ▸ <b>Generative AI ambience</b> — undermines the GM's authorship; not what this tool is for.<br/>
        ▸ <b>Cloud-sync between devices</b> — IndexedDB + export is enough; cloud invites bug surface.<br/>
        ▸ <b>Multi-user mode</b> — the magic of this tool is that one GM controls everything.<br/>
      </div>
    </div>
  );
}

Object.assign(window, {
  FunctionalIdeasArtboard,
  CommandPaletteDemo, QuickAccessStripDemo, CueStackDemo, SessionTimelineDemo,
  SmartGroupsDemo, BulkSelectDemo, WorkspacePresetsDemo, KeyboardMapDemo,
  SceneNotesDemo, SceneTransitionsDemo,
});
