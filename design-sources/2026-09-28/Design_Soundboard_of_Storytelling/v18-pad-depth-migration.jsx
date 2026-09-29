// v18-pad-depth-migration.jsx — B1 from the Slice-3 todo list.
// Updated: all four proposals from the original stress-test landed in
// tokens.css and DESIGN_SYSTEM.md. This artboard now shows the resolved
// state — six treatments, all expressible inside the contract, with
// the recommended full stack collapsing to a single state class:
// `className="sb-pad is-deep"`.
//
// What landed (see DESIGN_NOTES.md for the full entry):
//   1. --pix-bg-layer escape hatch on the sb-pix-family background
//   2. --pad-edge-light / --pad-edge-dark / --shadow-pad-lift tokens
//   3. .sb-pad.is-deep state — opt-in, bundles bevel + edge + lift
//   4. --pad-filter-base plumbing so .is-hot stacks instead of clobbers
//
// v15-pad-depth.jsx is kept as the BEFORE reference. Once V3 ships with
// is-deep on the GAME-mode board, that file can be archived.

// ── Status pill ──────────────────────────────────────────────────
function MigStatus({ kind }) {
  const map = {
    clean:  { label: '✓ CLEAN',                color: 'var(--success)'      },
    bundle: { label: '✓ COLLAPSED TO is-deep', color: 'var(--gold-bright)' },
  };
  const s = map[kind];
  return (
    <span className="sb-pill is-on" style={{
      fontSize: 10,
      color: s.color,
      '--pix-border': s.color,
    }}>{s.label}</span>
  );
}

// ── The migrated pad. Lives entirely inside the design-system
//    contract: className="sb-pad" [+ is-deep] + --pix-* / --pix-bg-layer /
//    --pad-filter-base overrides + inset box-shadow (§8.8 allows it).
function SbDepthPad({ treatment = 'baseline', type = 'loop', name = 'Rain Heavy', hk = 'F2', hot, size = 120 }) {
  const iconN = type === 'loop' ? 'loop' : type === 'playlist' ? 'scroll' : type === 'combo' ? 'rune' : 'play';

  // Per-treatment customisation. All values come from tokens; no literals.
  const overrides = {
    // 0 — default sb-pad. No overrides at all.
    baseline: {},

    // A — one tonal step up. Q1 canonical example.
    raised: {
      '--pix-bg':     'var(--raised)',
      '--pix-border': 'var(--border-strong)',
    },

    // B — chunky pixel drop-shadow via --pad-filter-base. is-hot's glow
    //     stacks on top because the base filter is routed through a
    //     custom property the .is-hot rule concatenates onto.
    drop: {
      '--pad-filter-base': 'var(--shadow-pad-lift)',
    },

    // C — bevel via --pix-bg-layer. Three layers: top highlight gradient,
    //     bottom shadow gradient, --raised floor. The escape hatch accepts
    //     a comma-separated list of background layers (each with its own
    //     padding-box clip).
    bevel: {
      '--pix-bg-layer':
        'linear-gradient(180deg, var(--pad-edge-light) 0%, transparent 32%) padding-box, ' +
        'linear-gradient(0deg,   var(--pad-edge-dark)  0%, transparent 38%) padding-box, ' +
        'linear-gradient(var(--raised), var(--raised)) padding-box',
    },

    // D — 1 px pixel-edge relief. Inset box-shadow is §8.8-allowed.
    //     Token-pure, no literals.
    edge: {
      boxShadow:
        'inset  1px  1px 0 0 var(--pad-edge-light), ' +
        'inset -1px -1px 0 0 var(--pad-edge-dark)',
    },

    // E — recessed face. Two overrides; shape unchanged.
    recessed: {
      '--pix-bg':     'var(--top)',
      '--pix-border': 'var(--border-strong)',
    },

    // F — full stack now lives in .sb-pad.is-deep. The component-side
    //     override is empty; everything is in the class. This is the
    //     migration's headline result: four-layer treatment collapses
    //     to one state class.
    full: {},
  };

  const style = {
    width: size,
    minHeight: 100,
    padding: 'var(--space-2) var(--space-2) var(--space-2) var(--space-3)',
    '--pad-color': `var(--pad-${type})`,
    '--pad-glow':  `var(--pad-${type}-glow)`,
    ...overrides[treatment],
  };

  const cls = ['sb-pad'];
  if (treatment === 'full') cls.push('is-deep');
  if (hot) cls.push('is-hot');

  return (
    <div className={cls.join(' ')} style={style}>
      <span className="sb-pad-key">{hk}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <PixelIcon name={iconN} size={12} color={`var(--pad-${type})`} />
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 10, color: `var(--pad-${type})`, letterSpacing: '.1em' }}>
          {treatment === 'full' ? 'is-deep' : type.toUpperCase()}
        </span>
      </div>
      <div>
        <div className="sb-pad-title" style={{ fontSize: 13 }}>{name}</div>
        <div className="sb-pad-meta">{hot ? 'playing · 0:42' : '∞ · loop'}</div>
      </div>
    </div>
  );
}

