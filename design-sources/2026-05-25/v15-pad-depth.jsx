// v15-pad-depth.jsx — Adding spatial depth to PADs.
// The user likes the spatiality the type-spine already hints at, but wants
// the pads to lift a little more off the canvas — either via more
// contrast or by amplifying the 3D feel. This file explores six
// techniques, side by side, and ends with a recommended stack +
// a full board demo using it.

// ── Single sample pad with a configurable depth treatment ──────
function DepthPad({ depth = 'baseline', type = 'loop', name = 'Rain', hk = 'F2', hot, size = 110 }) {
  const c     = `var(--pad-${type})`;
  const glow  = `var(--pad-${type}-glow)`;
  const iconN = type === 'loop' ? 'loop' : type === 'playlist' ? 'scroll' : type === 'combo' ? 'rune' : 'play';

  // Shared base style — same shape, fonts, spine.
  // The stepped pixel-frame silhouette (matches `.sb-pad` in tokens.css)
  // is applied here so all depth treatments inherit it. Per DESIGN_SYSTEM.md
  // §2 Q1: if the chunky stepped corner shape is needed, use the clip-path
  // — don't draw rectangles.
  const STEP = 5;
  const padClipPath = `polygon(
    0 ${STEP}px, ${STEP}px ${STEP}px, ${STEP}px 0,
    calc(100% - ${STEP}px) 0, calc(100% - ${STEP}px) ${STEP}px, 100% ${STEP}px,
    100% calc(100% - ${STEP}px), calc(100% - ${STEP}px) calc(100% - ${STEP}px), calc(100% - ${STEP}px) 100%,
    ${STEP}px 100%, ${STEP}px calc(100% - ${STEP}px), 0 calc(100% - ${STEP}px)
  )`;

  const base = {
    width: size, minHeight: 100,
    position: 'relative',
    padding: '8px 8px 8px 10px',
    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
    color: 'var(--text)',
    cursor: 'pointer',
    clipPath: padClipPath,
  };

  // Each treatment is one preset. Multiple presets compose into "stack".
  const treatments = {
    // 0 — the current baseline pad. Flat, spine on the left, hairline pixel border.
    baseline: {
      ...base,
      background: 'var(--surface)',
      border: '1px solid var(--border)',
    },

    // A — same pad on a brighter raised face. The simplest possible fix.
    raised: {
      ...base,
      background: 'var(--raised)',
      border: '1px solid var(--border-strong)',
    },

    // B — chunky pixel drop-shadow. Offset 3 px down-right, NO blur, deep
    //     night colour. Reads as "the pad is lifted 3 pixels off the board".
    //     Uses filter:drop-shadow so the shadow follows the stepped clip-path.
    drop: {
      ...base,
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      filter: 'drop-shadow(3px 3px 0 rgba(0,0,0,.7))',
    },

    // C — top highlight + bottom shadow on the face. Adds a tiny
    //     "light from above" feel without any blur.
    bevel: {
      ...base,
      background: `
        linear-gradient(180deg, rgba(255,255,255,.08) 0%, rgba(255,255,255,.04) 12%, transparent 28%) padding-box,
        linear-gradient(0deg, rgba(0,0,0,.32) 0%, rgba(0,0,0,.16) 14%, transparent 38%) padding-box,
        var(--surface) padding-box
      `,
      border: '1px solid var(--border)',
    },

    // D — pixel-edge relief: top + left edges are 1 px brighter than the
    //     face, bottom + right edges 1 px darker. Classic chunky button.
    edge: {
      ...base,
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      boxShadow: `
        inset 1px 1px 0 0 rgba(255,255,255,.10),
        inset -1px -1px 0 0 rgba(0,0,0,.45)
      `,
    },

    // E — recessed canvas hint: pads sit on a deeper --night background
    //     and use --raised as the face. The relationship is what creates
    //     the depth, not the pad itself.
    recessed: {
      ...base,
      background: 'var(--top)',
      border: '1px solid var(--border-strong)',
    },

    // F — full stack — all four techniques combined.
    full: {
      ...base,
      background: `
        linear-gradient(180deg, rgba(255,255,255,.10) 0%, rgba(255,255,255,.04) 12%, transparent 32%) padding-box,
        linear-gradient(0deg, rgba(0,0,0,.30) 0%, rgba(0,0,0,.14) 14%, transparent 38%) padding-box,
        var(--raised) padding-box
      `,
      border: '1px solid var(--border-strong)',
      boxShadow: `
        inset 1px 1px 0 0 rgba(255,255,255,.12),
        inset -1px -1px 0 0 rgba(0,0,0,.40)
      `,
      filter: 'drop-shadow(3px 3px 0 rgba(0,0,0,.65))',
    },
  };

  const style = treatments[depth] || treatments.baseline;

  // Hot state: amber border + outer glow + INNER glow on whatever depth
  // treatment is active. Inner glow is layered onto any existing inset
  // box-shadow (treatments D/F) so the pixel-edge relief is preserved.
  if (hot) {
    style.border = `1px solid ${c}`;
    style.filter = (style.filter ? style.filter + ' ' : '') +
      `drop-shadow(0 0 6px ${glow}) drop-shadow(0 0 14px ${glow})`;
    const innerGlow = `inset 0 0 6px ${glow}, inset 0 0 18px ${glow}`;
    style.boxShadow = style.boxShadow ? `${style.boxShadow}, ${innerGlow}` : innerGlow;
  }

  return (
    <div style={style}>
      {/* Spine — the left-edge type marker we already use */}
      <div style={{
        position: 'absolute', top: 0, left: 0, bottom: 0, width: 3, background: c,
        opacity: hot ? 1 : .85,
      }} />
      {/* Hotkey */}
      <span style={{
        position: 'absolute', top: 6, right: 6,
        fontFamily: 'var(--font-mono)', fontSize: 10,
        color: 'var(--text-dim)', background: 'var(--sunk)',
        border: '1px solid var(--border-soft)', padding: '1px 5px',
      }}>{hk}</span>
      {/* Type tag */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <PixelIcon name={iconN} size={12} color={c} />
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 10, color: c, letterSpacing: '.1em' }}>
          {type.toUpperCase()}
        </span>
      </div>
      <div>
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--text)', letterSpacing: '.04em' }}>{name}</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-mute)' }}>{hot ? 'playing · 0:42' : '∞ · loop'}</div>
      </div>
    </div>
  );
}

