# Risograph (house default)

## Look

Soy ink on warm uncoated paper. Every colour is a separate spot-ink pass, tones are visible
halftone dots, and the passes never quite line up. Darks come from overprinting, never black. It
reads as handmade and printed, never as screen graphics. This is the house preset; the full worked
piece is `references/starter-cyanheads-ident.html` (riso compositor, ripples, discs, lettering).

## Palette tokens

| Token | Hex | Role |
|---|---|---|
| paper | `#F2EDE3` | warm cream, fibre grain + faint mottling, static |
| blue | `#0078BF` | workhorse ink, skies, water |
| pink | `#FF48B0` | fluorescent pink, accents, misregistration fringe |
| yellow | `#FFE800` | suns, highlights; over blue it prints green |
| green | `#00A95C` | foliage |
| orange | `#FF6C2F` | warm accents |
| violet | `#765BA7` | shadows on warm scenes |
| indigo | `#2E3192` | spine element, lettering, rims |

Three or four inks per scene, at most. No black: overprint pink + blue for a deep purple-dark,
blue + yellow for green.

## Texture and compositing

| Element | Spec |
|---|---|
| Ink layers | Each ink draws *coverage* (alpha 0–1) into its own offscreen canvas, then gets halftoned, tinted, and composited onto paper with `multiply`. |
| Halftone | Clustered dots at 4–6 px pitch, a different screen angle per ink (0°, 15°, 45°, 75°). Gradients are dot-size ramps, so draw a smooth gradient into coverage and let the screen turn it into dots. Solids at 100 %. |
| Tones | Avoid exactly 50 % (the dots touch diagonally and read as a checkerboard). Use ~0.4 light, ~0.7 heavy. |
| Misregistration | Each ink offset 1–3 px in a fixed per-scene direction. The spine element always shows a thin pink fringe on one side. This one trick does most of the "printed" work. |
| Print texture | Speckle flecks in toned areas, small ink-starved voids in solids (noise-gated), white hatching for highlights (`destination-out` strokes on the coverage layer). |
| Knockout | Real riso designers knock out shapes so inks don't mix where they shouldn't. In code, that's a clip path (the sun below is clipped to the sky above the ridge). |
| Line quality | Hand-drawn wobble, stroke-width variation, circles never perfect (low-frequency noise on radius, tapered ends). |
| Cost | Halftoning is per pixel and slow (~100 ms per full-frame ink at 1440²). Do it once per scene in `setup()`, never per frame. Animate by clipping, translating, and drawing pre-halftoned sprites. |

## Motion vocabulary and timing

The house vocabulary in SKILL.md § Motion vocabulary (ripple, disc-reveal, dive, cut, breath,
pull-back, drain, scatter, bloom, handwriting, dissolve) was written for this style. Timing feel:
calm open, beat-grid cuts at 120 BPM, short overshoots (easeOutBack) on reveals, everything
organised around a centred spine.

## Pitfalls

- **Scaling a halftoned bitmap resamples the dots and they swim.** A disc reveal is a clip that
  grows; the dive is the same clip growing past the corners.
- **Sub-pixel translation blurs dots.** Snap sprite offsets to device pixels:
  `Math.round(dy * DPR) / DPR`.
- **Coverage accumulates.** Filling 0.72 over 0.42 gives 0.84. To *set* a tone, erase the area
  first (`destination-out`), then fill.
- **Same ink on same ink vanishes.** A solid indigo arm on an 85 % indigo platter reads as
  nothing. Print it in another ink and cut a paper channel under it.
- A moving pre-halftoned sprite carries its screen with it, unlike real print where the screen is
  fixed to the page. At riso pitches nobody notices; don't "fix" it by halftoning per frame.

## Example

Six seconds: an iris opens on a printed landscape, a sun rises behind the ridges (knocked out of
the mountains by a clip), the iris dives to full bleed, and three ripples leave the sun. Paste
into `references/harness.html`.

