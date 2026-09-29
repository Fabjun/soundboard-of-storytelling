// foundations.jsx — Color, Type, Spacing & Icons artboards
// These read tokens from tokens.css via getComputedStyle so any change in
// the stylesheet flows through here automatically.

const HEARTH_COLORS = [
  { group: 'Surfaces · 5-level hierarchy', rows: [
    ['--night',   'L 0.013 · root / behind-everything'],
    ['--deep',    'L 0.024 · toolbars, status bar'],
    ['--surface', 'L 0.034 · primary panels'],
    ['--raised',  'L 0.061 · cards, inputs inside panels'],
    ['--top',     'L 0.094 · hovers, active rows, selection'],
    ['--sunk',    'inset wells (inputs, lists)'],
  ]},
  { group: 'Borders', rows: [
    ['--border',        'default 1px hairline'],
    ['--border-soft',   'dividers inside dense lists'],
    ['--border-strong', 'drag handles, focused inputs'],
    ['--border-gold',   'selected / active'],
    ['--border-blood',  'destructive zones'],
  ]},
  { group: 'Text (AA ratios on --surface)', rows: [
    ['--text',         'primary · 13.1 : 1   ✓ AAA'],
    ['--text-strong',  'high emphasis · 16.3 : 1'],
    ['--text-dim',     'secondary · 6.9 : 1   ✓ AA'],
    ['--text-mute',    'tertiary · 3.8 : 1   ✓ AA-large'],
    ['--text-on-gold', 'foreground on amber fill · 11.5'],
  ]},
  { group: 'Brand — Gold / Blood / Flame', rows: [
    ['--gold',         'primary accent'],
    ['--gold-bright',  'highlights, "now playing"'],
    ['--gold-dim',     'muted gold — dividers'],
    ['--flame',        'logo flame'],
    ['--blood',        'destructive'],
    ['--blood-bright', 'destructive — hover'],
  ]},
  { group: 'PAD types', rows: [
    ['--pad-single',   'gold · once'],
    ['--pad-loop',     'teal · sustained, alive'],
    ['--pad-playlist', 'violet · sequence, ritual'],
    ['--pad-combo',    'copper · chain, orchestral'],
  ]},
  { group: 'Semantic — all palette-derived', rows: [
    ['--success', 'loop teal (was foreign green)'],
    ['--warning', 'gold doubles as caution'],
    ['--danger',  'blood'],
    ['--info',    'violet — hints / meta'],
  ]},
];

function getCssVarHex(name, root) {
  const v = getComputedStyle(root).getPropertyValue(name).trim();
  return v || '—';
}

function ColorRow({ varName, label, themeRoot }) {
  const [hex, setHex] = React.useState(() => getCssVarHex(varName, themeRoot || document.documentElement));
  React.useEffect(() => {
    setHex(getCssVarHex(varName, themeRoot || document.documentElement));
  }, [varName, themeRoot]);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '8px 0', borderBottom: '1px solid var(--sb-border-soft)' }}>
      <div style={{
        width: 36, height: 36, borderRadius: 4,
        background: hex,
        border: '1px solid var(--sb-border)',
        flex: '0 0 36px',
      }} />
      <div style={{ flex: '1 1 auto', minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--sb-font-ui)', fontSize: 12, fontWeight: 600, color: 'var(--sb-text)', letterSpacing: '.04em' }}>
          {varName}
        </div>
        <div style={{ fontFamily: 'var(--sb-font-mono)', fontStyle: 'italic', fontSize: 11, color: 'var(--sb-text-dim)' }}>
          {label}
        </div>
      </div>
      <div style={{ fontFamily: 'var(--sb-font-mono)', fontSize: 12, color: 'var(--sb-text-dim)', textTransform: 'uppercase' }}>
        {hex.toUpperCase()}
      </div>
    </div>
  );
}

