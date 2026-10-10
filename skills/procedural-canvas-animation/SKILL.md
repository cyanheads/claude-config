---
name: procedural-canvas-animation
description: >
  Method for making short (8–60 s) procedural animated films and seamless loops as ONE
  self-contained index.html — Canvas 2D, no libraries, no fonts, no images, every pixel drawn by
  code, deterministic and seekable, exported frame-exact to MP4/GIF by the bundled headless-Chrome
  renderer. Covers writing the brief (idea → spine → beat-grid timeline → scene library → style →
  motion vocabulary), the engine contract (pure render(t), seeded PRNG, cue array, cached layers,
  seek contract), seven style presets with runnable examples (risograph as the house default,
  paper cut-out, sumi ink brush, pixel art, neon/CRT, flat motion graphics, watercolour),
  timing and easing, performance, lettering without fonts, still-based inspection, and export.
  Triggers: "make an animation like the ripple one", "procedural animation video", "make a video
  in HTML", "canvas animation to mp4", "animated signature / ident / intro / logo sting",
  "risograph / pixel art / neon / paper cut-out / watercolor / ink brush / motion graphics
  animation", "seamless loop", "write a brief for an animation", "render that animation to mp4".
---

# Procedural canvas animation

A short film drawn entirely by code in one HTML file, then rendered to video. The whole thing
rests on one engineering decision: **`render(t)` is a pure function of time.** Everything else —
scrubbing, `?t=` inspection, screenshot review at exact timestamps, frame-exact MP4 export,
QA from rendered stills — falls out of that. A piece that uses `Math.random()` in the render loop or
accumulates state frame to frame can't be inspected or exported reliably, and the review
process below stops working. Hold that line first, then everything below.

Two artifacts come out of this skill: a **brief** (the spec you or a sub-agent builds from) and
the **film** (`index.html` + exported `.mp4`). The brief is most of the work — a good brief lets
a fresh agent build the piece; a vague one produces a demo of techniques instead of a film.

When it applies: any request for an animated ident, intro, logo sting, signature, launch teaser,
looping visual, or "a short like the ripple one." Not for UI motion, data viz, or anything that
needs live data — those have their own skills.

## The deliverable

| Constraint | Rule |
|---|---|
| One file | `index.html`, self-contained. Canvas 2D only. No libraries, no fonts (network or system), no images, no assets. Lettering is geometry defined in code. |
| Finished, not a demo | The film plays start to end with a beginning, middle, and end. No debug overlays in the recorded output. |
| Deterministic | `render(t)` pure. Seeded PRNG per scene and per element (mulberry32 is enough). Textures are attached to the object they texture, generated once. Per-frame variation (flicker, boil) hashes the frame index. |
| Time-based | Seconds, never frame counts. Cuts and beats sit on a BPM grid (120 BPM → 0.25 s / 0.5 s units is the default). |
| Seekable | The page exposes the seek contract below and honours `?t=<seconds>` to open paused at a time. |
| Controls | Space play/pause, replay, scrubber with time readout and act markers, ←/→ steps one frame (1/24 s), Record button (in-page WebM). Both starting points below ship them. |
| Performance | 60 fps playback on a laptop. Build every static layer once in `setup()` (with a loading bar); per frame, only transform, clip, and composite cached bitmaps plus a few live elements. Detail: `references/craft.md` § Performance. |

**Seek contract** — the bundled renderer and any headless inspection depend on it:

```js
window.__anim = {
  duration: 28.0,                 // seconds
  ready: prerenderPromise,        // resolves when setup/pre-renders are done
  seek(t) { render(t); }          // draws frame t synchronously, no animation loop involved
};
```

## Pick a style

Each style file has the look, palette tokens, texture/compositing technique, motion vocabulary,
pitfalls, and a runnable example written to the engine contract. Read the one you pick in full
before writing the brief's visual system (layer 8).

