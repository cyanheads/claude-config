# Brief — cyanheads ident (8 s, risograph)

Build an 8-second procedural animation in a risograph-print style, as ONE self-contained index.html
(Canvas 2D, no libraries, no fonts, no images, no assets). Make the finished animation, not a demo.

## The idea
A lone indigo dot on cream paper sends out a ripple. Each ripple leaves a small printed world behind
it — a koi pond, a turntable, a ringed planet — each one built around the dot. The camera dives
through the last world, then the paper goes blank and the dot is answered by one pink ripple.
Under that answer the name is written by hand: cyanheads. The lettering dissolves into halftone
dust; the dot remains.

The spine: an indigo dot pinned to the exact centre, concentric ripple rings from it. Every disc,
dive, and the lettering are organised around it. It never moves, at any point in the piece.

## Format
720×720 (render at DPR), 8.0 s, time-based. Cream paper #F2EDE3. 120 BPM: 0.25 s / 0.5 s units.

## Timeline
| Time (s) | Act | What happens |
|---|---|---|
| 0.0–1.0 | I. Call | Paper, dot. Blue ripples at 0.0 and 0.5 with 2–3 tick-mark arcs flicking at the rim. |
| 1.0–3.5 | II. Worlds | Each ripple (1.0, 1.75, 2.5) leaves a disc (~55 % width) over the previous: koi pond (grow, easeOutBack) → turntable (coin flip, rim visible) → ringed planet (slide-in from right, slight rotation). |
| 3.5–4.5 | | Dive: the planet disc irises to full bleed in 0.35 s (easeInOutCubic), hold. |
| 4.5–5.5 | III. Answer | Hard cut to paper. Blue ripple (breath) at 4.5. Pink ripple at 5.0 — the answer. |
| 5.5–7.5 | IV. Signature | "cyanheads" hand-lettered stroke by stroke in indigo with pink misregistration, baseline above the dot so the dot reads as the mark under the word. Writes in 1.6 s, holds. |
| 7.5–8.0 | | Lettering dissolves into halftone dots that shrink to zero, noise-staggered. Dot on paper. |

## Scene library (Act II, in order)
koi pond with lily pads and concentric water rings (dot = ring centre) · turntable (dot = spindle,
yellow label) · ringed planet in an indigo night with star grain (dot = planet centre; the dive scene).

## Composition rules
One bold subject, silhouette-readable in 0.25 s. Dot on a meaningful spot. Concentric motif in every
scene. ≤4 inks per scene.

## Visual system — risograph (house preset, see skill)
## Motion vocabulary — ripple, disc-reveal (grow / coin / slide), dive, cut, breath, handwriting, dissolve
## Architecture — per skill engine contract; expose window.__anim
## Process — engine → stills at 0.3, 1.8, 3.0 → scenes (one batch of 3) → transitions → sweep every 0.25 s around 1.0, 3.5, 4.5, 5.5, 7.5 → frame-exact MP4
Budget rule: cut the turntable scene first; never the dive, the answer, or the signature.
## Don't — per skill
