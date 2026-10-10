# Craft notes — timing, performance, lettering, failure modes, export

Depth behind SKILL.md. Each section stands alone; read the one the current phase needs.

## Timing and easing

**Count frames, not seconds.** At 24 fps, 0.25 s is 6 frames and 0.1 s is 2.4 (so it doesn't
exist). A move that's on screen for fewer than ~5 frames reads as a flicker. Before tuning an
easing, ask how many frames the interesting part of the move is visible.

**Pick the easing by what the motion is doing.**

| Motion | Easing | Why |
|---|---|---|
| Arrives and stops | easeOutExpo / easeOutCubic | Fast entry, long settle; the eye catches the stop. |
| Lands with weight | easeOutBack or `spring(t, 2–3 Hz, 0.35–0.5)` | One overshoot sells mass. More than one reads as rubber. |
| Leaves | easeInQuad / easeInCubic | Accelerates out of frame. |
| Camera, big reframes | easeInOutCubic | Never jerks at either end. |
| Ambient (breathing, bob, sway) | `sin`, easeInOutSine | Continuous, loopable. |
| Constant tempo (grid, conveyor, stroke progress) | linear | The only legitimate linear. |
| Anticipation | short reverse squash before the move (0.1–0.15 s) | Tells the eye where to look. |

Watch the curves that leave [0, 1]: easeInBack dips below 0 at the start and easeOutBack/spring
overshoot past 1. A radius or scale driven by them must be clamped (`Math.max(0, r)`), because
`ctx.arc` throws on a negative radius.

**Stagger and overlap.** Siblings start 40–100 ms apart. Colour, scale, and position changes on
one element are offset by a frame or two. Nothing starts or stops in unison unless that's the
point.

**Holds.** A key pose needs 6–12 frames of stillness to register. Every piece ends on a hold of
at least 1 s (the signature hold).

**Beat grid.** Define cue times in beats so a tempo change is one constant:
`const B = 60 / BPM; { start: 16 * B, … }`. At 120 BPM the quarter-beat is 0.125 s (3 frames);
cue boundaries on multiples of 1/24 s land on exact frames in the export.

**Velocity without state.** `render(t)` can't remember the last frame, but it can evaluate a
position function twice: `v = (pos(t) − pos(t − 1/120)) × 120`. Smear, squash-and-stretch,
direction-facing, and speed-based blur all come from that.

**Motion blur (optional, expensive).** For a very fast cue only, draw N sub-frame samples at
`t − k · shutter / N` into an offscreen canvas with `globalAlpha = 1 / (k + 1)` (running
average), then composite once. N = 4–8, shutter ≈ 0.5 / fps. Cost is N× the frame.

**Stepped time.** `stepTime(t, 12)` holds poses for two frames (stop-motion, cel animation,
pixel art). Apply it to the motion, not to the camera, unless the whole piece is stepped.

## Performance

The export isn't real-time, so frame cost only matters for interactive playback and the
in-page Record button. Still, a frame over ~30 ms makes scrubbing painful and Record drop
frames. At DPR 2 a full frame is 1440² = 2.07 M pixels.

| Operation | Rough cost at 1440² | Rule |
|---|---|---|
| Per-pixel JS loop (`getImageData` → loop → `putImageData`) | 50–150 ms | Setup only. For per-frame pixel work, use a low-res buffer (pixel art, bloom). |
| `ctx.filter = 'blur()'` full-res | 5–40 ms | Setup only, or on a 1/4–1/8-size canvas. |
| `shadowBlur` | per draw call, slow | Avoid in render; bake shadows into sprites. |
| `drawImage` of a cached canvas | < 1 ms | The workhorse. Animate transforms and clips of cached bitmaps. |
| Path fill/stroke | cheap until thousands of segments | Cache static outlines as `Path2D`. |
| Creating a canvas or gradient | allocation + GC | Never per frame for canvases; reuse scratch canvases. Gradients are fine. |

- **Cache everything static** in `setup()`, at DPR, attached to the object it belongs to.
  Bounding-box sprites for small objects; full-frame only for full-frame layers. One 1440²
  canvas is ~8 MB, so keep the cache under ~40 of them.
- **Reveal by clip or mask, never by rebuilding.** A clip that grows, a trimmed path, a mask
  drawn into a reused scratch canvas then `source-in`.
- **Don't scale or sub-pixel-translate textured bitmaps** (halftone, grain, pixel art): they
  resample and swim. Snap offsets to device pixels: `Math.round(x * DPR) / DPR`.
- **Keep the loading bar honest**: `await tick(fraction)` between heavy setup steps so the page
  repaints.
- `getContext('2d', { willReadFrequently: true })` on any canvas read back more than once.

## Lettering without fonts

`ctx.font` with a system font is an asset the machine supplies, and it varies between machines,
so the same `render(t)` exports different pixels elsewhere. Draw letters as geometry.

| Approach | Use for | How |
|---|---|---|
| Single-line stroke glyphs | Signatures, handwriting reveals | Control points per glyph in an em box, catmull-smoothed, measured, revealed by stroke length. Reference: the eight glyphs and `layoutWord`/`strokeWord` in `references/starter-cyanheads-ident.html`. |
| SVG path data | Filled display lettering, logos | `new Path2D('M10 0 C…Z')`: the path string is code, not a file. Draw outlines in any vector tool or by hand, paste the `d` string. Fill, stroke, clip, or trim. |
| Bitmap font | Pixel art, terminals, scoreboards | 3×5 or 5×7 bit strings per glyph, drawn at an integer pixel size. A full 3×5 A–Z/0–9 set is in `styles/pixel-art.md`. |
| Geometric block letters | Motion graphics titles | Letters built from rects, arcs, and rounded rects on a grid, animated per part. |
| Negative space | Paper, print, stencil looks | Cut the letterforms out of a shape with `destination-out`. |

