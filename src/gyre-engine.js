/*!
 * GYRE — engine
 * A draw-proof connection game on a hexagonal annulus.
 *
 * Copyright (c) 2026 Ideatrino <ideatrino@proton.me>
 * All Rights Reserved. See LICENSE.
 *
 * The board is a ring (annulus) of hex cells: R concentric rings (r = 0..R-1)
 * and C cells around each ring (a = 0..C-1, wrapping). Adjacency is the
 * standard hexagonal adjacency with the angular axis closed into a circle,
 * i.e. "Hex on a cylinder".
 *
 *   SPOKE (color S) wins with a chain joining the inner rim (ring 0) to the
 *   outer rim (ring R-1)  — a radial BRIDGE.
 *   GYRE  (color G) wins with a chain that encircles the hole — a LOOP.
 *
 * Theorem (cylindrical Hex duality): on a full board, color-S bridges XOR
 * color-G loops — exactly one, never both, never neither. So GYRE cannot draw.
 */
(function (root, factory) {
  var api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api; // Node
  if (typeof window !== 'undefined') window.GYRE = api;                       // browser
}(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var EMPTY = 0, S = 1, G = 2;

  // 6 hex directions as [dRing, dAngle].
  var DIRS = [
    [0, +1], [0, -1],
    [+1, 0], [-1, 0],
    [+1, -1], [-1, +1]
  ];

  function mod(n, m) { return ((n % m) + m) % m; }
  function other(color) { return color === S ? G : S; }

  // ---- construction -------------------------------------------------------

  function createGame(R, C) {
    R = R || 7; C = C || 14;
    if (R < 2 || C < 3) throw new Error('GYRE needs R>=2 and C>=3');
    var cells = [];
    for (var r = 0; r < R; r++) cells.push(new Array(C).fill(EMPTY));
    return {
      R: R, C: C, cells: cells,
      phase: 'OPENING',          // OPENING -> AWAIT_SWAP -> PLAY -> OVER
      moveCount: 0,
      colorToMove: S,
      colorOwner: { 1: null, 2: null }, // playerId -> color
      ownerOfColor: {},                 // color -> playerId
      currentPlayer: 1,
      opening: null,             // {r,a}
      winner: null,              // playerId
      winColor: null, winType: null, winCells: null,
      history: []
    };
  }

  function inBounds(state, r) { return r >= 0 && r < state.R; }

  function neighbors(state, r, a) {
    var out = [];
    for (var i = 0; i < DIRS.length; i++) {
      var nr = r + DIRS[i][0];
      if (!inBounds(state, nr)) continue;
      out.push([nr, mod(a + DIRS[i][1], state.C)]);
    }
    return out;
  }

  // ---- win detection ------------------------------------------------------

  // BRIDGE: a color-component that touches ring 0 and ring R-1.
  function bridgeWin(state, color) {
    var R = state.R, C = state.C, cells = state.cells;
    var seen = makeGrid(R, C, false);
    for (var a = 0; a < C; a++) {
      if (cells[0][a] !== color || seen[0][a]) continue;
      var stack = [[0, a]]; seen[0][a] = true;
      var comp = [], touchesOuter = false;
      while (stack.length) {
        var cur = stack.pop(); comp.push(cur);
        if (cur[0] === R - 1) touchesOuter = true;
        var nb = neighbors(state, cur[0], cur[1]);
        for (var k = 0; k < nb.length; k++) {
          var nr = nb[k][0], na = nb[k][1];
          if (cells[nr][na] === color && !seen[nr][na]) { seen[nr][na] = true; stack.push([nr, na]); }
        }
      }
      if (touchesOuter) return { win: true, cells: comp };
    }
    return { win: false, cells: null };
  }

  // LOOP: a color-component that encircles the hole. Detected via winding:
  // lift angles to absolute integers; if one cell is reached with two absolute
  // angles differing by a nonzero multiple of C, the component winds the hole.
  function loopWin(state, color) {
    var R = state.R, C = state.C, cells = state.cells;
    var globalSeen = makeGrid(R, C, false);
    for (var r0 = 0; r0 < R; r0++) {
      for (var a0 = 0; a0 < C; a0++) {
        if (cells[r0][a0] !== color || globalSeen[r0][a0]) continue;
        // BFS this component, labelling absolute angles.
        var absAngle = {};                 // key -> absolute angle
        var comp = [];
        var key0 = r0 * C + a0;
        absAngle[key0] = a0; globalSeen[r0][a0] = true;
        var queue = [[r0, a0, a0]];
        var winds = false;
        while (queue.length) {
          var item = queue.shift();
          var r = item[0], a = item[1], ang = item[2];
          comp.push([r, a]);
          for (var i = 0; i < DIRS.length; i++) {
            var nr = r + DIRS[i][0];
            if (!inBounds(state, nr)) continue;
            var da = DIRS[i][1];
            var na = mod(a + da, C);
            if (cells[nr][na] !== color) continue;
            var nAbs = ang + da;
            var nKey = nr * C + na;
            if (absAngle.hasOwnProperty(nKey)) {
              if (absAngle[nKey] !== nAbs) winds = true; // differs by k*C, k != 0
            } else {
              absAngle[nKey] = nAbs;
              globalSeen[nr][na] = true;
              queue.push([nr, na, nAbs]);
            }
          }
        }
        if (winds) return { win: true, cells: comp };
      }
    }
    return { win: false, cells: null };
  }

  function makeGrid(R, C, fill) {
    var g = [];
    for (var r = 0; r < R; r++) g.push(new Array(C).fill(fill));
    return g;
  }

  // Check whichever goal the just-moved color can satisfy.
  function checkWinForColor(state, color) {
    if (color === S) {
      var b = bridgeWin(state, S);
      if (b.win) return { type: 'bridge', cells: b.cells };
    } else {
      var l = loopWin(state, G);
      if (l.win) return { type: 'loop', cells: l.cells };
    }
    return null;
  }

  // ---- moves --------------------------------------------------------------

  function isEmpty(state, r, a) {
    return inBounds(state, r) && a >= 0 && a < state.C && state.cells[r][a] === EMPTY;
  }

  // Opening: player 1 places a single Spoke (S) stone. Color is fixed by
  // convention; the swap rule, not color choice, supplies the fairness.
  function openingMove(state, r, a) {
    if (state.phase !== 'OPENING') throw new Error('not in OPENING phase');
    if (!isEmpty(state, r, a)) throw new Error('cell not empty');
    state.cells[r][a] = S;
    state.opening = { r: r, a: a };
    state.moveCount++;
    state.history.push({ kind: 'open', r: r, a: a, color: S });
    state.phase = 'AWAIT_SWAP';
    return state;
  }

  // Player 2 decides. swap=true: P2 takes the Spoke stone+role, P1 becomes Gyre.
  // swap=false: P1 keeps Spoke, P2 becomes Gyre. Either way the next stone is G.
  function chooseSwap(state, swap) {
    if (state.phase !== 'AWAIT_SWAP') throw new Error('not awaiting swap');
    if (swap) { assign(state, /*spoke*/2, /*gyre*/1); }
    else { assign(state, /*spoke*/1, /*gyre*/2); }
    state.colorToMove = G;
    state.currentPlayer = state.ownerOfColor[G];
    state.phase = 'PLAY';
    state.history.push({ kind: 'swap', swap: !!swap });
    return state;
  }

  function assign(state, spokePlayer, gyrePlayer) {
    state.colorOwner[spokePlayer] = S;
    state.colorOwner[gyrePlayer] = G;
    state.ownerOfColor[S] = spokePlayer;
    state.ownerOfColor[G] = gyrePlayer;
  }

  // Regular placement during PLAY.
  function move(state, r, a) {
    if (state.phase !== 'PLAY') throw new Error('not in PLAY phase');
    if (!isEmpty(state, r, a)) throw new Error('cell not empty');
    var color = state.colorToMove;
    state.cells[r][a] = color;
    state.moveCount++;
    state.history.push({ kind: 'move', r: r, a: a, color: color });

    var result = checkWinForColor(state, color);
    if (result) {
      state.phase = 'OVER';
      state.winner = state.ownerOfColor[color];
      state.winColor = color;
      state.winType = result.type;
      state.winCells = result.cells;
      return state;
    }
    state.colorToMove = other(color);
    state.currentPlayer = state.ownerOfColor[state.colorToMove];
    return state;
  }

  // Convenience for a UI: route a cell click to the right handler.
  function clickCell(state, r, a) {
    if (state.phase === 'OPENING') return openingMove(state, r, a);
    if (state.phase === 'PLAY') return move(state, r, a);
    return state; // ignore clicks during AWAIT_SWAP / OVER
  }

  function legalMoves(state) {
    var out = [];
    for (var r = 0; r < state.R; r++)
      for (var a = 0; a < state.C; a++)
        if (state.cells[r][a] === EMPTY) out.push([r, a]);
    return out;
  }

  return {
    EMPTY: EMPTY, S: S, G: G, DIRS: DIRS,
    createGame: createGame,
    neighbors: neighbors,
    bridgeWin: bridgeWin,
    loopWin: loopWin,
    openingMove: openingMove,
    chooseSwap: chooseSwap,
    move: move,
    clickCell: clickCell,
    legalMoves: legalMoves,
    other: other,
    mod: mod
  };
}));
