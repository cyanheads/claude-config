# Flat vector / motion graphics

## Look

The explainer and brand-ident look: flat geometric shapes in a tight palette, no outlines, no
texture, no gradients (or one, sparingly). Everything is legible at a glance, so the motion
carries the personality: snappy expo and back easing, overshoot, staggered offsets, shapes that
morph into each other, lines that draw themselves on, and circle wipes between sections.

## Palette tokens

| Token | Hex | Role |
|---|---|---|
| navy | `#1B1F3B` | ground |
| cream | `#FFF4E0` | primary figure, second ground after a wipe |
| coral | `#FF6B5B` | accent 1 |
| sun | `#FFC94A` | accent 2 |
| teal | `#2EC4B6` | accent 3 |

One dark, one light, three saturated accents of similar lightness. Every frame should pass a
squint test: figure clearly separates from ground.

## Texture and compositing

| Element | Spec |
|---|---|
| Shapes | Plain `fill` / `stroke` on the main canvas each frame: vectors are cheap, so no caching is needed until a frame has hundreds of paths. Cache a `Path2D` for any complex static outline. |
| Morphs | Sample both shapes to the same point count with matching start angles, lerp point-wise. Circle ↔ rounded square is just `roundRect` with the radius going from half-side to small. Disc ↔ ring is a stroke whose width shrinks while its radius grows. |
| Draw-on | Trim paths: stroke only the slice between fractions a and b of a measured polyline (`trimPath` in the harness). Head and tail on offset easings = a stroke that travels. |
| Colour | Tween colours in RGB only between neighbours of similar lightness; otherwise cut. |
| Grain (optional) | A static 2–3 % noise overlay keeps large flats from banding in H.264. |
| Isometric variant | Same palette and motion, with geometry through `iso(x, y, z) = [(x - y) · cos 30°, (x + y) · sin 30° - z]` and three tones per hue (top, left, right faces). |

## Motion vocabulary and timing

| Move | What | Timing |
|---|---|---|
| pop | Scale 0 → 1 on a damped spring (`spring(t, 2.4, 0.4)`): one overshoot, settles. | ~0.5 s |
| anticipate | Squash (x +18 %, y −18 %) just before a fast move. | 0.12 s |
| fly | Position on easeOutExpo, siblings staggered 60–100 ms. | 0.5–0.7 s |
| smear | Stretch along the velocity above ~600 px/s, up to +40 %, inverse on the other axis. Velocity comes from evaluating position at t and t − 1/120, so it stays pure. Below the threshold, no stretch: a slow orbit that smears looks squashed, not fast. | while fast |
| morph | Shape-to-shape interpolation. | 0.4–0.5 s · easeInOutCubic |
| draw-on | Trim path 0 → 1. | 0.3–0.5 s · easeOutCubic |
| burst | Radial rays: head and tail on the same easing, tail delayed 0.12 s. | 0.35 s · easeOutQuart |
| orbit | Group rotation about a centre. | 0.6 s · easeInOutCubic |
| circle-wipe | Concentric discs in 2–3 colours expanding from a point, 80 ms apart, ending on the next ground colour. | 0.5 s · easeOutQuart |

Timing feel: fast in, slow out, everything offset. Nothing starts or stops at the same frame as
its neighbour; nothing moves linearly except rotation holds.

## Pitfalls

- **Linear or easeInOutQuad everywhere** looks like a slide transition. Use expo-out for
  arrivals and back/spring for things that land.
- **Everything on the same beat.** Stagger siblings 60–100 ms; offset color and position
  changes.
- **Morphing between shapes with different point counts or start angles** makes them twist and
  fold. Resample both to N points starting at the same angle.
- **Overshoot on everything** feels rubbery. Overshoot what lands; ease-out what stops.
- **Thin hairlines** (< 2 px at 720) shimmer after H.264 compression. Keep strokes ≥ 3 px.
- **Big flat areas band** after compression when they're subtle gradients. Flat fills, or add the
  static grain.

## Example

Five seconds: a dot pops, anticipates, splits into three shapes that fly out with smear and
morph (rounded square, triangle, ring), connecting lines draw on, a burst fires in the middle,
the group orbits, a three-colour circle wipe lands on cream, and the shapes pop back in a row.
Paste into `references/harness.html`.

```js
/* flat motion: spring pop, anticipation, expo fly + velocity smear, point-wise morph, trim paths, burst, circle wipe */
const DURATION = 5.0;
const ACTS = [[0, 'pop'], [0.5, 'split'], [1.1, 'morph'], [1.6, 'connect'], [2.2, 'burst'], [2.8, 'orbit'], [3.4, 'wipe'], [4.1, 'end']];
const C = { navy: '#1B1F3B', cream: '#FFF4E0', coral: '#FF6B5B', sun: '#FFC94A', teal: '#2EC4B6' };
const R = 46, ORBIT = 170, N = 48;
const SHAPES = [
  { kind: 'square', color: C.teal, a: -Math.PI / 2, delay: 0 },
  { kind: 'tri', color: C.coral, a: Math.PI / 6, delay: 0.08 },
  { kind: 'ring', color: C.sun, a: 5 * Math.PI / 6, delay: 0.16 },
];

const mixHex = (a, b, p) => { const A = hexRGB(a), B = hexRGB(b); return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], p))).join(',')})`; };
async function setup(){}

