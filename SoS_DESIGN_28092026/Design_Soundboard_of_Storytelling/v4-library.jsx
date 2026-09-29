// v4-library.jsx — Library faithful reproduction + refinement proposals.
// The user's actual Library has 4 tabs (AUDIO · PADS · BOARDS · ICONS) and
// uses a 3-type pill system (S-PAD · C-PAD · LIST). This file rebuilds
// each tab faithfully so the rebuild is recognisable, then layers refinements
// in a second pass that keep the bones intact.

// ─────────────────────────────────────────────────────────────────
// Shared chrome — top bar (MENU · LIBRARY · ? · fullscreen), tabs,
// red backup strip at the bottom.
// ─────────────────────────────────────────────────────────────────
function LibChrome({ title = 'LIBRARY', activeTab, onTab, children, footer }) {
  const TABS = ['AUDIO', 'PADS', 'BOARDS', 'ICONS'];
  return (
    <div className="sb" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Top bar */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center', gap: 12,
        padding: '10px 16px',
        background: 'var(--deep)',
        borderBottom: '1px solid var(--gold-dim)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ color: 'var(--gold)', cursor: 'pointer' }}>
            <svg width="20" height="14" viewBox="0 0 20 14" fill="currentColor">
              <rect x="0" y="0" width="20" height="2"/>
              <rect x="0" y="6" width="20" height="2"/>
              <rect x="0" y="12" width="20" height="2"/>
            </svg>
          </div>
          <div style={{
            padding: '5px 14px',
            border: '1px solid var(--gold)',
            color: 'var(--gold)',
            fontFamily: 'var(--font-ui)',
            fontSize: 14, letterSpacing: '.1em',
          }}>MENU</div>
        </div>
        <div style={{
          fontFamily: 'var(--font-ui)', fontSize: 20,
          color: 'var(--gold)', letterSpacing: '.14em',
          textAlign: 'center',
        }}>{title}</div>
        <div style={{ display: 'flex', gap: 10, color: 'var(--gold)', justifyContent: 'flex-end' }}>
          <div style={{ border: '1px solid var(--gold-dim)', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-ui)', fontSize: 14 }}>?</div>
          <div style={{ border: '1px solid var(--gold-dim)', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6">
              <path d="M1 4V1h3M11 4V1H8M1 8v3h3M11 8v3H8" />
            </svg>
          </div>
        </div>
      </div>

      {/* Tab strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', background: 'var(--night)' }}>
        {TABS.map((t) => (
          <div key={t} onClick={() => onTab && onTab(t)} style={{
            padding: '14px 0',
            textAlign: 'center',
            fontFamily: 'var(--font-ui)', fontSize: 16,
            color: t === activeTab ? 'var(--gold)' : 'var(--text-mute)',
            letterSpacing: '.14em',
            borderBottom: t === activeTab ? '2px solid var(--gold)' : '2px solid transparent',
            cursor: 'pointer',
          }}>{t}</div>
        ))}
      </div>

      {/* Body */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>{children}</div>

      {/* Bottom backup strip */}
      {footer ?? (
        <div style={{
          display: 'flex', alignItems: 'center',
          padding: '8px 16px',
          background: 'var(--night)',
          borderTop: '1px solid var(--blood)',
        }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--blood-bright)' }}>
            ⚠ No recent export — tap below to back up your data now.
          </span>
          <div style={{ flex: 1 }} />
          <div style={{
            padding: '6px 14px',
            background: 'var(--blood)',
            color: '#fff',
            fontFamily: 'var(--font-ui)', fontSize: 13, letterSpacing: '.1em',
          }}>EXPORT NOW</div>
        </div>
      )}
    </div>
  );
}

// Type pill matching their actual implementation (S-PAD teal, C-PAD gold, LIST pink)
function TypePill({ kind, refined }) {
  const C = {
    'S-PAD': { c: 'var(--pad-loop)',     bg: refined ? 'rgba(109,181,184,.12)' : 'transparent' },
    'C-PAD': { c: 'var(--pad-single)',   bg: refined ? 'rgba(212,178,92,.12)'  : 'transparent' },
    'LIST':  { c: 'var(--pad-playlist)', bg: refined ? 'rgba(157,127,199,.12)' : 'transparent' },
  }[kind];
  return (
    <span style={{
      display: 'inline-block',
      padding: '2px 8px',
      border: `1px solid ${C.c}`,
      background: C.bg,
      color: C.c,
      fontFamily: 'var(--font-ui)',
      fontSize: 11, letterSpacing: '.1em',
      lineHeight: 1.2,
    }}>{kind}</span>
  );
}

// Row action icons (play · edit · folder/move · delete)
function RowActions({ extra }) {
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      {extra}
      <ActBtn>
        <svg width="11" height="11" viewBox="0 0 11 11" fill="currentColor"><polygon points="2,1 9,5.5 2,10"/></svg>
      </ActBtn>
      <ActBtn>
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M1 10l1.5-1.5L8 3l1.5 1.5L4 10l-3 0z"/></svg>
      </ActBtn>
      <ActBtn>
        <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M1 3h3l1 1h5v6H1z"/></svg>
      </ActBtn>
      <ActBtn danger>×</ActBtn>
    </div>
  );
}
function ActBtn({ children, danger }) {
  return (
    <div style={{
      width: 26, height: 26,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      border: '1px solid ' + (danger ? 'var(--blood)' : 'var(--border)'),
      color: danger ? 'var(--blood)' : 'var(--text-dim)',
      fontFamily: 'var(--font-ui)', fontSize: 14,
      cursor: 'pointer',
      background: 'var(--surface)',
    }}>{children}</div>
  );
}

// ═════════════════════════════════════════════════════════════════
//                    AUDIO TAB · FAITHFUL
// ═════════════════════════════════════════════════════════════════
const AUDIO_FILES = [
  { name: 'wind_02',           upload: 'Wind_Creepy_SOUND.mp3',                size: '128.3KB', date: '23/05/26', used: 0 },
  { name: 'scream_male_01',    upload: 'universfield-man-scream-06-276685.mp3', size: '159.0KB', date: '23/05/26', used: 0 },
  { name: 'scream_male_death', upload: 'u_r7cny11q7r-man-death-scream-186763.mp3', size: '104.5KB', date: '23/05/26', used: 0 },
  { name: 'thunder_02',        upload: 'u_q2hb2391vb-thunder-clap-521194.mp3', size: '223.7KB', date: '23/05/26', used: 1 },
  { name: 'sword_blood_02',    upload: 'Sword_Kill_SOUND.mp3',                  size: '26.0KB',  date: '23/05/26', used: 0 },
  { name: 'rain_loop',         upload: 'rain_loop_long.mp3',                    size: '1.4MB',   date: '23/05/26', used: 2 },
  { name: 'fire_crackle',      upload: 'fire-crackle-fireplace-loop-21692.mp3', size: '480KB',   date: '23/05/26', used: 1 },
];

function AudioRowActual({ row }) {
  return (
    <div style={{
      padding: '14px 18px',
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 14, alignItems: 'center',
    }}>
      <div style={{ width: 16, height: 16, border: '1px solid var(--text-mute)' }} />
      <div>
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 18, color: 'var(--text)', letterSpacing: '.04em', marginBottom: 4 }}>
          {row.name}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-mute)' }}>
          upload-name: {row.upload}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-mute)', marginTop: 4 }}>
          {row.size} · {row.date} · <span style={{ color: row.used ? 'var(--pad-loop)' : 'var(--text-mute)', textDecoration: row.used ? 'underline' : 'none' }}>{row.used ? `in use (${row.used})` : 'unused'}</span>
        </div>
      </div>
      <RowActions />
    </div>
  );
}

