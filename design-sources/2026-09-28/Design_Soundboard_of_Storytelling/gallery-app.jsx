// gallery-app.jsx — mounts the Bauteil-Galerie design canvas.
// Sections: Master-Regler (5 live variants), Buttons, Rahmen, Griffe, Chips.
// Master-Regler is the priority — fully draggable, value rides the handle.

// Board wrapper for slider artboards (gives them the note strip; the slider
// component already supplies its own .gv-stage).
function SBoard({ note, children }) {
  return (
    <div className="gv-board">
      {children}
      <div className="gv-note">{note}</div>
    </div>
  );
}

function GalleryApp() {
  return (
    <DesignCanvas>
      <DCSection id="regler" title="Master-Regler" subtitle="Fünf Wege, Lautstärke + Wert zu zeigen — alle live ziehbar">
        <DCArtboard id="A" label="A · Knubbel mit Zahl" width={400} height={150}>
          <SBoard note={<><b>A · Knubbel</b> — Wert im Griff, oben bündig. Verfeinerung des aktuellen Stands.</>}><SliderA /></SBoard>
        </DCArtboard>
        <DCArtboard id="B" label="B · Tooltip-Bubble" width={400} height={150}>
          <SBoard note={<><b>B · Bubble</b> — Sprechblase über dem Griff, folgt beim Ziehen.</>}><SliderB /></SBoard>
        </DCArtboard>
        <DCArtboard id="C" label="C · Pixel-Notches" width={400} height={150}>
          <SBoard note={<><b>C · Notches</b> — gerasterte Skala, Wert separat im Readout.</>}><SliderC /></SBoard>
        </DCArtboard>
        <DCArtboard id="D" label="D · Vertikaler Fader" width={210} height={290}>
          <SBoard note={<><b>D · Fader</b> — Kanalzug-Look, vertikal ziehen.</>}><SliderD /></SBoard>
        </DCArtboard>
        <DCArtboard id="E" label="E · Rotary Dial" width={250} height={290}>
          <SBoard note={<><b>E · Dial</b> — mutig: Drehknopf, hoch/runter ziehen.</>}><SliderE /></SBoard>
        </DCArtboard>
      </DCSection>

      <DCSection id="buttons" title="Buttons" subtitle="Aktionsstile — vier im Stil, einer mutig">
        <DCArtboard id="outline" label="A · Outline" width={230} height={185}><BtnOutline /></DCArtboard>
        <DCArtboard id="filled" label="B · Filled" width={230} height={185}><BtnFilled /></DCArtboard>
        <DCArtboard id="ghost" label="C · Ghost" width={230} height={185}><BtnGhost /></DCArtboard>
        <DCArtboard id="danger" label="D · Danger" width={230} height={185}><BtnDanger /></DCArtboard>
        <DCArtboard id="emboss" label="E · Emboss 3D" width={230} height={185}><BtnEmboss /></DCArtboard>
      </DCSection>

      <DCSection id="frames" title="Rahmen" subtitle="Container-Behandlungen für Panels & Karten">
        <DCArtboard id="stepped" label="A · Stepped" width={250} height={190}><FrameStepped /></DCArtboard>
        <DCArtboard id="brackets" label="B · Brackets" width={250} height={190}><FrameBrackets /></DCArtboard>
        <DCArtboard id="double" label="C · Double-Line" width={250} height={190}><FrameDouble /></DCArtboard>
        <DCArtboard id="banner" label="D · Banner" width={250} height={190}><FrameBanner /></DCArtboard>
      </DCSection>

      <DCSection id="handles" title="Griffe" subtitle="Regler-Köpfe — austauschbar über alle Fader">
        <DCArtboard id="line" label="A · Linie + Raute" width={230} height={150}><HandleLine /></DCArtboard>
        <DCArtboard id="cap" label="B · Pixel-Cap" width={230} height={150}><HandleCap /></DCArtboard>
        <DCArtboard id="grip" label="C · Grip-Cap" width={230} height={150}><HandleGrip /></DCArtboard>
        <DCArtboard id="round" label="D · Knopf" width={230} height={150}><HandleRound /></DCArtboard>
        <DCArtboard id="notch" label="E · Notch" width={230} height={150}><HandleNotch /></DCArtboard>
      </DCSection>

      <DCSection id="chips" title="Chips" subtitle="Kleine Marker — Label, Wert, Status, Typ, Taste">
        <DCArtboard id="label" label="A · Label" width={250} height={150}><ChipLabel /></DCArtboard>
        <DCArtboard id="value" label="B · Value" width={250} height={150}><ChipValue /></DCArtboard>
        <DCArtboard id="status" label="C · Status-Pill" width={250} height={150}><ChipStatus /></DCArtboard>
        <DCArtboard id="types" label="D · Type-Pills" width={250} height={150}><ChipTypes /></DCArtboard>
        <DCArtboard id="key" label="E · Key-Cap" width={250} height={150}><ChipKey /></DCArtboard>
      </DCSection>
    </DesignCanvas>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<GalleryApp />);