| Style | Looks like | Reach for it when | File |
|---|---|---|---|
| Risograph (house default) | Spot inks, halftone dots, misregistration, cream paper | Idents, signatures, anything that should feel printed and handmade | `styles/risograph.md` |
| Paper cut-out | Layered construction paper, torn edges, lifted shadows, stop-motion boil | Warm storybook pieces, explainers for kids, craft brands | `styles/paper-cutout.md` |
| Sumi ink brush | Black ink on rice paper, pressure strokes, dry-brush tails, one red seal | Calm, contemplative, calligraphic; reveals by writing | `styles/sumi-ink.md` |
| Pixel art | Low-res palette buffer, dithering, sprites, bitmap font | Game-flavoured intros, retro tech, seamless loops | `styles/pixel-art.md` |
| Neon / CRT | Glowing tubes, outrun grid, bloom, scanlines, flicker | Synthwave, music, nightlife, tech launches | `styles/neon-crt.md` |
| Flat motion graphics | Geometric shapes, tight palette, snappy easing, morphs, wipes | Product explainers, logo stings, UI-adjacent brand work | `styles/flat-motion.md` |
| Watercolour | Transparent glazes, soft deformed edges, granulation, spreading washes | Landscapes, gentle narratives, editorial openers | `styles/watercolor.md` |

**Defining a new style** — write a file with the same sections. Anchor it in one real
reproduction process so the rules stay coherent: cyanotype (one Prussian-blue ink, tone by
exposure grain, white = paper), screen print (flat solids, 2–3 spot colours, thick registration
misses), woodcut (black key block, carved-line texture, one or two colour blocks), blueprint
(white line on blue, dashed construction geometry), overhead-projector cel (saturated
transparent colour on a light box, dust). Every style needs a rule for darks, a rule for tone,
a texture generated once and attached to its object, and a motion vocabulary with timing feel.

## Anatomy of a brief

The reference brief (`references/brief-exemplar-call-and-response.md`) is the pattern. Its power
is that it's **layered, and every layer is independently swappable**: change the idea and keep
the style; keep the idea and swap risograph for watercolour; keep both and change the timeline.
Every brief has these thirteen layers, in this order.

| # | Layer | What it must contain | Why it's there |
|---|---|---|---|
| 1 | **Envelope** | Duration, single-file rule, Canvas 2D, no assets, "finished animation, not a demo." | Closes every escape hatch before the creative part starts. |
| 2 | **The idea** | The story in ~80 words: protagonist, want, obstacle, turn, resolution, coda. Written as prose, not bullets. | A film has an arc. Without one you get a montage. |
| 3 | **The spine** | The ONE visual invariant every scene, transition, and camera move is organised around (the centred dot + ripples in the exemplar), and which acts it must never break in. | Gives 30+ unrelated scenes coherence and gives QA a single thing to check in every still. |
| 4 | **Format** | Canvas size, DPR handling, exact duration, background colour, BPM and base units. | Numbers, not adjectives. |
| 5 | **Timeline** | A table: time range · act · what happens. Every boundary on the beat grid. Name the transition into and out of each block. | This becomes the cue array almost verbatim. |
| 6 | **Scene library** | An ordered list, one line per scene: subject · setting · where the spine element lands · which rhyming motif it carries. | The builder shouldn't invent scenes mid-build. Ordering is edit decisions made up front. |
| 7 | **Composition rules** | Per-scene invariants: one bold subject readable as a silhouette in 0.25 s; the spine element lands on a meaningful spot; recurring motif (arcs/rays/rings); colour budget per scene. | Keeps a fast montage legible. |
| 8 | **Visual system** | The style (from `styles/`): palette hexes, rule for darks, tone method, texture, line quality, sizes as % of frame. | One medium metaphor generates dozens of rules coherently. |
| 9 | **Motion vocabulary** | Named primitives with duration + easing, from the house table below and the style file. | The timeline references these by name. A named move is reusable and checkable; "animate nicely" isn't. |
| 10 | **Architecture** | The engine contract (below). | Makes the piece seekable, inspectable, exportable. |
| 11 | **Controls & export** | Scrubber, keys, `?t=`, Record, optional muted audio, output aspect and loop flag. | Inspection surface for the human and the renderer. |
| 12 | **Process** | Phased build with checkpoints and screenshot review (below). "Do not one-shot this." | The build is iterative by design; the brief says so explicitly so the builder doesn't try to write 3 000 lines blind. |
| 13 | **Don't** | Negative constraints as a flat list. | Cheap insurance against the default failure modes (crossfades, black outlines, smooth gradients, text, per-frame randomness). |

Plus a **budget rule**: say what gets cut when time runs short. In the exemplar it's "cut Act II
scenes, never the transitions or Acts III–VI" — the emotional arc lives in the transitions and
the ending, the montage is padding. State the equivalent for every brief.

### Writing a new brief

