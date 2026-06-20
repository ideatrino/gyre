/*!
 * GYRE — test suite (no external dependencies; run with `node test/gyre.test.js`)
 * Copyright (c) 2026 Ideatrino <ideatrino@proton.me>. All Rights Reserved.
 */
'use strict';
var GY = require('../src/gyre-engine.js');
var S = GY.S, G = GY.G, EMPTY = GY.EMPTY;

var passed = 0, failed = 0;
function ok(cond, msg) { if (cond) { passed++; } else { failed++; console.error('  FAIL: ' + msg); } }
function section(name) { console.log('\n== ' + name + ' =='); }

// Deterministic PRNG so runs are reproducible.
function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function emptyBoard(R, C) {
  var g = GY.createGame(R, C);
  return g;
}

// ---------------------------------------------------------------------------
section('Adjacency is symmetric and hexagonal (degree <= 6)');
(function () {
  var st = emptyBoard(7, 14);
  var symmetric = true, maxDeg = 0;
  for (var r = 0; r < st.R; r++) for (var a = 0; a < st.C; a++) {
    var nb = GY.neighbors(st, r, a);
    maxDeg = Math.max(maxDeg, nb.length);
    for (var k = 0; k < nb.length; k++) {
      var back = GY.neighbors(st, nb[k][0], nb[k][1]);
      var found = back.some(function (p) { return p[0] === r && p[1] === a; });
      if (!found) symmetric = false;
    }
  }
  ok(symmetric, 'every edge is symmetric');
  ok(maxDeg <= 6, 'no cell exceeds 6 neighbors (got ' + maxDeg + ')');
  // Interior cells should have exactly 6 neighbors.
  ok(GY.neighbors(st, 3, 5).length === 6, 'interior cell has 6 neighbors');
})();

// ---------------------------------------------------------------------------
section('Bridge detection');
(function () {
  var st = emptyBoard(5, 8);
  // A straight radial line of S from ring 0 to ring 4 at angle 3.
  for (var r = 0; r < st.R; r++) st.cells[r][3] = S;
  ok(GY.bridgeWin(st, S).win === true, 'radial S line bridges inner->outer rim');
  ok(GY.loopWin(st, G).win === false, 'no G loop present');

  var st2 = emptyBoard(5, 8);
  for (var r2 = 0; r2 < st2.R - 1; r2++) st2.cells[r2][3] = S; // stops short of outer rim
  ok(GY.bridgeWin(st2, S).win === false, 'S line short of outer rim does NOT bridge');
})();

// ---------------------------------------------------------------------------
section('Loop (encircle) detection');
(function () {
  var st = emptyBoard(5, 8);
  for (var a = 0; a < st.C; a++) st.cells[2][a] = G; // full middle ring
  ok(GY.loopWin(st, G).win === true, 'a full G ring encircles the hole');
  ok(GY.bridgeWin(st, S).win === false, 'that ring is not an S bridge');

  var st2 = emptyBoard(5, 8);
  for (var a2 = 0; a2 < st2.C - 1; a2++) st2.cells[2][a2] = G; // ring with one gap
  ok(GY.loopWin(st2, G).win === false, 'a ring with one gap does NOT encircle');

  // A non-flat loop: rides ring 3 but detours through ring 2 for two cells,
  // built from valid hex steps and self-checked for connectivity.
  var st3 = emptyBoard(6, 12);
  var path = [[3,0],[3,1],[3,2],[3,3],[3,4],[3,5],[2,6],[2,7],[3,7],[3,8],[3,9],[3,10],[3,11]];
  for (var pi = 0; pi < path.length; pi++) st3.cells[path[pi][0]][path[pi][1]] = G;
  // self-check: each consecutive cell (incl. wrap back to start) is adjacent
  var connected = true;
  for (var ci = 0; ci < path.length; ci++) {
    var cur = path[ci], nxt = path[(ci + 1) % path.length];
    var adj = GY.neighbors(st3, cur[0], cur[1]).some(function (p) { return p[0] === nxt[0] && p[1] === nxt[1]; });
    if (!adj) connected = false;
  }
  ok(connected, 'fixture: the detour chain is genuinely connected end-to-end');
  ok(GY.loopWin(st3, G).win === true, 'a non-flat chain detouring inward still encircles');

  // A thick (two-ring-wide) band must also encircle.
  var st4 = emptyBoard(6, 12);
  for (var a4 = 0; a4 < st4.C; a4++) { st4.cells[2][a4] = G; st4.cells[3][a4] = G; }
  ok(GY.loopWin(st4, G).win === true, 'a 2-wide G band encircles the hole');
})();

