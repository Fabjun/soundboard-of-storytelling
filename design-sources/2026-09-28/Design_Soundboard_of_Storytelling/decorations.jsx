// decorations.jsx — Pixel-art ornamental atoms.
// SectionLabel · PixelDivider · CornerBrackets · ArcaneSigil
// Every decoration paints with currentColor so it inherits the local
// theme. No new tokens introduced.

// ── SectionLabel ────────────────────────────────────────────────
// Replaces a plain UPPERCASE caption with a flanked, decorated one:
//     ✦ ── SCENES ─────────────────── ✦
// The two flanking glyphs frame the label; a dashed pixel rule fills
// the remaining row. Use anywhere a `.sb-label` would go.
function SectionLabel({ children, glyph = 'sparkle', size = 12, color, dim = true, line = true }) {
  const c = color || (dim ? 'var(--sb-text-dim)' : 'var(--sb-amber)');
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: c, marginBottom: 12 }}>
      <div style={{ color: 'var(--sb-amber)' }}>
        <PixelIcon name={glyph} size={size} color="currentColor" />
      </div>
      <span style={{
        fontFamily: 'var(--sb-font-ui)',
        fontWeight: 700,
        fontSize: 11,
        letterSpacing: '.18em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
      }}>{children}</span>
      {line && (
        <div style={{
          flex: 1,
          height: 2,
          backgroundImage: 'repeating-linear-gradient(90deg, currentColor 0 2px, transparent 2px 5px)',
          opacity: .55,
        }} />
      )}
      <div style={{ color: 'var(--sb-amber)' }}>
        <PixelIcon name={glyph} size={size} color="currentColor" />
      </div>
    </div>
  );
}

// ── PixelDivider ────────────────────────────────────────────────
// Horizontal rule with a centred ornament. The "line" is a 2px-tall
// dashed pixel run so it reads as crafted, not a CSS hairline.
function PixelDivider({ glyph = 'diamond', size = 12, color, gap = 10, margin = 14 }) {
  const c = color || 'var(--sb-border)';
  const dash = {
    flex: 1,
    height: 2,
    backgroundImage: `repeating-linear-gradient(90deg, ${c} 0 2px, transparent 2px 5px)`,
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap, margin: `${margin}px 0`, color: c }}>
      <div style={dash} />
      <div style={{ color: 'var(--sb-amber)' }}>
        <PixelIcon name={glyph} size={size} color="currentColor" />
      </div>
      <div style={dash} />
    </div>
  );
}

// ── CornerBrackets ──────────────────────────────────────────────
// Four L-shaped pixel brackets at the corners of a region. Useful
// to "frame" emblems, mixer cards, the logo — anywhere the design
// wants to draw the eye without competing with the main card border.
// Renders absolutely-positioned spans inside a relatively-positioned
// wrapper, so the children can be anything.
function CornerBrackets({ size = 12, thickness = 2, color = 'var(--sb-amber)', inset = -4, children, style }) {
  const arm = (top, left, br, bb, bl, bt) => ({
    position: 'absolute',
    top: top, left: left, right: left === undefined ? inset : undefined, bottom: top === undefined ? inset : undefined,
    width: size, height: size,
    borderTop: bt ? `${thickness}px solid ${color}` : 'none',
    borderRight: br ? `${thickness}px solid ${color}` : 'none',
    borderBottom: bb ? `${thickness}px solid ${color}` : 'none',
    borderLeft: bl ? `${thickness}px solid ${color}` : 'none',
    pointerEvents: 'none',
  });
  return (
    <div style={{ position: 'relative', display: 'inline-block', ...style }}>
      {children}
      <span style={arm(inset, inset, false, false, true, true)} />
      <span style={arm(inset, undefined, true, false, false, true)} />
      <span style={arm(undefined, inset, false, true, true, false)} />
      <span style={arm(undefined, undefined, true, true, false, false)} />
    </div>
  );
}

// ── ArcaneSigil ────────────────────────────────────────────────
// A 24×24 pixel emblem composed of a circle, an inner star, and
// four cardinal pips. Used as a decorative flourish above titles or
// as a watermark behind the logo.
const ARCANE_CELLS = (() => {
  const out = [];
  const cx = 12, cy = 12, r1 = 10, r2 = 8;
  // outer pixel circle ring
  for (let y = 0; y < 24; y++) {
    for (let x = 0; x < 24; x++) {
      const d = Math.hypot(x - cx, y - cy);
      if (d >= r1 - 0.6 && d <= r1 + 0.4) out.push(`${x} ${y}`);
    }
  }
  // 4-point star
  const star = [
    '12 4','12 5',
    '12 6','12 7',
    '11 8','12 8','13 8',
    '4 11','5 11','11 11','12 11','13 11','19 11',
    '4 12','5 12','10 12','11 12','12 12','13 12','14 12','19 12',
    '4 13','5 13','11 13','12 13','13 13','19 13',
    '11 15','12 15','13 15',
    '12 16','12 17',
    '12 18','12 19',
  ];
  return [...new Set([...out, ...star])];
})();

function ArcaneSigil({ size = 80, color = 'var(--sb-amber-glow)', glow = true }) {
  return (
    <div style={{
      display: 'inline-block',
      filter: glow ? 'drop-shadow(0 0 6px rgba(245,194,66,.5)) drop-shadow(0 0 14px rgba(245,194,66,.25))' : 'none',
      color,
    }}>
      <svg width={size} height={size} viewBox="0 0 24 24">
        {ARCANE_CELLS.map((c, i) => {
          const [x, y] = c.split(' ').map(Number);
          return <rect key={i} x={x} y={y} width="1" height="1" fill="currentColor" shapeRendering="crispEdges" />;
        })}
      </svg>
    </div>
  );
}