Work top-down. Fill `references/brief-template.md`; each step feeds the next.

1. **Idea → spine.** Write the story paragraph. Then find the one element that can be pinned in
   every frame (a dot, a horizon line, a hand, a window). If nothing can be pinned, the idea isn't
   ready.
2. **Acts on the grid.** Decide duration, BPM, and 4–6 acts. Put every act boundary on a beat.
   Classic shape: call (quiet, establishes spine) → expansion (montage, accelerating cuts) →
   collapse/archive (pull back, drain) → answer/turn → together/reprise → signature. Bend it, but
   keep a quiet open, a fast middle, a turn, and a short hold at the end. A loop has no ending;
   its brief names the seam instead (what must match at t = 0 and t = D).
3. **Scene list.** One line each, ordered. For a montage at 0.25–0.5 s per cut, 25–30 scenes fills
   ~8 s. Every scene names where the spine element lands. Prefer subjects with an inherent
   concentric/radiating motif that rhymes with the spine.
4. **Pick the style** from the table above (risograph unless the request says otherwise).
   Swapping it means rewriting layer 8 and adding the style's moves to layer 9, nothing else.
5. **Choose the vocabulary subset.** Pull from the house table and the style file, add at most
   two piece-specific moves, give every one a duration and an easing.
6. **Signature.** The last 2 s are the maker's mark, hand-lettered: the name or mark the request
   gives, and if it gives none, ask. Only text in the piece.
7. **Numbers everywhere.** Hex, px, %, seconds, BPM, easing name. Read the brief back and replace
   every adjective that could be a number.

## Motion vocabulary (house)

The house moves, written for risograph and the exemplar but style-neutral in mechanics. Style
files add their own (boil, ignite, write, spread, smear…). Reuse names verbatim in the timeline
so a cue can reference `kind: "disc-reveal"` and the builder knows exactly what to implement.
How to choose easings and judge timing: `references/craft.md` § Timing and easing.

| Move | What | Duration · easing |
|---|---|---|
| ripple | Ring grows from the spine to beyond the frame corner, thinning and fading; 2–3 tick-mark arcs flick at the rim while it is in frame (roughly the first third of the move). | ~0.8 s · easeOutQuad; ~0.6 s · easeOutCubic only inside a fast montage |
| disc-reveal | Circular mask grows with slight overshoot. Variants: coin-flip (scaleX 0→1, ellipse with visible rim thickness in a darker ink), slide-in with small rotation. | ~0.5 s · easeOutBack |
| dive | Scale the disc to full bleed; spine stays centred. | ~0.35 s · easeInOutCubic |
| cut | Hard cut on the beat grid. Never a crossfade between full scenes. | 0 |
| breath | Back to blank paper for one ripple, then the next scene irises open. Used to reset the eye mid-montage. | 1 ripple |
| lens-ring | Pale double outline around the spine, tightening shot by shot (rewind / flashback framing). | per cut |
| pull-back | Current scene shrinks into one medallion; the others appear on concentric orbits; orbits alternate rotation direction. | ~1 s · easeInOutCubic |
| drain | Each medallion re-rendered as one ink from its luminance, then crossfaded. The ONLY allowed crossfade. | ~0.6 s · linear |
| scatter | Medallions move outward while shrinking to zero. | ~0.8 s · easeInQuad |
| bloom | Petals unfold with stagger, then slow rotation. | ~0.6 s · easeOutBack, stagger 40 ms |
| camera | Critically-damped pans and zooms. No jitter, no overshoot. | as cued |
| handwriting | Single-line glyph paths revealed by stroke progress along their length. | ~1.2 s per word · linear per stroke |
| dissolve | Lettering converted to dots that shrink to zero with noise-staggered timing. | ~0.6 s · easeInQuad |

## Engine contract

Two starting points; both implement the contract below and ship controls, Record, `?t=`, and
`window.__anim`.

| Start from | When |
|---|---|
| `references/starter-cyanheads-ident.html` | Risograph pieces. A finished 8 s ident: paper, riso compositor, PRNG, easings, cue runner, scene registry with three scenes, ripple / disc-reveal (grow, coin, slide) / dive / cut / breath / handwriting / dissolve, eight lowercase glyphs. Copy it, replace `SCENES`, `CUES`, and the glyph set, keep the plumbing. Its brief is `references/brief-cyanheads-ident.md`. |
| `references/harness.html` + a style example | Every other style. A style-neutral shell with the shared core (PRNG, noise, easings incl. a closed-form spring, `prog`, `stepTime`, `makeCanvas`, `measure`/`trimPath`). Paste a style file's example between the STYLE markers, run it, then grow it into the piece. Change `W`/`H` there for non-square output. |

