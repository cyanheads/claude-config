# Paper cut-out / collage

## Look

Construction paper cut with scissors and torn by hand, layered a few millimetres apart on a
copy stand and shot frame by frame. Flat matte colours, visible fibre grain, soft contact
shadows that grow with each layer's lift, torn edges that show the paper's white core. Motion
is stop-motion: poses change twelve times a second and every piece "boils" a little between
poses, because a hand moved it.

## Palette tokens

| Token | Hex | Role |
|---|---|---|
| card | `#1F4E5F` | deep teal backdrop sheet |
| sun | `#F2B134` | mustard |
| sunRays | `#E58F2A` | darker orange layer behind the sun |
| far | `#9CBF8E` | sage, farthest hills |
| mid | `#5E9B62` | moss |
| near | `#2F5D3A` | forest, nearest layer |
| cloud | `#F4EBDD` | off-white |
| accent | `#E86F51` | coral, the one warm character |
| core | `#FBF6EC` | the white core exposed along a torn edge |
| shadow | `rgba(20,15,10,0.32)` | one light, one direction, top-left |

Five to seven papers per scene. Mid-saturation, slightly dusty colours read as paper; pure
`#FF0000`-type saturation reads as screen.

## Texture and compositing

| Element | Spec |
|---|---|
| Piece | A polygon cut once in `setup()` into its own bounding-box sprite (never a full-frame canvas per piece). |
| Cut edge | Points every 6–8 px, each jittered ±0.5 px: scissor facets. |
| Torn edge | Jitter ±1.6 px for an outer white "core" fill, then the colour fill shifted 2 px inward on top, so 0–3 px of white shows unevenly. Tear the edge that faces the light. |
| Grain | One full-frame grain canvas (mottling + specks + fibres, light and dark at ≤ 12 % alpha), drawn into each sprite with `source-atop` so it stays inside the shape and travels with it. |
| Shadow | Per-piece silhouette blurred once with `ctx.filter = 'blur()'` at setup. Drawn per frame under the piece, offset `lift × (1.2, 2)` px, alpha 0.32. Lift: hills 2, clouds 6, a flying character 9. |
| Punch-outs | Holes (`destination-out` in the sprite) show the layer beneath: eyes, windows, stars. |
| Lighting | A pre-rendered radial falloff multiplied over the frame (copy-stand lamp), plus ±1.5 % per-pose exposure flicker. |
| Draw order | Back to front, each piece's shadow immediately before the piece, so shadows fall only on what's behind. |

## Motion vocabulary and timing

| Move | What | Timing |
|---|---|---|
| step | All motion evaluated at `stepTime(t, 12)`: poses hold for two frames at 24 fps. | always |
| boil | Per pose, each piece gets a seeded ±0.5 px / ±0.25° nudge from `rngFor(id, 'boil', stepIndex)`. | every pose |
| slide-in | Piece enters from off-frame and settles with easeOutBack, layers staggered 0.15 s back to front. | 0.6–0.8 s |
| rise | Sun or moon rises from behind a layer (draw order hides it, no masking needed). | 1.0–1.4 s · easeOutCubic |
| flap | Two-pose cycle swapped every 2 steps (wing up / wing down), pivoted at the joint. | 3 flaps/s |
| replace | Swap a piece for a differently-cut piece on a step (mouth shapes, a door opening). Never morph. | 1 step |

Timing feel: deliberate, slightly jerky, with overshoots that land in one or two poses. Nothing
glides; even a slow drift advances in visible steps.

## Pitfalls

- **Smooth 24/60 fps motion kills it.** If nothing reads as stepped, it looks like vector
  animation with a texture. Step everything, including camera moves.
- **Boil amplitude above ~1 px or ~0.5° is seasick.** Keep it a whisper; turn it off on the
  backdrop.
- **Shadows in different directions, or blurred per frame.** One light. Blur once in setup.
  `ctx.filter` per frame costs milliseconds per piece.
- **Scaling a piece.** Real paper doesn't grow. Enter by sliding or by replacing with a larger
  cut. A scale animation reads as digital.
- **Grain that doesn't move with the piece** (a screen-space overlay) gives the "shower door"
  effect. Bake grain into each sprite.
- **Full-frame sprites per piece.** Ten 1440² canvases is 80 MB and slow to composite. Use
  bounding boxes with a pad for the shadow blur.

## Example

Six seconds: three torn hill layers slide up with a stagger, a two-layer sun rises behind them,
clouds slide in, and a coral bird with a punched eye flaps across on twos. Paste into
`references/harness.html`.

