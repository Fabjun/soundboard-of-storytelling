// v5-settings.jsx — Settings · faithful + refined-with-submenus
// The current Settings is one long vertical scroll. The refined version
// splits it into 6 grouped sub-menus on a left rail, with one section's
// content shown on the right — matching pro-tool conventions
// (Lightroom Preferences, Premiere Settings, Resolve Preferences).

// ── Reusable settings primitives ─────────────────────────────────
function SettingsBigToggle({ options, active }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${options.length}, 1fr)`, gap: 14 }}>
      {options.map((o) => (
        <div key={o} style={{
          padding: '12px 0',
          textAlign: 'center',
          fontFamily: 'var(--font-ui)', fontSize: 18,
          letterSpacing: '.14em',
          color: o === active ? 'var(--mode-setup)' : 'var(--text-mute)',
          border: '1px solid ' + (o === active ? 'var(--mode-setup)' : 'var(--border)'),
          background: o === active ? 'rgba(109,181,184,.08)' : 'transparent',
          cursor: 'pointer',
        }}>{o}</div>
      ))}
    </div>
  );
}

function SettingsBlock({ label, children, desc, divider = true }) {
  return (
    <>
      <div style={{
        fontFamily: 'var(--font-ui)', fontSize: 13,
        color: 'var(--gold)', letterSpacing: '.16em',
        marginBottom: 12,
      }}>{label}</div>
      {children}
      {desc && (
        <div style={{
          fontFamily: 'var(--font-mono)', fontSize: 13,
          color: 'var(--text-dim)', marginTop: 12,
          lineHeight: 1.5,
        }}>{desc}</div>
      )}
      {divider && <div style={{ height: 1, background: 'var(--border-soft)', margin: '28px 0' }} />}
    </>
  );
}

// ═════════════════════════════════════════════════════════════════
// SETTINGS · FAITHFUL REBUILD (one long scroll, as it exists today)
// ═════════════════════════════════════════════════════════════════
function SettingsActual() {
  return (
    <div className="sb" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Top bar matches the actual screenshot */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr auto 1fr',
        alignItems: 'center', gap: 12, padding: '10px 16px',
        background: 'var(--night)', borderBottom: '1px solid var(--gold-dim)',
      }}>
        <div style={{
          padding: '5px 14px', border: '1px solid var(--gold)',
          color: 'var(--gold)', fontFamily: 'var(--font-ui)', fontSize: 14,
          letterSpacing: '.1em', width: 'fit-content',
        }}>MENU</div>
        <div style={{
          fontFamily: 'var(--font-ui)', fontSize: 20,
          color: 'var(--gold)', letterSpacing: '.14em', textAlign: 'center',
        }}>SETTINGS</div>
        <div style={{ display: 'flex', gap: 10, color: 'var(--gold)', justifyContent: 'flex-end' }}>
          <div style={{ border: '1px solid var(--gold-dim)', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-ui)', fontSize: 14 }}>?</div>
          <div style={{ border: '1px solid var(--gold-dim)', width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M1 4V1h3M11 4V1H8M1 8v3h3M11 8v3H8"/></svg>
          </div>
        </div>
      </div>

      <main style={{
        flex: 1, overflow: 'auto',
        padding: '30px 0', display: 'flex', justifyContent: 'center',
        background: 'var(--night)',
      }}>
        <div style={{ width: '100%', maxWidth: 880, padding: '0 24px' }}>
          {/* Key Test action card */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 18,
            padding: 22,
            border: '1px solid var(--border)',
            background: 'var(--surface)',
            marginBottom: 30,
          }}>
            <PixelIcon name="keyboard" size={36} color="var(--gold)" />
            <div>
              <div style={{ fontFamily: 'var(--font-ui)', fontSize: 22, color: 'var(--gold)', letterSpacing: '.06em' }}>KEY TEST</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontStyle: 'italic', fontSize: 14, color: 'var(--text-dim)', marginTop: 4 }}>Identify numpad key codes</div>
            </div>
          </div>

          <div style={{
            textAlign: 'center',
            fontFamily: 'var(--font-ui)', fontSize: 16,
            color: 'var(--gold)', letterSpacing: '.16em',
            marginBottom: 22,
          }}>CONTROLS</div>

          <SettingsBlock label="START MODE" desc="Start mode — SETUP always opens in SETUP mode · GAME opens directly in GAME mode · LAST remembers the last used mode.">
            <SettingsBigToggle options={['SETUP', 'GAME', 'LAST']} active="SETUP" />
          </SettingsBlock>

          <SettingsBlock label="ENTER KEY STOP" desc="Enter key stop mode — SERIAL stops only the most recently activated sound per press (LIFO) · TOTAL stops all sounds at once.">
            <SettingsBigToggle options={['SERIAL', 'TOTAL']} active="SERIAL" />
          </SettingsBlock>

          <SettingsBlock label="SWITCH SOUND">
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                padding: '8px 18px',
                border: '1px solid var(--mode-setup)',
                color: 'var(--mode-setup)',
                fontFamily: 'var(--font-ui)', fontSize: 14, letterSpacing: '.12em',
              }}>UPLOAD</div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 14, color: 'var(--text-dim)' }}>no file</span>
            </div>
          </SettingsBlock>

          <SettingsBlock label="SCREEN WAKE LOCK" desc="Prevents the screen from auto-locking in GAME mode — keeps the display on so a Bluetooth numpad keeps working. Does not override a manual screen-off (side button).">
            <SettingsBigToggle options={['ON', 'OFF']} active="ON" />
          </SettingsBlock>

          <SettingsBlock label="AUTO-STOP" divider={false} desc="...">
            <SettingsBigToggle options={['ON', 'OFF']} active="ON" />
          </SettingsBlock>
        </div>
      </main>

      <div style={{
        display: 'flex', alignItems: 'center',
        padding: '8px 16px',
        background: 'var(--night)',
        borderTop: '1px solid var(--blood)',
      }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--blood-bright)' }}>
          ⚠ No recent export — tap below to back up your data now.
        </span>
        <div style={{ flex: 1 }} />
        <div style={{
          padding: '6px 14px', background: 'var(--blood)', color: '#fff',
          fontFamily: 'var(--font-ui)', fontSize: 13, letterSpacing: '.1em',
        }}>EXPORT NOW</div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
// SETTINGS · REFINED — six submenus, left rail navigation
// ═════════════════════════════════════════════════════════════════

const SETTINGS_SUBMENUS = [
  { id: 'controls',   label: 'CONTROLS',   icon: 'keyboard', count: '5 settings'  },
  { id: 'audio',      label: 'AUDIO',      icon: 'potion',   count: '7 settings'  },
  { id: 'display',    label: 'DISPLAY',    icon: 'eye',      count: '4 settings'  },
  { id: 'behavior',   label: 'BEHAVIOR',   icon: 'cog',      count: '6 settings'  },
  { id: 'data',       label: 'DATA',       icon: 'save',     count: 'backup · import · reset' },
  { id: 'about',      label: 'ABOUT',      icon: 'info',     count: 'v 150'        },
];

function SettingsRefined({ active = 'controls' }) {
  return (
    <div className="sb" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Top bar — pro-tool style, breadcrumb shows the active submenu */}
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <span style={{ fontFamily: 'var(--font-ui)', fontSize: 18, color: 'var(--gold)', letterSpacing: '.14em' }}>SETTINGS</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-mute)' }}>·</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)' }}>
            {SETTINGS_SUBMENUS.find((s) => s.id === active).label.toLowerCase()}
          </span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
          <ActBtn>?</ActBtn>
          <ActBtn><svg width="11" height="11" viewBox="0 0 11 11" fill="none" stroke="currentColor" strokeWidth="1.4"><path d="M1 4V1h3M10 4V1H7M1 7v3h3M10 7v3H7"/></svg></ActBtn>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', flex: 1, minHeight: 0 }}>
        {/* Left rail — submenu navigation */}
        <aside style={{ background: 'var(--deep)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
          <PanelHeaderV2 icon="cog" title="SECTIONS" active />
          <div style={{ padding: '8px 0', flex: 1, overflow: 'auto' }}>
            {SETTINGS_SUBMENUS.map((s) => (
              <div key={s.id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px',
                background: s.id === active ? 'var(--top)' : 'transparent',
                borderLeft: s.id === active ? '2px solid var(--gold)' : '2px solid transparent',
                color: s.id === active ? 'var(--gold)' : 'var(--text-dim)',
                cursor: 'pointer',
              }}>
                <PixelIcon name={s.icon} size={18} color="currentColor" />
                <div style={{ flex: 1 }}>
                  <div style={{
                    fontFamily: 'var(--font-ui)', fontSize: 15,
                    letterSpacing: '.1em',
                    color: s.id === active ? 'var(--gold)' : 'var(--text)',
                  }}>{s.label}</div>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-mute)', marginTop: 1 }}>
                    {s.count}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Persistent search */}
          <div style={{ padding: 10, borderTop: '1px solid var(--border-soft)' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '6px 10px',
              background: 'var(--sunk)', border: '1px solid var(--border)',
              color: 'var(--text-mute)',
            }}>
              <PixelIcon name="search" size={12} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>Search settings…</span>
            </div>
          </div>
        </aside>

        {/* Right pane — the selected submenu's content */}
        <main style={{ background: 'var(--surface)', overflow: 'auto' }}>
          {active === 'controls' && <SubmenuControls />}
          {active === 'audio'    && <SubmenuAudio />}
          {active === 'display'  && <SubmenuDisplay />}
          {active === 'behavior' && <SubmenuBehavior />}
          {active === 'data'     && <SubmenuData />}
          {active === 'about'    && <SubmenuAbout />}
        </main>
      </div>

      {/* Status footer */}
      <div className="sb-status-bar">
        <span className="sb-status-section" style={{ color: 'var(--gold)' }}>SETTINGS</span>
        <span className="sb-status-section">{SETTINGS_SUBMENUS.find((s) => s.id === active).label.toLowerCase()}</span>
        <span className="sb-status-section">auto-saved · 2s ago</span>
        <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: 'var(--blood-bright)' }}>⚠ backup overdue · 3d</span>
          <button className="sb-btn sb-btn-sm sb-btn-danger" style={{ padding: '2px 10px' }}>EXPORT NOW</button>
        </span>
      </div>
    </div>
  );
}

// ── Submenu content blocks ───────────────────────────────────────
function SubmenuHeader({ title, sub, action }) {
  return (
    <div style={{
      padding: '20px 32px 16px',
      borderBottom: '1px solid var(--border-soft)',
      display: 'flex', alignItems: 'center', gap: 14,
    }}>
      <div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, color: 'var(--gold-bright)', letterSpacing: '.06em', marginBottom: 6 }}>{title}</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)' }}>// {sub}</div>
      </div>
      <div style={{ flex: 1 }} />
      {action}
    </div>
  );
}

function SettingRow({ label, desc, control }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '220px 1fr 320px', gap: 18,
      padding: '14px 32px',
      borderBottom: '1px solid var(--border-soft)',
      alignItems: 'center',
    }}>
      <div style={{
        fontFamily: 'var(--font-ui)', fontSize: 14,
        color: 'var(--text)', letterSpacing: '.08em',
      }}>{label}</div>
      <div style={{
        fontFamily: 'var(--font-mono)', fontSize: 12,
        color: 'var(--text-dim)', lineHeight: 1.5,
      }}>{desc}</div>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>{control}</div>
    </div>
  );
}

function SegmentedControl({ options, active, color = 'var(--gold)' }) {
  return (
    <div style={{ display: 'inline-flex', border: `1px solid ${color}` }}>
      {options.map((o) => (
        <div key={o} style={{
          padding: '6px 16px',
          fontFamily: 'var(--font-ui)', fontSize: 13, letterSpacing: '.12em',
          color: o === active ? 'var(--text-on-gold)' : color,
          background: o === active ? color : 'transparent',
          cursor: 'pointer',
        }}>{o}</div>
      ))}
    </div>
  );
}

// ── CONTROLS submenu ──
function SubmenuControls() {
  return (
    <>
      <SubmenuHeader title="Controls" sub="input handling · keyboard · start mode · per-key tools"
        action={<button className="sb-btn sb-btn-sm"><PixelIcon name="keyboard" size={11} /> KEY TEST</button>}
      />

      <div style={{ padding: '20px 32px 8px' }}>
        <SectionLabel glyph="keyboard">INPUT BEHAVIOR</SectionLabel>
      </div>

      <SettingRow
        label="Start mode"
        desc="SETUP — always open in setup. GAME — open live. LAST — remember last used."
        control={<SegmentedControl options={['SETUP', 'GAME', 'LAST']} active="LAST" />}
      />
      <SettingRow
        label="Enter key stop"
        desc="SERIAL — stop only the most recently activated sound (LIFO). TOTAL — stop everything."
        control={<SegmentedControl options={['SERIAL', 'TOTAL']} active="SERIAL" />}
      />
      <SettingRow
        label="Long-press action"
        desc="What a long-press on a PAD does in GAME mode."
        control={<SegmentedControl options={['VOLUME', 'EDIT', 'PREVIEW']} active="VOLUME" />}
      />

      <div style={{ padding: '24px 32px 8px' }}>
        <SectionLabel glyph="potion">SWITCH SOUND</SectionLabel>
      </div>
      <SettingRow
        label="Mode toggle SFX"
        desc="Plays when you switch between SETUP and GAME. Leave empty for silence."
        control={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-mute)' }}>no file</span>
            <button className="sb-btn sb-btn-sm sb-btn-primary">UPLOAD</button>
            <button className="sb-btn sb-btn-sm sb-btn-ghost"><PixelIcon name="play" size={10} /></button>
          </div>
        }
      />

      <div style={{ padding: '24px 32px 8px' }}>
        <SectionLabel glyph="key">KEY BINDINGS</SectionLabel>
      </div>
      {[
        ['Stop all',         'ESC'],
        ['Crossfade to next', 'SPACE'],
        ['Toggle mode',       'TAB'],
        ['Search pads',       '/'],
        ['Open editor',       'E'],
      ].map(([k, v]) => (
        <SettingRow key={k} label={k} desc=""
          control={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="sb-num" style={{ minWidth: 80 }}>{v}</span>
              <button className="sb-btn sb-btn-sm sb-btn-ghost"><PixelIcon name="edit" size={10} /></button>
            </div>
          }
        />
      ))}
    </>
  );
}

// ── AUDIO submenu ──
function SubmenuAudio() {
  return (
    <>
      <SubmenuHeader title="Audio" sub="output device · master · busses · ducking · crossfade" />

      <div style={{ padding: '20px 32px 8px' }}>
        <SectionLabel glyph="potion">OUTPUT</SectionLabel>
      </div>
      <SettingRow
        label="Output device"
        desc="System default unless overridden."
        control={<span className="sb-num" style={{ minWidth: 200 }}>System Default ▾</span>}
      />
      <SettingRow
        label="Sample rate"
        desc="Audio engine target. Files are resampled to match."
        control={<SegmentedControl options={['44.1k', '48k', '96k']} active="48k" />}
      />

      <div style={{ padding: '24px 32px 8px' }}>
        <SectionLabel glyph="diamond">MASTER & BUSSES</SectionLabel>
      </div>
      <SettingRow
        label="Master volume"
        desc="Final output gain. Keep below 100 % for headroom."
        control={<div style={{ width: 260 }}><LabelSliderV2 label="MASTER" value={0.72} /></div>}
      />
      <SettingRow
        label="Ambient bus"
        desc="Default level for loop-type pads on a fresh board."
        control={<div style={{ width: 260 }}><LabelSliderV2 label="AMB" value={0.45} color="var(--pad-loop)" /></div>}
      />
      <SettingRow
        label="Stinger bus"
        desc="Default level for one-shot pads."
        control={<div style={{ width: 260 }}><LabelSliderV2 label="STG" value={0.90} color="var(--pad-single)" /></div>}
      />
      <SettingRow
        label="Music bus"
        desc="Default level for playlist pads."
        control={<div style={{ width: 260 }}><LabelSliderV2 label="MUS" value={0.60} color="var(--pad-playlist)" /></div>}
      />

      <div style={{ padding: '24px 32px 8px' }}>
        <SectionLabel glyph="loop">CROSSFADE & DUCKING</SectionLabel>
      </div>
      <SettingRow
        label="Crossfade between scenes"
        desc="Loops fade out as new ones fade in. Off = hard cut."
        control={<SegmentedControl options={['ON', 'OFF']} active="ON" />}
      />
      <SettingRow
        label="Crossfade duration"
        desc="Default time when switching scenes or playlists."
        control={<span className="sb-num is-active" style={{ minWidth: 80 }}>800 ms</span>}
      />
      <SettingRow
        label="Auto-duck on stinger"
        desc="Loop busses dip when a stinger plays. Subtle but feels professional."
        control={<SegmentedControl options={['OFF', 'LIGHT', 'STRONG']} active="LIGHT" />}
      />
    </>
  );
}

// ── DISPLAY submenu ──
function SubmenuDisplay() {
  const THEMES = [
    { id: 'hearth',  name: 'HEARTH',  bg: '#16162E', accent: '#D4B25C', current: true },
    { id: 'verdant', name: 'VERDANT', bg: '#102A20', accent: '#C9A04F' },
    { id: 'neon',    name: 'NEON',    bg: '#111E40', accent: '#3DD4F0' },
    { id: 'crimson', name: 'CRIMSON', bg: '#20121A', accent: '#D63A3A' },
  ];
  return (
    <>
      <SubmenuHeader title="Display" sub="theme · font scale · contrast · scanlines · density" />

      <div style={{ padding: '20px 32px 8px' }}>
        <SectionLabel glyph="potion">THEME</SectionLabel>
      </div>
      <div style={{ padding: '8px 32px 24px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {THEMES.map((t) => (
          <div key={t.id} style={{
            background: t.bg,
            border: '1px solid ' + (t.current ? t.accent : 'var(--border)'),
            padding: 14,
            boxShadow: t.current ? `0 0 0 1px ${t.accent} inset, 0 0 16px ${t.accent}55` : 'none',
            cursor: 'pointer',
          }}>
            <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
              <div style={{ width: 18, height: 18, background: t.accent }} />
              <div style={{ width: 18, height: 18, background: t.bg, border: `1px solid ${t.accent}` }} />
              <div style={{ width: 18, height: 18, background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.15)' }} />
            </div>
            <div style={{ fontFamily: 'var(--font-ui)', fontSize: 14, color: t.accent, letterSpacing: '.1em' }}>{t.name}</div>
            {t.current && (
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: t.accent, marginTop: 4 }}>CURRENT</div>
            )}
          </div>
        ))}
      </div>

      <SettingRow
        label="Font scale"
        desc="Affects body text only. Pixel titles stay at their native size."
        control={<div style={{ width: 260 }}><LabelSliderV2 label="SCALE" value={0.55} /></div>}
      />
      <SettingRow
        label="Pad density"
        desc="How tightly pads pack on the board."
        control={<SegmentedControl options={['LOOSE', 'NORMAL', 'DENSE']} active="NORMAL" />}
      />
      <SettingRow
        label="Pad shape"
        desc="The corner treatment for every pad."
        control={<SegmentedControl options={['STEP', 'RECT', 'CI']} active="STEP" />}
      />
      <SettingRow
        label="Scanlines in GAME mode"
        desc="Subtle CRT overlay during play. Adds atmosphere, slightly reduces contrast."
        control={<SegmentedControl options={['ON', 'OFF']} active="ON" />}
      />
      <SettingRow
        label="High contrast"
        desc="Force WCAG AAA text contrast everywhere. Useful in bright rooms."
        control={<SegmentedControl options={['ON', 'OFF']} active="OFF" />}
      />
    </>
  );
}

// ── BEHAVIOR submenu ──
function SubmenuBehavior() {
  return (
    <>
      <SubmenuHeader title="Behavior" sub="auto-stop · autosave · screen lock · undo history" />

      <div style={{ padding: '20px 32px 8px' }}>
        <SectionLabel glyph="hourglass">AUTOMATION</SectionLabel>
      </div>
      <SettingRow
        label="Auto-stop"
        desc="Stop one-shot sounds after their natural end. Off keeps the level meter visible."
        control={<SegmentedControl options={['ON', 'OFF']} active="ON" />}
      />
      <SettingRow
        label="Autosave"
        desc="Write board state to disk every N seconds."
        control={<span className="sb-num is-active" style={{ minWidth: 100 }}>every 30 s</span>}
      />
      <SettingRow
        label="Undo history"
        desc="How many steps the Undo stack remembers per board."
        control={<span className="sb-num" style={{ minWidth: 100 }}>50</span>}
      />

      <div style={{ padding: '24px 32px 8px' }}>
        <SectionLabel glyph="moon">SESSION</SectionLabel>
      </div>
      <SettingRow
        label="Screen wake lock"
        desc="Prevents auto-locking in GAME mode so a Bluetooth numpad keeps working. Does not override a manual screen-off."
        control={<SegmentedControl options={['ON', 'OFF']} active="ON" />}
      />
      <SettingRow
        label="Restore last board on launch"
        desc="Open straight into the board you last had open."
        control={<SegmentedControl options={['ON', 'OFF']} active="ON" />}
      />
      <SettingRow
        label="Confirm before delete"
        desc="Show a confirmation dialog for any destructive action."
        control={<SegmentedControl options={['ALWAYS', 'PADS+', 'NEVER']} active="ALWAYS" />}
      />
    </>
  );
}

// ── DATA submenu ──
function SubmenuData() {
  return (
    <>
      <SubmenuHeader title="Data" sub="backup · import · export · storage · reset"
        action={<button className="sb-btn sb-btn-sm sb-btn-filled"><PixelIcon name="save" size={11} /> EXPORT BACKUP</button>}
      />

      <div style={{ padding: '20px 32px 8px' }}>
        <SectionLabel glyph="save">BACKUP STATUS</SectionLabel>
      </div>
      <div style={{
        margin: '4px 32px 24px',
        padding: 16,
        background: 'rgba(160,40,40,.08)',
        border: '1px solid var(--blood)',
        display: 'flex', alignItems: 'center', gap: 16,
      }}>
        <PixelIcon name="hourglass" size={28} color="var(--blood-bright)" />
        <div>
          <div style={{ fontFamily: 'var(--font-ui)', fontSize: 14, color: 'var(--blood-bright)', letterSpacing: '.08em', marginBottom: 4 }}>
            BACKUP OVERDUE · 3 DAYS
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)' }}>
            Last export: 22/05/26 · all data stays in browser storage. Export regularly.
          </div>
        </div>
      </div>

      <SettingRow
        label="Import data"
        desc="Load a previously exported .json backup. Overwrites current data."
        control={<button className="sb-btn sb-btn-sm sb-btn-ghost"><PixelIcon name="download" size={11} /> IMPORT</button>}
      />
      <SettingRow
        label="Storage used"
        desc="Local IndexedDB · audio + pads + boards + icons."
        control={
          <div style={{ width: 260 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)' }}>
              <span>162.8 MB</span><span>· 32% of 500 MB</span>
            </div>
            <div style={{ height: 6, background: 'var(--sunk)', border: '1px solid var(--border)' }}>
              <div style={{ width: '32%', height: '100%', background: 'var(--gold)' }} />
            </div>
          </div>
        }
      />

      <div style={{ padding: '24px 32px 8px' }}>
        <SectionLabel glyph="skull">DANGER ZONE</SectionLabel>
      </div>
      <SettingRow
        label="Clear unused audio"
        desc="Removes audio files not referenced by any pad. Frees space, irreversible."
        control={<button className="sb-btn sb-btn-sm sb-btn-danger">CLEAR · 12 FILES</button>}
      />
      <SettingRow
        label="Reset all data"
        desc="Wipes pads, boards, audio and icons. Requires confirmation. Cannot be undone."
        control={<button className="sb-btn sb-btn-sm sb-btn-danger">RESET EVERYTHING</button>}
      />
    </>
  );
}

// ── ABOUT submenu ──
function SubmenuAbout() {
  return (
    <>
      <SubmenuHeader title="About" sub="version · credits · license · acknowledgements" />

      <div style={{ padding: '40px 32px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 12 }}>
        <FlameLogo size={72} />
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--gold-bright)', letterSpacing: '.06em', lineHeight: 1.4 }}>
          SOUNDBOARD<br/>OF STORYTELLING
        </div>
        <div className="sb-mono" style={{ fontSize: 13, color: 'var(--text-dim)' }}>
          A tool for Game-Masters and other creative Creatures.
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-mute)', marginTop: 8 }}>
          v 150 · build 26 · 23/05/26
        </div>
      </div>

      <div style={{ padding: '0 32px' }}>
        <SectionLabel glyph="scroll">CREDITS</SectionLabel>
      </div>
      <SettingRow label="Design system"     desc="Tokens · components · screens — refined collaboratively." control={<span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)' }}>v2 · 25/05/26</span>} />
      <SettingRow label="Audio engine"      desc="Web Audio API." control={<span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)' }}>WebAudio</span>} />
      <SettingRow label="Built-in icons"    desc="2 289 pixel-art icons." control={<span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-dim)' }}>open-source</span>} />
      <SettingRow label="Source · license"  desc="Open source · MIT." control={<button className="sb-btn sb-btn-sm sb-btn-ghost"><PixelIcon name="download" size={10} /> VIEW</button>} />
    </>
  );
}

// ═════════════════════════════════════════════════════════════════
// Comparison notes
// ═════════════════════════════════════════════════════════════════
function SettingsRefinementArtboard() {
  const notes = [
    ['Six labelled sub-menus',     'CONTROLS / AUDIO / DISPLAY / BEHAVIOR / DATA / ABOUT — instead of one long scroll. Each opens in place, no navigation away.'],
    ['Persistent left rail',       'Always shows where you are; click any section to jump. Matches Lightroom / Premiere / Resolve Preferences conventions.'],
    ['Three-column setting rows',  'Label · description · control. Reads like a spec sheet. The description column carries the long explanations (was inline below the toggle in v1).'],
    ['Segmented controls',         'Compact replacement for full-width SETUP/GAME/LAST blocks. Same affordance, 1/4 the vertical space.'],
    ['Backup elevated to DATA',    'A dedicated tab where backup is the FIRST thing you see — with an explicit overdue banner. Less anxious than the persistent red footer.'],
    ['Status footer for autosave', '"auto-saved · 2 s ago" — calm confirmation instead of nagging.'],
    ['Search settings',            'A search input at the bottom of the rail lets you find any setting by name across all sub-menus.'],
    ['Theme picker grouped',       'All 4 themes side-by-side in the DISPLAY tab — was previously buried in the long scroll.'],
    ['Per-bus default volumes',    'Master + ambient + stinger + music busses get distinct, type-coloured sliders. New surface area for sound design.'],
  ];

  return (
    <div className="sb" style={{ padding: 28, overflow: 'auto', height: '100%' }}>
      <div style={{ marginBottom: 18 }}>
        <div className="sb-display" style={{ fontSize: 22 }}>Settings · what changed</div>
        <div className="sb-mono" style={{ fontSize: 13, marginTop: 6 }}>
          // one long scroll → six grouped sub-menus on a left rail. Pro-tool conventions.
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

Object.assign(window, {
  SettingsActual, SettingsRefined,
  SubmenuControls, SubmenuAudio, SubmenuDisplay, SubmenuBehavior, SubmenuData, SubmenuAbout,
  SettingsRefinementArtboard,
  SegmentedControl, SettingRow, SubmenuHeader,
});