What a finished piece contains, in build order (it's also the order in Process):

1. **Ground.** Paper, card, sky, or black: one offscreen bitmap built once, drawn first every
   frame. Never regenerated, never flickers.
2. **Style layer.** The style file's compositing: riso coverage → halftone → multiply;
   watercolour layered washes; pixel palette buffer; neon additive layer + bloom; paper sprites
   with shadows. Built in `setup()` wherever it can be.
3. **PRNG.** `mulberry32(seed)`; seed derived from `hash(sceneId, elementId)`. `Math.random()`
   never appears in the render path.
4. **Timeline.** A data array of cues — `{ start, duration, kind, scene, transition, params }` —
   sorted by `start`. `render(t)` finds the active cue(s) and delegates. No `if (t > 6.0 && ...)`
   chains.
5. **Scene registry.** `{ id, layers, draw(ctx, localT, rng) }` per scene. Static parts drawn once
   to bitmaps on first request, live parts (fire, wings, arcs, beams) drawn per frame.
6. **Easing.** The named set as pure functions; springs in closed form, never integrated.
7. **Lettering.** Geometry only (stroke glyphs, SVG path data, bitmap font):
   `references/craft.md` § Lettering without fonts.
8. **Controls + seek contract + `?t=`.** Then the optional in-page Record button
   (`canvas.captureStream(24)` + `MediaRecorder` → WebM).
9. **Audio (optional, muted by default).** WebAudio at the piece's BPM; a soft ping per spine move.

## Process — never one-shot

The brief tells the builder to stop at checkpoints. Run them; they're where a film gets fixed.

| Phase | Build | Checkpoint |
|---|---|---|
| 1 Engine | Ground, style layer, spine element, first move, cue array, controls, seek contract. | Stills at three early times (exemplar: 0.3, 1.8, 3.0). Look at them. Confirm the ground is static, the style reads at full size and as a thumbnail, the spine is where it belongs. |
| 2 Scenes | Batches of ~8 from the library. | Screenshot every scene in the batch at its cue time. Fix muddy, illegible, or off-spine compositions before the next batch. |
| 3 Transitions + late acts | Every vocabulary move, then the collapse / answer / reprise / signature acts. | Stills every 0.25 s across each act boundary. |
| 4 Inspection pass | — | Stills every 0.25 s around every act boundary. Hunt: pops, clipping, flicker, texture swimming, spine drift, a scene that reads as mud at thumbnail size. Run the determinism check (and the seam check for a loop). |
| 5 Export | Frame-exact MP4 (below). | Watch it once end to end at 1×. Then once at 0.5×. Run the frame-diff pop check. |

Quality bar: fewer excellent scenes beat many mediocre ones. Apply the brief's budget rule
before quality slips.

### Inspection with the bundled renderer

`scripts/render-frames.ts` drives Chrome or Chromium headless over the DevTools Protocol on a
throwaway profile (zero dependencies; Bun + ffmpeg on PATH; DevTools on loopback only). It needs
the seek contract and prints any exception the page throws. **Only the main session runs it.**
A sub-agent never launches a browser, headless included: a builder sub-agent stops at each
Process checkpoint and hands back, and the main session renders the stills, reviews them, and
briefs the fixes.

```bash
S=<this skill's base directory>/scripts/render-frames.ts

# stills at exact times → stills/t1_80.png etc. (1440² at --scale 2)
bun $S index.html --t 0.3,1.8,3.0 --out stills

# boundary sweep: every 0.25 s from 13.5 to 16.5
bun $S index.html --t $(seq -s, 13.5 0.25 16.5) --out sweep

# non-square: match the page's W/H
bun $S index.html --t 2 --width 1280 --height 720
```

Read the stills with the Read tool and actually look. Check the spine position with a
fixed-pixel expectation (centre of a 720 frame at scale 2 is 720,720) rather than by eye.

Tile a batch into one contact sheet before reading it: one image call instead of a dozen,
and the sequence reads side by side. Once the frame sequence exists (export step), sweep
boundaries from it instead of re-rendering stills — eight consecutive frames around frame
`b` in one strip:

```bash
ffmpeg -y -loglevel error -pattern_type glob -i 'stills/t*.png' -vf "scale=480:480,tile=4x3:padding=4:color=black" sheet.png
ffmpeg -y -loglevel error -start_number $((b-4)) -i frames/f%05d.png -vf "scale=360:360,tile=8x1:padding=2:color=black" -frames:v 1 sweep_$b.png
```

Determinism, loop-seam, and frame-diff pop checks: `references/craft.md` § Inspection recipes.

### What bites first

- **Judge a move by how many frames it stays on screen, not by its duration.** A ripple on
  easeOutCubic over 0.6 s is past the frame edge in four frames at 24 fps — invisible. For a
  short piece use easeOutQuad over ~0.8 s; keep the cubic only inside a fast montage where the
  ring is a flicker by design. Anything tied to the rim (tick marks) is timed to the window the
  rim is in frame, roughly the first third of the ripple.
- **A reveal is a clip or a mask, not a scale.** Render at full frame, clip a growing shape.
  Scaling a textured bitmap (halftone, grain, pixels) resamples it and it swims.
- **State leaks.** A transform, alpha, composite mode, or filter left set by one element shifts
  the next. `save()`/`restore()` around every element that changes state.
- **DPR traps.** Offscreen canvases sized × DPR with the transform set; the 9-argument
  `drawImage` source rect and `putImageData` are in device pixels.
- Style-specific traps live in each style file's Pitfalls; the full symptom → cause → fix table
  is `references/craft.md` § Failure modes.

### Export

Two paths. The second is the real one.

| Path | How | Use |
|---|---|---|
| In-page Record | Record button → `MediaRecorder` WebM. Real-time capture; drops frames if playback stutters. | Quick share while iterating. Convert with `ffmpeg -i out.webm -c:v libx264 -pix_fmt yuv420p -crf 17 out.mp4`. |
| Frame-exact | `bun $S index.html --frames --fps 24 --out frames --mp4 piece.mp4` — seeks every frame, screenshots, stitches with ffmpeg (H.264, yuv420p, CRF 17, faststart). ~0.2 s/frame at 1440² on a grainy page (PNG encoding is the cost, not `render(t)`), so an 8 s piece is ~40 s and a 28 s piece ~2.5 min. | The deliverable. Deterministic; identical on every run. `--loop` drops the duplicate end frame of a seamless loop; `--from`/`--to` for a slice; `--scale 1` for a 720 px master (~4× faster); `--width`/`--height` for non-square canvases. |

Square 720 (1440 at scale 2) suits feeds, GitHub READMEs, and portfolio embeds. Landscape and
vertical sizes, palette-optimised GIFs, WebM, and adding audio: `references/craft.md` § Export
recipes.

## Don't

- External assets, libraries, fonts (network or system), image generation.
- Photorealism. Black outlines everywhere (unless the style calls for them, as pixel-art
  sprites do). Smooth gradients where the style says tone is dots, dither, or glaze.
- Crossfades between full scenes (drain is the one exception).
- Any text other than the signature.
- Random values that change from frame to frame.
- Frame-based timing, `requestAnimationFrame` state accumulation, or anything that makes
  `render(t)` depend on what was drawn before.
- A brief with adjectives where numbers belong.

## Files in this skill

| File | Purpose |
|---|---|
| `styles/*.md` | Seven style presets (see Pick a style), each with a runnable example for `references/harness.html`. |
| `references/harness.html` | Style-neutral engine shell: shared core, controls, Record, `?t=`, seek contract, STYLE slot. |
| `references/starter-cyanheads-ident.html` | The risograph engine starter: a finished 8 s `cyanheads` ident (three scenes, all core moves, lettering). Copy it to begin a riso piece. |
| `references/brief-cyanheads-ident.md` | The starter's brief — a filled template at the short end (8 s, 3 scenes). |
| `references/brief-template.md` | Fill-in template with the thirteen layers, blank. |
| `references/brief-exemplar-call-and-response.md` | The reference brief, verbatim — a 28 s risograph piece. Read it whole before writing a new one; it shows the density and specificity the template expects. |
| `references/craft.md` | Timing and easing, performance, lettering without fonts, failure modes, inspection and export recipes. |
| `scripts/render-frames.ts` | Headless Chrome renderer: stills at exact times, or frame sequence + MP4. |
