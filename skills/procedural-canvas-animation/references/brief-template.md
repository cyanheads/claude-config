# Brief template — procedural canvas animation

Fill every slot with a number, a name, or a concrete noun. Delete the guidance in `⟨ ⟩` once
filled. Keep the section order; the builder reads it top to bottom and the timeline references
names defined below it. The exemplar next to this file shows the target density.

---

Build a ⟨N⟩-second procedural animation in a ⟨style preset⟩ style, as ONE self-contained
`index.html` (Canvas 2D, no libraries, no network fonts, no images, no assets of any kind — every
pixel is drawn by code). Make the finished animation, not a demo of techniques.

## The idea

⟨~80 words of prose. Protagonist · want · obstacle · turn · resolution · coda. Name the ending
image.⟩

The spine of the whole piece: ⟨the one visual invariant — what it is, where it's pinned, what
radiates from it⟩. Every scene, every transition and every camera move is organised around it.
It never ⟨drifts / breaks / changes colour⟩ during Acts ⟨I–III⟩.

## Format

- ⟨W⟩×⟨H⟩ canvas (render internally at devicePixelRatio), ⟨N.0⟩ s, time-based (not frame-based).
- Paper/background: ⟨colour + texture rule⟩ in all "paper" moments.
- Cuts on a ⟨BPM⟩ BPM grid: ⟨0.25⟩ s and ⟨0.5⟩ s are the base units.

## Timeline

| Time (s) | Act | What happens |
|---|---|---|
| ⟨0.0–1.5⟩ | I. ⟨name⟩ | ⟨quiet open; establish the spine; one or two moves⟩ |
| ⟨1.5–4.5⟩ | | ⟨first reveals; name the transition variants⟩ |
| ⟨4.5–6.0⟩ | | ⟨dive to full bleed⟩ |
| ⟨6.0–13.9⟩ | II. ⟨name⟩ | ⟨montage; cut cadence and acceleration; where the breaths fall⟩ |
| ⟨13.9–15.9⟩ | | ⟨rewind / alternate colourway / lens ring⟩ |
| ⟨15.9–17.8⟩ | III. ⟨name⟩ | ⟨pull back; archive; drain; scatter; one beat of stillness⟩ |
| ⟨17.8–22.0⟩ | IV. ⟨name⟩ | ⟨the turn; second element enters; call and response⟩ |
| ⟨22.0–23.0⟩ | | ⟨the meeting; bloom⟩ |
| ⟨23.0–24.0⟩ | V. ⟨name⟩ | ⟨duotone reprise; both elements in every frame⟩ |
| ⟨24.0–26.0⟩ | | ⟨zoom out to the many⟩ |
| ⟨26.0–28.0⟩ | VI. Signature | ⟨paper; "⟨cyanheads⟩" hand-lettered stroke by stroke in ⟨ink⟩ with ⟨misregistration ink⟩; the spine mark under it; short hold; dissolve to halftone dots⟩ |

⟨Every boundary on the beat grid. Every block names the move that opens and closes it.⟩

## Scene library (Act ⟨II⟩, in order)

⟨subject · setting · where the spine element lands⟩ · ⟨…⟩ · ⟨…⟩

⟨25–30 for an 8 s montage at 0.25–0.5 s per cut. Prefer subjects with a concentric or radiating
motif that rhymes with the spine.⟩

## Composition rules for every scene

- One bold subject, readable as a silhouette in 0.25 s. Strong value contrast.
- The spine element lands on a meaningful spot (⟨three examples from your library⟩).
- Many scenes contain ⟨the rhyming motif⟩ that echo the spine.
- ⟨3–4⟩ inks per scene maximum.

## Visual system (⟨style preset⟩)

⟨Fill from `styles/<style>.md`: its palette tokens, rule for darks, tone method, texture, and
line quality. The rows below are the risograph set; rename them to fit the style (a pixel-art
brief has palette, buffer size, dither, and outline rows instead of inks, halftone, and
registration).⟩

