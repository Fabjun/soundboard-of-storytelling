// v17-pad-appearance.jsx — Pad Appearance settings + live preview.
// Lifts the visual experiments from v15 (depth treatments, inner/outer
// glow) into the Settings → Display flow, with a single pad preview that
// updates as the user touches each control.
//
// Convention check: the preview pad uses the stepped pixel-frame clip-path
// (DESIGN_SYSTEM.md §2 Q1) — no rectangle pads. Inner glow is a layered
// inset box-shadow; outer glow uses filter:drop-shadow (clip-path eats
// box-shadow, DESIGN_SYSTEM.md §8.8).

const { useState } = React;

// ── Preview pad — same shape & layout as DepthPad in v15, parameterised
// for both depth treatment AND glow intensity sliders.
function PreviewPad({
  depth = 'full',
  type = 'loop',
  name = 'Rain Heavy',
  hk = 'F2',
  hot = true,
  innerGlow = 1,        // 0..1.5 multiplier
  outerGlow = 1,        // 0..1.5 multiplier
  dropShadow = 1,       // 0..1.5 multiplier — for "drop" / "full" treatments
  size = 140,
}) {
  const c     = `var(--pad-${type})`;
  const glow  = `var(--pad-${type}-glow)`;
  const iconN = type === 'loop' ? 'loop' : type === 'playlist' ? 'scroll' : type === 'combo' ? 'rune' : 'play';

  const STEP = 5;
  const padClipPath = `polygon(
    0 ${STEP}px, ${STEP}px ${STEP}px, ${STEP}px 0,
    calc(100% - ${STEP}px) 0, calc(100% - ${STEP}px) ${STEP}px, 100% ${STEP}px,
    100% calc(100% - ${STEP}px), calc(100% - ${STEP}px) calc(100% - ${STEP}px), calc(100% - ${STEP}px) 100%,
    ${STEP}px 100%, ${STEP}px calc(100% - ${STEP}px), 0 calc(100% - ${STEP}px)
  )`;

  const base = {
    width: size, minHeight: 120,
    position: 'relative',
    padding: '10px 10px 10px 12px',
    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
    color: 'var(--text)',
    cursor: 'pointer',
    clipPath: padClipPath,
  };

  // Treatments mirror v15 — same identifiers.
  const treatments = {
    baseline: { ...base, background: 'var(--surface)', border: '1px solid var(--border)' },
    raised:   { ...base, background: 'var(--raised)',  border: '1px solid var(--border-strong)' },
    drop: {
      ...base,
      background: 'var(--surface)',
      border: '1px solid var(--border)',
    },
    bevel: {
      ...base,
      background: `
        linear-gradient(180deg, rgba(255,255,255,.08) 0%, rgba(255,255,255,.04) 12%, transparent 28%) padding-box,
        linear-gradient(0deg, rgba(0,0,0,.32) 0%, rgba(0,0,0,.16) 14%, transparent 38%) padding-box,
        var(--surface) padding-box
      `,
      border: '1px solid var(--border)',
    },
    edge: {
      ...base,
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      boxShadow: `inset 1px 1px 0 0 rgba(255,255,255,.10), inset -1px -1px 0 0 rgba(0,0,0,.45)`,
    },
    recessed: {
      ...base, background: 'var(--top)', border: '1px solid var(--border-strong)',
    },
    full: {
      ...base,
      background: `
        linear-gradient(180deg, rgba(255,255,255,.10) 0%, rgba(255,255,255,.04) 12%, transparent 32%) padding-box,
        linear-gradient(0deg, rgba(0,0,0,.30) 0%, rgba(0,0,0,.14) 14%, transparent 38%) padding-box,
        var(--raised) padding-box
      `,
      border: '1px solid var(--border-strong)',
      boxShadow: `inset 1px 1px 0 0 rgba(255,255,255,.12), inset -1px -1px 0 0 rgba(0,0,0,.40)`,
    },
  };

  const style = { ...(treatments[depth] || treatments.baseline) };

  // Drop shadow on the appropriate treatments — scaled by slider.
  if ((depth === 'drop' || depth === 'full') && dropShadow > 0) {
    const off = Math.max(1, Math.round(3 * dropShadow));
    style.filter = `drop-shadow(${off}px ${off}px 0 rgba(0,0,0,${Math.min(0.85, 0.7 * dropShadow)}))`;
  }

  // Hot state: pad-color border + outer glow + inner glow.
  if (hot) {
    style.border = `1px solid ${c}`;

    if (outerGlow > 0) {
      const o1 = Math.round(6  * outerGlow);
      const o2 = Math.round(14 * outerGlow);
      const outerFilter = `drop-shadow(0 0 ${o1}px ${glow}) drop-shadow(0 0 ${o2}px ${glow})`;
      style.filter = style.filter ? `${style.filter} ${outerFilter}` : outerFilter;
    }

    if (innerGlow > 0) {
      const i1 = Math.round(6  * innerGlow);
      const i2 = Math.round(18 * innerGlow);
      const innerStr = `inset 0 0 ${i1}px ${glow}, inset 0 0 ${i2}px ${glow}`;
      style.boxShadow = style.boxShadow ? `${style.boxShadow}, ${innerStr}` : innerStr;
    }
  }

  return (
    <div style={style}>
      {/* Type spine */}
      <div style={{
        position: 'absolute', top: 0, left: 0, bottom: 0, width: 3, background: c,
        opacity: hot ? 1 : .85,
      }} />
      {/* Hotkey chip */}
      <span style={{
        position: 'absolute', top: 8, right: 8,
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
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 14, color: 'var(--text)', letterSpacing: '.04em' }}>{name}</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-mute)' }}>
          {hot ? 'playing · 0:42' : '∞ · loop'}
        </div>
      </div>
    </div>
  );
}