// ── Comparison row: same pad in two states (idle + hot) under one treatment
function DepthRow({ depth, title, sub, recommended }) {
  return (
    <div style={{
      padding: 16,
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderLeft: `3px solid ${recommended ? 'var(--gold)' : 'var(--border-strong)'}`,
      display: 'grid', gridTemplateColumns: '300px 1fr',
      gap: 18,
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 14, color: recommended ? 'var(--gold)' : 'var(--text)', letterSpacing: '.06em' }}>
            {title}
          </span>
          {recommended && <span className="sb-pill is-on" style={{ fontSize: 9 }}>★ RECOMMENDED</span>}
        </div>
        <div className="sb-mono" style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.55 }}>{sub}</div>
      </div>
      <div style={{ background: 'var(--night)', padding: 22, display: 'flex', alignItems: 'center', gap: 22 }}>
        <DepthPad depth={depth} type="loop"   name="Rain Heavy" hk="F2" />
        <DepthPad depth={depth} type="loop"   name="Rain Heavy" hk="F2" hot />
        <DepthPad depth={depth} type="single" name="Sword"      hk="F4" />
        <DepthPad depth={depth} type="combo"  name="Boss"       hk="Q"  />
      </div>
    </div>
  );
}

// ── Mini board demo using a given depth treatment ────────────
function MiniBoardWithDepth({ depth, bgDarker, atmosphere }) {
  const PADS = [
    { type: 'single',   t: 'Tavern Door', hk: 'F1' },
    { type: 'loop',     t: 'Rain Heavy',  hk: 'F2', hot: true },
    { type: 'loop',     t: 'Fireplace',   hk: 'F3', hot: true },
    { type: 'single',   t: 'Sword Clash', hk: 'F4' },
    { type: 'single',   t: 'Wolf Howl',   hk: 'F5' },
    { type: 'loop',     t: 'Crowd',       hk: 'F6' },
    { type: 'playlist', t: 'Tavern Mix',  hk: 'F7' },
    { type: 'single',   t: 'Thunder',     hk: 'F8' },
  ];
  return (
    <div style={{
      position: 'relative',
      padding: 18,
      background: bgDarker
        ? 'radial-gradient(70% 60% at 50% 30%, transparent 0%, rgba(0,0,0,.4) 100%), var(--night)'
        : 'radial-gradient(70% 60% at 50% 30%, transparent 0%, rgba(0,0,0,.25) 100%), var(--surface)',
      minHeight: 280, overflow: 'hidden',
    }}>
      {atmosphere && <HearthGlow intensity={.85} />}
      {atmosphere && <AmbientEmbers density={10} />}
      <div style={{
        position: 'relative', zIndex: 1,
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12,
      }}>
        {PADS.map((p) => (
          <DepthPad key={p.t} depth={depth} type={p.type} name={p.t} hk={p.hk} hot={p.hot} size="100%" />
        ))}
      </div>
    </div>
  );
}

