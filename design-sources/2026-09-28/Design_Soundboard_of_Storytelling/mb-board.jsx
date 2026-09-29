// mb-board.jsx — the interactive phone Board (GAME + SETUP).
// Honors: three-band persistent frame · grid invariant across modes ·
// variable AUTO/fixed grid w/ live-preview sheet · FLIP re-wrap anchored
// on top pad · tap-fire / swipe-scroll / long-hold pickup+fill-ring /
// GAME swipe-to-page edge-peek · STOP ALL dedicated · summon grip.

const { useState, useRef, useLayoutEffect, useEffect, useCallback } = React;

const TYPE_COLORVARS = (t) => ({ '--pad-color': `var(--pad-${t})`, '--pad-glow': `var(--pad-${t}-glow)` });

function autoCols(w, padSize, gap) {
  if (!w) return 4;
  const usable = w - 20; // grid padding
  return Math.max(2, Math.min(8, Math.floor((usable + gap) / (padSize + gap))));
}

// ── Live level meter — coupled to the board's actual playing state.
// No real audio engine in this prototype, so the level is synthesized from
// the active loops/playlists (+ a spike on each fire). Wired to real state,
// so it moves exactly when the true output would. Swap in a Web Audio
// AnalyserNode here once the code side has real sound.
function MBLevelMeter({ active = 0, pulse = 0, bars = 5, color = 'var(--gold)' }) {
  const refs = useRef([]);
  const boost = useRef(0);
  const lastPulse = useRef(pulse);
  useEffect(() => {
    if (pulse !== lastPulse.current) { boost.current = Math.min(1.5, boost.current + 0.8); lastPulse.current = pulse; }
  }, [pulse]);
  useEffect(() => {
    let raf; const t0 = performance.now();
    const phase = Array.from({ length: bars }, (_, i) => i * 1.27 + (i % 2));
    const freq = Array.from({ length: bars }, (_, i) => 2.3 + (i % 3) * 0.9);
    const loop = (t) => {
      const sec = (t - t0) / 1000;
      const amp = active > 0 ? Math.min(1, 0.34 + active * 0.14) : 0.05;
      boost.current *= 0.9;
      for (let i = 0; i < bars; i++) {
        const el = refs.current[i]; if (!el) continue;
        const osc = (Math.sin(sec * freq[i] + phase[i]) + 1) / 2;
        let h = amp * (0.32 + osc * 0.68) + boost.current * 0.45;
        h = Math.max(0.05, Math.min(1, h));
        el.style.height = (2 + h * 11) + 'px';
        el.style.opacity = (active > 0 || boost.current > 0.05) ? 1 : 0.3;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [active, bars]);
  return (
    <div className="mb-eq mb-meter" aria-hidden="true">
      {Array.from({ length: bars }).map((_, i) => (
        <i key={i} ref={(el) => { refs.current[i] = el; }} style={{ height: '3px', background: color }} />
      ))}
    </div>
  );
}

// ── Per-pad background level meter — shown behind an active (hot) pad.
// Transparent bars rising from the bottom in the pad's type colour, masked
// to fade out before the text so the label stays legible. Also a strong
// at-a-glance "this pad is playing" cue.
function MBPadMeter({ color = 'var(--gold)', bars = 7 }) {
  const refs = useRef([]);
  useEffect(() => {
    let raf; const t0 = performance.now();
    const phase = Array.from({ length: bars }, (_, i) => i * 0.85 + (i % 3));
    const freq = Array.from({ length: bars }, (_, i) => 1.9 + (i % 4) * 0.55);
    const loop = (t) => {
      const sec = (t - t0) / 1000;
      for (let i = 0; i < bars; i++) {
        const el = refs.current[i]; if (!el) continue;
        const osc = (Math.sin(sec * freq[i] + phase[i]) + 1) / 2;
        el.style.height = (18 + osc * 82) + '%';
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [bars]);
  return (
    <div className="mb-pad-bg" aria-hidden="true">
      {Array.from({ length: bars }).map((_, i) => (
        <i key={i} ref={(el) => { refs.current[i] = el; }} style={{ background: color }} />
      ))}
    </div>
  );
}

// Synthesized per-repetition loop duration (no real audio yet) — stable per id.
function padDuration(p) {
  let h = 0; const s = String(p.id);
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  const base = p.type === 'playlist' ? 3 : 4;
  const span = p.type === 'playlist' ? 3 : 4;
  return base + (h % 1000) / 1000 * span;
}

// Synthesized repetition count — a loop of 3 reps draws 3 segments; a
// playlist's segment count = its number of tracks. Stable per id.
function padReps(p) {
  let h = 0; const s = 'r' + p.id;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return p.type === 'playlist' ? 3 + (h % 4) : 2 + (h % 3);
}

// Some loops run forever (seamless ambience); those "breathe" instead of
// showing finite segments. Playlists are always finite (their tracks).
function padInfinite(p) {
  if (p.type !== 'loop') return false;
  let h = 0; const s = 'i' + p.id;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h % 2 === 0;
}

// Segmented loop-progress along the bottom of an active pad: one segment per
// repetition, filling in sequence (segment N fills, then N+1 …), then the
// cycle repeats. rAF-driven (only a handful of pads are ever active at once).
function MBPadProgress({ color = 'var(--gold)', dur = 6, reps = 3, infinite = false }) {
  const refs = useRef([]);
  useEffect(() => {
    if (infinite) return;
    let raf; const t0 = performance.now();
    const total = reps * dur;
    const loop = (t) => {
      const pos = ((((t - t0) / 1000) % total) + total) % total / dur; // 0..reps
      const cur = Math.floor(pos), frac = pos - cur;
      for (let i = 0; i < reps; i++) {
        const el = refs.current[i]; if (!el) continue;
        el.style.width = (i < cur ? 100 : i === cur ? frac * 100 : 0) + '%';
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [dur, reps, infinite]);
  if (infinite) {
    // endless loop → a single bar that breathes (unambiguously "runs forever")
    return (
      <div className="mb-pad-progress is-infinite" aria-hidden="true">
        <i className="mb-prog-breathe" style={{ background: color }} />
      </div>
    );
  }
  return (
    <div className="mb-pad-progress" aria-hidden="true">
      {Array.from({ length: reps }).map((_, i) => (
        <span key={i} className="mb-prog-seg"><i ref={(el) => { refs.current[i] = el; }} style={{ background: color }} /></span>
      ))}
    </div>
  );
}

// ── Master output meter — the whole board's output behind the master slider.
// Output = summed activity of the active pads (+ fire spikes) × master gain,
// so dragging the master scales the meter live (it's the final stage). Tips
// red when the summed signal would clip. No real audio engine yet — wire a
// master AnalyserNode here later; the master-scaling stays identical.
function MBMasterMeter({ active = 0, pulse = 0, master = 72, bars = 24 }) {
  const refs = useRef([]);
  const wrapRef = useRef(null);
  const boost = useRef(0);
  const lastPulse = useRef(pulse);
  useEffect(() => {
    if (pulse !== lastPulse.current) { boost.current = Math.min(1.4, boost.current + 0.7); lastPulse.current = pulse; }
  }, [pulse]);
  useEffect(() => {
    let raf; const t0 = performance.now();
    const phase = Array.from({ length: bars }, (_, i) => i * 0.6);
    const freq = Array.from({ length: bars }, (_, i) => 2 + (i % 5) * 0.7);
    const loop = (t) => {
      const sec = (t - t0) / 1000;
      const gain = master / 100;
      const src = active > 0 ? Math.min(1, 0.62 + active * 0.13) : 0.05;
      boost.current *= 0.9;
      let peak = 0;
      for (let i = 0; i < bars; i++) {
        const el = refs.current[i]; if (!el) continue;
        const osc = (Math.sin(sec * freq[i] + phase[i]) + 1) / 2;
        // raw signal, THEN scaled by master gain (the final output stage)
        let lvl = (src * (0.62 + osc * 0.55) + boost.current * 0.5) * gain;
        lvl = Math.max(0.03, Math.min(1.15, lvl));
        peak = Math.max(peak, lvl);
        el.style.height = Math.min(100, lvl * 100) + '%';
      }
      if (wrapRef.current) wrapRef.current.classList.toggle('is-clip', peak > 1.0);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [active, master, bars]);
  return (
    <div className="mb-master-meter" ref={wrapRef} aria-hidden="true">
      {Array.from({ length: bars }).map((_, i) => (
        <i key={i} ref={(el) => { refs.current[i] = el; }} />
      ))}
    </div>
  );
}

function MBPhoneBoard({ gripStyle = 'A', orient: orientProp, dims }) {
  const [mode, setMode] = useState('game');
  const [pads, setPads] = useState(() => buildPads());
  const [hot, setHot] = useState(() => new Set(MB_INITIAL_HOT));
  const [firing, setFiring] = useState(() => new Set());
  const [fireSeq, setFireSeq] = useState(0); // bumps on every fire — drives the level meter spike
  const [scenes, setScenes] = useState(() => MB_SCENES.slice());
  const [scene, setScene] = useState(1);
  const [master, setMaster] = useState(72);
  const [selected, setSelected] = useState(null);
  const [marked, setMarked] = useState(() => new Set()); // multi-select in SETUP
  const [selectMode, setSelectMode] = useState(false);   // explicit multi-select mode
  const [history, setHistory] = useState([]);            // arrangement undo stack
  const [redoStack, setRedoStack] = useState([]);
  const [editorToast, setEditorToast] = useState(null);  // pad-editor placeholder (deferred round)
  const [lifted, setLifted] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);

  // grid config
  const [padSize, setPadSize] = useState(96);
  const [gap, setGap] = useState(8);
  const [colMode, setColMode] = useState('auto');
  const [fixedCols, setFixedCols] = useState(4);
  const [labelSize, setLabelSize] = useState(13);
  const [measuredW, setMeasuredW] = useState(350);

  // chrome state
  const [atmos, setAtmos] = useState(true);
  const [nowOpen, setNowOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [previewCtl, setPreviewCtl] = useState(null);
  const [locked, setLocked] = useState(false);
  const [lockFlash, setLockFlash] = useState(false);
  const [sparks, setSparks] = useState(null);
  const [pageDir, setPageDir] = useState(null); // 'l' | 'r' peek

  const scrollerRef = useRef(null);
  const masterRef = useRef(null);
  const masterChipRef = useRef(null);
  const [masterMerged, setMasterMerged] = useState(false);
  const [masterKnobX, setMasterKnobX] = useState(0);
  // ── AXIS 1 · aspect detection ──────────────────────────────────
  // The board reads its own box (logical CSS px, transform-independent) and
  // classifies portrait vs landscape. A small dead-zone around 1:1 stops it
  // flip-flopping near square. This is the foundation every A/B-panel dock
  // edge will key off later — for now it only drives a class + debug tag.
  const phoneRef = useRef(null);
  const [selfOrient, setSelfOrient] = useState('portrait');
  const [selfDims, setSelfDims] = useState({ w: 0, h: 0 });
  // harness-provided values win; self-detection is the standalone fallback
  const orient = orientProp || selfOrient;
  const boxDims = dims || selfDims;
  const cellRefs = useRef({});
  const prevRects = useRef({});
  const anchor = useRef(null);
  const pendingFlip = useRef(false);
  const prevCols = useRef(4);
  const gesture = useRef({});
  const holdTimer = useRef(null);
  const ringRaf = useRef(null);
  const [ring, setRing] = useState(null); // {x,y,pct}

  // FIXED upper limit is display-dependent: as many columns as still keep pads
  // above the touch-minimum width — never a hard number (mirrors AUTO's math).
  const TOUCH_MIN = 64;
  const maxFixedCols = Math.max(2, Math.floor(((measuredW - 20) + gap) / (TOUCH_MIN + gap)));
  const clampedFixed = Math.min(fixedCols, maxFixedCols);
  const effectiveCols = colMode === 'auto' ? autoCols(measuredW, padSize, gap) : clampedFixed;

  // measure width — re-measures on size-preset / orientation change too, so
  // columns re-wrap live even where ResizeObserver delivery is throttled.
  useLayoutEffect(() => {
    const el = scrollerRef.current; if (!el) return;
    const measure = () => setMeasuredW(el.clientWidth);
    const ro = new ResizeObserver(measure);
    ro.observe(el); measure();
    window.addEventListener('resize', measure);
    return () => { ro.disconnect(); window.removeEventListener('resize', measure); };
  }, [orient, dims && dims.w, dims && dims.h]);

  // measure aspect → orient (standalone fallback; harness passes orient prop)
  useEffect(() => {
    if (orientProp) return; // harness is authoritative
    const el = phoneRef.current; if (!el) return;
    const read = () => {
      const w = el.clientWidth, h = el.clientHeight;
      setSelfDims({ w, h });
      setSelfOrient((prev) => (w > h * 1.05 ? 'landscape' : (h >= w ? 'portrait' : prev)));
    };
    const ro = new ResizeObserver(read);
    ro.observe(el); read();
    window.addEventListener('resize', read);
    return () => { ro.disconnect(); window.removeEventListener('resize', read); };
  }, [orientProp]);

  // master handle ↔ label-chip merge detection (playful: they melt together
  // when the level marker slides over the MASTER chip)
  useLayoutEffect(() => {
    const ctl = masterRef.current, chip = masterChipRef.current;
    if (!ctl || !chip) { return; }
    const cw = ctl.clientWidth || 1;
    const handleX = (master / 100) * cw;
    const chipRight = chip.offsetLeft + chip.offsetWidth;
    setMasterMerged(handleX <= chipRight + 4);
    // clamp the value-knob so it never gets clipped at the rail edges
    const half = 13;
    setMasterKnobX(Math.max(half, Math.min(cw - half, handleX)));
  }, [master, mode]);

  // ── FLIP re-wrap on column-count change ──────────────────────────
  const captureForFlip = useCallback(() => {
    const sc = scrollerRef.current; if (!sc) return;
    const cTop = sc.getBoundingClientRect().top;
    const rects = {};
    let anc = null;
    for (const id in cellRefs.current) {
      const el = cellRefs.current[id]; if (!el) continue;
      const r = el.getBoundingClientRect();
      rects[id] = r;
      if (!anc && r.bottom > cTop + 6) anc = { id, offset: r.top - cTop };
    }
    prevRects.current = rects;
    anchor.current = anc;
    pendingFlip.current = true;
  }, []);

  useLayoutEffect(() => {
    if (!pendingFlip.current) { prevCols.current = effectiveCols; return; }
    pendingFlip.current = false;
    const sc = scrollerRef.current; if (!sc) return;
    const cTop = sc.getBoundingClientRect().top;
    // anchor scroll so the top pad stays put
    const a = anchor.current;
    if (a && cellRefs.current[a.id]) {
      const cur = cellRefs.current[a.id].getBoundingClientRect();
      sc.scrollTop += (cur.top - cTop) - a.offset;
    }
    // FLIP
    const prev = prevRects.current || {};
    const ids = Object.keys(cellRefs.current);
    ids.forEach((id) => {
      const el = cellRefs.current[id]; const p = prev[id]; if (!el || !p) return;
      const n = el.getBoundingClientRect();
      const dx = p.left - n.left, dy = p.top - n.top;
      if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
        el.style.transition = 'none';
        el.style.transform = `translate(${dx}px,${dy}px)`;
      }
    });
    requestAnimationFrame(() => {
      ids.forEach((id) => {
        const el = cellRefs.current[id]; if (!el) return;
        el.style.transition = 'transform .42s cubic-bezier(.6,.05,.2,1)';
        el.style.transform = '';
      });
    });
    prevCols.current = effectiveCols;
  }, [effectiveCols]);

  // wrappers that capture before a config change that may move cells
  const changeCols = (next) => { captureForFlip(); next(); };
  const onPadSize = (v) => {
    const willCols = colMode === 'auto' ? autoCols(measuredW, v, gap) : effectiveCols;
    if (willCols !== effectiveCols) captureForFlip();
    setPadSize(v);
  };
  const onGap = (v) => {
    const willCols = colMode === 'auto' ? autoCols(measuredW, padSize, v) : effectiveCols;
    if (willCols !== effectiveCols) captureForFlip();
    setGap(v);
  };

  // ── mode switch (ONLY via the heading toggle) ────────────────────
  const switchMode = (next) => {
    if (next === mode) return;
    // Performance Lock blocks the mode switch — flash the lock note to say why.
    if (locked) { setLockFlash(true); setTimeout(() => setLockFlash(false), 1100); return; }
    setSelected(null); setLifted(null); setMarked(new Set()); setSelectMode(false); setSheetOpen(false); setNowOpen(false);
    const c = next === 'game' ? '#F5D57A' : '#8DD5D8';
    setSparks({ c, dir: next === 'game' ? 1 : -1, key: Date.now() });
    setTimeout(() => setSparks(null), 520);
    setMode(next);
  };

  // ── firing ───────────────────────────────────────────────────────
  const firePad = (p) => {
    setFiring((s) => { const n = new Set(s); n.add(p.id); return n; });
    setFireSeq((s) => s + 1);
    setTimeout(() => setFiring((s) => { const n = new Set(s); n.delete(p.id); return n; }), 440);
    if (p.type === 'loop' || p.type === 'playlist') {
      setHot((s) => { const n = new Set(s); n.has(p.id) ? n.delete(p.id) : n.add(p.id); return n; });
    }
  };
  const stopAll = () => { setHot(new Set()); };

  // ── arrangement helpers (with undo / redo) ───────────────────────
  const pushHistory = () => { setHistory((h) => [...h.slice(-29), pads]); setRedoStack([]); };
  const undo = () => {
    if (history.length === 0) return;
    captureForFlip();
    const prev = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setRedoStack((r) => [...r, pads]);
    setPads(prev);
    setMarked(new Set());
  };
  const redo = () => {
    if (redoStack.length === 0) return;
    captureForFlip();
    const next = redoStack[redoStack.length - 1];
    setRedoStack((r) => r.slice(0, -1));
    setHistory((h) => [...h, pads]);
    setPads(next);
    setMarked(new Set());
  };
  const toggleMark = (id) => setMarked((m) => { const n = new Set(m); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const clearMarks = () => setMarked(new Set());
  const deleteMarked = () => {
    if (marked.size === 0) return;
    pushHistory(); captureForFlip();
    setPads((arr) => arr.map((c) => (!c.gap && marked.has(c.id)) ? { id: 'gap-' + c.id + '-' + Date.now(), gap: true } : c));
    clearMarks();
  };
  const duplicateMarked = () => {
    if (marked.size === 0) return;
    pushHistory(); captureForFlip();
    setPads((arr) => {
      const out = [];
      arr.forEach((c) => {
        out.push(c);
        if (!c.gap && marked.has(c.id)) out.push({ ...c, id: 'dup-' + c.id + '-' + Date.now() + Math.random().toString(36).slice(2, 5) });
      });
      return out;
    });
    clearMarks();
  };

  // ── pad creation on empty slot (SETUP) ───────────────────────────
  const createPadAt = (idx) => {
    pushHistory();
    setPads((arr) => arr.map((c, i) => i === idx
      ? { id: 'new-' + Date.now(), type: 'single', t: 'New Pad', k: '·' } : c));
  };

  // ── gesture engine on the grid ───────────────────────────────────
  const idxOfId = (id) => pads.findIndex((p) => p.id === id);

  const cellFromPoint = (x, y) => {
    const els = document.elementsFromPoint(x, y);
    for (const el of els) {
      const cell = el.closest && el.closest('[data-cellid]');
      if (cell) return cell.getAttribute('data-cellid');
    }
    return null;
  };

  const onGridPointerDown = (e) => {
    const cell = e.target.closest && e.target.closest('[data-cellid]');
    const id = cell ? cell.getAttribute('data-cellid') : null;
    gesture.current = {
      id, x0: e.clientX, y0: e.clientY, t0: Date.now(),
      axis: null, scrolled: false, pointerId: e.pointerId,
    };
    // SETUP: arm long-hold pickup (not on gaps, not locked)
    const pad = id && pads.find((p) => p.id === id && !p.gap);
    if (mode === 'setup' && pad && !locked) {
      const rect = cell.getBoundingClientRect();
      const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
      const start = Date.now(); const DUR = 360;
      setRing({ x: cx, y: cy, pct: 0 });
      const tick = () => {
        const p = Math.min(1, (Date.now() - start) / DUR);
        setRing((r) => r ? { ...r, pct: p } : r);
        if (p < 1 && !gesture.current.scrolled) ringRaf.current = requestAnimationFrame(tick);
      };
      ringRaf.current = requestAnimationFrame(tick);
      holdTimer.current = setTimeout(() => {
        if (gesture.current.scrolled) return;
        // engage pickup (drag to move; release-in-place toggles the mark)
        gesture.current.lifted = true;
        gesture.current.didDrag = false;
        setLifted(id); setRing(null);
        if (navigator.vibrate) navigator.vibrate(12);
        try { cell.setPointerCapture(e.pointerId); } catch (_) {}
      }, DUR);
    }
  };

  const onGridPointerMove = (e) => {
    const g = gesture.current; if (!g.id && !g.lifted) {}
    const dx = e.clientX - g.x0, dy = e.clientY - g.y0;
    const dist = Math.hypot(dx, dy);

    if (g.lifted) {
      e.preventDefault();
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) g.didDrag = true;
      const el = cellRefs.current[g.id];
      if (el) el.style.transform = `translate(${dx}px,${dy}px)`;
      if (!g.didDrag) { setDropTarget(null); return; }
      const overId = cellFromPoint(e.clientX, e.clientY);
      if (overId && overId !== g.id && cellRefs.current[overId]) {
        // onto the centre = SWAP; over an edge = INSERT before/after (shift)
        const r = cellRefs.current[overId].getBoundingClientRect();
        const ratio = (e.clientX - r.left) / r.width;
        const mode = ratio < 0.28 ? 'before' : ratio > 0.72 ? 'after' : 'swap';
        setDropTarget({ id: overId, mode });
      } else setDropTarget(null);
      return;
    }

    if (dist > 9 && !g.axis) {
      g.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      g.scrolled = true;
      // cancel any armed pickup — scroll intent wins
      clearTimeout(holdTimer.current); cancelAnimationFrame(ringRaf.current); setRing(null);
      // GAME horizontal → page scenes (accelerator, never in SETUP/locked)
      if (g.axis === 'x' && mode === 'game' && !locked) {
        g.paging = true;
      }
    }
    if (g.paging) {
      e.preventDefault();
      if (dx < -14) setPageDir('r'); else if (dx > 14) setPageDir('l'); else setPageDir(null);
      g.lastDx = dx;
    }
  };

  const onGridPointerUp = (e) => {
    const g = gesture.current;
    clearTimeout(holdTimer.current); cancelAnimationFrame(ringRaf.current); setRing(null);

    if (g.lifted) {
      const el = cellRefs.current[g.id];
      if (el) { el.style.transition = 'transform .18s'; el.style.transform = ''; }
      if (!g.didDrag) {
        // released in place → in select mode, toggle this pad's mark; else no-op
        if (selectMode) toggleMark(g.id);
        setLifted(null); setDropTarget(null); gesture.current = {};
        return;
      }
      const over = dropTarget;
      if (over) {
        const groupIds = (marked.has(g.id) && marked.size > 1) ? new Set(marked) : new Set([g.id]);
        pushHistory(); captureForFlip();
        setPads((arr) => {
          const copy = arr.slice();
          // single pad onto a pad centre → SWAP (preserve original behaviour)
          if (groupIds.size === 1 && over.mode === 'swap') {
            const from = copy.findIndex((p) => p.id === g.id);
            const tIdx = copy.findIndex((p) => p.id === over.id);
            if (from < 0 || tIdx < 0) return arr;
            [copy[from], copy[tIdx]] = [copy[tIdx], copy[from]];
            return copy;
          }
          // otherwise INSERT (group-aware): pull the moving pads out, drop them
          // contiguously at the target, following entries shift along
          const moving = copy.filter((p) => groupIds.has(p.id));
          const rest = copy.filter((p) => !groupIds.has(p.id));
          let tIdx = rest.findIndex((p) => p.id === over.id);
          if (tIdx < 0) return arr; // dropped on a moving member
          if (over.mode !== 'before') tIdx += 1;
          tIdx = Math.max(0, Math.min(rest.length, tIdx));
          rest.splice(tIdx, 0, ...moving);
          return rest;
        });
        if (groupIds.size > 1) clearMarks();
      }
      setLifted(null); setDropTarget(null); gesture.current = {};
      return;
    }

    if (g.paging) {
      if (g.lastDx < -60) setScene((s) => Math.min(scenes.length - 1, s + 1));
      else if (g.lastDx > 60) setScene((s) => Math.max(0, s - 1));
      setPageDir(null); gesture.current = {}; return;
    }

    // a tap (no scroll)
    if (!g.scrolled && g.id) {
      const pad = pads.find((p) => p.id === g.id);
      if (!pad) { gesture.current = {}; return; }
      if (pad.gap) { if (mode === 'setup') createPadAt(idxOfId(g.id)); }
      else if (mode === 'game') { firePad(pad); } // lock allows firing; it only blocks paging + mode switch
      else if (selectMode) { toggleMark(g.id); } // SETUP + select mode = toggle mark
      else { // SETUP normal tap = open the Pad Editor (separate round) — placeholder
        setEditorToast(pad.t);
        clearTimeout(window.__mbEditorT); window.__mbEditorT = setTimeout(() => setEditorToast(null), 1500);
      }
    }
    gesture.current = {};
  };

  // ── derived ──────────────────────────────────────────────────────
  const hotPads = pads.filter((p) => !p.gap && hot.has(p.id));
  const gridStyle = {
    '--mb-cols': effectiveCols, '--mb-gap': gap + 'px',
    '--mb-pad-h': padSize + 'px', '--mb-label': labelSize + 'px',
  };

  return (
    <div className={`mb-phone is-${mode} is-${orient}`} ref={phoneRef}>
      {/* DEBUG · step-1 orientation read-out (temporary) */}
      <div className={`mb-orient-tag is-${orient}`} aria-hidden="true">
        <span>{orient === 'landscape' ? 'QUER' : 'HOCHKANT'}</span>
        <span style={{ color: 'var(--text-mute)' }}>{boxDims.w}×{boxDims.h}</span>
      </div>
      {/* status bar (notch spacing only) */}
      <div className="mb-statusbar" />

      {/* ── TOP BAND ── */}
      <div className="mb-band-top">
        <div className="mb-topbar">
          <button className="mb-iconbtn"><MBIcon name="menu" size={18} /></button>
          <div className="mb-modeswitch" role="tablist">
            <div className="mb-modeswitch-thumb" />
            <div className="mb-modeswitch-half h-setup" onClick={() => switchMode('setup')}>
              <MBIcon name="sliders" size={13} /> SETUP
            </div>
            <div className="mb-modeswitch-half h-game" onClick={() => switchMode('game')}>
              <MBIcon name="play" size={12} /> GAME
            </div>
          </div>
          {mode === 'setup' ? (
            <div className="mb-tool-cluster">
              <button className={`mb-iconbtn mb-tool${selectMode ? ' is-on' : ''}`}
                onClick={() => setSelectMode((s) => { if (s) clearMarks(); return !s; })} aria-label="Multi-select">
                <MBIcon name={selectMode ? 'checkbox-on' : 'checkbox'} size={16} color={selectMode ? 'var(--mode-setup)' : 'currentColor'} />
              </button>
              <button className="mb-iconbtn mb-tool" onClick={undo} disabled={history.length === 0} aria-label="Undo">
                <MBIcon name="undo" size={15} />
              </button>
              <button className="mb-iconbtn mb-tool" onClick={redo} disabled={redoStack.length === 0} aria-label="Redo">
                <MBIcon name="redo" size={15} />
              </button>
            </div>
          ) : (
            <button className="mb-iconbtn" onClick={() => { setLocked((l) => !l); setLockFlash(true); setTimeout(() => setLockFlash(false), 1100); }}
              style={{ color: locked ? 'var(--gold)' : 'var(--text-mute)' }}>
              <MBIcon name={locked ? 'lock' : 'unlock'} size={17} />
            </button>
          )}
        </div>

        {/* now playing collapsed strip — centered chevron integrated in the bar */}
        <div className="mb-nowbar" onClick={() => setNowOpen(true)} style={{ position: 'relative' }}>
          <MBLevelMeter active={hotPads.length} pulse={fireSeq} color={mode === 'setup' ? 'var(--mode-setup)' : 'var(--gold)'} />
          <span className="mb-nowbar-label">PADs active · {hotPads.length}</span>
          <span className="mb-now-scene">{scenes[scene]}</span>
          <span className="mb-now-chev" aria-label="Expand now playing"><MBIcon name={orient === 'landscape' ? 'chevR' : 'chevD'} size={13} color="var(--gold)" /></span>
        </div>
      </div>

      {/* now playing expanded overlay */}
      {nowOpen && (
        <div className="mb-now-overlay">
          <div className="mb-now-list">
            {hotPads.length === 0 && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-mute)', padding: '8px 2px' }}>// nothing playing — tap a LOOP or PLAYLIST pad in GAME.</div>}
            {hotPads.map((p) => (
              <div key={p.id} className="mb-mixrow" style={TYPE_COLORVARS(p.type)}>
                <MBIcon name={MB_TYPE_ICON[p.type]} size={12} color={`var(--pad-${p.type})`} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="mb-mixrow-t" style={{ color: `var(--pad-${p.type})` }}>{p.t}</div>
                  <div className="mb-mixrow-s">{p.type} · 0:42</div>
                </div>
                <div className="sb-slider" style={{ width: 56, height: 5 }}>
                  <div className="sb-slider-fill" style={{ width: '60%', background: `var(--pad-${p.type})` }} />
                </div>
                <button className="mb-iconbtn" style={{ width: 28, height: 28 }} onClick={() => setHot((s) => { const n = new Set(s); n.delete(p.id); return n; })}><MBIcon name="x" size={11} /></button>
              </div>
            ))}
          </div>
          {/* bottom row mirrors the collapsed bar: waveform + label + arrow together */}
          <div className="mb-nowbar mb-now-foot" onClick={() => setNowOpen(false)} style={{ position: 'relative', borderTop: '1px solid var(--border-soft)', borderBottom: 'none' }}>
            <MBLevelMeter active={hotPads.length} pulse={fireSeq} color={mode === 'setup' ? 'var(--mode-setup)' : 'var(--gold)'} />
            <span className="mb-nowbar-label">PADs active · {hotPads.length}</span>
            <span className="mb-now-scene">{scenes[scene]}</span>
            <span className="mb-now-chev" aria-label="Collapse now playing"><MBIcon name={orient === 'landscape' ? 'chevL' : 'chevU'} size={13} color="var(--gold)" /></span>
          </div>
        </div>
      )}

      {/* ── MIDDLE BAND · grid (invariant; never remounts across modes) ── */}
      <div className="mb-band-grid">
        {atmos && mode === 'game' && (
          <div className="mb-atmos">
            <div className="mb-hearth" />
            {Array.from({ length: 9 }).map((_, i) => (
              <span key={i} className="mb-ember" style={{
                left: (8 + i * 11) + '%',
                '--drift': (i % 2 ? 18 : -14) + 'px',
                animationDuration: (3.6 + (i % 4) * 0.7) + 's',
                animationDelay: (i * 0.6) + 's',
              }} />
            ))}
          </div>
        )}

        <div className={`mb-grid-scroll${lifted ? ' is-locked' : ''}`} ref={scrollerRef}
          onPointerDown={onGridPointerDown} onPointerMove={onGridPointerMove}
          onPointerUp={onGridPointerUp} onPointerCancel={onGridPointerUp}>
          <div className="mb-grid" style={gridStyle}>
            {pads.map((p, i) => {
              if (p.gap) {
                const dt = dropTarget && dropTarget.id === p.id ? dropTarget.mode : null;
                const wrapCls = 'mb-cell' + (dt === 'before' ? ' is-ins-before' : '') + (dt === 'after' ? ' is-ins-after' : '');
                return (
                  <div key={p.id} className={wrapCls} data-cellid={p.id}
                    ref={(el) => { cellRefs.current[p.id] = el; }}
                    style={{ position: 'relative', zIndex: dt ? 20 : 1 }}>
                    {mode === 'setup'
                      ? <div className={`mb-empty${dt === 'swap' ? ' mb-pad is-droptarget' : ''}`}>
                          <span className="mb-plus">+</span>ADD
                        </div>
                      : <div className="mb-empty is-empty-game" style={{ visibility: 'hidden' }} />}
                  </div>
                );
              }
              const isHot = hot.has(p.id);
              const dt = dropTarget && dropTarget.id === p.id ? dropTarget.mode : null;
              const cls = ['mb-pad'];
              if (isHot) cls.push('is-hot');
              if (firing.has(p.id)) cls.push('is-fire');
              if (marked.has(p.id)) cls.push('is-marked');
              if (lifted === p.id) cls.push('is-lifted');
              if (dt === 'swap') cls.push('is-droptarget');
              const wrapCls = 'mb-cell' + (dt === 'before' ? ' is-ins-before' : '') + (dt === 'after' ? ' is-ins-after' : '');
              return (
                <div key={p.id} className={wrapCls} data-cellid={p.id}
                  ref={(el) => { cellRefs.current[p.id] = el; }}
                  style={{ zIndex: lifted === p.id ? 30 : (dt ? 20 : 1) }}>
                  <div className={cls.join(' ')} style={TYPE_COLORVARS(p.type)}>
                    {isHot && mode === 'game' && <MBPadMeter color={`var(--pad-${p.type})`} />}
                    {isHot && mode === 'game' && <MBPadProgress color={`var(--pad-${p.type})`} dur={padDuration(p)} reps={padReps(p)} infinite={padInfinite(p)} />}
                    {marked.has(p.id) && <span className="mb-pad-mark"><MBIcon name="check" size={11} color="#04201f" /></span>}
                    <span className="mb-pad-handle"><MBIcon name="dots" size={11} color="var(--mode-setup)" /></span>
                    <div className="mb-pad-type">
                      <MBIcon name={MB_TYPE_ICON[p.type]} size={11} color={`var(--pad-${p.type})`} />
                      {p.type.toUpperCase()}
                    </div>
                    <div>
                      <div className="mb-pad-title">{p.t}</div>
                      <div className="mb-pad-meta">{mode === 'game' ? p.k : (isHot ? '● playing' : p.type)}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* scene edge peek (GAME paging) */}
        <div className={`mb-peek l${pageDir === 'l' ? ' is-on' : ''}`}>
          <MBIcon name="chevL" size={16} color="var(--gold)" />
          {scene > 0 ? scenes[scene - 1] : ''}
        </div>
        <div className={`mb-peek r${pageDir === 'r' ? ' is-on' : ''}`}>
          <MBIcon name="chevR" size={16} color="var(--gold)" />
          {scene < scenes.length - 1 ? scenes[scene + 1] : ''}
        </div>

        {/* fill-ring */}
        {ring && <FillRing x={ring.x} y={ring.y} pct={ring.pct} host={scrollerRef.current} />}

        {/* SETUP DISPLAY sheet */}
        {mode === 'setup' && (
          <DisplaySheet
            open={sheetOpen} preview={previewCtl} gripStyle={gripStyle} orient={orient}
            onClose={() => setSheetOpen(false)}
            onToggle={() => setSheetOpen((o) => !o)}
            padSize={padSize} gap={gap} colMode={colMode}
            fixedCols={clampedFixed} labelSize={labelSize}
            effectiveCols={effectiveCols} maxFixedCols={maxFixedCols}
            setPadSize={onPadSize} setGap={onGap} setLabelSize={setLabelSize}
            setColMode={(m) => changeCols(() => setColMode(m))}
            setFixedCols={(c) => changeCols(() => setFixedCols(c))}
            atmos={atmos} setAtmos={setAtmos}
            setPreview={setPreviewCtl}
          />
        )}
      </div>

      {/* ── BOTTOM BAND · thumb zone ── */}
      <div className="mb-band-bottom">
        <MBSceneStrip scenes={scenes} active={scene}
          onSelect={(i) => setScene(i)}
          onReorder={(from, to) => {
            setScenes((arr) => {
              const copy = arr.slice();
              const [m] = copy.splice(from, 1);
              copy.splice(to, 0, m);
              return copy;
            });
            // keep the active scene pointed at the same scene after reorder
            setScene((cur) => {
              if (cur === from) return to;
              let n = cur;
              if (from < cur) n -= 1;
              if (to <= n) n += 1;
              return n;
            });
          }} />

        <div className="mb-transport">
          {mode === 'game' ? (
            <div className="mb-master mb-master-ctl" ref={masterRef}
              style={{ cursor: 'ew-resize', touchAction: 'none' }}
              onPointerDown={(e) => {
                const rail = e.currentTarget;
                try { rail.setPointerCapture(e.pointerId); } catch (_) {}
                const set = (cx) => {
                  const r = rail.getBoundingClientRect();
                  let p = (cx - r.left) / r.width;
                  setMaster(Math.max(0, Math.min(100, Math.round(p * 100))));
                };
                set(e.clientX);
                rail._mv = (ev) => { ev.preventDefault(); set(ev.clientX); };
                rail.addEventListener('pointermove', rail._mv);
                rail._up = () => { rail.removeEventListener('pointermove', rail._mv); rail.removeEventListener('pointerup', rail._up); };
                rail.addEventListener('pointerup', rail._up);
              }}>
              <MBMasterMeter active={hotPads.length} pulse={fireSeq} master={master} />
              <div className="mb-master-level" style={{ width: master + '%' }} />
              <div className={`mb-master-chip${masterMerged ? ' is-merged' : ''}`} ref={masterChipRef}>
                MASTER
              </div>
              <div className={`mb-master-handle${masterMerged ? ' is-merged' : ''}`} style={{ left: master + '%' }} />
              <div className="mb-master-knob" style={{ left: masterKnobX + 'px' }}>{master}</div>
            </div>
          ) : selectMode ? (
            <div className="mb-setup-actions mb-sel-bar">
              <span className="mb-sel-count">{marked.size ? `${marked.size} SELECTED` : 'TAP PADS'}</span>
              <button className="mb-action" onClick={duplicateMarked} disabled={marked.size === 0}><MBIcon name="chain" size={13} /> DUP</button>
              <button className="mb-action is-danger" onClick={deleteMarked} disabled={marked.size === 0}><MBIcon name="x" size={13} color="var(--blood-bright)" /> DELETE</button>
              <button className="mb-action" onClick={() => { setSelectMode(false); clearMarks(); }}>DONE</button>
            </div>
          ) : (
            <div className="mb-setup-actions">
              <button className="mb-action is-accent" onClick={() => setSheetOpen(true)}>
                <MBIcon name="grid" size={14} color="var(--mode-setup)" /> DISPLAY
              </button>
              <button className="mb-action" onClick={() => {
                const firstGap = pads.findIndex((p) => p.gap);
                if (firstGap >= 0) createPadAt(firstGap);
              }}><MBIcon name="plus" size={13} /> ADD PAD</button>
            </div>
          )}
          {/* STOP ALL — on the right, under the (right-handed) thumb */}
          <button className="mb-stop" onClick={stopAll}>
            <MBIcon name="stop" size={15} color="#fff" />STOP
          </button>
        </div>
      </div>

      <div className="mb-homebar"><i /></div>

      {/* mode spark sweep */}
      {sparks && (
        <div className="mb-spark" key={sparks.key}>
          {Array.from({ length: 9 }).map((_, i) => (
            <i key={i} style={{
              '--y': (12 + i * 9) + '%', '--c': sparks.c, '--d': (i * 28) + 'ms',
              transform: sparks.dir < 0 ? 'scaleX(-1)' : 'none',
            }} />
          ))}
        </div>
      )}

      {/* lock toast */}
      <div className={`mb-lock-note${lockFlash ? ' is-on' : ''}`}>
        <MBIcon name={locked ? 'lock' : 'unlock'} size={14} color="var(--gold)" />
        {locked ? 'PERFORMANCE LOCK ON · taps fire only' : 'LOCK OFF'}
      </div>
      {/* pad-editor placeholder toast (editor is a separate round) */}
      <div className={`mb-lock-note${editorToast ? ' is-on' : ''}`} style={{ borderColor: 'var(--mode-setup)', color: 'var(--mode-setup)' }}>
        <MBIcon name="sliders" size={14} color="var(--mode-setup)" />
        PAD EDITOR · {editorToast} — separate round
      </div>
    </div>
  );
}

// fill-ring positioned relative to the scroller's host coordinate space
function FillRing({ x, y, pct }) {
  const C = 2 * Math.PI * 23;
  return (
    <svg className="mb-ring" style={{ left: x, top: y, position: 'fixed' }} viewBox="0 0 54 54">
      <circle className="bg" cx="27" cy="27" r="23" />
      <circle className="fg" cx="27" cy="27" r="23"
        strokeDasharray={C} strokeDashoffset={C * (1 - pct)}
        transform="rotate(-90 27 27)" />
    </svg>
  );
}

// Scene switcher strip — tap to select, long-hold to drag-reorder,
// horizontal swipe still scrolls the strip natively (gesture model
// mirrors the pad grid: movement before the hold completes = scroll).
function MBSceneStrip({ scenes, active, onSelect, onReorder }) {
  const tabRefs = useRef([]);
  const g = useRef({});
  const holdT = useRef(null);
  const [drag, setDrag] = useState(null); // {from, dx, ins}

  const down = (e, i) => {
    g.current = { i, x0: e.clientX, y0: e.clientY, moved: false, lifted: false, pid: e.pointerId, ins: i };
    holdT.current = setTimeout(() => {
      if (g.current.moved) return;
      g.current.lifted = true;
      try { e.target.setPointerCapture(e.pointerId); } catch (_) {}
      if (navigator.vibrate) navigator.vibrate(10);
      setDrag({ from: i, dx: 0, ins: i });
    }, 300);
  };
  const move = (e) => {
    const gg = g.current; if (gg.i == null) return;
    const dx = e.clientX - gg.x0, dy = e.clientY - gg.y0;
    if (!gg.lifted) {
      if (Math.hypot(dx, dy) > 8) { gg.moved = true; clearTimeout(holdT.current); } // let native scroll win
      return;
    }
    e.preventDefault();
    let ins = 0;
    tabRefs.current.forEach((el) => { if (el) { const r = el.getBoundingClientRect(); if (e.clientX > r.left + r.width / 2) ins += 1; } });
    gg.ins = ins;
    setDrag({ from: gg.i, dx, ins });
  };
  const up = () => {
    clearTimeout(holdT.current);
    const gg = g.current;
    if (gg.lifted) {
      let to = gg.ins; if (to > gg.i) to -= 1;
      to = Math.max(0, Math.min(scenes.length - 1, to));
      if (to !== gg.i) onReorder(gg.i, to);
    } else if (!gg.moved) {
      onSelect(gg.i);
    }
    setDrag(null); g.current = {};
  };

  return (
    <div className="mb-scenes" onPointerMove={move} onPointerUp={up} onPointerCancel={up}>
      {scenes.map((s, i) => (
        <React.Fragment key={s}>
          {drag && drag.ins === i && drag.from !== i && drag.from !== i - 1 && <i className="mb-scene-ins" />}
          <button
            ref={(el) => { tabRefs.current[i] = el; }}
            className={`mb-scene${i === active ? ' is-on' : ''}${drag && drag.from === i ? ' is-dragging' : ''}`}
            style={drag && drag.from === i ? { transform: `translateX(${drag.dx}px)` } : null}
            onPointerDown={(e) => down(e, i)}>
            {s}
          </button>
        </React.Fragment>
      ))}
      {drag && drag.ins === scenes.length && drag.from !== scenes.length - 1 && <i className="mb-scene-ins" />}
    </div>
  );
}

Object.assign(window, { MBPhoneBoard, autoCols });