```js
/* paper cut-out: bbox sprites, torn edges, baked grain, lifted shadows, stepped motion + boil */
const DURATION = 6.0;
const ACTS = [[0, 'card'], [0.2, 'hills'], [0.9, 'sun'], [1.4, 'clouds'], [2.4, 'bird']];
const PAPER = { card: '#1F4E5F', sun: '#F2B134', sunRays: '#E58F2A', far: '#9CBF8E', mid: '#5E9B62', near: '#2F5D3A', cloud: '#F4EBDD', bird: '#E86F51', wing: '#C9563E' };
const CORE = '#FBF6EC', STEP_FPS = 12, SLACK = 96;
let grain, card, lamp; const P = {};

function makeGrain(){
  const [c, g] = makeCanvas(W + SLACK * 2, H + SLACK * 2); const pw = c.width, ph = c.height;
  const img = g.createImageData(pw, ph), d = img.data;
  for (let y = 0; y < ph; y++) for (let x = 0; x < pw; x++){
    const i = (y * pw + x) * 4, n = (valueNoise(x / (60 * DPR), y / (60 * DPR), 3) - 0.5) * 0.55 + (hash2(x, y, 5) - 0.5) * 0.7;
    const v = n > 0 ? 255 : 0; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = Math.min(255, Math.abs(n) * 60);
  }
  g.putImageData(img, 0, 0);
  const r = rngFor('grain', 'fibres'); g.lineWidth = 0.7;
  for (let k = 0; k < 900; k++){ const x = r() * (W + SLACK * 2), y = r() * (H + SLACK * 2), a = r() * 6.28, l = 3 + r() * 10; g.strokeStyle = r() < 0.5 ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.07)'; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a + 0.6) * l * 0.5, y + Math.sin(a + 0.6) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
  return c;
}

/** Cut a polygon into a bbox sprite with grain baked in, plus its blurred shadow. */
function cut(id, pts, color, { torn = false, lift = 2, pivot = null, holes = [] } = {}){
  const xs = pts.map(p => p[0]), ys = pts.map(p => p[1]), pad = 20 + lift * 2;
  const bx = Math.floor(Math.min(...xs)) - pad, by = Math.floor(Math.min(...ys)) - pad;
  const bw = Math.ceil(Math.max(...xs)) + pad - bx, bh = Math.ceil(Math.max(...ys)) + pad - by;
  const rng = rngFor('cut', id);
  const path = (jag, dy) => { const p = new Path2D(); pts.forEach(([x, y], i) => { const px = x - bx + (rng() - 0.5) * jag, py = y - by + dy + (rng() - 0.5) * jag; i ? p.lineTo(px, py) : p.moveTo(px, py); }); p.closePath(); return p; };
  const outer = path(torn ? 3.2 : 1.0, 0);
  const [sprite, g] = makeCanvas(bw, bh);
  if (torn){ g.fillStyle = CORE; g.fill(outer); g.fillStyle = color; g.fill(path(1.4, 2.2)); }
  else { g.fillStyle = color; g.fill(outer); }
  g.globalCompositeOperation = 'destination-out';
  for (const [hx, hy, hr] of holes){ g.beginPath(); g.arc(hx - bx, hy - by, hr, 0, 6.2832); g.fill(); }
  g.globalCompositeOperation = 'source-atop';
  g.drawImage(grain, -bx - SLACK + (rng() - 0.5) * 40, -by - SLACK + (rng() - 0.5) * 40, W + SLACK * 2, H + SLACK * 2);
  const [shadow, sg] = makeCanvas(bw, bh);
  sg.filter = `blur(${(2 + lift * 0.8) * DPR}px)`; sg.fillStyle = '#000'; sg.fill(outer); sg.filter = 'none';
  const [px, py] = pivot ?? [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2];
  return { id, sprite, shadow, bx, by, bw, bh, lift, px, py };
}

/** Draw a piece at offset (x, y), rotated about its pivot, with this pose's boil. */
function place(g, pc, x, y, rot, step){
  const j = rngFor(pc.id, 'boil', step), jx = (j() - 0.5) * 1.0, jy = (j() - 0.5) * 1.0, jr = (j() - 0.5) * 0.009;
  g.save(); g.translate(pc.px + x + jx, pc.py + y + jy); g.rotate(rot + jr); g.translate(-pc.px, -pc.py);
  g.globalAlpha = 0.32; g.drawImage(pc.shadow, pc.bx + pc.lift * 1.2, pc.by + pc.lift * 2, pc.bw, pc.bh);
  g.globalAlpha = 1; g.drawImage(pc.sprite, pc.bx, pc.by, pc.bw, pc.bh);
  g.restore();
}

const hill = (seed, base, amp, k) => { const ph = rngFor('hill', seed)() * 6.28, pts = []; for (let x = -30; x <= W + 30; x += 8) pts.push([x, base - amp * (0.5 + 0.5 * Math.sin(x * k + ph)) - 22 * (fbm(x * 0.02, 1.5, seed, 3) - 0.5)]); pts.push([W + 30, H + 40], [-30, H + 40]); return pts; };
const star = (cx, cy, r0, r1, n) => Array.from({ length: n * 2 }, (_, i) => { const a = i / (n * 2) * 6.2832, r = i % 2 ? r0 : r1; return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; });
const ring = (cx, cy, r, n = 64) => Array.from({ length: n }, (_, i) => [cx + Math.cos(i / n * 6.2832) * r, cy + Math.sin(i / n * 6.2832) * r]);
const cloud = (cx, cy, rx, ry) => Array.from({ length: 72 }, (_, i) => { const a = i / 72 * 6.2832, b = 1 + 0.14 * Math.abs(Math.sin(a * 4)); return [cx + Math.cos(a) * rx * b, Math.min(cy + ry * 0.45, cy + Math.sin(a) * ry * b)]; });

async function setup(){
  grain = makeGrain(); await tick(0.3);
  const [cc, cg] = makeCanvas(); card = cc; cg.fillStyle = PAPER.card; cg.fillRect(0, 0, W, H);
  cg.globalCompositeOperation = 'source-atop'; cg.drawImage(grain, -SLACK, -SLACK, W + SLACK * 2, H + SLACK * 2);
  const [lc, lg] = makeCanvas(); lamp = lc;                                         // copy-stand lamp falloff
  const gr = lg.createRadialGradient(W * 0.35, H * 0.3, 80, W * 0.5, H * 0.5, W * 0.8);
  gr.addColorStop(0, '#ffffff'); gr.addColorStop(1, '#b9b0a6'); lg.fillStyle = gr; lg.fillRect(0, 0, W, H);
  P.rays = cut('rays', star(500, 250, 82, 104, 14), PAPER.sunRays, { lift: 1 });
  P.sun = cut('sun', ring(500, 250, 74), PAPER.sun, { lift: 2 });
  P.cloudA = cut('cloudA', cloud(190, 170, 92, 42), PAPER.cloud, { lift: 6 });
  P.cloudB = cut('cloudB', cloud(585, 115, 70, 32), PAPER.cloud, { lift: 6 });
  P.far = cut('far', hill(11, 470, 70, 0.0085), PAPER.far, { torn: true });
  P.mid = cut('mid', hill(23, 550, 80, 0.011), PAPER.mid, { torn: true });
  P.near = cut('near', hill(37, 640, 60, 0.014), PAPER.near, { torn: true });
  P.bird = cut('bird', [[-54, 4], [-14, -18], [32, -14], [62, -29], [54, -4], [14, 18], [-25, 14]], PAPER.bird, { lift: 9, pivot: [0, 0], holes: [[40, -16, 4]] });
  P.wing = cut('wing', [[-14, -7], [22, -7], [-7, -62]], PAPER.wing, { lift: 10, pivot: [4, -7] });
}

function render(g, t){
  const ts = stepTime(t, STEP_FPS), step = Math.round(ts * STEP_FPS);              // every pose holds two frames
  const enter = (start, dist) => dist * (1 - ease.outBack(prog(ts, start, 0.7)));
  g.drawImage(card, 0, 0, W, H);
  const sunY = 300 * (1 - ease.outCubic(prog(ts, 0.9, 1.2)));
  place(g, P.rays, 0, sunY, ts * 0.12, step); place(g, P.sun, 0, sunY, 0, step);
  place(g, P.cloudA, -enter(1.4, 360), 0, 0, step); place(g, P.cloudB, enter(1.6, 300), 0, 0, step);
  place(g, P.far, 0, enter(0.2, 320), 0, step); place(g, P.mid, 0, enter(0.35, 320), 0, step); place(g, P.near, 0, enter(0.5, 320), 0, step);
  if (ts >= 2.4){
    const p = prog(ts, 2.4, 3.6), x = lerp(-60, W + 60, p), y = 330 + Math.sin(p * 9) * 26, tilt = Math.cos(p * 9) * 0.12;
    const up = (step >> 1) % 2 === 0;                                                // wing pose swaps every 2 steps
    place(g, P.bird, x, y, tilt, step); place(g, P.wing, x, y, tilt + (up ? 0 : 2.6), step);
  }
  g.save(); g.globalCompositeOperation = 'multiply'; g.globalAlpha = 0.55 + (hash2(step, 0, 9) - 0.5) * 0.03; g.drawImage(lamp, 0, 0, W, H); g.restore();
}
```
