# HALCYON — *Intelligence, distilled.*

A cinematic, single-page brand experience for a **fictional** frontier intelligence —
designed and built by **Purvang Suvagiya** as a portfolio craft demo.
An award-tier flagship site: a live WebGL aurora, an **interactive Three.js
"intelligence core," Motion-powered choreography, and a genuinely infinite
seamless-loop section** — with **no build step** and plain **native scrolling**.

---

## Run it

Fully static. **Just open the file:**

```bash
open index.html          # macOS — or double-click it in Finder
```

Or serve it (nice for clean caching):

```bash
cd halcyon && python3 -m http.server 4500   # then visit http://localhost:4500
```

No `npm install`, no bundler, **no build step**. Three.js and Motion are
**vendored locally** in `vendor/` and loaded as ordinary `<script>` tags, so the full
3D / motion experience works even when you open `index.html` directly
from disk (`file://`) and even **offline**. Scrolling is plain native scrolling —
no smooth-scroll library. (Only the web-fonts come from Google Fonts;
without a connection they fall back to system fonts — everything else still runs.)
If any library is missing, the site degrades gracefully and the base experience keeps working.

---

## What's inside

| Section | Highlight |
|---|---|
| **Preloader** | Counts perception to 100% before unveiling the hero (fast-tracked on repeat visits) |
| **Hero** | Live **WebGL** domain-warped aurora shader + char-by-char wordmark reveal |
| **Manifesto** | Word-by-word "ignite" that resolves from blur as you scroll |
| **Capabilities** | Six-card bento grid with 3D tilt, cursor-tracked glow, animated visualizations |
| **The Core** | Interactive **Three.js** glass "intelligence core" — iridescent, breathing, cursor-reactive, ringed by orbiting thought-motes |
| **Metrics** | Count-up statistics in gradient display type (clearly labeled as illustrative) |
| **Vision** | Scroll-driven **pinned horizontal** storytelling with an aurora progress bar |
| **Continuum** | A genuinely **infinite**, seamless, velocity-reactive marquee wall |
| **The Build** | The honest maker frame — what this demo is, and what it demonstrates |
| **CTA** | Living aurora orb — a real contact link, not a dead button |

## Craft details

- **Interactive 3D core (Three.js)** — a subdivided icosahedron driven by a custom
  GLSL shader: layered-sine vertex displacement (it *breathes* and morphs), a
  fresnel-based **iridescent** surface cycling the aurora triad, a counter-rotating
  wireframe shell, ~900 additively-blended orbiting motes, and a soft glow sprite.
  It leans toward your cursor and responds to scroll velocity. DPR-capped, paused
  off-screen, and rendered static under reduced-motion.
- **Live WebGL aurora hero** — hand-written simplex-FBM domain-warp fragment shader.
- **Motion (the Framer Motion engine, vanilla)** — spring-based reveals with
  `inView` + `stagger`, and spring hover micro-interactions.
- **Native scrolling** — plain OS wheel/trackpad behavior; in-page anchor links
  jump smoothly via the browser's own `scrollIntoView`.
- **Infinite continuum** — three rows of seamless, looping, **scroll-velocity-reactive**
  marquees (filled/outlined kinetic type + glass capability chips) at different speeds.
- **Kinetic variable typography** — the Fraunces wordmark's weight tracks scroll velocity.
- **Custom morphing cursor** with magnetic targets and contextual labels.
- **Responsive to the edge** — a full-screen animated mobile menu below 880px,
  stacked fallbacks for the bento / showcase / footer, and touch-tuned 3D density.
- **Design system** — obsidian base + aurora accent triad (violet → cyan → amber),
  fluid `clamp()` type scale, bespoke motion easings, film-grain + vignette atmosphere.

## Accessibility & performance

- Fully honors `prefers-reduced-motion`: **the infinite loop is disabled**,
  the 3D core renders a single static frame, and decorative motion is frozen.
- The page always ends at the footer — the infinite section is a contained band, never
  a scroll trap.
- Full **no-JS / failed-CDN fallback** — all content stays visible and the base site works.
- Semantic landmarks, ARIA labels, visible focus states, AA-contrast text.
- DPR-capped WebGL, `IntersectionObserver`-gated render loops (only the on-screen scene
  runs), `requestAnimationFrame`-throttled scroll work.

## Tech

Vanilla **HTML5 · CSS3 · JavaScript** · **Three.js** (WebGL) ·
**Motion** (motion.dev — the Framer Motion engine) · custom GLSL · Canvas 2D.
Libraries are vendored as classic global builds (no modules, no build step).
Fonts: [Fraunces](https://fonts.google.com/specimen/Fraunces),
[Inter](https://fonts.google.com/specimen/Inter),
[JetBrains Mono](https://fonts.google.com/specimen/JetBrains+Mono).

```
halcyon/
├── index.html    # structure + content
├── styles.css    # core design system + all base styling/animation
├── enhance.css   # 3D core section + infinite continuum styles
├── app.js        # WebGL aurora, particle bento, cursor, scroll choreography
├── enhance.js    # Three.js core · Motion · infinite continuum
├── vendor/       # three.min.js · motion.js (local, offline-ready)
└── README.md
```

*Crafted with intent.*
