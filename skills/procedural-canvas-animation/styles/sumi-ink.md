# Ink brush / sumi-e

## Look

Black ink on fibrous rice paper. Each mark is one brush stroke written in a single motion: a
pressed, wet start, a body whose width follows the brush pressure, and a dry tail where the
outer hairs run out of ink and leave broken streaks (*kasure*). Wet ink bleeds a little into the
paper. Most of the frame stays empty, and that emptiness is part of the composition. One
vermilion seal is the only colour.

## Palette tokens

| Token | Hex | Role |
|---|---|---|
| paper | `#F2EDE1` | warm rice paper, long kozo fibres, faint mottling |
| ink | `#16140F` | sumi black, warm; never pure `#000` |
| ink tones | ink at 35 % / 60 % / 80 % / 100 % | diluted ink for distance and hierarchy |
| seal | `#C23B2C` | vermilion paste, carved white lines, uneven pressure |

Monochrome plus one red mark. A second colour (a pale indigo or ochre wash) is the most a piece
takes before it stops reading as ink painting.

## Texture and compositing

| Element | Spec |
|---|---|
| Stroke model | A centreline (catmull-smoothed control points, resampled every 1.5 px), a pressure profile `p(s)` over normalised length, and a brush of N hairs (N ≈ 1.4 × width). Each hair rides at a fixed offset across the brush, scaled by `p(s)`, so the hairs converge where pressure lifts and the stroke tapers by itself. Outer hairs touch down a little later than the centre, which rounds the head instead of leaving a flat chisel. |
| Ink load | Each hair has a load that drains along the stroke; outer hairs drain faster. Noise on the load breaks hairs into dry streaks near the tail. Hairs are stroked in runs of constant alpha (avoids beading at segment joints). |
| Bleed | A blurred copy of the stroke (`blur(3px)` once in setup) drawn under it at low alpha. Ramp its alpha in after the stroke lands and it reads as ink soaking in. |
| Tone | Lighter ink = lower `tone` multiplier on the whole stroke. Never grey by mixing with white. |
| Write-on | The stroke sprite is built once. Each frame, a scratch canvas gets the centreline prefix stroked wide (round caps), then the sprite drawn `source-in`. Finished strokes skip the mask. |
| Seal | Square of seal paste with carved white lines, edge roughness and noise-gated voids, composited with `multiply`. |
| Paper | Pre-rendered once: base colour, low-frequency mottling, ~250 long faint fibres. |

## Motion vocabulary and timing

| Move | What | Timing |
|---|---|---|
| write | Brush travels the centreline; the reveal follows it. Accelerate out of the press, decelerate into the lift. | 0.2–1.6 s · easeInOutSine |
| flick | A leaf or grass stroke: press, fast pull, lift to a point. | 0.12–0.2 s · easeOutQuad |
| soak | Bleed layer fades in after the stroke. | ~0.8 s · linear |
| ma | A held pause between strokes. The rhythm of writing lives in the gaps. | 0.08–0.3 s |
| stamp | Seal lands: appears at full strength with a 6 % press-in scale. | 0.12 s · easeOutQuart |

Timing feel: unhurried, with long holds and sudden fast strokes. Order matters: write strokes in
the order a painter would (enso in one breath, bamboo bottom to top, leaves last).

## Pitfalls

- **Uniform-width lines read as vector.** The pressure profile does the work; a stroke needs at
  least a press, a swell, and a lift.
- **Building the stroke per frame from its prefix** (re-running the hair sim up to progress p)
  is slow and the dry streaks shift as p grows. Build once, reveal with a mask.
- **The mask reveals overlapping parts early.** A stroke that crosses itself shows the later
  pass when the mask reaches the earlier one. Split self-crossing marks into separate strokes.
- **Pure black ink and grey paper** look like a printout. Keep both warm.
- **Filling the frame.** Ink painting needs 50–70 % empty paper.
- **A stroke growing from both ends or fading in.** Brushes move one way.

## Example

Seven seconds: an enso written in one breath, a bamboo stalk built bottom to top with pauses at
each node, a twig and five leaves flicked in, then the seal. Paste into
`references/harness.html`.

