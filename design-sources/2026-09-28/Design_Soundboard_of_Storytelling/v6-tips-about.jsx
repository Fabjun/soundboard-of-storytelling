// v6-tips-about.jsx — Tips & Tricks + About, faithful + refined.

// ─────────────────────────────────────────────────────────────────
// Shared chrome — same top bar as Library / Settings
// ─────────────────────────────────────────────────────────────────
function PageChrome({ title, children, footer = true }) {
  return (
    <div className="sb" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center', gap: 12, padding: '10px 16px',
        background: 'var(--night)', borderBottom: '1px solid var(--gold-dim)',
      }}>
        <div style={{
          padding: '5px 14px', border: '1px solid var(--gold)',
          color: 'var(--gold)', fontFamily: 'var(--font-ui)', fontSize: 14,
          letterSpacing: '.1em', width: 'fit-content',
        }}>MENU</div>
        <div style={{
          fontFamily: 'var(--font-ui)', fontSize: 20,
          color: 'var(--gold)', letterSpacing: '.14em', textAlign: 'center',
        }}>{title}</div>
        <div style={{ display: 'flex', gap: 10, color: 'var(--gold)', justifyContent: 'flex-end' }}>
          <div style={{ border: '1px solid var(--gold-dim)', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-ui)', fontSize: 14 }}>?</div>
          <div style={{ border: '1px solid var(--gold-dim)', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M1 4V1h3M11 4V1H8M1 8v3h3M11 8v3H8"/></svg>
          </div>
        </div>
      </div>
      <main style={{ flex: 1, overflow: 'auto', background: 'var(--night)' }}>{children}</main>
      {footer && (
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
            padding: '6px 14px', background: 'var(--blood)', color: '#fff',
            fontFamily: 'var(--font-ui)', fontSize: 13, letterSpacing: '.1em',
          }}>EXPORT NOW</div>
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// TIPS & TRICKS · FAITHFUL (the user's current page)
// ═════════════════════════════════════════════════════════════════
function TipsActual() {
  const TIPS = [
    ['SETUP|GAME',  'SETUP ⇆ GAME MODE', 'The SETUP|GAME switch at the top of the board toggles between modes. In SETUP mode (blue) you can edit pads. In GAME mode (gold) keys and taps trigger sounds.'],
    ['↕ Drag',      'MOVING PADS',       'In SETUP mode, hold a pad and drag it to a new position — a line indicator shows where it will be inserted, and all pads in between shift by one slot. A short tap opens the edit panel. Drag & drop is disabled in GAME mode.'],
    ['Fade',        'FADE-IN / FADE-OUT','Configurable per pad in the edit panel (0–10s). Fade-In gradually raises the volume when the sound starts. Fade-Out lowers it when stopping. Enter stops immediately without a fade.'],
    ['Space',       'PAUSE / RESUME',    'Pauses all running sounds and resumes them on the next press. Works on every screen and in GAME mode. Exception: when a text input field is active.'],
    ['Enter',       'STOP ALL',          'Immediately stops all running sounds and resets their position to the beginning. Works on every screen and in GAME mode.'],
    ['Escape',      'BACK / CANCEL',     'Navigates back to the main menu. If the edit panel is open, Escape closes it (= Cancel). Has no effect in GAME mode.'],
    ['Tap',         'ASSIGN SOUND-PAD',  'In SETUP mode, tap a pad to open the edit panel. Click the key field and press the desired key — the code is detected automatically.'],
    ['⚠',           'KEY CONFLICT',      'When saving, the app checks whether a key is already assigned to another pad. If there is a conflict, a warning is shown.'],
  ];
  return (
    <PageChrome title="TIPS & TRICKS">
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 32px' }}>
        {TIPS.map(([key, title, body], i) => (
          <div key={i} style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 18, padding: '18px 0', borderBottom: '1px solid var(--border-soft)' }}>
            <div style={{
              padding: '8px 14px',
              border: '1px solid var(--mode-setup)',
              color: 'var(--mode-setup)',
              background: 'var(--surface)',
              fontFamily: 'var(--font-mono)', fontSize: 13, letterSpacing: '.05em',
              textAlign: 'center', height: 'fit-content',
            }}>{key}</div>
            <div>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: 17, color: 'var(--text)', letterSpacing: '.04em', marginBottom: 4 }}>{title}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.5 }}>{body}</div>
            </div>
          </div>
        ))}
      </div>
    </PageChrome>
  );
}