// ---------------------------------------------------------------------------
section('Mutual exclusion: bridge and loop can never coexist (random partials)');
(function () {
  var rnd = mulberry32(123);
  var sizes = [[5, 8], [7, 14], [4, 6], [6, 11], [9, 18]];
  var both = 0, trials = 0;
  for (var t = 0; t < 40000; t++) {
    var sz = sizes[t % sizes.length];
    var st = emptyBoard(sz[0], sz[1]);
    for (var r = 0; r < st.R; r++) for (var a = 0; a < st.C; a++) {
      var p = rnd();
      st.cells[r][a] = p < 0.4 ? S : (p < 0.8 ? G : EMPTY); // includes empties
    }
    trials++;
    if (GY.bridgeWin(st, S).win && GY.loopWin(st, G).win) both++;
  }
  ok(both === 0, 'S-bridge and G-loop never coexisted across ' + trials + ' partial boards');
})();

// ---------------------------------------------------------------------------
section('NO-DRAW THEOREM (brute force): on a FULL board, S-bridge XOR G-loop');
(function () {
  var rnd = mulberry32(98765);
  var sizes = [[3, 5], [4, 6], [5, 8], [6, 11], [7, 14], [8, 16], [9, 18], [5, 5]];
  var violations = 0, draws = 0, doubles = 0, trials = 0;
  for (var t = 0; t < 60000; t++) {
    var sz = sizes[t % sizes.length];
    var st = emptyBoard(sz[0], sz[1]);
    for (var r = 0; r < st.R; r++) for (var a = 0; a < st.C; a++) {
      st.cells[r][a] = rnd() < 0.5 ? S : G; // fully filled, no empties
    }
    var b = GY.bridgeWin(st, S).win;
    var l = GY.loopWin(st, G).win;
    trials++;
    if (b === l) { violations++; if (!b) draws++; else doubles++; }
  }
  ok(violations === 0,
     'exactly one winner on every full board (' + trials + ' boards; draws=' + draws + ', doubles=' + doubles + ')');
})();

// ---------------------------------------------------------------------------
section('Swap rule mechanics');
(function () {
  // KEEP: P1 stays Spoke(S), P2 becomes Gyre(G); next stone is G played by P2.
  var st = GY.createGame(5, 8);
  GY.openingMove(st, 2, 0);
  ok(st.phase === 'AWAIT_SWAP', 'opening moves into AWAIT_SWAP');
  GY.chooseSwap(st, false);
  ok(st.ownerOfColor[S] === 1 && st.ownerOfColor[G] === 2, 'keep: P1=Spoke, P2=Gyre');
  ok(st.colorToMove === G && st.currentPlayer === 2, 'keep: next stone is G by P2');

  // SWAP: P2 takes Spoke(S)+stone, P1 becomes Gyre(G); next stone is G by P1.
  var st2 = GY.createGame(5, 8);
  GY.openingMove(st2, 2, 0);
  GY.chooseSwap(st2, true);
  ok(st2.ownerOfColor[S] === 2 && st2.ownerOfColor[G] === 1, 'swap: P2=Spoke, P1=Gyre');
  ok(st2.colorToMove === G && st2.currentPlayer === 1, 'swap: next stone is G by P1');
})();

// ---------------------------------------------------------------------------
section('Full random self-play games always terminate with one winner (no draws)');
(function () {
  var rnd = mulberry32(424242);
  var games = 4000, drawsOrStuck = 0, decided = 0, mismatched = 0;
  for (var gI = 0; gI < games; gI++) {
    var st = GY.createGame(5, 8);
    // random opening + random swap decision
    var open = pickEmpty(st, rnd); GY.openingMove(st, open[0], open[1]);
    GY.chooseSwap(st, rnd() < 0.5);
    var guard = 0;
    while (st.phase === 'PLAY') {
      var m = pickEmpty(st, rnd);
      if (!m) break; // board full with no winner -> would be a draw
      GY.move(st, m[0], m[1]);
      if (++guard > 10000) break;
    }
    if (st.phase === 'OVER') {
      decided++;
      // winner's color must match their goal type
      if (st.winColor === S && st.winType !== 'bridge') mismatched++;
      if (st.winColor === G && st.winType !== 'loop') mismatched++;
    } else {
      drawsOrStuck++;
    }
  }
  ok(drawsOrStuck === 0, 'all ' + games + ' self-play games ended with a winner (draws/stuck=' + drawsOrStuck + ')');
  ok(mismatched === 0, 'winner goal type always matched winner color');
  console.log('  (decided games: ' + decided + ')');

  function pickEmpty(state, r) {
    var moves = GY.legalMoves(state);
    if (!moves.length) return null;
    return moves[Math.floor(r() * moves.length)];
  }
})();

// ---------------------------------------------------------------------------
console.log('\n----------------------------------------');
console.log('PASSED: ' + passed + '   FAILED: ' + failed);
process.exit(failed === 0 ? 0 : 1);
