// gallery-elements.jsx — buttons, frames, handles & chips for the lab.
// Mostly presentational; buttons are clickable (CSS :active/:hover carry
// the affordance). Each exported component fills one artboard.

// tiny pixel glyphs (square-ish, in-vocabulary — no ornate SVG)
function GPlay({ s = 11, c = 'currentColor' }) {
  return <svg width={s} height={s} viewBox="0 0 10 10" fill={c}><path d="M2 1 L9 5 L2 9 Z" /></svg>;
}
function GStop({ s = 11, c = 'currentColor' }) {
  return <svg width={s} height={s} viewBox="0 0 10 10" fill={c}><rect x="2" y="2" width="6" height="6" /></svg>;
}
function GPlus({ s = 12, c = 'currentColor' }) {
  return <svg width={s} height={s} viewBox="0 0 10 10" fill={c}><rect x="4" y="1" width="2" height="8" /><rect x="1" y="4" width="8" height="2" /></svg>;
}

function ElBoard({ note, children }) {
  return (
    <div className="gv-board">
      <div className="gv-stage">{children}</div>
      <div className="gv-note">{note}</div>
    </div>
  );
}

// ── BUTTONS ───────────────────────────────────────────────────────
function BtnOutline() {
  return (
    <ElBoard note={<><b>A · Outline</b> — Standard. Gold-Rahmen auf Hover.</>}>
      <div className="gv-col">
        <button className="gv-btn outline gv-pix"><GPlay /> PLAY SCENE</button>
        <button className="gv-btn outline gv-pix">STOP ALL</button>
      </div>
    </ElBoard>
  );
}
function BtnFilled() {
  return (
    <ElBoard note={<><b>B · Filled</b> — voller Gold-Fond für primäre Aktionen.</>}>
      <div className="gv-col">
        <button className="gv-btn filled gv-pix"><GPlay c="var(--text-on-gold)" /> FIRE</button>
        <button className="gv-btn filled gv-pix"><GPlus c="var(--text-on-gold)" /> NEW PAD</button>
      </div>
    </ElBoard>
  );
}
function BtnGhost() {
  return (
    <ElBoard note={<><b>C · Ghost</b> — leise, für sekundäre Optionen.</>}>
      <div className="gv-col">
        <button className="gv-btn ghost gv-pix">CANCEL</button>
        <button className="gv-btn ghost gv-pix">SETTINGS</button>
      </div>
    </ElBoard>
  );
}
function BtnDanger() {
  return (
    <ElBoard note={<><b>D · Danger</b> — destruktiv, Blut-Akzent.</>}>
      <div className="gv-col">
        <button className="gv-btn danger gv-pix"><GStop c="var(--blood-bright)" /> DELETE</button>
        <button className="gv-btn danger gv-pix">CLEAR BOARD</button>
      </div>
    </ElBoard>
  );
}
function BtnEmboss() {
  return (
    <ElBoard note={<><b>E · Emboss 3D</b> — mutig: harter Schatten, drückt sich ein.</>}>
      <div className="gv-col">
        <button className="gv-btn emboss"><GPlay c="var(--text-on-gold)" /> FIRE</button>
        <button className="gv-btn emboss">SCENE NEXT</button>
      </div>
    </ElBoard>
  );
}