function LibraryAudioActual() {
  return (
    <LibChrome activeTab="AUDIO">
      <aside style={{ width: 220, background: 'var(--night)', padding: '14px 14px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--text-dim)', letterSpacing: '.14em', marginBottom: 10 }}>FILTER</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <SidebarBtn active>ALL</SidebarBtn>
            <SidebarBtn>IN USE</SidebarBtn>
            <SidebarBtn>UNUSED</SidebarBtn>
          </div>
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--text-dim)', letterSpacing: '.14em', marginBottom: 10 }}>FOLDERS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <SidebarBtn active>ALL</SidebarBtn>
            <SidebarBtn dashed>+ NEW FOLDER</SidebarBtn>
          </div>
        </div>
      </aside>

      <main style={{ flex: 1, padding: '14px 18px', overflow: 'auto', background: 'var(--night)' }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center' }}>
          <div style={{
            flex: 1, padding: '6px 12px',
            background: 'var(--sunk)', border: '1px solid var(--border)',
            fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--text-mute)',
          }}>Filter…</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-mute)' }}>99</div>
          <div style={{ padding: '6px 14px', border: '1px solid var(--border)', fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--gold)', letterSpacing: '.1em' }}>SORT ▾</div>
        </div>

        <div style={{
          padding: '18px 0',
          background: 'var(--gold-dim)',
          border: '1px solid var(--gold)',
          textAlign: 'center',
          color: 'var(--gold-bright)',
          fontFamily: 'var(--font-ui)', fontSize: 18, letterSpacing: '.16em',
          marginBottom: 14,
        }}>+ UPLOAD AUDIO</div>

        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-dim)', marginBottom: 12 }}>
          99 files · 162.0MB
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {AUDIO_FILES.map((r, i) => <AudioRowActual key={i} row={r} />)}
        </div>
      </main>
    </LibChrome>
  );
}

