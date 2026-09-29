// v7-pad-editor.jsx — PAD Editor · faithful + refined
// Today's editor is one tall scroll: by the time the user has filled in
// IDENTITY → SOUND → BEHAVIOR → VISUAL → DANGER, the SAVE button is off-screen
// and DELETE is buried. The refined version brings every critical action into
// a sticky toolbar and reorganises the body into 3 functional columns so
// nothing important can be hidden by scrolling.

// ═════════════════════════════════════════════════════════════════
// FAITHFUL — reproduces the current one-column scrolling layout
// ═════════════════════════════════════════════════════════════════
function PadEditActual() {
  return (
    <div className="sb" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Top: MENU + SETUP|GAME toggle + ? + sliders icon */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center', padding: '10px 16px',
        background: 'var(--night)', borderBottom: '1px solid var(--mode-setup)',
      }}>
        <div style={{ padding: '5px 14px', border: '1px solid var(--mode-setup)', color: 'var(--mode-setup)', fontFamily: 'var(--font-ui)', fontSize: 14, letterSpacing: '.1em', width: 'fit-content' }}>MENU</div>
        <div style={{
          padding: '4px 16px', display: 'flex', alignItems: 'center',
          border: '1px solid var(--mode-setup)',
          fontFamily: 'var(--font-ui)', fontSize: 16, letterSpacing: '.12em',
        }}>
          <span style={{ color: 'var(--mode-setup)', padding: '2px 10px', background: 'rgba(109,181,184,.15)' }}>SETUP</span>
          <span style={{ color: 'var(--text-mute)', padding: '0 6px' }}>|</span>
          <span style={{ color: 'var(--text-mute)', padding: '2px 10px' }}>GAME</span>
        </div>
        <div style={{ display: 'flex', gap: 10, color: 'var(--mode-setup)', justifyContent: 'flex-end' }}>
          <div style={{ border: '1px solid var(--mode-setup)', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-ui)', fontSize: 14 }}>?</div>
          <div style={{ border: '1px solid var(--mode-setup)', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.4"><circle cx="3" cy="4" r="1.5"/><line x1="6" y1="4" x2="13" y2="4"/><circle cx="10" cy="10" r="1.5"/><line x1="1" y1="10" x2="8" y2="10"/></svg>
          </div>
        </div>
      </div>

      {/* Editor header bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto auto', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
        <div style={{ color: 'var(--mode-setup)', fontSize: 18, cursor: 'pointer' }}>←</div>
        <div style={{ textAlign: 'center', fontFamily: 'var(--font-ui)', fontSize: 16, color: 'var(--mode-setup)', letterSpacing: '.12em' }}>EDIT SOUND-PAD 3</div>
        <div style={{ border: '1px solid var(--mode-setup)', color: 'var(--mode-setup)', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-ui)', fontSize: 14 }}>?</div>
        <div style={{ padding: '8px 22px', background: 'var(--success)', color: 'var(--night)', fontFamily: 'var(--font-ui)', fontSize: 14, letterSpacing: '.12em' }}>SAVE</div>
      </div>

      <main style={{ flex: 1, overflow: 'auto', padding: '0 24px 40px' }}>
        {/* IDENTITY */}
        <div style={{ marginBottom: 26 }}>
          <SectionHeading>IDENTITY</SectionHeading>
          <FieldLabel>NAME</FieldLabel>
          <FauxInput value="Wind" />
          <FieldLabel>KEY — click field, then press a key</FieldLabel>
          <FauxInput value="%" />
        </div>

        {/* SOUND */}
        <div style={{ marginBottom: 26 }}>
          <SectionHeading>SOUND</SectionHeading>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '10px 14px', marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--text)' }}>wind</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-mute)' }}>395KB</span>
                <div style={{ width: 22, height: 22, border: '1px solid var(--blood)', color: 'var(--blood)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>×</div>
              </div>
            </div>
            <Waveform progress={0} height={56} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 8 }}>
              <PixelIcon name="play" size={12} color="var(--mode-setup)" />
              <PixelIcon name="stop" size={10} color="var(--text-mute)" />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)' }}>0:00 / 0:12</span>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                <div style={{ padding: '4px 10px', border: '1px solid var(--mode-setup)', color: 'var(--mode-setup)', fontFamily: 'var(--font-ui)', fontSize: 11, letterSpacing: '.08em' }}>▦ FROM LIB</div>
                <div style={{ padding: '4px 10px', color: 'var(--gold)', fontFamily: 'var(--font-ui)', fontSize: 11, letterSpacing: '.08em' }}>↻ CHANGE</div>
              </div>
            </div>
          </div>

          <FieldLabel>VOLUME · 80%</FieldLabel>
          <div className="sb-slider" style={{ height: 8 }}>
            <div className="sb-slider-fill" style={{ width: '80%' }} />
            <div className="sb-slider-thumb" style={{ left: '80%' }} />
          </div>

          <div style={{ marginTop: 14, fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--text-mute)', letterSpacing: '.08em' }}>▸ FADE</div>
          <div style={{ marginTop: 6, fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--text-mute)', letterSpacing: '.08em' }}>▸ TRIM</div>
        </div>

        {/* BEHAVIOR */}
        <div style={{ marginBottom: 26 }}>
          <SectionHeading>BEHAVIOR</SectionHeading>
          <FieldLabel>MODE</FieldLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <ModeBtn active>SOLO</ModeBtn>
            <ModeBtn>LOOP</ModeBtn>
            <ModeBtn>LIST →</ModeBtn>
          </div>
        </div>

        {/* VISUAL */}
        <div style={{ marginBottom: 26 }}>
          <SectionHeading sub="optional · up to 4 icons">VISUAL</SectionHeading>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} style={{ height: 70, border: '1px dashed var(--border)', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-mute)' }}>+</div>
            ))}
          </div>
        </div>

        {/* (the DELETE button lives even further down — off-screen on most viewports) */}
        <div style={{ marginTop: 60 }}>
          <div style={{ padding: '12px 0', textAlign: 'center', border: '1px solid var(--blood)', color: 'var(--blood)', fontFamily: 'var(--font-ui)', fontSize: 14, letterSpacing: '.1em' }}>
            ⌫ DELETE PAD
          </div>
        </div>
      </main>
    </div>
  );
}