// ── PixelPanel ──────────────────────────────────────────────────
// A drop-in card replacement that gets corner brackets at the four
// corners and an optional title-banner across the top. Used for the
// "hero" mixer card or the master volume block — somewhere a beat of
// extra ceremony reads as intentional, not noisy.
function PixelPanel({ title, glyph = 'sparkle', children, style }) {
  return (
    <div style={{ position: 'relative', ...style }}>
      <div className="sb-card" style={{ paddingTop: title ? 22 : undefined }}>
        {title && (
          <div style={{
            position: 'absolute', top: -8, left: 14, right: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            background: 'var(--sb-bg-base)',
            padding: '0 10px',
            zIndex: 1,
          }}>
            <PixelIcon name={glyph} size={12} color="var(--sb-amber)" />
            <span style={{
              fontFamily: 'var(--sb-font-ui)',
              fontWeight: 700,
              fontSize: 11,
              letterSpacing: '.18em',
              textTransform: 'uppercase',
              color: 'var(--sb-amber)',
            }}>{title}</span>
            <PixelIcon name={glyph} size={12} color="var(--sb-amber)" />
          </div>
        )}
        {children}
      </div>
      {/* 4 corner brackets sit just outside the clipped card so they
          read as ornamental armatures rather than border duplicates. */}
      <span style={{ position: 'absolute', top: -2, left: -2, width: 10, height: 10, borderTop: '2px solid var(--sb-amber)', borderLeft: '2px solid var(--sb-amber)' }} />
      <span style={{ position: 'absolute', top: -2, right: -2, width: 10, height: 10, borderTop: '2px solid var(--sb-amber)', borderRight: '2px solid var(--sb-amber)' }} />
      <span style={{ position: 'absolute', bottom: -2, left: -2, width: 10, height: 10, borderBottom: '2px solid var(--sb-amber)', borderLeft: '2px solid var(--sb-amber)' }} />
      <span style={{ position: 'absolute', bottom: -2, right: -2, width: 10, height: 10, borderBottom: '2px solid var(--sb-amber)', borderRight: '2px solid var(--sb-amber)' }} />
    </div>
  );
}

Object.assign(window, { SectionLabel, PixelDivider, CornerBrackets, ArcaneSigil, PixelPanel });

// ════════════════════════════════════════════════════════════════
// DecorationsArtboard — documents the ornament kit
// ════════════════════════════════════════════════════════════════
function DecorationsArtboard() {
  return (
    <div className="sb" style={{ padding: 28, overflow: 'auto', height: '100%' }}>
      <div style={{ marginBottom: 22 }}>
        <div className="sb-display" style={{ fontSize: 40 }}>Decorations</div>
        <div className="sb-mono" style={{ fontSize: 13, marginTop: 4 }}>
          // pixel-art ornaments for fantasy / mystic / alchemy moods. Use sparingly.
        </div>
      </div>

      <SectionLabel glyph="sparkle">SECTION LABEL</SectionLabel>
      <div style={{ marginBottom: 22 }}>
        <SectionLabel glyph="moon">SCENES</SectionLabel>
        <SectionLabel glyph="tag">TAGS</SectionLabel>
        <SectionLabel glyph="potion">THEME</SectionLabel>
        <SectionLabel glyph="key">BEHAVIOR</SectionLabel>
      </div>

      <SectionLabel glyph="diamond">PIXEL DIVIDER</SectionLabel>
      <div style={{ marginBottom: 22 }}>
        <PixelDivider glyph="diamond" />
        <PixelDivider glyph="star" />
        <PixelDivider glyph="sparkle" />
        <PixelDivider glyph="rune" />
      </div>

      <SectionLabel glyph="rune">CORNER BRACKETS</SectionLabel>
      <div style={{ display: 'flex', gap: 24, marginBottom: 22, alignItems: 'flex-start' }}>
        <CornerBrackets>
          <div style={{ padding: '24px 32px', background: 'var(--sb-bg-panel)', color: 'var(--sb-amber)' }}>
            <PixelIcon name="flame" size={40} />
          </div>
        </CornerBrackets>
        <CornerBrackets color="var(--sb-text-dim)">
          <div style={{ padding: '20px 28px', background: 'var(--sb-bg-panel)', fontFamily: 'var(--sb-font-ui)', fontSize: 12, letterSpacing: '.1em', color: 'var(--sb-text)' }}>
            FRAMED CONTENT
          </div>
        </CornerBrackets>
      </div>

      <SectionLabel glyph="star">ARCANE SIGIL</SectionLabel>
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 22 }}>
        <ArcaneSigil size={64} />
        <ArcaneSigil size={96} />
        <ArcaneSigil size={128} />
        <div className="sb-mono" style={{ fontSize: 12, maxWidth: 220 }}>
          A 24×24 pixel emblem. Use behind the logo, on the About page, or as a watermark on hero cards.
        </div>
      </div>

      <SectionLabel glyph="scroll">PIXEL PANEL</SectionLabel>
      <PixelPanel title="MASTER" glyph="diamond" style={{ width: 320 }}>
        <LabelSlider label="MASTER" value={0.72} />
        <div style={{ height: 12 }} />
        <LabelSlider label="AMBIENT" value={0.45} />
      </PixelPanel>
    </div>
  );
}

Object.assign(window, { DecorationsArtboard });
