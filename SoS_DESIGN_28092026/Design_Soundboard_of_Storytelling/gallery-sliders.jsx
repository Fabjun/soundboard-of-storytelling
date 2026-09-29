// gallery-sliders.jsx — interactive MASTER-fader variants for the lab.
// Every variant is a real, draggable control. Shared drag hooks below;
// each variant owns its own value state so they move independently.
const { useState, useRef, useCallback } = React;

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Horizontal rail drag → 0..100 from pointer X across the element.
function useHDrag(value, setValue) {
  const ref = useRef(null);
  const onPointerDown = useCallback((e) => {
    const rail = ref.current; if (!rail) return;
    try { rail.setPointerCapture(e.pointerId); } catch (_) {}
    const set = (cx) => {
      const r = rail.getBoundingClientRect();
      setValue(clamp(Math.round(((cx - r.left) / r.width) * 100), 0, 100));
    };
    set(e.clientX);
    const mv = (ev) => { ev.preventDefault(); set(ev.clientX); };
    const up = () => { rail.removeEventListener('pointermove', mv); rail.removeEventListener('pointerup', up); };
    rail.addEventListener('pointermove', mv);
    rail.addEventListener('pointerup', up);
  }, [setValue]);
  return { ref, onPointerDown };
}

// Vertical drag → 0 at bottom, 100 at top.
function useVDrag(value, setValue) {
  const ref = useRef(null);
  const onPointerDown = useCallback((e) => {
    const rail = ref.current; if (!rail) return;
    try { rail.setPointerCapture(e.pointerId); } catch (_) {}
    const set = (cy) => {
      const r = rail.getBoundingClientRect();
      setValue(clamp(Math.round((1 - (cy - r.top) / r.height) * 100), 0, 100));
    };
    set(e.clientY);
    const mv = (ev) => { ev.preventDefault(); set(ev.clientY); };
    const up = () => { rail.removeEventListener('pointermove', mv); rail.removeEventListener('pointerup', up); };
    rail.addEventListener('pointermove', mv);
    rail.addEventListener('pointerup', up);
  }, [setValue]);
  return { ref, onPointerDown };
}

// Relative vertical-drag for the dial: each pixel up adds value.
function useDialDrag(value, setValue) {
  const onPointerDown = useCallback((e) => {
    const el = e.currentTarget;
    try { el.setPointerCapture(e.pointerId); } catch (_) {}
    let lastY = e.clientY, v = value;
    const mv = (ev) => {
      ev.preventDefault();
      v = clamp(v + (lastY - ev.clientY) * 0.6, 0, 100);
      lastY = ev.clientY;
      setValue(Math.round(v));
    };
    const up = () => { el.removeEventListener('pointermove', mv); el.removeEventListener('pointerup', up); };
    el.addEventListener('pointermove', mv);
    el.addEventListener('pointerup', up);
  }, [value, setValue]);
  return { onPointerDown };
}

// Static-ish meter bars (calm, deterministic heights so the lab stays quiet).
function MeterBars({ n = 40, level = 72 }) {
  const bars = [];
  for (let i = 0; i < n; i++) {
    const wob = (Math.sin(i * 1.3) + Math.sin(i * 0.7)) * 0.5; // -1..1
    const lit = (i / n) * 100 <= level;
    const h = lit ? 26 + (wob + 1) * 28 : 8 + (wob + 1) * 6;
    bars.push(<i key={i} style={{ height: h + '%', opacity: lit ? 1 : 0.5 }} />);
  }
  return <div className="gv-rail-meter">{bars}</div>;
}

// ── A · Knubbel mit Zahl (verfeinert) ─────────────────────────────
function SliderA() {
  const [v, setV] = useState(72);
  const { ref, onPointerDown } = useHDrag(v, setV);
  // Measure the MASTER label so the number-knob parks just in front of it
  // instead of sliding across it when the fader is pulled all the way down.
  const chipRef = useRef(null);
  const knobRef = useRef(null);
  const [minPx, setMinPx] = useState(13);
  React.useLayoutEffect(() => {
    const chip = chipRef.current, knob = knobRef.current;
    if (!chip) return;
    const chipRight = chip.offsetLeft + chip.offsetWidth;     // label's right edge
    const halfKnob = (knob ? knob.offsetWidth : 32) / 2;      // knob is centred on its left
    setMinPx(chipRight + halfKnob - 9);                       // overlap the label so the frames merge
  }, []);
  // clamp the value-knob: stops in front of the label on the low end,
  // and never clips at the right rail edge.
  const knobLeft = `clamp(${minPx}px, ${v}%, calc(100% - 13px))`;
  return (
    <div className="gv-stage">
      <div className="gv-rail gv-pix" ref={ref} onPointerDown={onPointerDown} style={{ height: 54 }}>
        <MeterBars level={v} />
        <div className="gvA-level" style={{ width: v + '%' }} />
        <div className="gvA-chip gv-pix" ref={chipRef}>MASTER</div>
        <div className="gvA-line" style={{ left: v + '%' }} />
        <div className="gvA-knob gv-pix" ref={knobRef} style={{ left: knobLeft }}>{v}</div>
      </div>
    </div>
  );
}