function SectionHeading({ children, sub }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 10 }}>
      <span style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--mode-setup)', letterSpacing: '.16em' }}>{children}</span>
      {sub && <span style={{ fontFamily: 'var(--font-mono)', fontStyle: 'italic', fontSize: 12, color: 'var(--text-mute)' }}>{sub}</span>}
    </div>
  );
}
function FieldLabel({ children }) {
  return <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)', letterSpacing: '.08em', margin: '12px 0 6px' }}>{children}</div>;
}
function FauxInput({ value }) {
  return (
    <div style={{ padding: '8px 12px', background: 'var(--surface)', border: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--text)' }}>{value}</div>
  );
}
function ModeBtn({ children, active }) {
  return (
    <div style={{
      padding: '12px 0',
      textAlign: 'center',
      border: '1px solid ' + (active ? 'var(--gold)' : 'var(--border)'),
      background: active ? 'rgba(212,178,92,.10)' : 'transparent',
      color: active ? 'var(--gold)' : 'var(--text-dim)',
      fontFamily: 'var(--font-ui)', fontSize: 14, letterSpacing: '.14em',
    }}>{children}</div>
  );
}

// ═════════════════════════════════════════════════════════════════
// REFINED — sticky toolbar (SAVE + CANCEL + DELETE always visible),
// 3-column body (LEFT identity & mode · CENTER sound · RIGHT params),
// pad preview thumbnail in the toolbar so context never disappears.
// ═════════════════════════════════════════════════════════════════
function PadEditRefined() {
  // File is 0:12 (12 s). Trim/fade are stored as 0..1 fractions; fmt
  // converts a fraction back into a human "M:SS.t" string.
  const [trimStart, setTrimStart] = React.useState(0.017);  // 0:00.2
  const [trimEnd,   setTrimEnd]   = React.useState(0.983);  // 0:11.8
  const [fadeIn,    setFadeIn]    = React.useState(0.08);
  const [fadeOut,   setFadeOut]   = React.useState(0.32);
  const [playhead,  setPlayhead]  = React.useState(0.43);   // ≈ 0:05.2
  const [loopPoint, setLoopPoint] = React.useState(0.033);  // ≈ 0:00.4
  const [volume,    setVolume]    = React.useState(0.80);
  const [outputBus, setOutputBus] = React.useState('AMB');
  const [stopMode,  setStopMode]  = React.useState('FADED');
  const fmt = (frac) => {
    const total = 12;
    const s = Math.max(0, frac * total);
    const m = Math.floor(s / 60);
    const sec = (s % 60).toFixed(1);
    return `${m}:${sec.padStart(4, '0')}`;
  };
  return (
    <div className="sb" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* App top bar — minimal, persistent */}
      <div style={{
        display: 'grid', gridTemplateColumns: '180px 1fr 180px',
        alignItems: 'center', gap: 12, padding: '8px 16px',
        background: 'var(--deep)', borderBottom: '1px solid var(--border)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ color: 'var(--text-dim)', cursor: 'pointer' }}>
            <svg width="18" height="13" viewBox="0 0 18 13" fill="currentColor"><rect x="0" y="0" width="18" height="2"/><rect x="0" y="5" width="18" height="2"/><rect x="0" y="11" width="18" height="2"/></svg>
          </div>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--text-dim)', letterSpacing: '.12em' }}>MENU</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 16, color: 'var(--gold)', letterSpacing: '.14em' }}>PAD EDITOR</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-mute)' }}>· Board 1</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <span className="sb-mode-badge is-setup" style={{ fontSize: 11 }}>SETUP</span>
        </div>
      </div>

      {/* STICKY EDITOR TOOLBAR — pad thumbnail + name + actions including DELETE */}
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

        {/* Live pad preview */}
        <MiniPad type="loop" name="WIND" hk="%" />

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-mute)', letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 2 }}>EDITING S-PAD · POSITION 03</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span style={{ fontFamily: 'var(--font-ui)', fontSize: 18, color: 'var(--text)', letterSpacing: '.04em' }}>Wind</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, padding: '1px 5px', background: 'var(--sunk)', border: '1px solid var(--border-soft)', color: 'var(--text-dim)' }}>%</span>
            <span className="sb-pill is-loop" style={{ fontSize: 9 }}><span className="sb-dot"/>LOOP</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-mute)' }}>· 0:12 · 395 KB</span>
          </div>
        </div>

        {/* Action group — SAVE and CANCEL together, DELETE isolated on the right */}
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="sb-btn sb-btn-sm sb-btn-ghost"><PixelIcon name="play" size={10} /> PREVIEW</button>
          <button className="sb-btn sb-btn-sm sb-btn-ghost">CANCEL</button>
          <button className="sb-btn sb-btn-sm sb-btn-filled"><PixelIcon name="save" size={10} /> SAVE</button>
        </div>
        <div style={{ width: 1, height: 32, background: 'var(--border-soft)' }} />
        <button className="sb-btn sb-btn-sm sb-btn-danger"><PixelIcon name="skull" size={10} /> DELETE</button>
      </div>

      {/* 3-COLUMN BODY — fits 1280×720 with margin, no scroll for the common case */}
      <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr 320px', flex: 1, minHeight: 0 }}>

        {/* LEFT · IDENTITY + BEHAVIOR + VISUAL ─────────────────── */}
        <aside style={{ background: 'var(--deep)', borderRight: '1px solid var(--border)', overflow: 'auto' }}>
          <PanelHeaderV2 icon="tag" title="IDENTITY" active />
          <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <FieldGroup label="NAME" hint="shown on the pad and in search">
              <InputField value="Wind" />
            </FieldGroup>
            <FieldGroup label="KEY" hint="click to capture · supports modifiers">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 56 }}><KeyCap kind="game">%</KeyCap></div>
                <button className="sb-btn sb-btn-sm sb-btn-ghost" style={{ padding: '3px 8px' }}>CAPTURE</button>
                <button className="sb-btn sb-btn-sm sb-btn-ghost" style={{ padding: '3px 8px' }}>CLEAR</button>
              </div>
              <div className="sb-mono" style={{ fontSize: 11, marginTop: 4, color: 'var(--success)' }}>
                ✓ no conflicts on this board
              </div>
            </FieldGroup>
          </div>

          <PanelHeaderV2 icon="diamond" title="BEHAVIOR" />
          <div style={{ padding: 14 }}>
            <FieldGroup label="MODE">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4 }}>
                <BigMode type="single" label="SOLO"  desc="once"     active />
                <BigMode type="loop"   label="LOOP"  desc="∞"           />
                <BigMode type="playlist" label="LIST" desc="N tracks"   />
              </div>
              <div className="sb-mono" style={{ fontSize: 11, marginTop: 8, color: 'var(--text-dim)' }}>
                // SOLO plays the file once and stops on its own.
              </div>
            </FieldGroup>
          </div>

          <PanelHeaderV2 icon="eye" title="VISUAL" right={<span className="sb-caption">1 / 4</span>} />
          <div style={{ padding: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 10 }}>
              <IconSlot icon="loop" active />
              <IconSlot />
              <IconSlot />
              <IconSlot />
            </div>
            <button className="sb-btn sb-btn-sm sb-btn-ghost" style={{ width: '100%' }}>
              <PixelIcon name="search" size={10} /> BROWSE ICON LIBRARY
            </button>
          </div>
        </aside>

        {/* CENTER · SOUND — the big show ─────────────────────── */}
        <main style={{ background: 'var(--surface)', padding: '16px 20px', overflow: 'auto' }}>
          <SectionLabel glyph="potion">SOUND · waveform</SectionLabel>

          {/* File chip */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 14px',
            background: 'var(--raised)',
            borderLeft: '3px solid var(--pad-loop)',
            marginBottom: 12,
          }}>
            <PixelIcon name="potion" size={18} color="var(--pad-loop)" />
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: 14, color: 'var(--text)', letterSpacing: '.04em' }}>wind.ogg</div>
              <div className="sb-mono" style={{ fontSize: 11, color: 'var(--text-mute)' }}>0:12 · 395 KB · 48 kHz · 16 bit</div>
            </div>
            <button className="sb-btn sb-btn-sm sb-btn-ghost"><PixelIcon name="book" size={10} /> FROM LIB</button>
            <button className="sb-btn sb-btn-sm sb-btn-ghost"><PixelIcon name="download" size={10} /> CHANGE</button>
            <button className="sb-btn sb-btn-sm sb-btn-danger" style={{ padding: '3px 10px' }}>UNLINK</button>
          </div>

          {/* Big waveform with trim + fade markers — all six handles draggable */}
          <div style={{ background: 'var(--sunk)', border: '1px solid var(--border)', padding: 14, marginBottom: 12 }}>
            <BigWaveform
              fadeIn={fadeIn} fadeOut={fadeOut}
              trimStart={trimStart} trimEnd={trimEnd}
              playhead={playhead} loopPoint={loopPoint}
              onFadeIn={setFadeIn} onFadeOut={setFadeOut}
              onTrimStart={setTrimStart} onTrimEnd={setTrimEnd}
              onPlayhead={setPlayhead} onLoopPoint={setLoopPoint}
              fmt={fmt}
            />
          </div>

          {/* Transport */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
            <button className="sb-btn sb-btn-sm sb-btn-primary"><PixelIcon name="play" size={10} /> PREVIEW</button>
            <button className="sb-btn sb-btn-sm sb-btn-ghost"><PixelIcon name="stop" size={10} /></button>
            <button className="sb-btn sb-btn-sm sb-btn-ghost"><PixelIcon name="loop" size={10} /></button>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-dim)', fontVariantNumeric: 'tabular-nums' }}>{fmt(playhead)} / 0:12.0</span>
            <div style={{ flex: 1 }} />
            <div style={{ display: 'flex', gap: 6 }}>
              <span className="sb-num">{fmt(trimStart)}</span>
              <span className="sb-mono" style={{ fontSize: 11, color: 'var(--text-mute)' }}>start</span>
              <span className="sb-num">{fmt(trimEnd)}</span>
              <span className="sb-mono" style={{ fontSize: 11, color: 'var(--text-mute)' }}>end</span>
            </div>
          </div>

          {/* Quick info strip */}
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8,
            padding: 10, background: 'var(--raised)', border: '1px solid var(--border-soft)',
          }}>
            <Stat label="DURATION" value="0:12" />
            <Stat label="USED BY"  value="2 pads" />
            <Stat label="PEAK"     value="-3.2 dB" />
            <Stat label="RMS"      value="-14 dB" />
          </div>
        </main>

        {/* RIGHT · AUDIO PARAMETERS INSPECTOR ─────────────────── */}
        <aside className="sb-inspector" style={{ background: 'var(--deep)', overflow: 'auto' }}>
          <PanelHeaderV2 icon="cog" title="AUDIO" active />
          <div className="sb-inspector-section" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <LabelSliderV2 label="VOLUME" value={volume} color="var(--pad-loop)" onChange={setVolume} />
            <KvRow label="OUTPUT BUS" right={
              <div style={{ display: 'flex', gap: 4 }}>
                {['STG', 'AMB', 'MUS'].map((b) => (
                  <span
                    key={b}
                    className={'sb-pill ' + (b === outputBus ? 'is-loop' : '')}
                    onClick={() => setOutputBus(b)}
                    style={{ fontSize: 9, cursor: 'pointer' }}
                  >{b}</span>
                ))}
              </div>
            } />
          </div>

          <PanelHeaderV2 icon="loop" title="FADE" />
          <div className="sb-inspector-section" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <LabelSliderV2 label="FADE IN"  value={fadeIn}  color="var(--fade)" onChange={setFadeIn}  />
            <LabelSliderV2 label="FADE OUT" value={fadeOut} color="var(--fade)" onChange={setFadeOut} />
            <KvRow label="STOP MODE" right={
              <div style={{ display: 'flex', gap: 4 }}>
                {['FADED', 'HARD'].map((m) => (
                  <span
                    key={m}
                    className={'sb-pill ' + (m === stopMode ? 'is-on' : '')}
                    onClick={() => setStopMode(m)}
                    style={{ fontSize: 9, cursor: 'pointer' }}
                  >{m}</span>
                ))}
              </div>
            } />
          </div>

          <PanelHeaderV2 icon="hourglass" title="TRIM" />
          <div className="sb-inspector-section" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <KvRow label="START" right={<span className="sb-num">{fmt(trimStart)}</span>} />
            <KvRow label="END"   right={<span className="sb-num">{fmt(trimEnd)}</span>} />
            <KvRow label="LOOP POINT" right={<span className="sb-num">{fmt(loopPoint)}</span>} />
            <button className="sb-btn sb-btn-sm sb-btn-ghost" style={{ marginTop: 4 }}>↻ RESET TO FILE</button>
          </div>

          <PanelHeaderV2 icon="tag" title="META" />
          <div className="sb-inspector-section">
            <KvRow label="TAGS" right={
              <div style={{ display: 'flex', gap: 4 }}>
                <span className="sb-pill is-loop" style={{ fontSize: 9 }}>wind</span>
                <span className="sb-pill" style={{ fontSize: 9 }}>ambient</span>
                <span className="sb-pill" style={{ fontSize: 9, color: 'var(--text-mute)' }}>+</span>
              </div>
            } />
            <KvRow label="FOLDER" right={<span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)' }}>Ambient ▾</span>} />
          </div>
        </aside>
      </div>

      {/* Status footer — autosave + dirty state always visible */}
      <div className="sb-status-bar">
        <span className="sb-status-section" style={{ color: 'var(--mode-setup)' }}>EDIT · S-PAD</span>
        <span className="sb-status-section">Board 1 · position 03</span>
        <span className="sb-status-section" style={{ color: 'var(--gold)' }}>● unsaved changes</span>
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 14 }}>
          <span>ESC cancel</span>
          <span>⌘S save</span>
          <span>⇧⌫ delete</span>
        </span>
      </div>
    </div>
  );
}