function SidebarBtn({ children, active, dashed }) {
  return (
    <div style={{
      padding: '8px 12px',
      border: `1px ${dashed ? 'dashed' : 'solid'} ${active ? 'var(--gold)' : 'var(--border)'}`,
      background: active ? 'var(--gold-dim)' : 'transparent',
      color: active ? 'var(--gold-bright)' : 'var(--text-dim)',
      fontFamily: 'var(--font-ui)', fontSize: 13, letterSpacing: '.12em',
      textAlign: 'center',
      cursor: 'pointer',
    }}>{children}</div>
  );
}

// ═════════════════════════════════════════════════════════════════
//                    PADS TAB · FAITHFUL
// ═════════════════════════════════════════════════════════════════
const PADS_LIST = [
  { kind: 'C-PAD', name: 'NIGHT',  hk: '=' },
  { kind: 'C-PAD', name: 'DAY',    hk: '*' },
  { kind: 'S-PAD', name: 'Wind',   hk: '%' },
  { kind: 'S-PAD', name: 'ghost_whisper_01' },
  { kind: 'S-PAD', name: 'Rain',   hk: '()' },
  { kind: 'LIST',  name: 'Playlist_Music_BotC', combo: 1 },
  { kind: 'S-PAD', name: 'bell deep', hk: '7', combo: 1 },
  { kind: 'S-PAD', name: 'Rooster', combo: 1 },
  { kind: 'S-PAD', name: 'Thunder', hk: '((', combo: 1 },
];

function PadRowActual({ row }) {
  return (
    <div style={{
      padding: '12px 18px',
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      display: 'grid', gridTemplateColumns: 'auto 1fr auto auto', gap: 14, alignItems: 'center',
    }}>
      <TypePill kind={row.kind} />
      <div>
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 18, color: 'var(--text)', letterSpacing: '.04em' }}>
          {row.name}{row.hk ? ` [${row.hk}]` : ''}
        </div>
        {row.combo && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--gold)', textDecoration: 'underline', marginTop: 4 }}>
            used in {row.combo} combo
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <ActBtn>
          <svg width="11" height="11" viewBox="0 0 11 11" fill="currentColor"><polygon points="2,1 9,5.5 2,10"/></svg>
        </ActBtn>
        <ActBtn>
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M1 10l1.5-1.5L8 3l1.5 1.5L4 10l-3 0z"/></svg>
        </ActBtn>
        <div style={{
          padding: '4px 10px',
          border: '1px solid var(--border)',
          color: 'var(--text-dim)',
          fontFamily: 'var(--font-ui)', fontSize: 12, letterSpacing: '.1em',
        }}>SAVE</div>
        <ActBtn danger>×</ActBtn>
      </div>
    </div>
  );
}