// ═════════════════════════════════════════════════════════════════
// TIPS & TRICKS · REFINED
// Strategy: drop the blue chips, build proper pixel-art "key caps",
// group by category, two-column card layout. The page becomes a
// scannable cheat sheet, not a wall of prose.
// ═════════════════════════════════════════════════════════════════

// A real pixel-art key cap: chunky rectangle with a faux 3D step on the
// bottom-right, paints in palette colours not foreign blue. Variants:
//  · default — text-dim outline
//  · game    — gold (only active in GAME mode)
//  · setup   — teal  (only active in SETUP mode)
//  · always  — gold-bright (works everywhere)
function KeyCap({ children, kind = 'default', wide }) {
  const C = {
    default: { stroke: 'var(--text-dim)',   text: 'var(--text)',        face: 'var(--raised)' },
    game:    { stroke: 'var(--gold)',       text: 'var(--gold-bright)', face: 'var(--surface)' },
    setup:   { stroke: 'var(--mode-setup)', text: 'var(--mode-setup)',  face: 'var(--surface)' },
    always:  { stroke: 'var(--gold-bright)',text: 'var(--gold-bright)', face: 'var(--surface)' },
  }[kind];
  return (
    <div style={{ display: 'inline-block', position: 'relative', minWidth: wide ? 96 : 36 }}>
      {/* bottom-right step (gives the "key cap" depth) */}
      <div style={{
        position: 'absolute', top: 3, left: 3, right: -3, bottom: -3,
        background: 'var(--sunk)',
        border: `1px solid ${C.stroke}`,
        opacity: .6,
        zIndex: 0,
      }} />
      <div style={{
        position: 'relative', zIndex: 1,
        padding: wide ? '8px 14px' : '6px 8px',
        minHeight: 32, minWidth: 32,
        background: C.face,
        border: `2px solid ${C.stroke}`,
        color: C.text,
        fontFamily: 'var(--font-ui)',
        fontSize: 14, letterSpacing: '.06em',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', lineHeight: 1,
      }}>{children}</div>
    </div>
  );
}

// Two key caps with a + between them — for combos
function KeyCombo({ keys, kind, wide }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      {keys.map((k, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span style={{ color: 'var(--text-mute)', fontFamily: 'var(--font-mono)', fontSize: 13 }}>+</span>}
          <KeyCap kind={kind} wide={wide || k.length > 4}>{k}</KeyCap>
        </React.Fragment>
      ))}
    </div>
  );
}

function TipCard({ title, desc, keys, kind, modeChip }) {
  return (
    <div style={{
      padding: 16,
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderLeft: `3px solid ${kind === 'game' ? 'var(--gold)' : kind === 'setup' ? 'var(--mode-setup)' : kind === 'always' ? 'var(--gold-bright)' : 'var(--border-strong)'}`,
      display: 'flex', flexDirection: 'column', gap: 12,
      height: '100%',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 16, color: 'var(--text)', letterSpacing: '.06em', marginBottom: 4 }}>{title}</div>
          {modeChip && (
            <div style={{
              display: 'inline-block',
              padding: '1px 8px',
              background: kind === 'game' ? 'rgba(212,178,92,.12)' : kind === 'setup' ? 'rgba(109,181,184,.12)' : 'rgba(245,213,122,.12)',
              border: '1px solid ' + (kind === 'game' ? 'var(--gold)' : kind === 'setup' ? 'var(--mode-setup)' : 'var(--gold-bright)'),
              color: kind === 'game' ? 'var(--gold)' : kind === 'setup' ? 'var(--mode-setup)' : 'var(--gold-bright)',
              fontFamily: 'var(--font-ui)', fontSize: 10, letterSpacing: '.14em',
            }}>{modeChip}</div>
          )}
        </div>
        <div style={{ flex: '0 0 auto' }}>
          {Array.isArray(keys[0]) ? <KeyCombo keys={keys.flat()} kind={kind} /> : <KeyCombo keys={keys} kind={kind} />}
        </div>
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.5 }}>{desc}</div>
    </div>
  );
}