```js
/* sumi-e: hair-simulated brush strokes built once, revealed by a centreline mask, bleed + seal */
const DURATION = 7.0;
const ACTS = [[0, 'paper'], [0.4, 'enso'], [2.3, 'bamboo'], [4.3, 'leaves'], [5.6, 'seal']];
const INK = '#16140F', SEAL_RED = '#C23B2C';
let paper, scratch, sg, seal; const STROKES = [];

function makePaper(){
  const [c, g] = makeCanvas(); const pw = c.width, ph = c.height;
  const img = g.createImageData(pw, ph), d = img.data;
  for (let y = 0; y < ph; y++) for (let x = 0; x < pw; x++){
    const i = (y * pw + x) * 4, v = (valueNoise(x / (90 * DPR), y / (90 * DPR), 2) - 0.5) * 8 + (hash2(x, y, 4) - 0.5) * 5;
    d[i] = 0xF2 + v; d[i + 1] = 0xED + v; d[i + 2] = 0xE1 + v * 0.9; d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const r = rngFor('paper', 'kozo');
  for (let k = 0; k < 260; k++){
    const x = r() * W, y = r() * H, a = r() * 6.28, l = 30 + r() * 110, bend = (r() - 0.5) * 40;
    g.strokeStyle = r() < 0.75 ? 'rgba(150,138,115,0.10)' : 'rgba(255,255,255,0.45)'; g.lineWidth = 0.4 + r() * 0.7;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * l / 2 - Math.sin(a) * bend, y + Math.sin(a) * l / 2 + Math.cos(a) * bend, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  return c;
}

function catmull(pts, per = 10){
  if (pts.length < 3) return pts.slice(); const out = [];
  for (let i = 0; i < pts.length - 1; i++){
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < per; k++){ const t = k / per, t2 = t * t, t3 = t2 * t; out.push([0, 1].map(j => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3))); }
  }
  out.push(pts[pts.length - 1]); return out;
}
function resample(pts, step){ const m = measure(pts), out = []; let i = 1; for (let d = 0; d <= m.L; d += step){ while (i < m.len.length - 1 && m.len[i] < d) i++; const f = (d - m.len[i - 1]) / ((m.len[i] - m.len[i - 1]) || 1); out.push([lerp(pts[i - 1][0], pts[i][0], f), lerp(pts[i - 1][1], pts[i][1], f)]); } return out; }

/** Simulate one brush stroke into a bbox sprite (+ blurred bleed). Timing travels with it. */
function brush(id, ctrl, { width, start, dur, profile, dry = 0.5, tone = 1, easing = ease.inOutSine }){
  const path = resample(catmull(ctrl), 1.5), m = measure(path), n = path.length;
  const xs = path.map(p => p[0]), ys = path.map(p => p[1]), pad = width + 12;
  const bx = Math.floor(Math.min(...xs) - pad), by = Math.floor(Math.min(...ys) - pad);
  const bw = Math.ceil(Math.max(...xs) + pad) - bx, bh = Math.ceil(Math.max(...ys) + pad) - by;
  const nx = [], ny = [];
  for (let i = 0; i < n; i++){ const a = path[Math.max(0, i - 1)], b = path[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1; nx.push(-dy / L); ny.push(dx / L); }
  const [sprite, g] = makeCanvas(bw, bh); g.strokeStyle = INK; g.lineCap = g.lineJoin = 'round';
  const rng = rngFor('brush', id), NB = Math.max(10, Math.round(width * 1.4));
  for (let b = 0; b < NB; b++){
    const off = b / (NB - 1) - 0.5 + (rng() - 0.5) * 0.05, edge = Math.abs(off) * 2;
    const load = 0.8 + rng() * 0.25, drain = dry * (0.5 + rng()), seed = rng() * 1000, lw = width / NB * 2.4 * (0.7 + rng() * 0.6);
    const touch = (0.25 + edge * edge) * 0.05 * (0.5 + rng());          // outer hairs touch down later → rounded head
    let run = null;
    const flush = () => { if (run && run.pts.length > 1){ g.globalAlpha = run.a * tone; g.lineWidth = lw; g.beginPath(); run.pts.forEach(([x, y], k) => k ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); } run = null; };
    for (let i = 0; i < n; i++){
      const s = m.len[i] / m.L, w = width * profile(s);
      const ink = load - drain * s * (0.5 + edge) + (valueNoise(m.len[i] * 0.05, seed, 7) - 0.5) * 0.55;
      if (ink < 0.28 || w < 0.4 || s < touch * Math.min(1, m.L / 200)){ flush(); continue; }
      const wob = (valueNoise(m.len[i] * 0.02, seed, 9) - 0.5) * 0.06;
      const x = path[i][0] - bx + nx[i] * (off + wob) * w, y = path[i][1] - by + ny[i] * (off + wob) * w;
      const a = Math.round(Math.min(1, ink) * 6) / 6;
      if (!run || run.a !== a){ const last = run && run.pts[run.pts.length - 1]; flush(); run = { a, pts: last ? [last] : [] }; }
      run.pts.push([x, y]);
    }
    flush();
  }
  const [bleed, bg] = makeCanvas(bw, bh); bg.filter = `blur(${3 * DPR}px)`; bg.drawImage(sprite, 0, 0, bw, bh); bg.filter = 'none';
  STROKES.push({ sprite, bleed, bx, by, bw, bh, m, width, start, dur, easing });
}

/** Reveal the first fraction p of a stroke: centreline prefix as a mask, image drawn source-in. */
function masked(g, s, img, alpha, p){
  sg.setTransform(DPR, 0, 0, DPR, 0, 0); sg.globalCompositeOperation = 'source-over'; sg.globalAlpha = 1;
  sg.clearRect(s.bx, s.by, s.bw, s.bh);
  sg.lineCap = sg.lineJoin = 'round'; sg.lineWidth = s.width * 1.6; sg.strokeStyle = '#000'; trimPath(sg, s.m, 0, p);
  sg.globalCompositeOperation = 'source-in'; sg.drawImage(img, s.bx, s.by, s.bw, s.bh);
  g.globalAlpha = alpha; g.drawImage(scratch, s.bx * DPR, s.by * DPR, s.bw * DPR, s.bh * DPR, s.bx, s.by, s.bw, s.bh); g.globalAlpha = 1;  // source rect is in device px
}
function drawStroke(g, s, t){
  const p = s.easing(prog(t, s.start, s.dur)); if (p <= 0) return;
  const wet = 0.42 * prog(t, s.start, s.dur + 0.8);                           // soak: bleed creeps in after the stroke
  if (p >= 1){ g.globalAlpha = wet; g.drawImage(s.bleed, s.bx, s.by, s.bw, s.bh); g.globalAlpha = 1; g.drawImage(s.sprite, s.bx, s.by, s.bw, s.bh); return; }
  masked(g, s, s.bleed, wet, p); masked(g, s, s.sprite, 1, p);
}

function makeSeal(x, y, size){
  const [c, g] = makeCanvas(size + 8, size + 8), r = rngFor('seal');
  g.fillStyle = SEAL_RED; g.beginPath();
  for (let i = 0; i < 40; i++){ const k = i / 40 * 4, side = Math.floor(k), f = k - side, j = () => (r() - 0.5) * 1.6;   // rough square edge
    const [px, py] = [[f, 0], [1, f], [1 - f, 1], [0, 1 - f]][side]; i ? g.lineTo(4 + px * size + j(), 4 + py * size + j()) : g.moveTo(4 + px * size + j(), 4 + py * size + j()); }
  g.closePath(); g.fill();
  g.globalCompositeOperation = 'destination-out'; g.strokeStyle = '#000'; g.lineWidth = size * 0.07; g.lineCap = 'square';
  const u = size / 10, o = 4;                                                  // carved square spiral, not a real character
  g.beginPath(); g.moveTo(o + 2 * u, o + 2 * u); g.lineTo(o + 8 * u, o + 2 * u); g.lineTo(o + 8 * u, o + 8 * u); g.lineTo(o + 3.5 * u, o + 8 * u); g.lineTo(o + 3.5 * u, o + 4 * u); g.lineTo(o + 6.5 * u, o + 4 * u); g.lineTo(o + 6.5 * u, o + 6.4 * u); g.stroke();
  const pw = c.width, ph = c.height, img = g.getImageData(0, 0, pw, ph), d = img.data;   // uneven paste: noise-gated voids
  for (let yy = 0; yy < ph; yy++) for (let xx = 0; xx < pw; xx++){ const i = (yy * pw + xx) * 4; if (valueNoise(xx / (3 * DPR), yy / (3 * DPR), 31) < 0.22) d[i + 3] *= 0.25; }
  g.putImageData(img, 0, 0);
  return { c, x: x - 4, y: y - 4, s: size + 8 };
}

async function setup(){
  paper = makePaper();
  [scratch, sg] = makeCanvas();
  const CXE = 285, CYE = 330, R = 195;
  const enso = Array.from({ length: 26 }, (_, i) => { const a = -1.9 + i / 25 * 5.75, r = R * (1 + 0.025 * Math.sin(2 * a + 1)) * (1 - 0.05 * i / 25); return [CXE + Math.cos(a) * r, CYE + Math.sin(a) * r]; });
  brush('enso', enso, { width: 36, start: 0.4, dur: 1.6, dry: 1.0, profile: s => Math.min(1, s / 0.04) * (1.05 - 0.4 * s) });
  await tick(0.3);
  const segs = [[700, 572], [566, 432], [426, 300], [294, 150]], stalk = s => 0.85 + 0.3 * Math.exp(-(((s - 0.04) / 0.05) ** 2)) + 0.2 * Math.exp(-(((s - 0.97) / 0.04) ** 2));
  segs.forEach(([y0, y1], k) => {
    const x0 = 548 + (700 - y0) * 0.06, x1 = 548 + (700 - y1) * 0.06;
    brush(`stalk${k}`, [[x0, y0], [lerp(x0, x1, 0.5) + 2, lerp(y0, y1, 0.5)], [x1, y1]], { width: 24, start: 2.3 + k * 0.4, dur: 0.32, dry: 0.45, tone: 0.82, profile: stalk });
    brush(`node${k}`, [[x1 - 15, y1 + 2], [x1, y1 - 3], [x1 + 16, y1 + 1]], { width: 7, start: 2.3 + k * 0.4 + 0.33, dur: 0.06, dry: 0.2, profile: s => Math.sin(Math.PI * s) * 0.8 + 0.2 });
  });
  await tick(0.6);
  brush('twig', [[574, 300], [612, 248], [664, 214]], { width: 6, start: 3.95, dur: 0.25, dry: 0.3, profile: s => 1 - 0.6 * s });
  const leaf = s => s < 0.22 ? ease.outQuad(s / 0.22) : Math.pow(1 - (s - 0.22) / 0.78, 0.8);
  [[606, 254, 2.05, 150, 18], [632, 232, 1.6, 130, -14], [664, 214, 1.25, 105, 12], [588, 276, 2.45, 115, -16], [652, 222, 0.85, 70, 10]].forEach(([x, y, a, L, bend], k) => {
    const dx = Math.cos(a), dy = Math.sin(a);
    brush(`leaf${k}`, [[x, y], [x + dx * L * 0.5 - dy * bend, y + dy * L * 0.5 + dx * bend], [x + dx * L, y + dy * L]], { width: 26, start: 4.3 + k * 0.18, dur: 0.16, easing: ease.outQuad, dry: 0.7, profile: leaf });
  });
  seal = makeSeal(82, 596, 52);
}

function render(g, t){
  g.drawImage(paper, 0, 0, W, H);
  for (const s of STROKES) drawStroke(g, s, t);
  if (t >= 5.6){
    const k = 1 + 0.06 * (1 - ease.outQuart(prog(t, 5.6, 0.12))), cx = seal.x + seal.s / 2, cy = seal.y + seal.s / 2;
    g.save(); g.globalCompositeOperation = 'multiply'; g.translate(cx, cy); g.scale(k, k); g.drawImage(seal.c, -seal.s / 2, -seal.s / 2, seal.s, seal.s); g.restore();
  }
}
```