// ── Settings page: PAD APPEARANCE inside Display submenu ────────────────
function PadAppearanceSettings() {
  const DEPTHS = ['BASELINE', 'RAISED', 'DROP', 'BEVEL', 'EDGE', 'RECESSED', 'FULL'];
  const TYPES  = ['SINGLE', 'LOOP', 'PLAYLIST', 'COMBO'];

  const [depth,      setDepth]      = useState('FULL');
  const [innerGlow,  setInnerGlow]  = useState(1.0);
  const [outerGlow,  setOuterGlow]  = useState(1.0);
  const [dropShadow, setDropShadow] = useState(1.0);
  const [type,       setType]       = useState('LOOP');
  const [hot,        setHot]        = useState(true);

  return (
    <div className="sb" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <TopBarV2 title="Settings · Display · Pad Appearance" icon="cog" breadcrumb="Settings" mode="setup" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', flex: 1, minHeight: 0 }}>

        {/* LEFT — settings rows */}
        <main style={{ background: 'var(--surface)', overflow: 'auto' }}>
          <div style={{
            padding: '20px 32px 16px',
            borderBottom: '1px solid var(--border-soft)',
          }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--gold-bright)', letterSpacing: '.06em', marginBottom: 6 }}>
              Pad Appearance
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)' }}>
              // depth treatment · glow intensities · preview type — all changes apply live
            </div>
          </div>

          <div style={{ padding: '20px 32px 8px' }}>
            <SectionLabel glyph="diamond">DEPTH TREATMENT</SectionLabel>
          </div>
          <SettingRow
            label="Depth treatment"
            desc="The shape language of every pad. BASELINE = flat hairline. RAISED = brighter face. DROP = chunky pixel shadow. BEVEL = light-from-above face. EDGE = 1px inner relief. RECESSED = pads on deeper canvas. FULL = all four combined."
            control={
              <ChunkySegmented options={DEPTHS} active={depth} onPick={setDepth} />
            }
          />

          <div style={{ padding: '24px 32px 8px' }}>
            <SectionLabel glyph="sparkle">GLOW · WHEN PLAYING</SectionLabel>
          </div>
          <SettingRow
            label="Inner glow"
            desc="Soft light from inside the pad when it is playing. Uses --pad-*-glow."
            control={<SliderRow value={innerGlow} onChange={setInnerGlow} color={`var(--pad-${type.toLowerCase()})`} />}
          />
          <SettingRow
            label="Outer glow"
            desc="Outward halo around the pad. Hard pixel falloff — no blur stack."
            control={<SliderRow value={outerGlow} onChange={setOuterGlow} color={`var(--pad-${type.toLowerCase()})`} />}
          />
          <SettingRow
            label="Drop shadow"
            desc="Hard pixel-offset shadow under the pad (DROP and FULL treatments only)."
            control={
              <SliderRow
                value={dropShadow}
                onChange={setDropShadow}
                color="var(--text-dim)"
                disabled={depth !== 'DROP' && depth !== 'FULL'}
              />
            }
          />

          <div style={{ padding: '24px 32px 8px' }}>
            <SectionLabel glyph="moon">PREVIEW STATE</SectionLabel>
          </div>
          <SettingRow
            label="Pad type"
            desc="Preview the appearance under each pad-type palette."
            control={<ChunkySegmented options={TYPES} active={type} onPick={setType} />}
          />
          <SettingRow
            label="Playing"
            desc="Toggle the 'hot' state — glow only applies when playing."
            control={
              <ChunkySegmented
                options={['IDLE', 'PLAYING']}
                active={hot ? 'PLAYING' : 'IDLE'}
                onPick={(v) => setHot(v === 'PLAYING')}
              />
            }
          />

          <div style={{ padding: '24px 32px', display: 'flex', gap: 8 }}>
            <button
              className="sb-btn sb-btn-sm sb-btn-ghost"
              onClick={() => {
                setDepth('FULL');
                setInnerGlow(1); setOuterGlow(1); setDropShadow(1);
                setType('LOOP'); setHot(true);
              }}
            >
              <PixelIcon name="loop" size={10} /> RESET TO DEFAULTS
            </button>
            <button className="sb-btn sb-btn-sm sb-btn-filled">
              <PixelIcon name="save" size={10} /> APPLY TO ALL PADS
            </button>
          </div>
        </main>

        {/* RIGHT — sticky live preview */}
        <aside style={{
          background: 'var(--deep)',
          borderLeft: '1px solid var(--border)',
          padding: 24,
          display: 'flex', flexDirection: 'column',
          position: 'sticky', top: 0, height: '100%',
        }}>
          <PanelHeaderV2 icon="sparkle" title="LIVE PREVIEW" active />

          <div style={{
            flex: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 22,
            margin: '14px 0',
            background: depth.toLowerCase() === 'recessed'
              ? 'radial-gradient(60% 50% at 50% 35%, transparent 0%, rgba(0,0,0,.45) 100%), var(--night)'
              : 'var(--night)',
            border: '1px solid var(--border)',
          }}>
            <PreviewPad
              depth={depth.toLowerCase()}
              type={type.toLowerCase()}
              hot={hot}
              innerGlow={innerGlow}
              outerGlow={outerGlow}
              dropShadow={dropShadow}
              size={160}
            />
          </div>

          {/* Read-out — current settings as a value tape */}
          <div style={{
            padding: 12,
            background: 'var(--sunk)',
            border: '1px solid var(--border)',
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--text-dim)', lineHeight: 1.7,
          }}>
            <div><span style={{ color: 'var(--text-mute)' }}>depth</span>       <span style={{ color: 'var(--gold)' }}>{depth}</span></div>
            <div><span style={{ color: 'var(--text-mute)' }}>inner-glow</span>  <span style={{ color: 'var(--text)' }}>{innerGlow.toFixed(2)}</span></div>
            <div><span style={{ color: 'var(--text-mute)' }}>outer-glow</span>  <span style={{ color: 'var(--text)' }}>{outerGlow.toFixed(2)}</span></div>
            <div><span style={{ color: 'var(--text-mute)' }}>drop-shadow</span> <span style={{ color: 'var(--text)' }}>{dropShadow.toFixed(2)}</span></div>
            <div><span style={{ color: 'var(--text-mute)' }}>type</span>        <span style={{ color: `var(--pad-${type.toLowerCase()})` }}>{type}</span></div>
            <div><span style={{ color: 'var(--text-mute)' }}>state</span>       <span style={{ color: hot ? 'var(--gold-bright)' : 'var(--text-mute)' }}>{hot ? 'PLAYING' : 'IDLE'}</span></div>
          </div>
        </aside>
      </div>

      <StatusBarV2
        mode="setup"
        board="Settings · Display"
        info="appearance"
        right={<><span>preview live</span><span>auto-saved</span></>}
      />
    </div>
  );
}

