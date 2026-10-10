# Neon / CRT glow

## Look

Light on black. Glass tubes with a white-hot core and a coloured halo, an outrun perspective
grid racing toward a striped sun, all seen through a cathode-ray tube: scanlines, vignette,
a hair of RGB fringing, a little noise, a flicker you feel more than see. Colour is emitted,
not painted, so overlaps get brighter, never darker.

## Palette tokens

| Token | Hex | Role |
|---|---|---|
| bg | `#07051A` | blue-black sky top |
| horizon | `#2A0E45` | sky at the horizon |
| floor | `#0B0620` | ground plane under the grid |
| magenta | `#FF2975` | grid, secondary tube |
| cyan | `#2DE2E6` | primary tube |
| violet | `#8C1EFF` | sun base, deep glow |
| yellow | `#FFD319` | sun top |
| core | `#FFF6FB` | tube core, slightly pink white |

Two tube colours per frame (cyan + magenta is the classic pair). Background stays below ~15 %
luminance or nothing glows.

## Texture and compositing

| Element | Spec |
|---|---|
| Tube | Stroke the path three times: colour at 2.4 w and 30 % alpha (near glow), colour at w, then core at 0.25 w and 70 % alpha. A thicker or brighter core plus bloom saturates to white and the colour is lost. Round caps and joins. |
| Neon layer | All emissive strokes go on one offscreen canvas, cleared every frame, composited with `lighter` (additive). |
| Bloom | Downsample the neon layer into a 1/4-size canvas with `ctx.filter = 'blur(2px)'`, and into a 1/8-size canvas with `blur(4px)`; draw both back up with `lighter`. Blurring the small canvas is cheap; blurring full-res per frame is not, and `shadowBlur` on every stroke is slower still. |
| Aberration | Copy the neon layer, `source-in` fill red, add it 1.6 px right at 35 %; same in blue 1.6 px left. |
| CRT | One pre-rendered overlay multiplied over everything: 1 px dark scanline every 3 px, radial vignette. Plus one of four pre-rendered noise tiles, chosen by hashing the frame index, added at 5 %. |
| Grid | Horizontal lines at world depth z, screen y = horizon + c / z; z moves toward the camera by `frac(t × speed)`. Vertical lines use a gradient stroke that fades to zero at the horizon. |
| Sun | Pre-rendered gradient disc with slits cut by `destination-out`, slit height growing toward the bottom, clipped at the horizon. Additive radial halo behind. |

## Motion vocabulary and timing

| Move | What | Timing |
|---|---|---|
| power-on | Black frame, a bright line at centre opens vertically to the full picture, white flash fading. | 0.4 s · easeOutExpo |
| ignite | Tube stutters on: brightness on/off from `hash(floor(t × 30))` with rising probability, then steady. | 0.4–0.8 s |
| hum | Steady tubes vary 93–100 % per frame from a frame-index hash. | always |
| tube-draw | A tube lights progressively along its length (trim path), core leading. | 0.5–1 s · easeInOutCubic |
| rise | Sun rises behind the horizon clip. | 1–1.5 s · easeOutCubic |
| race | Grid scrolls at constant speed. Never eased: it's the tempo. | 1–2 lines/s |

Timing feel: hard cuts, stutters, constant-speed motion, brief holds. Ease the camera and big
reveals; let flicker be digital.

## Pitfalls

- **Grey or mid-tone background.** Additive light on a lit background washes out. Keep it near
  black.
- **`shadowBlur` or a full-resolution `ctx.filter` blur per frame** costs tens of ms at 1440².
  Downsample, blur small, upsample.
- **`Math.random()` flicker.** It works in the browser and breaks seeking and export. Hash the
  frame index.
- **Bloom on large filled areas** (the sun) floods the frame. Keep big fills off the neon layer;
  give them their own soft halo.
- **Uniform flicker on every tube at once** reads as a broken render. Give each tube its own
  seed.
- **Scanline pitch that isn't a whole number of device pixels** moirés in the export. 3 CSS px
  at DPR 2 is 6 device px: fine.

## Example

Six seconds: CRT power-on, the grid racing toward a rising striped sun, a cyan triangle and a
magenta ring igniting with stutter, then an underline drawing itself on. Paste into
`references/harness.html`.

