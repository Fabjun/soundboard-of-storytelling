// v14-combo-editor.jsx — Combo-PAD editor rebuilt in our design system.
// Models the user's actual implementation faithfully (Steps with parallel
// pads, sequential step ordering, ∞ loops as background sounds that don't
// block) but rendered in the pixel-art design system with:
//   ▸ sticky editor toolbar with DELETE always visible
//   ▸ live combo-pad preview in the toolbar
//   ▸ 2-column body — form + steps on the left, inspector on the right
//   ▸ drag-to-add pad palette pinned to the bottom of the workspace
//
// Reuses TopBarV2, PanelHeaderV2, StatusBarV2, KvRow, LabelSliderV2,
// SegmentedControl, KeyCap, PixelIcon, MiniPad from earlier files.

function ComboEditorRebuilt() {
  // Mock data shaped like the user's Combo-PAD UI
  const STEPS = [
    {
      id: 1,
      pads: [
        { kind: 'loop',     name: 'Heartbeat',    note: 'background · ∞' },
        { kind: 'single',   name: 'Thunder',      note: '0:03' },
      ],
    },
    {
      id: 2,
      pads: [
        { kind: 'single',   name: 'bell deep',    note: '0:06' },
      ],
    },
    {
      id: 3,
      pads: [
        { kind: 'playlist', name: 'victory music', note: 'list · 3:24' },
        { kind: 'single',   name: 'crowd applause cheers double', note: '0:05' },
      ],
    },
  ];

  const PAD_LIBRARY = [
    { kind: 'stop',      name: 'STOP ALL' },
    { kind: 'fade',      name: 'FADE OUT ALL' },
    { kind: 'loop',      name: 'NIGHT' },
    { kind: 'loop',      name: 'DAY' },
    { kind: 'loop',      name: 'Wind' },
    { kind: 'loop',      name: 'ghost_whisper_01' },
    { kind: 'loop',      name: 'Rain' },
    { kind: 'playlist',  name: 'Playlist_Music_BotC' },
    { kind: 'single',    name: 'bell deep' },
    { kind: 'single',    name: 'Rooster' },
    { kind: 'single',    name: 'Thunder' },
    { kind: 'single',    name: 'Sword hit with Blood and Hall' },
    { kind: 'single',    name: 'hammer' },
    { kind: 'loop',      name: 'clock ticking js' },
    { kind: 'single',    name: 'wolf howl' },
    { kind: 'single',    name: 'witch 01' },
    { kind: 'loop',      name: 'fire' },
    { kind: 'loop',      name: 'gear runnig' },
    { kind: 'single',    name: 'fall body' },
    { kind: 'single',    name: 'ghost 01' },
    { kind: 'playlist',  name: 'victory music' },
    { kind: 'loop',      name: 'gear clicking loop' },
    { kind: 'loop',      name: 'ticking clock light' },
    { kind: 'loop',      name: 'Clocktower' },
    { kind: 'single',    name: 'Kill' },
    { kind: 'single',    name: 'boom cinematic' },
    { kind: 'single',    name: 'Anklage' },
    { kind: 'single',    name: 'swordhit blood' },
  ];

  // Compute combo stats for the inspector
  const totalSteps = STEPS.length;
  const padsCount = STEPS.reduce((n, s) => n + s.pads.length, 0);
  const bgLoops = STEPS.flatMap((s) => s.pads).filter((p) => p.kind === 'loop').length;
  // Rough total duration estimate excluding ∞ loops — for demo we hard-code
  const totalDur = '~12 s + background loops';

  return (
    <div className="sb" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <TopBarV2
        title="Combo Editor"
        breadcrumb="The Tavern · WIN"
        mode="setup"
      />

      {/* STICKY EDITOR TOOLBAR — live preview + actions that never scroll away */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '10px 16px',
        background: 'var(--surface)',
        borderBottom: '1px solid var(--border)',
        boxShadow: '0 2px 0 rgba(0,0,0,.3)',
      }}>
        <div style={{ color: 'var(--text-dim)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 18 }}>←</span>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, letterSpacing: '.1em' }}>BACK</span>
        </div>

        <div style={{ width: 1, height: 32, background: 'var(--border-soft)' }} />

        <MiniPad type="combo" name="WIN" hk="." />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-mute)', letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 2 }}>
            EDITING COMBO-PAD
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 18, color: 'var(--text)', letterSpacing: '.04em' }}>WIN</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, padding: '1px 5px', background: 'var(--sunk)', border: '1px solid var(--border-soft)', color: 'var(--text-dim)' }}>.</span>
            <span className="sb-pill is-combo" style={{ fontSize: 9 }}>
              <span className="sb-dot" />COMBO
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-mute)' }}>
              · {totalSteps} steps · {padsCount} pads · {bgLoops > 0 ? `${bgLoops} bg loop` : 'no bg'}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 6 }}>
          <button className="sb-btn sb-btn-sm sb-btn-ghost"><PixelIcon name="play" size={10} /> PREVIEW</button>
          <button className="sb-btn sb-btn-sm sb-btn-ghost">CANCEL</button>
          <button className="sb-btn sb-btn-sm sb-btn-filled"><PixelIcon name="save" size={10} /> SAVE</button>
        </div>
        <div style={{ width: 1, height: 32, background: 'var(--border-soft)' }} />
        <button className="sb-btn sb-btn-sm sb-btn-danger"><PixelIcon name="skull" size={10} /> DELETE</button>
      </div>

      {/* TWO COLUMNS */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', flex: 1, minHeight: 0 }}>

        {/* LEFT — form + steps + drag-from palette */}
        <main style={{ background: 'var(--surface)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <div style={{ padding: '16px 22px', overflow: 'auto', flex: 1 }}>
            {/* Identity */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: 18, marginBottom: 18 }}>
              <FieldGroup label="NAME" hint="shown on the pad and in search">
                <InputField value="WIN" />
              </FieldGroup>
              <FieldGroup label="KEY" hint="single key or combo">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <KeyCap kind="game">.</KeyCap>
                  <button className="sb-btn sb-btn-sm sb-btn-ghost" style={{ padding: '3px 8px' }}>CAPTURE</button>
                </div>
              </FieldGroup>
            </div>

            {/* Visual icons */}
            <SectionLabel glyph="eye">VISUAL · optional · up to 4 icons</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 22 }}>
              {[0, 1, 2, 3].map((i) => (
                <div key={i} style={{
                  aspectRatio: '4 / 3',
                  background: 'var(--sunk)',
                  border: '1px dashed var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--text-mute)',
                  fontFamily: 'var(--font-display)', fontSize: 14,
                }}>+</div>
              ))}
            </div>

            {/* Steps */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 8 }}>
              <SectionLabel glyph="rune">STEPS</SectionLabel>
              <div style={{ flex: 1 }} />
              <button className="sb-btn sb-btn-sm sb-btn-ghost" style={{ padding: '3px 10px' }}>+ STEP</button>
            </div>
            <div className="sb-mono" style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.55, marginBottom: 14 }}>
              // Pads within the same step start <span style={{ color: 'var(--gold)' }}>simultaneously</span>. Steps run <span style={{ color: 'var(--gold)' }}>sequentially</span> — the next step begins only when all pads of the previous one have finished. A loop set to <span style={{ color: 'var(--pad-loop)' }}>∞</span> runs as a <span style={{ color: 'var(--pad-loop)' }}>background sound</span> and does not block the next step — it stops automatically when the combo ends.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {STEPS.map((s, i) => (
                <React.Fragment key={s.id}>
                  <StepBlock step={s} idx={i + 1} last={i === STEPS.length - 1} />
                  {i < STEPS.length - 1 && (
                    <div style={{ position: 'relative', height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{
                        position: 'absolute', left: 22, right: 22, top: '50%',
                        height: 1, background: 'var(--border-soft)',
                        backgroundImage: 'repeating-linear-gradient(90deg, var(--border) 0 4px, transparent 4px 8px)',
                      }} />
                      <button className="sb-btn sb-btn-sm sb-btn-ghost" style={{ padding: '2px 12px', position: 'relative', background: 'var(--surface)', zIndex: 1 }}>
                        + INSERT STEP
                      </button>
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>

            {/* Trailing add-step affordance */}
            <button className="sb-btn sb-btn-sm sb-btn-ghost" style={{ marginTop: 14, padding: '8px 14px' }}>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 11, marginRight: 4 }}>+</span> ADD STEP
            </button>
          </div>

          {/* DRAG-TO-ADD palette — pinned to bottom of left column */}
          <div style={{
            borderTop: '1px solid var(--border)',
            background: 'var(--deep)',
            maxHeight: 168,
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '8px 16px',
              borderBottom: '1px solid var(--border-soft)',
            }}>
              <PixelIcon name="diamond" size={10} color="var(--gold)" />
              <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--gold)', letterSpacing: '.14em' }}>
                PADS · DRAG TO ADD
              </span>
              <div style={{ flex: 1 }} />
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '3px 8px',
                background: 'var(--sunk)', border: '1px solid var(--border)',
                color: 'var(--text-mute)',
              }}>
                <PixelIcon name="search" size={10} />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11 }}>Find a pad…</span>
              </div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-mute)' }}>{PAD_LIBRARY.length} available</span>
            </div>

            <div style={{
              padding: '10px 16px',
              display: 'flex', flexWrap: 'wrap', gap: 5,
              overflow: 'auto',
            }}>
              {PAD_LIBRARY.map((p) => (
                <DragPadChip key={p.name} pad={p} />
              ))}
            </div>
          </div>
        </main>

        {/* RIGHT — inspector */}
        <aside className="sb-inspector" style={{ overflow: 'auto' }}>
          <PanelHeaderV2 icon="info" title="HOW STEPS WORK" active />
          <div className="sb-inspector-section">
            <div className="sb-mono" style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.6 }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', marginBottom: 6 }}>
                <span style={{ color: 'var(--gold)' }}>▸</span>
                <span>Pads in a step play together.</span>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', marginBottom: 6 }}>
                <span style={{ color: 'var(--gold)' }}>▸</span>
                <span>The next step waits for the slowest one to finish.</span>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', marginBottom: 6 }}>
                <span style={{ color: 'var(--pad-loop)' }}>▸</span>
                <span>Loops set to <b style={{ color: 'var(--pad-loop)' }}>∞</b> run as background and never block — they stop when the combo ends.</span>
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--blood)' }}>▸</span>
                <span>Drop <b style={{ color: 'var(--blood)' }}>STOP ALL</b> or <b style={{ color: 'var(--gold)' }}>FADE OUT ALL</b> in a step to cut/clear background loops mid-combo.</span>
              </div>
            </div>
          </div>

          <PanelHeaderV2 icon="diamond" title="COMBO STATS" />
          <div className="sb-inspector-section" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <KvRow label="STEPS"          right={<span className="sb-num">{totalSteps}</span>} />
            <KvRow label="PADS TOTAL"     right={<span className="sb-num">{padsCount}</span>} />
            <KvRow label="BACKGROUND LOOPS"  right={
              <span className="sb-pill is-loop" style={{ fontSize: 9 }}>
                <span className="sb-dot" />{bgLoops}
              </span>
            } />
            <KvRow label="EST. DURATION" right={<span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text)' }}>{totalDur}</span>} />
          </div>

          <PanelHeaderV2 icon="potion" title="PLAYBACK" />
          <div className="sb-inspector-section" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <LabelSliderV2 label="MASTER VOLUME"  value={0.80} color="var(--pad-combo)" />
            <LabelSliderV2 label="FADE IN"        value={0.10} color="var(--pad-combo)" />
            <LabelSliderV2 label="FADE OUT"       value={0.30} color="var(--pad-combo)" />
            <KvRow label="ON STOP" right={
              <div style={{ display: 'flex', gap: 4 }}>
                <span className="sb-pill is-on" style={{ fontSize: 9 }}>FADED</span>
                <span className="sb-pill" style={{ fontSize: 9 }}>HARD</span>
              </div>
            } />
          </div>

          <PanelHeaderV2 icon="tag" title="META" />
          <div className="sb-inspector-section" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <KvRow label="FOLDER" right={<span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)' }}>Climax ▾</span>} />
            <KvRow label="TAGS" right={
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                <span className="sb-pill is-combo" style={{ fontSize: 9 }}>victory</span>
                <span className="sb-pill" style={{ fontSize: 9, color: 'var(--text-mute)' }}>+</span>
              </div>
            } />
          </div>
        </aside>
      </div>

      <StatusBarV2
        mode="setup"
        board="Combo Editor · WIN"
        info={`${totalSteps} steps · ${padsCount} pads · ${bgLoops} bg loop`}
        right={
          <>
            <span style={{ color: 'var(--gold)' }}>● unsaved changes</span>
            <span>ESC cancel  ·  ⌘S save  ·  ⇧⌫ delete</span>
          </>
        }
      />
    </div>
  );
}

