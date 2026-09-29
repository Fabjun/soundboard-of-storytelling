// v22-grid-config.jsx — A4 from the Slice-3 plan.
// DESIGN ONLY. Implementation lands in Slice 8 (Polish).
// Slice 3 ships with a fixed 4×4 default grid.
//
// Why 4×4 as the Slice-3 default (recap, full reasoning in chat):
//   1. Existing design vocabulary already uses 4×4 everywhere
//      (v15 FullBoard, v17 preview, v2 BoardV2).
//   2. Hotkey mapping is clean: F1–F12 + Q-W-E-R = 16 slots, no gaps.
//   3. Square balances orientations (desktop ≈ mobile-landscape 4×3
//      subset; mobile-portrait uses 3×4 adaptation from A1).
//   4. 16 ≈ Miller's 7±2 with row-chunking — what a GM can live-track.
//   5. Type distribution lands symmetrically: 4 single / 4 loop /
//      4 playlist / 4 combo.
//   6. Encourages scene-splitting over scene-cramming.
//
// What this artboard delivers (Slice 8 will implement):
//   · Popover anchored to a "GRID · 4×4" chip in the SETUP-mode toolbar
//   · Six size presets + custom (cols/rows steppers)
//   · "Unplaced pads" vocabulary for layout changes that drop slots
//   · Mobile bottom-sheet equivalent

// ── A preset tile · clickable grid-shape preview ─────────────────
function GridPresetTile({ cols, rows, selected, dim, label }) {
  const count = cols * rows;
  const cellSize = Math.min(7, 36 / Math.max(cols, rows));
  return (
    <div style={{
      padding: '8px 10px',
      background: selected ? 'var(--top)' : 'var(--surface)',
      border: '1px solid ' + (selected ? 'var(--gold)' : 'var(--border)'),
      borderLeft: selected ? '3px solid var(--gold)' : '1px solid var(--border)',
      cursor: 'pointer', minHeight: 44,
      display: 'flex', alignItems: 'center', gap: 10,
      opacity: dim ? 0.5 : 1,
    }}>
      {/* Mini grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
        gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
        gap: 1,
      }}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} style={{
            background: selected ? 'var(--gold)' : 'var(--text-mute)',
            opacity: selected ? 0.85 : 0.5,
          }} />
        ))}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: selected ? 'var(--gold-bright)' : 'var(--text)', letterSpacing: '.06em' }}>
          {cols} × {rows}
        </div>
        <div className="sb-mono" style={{ fontSize: 10, color: 'var(--text-mute)' }}>
          {count} slots {label && '· ' + label}
        </div>
      </div>
      {selected && (
        <span className="sb-pill is-on" style={{ fontSize: 9, padding: '1px 5px' }}>★</span>
      )}
    </div>
  );
}

// ── The popover ──────────────────────────────────────────────────
function GridConfigPopover({ presetSelected = '4x4', state = 'idle', x = 90, y = 36 }) {
  const presets = [
    { id: '3x3', cols: 3, rows: 3, label: 'focus'   },
    { id: '4x3', cols: 4, rows: 3, label: 'compact' },
    { id: '4x4', cols: 4, rows: 4, label: 'default' },
    { id: '5x4', cols: 5, rows: 4, label: 'wide'    },
    { id: '6x4', cols: 6, rows: 4, label: 'desk'    },
    { id: '6x6', cols: 6, rows: 6, label: 'studio'  },
  ];

  return (
    <div style={{
      position: 'absolute', left: x, top: y,
      width: 340,
      background: 'var(--raised)',
      border: '1px solid var(--border-strong)',
      filter: 'var(--shadow-pop)',
      padding: 'var(--space-3)',
      display: 'flex', flexDirection: 'column', gap: 'var(--space-3)',
      zIndex: 20,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <PixelIcon name="cog" size={12} color="var(--gold)" />
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--gold)', letterSpacing: '.10em' }}>
          GRID LAYOUT
        </span>
        <div style={{ flex: 1 }} />
        <span className="sb-mono" style={{ fontSize: 10, color: 'var(--text-mute)' }}>scene-scoped</span>
      </div>

      <div className="sb-mono" style={{ fontSize: 10, color: 'var(--text-mute)', lineHeight: 1.5 }}>
        Changes apply to this scene only. Other scenes keep their own layouts.
      </div>

      {/* Preset list */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
        {presets.map(p => (
          <GridPresetTile
            key={p.id}
            cols={p.cols}
            rows={p.rows}
            label={p.label}
            selected={p.id === presetSelected}
          />
        ))}
      </div>

      {/* Custom row */}
      <div style={{
        padding: 'var(--space-3)',
        background: 'var(--surface)',
        border: '1px solid var(--border-soft)',
        display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
      }}>
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--text-dim)', letterSpacing: '.10em' }}>
          CUSTOM
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button className="sb-btn sb-btn-ghost" style={{ fontSize: 11, padding: '0 6px', minHeight: 24 }}>−</button>
          <div className="sb-num" style={{ minWidth: 24, justifyContent: 'center' }}>{state === 'custom' ? '5' : '—'}</div>
          <button className="sb-btn sb-btn-ghost" style={{ fontSize: 11, padding: '0 6px', minHeight: 24 }}>+</button>
        </div>
        <span style={{ color: 'var(--text-mute)' }}>×</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <button className="sb-btn sb-btn-ghost" style={{ fontSize: 11, padding: '0 6px', minHeight: 24 }}>−</button>
          <div className="sb-num" style={{ minWidth: 24, justifyContent: 'center' }}>{state === 'custom' ? '5' : '—'}</div>
          <button className="sb-btn sb-btn-ghost" style={{ fontSize: 11, padding: '0 6px', minHeight: 24 }}>+</button>
        </div>
        <div style={{ flex: 1, textAlign: 'right' }}>
          <span className="sb-mono" style={{ fontSize: 10, color: 'var(--text-mute)' }}>
            range 2–10 × 2–8
          </span>
        </div>
      </div>

      {/* Warning · only when shrinking would unplace pads */}
      {state === 'warn' && (
        <div style={{
          padding: 'var(--space-3)',
          background: 'rgba(160,40,40,.10)',
          borderLeft: '2px solid var(--blood-bright)',
        }}>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--blood-bright)', letterSpacing: '.06em', marginBottom: 4 }}>
            3 PADS WILL MOVE TO UNPLACED
          </div>
          <div className="sb-mono" style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.5 }}>
            3 × 3 fits 9 of 12 current pads. The rest get listed under
            <code> UNPLACED</code> below the grid — drag them back when there's room.
            Audio + settings preserved.
          </div>
        </div>
      )}

      {/* Footer */}
      <div style={{ display: 'flex', gap: 4, paddingTop: 'var(--space-2)', borderTop: '1px solid var(--border-soft)' }}>
        <button className="sb-btn sb-btn-ghost" style={{ flex: 1, fontSize: 11, minHeight: 32 }}>
          CANCEL
        </button>
        <button className="sb-btn sb-btn-primary" style={{ flex: 1, fontSize: 11, minHeight: 32 }}>
          APPLY
        </button>
      </div>
    </div>
  );
}