// ── BEFORE | AFTER side-by-side row ──────────────────────────────
function MigRow({ treatment, title, status, override, note }) {
  const tint = status === 'bundle' ? 'var(--gold-bright)' : 'var(--success)';
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderLeft: `3px solid ${tint}`,
      padding: 'var(--space-4)',
      display: 'grid',
      gridTemplateColumns: '230px 1fr 1fr',
      gap: 'var(--space-4)',
      alignItems: 'stretch',
    }}>
      <div>
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 14, color: 'var(--text)', letterSpacing: '.06em', marginBottom: 8 }}>
          {title}
        </div>
        <div style={{ marginBottom: 8 }}><MigStatus kind={status} /></div>
        <div className="sb-mono" style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.5 }}>
          {note}
        </div>
      </div>

      <div style={{
        background: 'var(--night)',
        border: '1px dashed var(--border-soft)',
        padding: 'var(--space-3)',
        display: 'flex', flexDirection: 'column', gap: 6,
      }}>
        <div className="sb-mono" style={{ fontSize: 10, color: 'var(--text-mute)', letterSpacing: '.14em', textTransform: 'uppercase' }}>
          BEFORE · v15 inline CSS
        </div>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', paddingTop: 4 }}>
          <DepthPad depth={treatment} type="loop" name="Rain Heavy" hk="F2" />
          <DepthPad depth={treatment} type="loop" name="Rain Heavy" hk="F2" hot />
        </div>
      </div>

      <div style={{
        background: 'var(--night)',
        border: `1px solid ${tint === 'var(--gold-bright)' ? 'var(--gold)' : 'var(--gold-dim)'}`,
        padding: 'var(--space-3)',
        display: 'flex', flexDirection: 'column', gap: 6,
      }}>
        <div className="sb-mono" style={{ fontSize: 10, color: tint, letterSpacing: '.14em', textTransform: 'uppercase' }}>
          AFTER · sb-pad{treatment === 'full' ? ' is-deep' : ''}
        </div>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', paddingTop: 4 }}>
          <SbDepthPad treatment={treatment} type="loop" name="Rain Heavy" hk="F2" />
          <SbDepthPad treatment={treatment} type="loop" name="Rain Heavy" hk="F2" hot />
        </div>
        <div className="sb-mono" style={{ fontSize: 10, color: 'var(--text-mute)', lineHeight: 1.5, marginTop: 4, whiteSpace: 'pre-wrap' }}>
          {override}
        </div>
      </div>
    </div>
  );
}