```js
/* neon/CRT: additive tube layer, downsampled bloom, RGB fringe, scanlines + vignette, hashed flicker */
const DURATION = 6.0;
const ACTS = [[0, 'power'], [0.6, 'sun'], [1.6, 'ignite'], [3.4, 'draw']];
const C = { bg: '#07051A', horizon: '#2A0E45', floor: '#0B0620', magenta: '#FF2975', cyan: '#2DE2E6', violet: '#8C1EFF', yellow: '#FFD319', core: '#FFF6FB' };
const HY = 420, VX = 360;
let sky, sun, crt, neon, ng, tint, tg, small, sm, tiny, tm, tri, ring, under; const noise = [];

/** Steady-tube brightness: 93–100 % per frame, own seed per tube. Pure in t. */
const hum = (t, id) => 0.93 + 0.07 * hash2(Math.floor(t * FPS), hashStr(id) & 0xffff, 6);
/** Ignition: stutter on with rising probability over 0.6 s, then hum. */
function flicker(t, start, id){
  if (t < start) return 0;
  if (t < start + 0.6){ const p = (t - start) / 0.6; return hash2(Math.floor(t * 30), hashStr(id) & 0xffff, 5) < 0.2 + 0.8 * p * p ? 1 : 0.06; }
  return hum(t, id);
}
/** Glass tube: colour stroke, then hot core. `stroke` draws the path (full or trimmed). */
function tube(g, stroke, color, b, width = 6){
  if (b <= 0) return;
  g.save(); g.lineCap = g.lineJoin = 'round'; g.strokeStyle = color;
  g.globalAlpha = b * 0.3; g.lineWidth = width * 2.4; stroke();                    // near glow, in colour
  g.globalAlpha = b; g.lineWidth = width; stroke();
  g.globalAlpha = b * 0.7; g.strokeStyle = C.core; g.lineWidth = width * 0.25; stroke();
  g.restore();
}

async function setup(){
  let gs, g2, gc;
  [sky, gs] = makeCanvas();
  const gr = gs.createLinearGradient(0, 0, 0, HY); gr.addColorStop(0, C.bg); gr.addColorStop(1, C.horizon); gs.fillStyle = gr; gs.fillRect(0, 0, W, HY);
  const r = rngFor('stars'); for (let i = 0; i < 80; i++){ gs.fillStyle = `rgba(255,246,251,${0.2 + r() * 0.6})`; gs.fillRect(r() * W, r() * (HY - 60), 1.2, 1.2); }
  [sun, g2] = makeCanvas(300, 300);
  const sg = g2.createLinearGradient(0, 0, 0, 300); sg.addColorStop(0, C.yellow); sg.addColorStop(0.55, C.magenta); sg.addColorStop(1, C.violet);
  g2.fillStyle = sg; g2.beginPath(); g2.arc(150, 150, 150, 0, 6.2832); g2.fill();
  g2.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 9; i++){ const h = 2 + i * 1.6, y = 70 + i * 26; g2.fillRect(0, y, 300, h); }  // slits thicken downward
  [crt, gc] = makeCanvas(); gc.fillStyle = '#fff'; gc.fillRect(0, 0, W, H);
  gc.fillStyle = 'rgba(0,0,0,0.28)'; for (let y = 0; y < H; y += 3) gc.fillRect(0, y, W, 1);
  const vg = gc.createRadialGradient(CX, CY, W * 0.3, CX, CY, W * 0.75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.65)'); gc.fillStyle = vg; gc.fillRect(0, 0, W, H);
  for (let k = 0; k < 4; k++){ const [c, g] = makeCanvas(); const img = g.createImageData(c.width, c.height), d = img.data, r = rngFor('noise', k);
    for (let i = 0; i < d.length; i += 4){ const v = r() * 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; } g.putImageData(img, 0, 0); noise.push(c); }
  [neon, ng] = makeCanvas(); [tint, tg] = makeCanvas(); [small, sm] = makeCanvas(W / 4, H / 4, 1); [tiny, tm] = makeCanvas(W / 8, H / 8, 1);
  tri = new Path2D(); for (let i = 0; i < 3; i++){ const a = -Math.PI / 2 + i * 2.0944; i ? tri.lineTo(VX + Math.cos(a) * 130, 285 + Math.sin(a) * 130) : tri.moveTo(VX + Math.cos(a) * 130, 285 + Math.sin(a) * 130); } tri.closePath();
  ring = new Path2D(); ring.arc(VX, 305, 52, 0, 6.2832);
  under = measure([[250, 388], [470, 388]]);
}

function render(g, t){
  g.drawImage(sky, 0, 0, W, H);
  const rise = ease.outCubic(prog(t, 0.6, 1.4)), sunY = lerp(HY + 160, HY - 55, rise);
  g.save(); g.beginPath(); g.rect(0, 0, W, HY); g.clip();
  g.globalCompositeOperation = 'lighter';
  const halo = g.createRadialGradient(VX, sunY, 60, VX, sunY, 300); halo.addColorStop(0, `rgba(255,41,117,${0.45 * rise})`); halo.addColorStop(1, 'rgba(255,41,117,0)');
  g.fillStyle = halo; g.fillRect(0, 0, W, HY);
  g.globalCompositeOperation = 'source-over'; g.drawImage(sun, VX - 150, sunY - 150, 300, 300);
  g.restore();
  g.fillStyle = C.floor; g.fillRect(0, HY, W, H - HY);

  ng.setTransform(DPR, 0, 0, DPR, 0, 0); ng.clearRect(0, 0, W, H); ng.lineCap = 'round';
  const fade = ng.createLinearGradient(0, HY, 0, H); fade.addColorStop(0, 'rgba(255,41,117,0)'); fade.addColorStop(1, 'rgba(255,41,117,1)');
  ng.strokeStyle = fade; ng.lineWidth = 2;
  for (let i = -14; i <= 14; i++){ ng.beginPath(); ng.moveTo(VX + i * 8, HY); ng.lineTo(VX + i * 95, H); ng.stroke(); }
  const f = (t * 1.5) % 1;                                                         // grid races at 1.5 lines/s
  ng.strokeStyle = C.magenta;
  for (let k = 1; k <= 26; k++){ const z = k - f; if (z < 0.45) continue; const y = HY + 150 / z; ng.globalAlpha = clamp01((y - HY) / 110); ng.lineWidth = 1 + 2.4 * (y - HY) / (H - HY); ng.beginPath(); ng.moveTo(0, y); ng.lineTo(W, y); ng.stroke(); }
  ng.globalAlpha = 1;
  tube(ng, () => ng.stroke(tri), C.cyan, flicker(t, 1.6, 'tri'), 7);
  tube(ng, () => ng.stroke(ring), C.magenta, flicker(t, 2.4, 'ring'), 6);
  const d = ease.inOutCubic(prog(t, 3.4, 0.8));
  if (d > 0) tube(ng, () => trimPath(ng, under, 0, d), C.cyan, hum(t, 'under'), 5);

  g.globalCompositeOperation = 'lighter';
  g.drawImage(neon, 0, 0, W, H);
  sm.clearRect(0, 0, W / 4, H / 4); sm.filter = 'blur(2px)'; sm.drawImage(neon, 0, 0, W / 4, H / 4); sm.filter = 'none';
  tm.clearRect(0, 0, W / 8, H / 8); tm.filter = 'blur(4px)'; tm.drawImage(neon, 0, 0, W / 8, H / 8); tm.filter = 'none';
  g.globalAlpha = 0.9; g.drawImage(small, 0, 0, W, H); g.globalAlpha = 0.8; g.drawImage(tiny, 0, 0, W, H);
  for (const [color, dx] of [['#ff0000', 1.6], ['#0040ff', -1.6]]){
    tg.setTransform(DPR, 0, 0, DPR, 0, 0); tg.globalCompositeOperation = 'source-over'; tg.clearRect(0, 0, W, H); tg.drawImage(neon, 0, 0, W, H);
    tg.globalCompositeOperation = 'source-in'; tg.fillStyle = color; tg.fillRect(0, 0, W, H);
    g.globalAlpha = 0.35; g.drawImage(tint, dx, 0, W, H);
  }
  g.globalAlpha = 0.05; g.drawImage(noise[Math.floor(hash2(Math.floor(t * FPS), 0, 2) * 4)], 0, 0, W, H);
  g.globalAlpha = 1; g.globalCompositeOperation = 'multiply'; g.drawImage(crt, 0, 0, W, H);
  if (t < 0.45){                                                                   // power-on: a line opens into the picture
    const e = ease.outExpo(prog(t, 0.05, 0.4)), half = Math.max(1, e * H / 2);
    g.globalCompositeOperation = 'source-over'; g.fillStyle = '#000';
    g.fillRect(0, 0, W, CY - half); g.fillRect(0, CY + half, W, H - CY - half);
    g.globalCompositeOperation = 'lighter'; g.globalAlpha = 1 - e; g.fillStyle = C.core; g.fillRect(0, CY - half, W, half * 2);
  }
}
```
