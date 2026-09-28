# Soundboard of Storytelling (V3)

A Progressive Web App for tabletop role-playing game soundboards.
Designed for Game Masters who want quick, reliable access to ambient
audio during sessions.

**Status:** In active development. Slice 3 (Board/Scene/Pad CRUD)
complete. Slice 4 (Audio Playback) in progress.

## Features

- **Local-first:** All audio and configuration stored in IndexedDB. No server, no account.
- **PWA-ready:** Install on iPhone/iPad via "Add to Home Screen".
- **Cross-platform:** Works on desktop and mobile. Primary target: iPhone 13 Pro + Brave.
- **Modes:** SETUP for configuration, GAME for play. Clear visual separation.

## Tech Stack

- Preact ^10.29.1 + Signals (ultra-light alternative to React)
- Vite ^8.0.12 (build tool)
- TypeScript ~6.0.2 (strict)
- IndexedDB via `idb` ^8.0.3 (persistence)
- @noble/hashes ^2.2.0 (SHA-256, no Secure Context required)
- vite-plugin-pwa (service worker, manifest)
- Vitest ^4.1.7 + Playwright ^1.60.0 (testing)

## Development

### Prerequisites
- Node.js 20+
- npm

### Setup
```bash
cd v3
npm install
npm run dev
```

### Testing
```bash
npm run test               # Unit tests
npm run test:e2e:smoke     # Quick E2E smoke
npm run test:e2e           # Full E2E suite
npm run test:e2e:visual    # Visual regression (local only)
```

### Build
```bash
npm run build
```

## Documentation

- `CLAUDE.md` — workflow rules, coding standards, and conventions
- `V3_CONCEPT_BRIEF.md` — technical architecture overview (mandatory first-read); slice plan: `CLAUDE.md §Slice progress`; product concept: `docs/product/PRODUCT.md`
- `DESIGN_SYSTEM.md` — CSS rules, design tokens, component anatomy, full class inventory
- `DESIGN_SYSTEM_CHEATSHEET.md` — one-page quick reference for daily use
- `TESTING.md` — test strategy, commands, and `data-testid` patterns
- `BACKLOG.md` — deferred items, known limitations, and open UX decisions
- `DESIGN_NOTES.md` — design-detail decisions and open "how exactly" questions
- `CHANGELOG.md` — release notes per version
- `docs/DOCUMENTATION_MAP.md` — map of every document's role and source-of-truth scope
- `docs/MANUAL_IPHONE_CHECKLIST.md` — manual iPhone verification checklist
- `docs/analysis/FOUNDATION_ANALYSIS.md` — documentation audit and cross-doc coupling map
- `docs/architecture/` — Architecture Decision Records (ADRs)

## License

All Rights Reserved. See [LICENSE](LICENSE) for details.

For licensing inquiries, contact [soundboard_of_storytelling@pm.me](mailto:soundboard_of_storytelling@pm.me).