function shapePos(s, t){
  const fly = ease.outExpo(prog(t, 0.62 + s.delay, 0.6)), spin = ease.inOutCubic(prog(t, 2.8, 0.6)) * 2.0944;
  const a = s.a + spin; return [CX + Math.cos(a) * fly * ORBIT, CY + Math.sin(a) * fly * ORBIT];
}
function triPath(g, x, y, r, m){                                                   // circle → triangle, same N, same start angle
  g.beginPath();
  for (let k = 0; k <= N; k++){
    const s = (k % N) / N, a = -Math.PI / 2 + s * 6.2832, e = Math.floor(s * 3), f = s * 3 - e;
    const a0 = -Math.PI / 2 + e * 2.0944, a1 = a0 + 2.0944;
    const px = lerp(Math.cos(a), lerp(Math.cos(a0), Math.cos(a1), f) * 1.3, m), py = lerp(Math.sin(a), lerp(Math.sin(a0), Math.sin(a1), f) * 1.3, m);
    k ? g.lineTo(x + px * r, y + py * r) : g.moveTo(x + px * r, y + py * r);
  }
  g.closePath();
}
function drawShape(g, s, t, x, y, scale, m){
  const col = mixHex(C.cream, s.color, m), r = R * scale;
  g.fillStyle = g.strokeStyle = col;
  if (s.kind === 'square'){ g.beginPath(); g.roundRect(x - r, y - r, 2 * r, 2 * r, lerp(r, r * 0.22, m)); g.fill(); }
  else if (s.kind === 'tri'){ triPath(g, x, y + r * 0.15 * m, r, m); g.fill(); }
  else { g.lineWidth = lerp(r, r * 0.32, m); g.beginPath(); g.arc(x, y, lerp(r / 2, r * 0.84, m), 0, 6.2832); g.stroke(); }
}
/** Stretch along velocity; velocity from the pure position function at t and t − 1/120. */
function withSmear(g, s, t, draw){
  const [x, y] = shapePos(s, t), [px, py] = shapePos(s, t - 1 / 120), vx = (x - px) * 120, vy = (y - py) * 120;
  const k = 1 + clamp01((Math.hypot(vx, vy) - 600) / 4000) * 0.4, a = Math.atan2(vy, vx);  // only fast moves smear
  g.save(); g.translate(x, y); g.rotate(a); g.scale(k, 1 / k); g.rotate(-a); draw(0, 0); g.restore();
}

function render(g, t){
  g.fillStyle = C.navy; g.fillRect(0, 0, W, H);
  g.lineCap = 'round';
  SHAPES.forEach((s, i) => {                                                       // connectors draw on, trimmed clear of the shapes
    const d = ease.outCubic(prog(t, 1.6 + i * 0.1, 0.4)); if (d <= 0) return;
    const [x0, y0] = shapePos(s, t), [x1, y1] = shapePos(SHAPES[(i + 1) % 3], t), L = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / L, uy = (y1 - y0) / L, gap = R + 16;
    g.strokeStyle = C.cream; g.lineWidth = 4; g.beginPath(); g.moveTo(x0 + ux * gap, y0 + uy * gap); g.lineTo(x0 + ux * lerp(gap, L - gap, d), y0 + uy * lerp(gap, L - gap, d)); g.stroke();
  });
  for (let i = 0; i < 12; i++){                                                    // burst: head and tail on offset easings
    const st = 2.2 + (i % 2) * 0.05, head = ease.outQuart(prog(t, st, 0.35)), tail = ease.outQuart(prog(t, st + 0.12, 0.35));
    if (head <= 0 || tail >= 1) continue;
    const a = i / 12 * 6.2832, r0 = lerp(34, 120, tail), r1 = lerp(34, 120, head);
    g.strokeStyle = i % 2 ? C.sun : C.teal; g.lineWidth = 6; g.beginPath(); g.moveTo(CX + Math.cos(a) * r0, CY + Math.sin(a) * r0); g.lineTo(CX + Math.cos(a) * r1, CY + Math.sin(a) * r1); g.stroke();
  }
  if (t < 0.62){                                                                   // pop + anticipation squash
    const sc = spring(t - 0.1, 2.4, 0.4), q = Math.sin(Math.PI * prog(t, 0.5, 0.12)) * 0.18;
    g.save(); g.translate(CX, CY); g.scale(sc * (1 + q), sc * (1 - q)); g.fillStyle = C.cream; g.beginPath(); g.arc(0, 0, R, 0, 6.2832); g.fill(); g.restore();  // radius R: the split starts from this exact disc
  } else {
    for (const s of SHAPES) withSmear(g, s, t, (x, y) => drawShape(g, s, t, x, y, 1, ease.inOutCubic(prog(t, 1.1 + s.delay, 0.45))));
  }
  [C.coral, C.sun, C.cream].forEach((c, i) => {                                    // circle wipe onto the next ground
    const r = ease.outQuart(prog(t, 3.4 + i * 0.08, 0.5)) * 530; if (r <= 0) return;
    g.fillStyle = c; g.beginPath(); g.arc(CX, CY, r, 0, 6.2832); g.fill();
  });
  SHAPES.forEach((s, i) => {
    const sc = spring(t - 4.1 - i * 0.08, 2.4, 0.4) * 0.5; if (sc <= 0) return;
    drawShape(g, s, t, CX + (i - 1) * 84, CY, sc, 1);
  });
}
```