```js
/* risograph: coverage → halftone → multiply, misregistration, knockout clip, iris + dive */
const DURATION = 6.0;
const ACTS = [[0, 'paper'], [0.5, 'iris'], [3.0, 'dive'], [4.0, 'ripples']];
const INK = { blue: '#0078BF', pink: '#FF48B0', yellow: '#FFE800', indigo: '#2E3192' };
const ANGLE = { blue: 15, pink: 75, yellow: 0, indigo: 45 };     // screen angle per ink, degrees
const PITCH = 5;                                                   // css px between dot centres
const REG = { blue: [0, 0], pink: [1.8, 0.9], yellow: [-1.2, 1.4] }; // misregistration per ink, px
const SUN_X = 455, SUN_Y = 300, SUN_R = 62, IRIS_R = 250;
let paper, scene, sunSprite, skyClip;

const cov = (g, c) => { g.fillStyle = g.strokeStyle = `rgba(0,0,0,${c})`; };

function makePaper(){
  const [c, g] = makeCanvas(); const pw = c.width, ph = c.height;
  const img = g.createImageData(pw, ph), d = img.data;
  for (let y = 0; y < ph; y++) for (let x = 0; x < pw; x++){
    const i = (y * pw + x) * 4, v = (hash2(x, y, 7) - 0.5) * 10 + (valueNoise(x / 140, y / 140, 11) - 0.5) * 9;
    d[i] = 0xF2 + v; d[i + 1] = 0xED + v; d[i + 2] = 0xE3 + v * 0.8; d[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const r = rngFor('paper', 'fibres'); g.strokeStyle = 'rgba(120,100,70,0.07)'; g.lineWidth = 0.6;
  for (let i = 0; i < 500; i++){ const x = r() * W, y = r() * H, a = r() * Math.PI, l = 4 + r() * 14; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
  return c;
}

/** Coverage canvas (alpha) → clustered-dot halftone in one ink, with uneven inking + speckle. */
function halftone(coverage, ink){
  const pw = coverage.width, ph = coverage.height;
  const src = coverage.getContext('2d').getImageData(0, 0, pw, ph).data;
  const [out, og] = makeCanvas(); const img = og.createImageData(pw, ph), d = img.data;
  const [r, gr, b] = hexRGB(INK[ink]);
  const a = ANGLE[ink] * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a), pitch = PITCH * DPR, seed = hashStr(ink);
  for (let y = 0; y < ph; y++) for (let x = 0; x < pw; x++){
    const i = (y * pw + x) * 4; let c = src[i + 3] / 255; if (c < 0.004) continue;
    const n = valueNoise(x / (9 * DPR), y / (9 * DPR), seed);
    c = c > 0.97 ? (n < 0.1 ? 0.6 : 1) : c * (0.88 + 0.24 * n);   // starved voids in solids, uneven tone
    const u = (x * ca + y * sa) / pitch, v = (-x * sa + y * ca) / pitch;
    const fu = u - Math.floor(u) - 0.5, fv = v - Math.floor(v) - 0.5;
    const dot = Math.PI * (fu * fu + fv * fv), hole = 1 - Math.PI * ((0.5 - Math.abs(fu)) ** 2 + (0.5 - Math.abs(fv)) ** 2);
    if (c >= 1 || c > Math.min(dot, hole)){ d[i] = r; d[i + 1] = gr; d[i + 2] = b; d[i + 3] = 255; }  // dots grow, then holes shrink
  }
  const rng = rngFor('speckle', ink);
  for (let k = 0; k < pw * ph / 5000; k++){ const x = rng() * pw | 0, y = rng() * ph | 0, i = (y * pw + x) * 4; if (src[i + 3] > 30){ d[i] = r; d[i + 1] = gr; d[i + 2] = b; d[i + 3] = 255; } }
  og.putImageData(img, 0, 0); return out;
}

const ridge = (seed, base, amp, freq) => { const pts = []; for (let x = -12; x <= W + 12; x += 6) pts.push([x, base - amp * fbm(x * freq, 0.5, seed, 3)]); return pts; };
const ridgePath = pts => { const p = new Path2D(); p.moveTo(pts[0][0], H + 12); for (const [x, y] of pts) p.lineTo(x, y); p.lineTo(pts[pts.length - 1][0], H + 12); p.closePath(); return p; };
/** Set (not add) a tone: erase the area, then fill at coverage c. */
function setTone(g, path, c){ g.save(); g.globalCompositeOperation = 'destination-out'; cov(g, 1); g.fill(path); g.restore(); cov(g, c); g.fill(path); }
/** Print layers onto a target with multiply, each at its misregistration offset. */
function print(target, layers){ for (const [ink, c] of Object.entries(layers)){ target.save(); target.globalCompositeOperation = 'multiply'; target.drawImage(halftone(c, ink), REG[ink][0], REG[ink][1], W, H); target.restore(); } }

async function setup(){
  paper = makePaper(); await tick(0.15);
  const back = ridge(11, 440, 130, 0.006), mid = ridge(23, 520, 120, 0.009), front = ridge(37, 610, 90, 0.013);
  skyClip = new Path2D(); skyClip.moveTo(-12, -12); for (const [x, y] of back) skyClip.lineTo(x, y); skyClip.lineTo(W + 12, -12); skyClip.closePath();
  const [cb, gb] = makeCanvas(), [cp, gp] = makeCanvas();
  let gr = gb.createLinearGradient(0, 0, 0, 470); gr.addColorStop(0, 'rgba(0,0,0,0.62)'); gr.addColorStop(1, 'rgba(0,0,0,0.04)');
  gb.fillStyle = gr; gb.fillRect(0, 0, W, 470);                     // sky: a smooth ramp in coverage = a dot-size ramp in print
  gr = gp.createLinearGradient(0, 200, 0, 470); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.42)');
  gp.fillStyle = gr; gp.fillRect(0, 200, W, 270);
  setTone(gb, ridgePath(back), 0.4);
  setTone(gb, ridgePath(mid), 0.72); setTone(gp, ridgePath(mid), 0.3);
  setTone(gb, ridgePath(front), 1); setTone(gp, ridgePath(front), 0.85);  // pink over blue = the "black"
  gb.save(); gb.globalCompositeOperation = 'destination-out'; cov(gb, 1); gb.lineWidth = 1.6;   // white hatching on the mid ridge
  for (let i = 4; i < mid.length - 4; i += 3){ const [x, y] = mid[i]; gb.beginPath(); gb.moveTo(x - 4, y + 10); gb.lineTo(x + 5, y + 4); gb.stroke(); }
  gb.restore();
  await tick(0.3);
  const [cs, gs] = makeCanvas(); scene = cs; gs.drawImage(paper, 0, 0, W, H); print(gs, { blue: cb, pink: cp });
  await tick(0.7);
  const [cy, gy] = makeCanvas(), [ch, gh] = makeCanvas();
  cov(gy, 1); gy.beginPath(); gy.arc(SUN_X, SUN_Y, SUN_R, 0, 6.2832); gy.fill();
  cov(gh, 0.38); gh.beginPath(); gh.arc(SUN_X, SUN_Y, SUN_R + 34, 0, 6.2832); gh.fill();
  const [ss, sg] = makeCanvas(); sunSprite = ss; print(sg, { yellow: cy, pink: ch });          // transparent sprite, multiplied in later
}

function wobblyRing(g, cx, cy, r, seed, amp){
  const rng = rngFor('ring', seed), p1 = rng() * 6.28, p2 = rng() * 6.28; g.beginPath();
  for (let i = 0; i <= 120; i++){ const a = i / 120 * 6.2832, rr = r + amp * Math.sin(5 * a + p1) + amp * 0.5 * Math.sin(8 * a + p2); i ? g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr) : g.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
  g.closePath();
}
function ripple(g, p, ink, seed){
  if (p <= 0 || p >= 1) return;
  const e = ease.outQuad(p), r = SUN_R + e * 520;                  // stays in frame ~12 frames, not 5
  g.save(); g.globalCompositeOperation = 'multiply'; g.globalAlpha = 1 - p * p; g.strokeStyle = INK[ink]; g.lineWidth = 6 * (1 - e) + 1;
  wobblyRing(g, SUN_X, SUN_Y, r, seed, 1.5 + r * 0.006); g.stroke(); g.restore();
}

function render(g, t){
  g.drawImage(paper, 0, 0, W, H);
  const r = t < 3.0 ? IRIS_R * ease.outBack(prog(t, 0.5, 0.6)) : lerp(IRIS_R, 530, ease.inOutCubic(prog(t, 3.0, 0.4)));
  if (r < 0.5) return;
  g.save(); g.beginPath(); g.arc(CX, CY, r, 0, 6.2832); g.clip();                // reveal = clip, never scale
  g.drawImage(scene, 0, 0, W, H);
  const dy = Math.round((1 - ease.outCubic(prog(t, 1.0, 2.2))) * 240 * DPR) / DPR; // device-px snap keeps dots crisp
  g.save(); g.clip(skyClip); g.globalCompositeOperation = 'multiply'; g.drawImage(sunSprite, 0, dy, W, H); g.restore();
  ripple(g, prog(t, 4.0, 0.8), 'pink', 'a'); ripple(g, prog(t, 4.5, 0.8), 'blue', 'b'); ripple(g, prog(t, 5.0, 0.8), 'pink', 'c');
  g.restore();
  if (r < 520){                                                                    // printed rim, pink fringe offset
    g.save(); g.globalCompositeOperation = 'multiply'; g.lineWidth = 3;
    g.strokeStyle = INK.pink; wobblyRing(g, CX + 1.8, CY + 0.9, r, 'rim', 1.4); g.stroke();
    g.strokeStyle = INK.indigo; wobblyRing(g, CX, CY, r, 'rim', 1.4); g.stroke(); g.restore();
  }
}
```