function LibraryPadsActual() {
  return (
    <LibChrome activeTab="PADS">
      <aside style={{ width: 220, background: 'var(--night)', padding: '14px 14px', display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--text-dim)', letterSpacing: '.14em', marginBottom: 10 }}>SCOPE</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <SidebarBtn active>CURRENT BOARD</SidebarBtn>
            <SidebarBtn>ALL BOARDS</SidebarBtn>
          </div>
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--text-dim)', letterSpacing: '.14em', marginBottom: 10 }}>FOLDERS</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <SidebarBtn active>ALL</SidebarBtn>
            <SidebarBtn dashed>+ NEW FOLDER</SidebarBtn>
          </div>
        </div>
      </aside>

      <main style={{ flex: 1, padding: '14px 18px', overflow: 'auto', background: 'var(--night)' }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center' }}>
          <div style={{ flex: 1, padding: '6px 12px', background: 'var(--sunk)', border: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--text-mute)' }}>Filter…</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-mute)' }}>31</div>
          <div style={{ padding: '6px 14px', border: '1px solid var(--border)', fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--gold)', letterSpacing: '.1em' }}>SORT ▾</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {PADS_LIST.map((r, i) => <PadRowActual key={i} row={r} />)}
        </div>
      </main>
    </LibChrome>
  );
}

// ═════════════════════════════════════════════════════════════════
//                    BOARDS TAB · FAITHFUL
// ═════════════════════════════════════════════════════════════════
function LibraryBoardsActual() {
  return (
    <LibChrome activeTab="BOARDS">
      <main style={{ flex: 1, padding: '14px 18px', overflow: 'auto', background: 'var(--night)' }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center' }}>
          <div style={{ flex: 1, padding: '6px 12px', background: 'var(--sunk)', border: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--text-mute)' }}>Filter…</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-mute)' }}>1</div>
          <div style={{ padding: '6px 14px', border: '1px solid var(--border)', fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--gold)', letterSpacing: '.1em' }}>SORT ▾</div>
        </div>

        <div style={{
          padding: '14px 18px',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          display: 'grid', gridTemplateColumns: '1fr auto', gap: 14, alignItems: 'center',
        }}>
          <div>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 18, color: 'var(--text)', letterSpacing: '.04em', display: 'flex', alignItems: 'center', gap: 8 }}>
              Board 1 <span style={{ color: 'var(--gold)' }}>◆</span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-mute)', marginTop: 4 }}>
              31 Pads · 22/05/26
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '5px 14px',
              border: '1px solid var(--gold)',
              color: 'var(--gold)',
              fontFamily: 'var(--font-ui)', fontSize: 14, letterSpacing: '.12em',
            }}><span>◆</span> OPEN</div>
            <ActBtn>
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M1 10l1.5-1.5L8 3l1.5 1.5L4 10l-3 0z"/></svg>
            </ActBtn>
            <ActBtn>
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.4">
                <rect x="1" y="4" width="6" height="6"/><rect x="4" y="1" width="6" height="6"/>
              </svg>
            </ActBtn>
          </div>
        </div>
      </main>
    </LibChrome>
  );
}

// ═════════════════════════════════════════════════════════════════
//                    ICONS TAB · FAITHFUL
// ═════════════════════════════════════════════════════════════════
const ICON_SECTIONS = [
  ['Interface & Actions', 115],
  ['Interface', 303],
  ['Arrows & Navigation', 88],
  ['Navigation', 131],
  ['Files & Documents', 75],
  ['Objects & Items', 100],
  ['Objects', 82, true],   // expanded
  ['Technology & Devices', 70],
  ['People & Emotions', 56],
];

const SAMPLE_ICON_NAMES = ['flame', 'moon', 'star', 'sparkle', 'eye', 'potion', 'key', 'rune', 'skull', 'hourglass', 'diamond', 'scroll', 'play', 'stop', 'loop', 'tag', 'book', 'cog', 'bulb', 'info', 'download', 'save', 'search', 'edit', 'keyboard'];