- Paper: ⟨hex⟩, ⟨grain rule⟩. Static — never flickers.
- Inks: ⟨name hex⟩ · ⟨name hex⟩ · ⟨…⟩ (⟨which ink is the spine + lettering⟩). ⟨rule for darks⟩.
- Tone: ⟨halftone pitch, screen angle per ink / grain / hatching⟩. Gradients = ⟨method⟩. Solids at 100 %.
- Registration: ⟨offset px range, fixed per-scene direction; spine fringe rule⟩.
- Texture: ⟨speckle / voids / hatching / dust — generated once per object⟩.
- Line quality: ⟨wobble, width variation, imperfect circles rule⟩.
- The spine element: ⟨ink⟩, ~⟨2.2⟩ % of frame width.

## Motion vocabulary

⟨Copy the rows you use from the skill's table; add at most two piece-specific moves. Each row:
name · what · duration · easing.⟩

## Architecture

- `render(t)` is a pure, deterministic function of time: seekable to any frame.
- Seeded PRNG (mulberry32) per scene and per element. Never `Math.random()` in the render loop. Textures stay attached to their objects.
- Timeline is a data array of cues `{start, duration, kind, scene, transition, params}`, not hard-coded if/else.
- Each scene is a module `{id, inks | layers, draw(ctx, localT, rng)}` in a registry.
- Compositor: ⟨the style file's compositing; for risograph: draw each ink's coverage into an offscreen greyscale canvas → halftone with a precomputed threshold tile per screen angle → tint → composite with multiply on the paper, with the registration offset⟩.
- Pre-render each scene's static ink layers once (lazily, with a loading bar) into bitmaps. Animate only transforms plus a few small live elements (⟨list⟩). Target 60 fps on a laptop.
- Hand-lettering: only the glyphs needed, as stroke paths (no font files).
- Expose `window.__anim = { duration, ready, seek(t) }` for headless inspection and export.

## Controls & export

- Play/pause (space), replay, scrubber with time readout and act markers, ←/→ step one frame (1/24 s).
- `?t=12.5` URL param opens paused at that time.
- "Record" button: `canvas.captureStream(24)` + `MediaRecorder` → WebM download.
- Output: ⟨720×720 / 1280×720 / 720×1280⟩ MP4 ⟨, seamless loop — every motion completes whole cycles in ⟨N⟩ s; export with `--loop`⟩.
- Optional, muted by default: WebAudio soundtrack at ⟨BPM⟩ (⟨texture⟩), a soft ping on each ⟨spine move⟩.

## Process — do not try to one-shot this

Stills come from the skill's `scripts/render-frames.ts`, run only by the main session. A builder working as a sub-agent never launches a browser, headless included: at each review below it stops and hands back, and the fixes come back as the next brief.

1. Engine first: paper, compositor, spine element, ⟨first move⟩, timeline, controls. Stop for a still review at t = ⟨0.3, 1.8, 3.0⟩ before going further.
2. Scenes in batches of ~8. After each batch, stop for a still review of each scene at its cue time at ⟨W⟩×⟨H⟩. Fix muddy, illegible or off-spine compositions before the next batch.
3. Transitions + Acts ⟨III–VI⟩.
4. Full inspection pass: stills every 0.25 s around ⟨every act boundary, listed⟩. Fix pops, clipping, flicker, texture swimming, and spine drift.
5. Export frame-exact MP4.

Quality bar: fewer excellent scenes beat many mediocre ones. If you run short on budget, cut
⟨Act II scenes⟩ — never ⟨the transitions or Acts III–VI⟩.

## Don't

- external assets, libraries, fonts or image generation
- photorealism, black outlines everywhere, smooth gradients without ⟨tone method⟩
- crossfades between full scenes (except ⟨the one allowed⟩)
- any text other than the final signature
- random values that change from frame to frame
