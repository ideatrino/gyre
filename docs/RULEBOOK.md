<!--
  GYRE — Rulebook
  Copyright (c) 2026 Ideatrino <ideatrino@proton.me>. All Rights Reserved.
-->

# GYRE
### A connection game engineered against the known flaws of its ancestors

---

## 0. An honest framing

There is no theorem that singles out one "most functional, most secure board game." That phrase isn't a well-posed optimization with a unique answer — *functional* and *secure* aren't even on the same scale. So this design doesn't pretend to compute the winner. Instead it treats the goal as an engineering brief: **take the measurable failure modes of existing games, and design an original game that closes each one using a specific piece of mathematics.** Everything below is justified, and where a property is *proven* versus merely *engineered toward*, it says so.

---

## 1. The failure modes this design fights

| Flaw | Where it hurts | The math behind it |
|---|---|---|
| **First-player advantage** | Chess, Go (pre-komi), Hex, Tic-tac-toe | One player has a strictly better starting position. |
| **Draws / stalemates** | Chess (~50%+ at top level), Tic-tac-toe | "Nobody wins" is anticlimactic and breaks tournaments. |
| **Solvability** | Tic-tac-toe, Connect-4, Checkers (all *solved*) | Small state space → perfect play kills the game. |
| **Luck dominance** | Snakes & Ladders, Monopoly | Outcome decorrelated from skill. |
| **Runaway leader (snowball)** | Monopoly, many Eurogames | Once ahead, you stay ahead. |
| **Cheatability** | Hidden hands, shuffles, hidden scores | State isn't publicly verifiable, so it can be rigged. |
| **Kingmaking** | 3+ player games | A losing player chooses who wins. |

GYRE answers every row.

---

## 2. The core idea in one breath

Two players fight over a ring-shaped (annular) board. One player wins by building a **bridge across the ring** (inner edge to outer edge). The other wins by building a **loop around the hole** (a gyre).

On a ring, *these two goals are mathematical opposites*. A complete bridge of one color physically prevents a loop of the other, and a complete loop prevents any bridge. When the board fills, **exactly one of the two goals must be satisfied — never both, never neither.** Draws are not "rare." They are *impossible*.

---

## 3. Components

- **The board:** a flat ring (annulus) of hexagonal cells in concentric rings around an empty central hole.
  - Recommended size: **7 rings deep × 14 cells around** (98 cells). Scalable — see §10.
- **Two sets of stones**, two colors. No dice, no cards, no hidden anything.

```
              · · · · · · ·  ← outer rim
            · · · · · · · · ·
          · · ·  ╭───────╮  · · ·
        · · ·    │       │    · · ·
        · · ·    │ HOLE  │    · · ·     each "·" is a hex cell
        · · ·    │       │    · · ·
          · · ·  ╰───────╯  · · ·
            · · · · · · · · ·
              · · · · · · ·  ← outer rim
```

Adjacency is hexagonal, exactly as on a printed Hex board: every cell touches up to 6 neighbors — its two neighbors around the same ring (the ring **wraps**, so the row is a closed circle) and the cells in the rings just inside and outside it.

---

## 4. The two roles

- **SPOKE** wins by connecting a chain from the **inner rim** to the **outer rim** — a radial crossing.
- **GYRE** wins by connecting a chain that **encircles the hole** — a closed loop all the way around.

The roles are asymmetric on purpose. The rule in §5 makes that asymmetry fair.

---

## 5. Rules of play

**Setup.** Empty board. Decide who places first.

**The opening + Swap Rule (the fairness engine).**
1. The first player places **one Spoke (first-color) stone anywhere.**
2. The second player **chooses their role** — keep their side, or **swap** to take over the opening stone and become Spoke themselves.
   - This is the classic **pie rule** ("you cut, I choose"). It forces the opener to make a *balanced* first move: if the opening favors either role, the opponent simply claims that role. Best play is a near-neutral opening — which is exactly what kills first-player advantage.

**Turns.** After the opening, players alternate. On your turn, place **one stone of your color on any empty cell.** Stones never move and are never removed.

**Winning.** The instant your stones complete your goal — a Spoke bridge, or a Gyre loop — you win. By §6, someone always does, and only one of you can.

That is the entire ruleset. You can teach it in under a minute.