// ── FRAMES ────────────────────────────────────────────────────────
function FrameStepped() {
  return (
    <ElBoard note={<><b>A · Stepped</b> — die kanonische Pixel-Kante.</>}>
      <div className="gv-frame stepped">PANEL</div>
    </ElBoard>
  );
}
function FrameBrackets() {
  return (
    <ElBoard note={<><b>B · Brackets</b> — Eck-Winkel, „im Visier".</>}>
      <div className="gv-frame brackets"><span className="gv-bk1" /><span className="gv-bk2" />FOCUS</div>
    </ElBoard>
  );
}
function FrameDouble() {
  return (
    <ElBoard note={<><b>C · Double-Line</b> — eingelassene Doppellinie.</>}>
      <div className="gv-frame double">INSET</div>
    </ElBoard>
  );
}
function FrameBanner() {
  return (
    <ElBoard note={<><b>D · Banner</b> — Panel mit Titelleiste.</>}>
      <div className="gv-frame banner"><span className="gv-banner"><GPlay s={9} c="var(--gold)" /> MASTER</span>CONTENT</div>
    </ElBoard>
  );
}

// ── HANDLES ───────────────────────────────────────────────────────
function HandleTrack({ kind, children }) {
  return (
    <div className="gv-htrack gv-pix">
      <div className="gv-hfill" />
      <div className={`gv-handle ${kind}`}>{children}</div>
    </div>
  );
}
function HandleLine() {
  return <ElBoard note={<><b>A · Linie + Raute</b> — präziser Marker.</>}><HandleTrack kind="line" /></ElBoard>;
}
function HandleCap() {
  return <ElBoard note={<><b>B · Pixel-Cap</b> — kompakter Fader-Kopf.</>}><HandleTrack kind="cap" /></ElBoard>;
}
function HandleGrip() {
  return <ElBoard note={<><b>C · Grip-Cap</b> — mit Griffrillen.</>}><HandleTrack kind="grip"><span /><span /><span /></HandleTrack></ElBoard>;
}
function HandleRound() {
  return <ElBoard note={<><b>D · Knopf</b> — gerundeter Drehknopf.</>}><HandleTrack kind="round" /></ElBoard>;
}
function HandleNotch() {
  return <ElBoard note={<><b>E · Notch</b> — mutig: facettierte Kappe.</>}><HandleTrack kind="notch" /></ElBoard>;
}

// ── CHIPS ─────────────────────────────────────────────────────────
function ChipLabel() {
  return (
    <ElBoard note={<><b>A · Label</b> — UI-Font, gesperrt.</>}>
      <div className="gv-row"><span className="gv-chip label gv-pix">MASTER</span><span className="gv-chip label gv-pix">AMBIENT</span></div>
    </ElBoard>
  );
}
function ChipValue() {
  return (
    <ElBoard note={<><b>B · Value</b> — solider Gold-Wert.</>}>
      <div className="gv-row"><span className="gv-chip value gv-pix">72</span><span className="gv-chip value gv-pix">100</span></div>
    </ElBoard>
  );
}
function ChipStatus() {
  return (
    <ElBoard note={<><b>C · Status-Pill</b> — leuchtender Punkt.</>}>
      <div className="gv-row"><span className="gv-chip on gv-pix"><span className="gv-dot" />PLAYING</span><span className="gv-chip gv-pix"><span className="gv-dot" />IDLE</span></div>
    </ElBoard>
  );
}
function ChipTypes() {
  return (
    <ElBoard note={<><b>D · Type-Pills</b> — Pad-Typ-Familien.</>}>
      <div className="gv-row"><span className="gv-chip loop gv-pix"><span className="gv-dot" />LOOP</span><span className="gv-chip playlist gv-pix"><span className="gv-dot" />PLAYLIST</span></div>
    </ElBoard>
  );
}
function ChipKey() {
  return (
    <ElBoard note={<><b>E · Key-Cap</b> — Tastatur-Kürzel.</>}>
      <div className="gv-row"><span className="gv-key gv-pix">F3</span><span className="gv-key gv-pix">⌘S</span><span className="gv-key gv-pix">SPACE</span></div>
    </ElBoard>
  );
}

Object.assign(window, {
  BtnOutline, BtnFilled, BtnGhost, BtnDanger, BtnEmboss,
  FrameStepped, FrameBrackets, FrameDouble, FrameBanner,
  HandleLine, HandleCap, HandleGrip, HandleRound, HandleNotch,
  ChipLabel, ChipValue, ChipStatus, ChipTypes, ChipKey,
});