// ── "What landed" card ──────────────────────────────────────────
function LandedCard({ no, title, kind, children }) {
  const tint = kind === 'css'    ? 'var(--pad-loop)'
            : kind === 'token'  ? 'var(--gold)'
            : kind === 'state'  ? 'var(--gold-bright)'
            :                     'var(--pad-playlist)';
  return (
    <div style={{
      background: 'var(--raised)',
      borderLeft: `3px solid ${tint}`,
      padding: 'var(--space-4) var(--space-5)',
    }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 6 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-mute)', letterSpacing: '.14em' }}>
          LANDED · §{no}
        </span>
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: tint, letterSpacing: '.10em', textTransform: 'uppercase' }}>
          {kind === 'css' ? 'tokens.css · CSS' : kind === 'token' ? 'tokens.css · tokens' : kind === 'state' ? 'tokens.css · state' : 'tokens.css · plumbing'}
        </span>
      </div>
      <div style={{ fontFamily: 'var(--font-ui)', fontSize: 14, color: 'var(--text)', letterSpacing: '.04em', marginBottom: 8 }}>
        {title}
      </div>
      <div className="sb-mono" style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.6 }}>
        {children}
      </div>
    </div>
  );
}

// ── Headline pads: one baseline, one is-deep, side by side ──────
function HeadlineCompare() {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-5)',
      background: 'var(--night)', padding: 'var(--space-6)',
      border: '1px solid var(--border)',
      marginBottom: 'var(--space-5)',
    }}>
      <div>
        <div className="sb-mono" style={{ fontSize: 11, color: 'var(--text-mute)', letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 10 }}>
          default · className="sb-pad"
        </div>
        <div style={{ display: 'flex', gap: 14 }}>
          <SbDepthPad treatment="baseline" type="loop"   name="Rain Heavy"  hk="F2" />
          <SbDepthPad treatment="baseline" type="loop"   name="Fireplace"   hk="F3" hot />
          <SbDepthPad treatment="baseline" type="single" name="Sword Clash" hk="F4" />
        </div>
        <div className="sb-mono" style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 10, lineHeight: 1.5 }}>
          Flat. The right look for Quick-Access strips, library thumbnails,
          combo-preview pads — anywhere density matters.
        </div>
      </div>
      <div>
        <div className="sb-mono" style={{ fontSize: 11, color: 'var(--gold-bright)', letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 10 }}>
          ★ recommended · className="sb-pad is-deep"
        </div>
        <div style={{ display: 'flex', gap: 14 }}>
          <SbDepthPad treatment="full" type="loop"   name="Rain Heavy"  hk="F2" />
          <SbDepthPad treatment="full" type="loop"   name="Fireplace"   hk="F3" hot />
          <SbDepthPad treatment="full" type="single" name="Sword Clash" hk="F4" />
        </div>
        <div className="sb-mono" style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 10, lineHeight: 1.5 }}>
          Bevel + 1 px edge relief + chunky pixel lift. The right look for the
          GAME-mode board grid. is-hot glow stacks on top (see the hot pad
          mid-row), doesn't clobber.
        </div>
      </div>
    </div>
  );
}

