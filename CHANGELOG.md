# Changelog

All notable changes to GYRE are documented here.

## [1.0.0] — 2026
### Added
- Core game engine (`src/gyre-engine.js`): hexagonal-annulus model, swap-rule
  opening, and winding-number win detection for both Bridge (Spoke) and
  Loop (Gyre) goals.
- Test suite (`test/gyre.test.js`): 21 checks with no external dependencies,
  including a 60,000-board brute-force confirmation of the no-draw theorem and
  4,000 random self-play games (all decisive, zero draws).
- Playable web client (`web/index.html`): hot-seat and a casual built-in
  opponent, rendered as a node-and-edge orrery faithful to the engine.
- Rulebook (`docs/RULEBOOK.md`) and print-and-play boards
  (`docs/printable/`).