// ── A SETUP-mode toolbar mock to anchor the popover to ───────────
function SetupToolbar({ active = false, showPopoverState }) {
  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
        padding: '6px var(--space-3)',
        background: 'var(--deep)',
        border: '1px solid var(--border)',
        height: 36,
      }}>
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--text-dim)', letterSpacing: '.10em' }}>
          BOARD · TAVERN
        </span>
        <div style={{ width: 1, height: 16, background: 'var(--border-soft)' }} />
        <span className="sb-mode-badge is-setup" style={{ fontSize: 10 }}>SETUP</span>
        <div style={{ width: 1, height: 16, background: 'var(--border-soft)' }} />
        <button className="sb-btn sb-btn-ghost" style={{ fontSize: 11, padding: '2px 8px', minHeight: 24 }}>+ ADD PAD</button>
        <div style={{ flex: 1 }} />
        {/* The chip · the anchor for the popover */}
        <div className={'sb-pill' + (active ? ' is-on' : '')} style={{
          fontSize: 10, padding: '3px 8px', cursor: 'pointer',
          color: active ? 'var(--gold-bright)' : 'var(--text-dim)',
          '--pix-border': active ? 'var(--gold)' : 'var(--border-soft)',
        }}>
          <PixelIcon name="cog" size={10} color={active ? 'var(--gold)' : 'var(--text-mute)'} />
          <span>GRID · 4×4</span>
        </div>
        <button className="sb-btn sb-btn-ghost" style={{ fontSize: 11, padding: '2px 8px', minHeight: 24 }}>LIBRARY</button>
      </div>
      {showPopoverState && (
        <GridConfigPopover x={170} y={40} state={showPopoverState.state} presetSelected={showPopoverState.preset} />
      )}
    </div>
  );
}

