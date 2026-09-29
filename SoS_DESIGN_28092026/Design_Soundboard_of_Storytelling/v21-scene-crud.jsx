// v21-scene-crud.jsx — A3 from the Slice-3 plan.
//
// Scene CRUD vocabulary: rename · duplicate · reorder · delete. Plus the
// "create" flow already covered by A1 (Empty Board's + NEW SCENE button).
//
// ── Affordance strategy ──────────────────────────────────────────
// Desktop:  hover row → action chips appear inline (discoverable);
//           right-click → context menu (power-user / keyboard).
// Mobile:   long-press tab → bottom-sheet action menu. Same operations,
//           same labels, no parallel design.
//
// ── Destructive vs non-destructive ───────────────────────────────
// Non-destructive ops (rename, duplicate, reorder) complete in place.
// Destructive ops (delete) require an inline confirm — the row itself
// transforms into a "Delete 'Tavern' · 4 pads · Cancel | DELETE" prompt.
// Modal dialog avoided so the surrounding scenes stay visible.
//
// ── Open question parked for sign-off ────────────────────────────
// Deleting the LAST scene: does the user get blocked, or does the
// Board drop back to the A1 Empty-Board state? Recommendation: drop
// back. The Empty-Board state is well-designed and the user can
// always recreate. Bonus: keeps the data model legal at all times
// (a board with zero scenes is a valid state, not a degenerate one).

