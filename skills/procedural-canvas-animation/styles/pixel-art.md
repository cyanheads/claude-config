# Pixel art

## Look

A tiny low-resolution frame (here 180×180) scaled up by an exact integer with no smoothing, so
every pixel is a crisp square. A fixed palette of 16 colours, no anti-aliasing, no alpha.
Gradients are ordered dithering. Sprites are hand-placed pixel grids with dark outlines and
squash-and-stretch frames. Text is a bitmap font. Motion snaps to whole pixels.

## Palette tokens

PICO-8's 16-colour palette is a well-known default; any fixed 8–32-colour palette works if you
hold to it.

| Idx | Hex | Idx | Hex |
|---|---|---|---|
| 0 | `#000000` | 8 | `#FF004D` |
| 1 | `#1D2B53` | 9 | `#FFA300` |
| 2 | `#7E2553` | 10 | `#FFEC27` |
| 3 | `#008751` | 11 | `#00E436` |
| 4 | `#AB5236` | 12 | `#29ADFF` |
| 5 | `#5F574F` | 13 | `#83769C` |
| 6 | `#C2C3C7` | 14 | `#FF77A8` |
| 7 | `#FFF1E8` | 15 | `#FFCCAA` |

Every pixel written is a palette index. If a colour isn't in the table, it isn't in the frame.

## Texture and compositing

| Element | Spec |
|---|---|
| Buffer | One low-res canvas (no DPR) with an `ImageData` + `Uint32Array` view. Write pixels as packed palette ints, `putImageData` once per frame. |
| Upscale | `g.imageSmoothingEnabled = false; g.drawImage(buf, 0, 0, W, H)`. The scale (CSS × DPR) must be an integer: 180 → 720 is 4×, 8× at DPR 2. A non-integer scale gives uneven pixel sizes. |
| Dither | 4×4 Bayer matrix: pixel takes the next band's colour when `fraction > bayer[y & 3][x & 3]`. Use it for skies, glows, and fades (a dither dissolve replaces alpha). |
| Sprites | String grids keyed to palette indices, `.` transparent. Derive squash/stretch frames by dropping or duplicating rows, not by scaling. |
| Outlines | 1 px darkest-palette outline on characters; none on backgrounds. A lighter rim pixel on the light-facing edge of terrain. |
| Text | Bitmap font, each glyph a 3×5 (or 5×7) bit string, drawn at integer multiples. |
| Parallax | Each layer a periodic function of x (sum of sines with integer frequencies over a period P), scrolled by an integer offset. |

## Motion vocabulary and timing

| Move | What | Timing |
|---|---|---|
| snap | All positions `Math.floor`ed to buffer pixels before drawing. | always |
| scroll | Layer offset `floor(t × speed)`; pick speeds that are whole pixels per frame (24, 48, 72 px/s at 24 fps) or the scroll judders. | per layer |
| cycle | Sprite frames chosen from `t`, typically at 8–12 fps. | 4–8 frames per cycle |
| hop | Height from a half-sine, squash on contact, stretch while fast, normal at the apex. | 0.5 s per hop |
| twinkle | Star visibility from `hash(star, step)`; step = `floor(t × 8)`. | 8 Hz |
| dither-dissolve | Element visible where `p > bayer(x, y)`. | 0.25–0.5 s |

Timing feel: snappy, stepped, playful. Holds on key poses, quick in-betweens.

### Seamless loops

A loop of length D closes when every motion completes a whole number of cycles in D: layer
offsets travel a multiple of their period (`speed × D % P === 0`), sprite cycles divide D, and
step-hashed effects use `floor(t × rate) % (D × rate)`. Wrap integer offsets with `% P` before
evaluating a periodic function: `sin` at x and at x + 192 differ in the last bits, and one
`Math.round` landing on .5 breaks the seam by a pixel. Verify by hashing the stills at t = 0 and
t = D; they must match exactly. Export with `--loop` so the frame at
t = D (identical to t = 0) isn't written twice.