// ── Mobile bottom-sheet variant ───────────────────────────────────
function GridConfigBottomSheet({ state = 'idle' }) {
  const presets = [
    { id: '3x3', cols: 3, rows: 3 },
    { id: '4x3', cols: 4, rows: 3 },
    { id: '4x4', cols: 4, rows: 4 },
    { id: '5x4', cols: 5, rows: 4 },
  ];
  return (
    <div style={{
      width: 280, height: 460,
      background: 'var(--night)',
      border: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
    }}>
      {/* Mock board top */}
      <div style={{
        height: 40,
        background: 'var(--deep)',
        borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', padding: '0 10px', gap: 6,
      }}>
        <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--text)', letterSpacing: '.10em', flex: 1 }}>TAVERN</span>
        <span className="sb-mode-badge is-setup" style={{ fontSize: 9 }}>SETUP</span>
      </div>
      <div style={{
        height: 40,
        background: 'var(--deep)',
        borderBottom: '1px solid var(--border-soft)',
        display: 'flex', alignItems: 'center', padding: '0 10px', gap: 6,
      }}>
        <span className="sb-pill is-on" style={{ fontSize: 10, padding: '2px 6px' }}>GRID · 4×4</span>
        <span className="sb-pill" style={{ fontSize: 10, padding: '2px 6px' }}>+ PAD</span>
      </div>
      <div style={{ flex: 1, padding: 10, opacity: 0.35 }}>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 4,
          gridAutoRows: 36,
        }}>
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} style={{ background: 'var(--sunk)', border: '1px dashed var(--border-soft)' }} />
          ))}
        </div>
      </div>

      {/* Bottom sheet */}
      <div style={{
        background: 'var(--raised)',
        borderTop: '1px solid var(--border-strong)',
        filter: 'var(--shadow-pop)',
        padding: 10,
        display: 'flex', flexDirection: 'column', gap: 8,
      }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 32, height: 3, background: 'var(--border-strong)' }} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--gold)', letterSpacing: '.10em' }}>
            GRID LAYOUT · this scene
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
          {presets.map(p => (
            <GridPresetTile key={p.id} cols={p.cols} rows={p.rows} selected={p.id === '4x4'} />
          ))}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button className="sb-btn sb-btn-ghost" style={{ flex: 1, minHeight: 36, fontSize: 11 }}>CANCEL</button>
          <button className="sb-btn sb-btn-primary" style={{ flex: 1, minHeight: 36, fontSize: 11 }}>APPLY</button>
        </div>
      </div>
    </div>
  );
}