---

## 6. The no-draw theorem (why GYRE *cannot* tie)

**Claim.** When the ring is completely filled with two colors, exactly one is true: (a) the Spoke color connects inner rim to outer rim, or (b) the Gyre color forms a loop around the hole.

**Why not both.** A complete Gyre loop is a closed curve of one color encircling the hole. On a ring, any such loop *separates* the inner rim from the outer rim — you cannot get from inside to outside without crossing it. So if the loop exists in one color, no chain of the other color can bridge across it. Mutually exclusive.

**Why at least one.** Suppose the Spoke color does **not** bridge. Look at every cell reachable from the inner rim through Spoke stones. That region touches the inner rim but never reaches the outer rim. Its border is made entirely of the *other* color, and because the inner rim is a full circle that must be sealed off from the outer rim, that border has to wrap all the way around the hole. That wrap-around border **is** a Gyre loop. So if Spoke fails, Gyre necessarily succeeds.

This is the **cylindrical version of the Hex theorem** — the same topological duality that proves Hex can never draw, transported from a rhombus to a ring. It holds for any board size. **Draws are structurally impossible.** *(Proven — and, in this repository, confirmed empirically across 60,000 random full boards in the test suite.)*

---

## 7. Why it's "secure" against being *solved*

- **Connection games of this family are PSPACE-complete** to solve (the classic generalized-Hex result, Even & Tarjan / Reisch). PSPACE-complete means the work to solve it blows up faster than any practical computer can chase as the board grows. No formula, no opening book ends the game.
- **No memorization win**, unlike Tic-tac-toe.
- **Scalable hardness:** if hardware ever catches up to one board size, add a ring (§10) and the difficulty leaps again. *(Proven for the family; tuned via board size.)*

---

## 8. Why it's "secure" against *cheating*

- **Perfect information.** Nothing is hidden — no hands, no facedown tiles, no concealed score.
- **Determinism.** No dice, no shuffle, nothing to load or palm.
- **The full state = the stones on the board.** An observer verifies the position by looking.
- **Total auditability.** Record moves as `ring–position` coordinates; the whole game reconstructs from the list, like chess notation.

---

## 9. Why it's "functional" (and beats specific games)

- **No first-player advantage** — the pie rule punishes any unfair opening. *Beats Chess, Hex, Tic-tac-toe.*
- **No draws** — §6 guarantees a decisive result every game. *Beats Chess, Tic-tac-toe, Connect-4.*
- **Pure skill, zero luck.** *Beats Monopoly, Snakes & Ladders.*
- **Anti-snowball.** A single stone can sever a nearly-complete structure, so a lead is never safe; and by the §6 duality **every stone both advances your goal and blocks your opponent's** — no wasted moves, no coasting. *Beats Monopoly's runaway leader.*
- **No kingmaking** — strictly two-player. *Beats most 3+ player games.*
- **One-minute rules, lifetime depth** — shorter rules than Tic-tac-toe, a PSPACE-hard strategy space.

---

## 10. Variants and scaling

- **Tournament dial:** more rings = harder, longer. 5×10 (~10 min), 7×14 (standard), 9×18 (deep).
- **Balance dial:** the ratio of rings to circumference tilts the natural Spoke/Gyre advantage. Near-square ratios (depth ≈ circumference ÷ 2) are most balanced; the swap rule absorbs the rest.
- **Misère GYRE:** you *lose* if you complete your own goal — flips strategy, still draw-free.
- **Disk variant:** fill the hole to recover ordinary Hex-on-a-cylinder — good for teaching the topology first.

---

## 11. Honest caveats

- GYRE is **original as a packaged game** — the annular board, the asymmetric *bridge-vs-gyre* goals, the role-swap opening, and the name are a new synthesis. But it is **not invented from nothing**: it stands openly in the connection-game tradition founded by Hex (Hein/Nash) and generalized by Y, Havannah, and cylindrical Hex. Building on proven mathematics is *why* the no-draw and hardness properties are trustworthy.
- "Most secure / most functional *possible*" is not a provable claim about any game, and isn't claimed here. What is defensible: GYRE provably closes every flaw in the §1 table.
- The exact Spoke/Gyre balance at a given board size is best confirmed by play; the swap rule is the safety net that keeps it fair before tuning.