function LibraryIconsActual() {
  return (
    <LibChrome activeTab="ICONS">
      <main style={{ flex: 1, padding: '14px 18px', overflow: 'auto', background: 'var(--night)' }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center' }}>
          <div style={{ flex: 1, padding: '6px 12px', background: 'var(--sunk)', border: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--text-mute)' }}>Filter…</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-mute)' }}>0</div>
          <div style={{ padding: '6px 14px', border: '1px solid var(--border)', fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--gold)', letterSpacing: '.1em' }}>SORT ▾</div>
        </div>

        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--text-dim)', marginBottom: 18 }}>
          No custom icons yet. Upload SVG files above.
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--gold)', letterSpacing: '.12em' }}>BUILT-IN ICONS (2289)</div>
          <div style={{ padding: '4px 12px', border: '1px solid var(--border)', fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--gold)', letterSpacing: '.1em' }}>NAMES</div>
        </div>

        {ICON_SECTIONS.map(([name, n, expanded]) => (
          <div key={name} style={{ marginBottom: 4 }}>
            <div style={{
              padding: '10px 8px',
              borderBottom: '1px solid var(--border-soft)',
              display: 'flex', alignItems: 'center', gap: 10,
              fontFamily: 'var(--font-ui)', fontSize: 16, color: 'var(--gold)', letterSpacing: '.06em',
            }}>
              <span style={{ width: 12 }}>{expanded ? '▼' : '▸'}</span>
              <span style={{ flex: 1 }}>{name}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-dim)' }}>{n}</span>
            </div>
            {expanded && (
              <div style={{ padding: '12px 8px', display: 'grid', gridTemplateColumns: 'repeat(20, 1fr)', gap: 6 }}>
                {Array.from({ length: 60 }).map((_, i) => (
                  <div key={i} style={{
                    aspectRatio: '1',
                    border: '1px solid var(--border-soft)',
                    background: 'var(--surface)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--gold)',
                  }}>
                    <PixelIcon name={SAMPLE_ICON_NAMES[i % SAMPLE_ICON_NAMES.length]} size={18} />
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </main>
    </LibChrome>
  );
}

// ═════════════════════════════════════════════════════════════════
// REFINED VARIANTS
// Same bones (4 tabs, sidebar facets, row pattern) — tightened density,
// stronger meta read, clearer type pills, scope chip in the top bar.
// ═════════════════════════════════════════════════════════════════

function LibChromeRefined({ activeTab, children, n, scope, scopeKind = 'AUDIO' }) {
  const TABS = ['AUDIO', 'PADS', 'BOARDS', 'ICONS'];
  return (
    <div className="sb" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{
        display: 'grid', gridTemplateColumns: '180px 1fr 180px',
        alignItems: 'center', gap: 12,
        padding: '8px 16px',
        background: 'var(--deep)',
        borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ color: 'var(--text-dim)', cursor: 'pointer' }}>
            <svg width="18" height="13" viewBox="0 0 18 13" fill="currentColor"><rect x="0" y="0" width="18" height="2"/><rect x="0" y="5" width="18" height="2"/><rect x="0" y="11" width="18" height="2"/></svg>
          </div>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--text-dim)', letterSpacing: '.12em' }}>MENU</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 18, color: 'var(--gold)', letterSpacing: '.14em' }}>LIBRARY</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-mute)' }}>·</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)' }}>{scope || 'Board 1 · all folders'}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
          <ActBtn>?</ActBtn>
          <ActBtn><svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M1 4V1h3M10 4V1H7M1 7v3h3M10 7v3H7"/></svg></ActBtn>
        </div>
      </div>

      {/* Tabs — with counts inline, refined hover treatment */}
      <div style={{ display: 'flex', background: 'var(--night)', padding: '0 16px', borderBottom: '1px solid var(--border)' }}>
        {TABS.map((t) => {
          const isActive = t === activeTab;
          const count = { AUDIO: 99, PADS: 31, BOARDS: 1, ICONS: 2289 }[t];
          return (
            <div key={t} style={{
              padding: '12px 22px',
              fontFamily: 'var(--font-ui)', fontSize: 15,
              color: isActive ? 'var(--gold)' : 'var(--text-mute)',
              letterSpacing: '.14em',
              borderBottom: isActive ? '2px solid var(--gold)' : '2px solid transparent',
              marginBottom: -1,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              {t}
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: isActive ? 'var(--gold-dim)' : 'var(--text-mute)' }}>{count}</span>
            </div>
          );
        })}
      </div>

      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>{children}</div>

      {/* Status footer — replaces the "no recent export" warning with always-on info; backup only flares red when overdue */}
      <div className="sb-status-bar">
        <span className="sb-status-section" style={{ color: 'var(--gold)' }}>LIBRARY</span>
        <span className="sb-status-section">{scopeKind}</span>
        <span className="sb-status-section">{n}</span>
        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: 'var(--blood-bright)' }}>⚠ backup overdue · 3d</span>
          <button className="sb-btn sb-btn-sm sb-btn-danger" style={{ padding: '2px 10px' }}>EXPORT NOW</button>
        </span>
      </div>
    </div>
  );
}

function LibraryAudioRefined() {
  return (
    <LibChromeRefined activeTab="AUDIO" n="99 files · 162.0 MB · 12 unused" scopeKind="AUDIO">
      <aside style={{ width: 220, background: 'var(--deep)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
        <PanelHeaderV2 icon="tag" title="FILTER" active />
        <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <FacetRow label="All sounds"      n={99} active />
          <FacetRow label="In use"          n={87} dot="var(--pad-loop)" />
          <FacetRow label="Unused"          n={12} dot="var(--text-mute)" />
        </div>
        <PanelHeaderV2 icon="book" title="FOLDERS" />
        <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <FacetRow label="All folders"   n={99} active />
          <FacetRow label="Ambient"        n={28} />
          <FacetRow label="Stingers"       n={41} />
          <FacetRow label="Voice"          n={9} />
          <FacetRow label="Music"          n={14} />
          <FacetRow label="Unsorted"       n={7} dim />
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ padding: 10, borderTop: '1px solid var(--border-soft)' }}>
          <button className="sb-btn sb-btn-sm sb-btn-ghost" style={{ width: '100%' }}>+ NEW FOLDER</button>
        </div>
      </aside>

      <main style={{ flex: 1, padding: '14px 18px', background: 'var(--surface)', overflow: 'auto' }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--sunk)', border: '1px solid var(--border)', color: 'var(--text-mute)' }}>
            <PixelIcon name="search" size={13} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>Search 99 sounds…</span>
          </div>
          <button className="sb-btn sb-btn-sm sb-btn-ghost">SORT · NEWEST ▾</button>
          <button className="sb-btn sb-btn-sm sb-btn-filled"><PixelIcon name="download" size={11} /> UPLOAD AUDIO</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {AUDIO_FILES.map((r, i) => <AudioRowRefined key={i} row={r} selected={i === 3} />)}
        </div>
      </main>
    </LibChromeRefined>
  );
}