// ── The artboard ───────────────────────────────────────────────
function PadDepthArtboard() {
  return (
    <div className="sb" style={{ padding: 28, overflow: 'auto', height: '100%' }}>
      <div style={{ marginBottom: 22 }}>
        <div className="sb-display" style={{ fontSize: 20 }}>PAD Depth · Lifting them off the board</div>
        <div className="sb-mono" style={{ fontSize: 13, marginTop: 6 }}>
          // Six techniques. Each works alone — but combined, they read as a real button cluster.<br/>
          // Every effect is palette-native (no foreign shadows, no glass blur, no faux-3D gradients).
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28 }}>
        <DepthRow depth="baseline" title="0 · BASELINE"
          sub="Current state. Hairline border on the same --surface as the canvas. Pads look 'painted' rather than 'placed'." />

        <DepthRow depth="raised" title="A · BRIGHTER FACE"
          sub="Pad face uses --raised (one tonal step up). Border uses --border-strong. The cheapest, surest contrast win. No new visual vocabulary." />

        <DepthRow depth="drop" title="B · CHUNKY PIXEL SHADOW"
          sub="filter: drop-shadow(3px 3px 0 rgba(0,0,0,.7)). NO blur — a hard pixel offset that follows the stepped silhouette. Reads as 'the pad sits 3 pixels above the board' and stays true to the pixel-art voice." />

        <DepthRow depth="bevel" title="C · LIGHT-FROM-ABOVE BEVEL"
          sub="Top highlight + bottom shadow gradient painted onto the face. Subtle (~8% top, ~30% bottom). Adds dimensionality without adding clutter. Strongest of the 'no extra geometry' wins." />

        <DepthRow depth="edge" title="D · PIXEL-EDGE RELIEF"
          sub="1 px inner highlight on top+left, 1 px inner shadow on bottom+right. The classic chunky-button pixel-art look. Works without any drop-shadow." />

        <DepthRow depth="recessed" title="E · CONTRAST BY CONTEXT"
          sub="Pads stay flat but the canvas behind them goes deeper — board uses --night with a vignette, pads sit on --top. No pad changes; the depth comes from the negative space." />

        <DepthRow depth="full" title="F · FULL STACK" recommended
          sub="Brighter face + bevel + pixel-edge relief + chunky drop-shadow. Reads as 'a real button cluster'. The chunky drop-shadow alone would be heavy; combined with the bevel and 1px edge highlights it feels considered, not gimmicky." />
      </div>

      <PixelDivider glyph="diamond" />

      <SectionLabel glyph="star">RECOMMENDED — full stack, on a deeper board</SectionLabel>
      <div className="sb-mono" style={{ fontSize: 12, color: 'var(--text-dim)', marginBottom: 12, lineHeight: 1.6 }}>
        // The full stack on the existing --surface board, then the same stack with a deeper --night canvas underneath.<br/>
        // Both read as tactile; the bottom version is the one I'd ship.
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 18 }}>
        <div>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--text-mute)', letterSpacing: '.14em', marginBottom: 8 }}>
            FULL STACK · standard board
          </div>
          <MiniBoardWithDepth depth="full" atmosphere />
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--gold)', letterSpacing: '.14em', marginBottom: 8 }}>
            FULL STACK · deeper board · atmosphere on ★
          </div>
          <MiniBoardWithDepth depth="full" bgDarker atmosphere />
        </div>
      </div>

      <PixelDivider glyph="diamond" />

      <SectionLabel glyph="rune">WHAT EACH PART DOES</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 16 }}>
        {[
          ['Brighter face', '+1 tonal step on the pad surface — the immediate contrast win.'],
          ['Pixel-edge relief', '1 px top+left highlight, 1 px bottom+right shadow. Chunky-button feel.'],
          ['Light-from-above bevel', 'Top 8 % highlight + bottom 30 % shadow gradient painted on the face.'],
          ['Chunky pixel shadow', '3 × 3 hard offset drop-shadow, no blur — pixel-perfect with the stepped silhouette.'],
          ['Deeper canvas', '--night background under the pads with a soft inner vignette.'],
          ['Atmosphere still works', 'Embers + hearth glow live BEHIND the pads; the new depth puts pads firmly above them.'],
        ].map(([k, v]) => (
          <div key={k} style={{
            padding: '10px 12px',
            background: 'var(--raised)',
            borderLeft: '3px solid var(--gold)',
          }}>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--gold)', letterSpacing: '.06em', marginBottom: 3 }}>{k}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.4 }}>{v}</div>
          </div>
        ))}
      </div>

      <SectionLabel glyph="moon">A FEW TECHNIQUES I CONSIDERED AND DROPPED</SectionLabel>
      <div className="sb-mono" style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.7 }}>
        ▸ <b>Soft blur shadows</b> — fight the pixel-art voice. Hard offset is always the move here.<br/>
        ▸ <b>Gloss highlight stripe</b> — looks Web 2.0 / Aqua. Already feels dated, doesn't fit the dark fantasy mood.<br/>
        ▸ <b>Animated tilt-on-hover</b> — neat in a portfolio, distracting at the table.<br/>
        ▸ <b>Beveled stepped corners</b> — would require redrawing the pixel-frame clip-path with double thickness. Cost outweighs gain.<br/>
        ▸ <b>Per-pad colour-tinted shadow</b> — pad-coloured shadows would mark "alive" pads but compete with the now-playing aura.
      </div>
    </div>
  );
}