function TipsRefined() {
  const SECTIONS = [
    {
      glyph: 'rune', label: 'MODES & NAVIGATION',
      items: [
        { title: 'Toggle SETUP / GAME', kind: 'always', modeChip: 'BOTH', keys: ['TAB'],
          desc: 'Switch between editing and playing. Or click the SETUP|GAME pill at the top of the board.' },
        { title: 'Back / cancel', kind: 'setup', modeChip: 'SETUP', keys: ['ESC'],
          desc: 'Closes the edit panel if it is open. Otherwise returns to the main menu. Has no effect in GAME mode.' },
        { title: 'Find a pad by name', kind: 'always', modeChip: 'BOTH', keys: ['/'],
          desc: 'Jumps focus into the search field above the pad grid.' },
      ],
    },
    {
      glyph: 'play', label: 'PLAYBACK',
      items: [
        { title: 'Pause / resume', kind: 'always', modeChip: 'BOTH', keys: ['SPACE'],
          desc: 'Pauses all running sounds and resumes them on the next press. Does not work while a text input is focused.' },
        { title: 'Stop all sounds', kind: 'always', modeChip: 'BOTH', keys: ['ENTER'],
          desc: 'Immediately stops every running sound and rewinds them to the beginning. See SERIAL vs TOTAL in Settings → Controls.' },
        { title: 'Trigger a pad', kind: 'game', modeChip: 'GAME', keys: ['F1', '…', 'F12'],
          desc: 'In GAME mode, pressing a pad\'s assigned key plays its sound. Multi-key combos are allowed for combo pads.' },
        { title: 'Crossfade to next scene', kind: 'game', modeChip: 'GAME', keys: [['⇧', 'SPACE']],
          desc: 'Stops the current loops while starting the next scene\'s loops at the same time — duration set in Settings → Audio.' },
      ],
    },
    {
      glyph: 'edit', label: 'EDITING (SETUP MODE)',
      items: [
        { title: 'Open pad editor', kind: 'setup', modeChip: 'SETUP', keys: ['TAP'],
          desc: 'Tap any pad in SETUP mode to open its editor. Click the key field and press the desired key — the code is captured automatically.' },
        { title: 'Move a pad', kind: 'setup', modeChip: 'SETUP', keys: ['HOLD', '+', 'DRAG'],
          desc: 'Hold a pad and drag it to a new position. A line indicator shows where it will land; pads in between shift by one slot.' },
        { title: 'Duplicate a pad', kind: 'setup', modeChip: 'SETUP', keys: [['⌘', 'D']],
          desc: 'Creates a copy in the next empty slot with the same name and audio file.' },
        { title: 'Delete selected', kind: 'setup', modeChip: 'SETUP', keys: ['DEL'],
          desc: 'Removes the selected pad after confirmation. The audio file is kept in the Library unless you also remove it there.' },
      ],
    },
    {
      glyph: 'potion', label: 'PER-PAD AUDIO',
      items: [
        { title: 'Fade-in / fade-out', kind: 'setup', modeChip: 'EDITOR', keys: ['SLIDER'],
          desc: 'Per pad in the editor (0–10 s). Fade-In raises volume on start; Fade-Out lowers it on stop. ENTER stops without a fade.' },
        { title: 'Trim start / end', kind: 'setup', modeChip: 'EDITOR', keys: ['DRAG'],
          desc: 'Drag the teal markers on the waveform to set in/out points. The orange playhead shows the current preview position.' },
        { title: 'Long-press in GAME mode', kind: 'game', modeChip: 'GAME', keys: ['LONG-TAP'],
          desc: 'Configurable in Settings → Controls. Defaults to per-pad volume slider; can be set to PREVIEW or EDIT.' },
      ],
    },
    {
      glyph: 'key', label: 'CONFLICTS & DIAGNOSTICS',
      items: [
        { title: 'Key conflict warning', kind: 'always', modeChip: 'BOTH', keys: ['⚠'],
          desc: 'When saving a pad, the app checks whether the chosen key is already assigned to another pad. If so, you can reassign or override.' },
        { title: 'Find numpad codes', kind: 'always', modeChip: 'SETTINGS', keys: ['KEY TEST'],
          desc: 'Settings → Controls → KEY TEST. Press any key on your input device and the app shows you the captured code.' },
      ],
    },
  ];

  return (
    <PageChrome title="TIPS & TRICKS" footer={false}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 32px' }}>
        {/* Quick filter / search */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 22 }}>
          <div style={{
            flex: 1, display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 12px',
            background: 'var(--sunk)', border: '1px solid var(--border)',
            color: 'var(--text-mute)',
          }}>
            <PixelIcon name="search" size={13} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13 }}>Search shortcuts…</span>
          </div>
          <div style={{ display: 'flex', gap: 4 }}>
            <span className="sb-pill is-on">ALL</span>
            <span className="sb-pill" style={{ color: 'var(--mode-setup)', borderColor: 'var(--mode-setup)' }}>SETUP</span>
            <span className="sb-pill" style={{ color: 'var(--gold)', borderColor: 'var(--gold)' }}>GAME</span>
          </div>
        </div>

        {SECTIONS.map((sec) => (
          <div key={sec.label} style={{ marginBottom: 26 }}>
            <SectionLabel glyph={sec.glyph}>{sec.label}</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {sec.items.map((tip, i) => <TipCard key={i} {...tip} />)}
            </div>
          </div>
        ))}

        {/* Legend */}
        <div style={{
          padding: 14,
          background: 'var(--surface)',
          border: '1px solid var(--border-soft)',
          display: 'flex', gap: 22, alignItems: 'center',
          marginTop: 8,
        }}>
          <span className="sb-mono" style={{ fontSize: 12 }}>// Key cap colour =</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <KeyCap kind="game">F1</KeyCap>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)' }}>GAME mode only</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <KeyCap kind="setup">ESC</KeyCap>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)' }}>SETUP mode only</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <KeyCap kind="always">SPACE</KeyCap>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)' }}>Always available</span>
          </div>
        </div>
      </div>
    </PageChrome>
  );
}