function FacetRow({ label, n, active, dot, dim }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '6px 10px',
      background: active ? 'var(--top)' : 'transparent',
      borderLeft: active ? '2px solid var(--gold)' : '2px solid transparent',
      fontFamily: 'var(--font-ui)', fontSize: 13,
      color: active ? 'var(--gold)' : 'var(--text-dim)',
      opacity: dim ? .6 : 1,
      letterSpacing: '.04em',
      cursor: 'pointer',
    }}>
      {dot && <span style={{ width: 6, height: 6, background: dot }} />}
      <span style={{ flex: 1 }}>{label}</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-mute)' }}>{n}</span>
    </div>
  );
}

function AudioRowRefined({ row, selected }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '24px 1fr 220px 90px 100px auto', gap: 12, alignItems: 'center',
      padding: '8px 12px',
      background: selected ? 'var(--top)' : 'var(--raised)',
      borderLeft: selected ? '2px solid var(--gold)' : '2px solid transparent',
    }}>
      <div style={{ width: 14, height: 14, border: '1px solid ' + (selected ? 'var(--gold)' : 'var(--text-mute)'), background: selected ? 'var(--gold)' : 'transparent' }} />

      <div style={{ minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 15, color: 'var(--text)', letterSpacing: '.04em' }}>{row.name}</span>
          {row.used > 0
            ? <span className="sb-pill is-loop" style={{ fontSize: 9 }}><span className="sb-dot"/>USED · {row.used}</span>
            : <span className="sb-pill" style={{ fontSize: 9, color: 'var(--text-mute)' }}>UNUSED</span>}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-mute)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.upload}</div>
      </div>

      {/* tiny inline waveform thumbnail */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 1, height: 22 }}>
        {Array.from({ length: 40 }).map((_, i) => {
          const h = 3 + Math.abs(Math.sin((i + row.name.length) * 0.6)) * 18;
          return <div key={i} style={{ flex: 1, height: h, background: selected ? 'var(--gold)' : 'var(--border)', opacity: selected ? 1 : .7 }} />;
        })}
      </div>

      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{row.size}</span>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-mute)', textAlign: 'right' }}>{row.date}</span>

      <div style={{ display: 'flex', gap: 4 }}>
        <ActBtn><svg width="9" height="9" viewBox="0 0 11 11" fill="currentColor"><polygon points="2,1 9,5.5 2,10"/></svg></ActBtn>
        <ActBtn><svg width="9" height="9" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M1 10l1.5-1.5L8 3l1.5 1.5L4 10l-3 0z"/></svg></ActBtn>
        <ActBtn><svg width="9" height="9" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M1 3h3l1 1h5v6H1z"/></svg></ActBtn>
        <ActBtn danger>×</ActBtn>
      </div>
    </div>
  );
}

function LibraryPadsRefined() {
  return (
    <LibChromeRefined activeTab="PADS" n="31 pads · 5 unused" scopeKind="PADS · CURRENT BOARD">
      <aside style={{ width: 220, background: 'var(--deep)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
        <PanelHeaderV2 icon="cog" title="SCOPE" active />
        <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <FacetRow label="Current board"  n={31} active />
          <FacetRow label="All boards"     n={31} />
        </div>
        <PanelHeaderV2 icon="tag" title="TYPE" />
        <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <FacetRow label="All types"  n={31} active />
          <FacetRow label="S-PAD"      n={21} dot="var(--pad-loop)" />
          <FacetRow label="C-PAD"      n={6}  dot="var(--pad-single)" />
          <FacetRow label="LIST"       n={4}  dot="var(--pad-playlist)" />
        </div>
        <PanelHeaderV2 icon="book" title="FOLDERS" />
        <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <FacetRow label="All folders" n={31} active />
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ padding: 10, borderTop: '1px solid var(--border-soft)' }}>
          <button className="sb-btn sb-btn-sm sb-btn-ghost" style={{ width: '100%' }}>+ NEW FOLDER</button>
        </div>
      </aside>

      <main style={{ flex: 1, padding: '14px 18px', background: 'var(--surface)', overflow: 'auto' }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--sunk)', border: '1px solid var(--border)', color: 'var(--text-mute)' }}>
            <PixelIcon name="search" size={13} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>Search 31 pads…</span>
          </div>
          <button className="sb-btn sb-btn-sm sb-btn-ghost">SORT · NAME ▾</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {PADS_LIST.map((r, i) => <PadRowRefined key={i} row={r} selected={i === 5} />)}
        </div>
      </main>
    </LibChromeRefined>
  );
}