// ── Slider + numeric readout, matches the v5 settings density ─────────
function SliderRow({ value, onChange, color = 'var(--gold)', disabled }) {
  const pct = Math.round((value / 1.5) * 100);
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      width: 280,
      opacity: disabled ? 0.4 : 1,
      pointerEvents: disabled ? 'none' : 'auto',
    }}>
      <div style={{
        flex: 1, height: 6,
        background: 'var(--sunk)', border: '1px solid var(--border)',
        position: 'relative', cursor: 'pointer',
      }}
        onClick={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const v = Math.max(0, Math.min(1.5, ((e.clientX - r.left) / r.width) * 1.5));
          onChange(v);
        }}
      >
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct}%`, background: color }} />
        <div style={{
          position: 'absolute', left: `${pct}%`, top: -3, width: 4, height: 10,
          background: color, transform: 'translateX(-50%)',
        }} />
      </div>
      <span style={{
        minWidth: 52, textAlign: 'right',
        fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)',
      }}>{value.toFixed(2)}×</span>
    </div>
  );
}

// ── Segmented control (clickable, matches v5 visual but with onPick) ──
function ChunkySegmented({ options, active, onPick, color = 'var(--gold)' }) {
  return (
    <div style={{ display: 'inline-flex', border: `1px solid ${color}`, flexWrap: 'wrap', maxWidth: 320 }}>
      {options.map((o) => (
        <div
          key={o}
          onClick={() => onPick && onPick(o)}
          style={{
            padding: '5px 12px',
            fontFamily: 'var(--font-ui)', fontSize: 11, letterSpacing: '.10em',
            color: o === active ? 'var(--text-on-gold)' : color,
            background: o === active ? color : 'transparent',
            cursor: 'pointer',
            borderRight: `1px solid ${color}`,
          }}
        >{o}</div>
      ))}
    </div>
  );
}

Object.assign(window, { PreviewPad, PadAppearanceSettings, ChunkySegmented });