// ═════════════════════════════════════════════════════════════════
// ABOUT · FAITHFUL
// ═════════════════════════════════════════════════════════════════
function AboutActual() {
  return (
    <PageChrome title="ABOUT">
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '30px 32px' }}>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 15, color: 'var(--text-dim)', lineHeight: 1.6, marginBottom: 20 }}>
          This tool was made by me for the purpose of supporting my adventures as a game master — and maybe it will help you too.
        </p>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 15, color: 'var(--text-dim)', lineHeight: 1.6, marginBottom: 30 }}>
          The app is designed to work in the simplest way possible without limiting your creative freedom. Its one and only purpose is interactive sound design managed live by a game master. This is <i>not</i> a professional sound editing tool.
        </p>

        <div style={{ height: 1, background: 'var(--border-soft)', marginBottom: 22 }} />

        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 16, color: 'var(--gold)', letterSpacing: '.16em', textAlign: 'center', marginBottom: 18 }}>WHAT IS A PAD?</div>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 15, color: 'var(--text-dim)', lineHeight: 1.6, marginBottom: 14 }}>
          A PAD is a programmable button you can use to play any sound you like. By this design you can trigger sounds from any device with any interface — a phone or a computer, a keyboard or a numpad, a touchscreen or a mouse.
        </p>
        <p style={{ fontFamily: 'var(--font-mono)', fontStyle: 'italic', fontSize: 14, color: 'var(--pad-playlist)', marginBottom: 28 }}>
          PAD — Professional Atmospheric Delusion
        </p>

        <div style={{ height: 1, background: 'var(--border-soft)', marginBottom: 22 }} />

        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 16, color: 'var(--gold)', letterSpacing: '.16em', textAlign: 'center', marginBottom: 18 }}>SINGLE PADS</div>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 15, color: 'var(--text-dim)', lineHeight: 1.6, marginBottom: 14 }}>
          Each Single-PAD has one of three behaviours:
        </p>

        {[
          ['SOLO', 'A single sound file. Press the pad and the sound plays once.'],
          ['LOOP', 'A single sound file with a configurable repeat count — or set to ∞ for an endless background loop.'],
          ['LIST', 'A playlist of multiple sound files played in sequence or shuffled. The whole list can be looped.'],
        ].map(([k, body]) => (
          <div key={k} style={{ borderLeft: '3px solid var(--mode-setup)', paddingLeft: 14, marginBottom: 14 }}>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 15, color: 'var(--text)', letterSpacing: '.06em' }}>{k}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.5 }}>{body}</div>
          </div>
        ))}

        <div style={{ height: 1, background: 'var(--border-soft)', margin: '24px 0' }} />

        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 16, color: 'var(--gold)', letterSpacing: '.16em', textAlign: 'center', marginBottom: 18 }}>COMBO-PADS</div>
        <p style={{ fontFamily: 'var(--font-mono)', fontSize: 15, color: 'var(--text-dim)', lineHeight: 1.6 }}>
          A Combo-PAD combines multiple Single-PADs into one programmable sequence. Inside the Combo editor…
        </p>
      </div>
    </PageChrome>
  );
}

