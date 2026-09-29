# Soundboard of Storytelling

A soundboard for live storytelling at the table. It lets whoever runs a game — storyteller,
narrator or game master — play music, ambience and sound effects at the right moment
without drawing attention away from the players.

The app runs in the browser and can be installed like a native app on phones, tablets and
computers. Audio files and boards are stored locally on the device: no account, no server,
and it keeps working offline.

**Live version:** https://fabjun.github.io/soundboard-of-storytelling/

## Status

In active development and not yet feature-complete. Version 3 is a complete rewrite of
an earlier prototype.

Available now:

- Audio library with import, renaming, deletion and waveform preview
- Boards organised into decks of pads
- Pads for one-shot sounds, loops, playlists and combinations of other pads
- Separate modes for preparing a board (SETUP) and for playing during a session (GAME)
- Installable, offline-capable web app

Planned next:

- A shared pad pool per board, with decks as hand-picked views of it
- Backup and restore in a single file, including migration from the prototype
- Combo editor for building sequences from existing pads
- Live control via numeric keypad, stop all and pause
- Layout for smartphones of all sizes
- Settings and themes

## Technology

Preact and TypeScript, built with Vite. Data is stored in IndexedDB, audio runs on the
Web Audio API, and a service worker provides offline support.

Every change passes an automated test suite before it is deployed: unit tests (Vitest) and
end-to-end tests (Playwright) in Chromium and WebKit, including tests against the
production build.

## Development

Requires Node.js 24 (see `.nvmrc`).

```bash
cd v3
npm install
npm run dev        # development server
npm run test       # unit tests
npm run test:e2e   # end-to-end tests
npm run build      # production build
```

## Documentation

| Document | Content |
|---|---|
| [docs/product/PRODUCT.md](docs/product/PRODUCT.md) | Product concept |
| [V3_CONCEPT_BRIEF.md](V3_CONCEPT_BRIEF.md) | Technical architecture |
| [docs/architecture/](docs/architecture/README.md) | Architecture decision records |
| [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) | Design tokens, CSS rules, component anatomy |
| [TESTING.md](TESTING.md) | Test strategy, commands and conventions |
| [BACKLOG.md](BACKLOG.md) | Open work items and known limitations |
| [CLAUDE.md](CLAUDE.md) | Development workflow and coding standards |

## License

Proprietary. Copyright © 2026 Fabian Jung. All rights reserved.

The source code is publicly visible but may not be used, copied, modified or distributed
without prior written permission. See [LICENSE](LICENSE).
Enquiries: soundboard_of_storytelling@pm.me