// ── The artboard ─────────────────────────────────────────────────
function PadDepthMigrationArtboard() {
  return (
    <div className="sb" style={{ padding: 28, overflow: 'auto', height: '100%' }}>

      <div style={{ marginBottom: 18 }}>
        <div className="sb-display" style={{ fontSize: 20 }}>
          PAD Depth · Migration to sb-pad · <span style={{ color: 'var(--success)' }}>RESOLVED</span>
        </div>
        <div className="sb-mono" style={{ fontSize: 13, marginTop: 6, lineHeight: 1.6 }}>
          // B1 from the Slice-3 plan. The stress-test surfaced four small system gaps;
          all four landed in <code>tokens.css</code> and <code>DESIGN_SYSTEM.md</code>.<br/>
          // Every v15 depth treatment now expresses through the contract. The recommended
          full stack collapses to a single state class: <code>className="sb-pad is-deep"</code>.
        </div>
      </div>

      <HeadlineCompare />

      <div style={{
        background: 'var(--deep)',
        border: '1px solid var(--border)',
        padding: 'var(--space-4) var(--space-5)',
        marginBottom: 'var(--space-5)',
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-4)',
      }}>
        <div>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 22, color: 'var(--success)', letterSpacing: '.04em' }}>6 / 6</div>
          <div className="sb-mono" style={{ fontSize: 11, color: 'var(--text-dim)' }}>
            treatments migrate cleanly<br/>
            <span style={{ color: 'var(--text-mute)' }}>no inline literals anywhere</span>
          </div>
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 22, color: 'var(--gold)', letterSpacing: '.04em' }}>3</div>
          <div className="sb-mono" style={{ fontSize: 11, color: 'var(--text-dim)' }}>
            new tokens in §A<br/>
            <span style={{ color: 'var(--text-mute)' }}>--pad-edge-light · -dark · --shadow-pad-lift</span>
          </div>
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 22, color: 'var(--gold-bright)', letterSpacing: '.04em' }}>1</div>
          <div className="sb-mono" style={{ fontSize: 11, color: 'var(--text-dim)' }}>
            new state in §3 (opt-in)<br/>
            <span style={{ color: 'var(--text-mute)' }}>.sb-pad.is-deep</span>
          </div>
        </div>
      </div>

      <SectionLabel glyph="diamond">SIX TREATMENTS · BEFORE vs AFTER</SectionLabel>
      <div className="sb-mono" style={{ fontSize: 11, color: 'var(--text-mute)', marginBottom: 12, lineHeight: 1.5 }}>
        // Each row: legacy <code>&lt;DepthPad&gt;</code> on the left (inline CSS), migrated
        <code> &lt;SbDepthPad&gt;</code> on the right (sb-pad shell). Idle pad + hot pad in each cell
        so the <code>is-hot</code> path is exercised too. Note especially the "drop" row hot pad — the
        chunky lift survives the glow now that <code>--pad-filter-base</code> stacks.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginBottom: 'var(--space-8)' }}>
        <MigRow
          treatment="baseline" title="0 · BASELINE" status="clean"
          note="Default sb-pad. No --pix-* overrides. is-hot supplies the border + glow via --pad-color / --pad-glow channels."
          override={'className="sb-pad"\n// no overrides'} />

        <MigRow
          treatment="raised" title="A · BRIGHTER FACE" status="clean"
          note="The Q1 canonical example. Two tokens, one line each."
          override={"'--pix-bg':     'var(--raised)'\n'--pix-border': 'var(--border-strong)'"} />

        <MigRow
          treatment="drop" title="B · CHUNKY DROP-SHADOW" status="clean"
          note={<>
            Routed through <code>--pad-filter-base</code>, not <code>filter:</code> directly. The
            hot pad keeps its lift because <code>is-hot</code> concatenates the glow onto whatever
            the base resolves to, instead of replacing.
          </>}
          override={"'--pad-filter-base': 'var(--shadow-pad-lift)'"} />

        <MigRow
          treatment="bevel" title="C · LIGHT-FROM-ABOVE BEVEL" status="clean"
          note={<>
            Multi-layer gradient via the new <code>--pix-bg-layer</code> escape hatch. Three
            layers: top highlight, bottom shadow, <code>--raised</code> floor. Each carries its
            own <code>padding-box</code> clip so the existing border-box border still works.
          </>}
          override={"'--pix-bg-layer':\n  linear-gradient(180deg, var(--pad-edge-light) 0%, transparent 32%) padding-box,\n  linear-gradient(0deg,   var(--pad-edge-dark)  0%, transparent 38%) padding-box,\n  linear-gradient(var(--raised), var(--raised)) padding-box"} />

        <MigRow
          treatment="edge" title="D · PIXEL-EDGE RELIEF" status="clean"
          note={<>
            Inset <code>box-shadow</code> is §8.8-allowed. The two new tokens
            <code> --pad-edge-light</code> / <code>--pad-edge-dark</code> stand in for the
            previous raw <code>rgba(...)</code> values.
          </>}
          override={"boxShadow:\n  inset  1px  1px 0 0 var(--pad-edge-light),\n  inset -1px -1px 0 0 var(--pad-edge-dark)"} />

        <MigRow
          treatment="recessed" title="E · CONTRAST BY CONTEXT" status="clean"
          note={<>Same shape as A, different tokens. Useful when pads sit on a brighter face
            (settings preview, empty-state cards).</>}
          override={"'--pix-bg':     'var(--top)'\n'--pix-border': 'var(--border-strong)'"} />

        <MigRow
          treatment="full" title="F · FULL STACK (★ recommended)" status="bundle"
          note={<>
            All four layers bundle into one state class — <code>.sb-pad.is-deep</code> in
            <code> tokens.css</code>. Call sites just add the class; the rest is structural.
            The migration's headline win.
          </>}
          override={'className="sb-pad is-deep"\n// no per-call-site overrides'} />
      </div>

      <PixelDivider glyph="diamond" />

      <SectionLabel glyph="star">WHAT LANDED · four changes, one commit</SectionLabel>
      <div className="sb-mono" style={{ fontSize: 11, color: 'var(--text-mute)', marginBottom: 12, lineHeight: 1.5 }}>
        // All four are surfaced in <code>tokens.css</code> with comments, registered in
        <code> DESIGN_SYSTEM.md</code> §3 / §8 / §A, and the old open item in
        <code> DESIGN_NOTES.md</code> "DepthPad / pad rendering" is now marked RESOLVED.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
        <LandedCard no="1" kind="css" title="--pix-bg-layer escape hatch on the sb-pix family · backwards-compatible.">
          The shared <code>.sb-pix / .sb-card / .sb-menu-row / .sb-btn / .sb-pad / .sb-pill</code>
          background now reads:<br/><br/>
          <span style={{ color: 'var(--success)' }}>
            background:<br/>
            &nbsp;&nbsp;var(--pix-bg-layer, linear-gradient(var(--pix-bg), var(--pix-bg)) padding-box),<br/>
            &nbsp;&nbsp;linear-gradient(var(--pix-border), var(--pix-border)) border-box;
          </span><br/><br/>
          When <code>--pix-bg-layer</code> is unset, the fallback wraps <code>--pix-bg</code>
          exactly as before — every existing colour-token override (<code>var(--raised)</code>,
          <code> var(--top)</code>, <code>var(--gold)</code> on <code>sb-btn-filled</code>, etc.)
          continues to work unchanged. The escape hatch is intentional: only
          <code> sb-pad.is-deep</code> uses it today.
        </LandedCard>

        <LandedCard no="2" kind="token" title="Three new tokens · values lifted from v15 treatment F.">
          Added to <code>tokens.css</code> and to the §A "Pad surface" / Elevation rows:<br/><br/>
          <span style={{ color: 'var(--gold)' }}>--pad-edge-light:</span> rgba(255, 255, 255, 0.12);&nbsp;
            <span style={{ color: 'var(--text-mute)' }}>/* 1 px inset top+left · bevel top stop */</span><br/>
          <span style={{ color: 'var(--gold)' }}>--pad-edge-dark:</span>&nbsp; rgba(0,&nbsp;&nbsp; 0,&nbsp;&nbsp; 0,&nbsp;&nbsp; 0.40);&nbsp;
            <span style={{ color: 'var(--text-mute)' }}>/* 1 px inset bottom+right · bevel bottom stop */</span><br/>
          <span style={{ color: 'var(--gold)' }}>--shadow-pad-lift:</span> drop-shadow(3px 3px 0 rgba(0,0,0,.65));&nbsp;
            <span style={{ color: 'var(--text-mute)' }}>/* hard pixel offset, no blur */</span><br/><br/>
          The proposed <code>--pad-bevel-top/-bottom</code> were dropped — the bevel reuses
          <code> --pad-edge-light / -dark</code> at different stop positions, so a single light/dark
          pair carries both the inset relief and the gradient.
        </LandedCard>

        <LandedCard no="3" kind="state" title=".sb-pad.is-deep · opt-in, not default. Added to §3 vocabulary.">
          The recommended full stack bundles into one state class. Per the V3 policy: opt-in via
          a positive name. Dense contexts (Quick Access, library thumbnails, combo-preview pads)
          stay flat without any opt-out gymnastics; filter cost only attaches to pads that
          actually need depth.<br/><br/>
          <span style={{ color: 'var(--gold-bright)' }}>.sb-pad.is-deep</span> &#123;<br/>
          &nbsp;&nbsp;<span style={{ color: 'var(--gold)' }}>--pix-bg-layer:</span> &lt;bevel + raised floor, 3 layers&gt;;<br/>
          &nbsp;&nbsp;<span style={{ color: 'var(--gold)' }}>--pix-border:</span> var(--border-strong);<br/>
          &nbsp;&nbsp;<span style={{ color: 'var(--gold)' }}>--pad-filter-base:</span> var(--shadow-pad-lift);<br/>
          &nbsp;&nbsp;<span style={{ color: 'var(--gold)' }}>box-shadow:</span> &lt;1 px inset edge relief&gt;;<br/>
          &#125;<br/><br/>
          Slice-3 usage: <code>className="sb-pad is-deep"</code> on every pad in the GAME-mode
          board grid; bare <code>className="sb-pad"</code> everywhere else.
        </LandedCard>

        <LandedCard no="4" kind="plumb" title="--pad-filter-base plumbing · is-hot stacks instead of clobbering.">
          The previous <code>.sb-pad.is-hot</code> rule wrote <code>filter:</code> directly, which
          replaced any base filter (e.g. is-deep's lift) the moment the pad went hot. Fixed by
          routing through a custom property:<br/><br/>
          <span style={{ color: 'var(--success)' }}>
            .sb-pad &#123; filter: var(--pad-filter-base, none); &#125;<br/>
            .sb-pad.is-hot &#123; filter: var(--pad-filter-base, none)<br/>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;drop-shadow(0 0 6px var(--pad-glow))<br/>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;drop-shadow(0 0 14px var(--pad-glow)); &#125;
          </span><br/><br/>
          Defaults to <code>none</code> so plain <code>sb-pad</code> idle pads stay un-filtered.
          Future depth treatments set the property; they never write <code>filter:</code>
          directly. Documented in §8.8 alongside the inset-box-shadow rule.
        </LandedCard>
      </div>

      <PixelDivider glyph="diamond" />

      <SectionLabel glyph="moon">FILE TRAIL</SectionLabel>
      <div className="sb-mono" style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.7 }}>
        ▸ <b>tokens.css</b> — 4 edits: pad-surface tokens · shadow-pad-lift · --pix-bg-layer fallback · is-deep rule + --pad-filter-base plumbing<br/>
        ▸ <b>DESIGN_SYSTEM.md</b> — §3 (+is-deep), §8.8 (+ the two escape-hatch paragraphs), §A (+ Pad surface row, + --shadow-pad-lift)<br/>
        ▸ <b>DESIGN_NOTES.md</b> — "Migrate v15 DepthPad" entry struck through as RESOLVED with the change list<br/>
        ▸ <b>v15-pad-depth.jsx</b> — unchanged; kept as the BEFORE reference<br/>
        ▸ <b>v18-pad-depth-migration.jsx</b> — this artboard; the design-history record of the stress-test
      </div>
    </div>
  );
}

Object.assign(window, { SbDepthPad, PadDepthMigrationArtboard });