// ── Full-size board demo ──────────────────────────────────────
function FullBoardWithDepth() {
  const SCENES = ['Approach', 'The Tavern', 'Combat — Forest', 'Boss · Necromancer', 'Aftermath'];
  const PADS = [
    { type: 'single',   t: 'Tavern Door', m: '0:04', hk: 'F1' },
    { type: 'loop',     t: 'Rain Heavy',  m: '∞',    hk: 'F2', hot: true },
    { type: 'loop',     t: 'Fireplace',   m: '∞',    hk: 'F3', hot: true },
    { type: 'single',   t: 'Sword Clash', m: '0:02', hk: 'F4' },
    { type: 'single',   t: 'Wolf Howl',   m: '0:08', hk: 'F5' },
    { type: 'loop',     t: 'Crowd',       m: '∞',    hk: 'F6' },
    { type: 'playlist', t: 'Tavern Mix',  m: '14',   hk: 'F7' },
    { type: 'single',   t: 'Thunder',     m: '0:03', hk: 'F8' },
    { type: 'combo',    t: 'Boss Reveal', m: '4ch',  hk: 'Q' },
    { type: 'single',   t: 'Door Slam',   m: '0:01', hk: 'W' },
    { type: 'playlist', t: 'Combat Mix',  m: '6',    hk: 'E' },
    { type: 'loop',     t: 'Whispers',    m: '∞',    hk: 'R' },
    { type: 'single',   t: 'Coin Drop',   m: '0:01', hk: 'T' },
    { type: 'single',   t: 'Owl Hoot',    m: '0:04', hk: 'Y' },
    { type: 'loop',     t: 'Wind',        m: '∞',    hk: 'U' },
    { type: 'single',   t: 'Bell Toll',   m: '0:06', hk: 'I' },
  ];

  return (
    <div className="sb" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <TopBarV2 title="The Tavern" breadcrumb="Board 1 · with depth" mode="game" />

      <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr 280px', flex: 1, minHeight: 0 }}>
        <aside style={{ background: 'var(--deep)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
          <PanelHeaderV2 icon="moon" title="SCENES" active />
          <div style={{ padding: 8 }}>
            {SCENES.map((s, i) => (
              <div key={s} style={{
                padding: '7px 10px',
                background: i === 1 ? 'var(--top)' : 'transparent',
                borderLeft: i === 1 ? '2px solid var(--gold)' : '2px solid transparent',
                fontFamily: 'var(--font-ui)', fontSize: 14,
                color: i === 1 ? 'var(--gold)' : 'var(--text-dim)',
              }}>{s}</div>
            ))}
          </div>
        </aside>

        <main style={{
          position: 'relative',
          padding: 22,
          background: 'radial-gradient(70% 60% at 50% 30%, transparent 0%, rgba(0,0,0,.45) 100%), var(--night)',
          overflow: 'auto',
        }}>
          <HearthGlow intensity={1} />
          <AmbientEmbers density={14} />
          <div style={{ position: 'relative', zIndex: 1, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            {PADS.map((p) => (
              <DepthPad key={p.t} depth="full" type={p.type} name={p.t} hk={p.hk} hot={p.hot} size="100%" />
            ))}
          </div>
        </main>

        <aside style={{ background: 'var(--deep)', borderLeft: '1px solid var(--border)', padding: 14 }}>
          <PanelHeaderV2 icon="sparkle" title="NOW PLAYING" active right={<span className="sb-caption">2</span>} />
          <div style={{ paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <MixerRowV2 type="loop" title="RAIN HEAVY" sub="0:42 / 2:14" value={0.5} />
            <MixerRowV2 type="loop" title="FIREPLACE"  sub="∞ · 0:12"   value={0.6} />
          </div>
          <PanelHeaderV2 icon="diamond" title="MASTER" />
          <div style={{ paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <LabelSliderV2 label="MASTER" value={0.72} />
            <LabelSliderV2 label="AMBIENT" value={0.45} color="var(--pad-loop)" />
            <LabelSliderV2 label="STINGER" value={0.90} color="var(--pad-single)" />
          </div>
        </aside>
      </div>

      <StatusBarV2 mode="game" board="Board 1 · The Tavern · depth stack" info="2 playing" right={<><span>Master 72%</span><span>48 kHz</span></>} />
    </div>
  );
}

Object.assign(window, { DepthPad, MiniBoardWithDepth, PadDepthArtboard, FullBoardWithDepth });
