#!/usr/bin/env python3
"""
GYRE — print-and-play board generator.
Copyright (c) 2026 Ideatrino <ideatrino@proton.me>. All Rights Reserved.

Renders a printable SVG whose nodes and edges exactly mirror the rules engine
(src/gyre-engine.js): R concentric rings of C cells, hexagonal adjacency with
the angular axis wrapped. Place physical tokens on the circles.
"""
import math, os

DIRS = [(0, 1), (0, -1), (1, 0), (-1, 0), (1, -1), (-1, 1)]

def neighbors(R, C, r, a):
    out = []
    for dr, da in DIRS:
        nr = r + dr
        if 0 <= nr < R:
            out.append((nr, (a + da) % C))
    return out

def board_svg(R, C, W=820, H=980):
    cx, cy = W / 2, H / 2 + 30
    board_r = min(W, H - 120) / 2 - 36
    hole_r = board_r * 0.26
    node_r = max(7, min(15, (board_r - hole_r) / R * 0.40))

    def pos(r, a):
        rad = hole_r + (r + 0.5) / R * (board_r - hole_r)
        th = ((a + 0.5 * (r % 2)) / C) * 2 * math.pi - math.pi / 2
        return cx + rad * math.cos(th), cy + rad * math.sin(th)

    P = [["#0f1830", "#5a657f"]]  # not used; keep palette inline below
    s = []
    s.append(f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" '
             f'viewBox="0 0 {W} {H}" font-family="Helvetica,Arial,sans-serif">')
    s.append(f'<rect width="{W}" height="{H}" fill="#ffffff"/>')
    # title block
    s.append(f'<text x="{W/2}" y="56" text-anchor="middle" font-size="34" '
             f'font-weight="700" letter-spacing="10" fill="#11182c">GYRE</text>')
    s.append(f'<text x="{W/2}" y="80" text-anchor="middle" font-size="12.5" '
             f'letter-spacing="2" fill="#5a657f">PRINT &amp; PLAY  ·  {R} RINGS × {C}  ·  '
             f'SPOKE bridges rim-to-rim  ·  GYRE loops the hole</text>')

    # rims + hole + seam
    s.append(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{hole_r*0.86:.1f}" '
             f'fill="#f4f6fb" stroke="#c4cbdc" stroke-width="1.5"/>')
    s.append(f'<text x="{cx:.1f}" y="{cy+4:.1f}" text-anchor="middle" font-size="11" '
             f'fill="#9aa3ba" letter-spacing="2">HOLE</text>')
    s.append(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{board_r+node_r*1.1:.1f}" '
             f'fill="none" stroke="#c4cbdc" stroke-width="1.5"/>')
    s.append(f'<line x1="{cx:.1f}" y1="{cy-hole_r:.1f}" x2="{cx:.1f}" '
             f'y2="{cy-board_r-node_r:.1f}" stroke="#e2e6ef" stroke-width="1.2" '
             f'stroke-dasharray="3 4"/>')

    # edges (faithful adjacency)
    drawn = set()
    for r in range(R):
        for a in range(C):
            x1, y1 = pos(r, a)
            for (nr, na) in neighbors(R, C, r, a):
                key = tuple(sorted([(r, a), (nr, na)]))
                if key in drawn:
                    continue
                drawn.add(key)
                x2, y2 = pos(nr, na)
                s.append(f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" '
                         f'stroke="#d3d9e6" stroke-width="1"/>')

    # nodes (empty circles to drop tokens onto)
    for r in range(R):
        for a in range(C):
            x, y = pos(r, a)
            s.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{node_r:.1f}" '
                     f'fill="#ffffff" stroke="#8b93ad" stroke-width="1.3"/>')

    # legend
    ly = H - 40
    s.append(f'<circle cx="64" cy="{ly}" r="9" fill="#f5a524" stroke="#7a5a1c"/>')
    s.append(f'<text x="80" y="{ly+5}" font-size="13" fill="#11182c">SPOKE — bridge inner rim to outer rim</text>')
    s.append(f'<circle cx="430" cy="{ly}" r="9" fill="#2dd4bf" stroke="#1d5e57"/>')
    s.append(f'<text x="446" y="{ly+5}" font-size="13" fill="#11182c">GYRE — encircle the hole</text>')
    s.append(f'<text x="{W-20}" y="{H-18}" text-anchor="end" font-size="10.5" '
             f'fill="#9aa3ba">© 2026 Ideatrino — All Rights Reserved</text>')
    s.append('</svg>')
    return "\n".join(s)

if __name__ == "__main__":
    out_dir = os.path.join(os.path.dirname(__file__), "..", "docs", "printable")
    out_dir = os.path.abspath(out_dir)
    os.makedirs(out_dir, exist_ok=True)
    for (R, C, name) in [(7, 14, "gyre-7x14.svg"), (5, 10, "gyre-5x10.svg")]:
        with open(os.path.join(out_dir, name), "w") as f:
            f.write(board_svg(R, C))
        print("wrote", os.path.join("docs/printable", name))
