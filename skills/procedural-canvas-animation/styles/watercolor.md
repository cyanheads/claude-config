# Watercolour

## Look

Transparent pigment on cold-press paper. Washes are soft-edged and irregular, darker where
pigment dried at the edge of a puddle, speckled where pigment settled into the paper's tooth.
Layers glaze over each other and darken by multiplying, never by covering. Whites are paper left
bare (reserved or lifted), never white paint. The image appears the way a painting does: wet
colour spreading outward from where the brush touched.

## Palette tokens

| Token | Hex | Role |
|---|---|---|
| paper | `#FBF8F1` | bright warm white with embossed tooth |
| ultramarine | `#3D5A98` | sky, cool shadows |
| ochre | `#D9A441` | warm glow, light |
| payne | `#4A5866` | Payne's grey: distance, darks, small marks |
| sap | `#6B8E3D` | sap green, foliage |
| sienna | `#B0603A` | burnt sienna, earth, foreground |
| rose | `#C8586E` | accent glaze |

Glazing two pigments makes the third colour: ultramarine over ochre gives a soft green-grey,
sienna over ultramarine a warm dark. Three to five pigments per painting.

## Texture and compositing

| Element | Spec |
|---|---|
| Wash shape | Dense base outline (edges subdivided to ≤ 40 px) → recursive midpoint deformation (gaussian offset ∝ edge length, 3 levels) for the base, then 30–40 layers each deformed again and filled at 4–6 % alpha. The stack gives a dense core and a soft, irregular edge. |
| Edge darkening | Copy the wash, then `destination-out` a blurred copy three times: what survives is the rim. Add it back over the wash. Pigment collects at the drying edge. |
| Granulation | One tooth height-map from the paper, used twice: embossed into the paper colour, and `destination-out` from every wash at ~20 % so pigment is thin on the peaks and pools in the valleys. Above ~30 % it reads as sponge noise. |
| Wet-in-wet | Blur the finished wash once (`blur(10–16px)`) before edge darkening: soft-edged glows and skies. Wet-on-dry washes skip it and keep the hard, darkened edge. |
| Graded wash | `destination-out` a linear gradient over the wash (sky dense at the top, thin at the horizon). |
| Reserve / lift | `destination-out` a soft radial gradient where light should be paper (a sun, a highlight). |
| Glazing | Every wash composites onto the paper with `multiply`, in painting order: light to dark, far to near. |
| Cost | Washes take ~50–150 ms each to build. Build all of them once in `setup()`. Washes this large use full-frame canvases; small marks use bounding boxes. |

## Motion vocabulary and timing

| Move | What | Timing |
|---|---|---|
| spread | The finished wash revealed through a deformed blob mask growing from where the brush touched, soft-edged by a radial gradient. The irregular edge grows with it, which reads as wet pigment creeping. | 1.0–1.6 s · easeOutCubic |
| wet-in-wet | Start the next wash before the previous finishes spreading, overlapping by 0.3–0.6 s. | — |
| mark | Small brush marks (birds, grass, twigs) drawn on with a trim path in a dark pigment. | 0.25–0.4 s · easeOutQuad |
| dry-down (optional) | A wash loses ~10 % density over 1 s after it lands (watercolour dries lighter). | ~1 s · linear |

Timing feel: slow, overlapping, organic. Big washes first and slowly, small marks last and
quickly. Never a hard cut inside a painting.

## Pitfalls

- **Smooth vector edges or a single fill per wash** look like a gradient tool. The layered
  deformation is the look; 30+ layers.
- **Opaque colour or `source-over` stacking** kills transparency. Multiply onto paper.
- **Painting whites.** Lift or reserve them.
- **Rebuilding or re-deforming polygons per frame.** The edge "boils" and the frame costs
  seconds. Deform once; animate only the reveal mask, whose shape is fixed and only scaled.
- **Too many saturated pigments.** Watercolour reads through restraint; mud comes from more
  than three glazes in one spot.
- **Uniform granulation** looks like a noise filter. Tie it to the paper tooth so the same
  valleys catch every wash.

## Example

Seven seconds: a graded ultramarine sky with a lifted sun spreads down from the top, an ochre
glow wets in around the sun, then Payne's grey mountains, sap-green hills, and a sienna
foreground spread in turn, and three birds are flicked in. Paste into
`references/harness.html`.

