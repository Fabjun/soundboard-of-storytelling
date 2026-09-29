// themes.jsx — Four theme variations rendered as Home screens, plus
// a compact theme-comparison artboard with hex codes for each palette.

function ThemedScreen({ theme, screen = 'home' }) {
  // The theme class is applied to a wrapper so the CSS variables cascade.
  return (
    <div className={theme ? 'theme-' + theme : ''} style={{ height: '100%' }}>
      {screen === 'home' && <HomeScreen />}
      {screen === 'home-compact' && <HomeScreen compact />}
      {screen === 'board' && <BoardScreen />}
    </div>
  );
}

const THEME_DESCRIPTORS = [
  { id: '',         name: 'Hearth',  tag: 'Default · Blood on the Clocktower',  blurb: 'Warm amber on deep violet. The base palette — works for almost any session.' },
  { id: 'verdant',  name: 'Verdant', tag: 'D&D · forest, tavern, fantasy',      blurb: 'Mossy greens with a gold accent. Reads like an old leather-bound book.' },
  { id: 'neon',     name: 'Neon',    tag: 'Sci-fi · cyberpunk · cyberdeck',     blurb: 'Electric cyan & magenta on midnight blue. For rigs running too hot.' },
  { id: 'crimson',  name: 'Crimson', tag: 'Horror · mystery · gothic',          blurb: 'Bloodred over near-black. For sessions where things go wrong.' },
];

// ── Tiny palette swatch row used in the comparison artboard ─────
function ThemeSwatchRow({ theme }) {
  const ref = React.useRef(null);
  const [colors, setColors] = React.useState({});
  React.useEffect(() => {
    if (!ref.current) return;
    const cs = getComputedStyle(ref.current);
    setColors({
      bg:     cs.getPropertyValue('--sb-bg-base').trim(),
      panel:  cs.getPropertyValue('--sb-bg-panel').trim(),
      border: cs.getPropertyValue('--sb-border').trim(),
      text:   cs.getPropertyValue('--sb-text').trim(),
      dim:    cs.getPropertyValue('--sb-text-dim').trim(),
      amber:  cs.getPropertyValue('--sb-amber').trim(),
      glow:   cs.getPropertyValue('--sb-amber-glow').trim(),
      danger: cs.getPropertyValue('--sb-danger').trim(),
    });
  }, []);
  const desc = THEME_DESCRIPTORS.find((t) => t.id === theme);
  return (
    <div ref={ref} className={theme ? 'theme-' + theme : ''} style={{
      background: 'var(--sb-bg-base)',
      borderRadius: 10,
      border: '1px solid var(--sb-border)',
      padding: 18,
      display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 10 }}>
        <div>
          <div className="sb-display" style={{ fontSize: 28, color: 'var(--sb-amber-glow)' }}>{desc.name}</div>
          <div className="sb-mono" style={{ fontSize: 11, color: 'var(--sb-text-dim)' }}>{desc.tag}</div>
        </div>
        <PixelIcon name="flame" size={26} color="var(--sb-flame)" />
      </div>
      <div className="sb-mono" style={{ fontSize: 11, color: 'var(--sb-text-dim)', lineHeight: 1.4 }}>
        {desc.blurb}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 4 }}>
        {Object.entries(colors).map(([k, v]) => (
          <div key={k} style={{ textAlign: 'center' }}>
            <div style={{ height: 28, background: v, borderRadius: 3, border: '1px solid rgba(255,255,255,.05)' }} />
            <div style={{ fontFamily: 'var(--sb-font-mono)', fontSize: 8, color: 'var(--sb-text-mute)', marginTop: 3, textTransform: 'uppercase' }}>{k}</div>
            <div style={{ fontFamily: 'var(--sb-font-mono)', fontSize: 8, color: 'var(--sb-text-dim)', textTransform: 'uppercase' }}>{v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ThemesComparisonArtboard() {
  return (
    <div className="sb" style={{ padding: 28, overflow: 'auto', height: '100%' }}>
      <div style={{ marginBottom: 18 }}>
        <div className="sb-display" style={{ fontSize: 36 }}>Themes</div>
        <div className="sb-mono" style={{ fontSize: 13, marginTop: 4 }}>
          // four palettes, one design system. Only ~10 tokens differ per theme.
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {THEME_DESCRIPTORS.map((t) => <ThemeSwatchRow key={t.id} theme={t.id} />)}
      </div>
    </div>
  );
}

Object.assign(window, { ThemedScreen, ThemesComparisonArtboard, THEME_DESCRIPTORS });