## Pitfalls

- **Smoothing on, or a fractional scale.** Blurry or uneven pixels. Check the scale is an
  integer at the export DPR too.
- **Sub-pixel motion.** Drawing a sprite at x = 10.4 snaps to 10 some frames and 11 others: the
  sprite shimmers. Floor once, consistently.
- **Off-palette colours** from alpha blending, gradients, `ctx.filter`, or drawing vector shapes
  into the buffer with anti-aliasing. Write palette ints only.
- **Mixed pixel sizes** (a 4× sprite next to 2× text). One pixel grid for the whole frame.
- **Scroll speeds that aren't whole pixels per frame** judder (1, 2, 2, 2, 1, …).
- **Rotating sprites.** Rotation of pixel art produces jaggies. Draw rotated frames by hand or
  avoid rotation.

## Example

A four-second seamless loop: a dithered dusk sky with twinkling stars, a striped sun, two
periodic parallax ridges and a ground plane scrolling at whole-pixel speeds, a hopping slime
with squash and stretch, and a bitmap-font title. Paste into `references/harness.html`; export
with `--frames --loop`.

```js
/* pixel art: 180² palette buffer, Bayer dither, periodic parallax, sprite frames, bitmap font, seamless loop */
const DURATION = 4.0;                                    // seamless: every motion completes whole cycles in 4 s
const LW = 180, LH = 180;
const PAL = ['#000000', '#1D2B53', '#7E2553', '#008751', '#AB5236', '#5F574F', '#C2C3C7', '#FFF1E8', '#FF004D', '#FFA300', '#FFEC27', '#00E436', '#29ADFF', '#83769C', '#FF77A8', '#FFCCAA'];
const PAL32 = PAL.map(h => { const [r, g, b] = hexRGB(h); return ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0; });  // little-endian RGBA
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map(v => (v + 0.5) / 16);
const SKY = [1, 2, 8, 9], SUN_X = 128, SUN_Y = 98, SUN_R = 28, SUN_GAPS = new Set([5, 10, 14, 17, 20, 22, 24, 26]);
const FONT = { A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111', F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010', K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '110101101101101', O: '010101101101010', P: '110101110100100', Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010', U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010', Z: '111001010100111', '0': '111101101101111', '1': '010110010010111', '2': '110001010100111', '3': '110001010001110', '4': '101101111001001', '5': '111100110001110', '6': '011100111101111', '7': '111001010010010', '8': '111101111101111', '9': '111101111001110', ' ': '000000000000000' };
const SLIME = ['....kkkk....', '..kkggggkk..', '.kggwwgggGk.', '.kgwggggggk.', 'kgggkggkgggk', 'kgggkggkgggk', 'kgggggggggGk', '.kGGGGGGGGk.', '..kkkkkkkk..'];
const KEY = { k: 0, g: 11, G: 3, w: 7 };
const FRAMES = { normal: [0, 1, 2, 3, 4, 5, 6, 7, 8], squash: [0, 2, 3, 4, 5, 7, 8], stretch: [0, 1, 2, 3, 3, 4, 5, 6, 6, 7, 8] };
let buf, bctx, img, px;

const dither = (x, y, f) => f > BAYER[(y & 3) * 4 + (x & 3)];
const set = (x, y, c) => { if (x >= 0 && y >= 0 && x < LW && y < LH) px[y * LW + x] = PAL32[c]; };
const ridge = (x, P, terms) => terms.reduce((h, [a, n, ph]) => h + a * Math.sin(6.2832 * n * x / P + ph), 0);  // periodic in P
function text(str, x, y, c, s){
  for (const ch of str){ const bits = FONT[ch]; for (let i = 0; i < 15; i++) if (bits[i] === '1') for (let dy = 0; dy < s; dy++) for (let dx = 0; dx < s; dx++) set(x + (i % 3) * s + dx, y + Math.floor(i / 3) * s + dy, c); x += 4 * s; }
}
function sprite(rows, frame, x, baseY, blink){
  const idx = FRAMES[frame], top = baseY - idx.length + 1;
  idx.forEach((r, j) => { const row = SLIME[r]; for (let i = 0; i < row.length; i++){ const ch = row[i]; if (ch === '.') continue; set(x + i, top + j, blink && r === 4 && ch === 'k' && i > 2 && i < 9 ? KEY.g : KEY[ch]); } });
}

async function setup(){
  buf = document.createElement('canvas'); buf.width = LW; buf.height = LH;
  bctx = buf.getContext('2d'); img = bctx.createImageData(LW, LH); px = new Uint32Array(img.data.buffer);
}

function render(g, t){
  const step = Math.floor(t * 8 + 1e-6) % 32;                                     // 8 Hz, 32 steps per loop
  for (let y = 0; y < 140; y++){                                                  // dithered sky bands
    const f = clamp01(y / 132) * 3, band = Math.min(2, Math.floor(f)), fr = f - band;
    for (let x = 0; x < LW; x++) px[y * LW + x] = PAL32[dither(x, y, fr) ? SKY[band + 1] : SKY[band]];
  }
  const sr = rngFor('stars');
  for (let i = 0; i < 30; i++){ const x = sr() * LW | 0, y = 4 + sr() * 50 | 0, c = sr() < 0.3 ? 6 : 7; if (hash2(i, step, 3) > 0.3) set(x, y, c); }
  for (let y = -SUN_R; y <= SUN_R; y++){                                          // striped sun, yellow → pink by dither
    if (SUN_GAPS.has(y)) continue;
    const w = Math.floor(Math.sqrt(SUN_R * SUN_R - y * y)), f = (y + SUN_R) / (2 * SUN_R);
    for (let x = -w; x <= w; x++) set(SUN_X + x, SUN_Y + y, dither(SUN_X + x, SUN_Y + y, f) ? 14 : 10);
  }
  const farOff = Math.floor(t * 24), midOff = Math.floor(t * 48);                 // 1 and 2 px/frame; 96 and 192 px per loop
  for (let x = 0; x < LW; x++){
    const top = Math.round(100 - ridge((x + farOff) % 96, 96, [[9, 1, 0.3], [5, 3, 1.2], [2, 7, 2.1]]));   // wrap with % P: bit-exact loop
    set(x, top, 14); for (let y = top + 1; y < 140; y++) set(x, y, 2);
    const top2 = Math.round(124 - ridge((x + midOff) % 96, 96, [[6, 2, 0.8], [3, 5, 2.4]]));
    set(x, top2, 13); for (let y = top2 + 1; y < 140; y++) set(x, y, 1);
  }
  for (let y = 140; y < LH; y++) for (let x = 0; x < LW; x++) px[y * LW + x] = PAL32[0];
  for (const [row, speed, P, c] of [[146, 48, 16, 1], [159, 72, 24, 5], [172, 96, 32, 1]]){   // ground streaks, nearer = faster
    const off = Math.floor(t * speed); for (let x = 0; x < LW; x++) if ((x + off) % P < P / 3){ set(x, row, c); set(x, row + 1, c); }
  }
  const phase = (t % 0.5) / 0.5, air = clamp01((phase - 0.12) / 0.76), h = Math.round(Math.sin(Math.PI * air) * 16);
  const frame = h === 0 ? 'squash' : h < 10 ? 'stretch' : 'normal';
  for (let x = -5 + Math.floor(h / 4); x <= 5 - Math.floor(h / 4); x++) set(66 + x, 157, 1);    // shadow shrinks with height
  sprite(SLIME, frame, 60, 156 - h, step === 17);
  text('DUSK', 75, 11, 0, 2); text('DUSK', 74, 10, 7, 2);
  bctx.putImageData(img, 0, 0);
  g.imageSmoothingEnabled = false; g.drawImage(buf, 0, 0, W, H);                  // 4× CSS, 8× at DPR 2: integer, crisp
}
```
