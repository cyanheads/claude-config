# Exemplar brief — "Call and response" (28 s, risograph)

The reference brief this skill was distilled from, verbatim. It is the target density for any
new brief: every layer present, every value a number, every move named. Read it whole before
writing one. The signature text (`opus 5` / `claude`) is the original author's; ours defaults to
`cyanheads`.

Where it's looser than the skill: the headline says 30 s while the format says 28.0 s (28.0 is
the real duration), and three timeline boundaries (13.9, 15.9, 17.8) sit off the 0.25 s grid —
put every boundary on the grid in a new brief. It also describes the headless review loop
without naming a tool; `scripts/render-frames.ts` is that tool, and only the main session runs
it — a builder sub-agent never launches a browser (see `brief-template.md` § Process).

---

Build a 30-second procedural animation in a risograph-print style, as ONE self-contained index.html (Canvas 2D, no libraries, no network fonts, no images, no assets of any kind — every pixel is drawn by code). Make the finished animation, not a demo of techniques.

**The idea**
A lone ink dot calls out into the world with ripples, and everything that resonates answers back — bells, wolves, whales, radios, fireworks. It collects them as memories, but alone they fade to blue. Then a second dot, pink, answers from off-screen. Call and response. Where their ripples meet, a flower blooms, the world is reprinted in their two inks, and we pull back to a universe full of pairs. It ends on a hand-lettered signature.

The spine of the whole piece: a small indigo dot pinned to the exact centre of the frame, and concentric ripple rings coming out of it. Every scene, every transition and every camera move is organised around that dot. It never drifts during Acts I–III.

**Format**
Square 720×720 canvas (internally render at devicePixelRatio), 28.0 s, time-based (not frame-based).
Warm cream paper background in all "paper" moments.
Music/cuts on a 120 BPM grid: 0.25 s and 0.5 s are the base units.

**Timeline**

| Time (s) | Act | What happens |
|---|---|---|
| 0.0–1.5 | I. The call | Blank cream paper, dot at centre. Two blue ripple rings expand from the dot past the frame edges. Little curved "vibration" tick marks (2–3 short parallel arcs) flick near the rim. |
| 1.5–4.5 | | Each ripple leaves behind a disc (~55 % of frame width) holding a tiny world, with blank paper + one ripple between each: koi pond with lily pads and concentric water rings → a cricket silhouetted on a big yellow moon (the disc flips in like a coin, its rim thickness visible) → jellyfish in a deep green-blue sea (disc slides in from the right, rotating slightly). |
| 4.5–6.0 | | A disc opens on the dot and the camera dives through it to full bleed: owl close-up → temple bell ringing (sound arcs) → lighthouse (beam + wave arcs). Each next scene opens as a disc over the previous one, then fills the frame. |
| 6.0–13.9 | II. Everything resonates | Montage of full-bleed scenes, hard cuts on the beat, accelerating from ~0.5 s to ~0.25 s per scene. At 6.0, 8.0 and 10.0 it "breathes": back to blank paper for one ripple, then the next scene irises open from the dot. Scene order below. |
| 13.9–15.9 | | Rewind: earlier scenes flash back in reverse, each in an alternate colourway (inks swapped), framed by a thin pale double "lens" ring around the dot that tightens a little each time. |
| 15.9–17.8 | III. Archive | Pull back: all scenes are now ~40 circular medallions on 4 concentric orbits around the dot, like grooves on a record or a solar system, on pale yellow paper, orbits slowly counter-rotating. Then they drain to a single blue ink (cyanotype look), shrink, scatter outward and vanish. Lone dot on paper. One beat of stillness. |
| 17.8–22.0 | IV. The answer | A pink halftone glow creeps in from the bottom-left corner; pink ripple arcs roll in from off-screen. The dot answers with a blue ring. The camera eases back and pans to reveal a pink dot bottom-left. Call and response: alternating blue and pink ripples, each a little bolder, the rings drifting closer. |
| 22.0–23.0 | | Their rings touch: tiny yellow sparks at the contact point, the pink dot gets a yellow core, and a pink halftone lotus with an orange-yellow heart blooms between them and slowly spins, framed by one blue and one pink ring. |
| 23.0–24.0 | V. Together | Fast duotone reprise printed in ONLY pink + blue ink: waterfall, whale, rocket launch, ringed planet — with both dots now visible in every frame. |
| 24.0–26.0 | | Deep indigo night with star grain and nebula haze. The two dots, now with yellow halos, orbit each other inside their own rings. Zoom out: hundreds of other blue/pink pairs, each orbiting inside small rings. |
| 26.0–28.0 | VI. Signature | Cream paper. "opus 5" is hand-lettered stroke by stroke in indigo ink with pink misregistration. The two dots sit side by side under it as a "••" mark; the pink dot sends one small ring; "claude" writes itself below. Short hold, then all the lettering dissolves into halftone dots that shrink away. |

(Replace "opus 5" / "claude" with your own title.)

**Scene library (Act II, in order)**
howling wolf on a snowy ridge under aurora · rotary telephone ringing on a pink sunburst · turntable (the dot = the spindle) · frogs croaking under a huge full moon among reeds · bats pouring out of a cave at sunset · breaking ocean wave · cat from behind at a rainy night window, city lights · sunflower with a bumblebee (dot = flower heart) · cathedral valve radio with sound arcs · fireworks over a harbour · hummingbird among morning glories · whistling red kettle against a tiled wall · Ferris wheel at a fairground at dusk · jungle waterfall · bicycle under bougainvillea · whale in shafts of light · grand piano / harp strings with sound arcs · rocket launch from a gantry, billowing clouds · apartment windows at night with a moon · ringed planet · hot-air balloons over hills · volcano with lightning · radio telescope listening to a spiral galaxy · campfire in a dark forest · sunflower field to the horizon · layered mountain ridges at sunrise · lone umbrella pine over furrowed fields at dusk · raindrops on a night pond.

