<!--
  GYRE — README
  Copyright (c) 2026 Ideatrino <ideatrino@proton.me>. All Rights Reserved.
-->

# GYRE

### A draw-proof two-player connection game on a hexagonal ring.

**Bridge across, or loop around. Someone always wins.**

GYRE is an original abstract strategy game for two players. The board is a
ring of hexagonal cells — concentric rings around an empty centre. One player
(**Spoke**) wins by building an unbroken chain of stones from the inner rim to
the outer rim: a *bridge across* the ring. The other (**Gyre**) wins by
building a chain that wraps all the way around the hole: a *loop around* it.

On a ring these two goals are topological opposites. When the board fills,
**exactly one of them is satisfied — never both, never neither.** Draws are not
rare; they are *impossible*. That property is proven in the rules and
brute-force–verified in the test suite.

---

## Why it exists

GYRE is an engineering answer to the known failure modes of classic games,
each closed with a specific piece of mathematics:

| Flaw in older games | How GYRE removes it |
|---|---|
| **Draws / stalemates** (Chess, Tic-tac-toe) | Impossible — a no-draw theorem guarantees a winner on a full board. |
| **First-player advantage** (Hex, Go pre-komi) | Neutralised by the **swap rule** (pie rule): the second player may take the first move. |
| **Solvability** (Tic-tac-toe, Connect-4, Checkers — all solved) | Generalised Hex-style connection games are **PSPACE-complete**; scaling the ring keeps it unsolved. |
| **Luck dominance** (Monopoly, Snakes & Ladders) | Zero randomness — no dice, no cards, no shuffles. |
| **Cheatability** (hidden hands, hidden scores) | Perfect information — the entire state sits face-up and is publicly auditable. |
| **Kingmaking** (3+ player games) | Strictly two-player, zero-sum. |

A fuller treatment — including the honest caveats about what is *proven* versus
merely *engineered toward* — lives in [`docs/RULEBOOK.md`](docs/RULEBOOK.md).

---

## How to play (90 seconds)

1. The board is `R` rings deep and `C` cells around. Standard size is **7 × 14**.
2. Players are **Spoke** and **Gyre**. They alternate placing one stone of their
   colour on any empty cell. Stones never move and are never removed.
3. **Spoke wins** with a connected chain touching both the inner rim *and* the
   outer rim (a radial bridge).
4. **Gyre wins** with a connected chain that encircles the hole (a full loop).
5. **Swap rule (fairness):** Player 1 places the first stone (a Spoke stone).
   Player 2 then chooses to either *keep* their side (and play Gyre) or *swap*
   (take that stone and play Spoke). This removes first-player advantage.
6. Cells are hex-adjacent: each touches up to six neighbours, and the ring
   **wraps** around, so each row is a closed circle.

Because draws are impossible, play simply continues until one victory condition
appears — and on a full board one always does.

---

## Run it

**Play in a browser** (no build step, no dependencies):

```
open web/index.html      # macOS
# or just double-click web/index.html in your file manager
```

Hot-seat for two humans, or play against the built-in casual AI. Choose the
board size in the top bar.

**Run the test suite** (Node ≥ 16, no dependencies):

```
node test/gyre.test.js
# or
npm test
```

Current status: **21 passed, 0 failed.** The suite verifies hex adjacency,
bridge/loop detection, mutual exclusion across tens of thousands of partial
boards, the no-draw theorem brute-forced over **60,000 random full boards**, the
swap-rule mechanics, and **4,000** random self-play games (all terminate with
exactly one winner).

**Regenerate the print-and-play sheets** (Python 3):

```
python3 tools/make_board.py
# writes docs/printable/gyre-7x14.svg and gyre-5x10.svg
```

---

## Repository structure

```
gyre/
├── README.md                  ← you are here
├── LICENSE                    ← proprietary, All Rights Reserved
├── package.json               ← npm metadata (private)
├── CHANGELOG.md
├── AUTHORS
├── src/
│   └── gyre-engine.js         ← rules engine (Node + browser, no deps)
├── test/
│   └── gyre.test.js           ← self-contained test runner (21 checks)
├── web/
│   └── index.html             ← playable client + casual AI
├── docs/
│   ├── RULEBOOK.md            ← full rules + the mathematics
│   └── printable/             ← print-and-play SVG boards
│       ├── gyre-7x14.svg
│       └── gyre-5x10.svg
└── tools/
    └── make_board.py          ← regenerates the printable boards
```

The engine is dependency-free and runs unchanged under Node (`require`) and in
the browser (`window.GYRE`). Every edge the web client draws corresponds to a
real adjacency in the engine, so what you see is exactly what the rules use.

---

## The mathematics, briefly

The board is a hex grid wrapped onto a cylinder: `R` rings (radial axis, with
hard inner/outer boundaries) by `C` columns (angular axis, which wraps). A
**bridge** is a connected same-colour component touching both radial
boundaries. A **loop** is a connected same-colour component whose path
accumulates a full ±C winding around the hole — detected by lifting cell angles
to absolute coordinates and checking for a nonzero multiple of `C`.

The key fact (a cylindrical cousin of the Hex no-draw theorem): on a filled
board, the Spoke colour forms a bridge **if and only if** the Gyre colour does
*not* form a loop. A radial cut of one colour blocks any angular cut of the
other, and vice versa — so exactly one condition holds. This is what makes
draws impossible, and it is the property the test suite hammers on directly.

This places GYRE openly in the connection-game lineage of Hex and Y; the
contribution is the annular topology, the dual asymmetric win conditions, and
the no-draw guarantee carried onto the ring, packaged as a complete, tested,
playable game.

---

## License

**Proprietary — Copyright © 2026 Ideatrino. All Rights Reserved.**
See [`LICENSE`](LICENSE).

This repository is **source-available for evaluation and reference only.** No
right to use, copy, modify, distribute, or commercialise the Work (including the
GYRE name, rules, design, code, and artwork) is granted without prior written
permission. For commercial-licensing enquiries, contact
**ideatrino@proton.me**.

> *Note: this license expresses an "all rights reserved" intent and is not legal
> advice. For enforceable commercial terms or trademark protection, have a
> lawyer review or adapt it to your jurisdiction.*

---

## Author

**Ideatrino** · ideatrino@proton.me · 2026