// ── B · Tooltip-Bubble über dem Griff ─────────────────────────────
function SliderB() {
  const [v, setV] = useState(60);
  const { ref, onPointerDown } = useHDrag(v, setV);
  const at = `clamp(13px, ${v}%, calc(100% - 13px))`;
  return (
    <div className="gv-stage">
      <div className="gvB" ref={ref} onPointerDown={onPointerDown}>
        <div className="gvB-bubble gv-pix" style={{ left: at }}>{v}</div>
        <div className="gvB-track gv-pix"><div className="gvB-fill" style={{ width: v + '%' }} /></div>
        <div className="gvB-cap gv-pix" style={{ left: v + '%' }} />
      </div>
    </div>
  );
}

// ── C · Pixel-Notches (gerastert) ─────────────────────────────────
function SliderC() {
  const [v, setV] = useState(45);
  const { ref, onPointerDown } = useHDrag(v, setV);
  const N = 21;
  const notches = [];
  for (let i = 0; i < N; i++) {
    const pct = (i / (N - 1)) * 100;
    notches.push(<i key={i} className={pct <= v ? 'lit' : ''} />);
  }
  return (
    <div className="gv-stage">
      <div className="gvC">
        <div className="gvC-rail gv-pix" ref={ref} onPointerDown={onPointerDown}>
          <div className="gvC-notches">{notches}</div>
          <div className="gvC-cap" style={{ left: `clamp(4px, ${v}%, calc(100% - 4px))` }} />
        </div>
        <div className="gvC-readout gv-pix">{v}</div>
      </div>
    </div>
  );
}

// ── D · Vertikaler Fader ──────────────────────────────────────────
function SliderD() {
  const [v, setV] = useState(72);
  const { ref, onPointerDown } = useVDrag(v, setV);
  return (
    <div className="gv-stage">
      <div className="gvD">
        <div className="gvD-fader gv-pix" ref={ref} onPointerDown={onPointerDown}>
          <div className="gvD-groove" />
          <div className="gvD-fill" style={{ height: v + '%' }} />
          <div className="gvD-cap gv-pix" style={{ bottom: `clamp(8px, ${v}%, calc(100% - 8px))` }}>
            <span /><span /><span />
          </div>
        </div>
        <div className="gvD-read gv-pix">{v}</div>
      </div>
    </div>
  );
}

// ── E · Rotary Dial (bold) ────────────────────────────────────────
function SliderE() {
  const [v, setV] = useState(72);
  const { onPointerDown } = useDialDrag(v, setV);
  const TICKS = 11;
  const sweep = 270;            // degrees of travel
  const start = -135;          // bottom-left origin
  const angle = start + (v / 100) * sweep;
  const ticks = [];
  for (let i = 0; i < TICKS; i++) {
    const a = start + (i / (TICKS - 1)) * sweep;
    const lit = (i / (TICKS - 1)) * 100 <= v;
    ticks.push(<i key={i} className={lit ? 'lit' : ''} style={{ transform: `translateX(-50%) rotate(${a}deg)` }} />);
  }
  return (
    <div className="gv-stage">
      <div className="gvE">
        <div className="gvE-dial" onPointerDown={onPointerDown}>
          <div className="gvE-ticks">{ticks}</div>
          <div className="gvE-pointer" style={{ transform: `translateX(-50%) rotate(${angle}deg)` }} />
          <div className="gvE-val">{v}</div>
        </div>
        <div className="gvE-cap-label">MASTER</div>
      </div>
    </div>
  );
}

Object.assign(window, { SliderA, SliderB, SliderC, SliderD, SliderE });