// ── A single scene-rail row in one of its states ──────────────────
function SceneRow({ name, padCount, selected, state, draggedOver, indent = 0 }) {
  // state: 'idle' | 'hover' | 'rename' | 'confirmDelete' | 'dragSource' | 'dragGhost'
  if (state === 'confirmDelete') {
    return (
      <div style={{
        background: 'var(--surface)',
        borderLeft: '3px solid var(--blood)',
        padding: 'var(--space-2) var(--space-3)',
        display: 'flex', flexDirection: 'column', gap: 6,
      }}>
        <div className="sb-mono" style={{ fontSize: 11, color: 'var(--blood-bright)', lineHeight: 1.5 }}>
          Delete <b style={{ color: 'var(--text)' }}>"{name}"</b>?<br/>
          <span style={{ color: 'var(--text-mute)' }}>{padCount} pads will be removed.</span>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button className="sb-btn sb-btn-ghost" style={{ fontSize: 10, padding: '2px 8px', flex: 1, minHeight: 28 }}>
            CANCEL
          </button>
          <button className="sb-btn sb-btn-danger" style={{ fontSize: 10, padding: '2px 8px', flex: 1, minHeight: 28, color: 'var(--blood-bright)' }}>
            DELETE
          </button>
        </div>
      </div>
    );
  }

  if (state === 'rename') {
    return (
      <div style={{
        padding: '4px 10px',
        background: 'var(--top)',
        borderLeft: '2px solid var(--gold)',
        display: 'flex', alignItems: 'center', minHeight: 36,
      }}>
        <input
          defaultValue={name}
          style={{
            flex: 1,
            background: 'var(--sunk)',
            border: '1px solid var(--gold)',
            padding: '4px 6px',
            fontFamily: 'var(--font-ui)', fontSize: 14,
            color: 'var(--gold-bright)',
            outline: 'none',
            letterSpacing: '.04em',
          }}
        />
      </div>
    );
  }

  const isDragGhost = state === 'dragGhost';
  const isDragSource = state === 'dragSource';

  return (
    <div style={{
      padding: '7px 10px',
      paddingLeft: 10 + indent,
      background:
        selected ? 'var(--top)'
        : state === 'hover' ? 'var(--raised)'
        : isDragGhost ? 'var(--top)'
        : 'transparent',
      borderLeft:
        selected ? '2px solid var(--gold)'
        : isDragGhost ? '2px solid var(--gold)'
        : '2px solid transparent',
      borderTop: draggedOver === 'above' ? '2px solid var(--gold-bright)' : '2px solid transparent',
      borderBottom: draggedOver === 'below' ? '2px solid var(--gold-bright)' : '2px solid transparent',
      fontFamily: 'var(--font-ui)', fontSize: 14,
      color: selected ? 'var(--gold)' : 'var(--text-dim)',
      cursor: 'pointer',
      display: 'flex', alignItems: 'center', gap: 6, minHeight: 36,
      opacity: isDragSource ? 0.4 : 1,
      filter: isDragGhost ? 'var(--shadow-pop)' : 'none',
      position: isDragGhost ? 'relative' : 'static',
      zIndex: isDragGhost ? 10 : 'auto',
    }}>
      {/* Drag handle — hover-revealed */}
      {(state === 'hover' || isDragGhost) && (
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 10,
          color: 'var(--text-mute)', cursor: 'grab', userSelect: 'none',
          letterSpacing: '-2px',
        }}>⋮⋮</span>
      )}
      <span style={{ flex: 1 }}>{name}</span>
      <span className="sb-mono" style={{ fontSize: 10, color: 'var(--text-mute)' }}>
        {padCount}
      </span>
      {/* Hover action chips */}
      {state === 'hover' && (
        <div style={{ display: 'flex', gap: 3, marginLeft: 4 }}>
          {['RENAME', 'COPY', '×'].map((a, i) => (
            <button
              key={a}
              className="sb-btn sb-btn-ghost"
              style={{
                fontSize: 9, padding: '1px 5px', minHeight: 22,
                color: i === 2 ? 'var(--blood-bright)' : 'var(--text-dim)',
                '--pix-step': '2px',
              }}>{a}</button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Right-click context menu (desktop) ────────────────────────────
function ContextMenu({ x, y }) {
  const items = [
    { label: 'Rename',         kbd: 'F2'        },
    { label: 'Duplicate',      kbd: '⌘D'        },
    { label: 'Move up',        kbd: '⌥↑'        },
    { label: 'Move down',      kbd: '⌥↓'        },
    { sep: true },
    { label: 'Delete…',        kbd: '⌫', danger: true },
  ];
  return (
    <div style={{
      position: 'absolute', left: x, top: y,
      width: 200,
      background: 'var(--raised)',
      border: '1px solid var(--border-strong)',
      filter: 'var(--shadow-pop)',
      padding: 4,
      zIndex: 20,
    }}>
      {items.map((it, i) => it.sep
        ? <div key={i} style={{ height: 1, background: 'var(--border-soft)', margin: '4px 0' }} />
        : (
          <div key={i} style={{
            padding: '5px 10px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            fontFamily: 'var(--font-ui)', fontSize: 12, letterSpacing: '.04em',
            color: it.danger ? 'var(--blood-bright)' : 'var(--text)',
            cursor: 'pointer', minHeight: 28,
          }}>
            <span>{it.label}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-mute)' }}>
              {it.kbd}
            </span>
          </div>
        )
      )}
    </div>
  );
}

// ── Mini scene rail used in every flow frame ──────────────────────
function SceneRailMini({ rows, height = 220, contextMenu, label }) {
  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        width: 220,
        height,
        background: 'var(--deep)',
        border: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column',
      }}>
        <div className="sb-panel-header is-active" style={{ fontSize: 11 }}>
          <PixelIcon name="moon" size={12} color="var(--gold)" />
          <span>SCENES</span>
          <span className="sb-chev" style={{ fontSize: 10, color: 'var(--text-mute)' }}>{rows.length}</span>
        </div>
        <div style={{ padding: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {rows.map((r, i) => <SceneRow key={i} {...r} />)}
        </div>
      </div>
      {contextMenu && <ContextMenu x={contextMenu.x} y={contextMenu.y} />}
      {label && (
        <div className="sb-mono" style={{
          position: 'absolute', top: -22, left: 0,
          fontSize: 10, color: 'var(--text-mute)', letterSpacing: '.14em', textTransform: 'uppercase',
        }}>{label}</div>
      )}
    </div>
  );
}

// ── Operation frame: stacked title + side-by-side rails ─────────
function OpFrame({ no, title, sub, accent, frames }) {
  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderLeft: `3px solid ${accent}`,
      padding: 'var(--space-4)',
      display: 'flex', flexDirection: 'column', gap: 'var(--space-3)',
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-mute)', letterSpacing: '.14em' }}>
            OP {no}
          </span>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 14, color: 'var(--text)', letterSpacing: '.06em', textTransform: 'uppercase' }}>
            {title}
          </span>
        </div>
        <div className="sb-mono" style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 4, lineHeight: 1.5 }}>
          {sub}
        </div>
      </div>
      <div style={{ display: 'flex', gap: 'var(--space-5)', flexWrap: 'wrap', paddingTop: 'var(--space-3)' }}>
        {frames.map((f, i) => (
          <div key={i}>{f}</div>
        ))}
      </div>
    </div>
  );
}