// ── Step container ──────────────────────────────────────────────
function StepBlock({ step, idx }) {
  const hasLoop = step.pads.some((p) => p.kind === 'loop');
  return (
    <div style={{
      background: 'var(--raised)',
      border: '1px solid var(--border)',
      borderLeft: '3px solid var(--pad-combo)',
      padding: '12px 14px',
      display: 'flex', flexDirection: 'column', gap: 10,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Step number badge */}
        <div style={{
          width: 28, height: 28,
          background: 'var(--pad-combo)',
          color: 'var(--text-on-gold)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--font-ui)', fontSize: 14,
        }}>{idx}</div>
        <div>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--pad-combo)', letterSpacing: '.14em' }}>
            STEP {idx}
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-mute)' }}>
            {step.pads.length} pad{step.pads.length === 1 ? '' : 's'}
            {hasLoop && <span style={{ color: 'var(--pad-loop)' }}> · contains ∞ background</span>}
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <button className="sb-btn sb-btn-sm sb-btn-ghost" style={{ padding: '2px 8px' }}>
          <svg width="9" height="9" viewBox="0 0 9 9" fill="none" stroke="currentColor" strokeWidth="1.4"><line x1="2" y1="2" x2="7" y2="2"/><circle cx="2" cy="4.5" r=".8" fill="currentColor"/><line x1="3.5" y1="4.5" x2="7" y2="4.5"/><circle cx="2" cy="7" r=".8" fill="currentColor"/><line x1="3.5" y1="7" x2="7" y2="7"/></svg>
        </button>
        <button className="sb-btn sb-btn-sm sb-btn-danger" style={{ padding: '2px 8px' }}>×</button>
      </div>

      {/* Pad chips inside this step */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
        {step.pads.map((p, i) => (
          <PadChipInStep key={i} pad={p} />
        ))}
        <button style={{
          padding: '4px 10px',
          border: '1px dashed var(--border-strong)',
          color: 'var(--text-mute)',
          background: 'transparent',
          fontFamily: 'var(--font-ui)', fontSize: 11, letterSpacing: '.1em',
          cursor: 'pointer',
        }}>+ DROP PAD</button>
      </div>
    </div>
  );
}