// ── Unplaced-pads strip · explains the vocabulary ─────────────────
function UnplacedStrip() {
  const pads = [
    { name: 'Wolf Howl',  type: 'single' },
    { name: 'Spell Cast', type: 'playlist' },
    { name: 'Door Slam',  type: 'single' },
  ];
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderLeft: '3px solid var(--gold-dim)',
      padding: 'var(--space-3)',
      display: 'flex', flexDirection: 'column', gap: 'var(--space-2)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{
          fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--gold)',
          letterSpacing: '.14em', textTransform: 'uppercase',
        }}>UNPLACED · 3</span>
        <span className="sb-mono" style={{ fontSize: 10, color: 'var(--text-mute)' }}>
          drag back into the grid · audio + settings preserved
        </span>
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {pads.map(p => (
          <div key={p.name} className="sb-pad" style={{
            minHeight: 0, width: 130, padding: '4px 6px',
            '--pad-color': `var(--pad-${p.type})`,
            '--pad-glow':  `var(--pad-${p.type}-glow)`,
            '--pix-step': '3px',
            opacity: 0.7,
            cursor: 'grab',
          }}>
            <div style={{ color: 'var(--text)', fontSize: 11, letterSpacing: '.04em' }}>{p.name}</div>
            <div style={{ color: `var(--pad-${p.type})`, fontSize: 8, marginTop: 2, letterSpacing: '.1em' }}>
              {p.type.toUpperCase()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// ARTBOARD
// ─────────────────────────────────────────────────────────────────

function GridConfigArtboard() {
  return (
    <div className="sb" style={{ padding: 28, overflow: 'auto', height: '100%' }}>

      <div style={{ marginBottom: 'var(--space-5)' }}>
        <div className="sb-display" style={{ fontSize: 20 }}>
          gridConfig Popover · design only · ships in Slice 8
        </div>
        <div className="sb-mono" style={{ fontSize: 13, marginTop: 6, lineHeight: 1.6 }}>
          // A4 from the Slice-3 plan. Slice 3 ships with a fixed <b>4 × 4</b> default; this
          popover is what makes the grid configurable in Slice 8. Designed now so the data
          model and SETUP-toolbar real estate are reserved correctly.
        </div>
      </div>

      {/* Why 4×4 callout */}
      <div style={{
        background: 'var(--raised)',
        borderLeft: '3px solid var(--gold)',
        padding: 'var(--space-4) var(--space-5)',
        marginBottom: 'var(--space-5)',
      }}>
        <div style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--gold)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 'var(--space-3)' }}>
          WHY 4 × 4 IS SLICE-3'S DEFAULT
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-3)' }}>
          {[
            ['Existing vocabulary',  'v15 FullBoard · v17 preview · v2 BoardV2 already use 4×4.'],
            ['Hotkey mapping',       'F1–F12 + Q-W-E-R = 16 keys, no gaps.'],
            ['Working-memory bound', '~Miller 7±2 with row chunking. Live-trackable.'],
            ['Type symmetry',        '4 single + 4 loop + 4 playlist + 4 combo lands clean.'],
            ['Orientation',          'Square balances desktop, mobile-landscape, mobile-portrait.'],
            ['Forces good IA',       '"One moment per scene." Bigger grids invite cramming.'],
          ].map(([t, sub]) => (
            <div key={t} style={{
              padding: 'var(--space-3)',
              background: 'var(--surface)',
              borderLeft: '2px solid var(--gold-dim)',
            }}>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--gold)', letterSpacing: '.06em', marginBottom: 4 }}>{t}</div>
              <div className="sb-mono" style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.5 }}>{sub}</div>
            </div>
          ))}
        </div>
      </div>

      <SectionLabel glyph="diamond">DESKTOP · POPOVER ANCHORED TO THE SETUP TOOLBAR</SectionLabel>
      <div className="sb-mono" style={{ fontSize: 11, color: 'var(--text-mute)', marginTop: 'var(--space-2)', marginBottom: 'var(--space-4)', lineHeight: 1.5 }}>
        // SETUP-mode only. The "GRID · 4×4" chip lives in the toolbar between SETUP-badge and
        the right-side controls. Click opens the popover anchored below the chip.
      </div>

      {/* Three popover states */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)', marginBottom: 'var(--space-6)' }}>

        <div>
          <div className="sb-mono" style={{ fontSize: 10, color: 'var(--text-mute)', letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 6 }}>
            STATE 1 · idle · current = 4×4 · click a preset to preview
          </div>
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            padding: 'var(--space-4)',
            minHeight: 460,
            position: 'relative',
          }}>
            <SetupToolbar active showPopoverState={{ preset: '4x4', state: 'idle' }} />
          </div>
        </div>

        <div>
          <div className="sb-mono" style={{ fontSize: 10, color: 'var(--blood-bright)', letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 6 }}>
            STATE 2 · shrinking · 3 pads won't fit · UNPLACED warning surfaces
          </div>
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            padding: 'var(--space-4)',
            minHeight: 540,
            position: 'relative',
          }}>
            <SetupToolbar active showPopoverState={{ preset: '3x3', state: 'warn' }} />
          </div>
        </div>

        <div>
          <div className="sb-mono" style={{ fontSize: 10, color: 'var(--gold)', letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 6 }}>
            STATE 3 · custom · cols/rows steppers active
          </div>
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            padding: 'var(--space-4)',
            minHeight: 460,
            position: 'relative',
          }}>
            <SetupToolbar active showPopoverState={{ preset: null, state: 'custom' }} />
          </div>
        </div>
      </div>

      <PixelDivider glyph="diamond" />

      <SectionLabel glyph="star">UNPLACED PADS · the vocabulary that protects user data</SectionLabel>
      <div className="sb-mono" style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 'var(--space-2)', marginBottom: 'var(--space-4)', lineHeight: 1.6 }}>
        // When the user shrinks the grid below the current pad count, the overflow pads don't
        get deleted — they move to a horizontal strip below the grid in SETUP mode. Audio,
        type, hotkey, volume, fade settings all preserve. User drags them back when there's
        room.<br/>
        // <b>Data-model consequence:</b> a Pad's grid position becomes optional. <code>position:
        &#123; col, row &#125; | null</code>. null = unplaced. Slice-3 implements the type even
        though Slice-3 always sets a real position.
      </div>
      <UnplacedStrip />

      <div style={{ height: 'var(--space-6)' }} />

      <PixelDivider glyph="diamond" />

      <SectionLabel glyph="moon">MOBILE · BOTTOM SHEET</SectionLabel>
      <div className="sb-mono" style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 'var(--space-2)', marginBottom: 'var(--space-4)', lineHeight: 1.6 }}>
        // Same component, sheet-shape variant. Tap the "GRID · 4×4" chip in the mobile
        SETUP toolbar → sheet slides up from the bottom. Custom-stepper row collapses into a
        secondary "CUSTOM…" tile that expands inline when needed (not shown — kept simple
        because the four common presets cover 95% of cases).
      </div>
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        padding: 'var(--space-5)',
        display: 'flex', gap: 'var(--space-6)',
      }}>
        <GridConfigBottomSheet />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', paddingTop: 'var(--space-3)' }}>
          <div className="sb-mono" style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.7 }}>
            <b style={{ color: 'var(--text)' }}>What's the same:</b> presets, "this scene only"
            scope, warning when shrinking, cancel/apply at the bottom.<br/><br/>
            <b style={{ color: 'var(--text)' }}>What changes:</b> the popover becomes a
            bottom-sheet (touch surface). The custom-stepper row collapses to keep the sheet
            short — long enough to expose the four common presets, not so tall it covers the
            board entirely.<br/><br/>
            <b style={{ color: 'var(--text)' }}>What's not on mobile:</b> 6×6 (36 slots) and
            the studio-grade presets. Mobile maxes at 5×4 = 20 — past that, touch targets fall
            below 44 px on a typical phone width. Desktop keeps the full range.
          </div>
        </div>
      </div>

      <div style={{ height: 'var(--space-6)' }} />

      <PixelDivider glyph="diamond" />

      {/* Slice-3 → Slice-8 handoff */}
      <SectionLabel glyph="rune">SLICE-3 → SLICE-8 HANDOFF</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginTop: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
        <div style={{
          background: 'var(--raised)',
          borderLeft: '3px solid var(--gold)',
          padding: 'var(--space-4) var(--space-5)',
        }}>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--gold)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 'var(--space-3)' }}>
            SLICE 3 LANDS
          </div>
          <div className="sb-mono" style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.7 }}>
            ▸ Hardcoded <code>gridConfig: &#123; cols: 4, rows: 4 &#125;</code> on every new
              scene.<br/>
            ▸ Pad <code>position: &#123; col, row &#125; | null</code> type exists in the data
              model. <code>null</code> reserved for unplaced (always set in Slice 3).<br/>
            ▸ No popover. No SETUP-toolbar chip yet. The 4×4 is invisible-because-fixed.<br/>
            ▸ Scene-CRUD (A3) writes the default gridConfig on create; duplicate copies it.
          </div>
        </div>
        <div style={{
          background: 'var(--raised)',
          borderLeft: '3px solid var(--pad-loop)',
          padding: 'var(--space-4) var(--space-5)',
        }}>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--pad-loop)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 'var(--space-3)' }}>
            SLICE 8 ADDS
          </div>
          <div className="sb-mono" style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.7 }}>
            ▸ The "GRID · NxM" chip in the SETUP toolbar.<br/>
            ▸ The popover (this artboard) + the bottom-sheet (mobile).<br/>
            ▸ The UNPLACED strip in SETUP mode + drag-back interaction.<br/>
            ▸ The custom (cols × rows) stepper UI with bounds (2–10 × 2–8).<br/>
            ▸ Settings → Display option for "default new-scene grid" (user pref).
          </div>
        </div>
      </div>

      <PixelDivider glyph="diamond" />

      <SectionLabel glyph="star">OPEN QUESTIONS · for Slice 8</SectionLabel>
      <div className="sb-mono" style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.7, marginTop: 'var(--space-3)' }}>
        ▸ <b>Cell-size axis</b> — should the popover also expose cell-size (compact / normal /
          spacious)? Or keep that as a Settings → Display global preference applying to every
          board? Recommendation: Settings global. Per-scene cell-size would multiply the
          variation space without much real benefit.<br/>
        ▸ <b>"Default new-scene grid" Setting</b> — does the GM-level preference override the
          4×4 hard default for new scenes? Probably yes. Then 4×4 becomes "default until you
          change it once".<br/>
        ▸ <b>Shrink-with-pads behaviour</b> — when shrinking unplaces N pads, do they keep their
          original (col, row) so they snap back if grid is enlarged again? Recommendation: yes
          — preserve the desired position even when unplaced. Pads remember where they wanted
          to live.<br/>
        ▸ <b>Mobile presets ceiling</b> — current proposal caps mobile at 5×4. Acceptable, or
          allow up to 6×4 with a tooltip "touch targets get tight"?
      </div>
    </div>
  );
}

Object.assign(window, {
  GridPresetTile, GridConfigPopover, SetupToolbar, GridConfigBottomSheet,
  UnplacedStrip, GridConfigArtboard,
});
