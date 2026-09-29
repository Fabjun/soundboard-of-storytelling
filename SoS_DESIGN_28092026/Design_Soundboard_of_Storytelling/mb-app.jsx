// mb-app.jsx — page composition + mount.
const { useState: useApp } = React;

// NEW (Axis-1 work): the file is now ONE responsive app inside the size
// harness. The old Round-1 presentation page is preserved below as
// MBAppLegacy (no longer rendered) so nothing is lost.
function MBApp() {
  return <MBHarness />;
}

function MBAppLegacy() {
  const [live, setLive] = useApp('A');
  return (
    <div className="mb-page">
      <div className="mb-page-head">
        <div className="mb-kicker">Mobile Board · Round 1 · clickable concept</div>
        <div className="mb-h1">GAME + SETUP — one surface, two modes</div>
        <div className="mb-sub">
          A design-communication prototype (not the implementation). The pad grid is the invariant — it keeps its scroll
          position and geometry across the mode flip. Everything is built from the existing soundboard vocabulary:
          warm gold on cold violet, stepped pixel-frames, the colored type-spine, and the multi-cue mode system.
        </div>
      </div>

      <div className="mb-hero">
        <div className="mb-device">
          <div className="mb-notch" />
          <div className="mb-device-screen"><MBPhoneBoard gripStyle={live} /></div>
        </div>

        <div className="mb-legend">
          <div className="mb-legend-card">
            <h4>Try — GAME (gold)</h4>
            <ul>
              <li><b>Tap</b> a pad to fire it (LOOP/PLAYLIST latch — watch PADs active).</li>
              <li><b>Swipe up/down</b> to scroll the ~64-pad scene.</li>
              <li><b>Swipe left/right</b> to page scenes — an accelerator, with an edge-peek. The scene tabs are the primary path.</li>
              <li><b>STOP</b> kills everything; it's the one oversized, always-reachable target.</li>
              <li>Toggle the <span className="mb-kbd">lock</span> (top-right) for Performance Lock — taps fire only, no accidental paging/mode change.</li>
            </ul>
          </div>
          <div className="mb-legend-card is-teal">
            <h4>Try — SETUP (teal)</h4>
            <ul>
              <li>Tap the <b>SETUP/GAME heading</b> to switch mode — the <i>only</i> way to switch (never a swipe).</li>
              <li><b>Long-press</b> a pad: a fill-ring completes, the pad lifts, then drag — onto another pad's centre to <b>swap</b>, or between two pads to <b>insert</b> (the rest shift along, gaps kept). Start moving early and it scrolls instead — the ring never completes.</li>
              <li>Tap a <span className="mb-kbd">+ ADD</span> empty slot to create a pad (gaps are first-class, visible cells here; just empty space in GAME).</li>
              <li>Open <b>DISPLAY</b> (the summon arrow or button): drag PAD SIZE / GAP / LABEL and the sheet collapses to a strip so the grid is visible while you tune; columns re-wrap with a FLIP that keeps the top pad put. The panel's <b>arrow grip does both</b> — tap to close, drag to resize the sheet.</li>
              <li><b>AUTO</b> columns is the default; <b>FIXED</b> is the opt-in.</li>
            </ul>
          </div>
          <div className="mb-legend-card">
            <h4>Mode is read without colour</h4>
            <ul>
              <li><b>GAME</b> pads = solid, raised, depth-shadowed (performable).</li>
              <li><b>SETUP</b> pads = dashed face + drag handle (arrangeable).</li>
              <li>Plus the gold↔teal accent and the bottom-band swap. <b>Atmosphere</b> (embers/hearth) is a provisional layer — toggle it in DISPLAY; the mode read never depends on it.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mb-section-label">The summon grip — three options to choose from</div>
      <GripComparison live={live} setLive={setLive} />

      <div className="mb-section-label">Tablet — the dock edge rotates to a side-rail</div>
      <div className="mb-section-note">Phones-first, scaling up. Shown as a single second frame (static), not a second prototype: the bottom-sheet becomes a vertical side-rail, the grip moves to the vertical seam, and the grid cells grow.</div>
      <TabletFrame gripStyle={live} />

      <div style={{ height: 40 }} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<MBApp />);