// ── Pad chip inside a step ──────────────────────────────────────
function PadChipInStep({ pad }) {
  if (pad.kind === 'stop') {
    return (
      <div style={chipStyle('var(--blood)', 'rgba(160,40,40,.14)')}>
        <span style={{
          width: 8, height: 8, background: 'var(--blood-bright)',
          display: 'inline-block',
        }} />
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--blood-bright)', letterSpacing: '.1em' }}>STOP ALL</span>
        <ChipX color="var(--blood)" />
      </div>
    );
  }
  if (pad.kind === 'fade') {
    return (
      <div style={chipStyle('var(--gold)', 'rgba(212,178,92,.14)')}>
        <PixelIcon name="hourglass" size={11} color="var(--gold)" />
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--gold)', letterSpacing: '.1em' }}>FADE OUT ALL</span>
        <ChipX color="var(--gold)" />
      </div>
    );
  }
  const color = `var(--pad-${pad.kind})`;
  return (
    <div style={chipStyle(color, `var(--pad-${pad.kind}-soft)`)}>
      <PixelIcon name={iconFor(pad.kind)} size={11} color={color} />
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text)' }}>{pad.name}</span>
      {pad.note && (
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: pad.note.includes('∞') ? 'var(--pad-loop)' : 'var(--text-mute)', letterSpacing: '.06em' }}>
          {pad.note}
        </span>
      )}
      <ChipX color={color} />
    </div>
  );
}