// ── Mobile phone with scene tabs at top + long-press action sheet ─
function MobileScenePhone({ stage }) {
  const tabs = ['Approach', 'Tavern', 'Combat'];
  const longPressed = 1;
  return (
    <div style={{
      width: 280, height: 540,
      background: 'var(--night)',
      border: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Compact top */}
      <div style={{
        height: 40,
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '0 10px',
        background: 'var(--deep)',
        borderBottom: '1px solid var(--border)',
      }}>
        <span style={{ width: 16, height: 14, borderLeft: '2px solid var(--text-dim)', borderTop: '2px solid var(--text-dim)' }} />
        <span style={{ flex: 1, fontFamily: 'var(--font-ui)', fontSize: 12, color: 'var(--text)', letterSpacing: '.10em' }}>BOARD</span>
        <span className="sb-mode-badge is-setup" style={{ fontSize: 9 }}>SETUP</span>
      </div>

      {/* Scene tabs */}
      <div style={{
        height: 44,
        display: 'flex', alignItems: 'center', gap: 4,
        padding: '0 10px',
        background: 'var(--deep)',
        borderBottom: '1px solid var(--border-soft)',
        overflowX: 'auto',
      }}>
        {tabs.map((t, i) => {
          const isPressed = i === longPressed && (stage === 'press' || stage === 'sheet');
          return (
            <div key={t} style={{
              padding: '6px 12px', minHeight: 32,
              background:
                i === 1 && stage === 'idle' ? 'var(--top)'
                : isPressed ? 'var(--top)'
                : 'transparent',
              borderBottom:
                i === 1 ? '2px solid var(--gold)'
                : '2px solid transparent',
              fontFamily: 'var(--font-ui)', fontSize: 13,
              color: i === 1 || isPressed ? 'var(--gold)' : 'var(--text-dim)',
              letterSpacing: '.06em',
              flexShrink: 0,
              display: 'flex', alignItems: 'center',
              filter: isPressed ? 'drop-shadow(0 0 6px var(--gold-bright))' : 'none',
              outline: isPressed ? '2px solid var(--gold)' : 'none',
              outlineOffset: 2,
            }}>{t}</div>
          );
        })}
      </div>

      {/* Body — mock board */}
      <div style={{ flex: 1, padding: 10, background: 'var(--night)', position: 'relative', opacity: stage === 'sheet' ? 0.35 : 1 }}>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6,
          gridAutoRows: 50,
        }}>
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} style={{
              background: 'var(--sunk)', border: '1px dashed var(--border-soft)', opacity: 0.5,
            }} />
          ))}
        </div>
      </div>

      {/* Press indicator overlay */}
      {stage === 'press' && (
        <div style={{
          position: 'absolute', top: 56, left: 76,
          width: 84, height: 32,
          border: '2px solid var(--gold-bright)',
          background: 'rgba(245,213,122,.12)',
          pointerEvents: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--gold)', letterSpacing: '.10em' }}>HOLD</span>
        </div>
      )}

      {/* Action sheet */}
      {stage === 'sheet' && (
        <div style={{
          position: 'absolute', left: 0, right: 0, bottom: 0,
          background: 'var(--raised)',
          borderTop: '1px solid var(--border-strong)',
          filter: 'var(--shadow-pop)',
          padding: 10,
          zIndex: 5,
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
            <div style={{ width: 32, height: 3, background: 'var(--border-strong)' }} />
          </div>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 11, color: 'var(--gold)', letterSpacing: '.10em', marginBottom: 8, textAlign: 'center' }}>
            SCENE · TAVERN · 4 PADS
          </div>
          {[
            { label: 'Rename',    kbd: '' },
            { label: 'Duplicate', kbd: '' },
            { label: 'Move up',   kbd: '' },
            { label: 'Move down', kbd: '' },
            { sep: true },
            { label: 'Delete',    kbd: '', danger: true },
          ].map((it, i) => it.sep
            ? <div key={i} style={{ height: 1, background: 'var(--border-soft)', margin: '6px 0' }} />
            : (
              <div key={i} style={{
                padding: '10px 10px', minHeight: 44,
                background: 'var(--surface)',
                border: '1px solid var(--border-soft)',
                fontFamily: 'var(--font-ui)', fontSize: 13,
                color: it.danger ? 'var(--blood-bright)' : 'var(--text)',
                letterSpacing: '.06em',
                marginBottom: 4,
                display: 'flex', alignItems: 'center',
              }}>{it.label}</div>
            )
          )}
          <button className="sb-btn sb-btn-ghost" style={{ width: '100%', marginTop: 8, minHeight: 36, fontSize: 12 }}>
            CANCEL
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// ARTBOARD
// ─────────────────────────────────────────────────────────────────

function SceneCrudArtboard() {
  // Base scene set used in every desktop frame
  const baseScenes = [
    { name: 'The Approach',    padCount: 6 },
    { name: 'The Tavern',      padCount: 4 },
    { name: 'Combat — Forest', padCount: 12 },
    { name: 'Boss · Necro',    padCount: 8 },
  ];
  const sel = (i) => baseScenes.map((s, idx) => ({ ...s, selected: idx === i }));

  return (
    <div className="sb" style={{ padding: 28, overflow: 'auto', height: '100%' }}>

      <div style={{ marginBottom: 'var(--space-5)' }}>
        <div className="sb-display" style={{ fontSize: 20 }}>
          Scene CRUD · rename · duplicate · reorder · delete
        </div>
        <div className="sb-mono" style={{ fontSize: 13, marginTop: 6, lineHeight: 1.6 }}>
          // A3 from the Slice-3 plan. Desktop hover-icons + right-click; mobile long-press →
          bottom sheet. Destructive ops use inline confirms instead of modals so the surrounding
          scenes stay visible.
        </div>
      </div>

      {/* ── Affordance discovery row ─────────────────────────────── */}
      <SectionLabel glyph="diamond">DESKTOP · AFFORDANCE DISCOVERY</SectionLabel>
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderLeft: '3px solid var(--gold-dim)',
        padding: 'var(--space-4)',
        display: 'flex', flexDirection: 'column', gap: 'var(--space-3)',
        marginTop: 'var(--space-3)',
        marginBottom: 'var(--space-5)',
      }}>
        <div className="sb-mono" style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.5 }}>
          Two parallel paths: hover-revealed inline chips (discoverable) + right-click menu
          (power-user / keyboard).
        </div>
        <div style={{ display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap', paddingTop: 'var(--space-4)' }}>
          <SceneRailMini
            label="IDLE · row at rest"
            rows={sel(1)}
          />
          <SceneRailMini
            label="HOVER · inline action chips"
            rows={sel(1).map((s, i) => i === 2 ? { ...s, state: 'hover' } : s)}
          />
          <SceneRailMini
            label="RIGHT-CLICK · full menu"
            rows={sel(1)}
            contextMenu={{ x: 110, y: 92 }}
            height={260}
          />
        </div>
      </div>

      {/* ── RENAME ───────────────────────────────────────────────── */}
      <OpFrame
        no="1"
        title="Rename"
        sub="Double-click row · F2 · or right-click → Rename. Inline edit; Enter commits, Esc cancels."
        accent="var(--gold)"
        frames={[
          <SceneRailMini label="trigger" rows={sel(1).map((s, i) => i === 2 ? { ...s, state: 'hover' } : s)} />,
          <SceneRailMini label="editing" rows={sel(1).map((s, i) => i === 2 ? { ...s, state: 'rename', name: 'Combat — Forest' } : s)} />,
          <SceneRailMini label="committed" rows={[
            { name: 'The Approach',     padCount: 6,  selected: false },
            { name: 'The Tavern',       padCount: 4,  selected: true  },
            { name: 'Forest Skirmish',  padCount: 12, selected: false },
            { name: 'Boss · Necro',     padCount: 8,  selected: false },
          ]} />,
        ]}
      />
      <div style={{ height: 'var(--space-3)' }} />

      {/* ── DUPLICATE ────────────────────────────────────────────── */}
      <OpFrame
        no="2"
        title="Duplicate"
        sub="Copies all pads + gridConfig. New scene lands directly below source. Auto-name suffix · 2 / · 3 / etc. Selected after creation."
        accent="var(--pad-loop)"
        frames={[
          <SceneRailMini label="source · context menu" rows={sel(1)} contextMenu={{ x: 110, y: 92 }} height={260} />,
          <SceneRailMini label="result" rows={[
            { name: 'The Approach',     padCount: 6,  selected: false },
            { name: 'The Tavern',       padCount: 4,  selected: false },
            { name: 'The Tavern · 2',   padCount: 4,  selected: true  },
            { name: 'Combat — Forest',  padCount: 12, selected: false },
            { name: 'Boss · Necro',     padCount: 8,  selected: false },
          ]} />,
        ]}
      />
      <div className="sb-mono" style={{ fontSize: 11, color: 'var(--text-mute)', lineHeight: 1.5, padding: '0 0 var(--space-4)' }}>
        // Note · pads reference LibraryItem by ID — audio files are NOT copied, only the pad
        wrappers. Hotkeys carry over; conflict-resolver from DESIGN_NOTES handles collisions.
      </div>

      {/* ── REORDER ──────────────────────────────────────────────── */}
      <OpFrame
        no="3"
        title="Reorder"
        sub="Drag handle becomes visible on hover. Drop indicator is a bright 2-px line between rows; row at source goes 40% transparent during drag."
        accent="var(--pad-playlist)"
        frames={[
          <SceneRailMini label="hover · drag handle ⋮⋮" rows={sel(1).map((s, i) => i === 2 ? { ...s, state: 'hover' } : s)} />,
          <SceneRailMini label="dragging · drop above target" rows={[
            { name: 'The Approach',    padCount: 6,  selected: false },
            { name: 'The Tavern',      padCount: 4,  selected: true, draggedOver: 'above' },
            { name: 'Combat — Forest', padCount: 12, selected: false, state: 'dragGhost', indent: 4 },
            { name: 'Boss · Necro',    padCount: 8,  selected: false },
          ]} />,
          <SceneRailMini label="dropped" rows={[
            { name: 'The Approach',     padCount: 6,  selected: false },
            { name: 'Combat — Forest',  padCount: 12, selected: false },
            { name: 'The Tavern',       padCount: 4,  selected: true  },
            { name: 'Boss · Necro',     padCount: 8,  selected: false },
          ]} />,
        ]}
      />
      <div className="sb-mono" style={{ fontSize: 11, color: 'var(--text-mute)', lineHeight: 1.5, padding: '0 0 var(--space-4)' }}>
        // Keyboard equivalent · ⌥↑ / ⌥↓ moves the selected scene. Mirrors macOS Sidebar convention.
      </div>

      {/* ── DELETE ───────────────────────────────────────────────── */}
      <OpFrame
        no="4"
        title="Delete"
        sub="Inline confirm replaces the row — surrounding scenes stay visible. Shows pad count to surface the cost. Cannot be triggered without an explicit second click on DELETE."
        accent="var(--blood-bright)"
        frames={[
          <SceneRailMini label="trigger × on hover" rows={sel(1).map((s, i) => i === 2 ? { ...s, state: 'hover' } : s)} />,
          <SceneRailMini label="inline confirm" rows={sel(1).map((s, i) => i === 2 ? { ...s, state: 'confirmDelete' } : s)} height={260} />,
          <SceneRailMini label="deleted" rows={[
            { name: 'The Approach', padCount: 6, selected: false },
            { name: 'The Tavern',   padCount: 4, selected: true  },
            { name: 'Boss · Necro', padCount: 8, selected: false },
          ]} />,
        ]}
      />
      <div className="sb-mono" style={{ fontSize: 11, color: 'var(--text-mute)', lineHeight: 1.5, padding: '0 0 var(--space-4)' }}>
        // Toast on success · "Deleted 'Combat — Forest' · 12 pads · UNDO" pinned to status bar
        for ~6 s. Undo restores both the scene and all its pads (one transaction).
      </div>

      <PixelDivider glyph="diamond" />

      {/* ── MOBILE ───────────────────────────────────────────────── */}
      <SectionLabel glyph="moon">MOBILE · LONG-PRESS → BOTTOM SHEET</SectionLabel>
      <div className="sb-mono" style={{ fontSize: 12, color: 'var(--text-dim)', marginTop: 'var(--space-2)', marginBottom: 'var(--space-4)', lineHeight: 1.6 }}>
        // No hover state on touch. Right-click doesn't exist. Long-press is the universal
        "give me actions" gesture iOS and Android both teach. Same operations, same labels —
        the only thing that changes is the surface.
      </div>
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        padding: 'var(--space-5)',
        display: 'flex', gap: 'var(--space-6)', flexWrap: 'wrap',
        justifyContent: 'flex-start',
        marginBottom: 'var(--space-5)',
      }}>
        <div>
          <div className="sb-mono" style={{ fontSize: 10, color: 'var(--text-mute)', letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 6 }}>
            STAGE 1 · IDLE
          </div>
          <MobileScenePhone stage="idle" />
        </div>
        <div>
          <div className="sb-mono" style={{ fontSize: 10, color: 'var(--gold)', letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 6 }}>
            STAGE 2 · LONG-PRESS · 350 ms
          </div>
          <MobileScenePhone stage="press" />
        </div>
        <div>
          <div className="sb-mono" style={{ fontSize: 10, color: 'var(--gold-bright)', letterSpacing: '.14em', textTransform: 'uppercase', marginBottom: 6 }}>
            STAGE 3 · ACTION SHEET
          </div>
          <MobileScenePhone stage="sheet" />
        </div>
      </div>

      <PixelDivider glyph="diamond" />

      {/* ── DESIGN NOTES & OPEN QUESTIONS ────────────────────────── */}
      <SectionLabel glyph="star">DESIGN NOTES & OPEN QUESTIONS</SectionLabel>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginTop: 'var(--space-3)' }}>

        <div style={{
          background: 'var(--raised)',
          borderLeft: '3px solid var(--gold)',
          padding: 'var(--space-4) var(--space-5)',
        }}>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--gold)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 'var(--space-3)' }}>
            DESIGN DECISIONS BAKED IN
          </div>
          <div className="sb-mono" style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.7 }}>
            ▸ <b>Inline confirm</b> for delete, not modal. Keeps surrounding scenes visible — the
              user sees what stays in addition to what goes.<br/>
            ▸ <b>Pad-count exposed</b> in delete confirm. The cost of the operation should be
              quantified at the decision point.<br/>
            ▸ <b>Drag visuals</b> follow desktop conventions: drag handle on hover, 40% source
              opacity, 2-px gold drop indicator. Mirrors Finder / Sidebar behaviour.<br/>
            ▸ <b>Auto-name suffix</b> for duplicate uses " · 2", " · 3" — sortable, readable,
              consistent across tools.<br/>
            ▸ <b>Action chips on hover</b> use the V3 hierarchy (RENAME / COPY / ×) — short
              VT323 labels, not icons. Icons add ambiguity at the inline scale; labels read fast.<br/>
            ▸ <b>UNDO toast</b> pins to the status bar for ~6 s after delete. One transaction
              restores scene + all pads.
          </div>
        </div>

        <div style={{
          background: 'var(--raised)',
          borderLeft: '3px solid var(--pad-playlist)',
          padding: 'var(--space-4) var(--space-5)',
        }}>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 13, color: 'var(--pad-playlist)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 'var(--space-3)' }}>
            OPEN QUESTIONS · for your sign-off
          </div>
          <div className="sb-mono" style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.7 }}>
            ▸ <b>Deleting the last scene</b> — recommendation: drop the Board back to the A1
              Empty-Board state. Alternative: block the delete with "Cannot delete the last
              scene." Recommendation is cleaner — keeps the data model legal (0 scenes is a
              valid Board state) and the Empty-Board UI is already good.<br/>
            ▸ <b>Rename name conflicts</b> — recommendation: allow duplicate names (scenes are
              referenced by ID, not name; names are display-only). Alternative: enforce unique
              names. Strict-unique adds friction without benefit.<br/>
            ▸ <b>Hotkey conflicts on Duplicate</b> — pads carry hotkeys, duplicated pads
              duplicate hotkeys, creating intra-board conflicts. Resolve via the inline-conflict
              UI from DESIGN_NOTES "PAD Editor → Inline conflict feedback". Confirm: Slice 3 or
              defer to Slice 4 alongside the hotkey-capture flow?<br/>
            ▸ <b>Mobile reorder</b> — long-press → "Move up / Move down" buttons in the sheet
              (one-step at a time). Drag-to-reorder on touch is fiddly; stepwise is reliable.
              Acceptable as the only mobile reorder method, or also expose a "Reorder mode" that
              shows handles on every tab?<br/>
            ▸ <b>Right-click on mobile</b> — long-press doubles as both "select" and "open
              menu". V3 distinguishes: short tap = select, ≥350 ms hold = menu. Threshold
              configurable? Or fixed?
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  SceneRow, ContextMenu, SceneRailMini, OpFrame, MobileScenePhone, SceneCrudArtboard,
});