function PadRowRefined({ row, selected }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '70px 1fr 120px auto', gap: 12, alignItems: 'center',
      padding: '8px 12px',
      background: selected ? 'var(--top)' : 'var(--raised)',
      borderLeft: selected ? '2px solid var(--gold)' : '2px solid transparent',
    }}>
      <TypePill kind={row.kind} refined />
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 16, color: 'var(--text)', letterSpacing: '.04em' }}>{row.name}</span>
          {row.hk && (
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: 11,
              padding: '1px 5px',
              background: 'var(--sunk)',
              border: '1px solid var(--border-soft)',
              color: 'var(--text-dim)',
            }}>{row.hk}</span>
          )}
        </div>
        {row.combo && (
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--pad-single)', marginTop: 2 }}>
            ↳ used in {row.combo} combo
          </div>
        )}
      </div>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-mute)' }}>{row.combo ? 'last play 2h ago' : ''}</span>
      <div style={{ display: 'flex', gap: 4 }}>
        <ActBtn><svg width="9" height="9" viewBox="0 0 11 11" fill="currentColor"><polygon points="2,1 9,5.5 2,10"/></svg></ActBtn>
        <ActBtn><svg width="9" height="9" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M1 10l1.5-1.5L8 3l1.5 1.5L4 10l-3 0z"/></svg></ActBtn>
        <button className="sb-btn sb-btn-sm sb-btn-ghost" style={{ padding: '3px 10px' }}>SAVE</button>
        <ActBtn danger>×</ActBtn>
      </div>
    </div>
  );
}

function LibraryBoardsRefined() {
  return (
    <LibChromeRefined activeTab="BOARDS" n="1 board · 31 pads total" scopeKind="BOARDS">
      <main style={{ flex: 1, padding: '14px 18px', background: 'var(--surface)', overflow: 'auto' }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--sunk)', border: '1px solid var(--border)', color: 'var(--text-mute)' }}>
            <PixelIcon name="search" size={13} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>Search boards…</span>
          </div>
          <button className="sb-btn sb-btn-sm sb-btn-ghost">SORT · LAST OPENED ▾</button>
          <button className="sb-btn sb-btn-sm sb-btn-filled"><PixelIcon name="diamond" size={10} /> NEW BOARD</button>
        </div>

        <BoardCardRefined name="Board 1" pads={31} date="22/05/26" lastOpened="2 hours ago" thumbnailMix={['loop', 'single', 'combo', 'playlist', 'loop', 'single']} current />
      </main>
    </LibChromeRefined>
  );
}

function BoardCardRefined({ name, pads, date, lastOpened, thumbnailMix, current }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 18, alignItems: 'center',
      padding: 14,
      background: 'var(--raised)',
      borderLeft: current ? '3px solid var(--gold)' : '3px solid transparent',
    }}>
      {/* Mini thumbnail — shows a coloured 2×3 mosaic representing the pad-type mix */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 14px)', gap: 2 }}>
        {thumbnailMix.map((t, i) => (
          <div key={i} style={{ width: 14, height: 14, background: tColor(t) }} />
        ))}
      </div>

      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 4 }}>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 18, color: 'var(--text)', letterSpacing: '.04em' }}>{name}</span>
          {current && <span className="sb-pill is-on" style={{ fontSize: 9 }}><span className="sb-dot"/>CURRENT</span>}
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)' }}>
          {pads} pads · created {date} · opened {lastOpened}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6 }}>
        <button className="sb-btn sb-btn-sm sb-btn-primary"><PixelIcon name="diamond" size={9} /> OPEN</button>
        <ActBtn><svg width="9" height="9" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M1 10l1.5-1.5L8 3l1.5 1.5L4 10l-3 0z"/></svg></ActBtn>
        <ActBtn><svg width="9" height="9" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.4"><rect x="1" y="4" width="6" height="6"/><rect x="4" y="1" width="6" height="6"/></svg></ActBtn>
        <ActBtn danger>×</ActBtn>
      </div>
    </div>
  );
}