```js
/* watercolour: layered deformed polygons, edge darkening, tooth granulation, graded wash + lift, spreading reveal */
const DURATION = 7.0;
const ACTS = [[0, 'paper'], [0.2, 'sky'], [1.8, 'mountains'], [2.8, 'hills'], [3.7, 'ground'], [4.9, 'birds']];
const PIG = { ultramarine: '#3D5A98', ochre: '#D9A441', payne: '#4A5866', sap: '#6B8E3D', sienna: '#B0603A' };
const SUN = [250, 250, 58];
let paper, tooth, scratch, sc; const WASHES = [], BIRDS = [];

function makePaperAndTooth(){
  const [p, pg] = makeCanvas(), [th, tg] = makeCanvas(), pw = p.width, ph = p.height;
  const hgt = new Float32Array(pw * ph);
  for (let y = 0; y < ph; y++) for (let x = 0; x < pw; x++) hgt[y * pw + x] = 0.65 * valueNoise(x / (2.2 * DPR), y / (2.2 * DPR), 3) + 0.35 * valueNoise(x / (7 * DPR), y / (7 * DPR), 4);
  const pi = pg.createImageData(pw, ph), ti = tg.createImageData(pw, ph), pd = pi.data, td = ti.data;
  for (let y = 0; y < ph; y++) for (let x = 0; x < pw; x++){
    const i = y * pw + x, h = hgt[i], emb = (h - hgt[Math.max(0, i - pw - 1)]) * 40, mot = (valueNoise(x / (160 * DPR), y / (160 * DPR), 5) - 0.5) * 6;
    pd[i * 4] = 0xFB + emb + mot; pd[i * 4 + 1] = 0xF8 + emb + mot; pd[i * 4 + 2] = 0xF1 + emb + mot * 1.2; pd[i * 4 + 3] = 255;
    td[i * 4 + 3] = Math.min(255, h * h * 330);                                   // peaks: where pigment is thin
  }
  pg.putImageData(pi, 0, 0); tg.putImageData(ti, 0, 0);
  return [p, th];
}

const subdivide = (pts, maxLen) => pts.flatMap((a, i) => { const b = pts[(i + 1) % pts.length], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / maxLen)); return Array.from({ length: n }, (_, k) => [lerp(a[0], b[0], k / n), lerp(a[1], b[1], k / n)]); });
function deform(pts, depth, v, rng){                                               // recursive midpoint displacement, closed polygon
  let out = pts;
  for (let d = 0; d < depth; d++){
    const nxt = [];
    for (let i = 0; i < out.length; i++){ const a = out[i], b = out[(i + 1) % out.length], len = Math.hypot(b[0] - a[0], b[1] - a[1]); nxt.push(a, [(a[0] + b[0]) / 2 + gauss(rng) * len * v, (a[1] + b[1]) / 2 + gauss(rng) * len * v]); }
    out = nxt;
  }
  return out;
}
const fillPoly = (g, pts) => { g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fill(); };

function wash(id, outline, color, { layers = 34, alpha = 0.045, grade = null, lift = null, soft = 0, seed, start, dur, reach = 760 }){
  const rng = rngFor('wash', id), base = deform(subdivide(outline, 40), 2, 0.22, rng);
  let [c, g] = makeCanvas(); g.fillStyle = color;
  for (let k = 0; k < layers; k++){ g.globalAlpha = alpha; fillPoly(g, deform(base, 3, 0.26, rng)); }
  g.globalAlpha = 1;
  if (soft){ const [b, bg] = makeCanvas(); bg.filter = `blur(${soft * DPR}px)`; bg.drawImage(c, 0, 0, W, H); bg.filter = 'none'; [c, g] = [b, bg]; }  // wet-in-wet: soft edge
  g.globalCompositeOperation = 'destination-out';
  if (grade){ const gr = g.createLinearGradient(0, grade[0], 0, grade[1]); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.92)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
  if (lift){ const [x, y, r] = lift, gr = g.createRadialGradient(x, y, r * 0.55, x, y, r * 1.6); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
  const [e, eg] = makeCanvas(); eg.drawImage(c, 0, 0, W, H);                         // rim = wash minus its blur, three times
  eg.globalCompositeOperation = 'destination-out'; eg.filter = `blur(${6 * DPR}px)`; for (let k = 0; k < 3; k++) eg.drawImage(c, 0, 0, W, H); eg.filter = 'none';
  g.globalCompositeOperation = 'source-over'; g.globalAlpha = 0.9; g.drawImage(e, 0, 0, W, H);
  g.globalCompositeOperation = 'destination-out'; g.globalAlpha = 0.18; g.drawImage(tooth, 0, 0, W, H);   // granulation
  g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
  const mask = deform(Array.from({ length: 24 }, (_, i) => [Math.cos(i / 24 * 6.2832), Math.sin(i / 24 * 6.2832)]), 3, 0.15, rng);
  WASHES.push({ c, mask, seed, start, dur, reach });
}
/** Spread: the finished wash through a fixed deformed blob, scaled up from the brush-down point. */
function drawWash(g, w, t){
  const p = ease.outCubic(prog(t, w.start, w.dur)); if (p <= 0) return;
  g.save(); g.globalCompositeOperation = 'multiply';
  if (p >= 1){ g.drawImage(w.c, 0, 0, W, H); g.restore(); return; }
  const r = p * w.reach, [sx, sy] = w.seed;
  sc.setTransform(DPR, 0, 0, DPR, 0, 0); sc.globalCompositeOperation = 'source-over'; sc.clearRect(0, 0, W, H);
  const gr = sc.createRadialGradient(sx, sy, 0, sx, sy, r * 1.2); gr.addColorStop(0, '#000'); gr.addColorStop(0.45, '#000'); gr.addColorStop(1, 'rgba(0,0,0,0)');  // blob edge lands in the fade
  sc.fillStyle = gr; fillPoly(sc, w.mask.map(([x, y]) => [sx + x * r, sy + y * r]));
  sc.globalCompositeOperation = 'source-in'; sc.drawImage(w.c, 0, 0, W, H);
  g.drawImage(scratch, 0, 0, W, H); g.restore();
}

const ridge = (seed, base, amp, k) => { const pts = []; for (let x = -60; x <= W + 60; x += 20) pts.push([x, base - amp * fbm(x * k, 2.5, seed, 4)]); return pts; };

async function setup(){
  [paper, tooth] = makePaperAndTooth(); await tick(0.15);
  [scratch, sc] = makeCanvas();
  wash('sky', [[-60, -60], [W + 60, -60], [W + 60, 420], [-60, 400]], PIG.ultramarine, { layers: 36, alpha: 0.045, grade: [40, 410], lift: SUN, seed: [380, -40], start: 0.2, dur: 1.6 });
  await tick(0.3);
  wash('glow', Array.from({ length: 16 }, (_, i) => [SUN[0] + Math.cos(i / 16 * 6.2832) * 230, SUN[1] + 15 + Math.sin(i / 16 * 6.2832) * 85]), PIG.ochre, { layers: 30, alpha: 0.04, soft: 14, lift: [SUN[0], SUN[1], 40], seed: [SUN[0], SUN[1] + 40], start: 0.9, dur: 1.4, reach: 420 });
  await tick(0.45);
  wash('far', [...ridge(11, 395, 120, 0.008), [W + 60, 530], [-60, 530]], PIG.payne, { layers: 32, alpha: 0.042, seed: [110, 330], start: 1.8, dur: 1.3 });
  await tick(0.6);
  wash('hills', [...ridge(23, 500, 90, 0.011), [W + 60, H + 60], [-60, H + 60]], PIG.sap, { layers: 34, alpha: 0.045, seed: [620, 450], start: 2.8, dur: 1.3 });
  await tick(0.75);
  wash('ground', [[-60, 590], [180, 610], [380, 668], [520, H + 60], [-60, H + 60]], PIG.sienna, { layers: 34, alpha: 0.05, seed: [40, H + 10], start: 3.7, dur: 1.1, reach: 620 });
  for (const [x, y, s, t0] of [[470, 190, 1, 4.9], [520, 225, 0.75, 5.1], [430, 240, 0.6, 5.3]]){
    const wing = (dir) => Array.from({ length: 9 }, (_, i) => { const u = i / 8; return [x + dir * (1 - u) * 22 * s, y - Math.sin(u * Math.PI * 0.9) * 9 * s + u * 4 * s]; });
    BIRDS.push({ m: measure([...wing(-1), ...wing(1).reverse()]), t0, s });
  }
}

function render(g, t){
  g.drawImage(paper, 0, 0, W, H);
  for (const w of WASHES) drawWash(g, w, t);
  g.save(); g.globalCompositeOperation = 'multiply'; g.strokeStyle = PIG.payne; g.lineCap = g.lineJoin = 'round';
  for (const b of BIRDS){ const d = ease.outQuad(prog(t, b.t0, 0.35)); if (d <= 0) continue; g.lineWidth = 2.6 * b.s + 0.6; g.globalAlpha = 0.85; trimPath(g, b.m, 0, d); }
  g.restore();
}
```