Layout: sum glyph advances (plus tracking) to centre a word, place on an explicit baseline,
and write left to right, stroke by stroke. For legibility after compression, keep cap height
≥ 4 % of frame height (~30 px at 720) and strokes ≥ 3 px.

## Failure modes

| Symptom | Cause | Fix |
|---|---|---|
| Scrubbing backwards shows wrong frames; export differs from playback | State carried between frames (accumulated positions, particles advanced per tick, a canvas never cleared) | Everything derives from `t`. Test: stills at t = 5 then 2.5 in one run must hash-match a fresh t = 2.5. |
| Texture crawls or flickers | Noise or `Math.random()` evaluated per frame; textures regenerated in render | Seeded PRNG per element; bake textures in setup. Per-frame variation (boil, flicker) hashes the frame or step index. |
| Element offset or tinted after another draws | Leaked transform, `globalAlpha`, `globalCompositeOperation`, `filter`, or clip | `save()`/`restore()` around every element that changes state. The harness resets only per frame. |
| Blurry output at 2× | Offscreen canvas sized in CSS px, or drawn with a fractional scale | Size offscreens × DPR with the transform set (`makeCanvas`). |
| Slice of an offscreen lands in the wrong place | 9-argument `drawImage` source rect given in CSS px | The source rect is in the source canvas's device pixels: multiply by DPR. `putImageData` ignores the transform too. |
| Halftone, grain, or pixels swim during a move | Scaling or sub-pixel translating a textured bitmap | Clip instead of scale; snap to device pixels. |
| Element pops for one frame at a cue boundary | `t < end` vs `<=`, or float time (23/24 isn't exact) | Use `prog()` (clamped) for continuous moves; add `1e-6` inside `Math.floor` for step functions. |
| Loop has a visible seam | A motion doesn't complete whole cycles, or float error at the wrap | Whole cycles per loop; wrap integer offsets with `% P`; check t = 0 and t = D stills hash-match; export with `--loop`. |
| Muddy montage | Too many inks/colours, figure and ground at similar value | Squint test at thumbnail size; one bold silhouette per scene; cut colours. |
| Banding, blocking, or shimmer in the MP4 | Thin hairlines, subtle gradients, full-frame per-frame noise | Strokes ≥ 3 px; flat fills or static grain; noise that changes every frame costs bitrate (use 4 rotating tiles at low alpha, or none). |
| Page renders blank in the renderer | Exception during load | The renderer prints page errors; fix the first one. |

## Inspection recipes

All with `bun <skill>/scripts/render-frames.ts` (call it `$S`).

```bash
# determinism: same time, different seek history, same bytes
bun $S index.html --t 5,2.5 --scale 1 --out a && bun $S index.html --t 2.5 --scale 1 --out b
md5 -q a/t2_50.png b/t2_50.png            # Linux: md5sum

# loop seam: t = 0 and t = D must match exactly
bun $S index.html --t 0,4 --out seam && md5 -q seam/t0_00.png seam/t4_00.png

# pops and cuts: mean luma difference between consecutive frames; spikes are cuts or glitches
ffmpeg -v error -i 'frames/f%05d.png' -vf "tblend=all_mode=difference,signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=diff.txt" -f null -
paste - - < diff.txt | awk -F'[ =:]+' '{print $2, $NF}' | sort -k2 -nr | head   # frame index, difference
```

A spike that isn't on the cue list is a pop. Divide the frame index by the fps to get the time,
then sweep stills around it.

## Export recipes

| Target | Size | Notes |
|---|---|---|
| Square (feeds, READMEs, portfolio) | 720² CSS → 1440² at `--scale 2` | The default. |
| Landscape 16:9 | `W = 1280, H = 720` in the harness; `--width 1280 --height 720` | `--scale 1.5` gives 1920×1080. |
| Vertical 9:16 (shorts, reels, stories) | `W = 720, H = 1280`; `--width 720 --height 1280` | Keep the subject in the middle 60 %; platform UI covers the bottom ~20 % and the right edge. |

Both output sides must be even for H.264 yuv420p (the renderer warns).

```bash
# seamless loop: omit the duplicate end frame
bun $S index.html --frames --loop --out frames --mp4 loop.mp4

# GIF with an optimised palette (lanczos + dither for painterly styles)
ffmpeg -i piece.mp4 -vf "fps=15,scale=540:-1:flags=lanczos,split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=4" piece.gif
# pixel art: nearest-neighbour, no dither, palette-sized
ffmpeg -i piece.mp4 -vf "fps=12,scale=360:-1:flags=neighbor,split[a][b];[a]palettegen=max_colors=32[p];[b][p]paletteuse=dither=none" piece.gif

# WebM (VP9) for the web
ffmpeg -framerate 24 -i frames/f%05d.png -c:v libvpx-vp9 -crf 30 -b:v 0 -pix_fmt yuv420p piece.webm

# add a soundtrack afterwards
ffmpeg -i piece.mp4 -i track.wav -c:v copy -c:a aac -b:a 192k -shortest piece-audio.mp4
```

- yuv420p stores colour at half resolution. Pixel art survives because each art pixel is 8×8 at
  `--scale 2`; at smaller scales, coloured pixel edges smear.
- Grainy styles (riso, watercolour, paper) cost bitrate. CRF 17 keeps the grain; CRF 20–23 is
  fine for the web.