function ColorPaletteArtboard() {
  return (
    <div className="sb" style={{ padding: 28, overflow: 'auto', height: '100%' }}>
      <div style={{ marginBottom: 20 }}>
        <div className="sb-display" style={{ fontSize: 40 }}>Color</div>
        <div className="sb-mono" style={{ fontSize: 13, marginTop: 4 }}>
          // tokens.css — every value lives in :root and flows through CSS variables.
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {HEARTH_COLORS.map((group) => (
          <div key={group.group}>
            <div className="sb-label" style={{ fontSize: 11, color: 'var(--sb-text-dim)', marginBottom: 8 }}>
              {group.group}
            </div>
            <div>
              {group.rows.map(([v, label]) => (
                <ColorRow key={v} varName={v} label={label} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TypeArtboard() {
  const Specimen = ({ name, sample, css, sub }) => (
    <div style={{ padding: '18px 0', borderBottom: '1px solid var(--sb-border-soft)' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
        <div className="sb-label" style={{ fontSize: 11, color: 'var(--sb-text-dim)' }}>{name}</div>
        <div className="sb-caption">{sub}</div>
      </div>
      <div style={css}>{sample}</div>
    </div>
  );
  return (
    <div className="sb" style={{ padding: 28, overflow: 'auto', height: '100%' }}>
      <div style={{ marginBottom: 12 }}>
        <div className="sb-display" style={{ fontSize: 40 }}>Type</div>
        <div className="sb-mono" style={{ fontSize: 13, marginTop: 4 }}>
          // three voices: pixel CRT · UI label · italic mono body
        </div>
      </div>

      <Specimen
        name="Display · VT323"
        sub="title, scene headers · weight 400 only"
        sample={<span className="sb-display" style={{ fontSize: 56 }}>Soundboard of Storytelling</span>}
        css={{}}
      />
      <Specimen
        name="Display · small"
        sub="cards, modals · 28–36px"
        sample={<span className="sb-display" style={{ fontSize: 32 }}>The Tavern Burns</span>}
        css={{}}
      />
      <Specimen
        name="UI Label · Space Grotesk 700"
        sub="buttons, menu rows, tabs · uppercase, +.1em tracking"
        sample={<div style={{ display: 'flex', gap: 18, alignItems: 'baseline' }}>
          <span className="sb-label" style={{ fontSize: 22 }}>BOARD</span>
          <span className="sb-label" style={{ fontSize: 18, color: 'var(--sb-amber)' }}>LIBRARY</span>
          <span className="sb-label" style={{ fontSize: 14, color: 'var(--sb-text-dim)' }}>TIPS &amp; TRICKS</span>
          <span className="sb-label" style={{ fontSize: 11, color: 'var(--sb-text-mute)' }}>CAPTION</span>
        </div>}
        css={{}}
      />
      <Specimen
        name="Body · JetBrains Mono Italic"
        sub="subtitles, descriptions · 13–15px"
        sample={<div className="sb-mono" style={{ fontSize: 15 }}>
          A tool for Game-Masters and other creative Creatures.<br/>
          <span style={{ fontSize: 13 }}>Theme, font size &amp; start mode</span>
        </div>}
        css={{}}
      />
      <Specimen
        name="Caption / Code"
        sub="meta · 11px upright mono"
        sample={<div style={{ fontFamily: 'var(--sb-font-mono)', fontSize: 11, color: 'var(--sb-text-mute)', letterSpacing: '.05em' }}>
          v150 · 04:12 · F3 · scene_03.ogg
        </div>}
        css={{}}
      />
    </div>
  );
}

function SpacingArtboard() {
  const SPACES = [
    ['1', 4],['2', 8],['3', 12],['4', 16],['5', 20],['6', 24],['8', 32],['10', 40],['12', 48],['16', 64],
  ];
  const RADII = [
    ['sm', 4], ['pad', 6], ['md', 8], ['lg', 12], ['xl', 16],
  ];
  return (
    <div className="sb" style={{ padding: 28, overflow: 'auto', height: '100%' }}>
      <div style={{ marginBottom: 16 }}>
        <div className="sb-display" style={{ fontSize: 40 }}>Spacing &amp; Radius</div>
        <div className="sb-mono" style={{ fontSize: 13, marginTop: 4 }}>
          // 4px base. Most layouts stay on 8/16/24 — anything finer is intentional.
        </div>
      </div>

      <div className="sb-label" style={{ fontSize: 11, color: 'var(--sb-text-dim)', marginBottom: 10 }}>SCALE</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 28 }}>
        {SPACES.map(([n, px]) => (
          <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 56, fontFamily: 'var(--sb-font-mono)', fontSize: 12, color: 'var(--sb-text-dim)' }}>
              space-{n}
            </div>
            <div style={{ width: px, height: 14, background: 'var(--sb-amber)' }} />
            <div style={{ fontFamily: 'var(--sb-font-mono)', fontSize: 12, color: 'var(--sb-text-mute)' }}>{px}px</div>
          </div>
        ))}
      </div>

      <div className="sb-label" style={{ fontSize: 11, color: 'var(--sb-text-dim)', marginBottom: 10 }}>RADIUS</div>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}>
        {RADII.map(([n, px]) => (
          <div key={n} style={{ textAlign: 'center' }}>
            <div style={{
              width: 58, height: 58,
              background: 'var(--sb-bg-panel)',
              border: '1px solid var(--sb-border)',
              borderRadius: px,
              marginBottom: 6,
            }} />
            <div style={{ fontFamily: 'var(--sb-font-mono)', fontSize: 11, color: 'var(--sb-text-dim)' }}>{n}</div>
            <div style={{ fontFamily: 'var(--sb-font-mono)', fontSize: 10, color: 'var(--sb-text-mute)' }}>{px}px</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 28 }}>
        <div className="sb-label" style={{ fontSize: 11, color: 'var(--sb-text-dim)', marginBottom: 10 }}>ELEVATION</div>
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ flex: 1, height: 70, background: 'var(--sb-bg-panel)', border: '1px solid var(--sb-border)', borderRadius: 8, boxShadow: 'var(--sb-shadow-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--sb-font-mono)', fontSize: 11, color: 'var(--sb-text-dim)' }}>
            shadow-card
          </div>
          <div style={{ flex: 1, height: 70, background: 'var(--sb-bg-panel)', border: '1px solid var(--sb-border)', borderRadius: 8, boxShadow: 'var(--sb-shadow-pop)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--sb-font-mono)', fontSize: 11, color: 'var(--sb-text-dim)' }}>
            shadow-pop
          </div>
          <div style={{ flex: 1, height: 70, background: 'var(--sb-bg-panel)', border: '1px solid var(--sb-amber)', borderRadius: 8, boxShadow: 'var(--sb-glow-amber)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--sb-font-mono)', fontSize: 11, color: 'var(--sb-amber)' }}>
            glow-amber
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Pixel-art icon system ─────────────────────────────────────────
// Icons are 16×16 pixel grids. Each definition is a list of "x y"
// strings — we paint them once via SVG <rect>s so they render crisp
// at any size. This keeps the pixel character of the flame logo
// consistent across every icon in the app.

const PIXEL_ICONS = {
  flame: [
    '7 1','8 1',
    '6 2','7 2','8 2','9 2',
    '5 3','6 3','8 3','9 3','10 3',
    '5 4','6 4','7 4','8 4','9 4','10 4','11 4',
    '4 5','5 5','7 5','9 5','10 5','11 5',
    '4 6','5 6','6 6','9 6','10 6','11 6','12 6',
    '3 7','4 7','5 7','6 7','7 7','9 7','10 7','11 7','12 7',
    '3 8','4 8','5 8','6 8','7 8','8 8','10 8','11 8','12 8',
    '3 9','4 9','5 9','6 9','7 9','8 9','9 9','10 9','11 9','12 9',
    '3 10','4 10','5 10','6 10','7 10','8 10','9 10','10 10','11 10','12 10',
    '4 11','5 11','6 11','7 11','8 11','9 11','10 11','11 11',
    '5 12','6 12','7 12','8 12','9 12','10 12',
    '6 13','7 13','8 13','9 13',
  ],
  play:    ['5 3','5 4','5 5','5 6','5 7','5 8','5 9','5 10','5 11','5 12',
            '6 4','6 5','6 6','6 7','6 8','6 9','6 10','6 11',
            '7 5','7 6','7 7','7 8','7 9','7 10',
            '8 6','8 7','8 8','8 9',
            '9 7','9 8'],
  stop:    Array.from({length:8},(_,y)=>Array.from({length:8},(_,x)=>`${x+4} ${y+4}`)).flat(),
  loop:    ['5 4','6 4','7 4','8 4','9 4','10 4',
            '4 5','11 5',
            '3 6','12 6',
            '3 7','12 7','11 7',
            '3 8','12 8','10 8',
            '3 9','12 9','9 9','10 9','11 9',
            '4 10','11 10',
            '5 11','6 11','7 11','8 11','9 11','10 11'],
  tag:     ['3 6','4 6','5 6','6 6','7 6','8 6','9 6','10 6',
            '3 7','10 7','11 7',
            '3 8','11 8','12 8',
            '3 9','12 9',
            '3 10','11 10','12 10',
            '3 11','10 11','11 11',
            '3 12','4 12','5 12','6 12','7 12','8 12','9 12','10 12',
            '5 9','6 9'],
  book:    ['3 3','4 3','5 3','6 3','7 3','9 3','10 3','11 3','12 3',
            '3 4','7 4','9 4','12 4',
            '3 5','7 5','9 5','12 5',
            '3 6','7 6','9 6','12 6',
            '3 7','7 7','9 7','12 7',
            '3 8','7 8','9 8','12 8',
            '3 9','7 9','9 9','12 9',
            '3 10','7 10','9 10','12 10',
            '3 11','7 11','9 11','12 11',
            '3 12','4 12','5 12','6 12','7 12','9 12','10 12','11 12','12 12'],
  cog:     ['7 2','8 2',
            '5 3','7 3','8 3','10 3',
            '5 4','7 4','8 4','10 4',
            '4 5','5 5','11 5',
            '2 6','3 6','5 6','6 6','7 6','8 6','9 6','10 6','12 6','13 6',
            '2 7','3 7','5 7','6 7','9 7','10 7','12 7','13 7',
            '2 8','3 8','5 8','6 8','9 8','10 8','12 8','13 8',
            '2 9','3 9','5 9','6 9','7 9','8 9','9 9','10 9','12 9','13 9',
            '4 10','5 10','11 10',
            '5 11','7 11','8 11','10 11',
            '5 12','7 12','8 12','10 12',
            '7 13','8 13'],
  bulb:    ['6 2','7 2','8 2','9 2',
            '5 3','10 3',
            '4 4','11 4',
            '4 5','11 5',
            '4 6','11 6',
            '4 7','11 7',
            '5 8','6 8','9 8','10 8',
            '6 9','7 9','8 9','9 9',
            '7 10','8 10',
            '6 11','7 11','8 11','9 11',
            '7 12','8 12',
            '7 13','8 13'],
  info:    ['6 2','7 2','8 2','9 2',
            '5 3','10 3',
            '4 4','7 4','8 4','11 4',
            '4 5','11 5',
            '4 6','7 6','8 6','11 6',
            '4 7','6 7','7 7','8 7','11 7',
            '4 8','7 8','8 8','11 8',
            '4 9','7 9','8 9','11 9',
            '4 10','7 10','8 10','11 10',
            '5 11','7 11','8 11','10 11',
            '6 12','7 12','8 12','9 12'],
  download:['7 2','8 2',
            '7 3','8 3',
            '7 4','8 4',
            '7 5','8 5',
            '5 6','7 6','8 6','10 6',
            '5 7','6 7','7 7','8 7','9 7','10 7',
            '6 8','7 8','8 8','9 8',
            '7 9','8 9',
            '3 12','4 12','5 12','6 12','7 12','8 12','9 12','10 12','11 12','12 12'],
  save:    ['3 3','4 3','5 3','6 3','7 3','8 3','9 3','10 3','11 3',
            '3 4','11 4','12 4',
            '3 5','5 5','6 5','7 5','8 5','12 5',
            '3 6','5 6','7 6','12 6',
            '3 7','12 7',
            '3 8','12 8',
            '3 9','5 9','6 9','7 9','8 9','9 9','12 9',
            '3 10','5 10','9 10','12 10',
            '3 11','5 11','9 11','12 11',
            '3 12','4 12','5 12','6 12','7 12','8 12','9 12','10 12','11 12','12 12'],
  search:  ['5 3','6 3','7 3','8 3',
            '4 4','9 4',
            '3 5','10 5',
            '3 6','10 6',
            '3 7','10 7',
            '3 8','10 8',
            '4 9','9 9',
            '5 10','6 10','7 10','8 10','10 10',
            '11 11','12 11',
            '12 12','13 12'],
  edit:    ['10 2','11 2',
            '9 3','10 3','11 3','12 3',
            '8 4','9 4','10 4','11 4',
            '7 5','8 5','9 5','10 5',
            '6 6','7 6','8 6','9 6',
            '5 7','6 7','7 7','8 7',
            '4 8','5 8','6 8','7 8',
            '3 9','4 9','5 9','6 9',
            '3 10','4 10','5 10',
            '3 11','4 11','5 11',
            '3 12','4 12'],
  keyboard:['2 4','3 4','4 4','5 4','6 4','7 4','8 4','9 4','10 4','11 4','12 4','13 4',
            '2 5','13 5',
            '2 6','3 6','5 6','6 6','8 6','9 6','11 6','12 6','13 6',
            '2 7','13 7',
            '2 8','4 8','5 8','7 8','8 8','10 8','11 8','13 8',
            '2 9','13 9',
            '2 10','4 10','5 10','6 10','7 10','8 10','9 10','10 10','11 10','13 10',
            '2 11','3 11','4 11','5 11','6 11','7 11','8 11','9 11','10 11','11 11','12 11','13 11'],

  // ── Mystic / Alchemy set ────────────────────────────────────────
  // Used as decorative motifs in section labels, dividers, corners.
  moon:    ['6 2','7 2','8 2',
            '4 3','5 3','6 3','7 3','8 3','9 3',
            '3 4','4 4','5 4','6 4','7 4',
            '2 5','3 5','4 5','5 5',
            '2 6','3 6','4 6',
            '2 7','3 7','4 7',
            '2 8','3 8','4 8',
            '2 9','3 9','4 9',
            '2 10','3 10','4 10','5 10',
            '3 11','4 11','5 11','6 11','7 11',
            '4 12','5 12','6 12','7 12','8 12','9 12',
            '6 13','7 13','8 13'],

  star:    ['7 2','8 2',
            '7 3','8 3',
            '6 4','7 4','8 4','9 4',
            '6 5','7 5','8 5','9 5',
            '5 6','6 6','7 6','8 6','9 6','10 6',
            '2 7','3 7','4 7','5 7','6 7','7 7','8 7','9 7','10 7','11 7','12 7','13 7',
            '2 8','3 8','4 8','5 8','6 8','7 8','8 8','9 8','10 8','11 8','12 8','13 8',
            '5 9','6 9','7 9','8 9','9 9','10 9',
            '6 10','7 10','8 10','9 10',
            '6 11','7 11','8 11','9 11',
            '7 12','8 12',
            '7 13','8 13'],

  // sparkle — smaller 4-point twinkle, good for inline ornaments
  sparkle: ['7 3','8 3',
            '6 4','7 4','8 4','9 4',
            '7 5','8 5',
            '2 7','3 7',          '7 7','8 7',          '12 7','13 7',
            '2 8','3 8',          '7 8','8 8',          '12 8','13 8',
            '7 9','8 9',
            '6 11','7 11','8 11','9 11',
            '7 12','8 12'],

  eye:     ['6 4','7 4','8 4','9 4',
            '4 5','5 5','10 5','11 5',
            '2 6','3 6','12 6','13 6',
            '1 7','14 7',
            '1 8','6 8','7 8','8 8','9 8','14 8',
            '1 9','6 9','7 9','8 9','9 9','14 9',
            '2 10','3 10','12 10','13 10',
            '4 11','5 11','10 11','11 11',
            '6 12','7 12','8 12','9 12'],

  potion:  ['6 2','7 2','8 2','9 2',
            '6 3','9 3',
            '6 4','7 4','8 4','9 4',
            '6 5','7 5','8 5','9 5',
            '4 6','5 6','6 6','7 6','8 6','9 6','10 6','11 6',
            '3 7','11 7',
            '2 8','7 8','8 8','12 8',
            '2 9','5 9','6 9','7 9','8 9','9 9','10 9','12 9',
            '2 10','5 10','6 10','7 10','8 10','9 10','10 10','12 10',
            '2 11','5 11','6 11','7 11','8 11','9 11','10 11','12 11',
            '3 12','5 12','6 12','7 12','8 12','9 12','10 12','11 12',
            '3 13','4 13','5 13','6 13','7 13','8 13','9 13','10 13','11 13','12 13'],

  key:     ['6 3','7 3','8 3',
            '5 4','9 4',
            '4 5','10 5',
            '4 6','7 6','10 6',
            '4 7','10 7',
            '5 8','9 8',
            '6 9','7 9','8 9',
            '7 10','8 10',
            '7 11','8 11','9 11','10 11',
            '7 12','8 12',
            '7 13','8 13','9 13'],

  rune:    ['7 2','8 2',
            '6 3','7 3','8 3','9 3',
            '6 4','9 4',
            '5 5','10 5',
            '5 6','10 6',
            '4 7','11 7',
            '4 8','7 8','8 8','11 8',
            '3 9','12 9',
            '2 10','3 10','4 10','5 10','6 10','7 10','8 10','9 10','10 10','11 10','12 10','13 10',
            '7 11','8 11',
            '7 12','8 12',
            '6 13','7 13','8 13','9 13'],

  // skull — small memento mori
  skull:   ['5 3','6 3','7 3','8 3','9 3','10 3',
            '4 4','11 4',
            '3 5','12 5',
            '3 6','5 6','6 6','9 6','10 6','12 6',
            '3 7','5 7','6 7','9 7','10 7','12 7',
            '3 8','12 8',
            '3 9','7 9','8 9','12 9',
            '4 10','11 10',
            '5 11','6 11','7 11','8 11','9 11','10 11',
            '5 12','7 12','9 12',
            '5 13','7 13','9 13'],

  // hourglass — passing of time
  hourglass:['3 2','4 2','5 2','6 2','7 2','8 2','9 2','10 2','11 2','12 2',
            '4 3','5 3','6 3','7 3','8 3','9 3','10 3','11 3',
            '5 4','6 4','7 4','8 4','9 4','10 4',
            '6 5','7 5','8 5','9 5',
            '7 6','8 6',
            '6 7','7 7','8 7','9 7',
            '5 8','6 8','9 8','10 8',
            '4 9','5 9','10 9','11 9',
            '4 10','5 10','6 10','7 10','8 10','9 10','10 10','11 10',
            '3 11','4 11','5 11','6 11','7 11','8 11','9 11','10 11','11 11','12 11',
            '3 12','4 12','5 12','6 12','7 12','8 12','9 12','10 12','11 12','12 12'],

  // diamond — used as the simplest ornament
  diamond: ['7 4','8 4',
            '6 5','7 5','8 5','9 5',
            '5 6','6 6','7 6','8 6','9 6','10 6',
            '4 7','5 7','6 7','7 7','8 7','9 7','10 7','11 7',
            '4 8','5 8','6 8','7 8','8 8','9 8','10 8','11 8',
            '5 9','6 9','7 9','8 9','9 9','10 9',
            '6 10','7 10','8 10','9 10',
            '7 11','8 11'],

  // pen-and-scroll
  scroll:  ['3 3','4 3','5 3','6 3','7 3','8 3','9 3','10 3','11 3',
            '2 4','12 4',
            '3 5','4 5','5 5','6 5','7 5','8 5','9 5','10 5','11 5',
            '3 6','5 6','6 6','7 6','8 6','9 6','10 6','11 6',
            '3 7','5 7','7 7','8 7','9 7','11 7',
            '3 8','5 8','6 8','7 8','8 8','9 8','10 8','11 8',
            '3 9','5 9','6 9','7 9','8 9','9 9','11 9',
            '3 10','11 10',
            '3 11','4 11','5 11','6 11','7 11','8 11','9 11','10 11','11 11',
            '2 12','12 12',
            '3 13','4 13','5 13','6 13','7 13','8 13','9 13','10 13','11 13'],
};

function PixelIcon({ name, size = 16, color = 'currentColor' }) {
  const cells = PIXEL_ICONS[name] || [];
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" style={{ display: 'block' }}>
      {cells.map((c, i) => {
        const [x, y] = c.split(' ').map(Number);
        return <rect key={i} x={x} y={y} width="1" height="1" fill={color} shapeRendering="crispEdges" />;
      })}
    </svg>
  );
}

const ICON_GROUPS = [
  { name: 'UI', icons: ['flame', 'play', 'stop', 'loop', 'tag', 'book', 'cog', 'bulb', 'info', 'download', 'save', 'search', 'edit', 'keyboard'] },
  { name: 'Mystic · Alchemy', icons: ['moon', 'star', 'sparkle', 'eye', 'potion', 'key', 'rune', 'skull', 'hourglass', 'diamond', 'scroll'] },
];

function IconsArtboard() {
  return (
    <div className="sb" style={{ padding: 28, overflow: 'auto', height: '100%' }}>
      <div style={{ marginBottom: 16 }}>
        <div className="sb-display" style={{ fontSize: 40 }}>Iconography</div>
        <div className="sb-mono" style={{ fontSize: 13, marginTop: 4 }}>
          // 16×16 pixel grid · paint with currentColor · render at 16/24/32
        </div>
      </div>

      {ICON_GROUPS.map((g) => (
        <div key={g.name} style={{ marginBottom: 20 }}>
          <div className="sb-label" style={{ fontSize: 11, color: 'var(--sb-text-dim)', marginBottom: 8 }}>{g.name.toUpperCase()}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
            {g.icons.map((n) => (
              <div key={n} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: 'var(--sb-bg-panel)',
                border: '1px solid var(--sb-border)',
                padding: '8px 12px',
              }}>
                <div style={{ color: g.name.startsWith('Mystic') ? 'var(--sb-amber-glow)' : 'var(--sb-amber)' }}>
                  <PixelIcon name={n} size={26} />
                </div>
                <div style={{ fontFamily: 'var(--sb-font-mono)', fontSize: 11, color: 'var(--sb-text-dim)' }}>{n}</div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="sb-label" style={{ fontSize: 11, color: 'var(--sb-text-dim)', marginBottom: 10 }}>SCALE</div>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 22, color: 'var(--sb-amber)' }}>
        {[16, 24, 32, 48, 64].map((s) => (
          <div key={s} style={{ textAlign: 'center' }}>
            <PixelIcon name="flame" size={s} />
            <div style={{ fontFamily: 'var(--sb-font-mono)', fontSize: 11, color: 'var(--sb-text-mute)', marginTop: 4 }}>{s}px</div>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { PixelIcon, ColorPaletteArtboard, TypeArtboard, SpacingArtboard, IconsArtboard });