// ═════════════════════════════════════════════════════════════════
// ABOUT · REFINED
// Strategy: lead with a hero (logo + manifesto), then visual PAD-type
// cards with mini pad illustrations instead of text-only lists. Right
// rail with version / credits / links. No foreign blue accents.
// ═════════════════════════════════════════════════════════════════

function MiniPad({ type, name = 'EXAMPLE', hk, big }) {
  const c = `var(--pad-${type})`;
  return (
    <div style={{
      width: big ? 100 : 70, height: big ? 100 : 70,
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      position: 'relative',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'space-between',
      padding: '5px 4px 4px',
    }}>
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 3, background: c }} />
      {hk && <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--gold)' }}>{hk}</div>}
      <div style={{ color: c }}>
        <PixelIcon name={type === 'single' ? 'flame' : type === 'loop' ? 'loop' : type === 'playlist' ? 'scroll' : 'rune'} size={big ? 36 : 24} />
      </div>
      <div style={{ fontFamily: 'var(--font-ui)', fontSize: big ? 10 : 9, color: 'var(--gold)', letterSpacing: '.04em' }}>{name}</div>
    </div>
  );
}

function AboutRefined() {
  return (
    <PageChrome title="ABOUT" footer={false}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 0, minHeight: '100%' }}>
        {/* Main column — the manifesto */}
        <div style={{ padding: '36px 40px' }}>

          {/* Hero */}
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <div style={{ display: 'inline-block', position: 'relative', padding: '10px 14px', marginBottom: 16 }}>
              <FlameLogo size={72} />
              <span style={{ position: 'absolute', top: 0, left: 0, width: 12, height: 12, borderTop: '2px solid var(--gold)', borderLeft: '2px solid var(--gold)' }} />
              <span style={{ position: 'absolute', top: 0, right: 0, width: 12, height: 12, borderTop: '2px solid var(--gold)', borderRight: '2px solid var(--gold)' }} />
              <span style={{ position: 'absolute', bottom: 0, left: 0, width: 12, height: 12, borderBottom: '2px solid var(--gold)', borderLeft: '2px solid var(--gold)' }} />
              <span style={{ position: 'absolute', bottom: 0, right: 0, width: 12, height: 12, borderBottom: '2px solid var(--gold)', borderRight: '2px solid var(--gold)' }} />
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--gold-bright)', letterSpacing: '.04em', lineHeight: 1.4, marginBottom: 12 }}>
              SOUNDBOARD<br/>OF STORYTELLING
            </div>
            <div className="sb-mono is-italic" style={{ fontSize: 14, color: 'var(--text-dim)' }}>
              // a tool for game-masters and other creative creatures
            </div>
          </div>

          {/* Manifesto card — feels like a letter from the maker */}
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderLeft: '3px solid var(--gold)',
            padding: '24px 28px',
            marginBottom: 32,
            position: 'relative',
          }}>
            <div style={{
              position: 'absolute', top: -8, left: 18,
              padding: '0 10px', background: 'var(--night)',
              fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--gold)', letterSpacing: '.18em',
            }}>// MANIFESTO</div>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--text)', lineHeight: 1.7, marginTop: 4 }}>
              This tool was made by me, for the purpose of supporting my adventures as a game-master — and maybe it will help you too.
            </p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.7 }}>
              The app is designed to work in the simplest way possible without limiting your creative freedom. Its one and only purpose is interactive sound design managed live by a game-master. This is <span style={{ color: 'var(--gold-bright)', fontStyle: 'italic' }}>not</span> a professional sound editing tool.
            </p>
            <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-mute)' }}>
              <PixelIcon name="flame" size={14} color="var(--flame)" />
              <span className="sb-mono" style={{ fontSize: 12, fontStyle: 'italic' }}>— the maker</span>
            </div>
          </div>

          {/* What is a PAD */}
          <SectionLabel glyph="diamond">WHAT IS A PAD?</SectionLabel>
          <div style={{
            display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 24, alignItems: 'center',
            padding: '6px 0 24px',
          }}>
            <MiniPad type="single" name="WIND" hk="F2" big />
            <div>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.6, marginBottom: 10 }}>
                A PAD is a programmable button you can use to play any sound you like. Trigger them from any device with any interface — phone, computer, keyboard, numpad, touchscreen, or mouse.
              </p>
              <div style={{
                display: 'inline-block',
                padding: '4px 10px',
                background: 'rgba(157,127,199,.10)',
                border: '1px solid var(--pad-playlist)',
                fontFamily: 'var(--font-mono)', fontStyle: 'italic',
                fontSize: 12, color: 'var(--pad-playlist)',
                letterSpacing: '.04em',
              }}>
                PAD · Professional Atmospheric Delusion
              </div>
            </div>
          </div>

          {/* PAD type cards */}
          <SectionLabel glyph="sparkle">THE THREE BEHAVIOURS OF A SINGLE-PAD</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 26 }}>
            <PadTypeCard type="single" name="SOLO" tag="ONE-SHOT"
              desc="A single sound file. Press the pad and the sound plays once."
              example="bell deep · sword clash · door slam" />
            <PadTypeCard type="loop" name="LOOP" tag="SUSTAINED"
              desc="A single sound file with a configurable repeat count — or set to ∞ for an endless background loop."
              example="rain · fire · crowd murmur" />
            <PadTypeCard type="playlist" name="LIST" tag="SEQUENCE"
              desc="A playlist of multiple sound files played in sequence or shuffled. The whole list can be looped."
              example="combat mix · tavern playlist" />
          </div>

          {/* Combo */}
          <SectionLabel glyph="rune">COMBO-PADS — CHOREOGRAPHY</SectionLabel>
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            padding: 18, marginBottom: 24,
            display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 22, alignItems: 'center',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <MiniPad type="loop" name="HEART" />
              <div style={{ color: 'var(--pad-combo)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>→</div>
              <MiniPad type="single" name="THUNDER" />
              <div style={{ color: 'var(--pad-combo)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>→</div>
              <MiniPad type="playlist" name="BOSS" />
            </div>
            <div>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--text-dim)', lineHeight: 1.6, marginBottom: 6 }}>
                A <span style={{ color: 'var(--pad-combo)' }}>COMBO-PAD</span> chains together other pads into one timed sequence. Set per-step wait times, fades and volume offsets. One key triggers the whole reveal.
              </p>
              <div className="sb-mono" style={{ fontSize: 12 }}>// example: a boss-encounter combo above plays heartbeat, then thunders, then drops the boss theme.</div>
            </div>
          </div>
        </div>

        {/* Right rail — version + credits + links */}
        <aside style={{ background: 'var(--deep)', borderLeft: '1px solid var(--border)', padding: '36px 24px', display: 'flex', flexDirection: 'column', gap: 26 }}>
          <div>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--text-mute)', letterSpacing: '.16em', marginBottom: 6 }}>VERSION</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, color: 'var(--gold-bright)', letterSpacing: '.04em' }}>v 150</div>
            <div className="sb-mono" style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 4 }}>build 26 · 23/05/26</div>
          </div>

          <div>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--text-mute)', letterSpacing: '.16em', marginBottom: 8 }}>BUILT WITH</div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <CreditItem icon="potion" label="Web Audio API" />
              <CreditItem icon="diamond" label="Pixel-art icons" sub="2 289 built-in" />
              <CreditItem icon="cog" label="Design system v2" sub="25/05/26" />
            </ul>
          </div>

          <div>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--text-mute)', letterSpacing: '.16em', marginBottom: 8 }}>LINKS</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <RailLink>Source · GitHub</RailLink>
              <RailLink>Report an issue</RailLink>
              <RailLink>Changelog</RailLink>
              <RailLink>License · MIT</RailLink>
            </div>
          </div>

          <div style={{ flex: 1 }} />

          <div style={{
            padding: 14,
            background: 'var(--surface)',
            border: '1px solid var(--gold-dim)',
            borderLeft: '3px solid var(--gold)',
          }}>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--gold)', letterSpacing: '.14em', marginBottom: 6 }}>SUPPORT THE PROJECT</div>
            <div className="sb-mono" style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.5 }}>
              If this tool saved you a session — buy me a coffee or share it with another GM.
            </div>
          </div>
        </aside>
      </div>
    </PageChrome>
  );
}