**Composition rules for every scene**

- One bold subject, readable as a silhouette in 0.25 s. Strong value contrast.
- The centre dot lands on a meaningful spot (record spindle, bell body, phone dial, sunflower heart, where the howl starts…).
- Many scenes contain concentric sound/light/water arcs that rhyme with the ripples.
- 3–4 inks per scene maximum.

**Visual system (risograph)**

- Paper: warm cream #F2EDE3, subtle fibre grain and faint mottling. Static — never flickers.
- Inks (riso standards): Blue #0078BF, Fluorescent Pink #FF48B0, Yellow #FFE800, Green #00A95C, Orange #FF6C2F, Violet #765BA7, Indigo #2E3192 (the dot and the lettering). No pure black: darks come from overprinting inks (multiply).
- Halftone: each ink is its own layer. Tones are dot screens with visible dots (~4–6 px pitch), a different screen angle per ink (e.g. 15°, 45°, 75°, 0°). Gradients = dot-size ramps. Solids at 100 %.
- Misregistration: each ink layer offset by 1–3 px in a fixed per-scene direction. The centre dot always shows a thin pink fringe on one side.
- Print texture: speckle flecks, small ink-starved voids in solids, white hatching for highlights.
- Line quality: hand-drawn wobble and stroke-width variation. Ripples are never perfect circles (low-frequency noise on the radius, tapered ends).
- The dot: indigo, ~2.2 % of frame width.

**Motion vocabulary**

- Ripple: ring grows from the dot to beyond the frame corner in ~0.6 s (easeOutCubic), thinning and fading; 2–3 tick-mark arcs flick at the rim.
- Disc reveal: circular mask grows with a slight overshoot (easeOutBack). Variants: coin flip (scaleX 0→1, ellipse with visible rim thickness in a darker ink), slide-in with a little rotation.
- Dive: scale the disc up to full bleed in ~0.35 s (easeInOutCubic); the dot stays centred.
- Montage cut: hard cut on the 0.25 / 0.5 s grid. No crossfades between full scenes.
- Lens ring: pale double outline around the dot, tightening shot by shot.
- Archive pull-back: the current scene shrinks into one medallion, the others appear on their orbits; orbits alternate rotation direction.
- Ink drain: each medallion re-rendered as a single blue ink from its luminance, then crossfaded (the only allowed crossfade).
- Scatter: medallions move outward (easeInQuad) while shrinking to zero.
- Bloom: petals unfold with a stagger (easeOutBack), then slow rotation.
- Camera: smooth, critically-damped pans and zooms. No jitter.
- Handwriting: single-line glyph paths revealed by stroke progress along their length.
- Dissolve: lettering converted to halftone dots that shrink to zero with noise-staggered timing.

**Architecture**

- render(t) is a pure, deterministic function of time: the animation is seekable to any frame.
- Seeded PRNG (e.g. mulberry32) per scene and per element. Never call Math.random() inside the render loop. Textures stay attached to their objects.
- The timeline is a data array of cues {start, duration, kind, scene, transition, params}, not hard-coded if/else.
- Each scene is a module {id, inks, draw(inkCtx, localT, rng)} in a registry.
- Riso compositor: draw each ink's coverage into an offscreen greyscale canvas → halftone it with a precomputed threshold tile per screen angle → tint → composite with multiply on the paper, with the registration offset.
- Pre-render each scene's static ink layers once (lazily, with a loading bar) into bitmaps. Animate only transforms plus a few small live elements (fire, wings, water arcs, beams). Target 60 fps playback on a laptop.
- Hand-lettering: define only the glyphs needed as stroke paths (no font files).

**Controls & export**

- Play/pause (space), replay, scrubber with time readout and act markers, ←/→ to step one frame (1/24 s).
- ?t=12.5 URL param to open paused on a given time (used for inspection).
- "Record" button: canvas.captureStream(24) + MediaRecorder → WebM download.
- Optional, muted by default: WebAudio soundtrack at 120 BPM (warm analog pad + soft arpeggio), a soft ping on each ripple, blue and pink pings a minor third apart in Act IV.

**Process — do not try to one-shot this**

1. Engine first: paper, riso compositor, dot, ripple, timeline, controls. Stop and show me stills at t = 0.3, 1.8, 3.0 before going further.
2. Scenes in batches of ~8. After each batch, open each scene with ?t= in a headless browser at 720×720, screenshot it and look at it. Fix muddy, illegible or off-centre compositions before starting the next batch.
3. Transitions + Acts III–VI.
4. Full inspection pass: screenshot every 0.25 s around 1.5, 4.5, 6.0, 13.9, 15.9, 17.8, 22.0, 24.0 and 26.0. Fix pops, clipping, flicker, texture swimming, and the dot drifting off centre.

Quality bar: fewer excellent scenes beat many mediocre ones. If you run short on budget, cut Act II scenes — never the transitions or Acts III–VI.

**Don't**

- external assets, libraries, fonts or image generation
- photorealism, black outlines everywhere, smooth gradients without halftone
- crossfades between full scenes (except the ink drain)
- any text other than the final signature
- random values that change from frame to frame