// ── refined helpers ───────────────────────────────────────────────
function FieldGroup({ label, hint, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--text-dim)', letterSpacing: '.1em' }}>{label}</span>
        {hint && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-mute)' }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}
function InputField({ value }) {
  return (
    <div style={{ padding: '7px 11px', background: 'var(--sunk)', border: '1px solid var(--border)', fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--text)' }}>{value}</div>
  );
}
function BigMode({ type, label, desc, active }) {
  const c = `var(--pad-${type})`;
  return (
    <div style={{
      padding: '10px 6px',
      textAlign: 'center',
      background: active ? `var(--pad-${type}-soft)` : 'var(--surface)',
      border: '1px solid ' + (active ? c : 'var(--border)'),
      borderLeft: active ? `3px solid ${c}` : '3px solid var(--border)',
      cursor: 'pointer',
    }}>
      <div style={{ color: c, marginBottom: 4 }}>
        <PixelIcon name={type === 'loop' ? 'loop' : type === 'playlist' ? 'scroll' : 'play'} size={16} />
      </div>
      <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: active ? c : 'var(--text-dim)', letterSpacing: '.12em' }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-mute)', marginTop: 1 }}>{desc}</div>
    </div>
  );
}
function IconSlot({ icon, active }) {
  return (
    <div style={{
      aspectRatio: '1',
      background: active ? 'var(--pad-loop-soft)' : 'var(--sunk)',
      border: '1px ' + (active ? 'solid var(--pad-loop)' : 'dashed var(--border)'),
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: active ? 'var(--pad-loop)' : 'var(--text-mute)',
      cursor: 'pointer',
    }}>
      {icon ? <PixelIcon name={icon} size={18} /> : <span style={{ fontSize: 14 }}>+</span>}
    </div>
  );
}
function Stat({ label, value }) {
  return (
    <div>
      <div style={{ fontFamily: 'var(--font-ui)', fontSize: 10, color: 'var(--text-mute)', letterSpacing: '.12em', marginBottom: 2 }}>{label}</div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// Refinement notes
// ═════════════════════════════════════════════════════════════════
function PadEditNotesArtboard() {
  const notes = [
    ['Sticky editor toolbar',     'SAVE · CANCEL · DELETE always visible at the top. No more buried delete button. Includes a live mini-pad preview so you see exactly what you\'re building.'],
    ['Three-column layout',       'LEFT: identity, mode, icons. CENTER: the big waveform + transport. RIGHT: audio parameters inspector. Fits 1280×720 with margin — no scrolling for the common case.'],
    ['DELETE separated',          'Visually isolated from SAVE/CANCEL by a vertical divider so it can\'t be hit by accident, but always reachable.'],
    ['Live pad preview',          'The actual mini-pad (colour spine + icon + name + hotkey) sits in the toolbar. Type/colour changes are immediately visible.'],
    ['Mode selector visual',      'SOLO/LOOP/LIST get coloured icons + descriptions ("once" / "∞" / "N tracks"). The type colour for the pad updates live as you switch.'],
    ['Key conflict feedback',     'Inline "✓ no conflicts on this board" or a warning shown directly under the KEY field — no need to wait for save.'],
    ['Audio meta promoted',       'Peak, RMS, used-by-N-pads visible as a stat strip. Was previously not surfaced at all.'],
    ['FADE & TRIM expanded',      'No accordion. Both live in the right-rail inspector with sliders + numeric scrubbers. Stop-mode (FADED / HARD) is a first-class control.'],
    ['Output bus picker',         'STG / AMB / MUS bus assignment for cleaner master mixing — defaults from Settings → Audio.'],
    ['Status footer w/ shortcuts','ESC cancel · ⌘S save · ⇧⌫ delete shown in the footer. Discoverable keyboard parity.'],
    ['Dirty-state indicator',     '"● unsaved changes" pulses gold in the status bar until SAVE is hit.'],
  ];

  return (
    <div className="sb" style={{ padding: 28, overflow: 'auto', height: '100%' }}>
      <div style={{ marginBottom: 18 }}>
        <div className="sb-display" style={{ fontSize: 20 }}>PAD Editor · what changed</div>
        <div className="sb-mono" style={{ fontSize: 13, marginTop: 6 }}>
          // one tall scroll with the DELETE button buried → sticky toolbar + 3-column workspace.
        </div>
      </div>
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
    </div>
  );
}

Object.assign(window, { PadEditActual, PadEditRefined, PadEditNotesArtboard });