function PadTypeCard({ type, name, tag, desc, example }) {
  const c = `var(--pad-${type})`;
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderLeft: `3px solid ${c}`,
      padding: 16,
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <MiniPad type={type} name={name} />
        <div>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 16, color: c, letterSpacing: '.1em' }}>{name}</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '.1em', marginTop: 2 }}>{tag}</div>
        </div>
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.5 }}>{desc}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-mute)', lineHeight: 1.4 }}>// {example}</div>
    </div>
  );
}

function CreditItem({ icon, label, sub }) {
  return (
    <li style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <PixelIcon name={icon} size={14} color="var(--gold)" />
      <div>
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--text)', letterSpacing: '.04em' }}>{label}</div>
        {sub && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-mute)' }}>{sub}</div>}
      </div>
    </li>
  );
}
function RailLink({ children }) {
  return (
    <a style={{
      padding: '5px 0',
      fontFamily: 'var(--font-mono)', fontSize: 13,
      color: 'var(--text-dim)', cursor: 'pointer',
      borderBottom: '1px dashed var(--border-soft)',
      display: 'flex', alignItems: 'center', gap: 6,
    }}>
      <span style={{ color: 'var(--gold)' }}>→</span> {children}
    </a>
  );
}

Object.assign(window, { TipsActual, TipsRefined, AboutActual, AboutRefined, KeyCap, KeyCombo });