// ── Pad chip in the bottom drag library ────────────────────────
function DragPadChip({ pad }) {
  if (pad.kind === 'stop') {
    return (
      <div style={{ ...chipStyle('var(--blood)', 'rgba(160,40,40,.14)'), cursor: 'grab' }}>
        <span style={{ width: 8, height: 8, background: 'var(--blood-bright)' }} />
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--blood-bright)', letterSpacing: '.1em' }}>STOP ALL</span>
      </div>
    );
  }
  if (pad.kind === 'fade') {
    return (
      <div style={{ ...chipStyle('var(--gold)', 'rgba(212,178,92,.14)'), cursor: 'grab' }}>
        <PixelIcon name="hourglass" size={11} color="var(--gold)" />
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--gold)', letterSpacing: '.1em' }}>FADE OUT ALL</span>
      </div>
    );
  }
  const color = `var(--pad-${pad.kind})`;
  return (
    <div style={{ ...chipStyle('var(--border)', 'var(--raised)'), cursor: 'grab' }}>
      <PixelIcon name={iconFor(pad.kind)} size={11} color={color} />
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)' }}>{pad.name}</span>
    </div>
  );
}

// ── Helpers ──────────────────────────────────────────────────────
function chipStyle(borderColor, bg) {
  return {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '3px 9px',
    background: bg,
    border: `1px solid ${borderColor}`,
  };
}
function iconFor(kind) {
  return kind === 'loop' ? 'loop' : kind === 'playlist' ? 'scroll' : kind === 'combo' ? 'rune' : 'play';
}
function ChipX({ color }) {
  return (
    <span style={{
      marginLeft: 4,
      width: 14, height: 14,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      color, opacity: .65,
      fontFamily: 'var(--font-display)', fontSize: 9, lineHeight: 1,
      cursor: 'pointer',
    }}>×</span>
  );
}

Object.assign(window, { ComboEditorRebuilt, StepBlock, PadChipInStep, DragPadChip });
