# JimmyVanVeen.com

A personal portfolio and blog with an editorial, typography-first design. This
glossary pins the words used when discussing the site's design and motion so
that tickets, specs, and code all say the same thing.

## Language

### Editorial design

**Plate**:
A photograph presented as a framed editorial figure, with an optional caption
and credit.
_Avoid_: Hero image, banner, background image

**Rule**:
A one-pixel hairline that separates sections or heads a block of content.
_Avoid_: Divider, border, line, hr

**Paper / Midnight ink**:
The two site themes, light and dark respectively.
_Avoid_: Light mode, dark mode, theme A/B

### Motion

**Spark**:
The single signature animation on the home page that makes the site feel alive.
There is one spark, not a collection of effects.
_Avoid_: Animation (too generic), effect, easter egg, VFX

**Motif**:
The subject the spark depicts: the #45 iRacing car.
_Avoid_: Sprite, mascot, character, asset, model (the model is the source file, not the motif)

**Scene**:
The rendered background the spark lives in: a fixed canvas behind the home
page showing the motif as an ink-dot particle cloud.
_Avoid_: Background, hero, canvas (the element, not the thing shown)

**Pose**:
One rest arrangement of the particle cloud. Scrolling morphs the scene from
one pose to the next.
_Avoid_: Keyframe, preset, state

**Load-in**:
The short, one-shot motion that plays when the page first appears, before
scroll takes over.
_Avoid_: Intro, entrance, splash

**Poster**:
The static image served in place of the scene when it cannot or should not
run: no WebGL, reduced motion, or Save-Data.
_Avoid_: Fallback image, placeholder, thumbnail

**Tier**:
A reduced configuration of the scene chosen for weaker devices so phones get
the spark rather than the poster.
_Avoid_: Mobile mode, lite mode, degraded