function LibraryIconsRefined() {
  return (
    <LibChromeRefined activeTab="ICONS" n="2289 built-in · 0 custom" scopeKind="ICONS">
      <aside style={{ width: 220, background: 'var(--deep)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
        <PanelHeaderV2 icon="book" title="CATEGORY" active />
        <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 4, overflow: 'auto', flex: 1 }}>
          <FacetRow label="All categories" n={2289} active />
          {ICON_SECTIONS.map(([n, c]) => <FacetRow key={n} label={n} n={c} />)}
        </div>
      </aside>

      <main style={{ flex: 1, padding: '14px 18px', background: 'var(--surface)', overflow: 'auto' }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--sunk)', border: '1px solid var(--border)', color: 'var(--text-mute)' }}>
            <PixelIcon name="search" size={13} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>Search 2289 icons by name…</span>
          </div>
          <button className="sb-btn sb-btn-sm sb-btn-ghost"><PixelIcon name="tag" size={11} /> NAMES</button>
          <button className="sb-btn sb-btn-sm sb-btn-filled"><PixelIcon name="download" size={11} /> UPLOAD SVG</button>
        </div>

        <SectionLabel glyph="diamond">CUSTOM (0)</SectionLabel>
        <div style={{
          padding: 32, border: '1px dashed var(--border)',
          textAlign: 'center', marginBottom: 22,
          fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-mute)',
        }}>
          Drop SVGs here or use UPLOAD above.
        </div>

        <SectionLabel glyph="sparkle">OBJECTS · 82</SectionLabel>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(20, 1fr)', gap: 4, marginBottom: 18 }}>
          {Array.from({ length: 60 }).map((_, i) => (
            <div key={i} style={{
              aspectRatio: '1',
              border: '1px solid var(--border-soft)',
              background: i === 5 ? 'var(--gold-dim)' : 'var(--raised)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: i === 5 ? 'var(--gold-bright)' : 'var(--text-dim)',
              cursor: 'pointer',
            }}>
              <PixelIcon name={SAMPLE_ICON_NAMES[i % SAMPLE_ICON_NAMES.length]} size={16} />
            </div>
          ))}
        </div>

        <SectionLabel glyph="moon">INTERFACE · 115 · collapsed</SectionLabel>
        <div style={{ padding: 10, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-mute)' }}>
          ▸ click to expand
        </div>
      </main>
    </LibChromeRefined>
  );
}

// ═════════════════════════════════════════════════════════════════
// REFINEMENT NOTES — small card listing what changed and why.
// Used inside an artboard alongside the rebuilds.
// ═════════════════════════════════════════════════════════════════
function RefinementNotes() {
  const notes = [
    ['Tab counts inline',           'Each tab shows its count next to its label — no separate stat strip needed.'],
    ['Persistent breadcrumb',       'Top bar always shows current scope (board · folder). No mode confusion.'],
    ['Sidebar = type & scope facets','Facets get an explicit dot in their type colour so scanning is constant-time.'],
    ['Selected row state',          'Whole row swaps to --top with a left-edge accent stripe — clearer than just an outline.'],
    ['Audio row · inline waveform', 'A 22 px waveform thumbnail per row means you scan by SHAPE, not by name.'],
    ['Audio row · usage pill',      'USED · 3 (loop teal) vs UNUSED (mute) — same place every time.'],
    ['Pad row · type pill refined', 'Pill gets a tinted background, not just outline. Stronger at a glance.'],
    ['Pad row · last play time',    '"last play 2h ago" — meta context that today is hidden behind opening the pad.'],
    ['Boards · type mosaic',        'Each board card shows a tiny 2×3 colour mosaic of its pad-type distribution.'],
    ['Backup → status footer',      'The red "no recent export" banner becomes a persistent footer chip with an inline CTA. No more flicker between tabs.'],
    ['Icons · custom dropzone',     'Dedicated upload area, separate from the built-in grid. The empty state is its own block.'],
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {notes.map(([title, body], i) => (
        <div key={i} style={{
          padding: '10px 12px',
          background: 'var(--raised)',
          borderLeft: '3px solid var(--gold)',
        }}>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--gold)', letterSpacing: '.06em', marginBottom: 3 }}>{title}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.4 }}>{body}</div>
        </div>
      ))}
    </div>
  );
}

function RefinementNotesArtboard() {
  return (
    <div className="sb" style={{ padding: 28, overflow: 'auto', height: '100%' }}>
      <div style={{ marginBottom: 18 }}>
        <div className="sb-display" style={{ fontSize: 22 }}>Library Refinements</div>
        <div className="sb-mono" style={{ fontSize: 13, marginTop: 6 }}>
          // bones unchanged · density up · scannability up · footer always honest about backup state
        </div>
      </div>
      <RefinementNotes />
    </div>
  );
}

Object.assign(window, {
  LibraryAudioActual, LibraryPadsActual, LibraryBoardsActual, LibraryIconsActual,
  LibraryAudioRefined, LibraryPadsRefined, LibraryBoardsRefined, LibraryIconsRefined,
  RefinementNotesArtboard, TypePill, FacetRow, ActBtn,
});
