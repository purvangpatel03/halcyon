/* ============================================================
   HALCYON — Interaction & Motion Engine
   Vanilla JS. No dependencies. Progressive + accessible.
   ============================================================ */
(() => {
  "use strict";

  const doc = document;
  const root = doc.documentElement;
  root.classList.remove("no-js");

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

  /* =========================================================
     1) PRELOADER  —  counts up, then unveils the hero
  ========================================================= */
  const preloader = doc.getElementById("preloader");
  const fill = doc.getElementById("preloaderFill");
  const countEl = doc.getElementById("preloaderCount");
  const statusEl = doc.getElementById("preloaderStatus");
  const hero = doc.getElementById("hero");

  const statuses = [
    "calibrating perception",
    "weaving attention",
    "tuning the lattice",
    "achieving clarity",
  ];

  function runPreloader() {
    if (!preloader) { hero && hero.classList.add("intro"); doc.body.classList.remove("loading"); return; }
    let pct = 0;
    const duration = prefersReduced ? 300 : 2100;
    const start = performance.now();

    function tick(now) {
      const t = clamp((now - start) / duration, 0, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      pct = Math.round(eased * 100);
      if (fill) fill.style.width = pct + "%";
      if (countEl) countEl.textContent = pct;
      if (statusEl) statusEl.textContent = statuses[Math.min(statuses.length - 1, Math.floor(eased * statuses.length))];
      if (t < 1) {
        requestAnimationFrame(tick);
      } else {
        finish();
      }
    }

    function finish() {
      preloader.classList.add("done");
      doc.body.classList.remove("loading");
      // Trigger hero entrance + reveal observers
      hero && hero.classList.add("intro");
      revealNow(hero);
      window.setTimeout(() => preloader && (preloader.style.display = "none"), 950);
    }

    // Wait for fonts (so the display type lands crisp), but never block forever
    const fontReady = (doc.fonts && doc.fonts.ready) ? doc.fonts.ready : Promise.resolve();
    Promise.race([fontReady, new Promise((r) => setTimeout(r, 1200))]).then(() => {
      requestAnimationFrame(tick);
    });
  }

  /* =========================================================
     2) SCROLL REVEAL  —  IntersectionObserver
  ========================================================= */
  const revealEls = () => doc.querySelectorAll(".reveal-up, [data-reveal]");
  let revealObserver;

  function setupReveal() {
    if (!("IntersectionObserver" in window)) {
      revealEls().forEach((el) => el.classList.add("in"));
      return;
    }
    revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const delay = parseInt(el.dataset.delay || "0", 10);
          window.setTimeout(() => el.classList.add("in"), prefersReduced ? 0 : delay);
          revealObserver.unobserve(el);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -8% 0px" });

    revealEls().forEach((el) => revealObserver.observe(el));
  }
  // reveal everything within a container immediately (used at hero intro)
  function revealNow(scope) {
    if (!scope) return;
    scope.querySelectorAll(".reveal-up").forEach((el) => {
      const delay = parseInt(el.dataset.delay || "0", 10);
      window.setTimeout(() => el.classList.add("in"), prefersReduced ? 0 : delay);
    });
  }

  /* =========================================================
     3) NAV state on scroll + SCROLL PROGRESS bar
  ========================================================= */
  const nav = doc.getElementById("nav");
  const progressFill = doc.getElementById("progressFill");

  function onScrollUI() {
    const y = window.scrollY || window.pageYOffset;
    if (nav) nav.classList.toggle("scrolled", y > 40);
    if (progressFill) {
      const h = doc.documentElement.scrollHeight - window.innerHeight;
      const p = h > 0 ? y / h : 0;
      progressFill.style.transform = `scaleX(${clamp(p, 0, 1)})`;
    }
  }

  /* =========================================================
     4) SCROLL VELOCITY  →  kinetic variable-font weight
        (Fraunces wght reacts to how fast you scroll)
  ========================================================= */
  const heroTitle = doc.getElementById("heroTitle");
  let lastY = window.scrollY, velocity = 0, smoothWght = 420;

  function kineticType() {
    const y = window.scrollY;
    const dv = Math.abs(y - lastY);
    velocity = lerp(velocity, dv, 0.2);
    lastY = y;
    // Map velocity (0..~120) to weight 380..760
    const target = clamp(380 + velocity * 5, 380, 760);
    smoothWght = lerp(smoothWght, target, 0.1);
    if (heroTitle) heroTitle.style.setProperty("--title-wght", smoothWght.toFixed(0));
  }

  /* =========================================================
     5) MANIFESTO  —  word-by-word "ignite" on scroll
  ========================================================= */
  const manifestoText = doc.getElementById("manifestoText");
  let manifestoWords = [];

  function setupManifesto() {
    if (!manifestoText) return;
    const text = manifestoText.textContent.trim();
    manifestoText.textContent = "";
    text.split(/\s+/).forEach((word, i) => {
      const span = doc.createElement("span");
      span.className = "w";
      span.textContent = word;
      span.style.transitionDelay = (i * 18) + "ms";
      manifestoText.appendChild(span);
      manifestoText.appendChild(doc.createTextNode(" "));
      manifestoWords.push(span);
    });
    // Reduced motion: don't gate legibility on scroll position — reveal it all.
    if (prefersReduced) manifestoWords.forEach((w) => w.classList.add("lit"));
  }

  function updateManifesto() {
    if (!manifestoText || !manifestoWords.length || prefersReduced) return;
    const rect = manifestoText.getBoundingClientRect();
    const vh = window.innerHeight;
    // progress: 0 when block enters from bottom, 1 when scrolled to upper third
    const start = vh * 0.85;
    const end = vh * 0.32;
    const p = clamp((start - rect.top) / (start - end), 0, 1);
    const litCount = Math.round(p * manifestoWords.length);
    manifestoWords.forEach((w, i) => w.classList.toggle("lit", i < litCount));
  }

  /* =========================================================
     6) COUNT-UP METRICS
  ========================================================= */
  function setupMetrics() {
    const metrics = doc.querySelectorAll(".metric[data-count]");
    if (!("IntersectionObserver" in window)) {
      metrics.forEach(animateMetric);
      return;
    }
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { animateMetric(e.target); obs.unobserve(e.target); }
      });
    }, { threshold: 0.5 });
    metrics.forEach((m) => obs.observe(m));
  }

  function formatCompact(n) {
    if (n >= 1e6) return (n / 1e6).toFixed(n % 1e6 === 0 ? 0 : 1) + "M";
    if (n >= 1e3) return (n / 1e3).toFixed(0) + "K";
    return String(n);
  }

  function animateMetric(el) {
    const target = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || "";
    const decimals = parseInt(el.dataset.decimals || "0", 10);
    const compact = el.dataset.format === "compact";
    const numEl = el.querySelector(".metric__num");
    const dur = prefersReduced ? 0 : 1600;
    const start = performance.now();

    function step(now) {
      const t = clamp((now - start) / (dur || 1), 0, 1);
      const eased = 1 - Math.pow(1 - t, 4);
      const val = target * eased;
      numEl.textContent = compact ? formatCompact(Math.round(val)) : val.toFixed(decimals) + suffix;
      if (t < 1) requestAnimationFrame(step);
      else numEl.textContent = compact ? formatCompact(target) : target.toFixed(decimals) + suffix;
    }
    requestAnimationFrame(step);
  }

  /* =========================================================
     7) PINNED HORIZONTAL SHOWCASE
  ========================================================= */
  const showcase = doc.getElementById("showcase");
  const showcaseTrack = doc.getElementById("showcaseTrack");
  let showcaseMax = 0, showcaseScrollLen = 0;

  function measureShowcase() {
    if (!showcase || !showcaseTrack) return;
    if (window.matchMedia("(max-width: 760px)").matches) {
      showcase.style.height = "";
      showcaseTrack.style.transform = "";
      showcaseScrollLen = 0;
      return;
    }
    showcaseMax = showcaseTrack.scrollWidth - window.innerWidth;
    showcaseMax = Math.max(0, showcaseMax);
    // total vertical scroll allotted = horizontal distance + one viewport of "hold"
    showcaseScrollLen = showcaseMax + window.innerHeight * 0.6;
    showcase.style.height = (window.innerHeight + showcaseScrollLen) + "px";
  }

  function updateShowcase() {
    if (!showcase || !showcaseTrack || showcaseScrollLen <= 0) return;
    const rect = showcase.getBoundingClientRect();
    const top = -rect.top;
    const p = clamp(top / showcaseScrollLen, 0, 1);
    showcaseTrack.style.transform = `translate3d(${-(p * showcaseMax).toFixed(2)}px,0,0)`;
  }

  /* =========================================================
     8) CTA line reveal
  ========================================================= */
  function setupCtaReveal() {
    const cta = doc.getElementById("cta");
    if (!cta || !("IntersectionObserver" in window)) { cta && cta.classList.add("in"); return; }
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); obs.unobserve(e.target); } });
    }, { threshold: 0.3 });
    obs.observe(cta);
  }

  /* =========================================================
     9) CUSTOM CURSOR + MAGNETIC + TILT  (pointer devices only)
  ========================================================= */
  function setupPointerFX() {
    if (isTouch) return;
    doc.body.classList.add("custom-cursor");

    const ring = doc.getElementById("cursorRing");
    const dot = doc.getElementById("cursorDot");
    const label = ring ? ring.querySelector(".cursor__label") : null;

    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let rx = mx, ry = my;
    let ready = false;

    window.addEventListener("pointermove", (e) => {
      mx = e.clientX; my = e.clientY;
      if (dot) dot.style.transform = `translate(${mx}px, ${my}px)`;
      if (!ready) {
        ready = true;
        ring && ring.classList.add("is-ready");
        dot && dot.classList.add("is-ready");
      }
    }, { passive: true });

    function ringLoop() {
      rx = lerp(rx, mx, 0.18);
      ry = lerp(ry, my, 0.18);
      if (ring) ring.style.transform = `translate(${rx}px, ${ry}px)`;
      requestAnimationFrame(ringLoop);
    }
    requestAnimationFrame(ringLoop);

    // Hover / label states
    doc.querySelectorAll("a, button, [data-cursor], [data-magnetic]").forEach((el) => {
      const cursorLabel = el.getAttribute("data-cursor");
      el.addEventListener("pointerenter", () => {
        if (!ring) return;
        if (cursorLabel) {
          ring.classList.add("is-label");
          if (label) label.textContent = cursorLabel;
        } else {
          ring.classList.add("is-hover");
        }
      });
      el.addEventListener("pointerleave", () => {
        if (!ring) return;
        ring.classList.remove("is-hover", "is-label");
      });
    });

    // Magnetic elements
    doc.querySelectorAll("[data-magnetic]").forEach((el) => {
      const strength = 0.4;
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - (r.left + r.width / 2)) * strength;
        const y = (e.clientY - (r.top + r.height / 2)) * strength;
        el.style.transform = `translate(${x}px, ${y}px)`;
      });
      el.addEventListener("pointerleave", () => { el.style.transform = ""; });
    });
  }

  /* Tilt cards + glow tracking (works on pointer devices) */
  function setupTilt() {
    if (isTouch) return;
    doc.querySelectorAll("[data-tilt]").forEach((card) => {
      const glow = card.querySelector(".bento__glow");
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        const rx = (py - 0.5) * -6;
        const ry = (px - 0.5) * 6;
        card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(0)`;
        if (glow) { glow.style.setProperty("--mx", px * 100 + "%"); glow.style.setProperty("--my", py * 100 + "%"); }
      });
      card.addEventListener("pointerleave", () => { card.style.transform = ""; });
    });
  }

  /* =========================================================
     10) HERO AURORA  —  WebGL domain-warped FBM shader
  ========================================================= */
  function setupAurora() {
    const canvas = doc.getElementById("aurora");
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "high-performance" })
            || canvas.getContext("experimental-webgl");
    if (!gl) { canvas.style.background = "radial-gradient(120% 100% at 50% 0%, #1a1140, #06060a)"; return; }

    const vsrc = `
      attribute vec2 p;
      void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;

    const fsrc = `
      precision highp float;
      uniform vec2 u_res;
      uniform float u_time;
      uniform vec2 u_mouse;

      // -- Ashima simplex noise 2D --
      vec3 mod289(vec3 x){return x-floor(x*(1.0/289.0))*289.0;}
      vec2 mod289(vec2 x){return x-floor(x*(1.0/289.0))*289.0;}
      vec3 permute(vec3 x){return mod289(((x*34.0)+1.0)*x);}
      float snoise(vec2 v){
        const vec4 C=vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);
        vec2 i=floor(v+dot(v,C.yy));
        vec2 x0=v-i+dot(i,C.xx);
        vec2 i1=(x0.x>x0.y)?vec2(1.0,0.0):vec2(0.0,1.0);
        vec4 x12=x0.xyxy+C.xxzz; x12.xy-=i1;
        i=mod289(i);
        vec3 perm=permute(permute(i.y+vec3(0.0,i1.y,1.0))+i.x+vec3(0.0,i1.x,1.0));
        vec3 m=max(0.5-vec3(dot(x0,x0),dot(x12.xy,x12.xy),dot(x12.zw,x12.zw)),0.0);
        m=m*m; m=m*m;
        vec3 x=2.0*fract(perm*C.www)-1.0;
        vec3 h=abs(x)-0.5;
        vec3 ox=floor(x+0.5);
        vec3 a0=x-ox;
        m*=1.79284291400159-0.85373472095314*(a0*a0+h*h);
        vec3 g;
        g.x=a0.x*x0.x+h.x*x0.y;
        g.yz=a0.yz*x12.xz+h.yz*x12.yw;
        return 130.0*dot(m,g);
      }
      float fbm(vec2 p){
        float v=0.0, a=0.5;
        for(int i=0;i<5;i++){ v+=a*snoise(p); p*=2.02; a*=0.5; }
        return v;
      }
      void main(){
        vec2 uv = gl_FragCoord.xy / u_res.xy;
        vec2 p = (gl_FragCoord.xy - 0.5*u_res.xy) / u_res.y;
        float t = u_time*0.045;

        // gentle parallax toward mouse
        p += (u_mouse - 0.5) * 0.25;

        // domain warp
        vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, 1.3) - t));
        vec2 r = vec2(fbm(p + 3.5*q + vec2(1.7, 9.2) + 0.12*t),
                      fbm(p + 3.5*q + vec2(8.3, 2.8) - 0.10*t));
        float f = fbm(p + 3.5*r);

        vec3 deep   = vec3(0.020, 0.019, 0.044);
        vec3 violet = vec3(0.498, 0.361, 1.0);
        vec3 cyan   = vec3(0.180, 0.843, 0.945);
        vec3 amber  = vec3(1.0,   0.733, 0.45);
        vec3 rose   = vec3(1.0,   0.42,  0.62);

        vec3 col = deep;
        col = mix(col, violet, clamp(f*f*1.55 + 0.10, 0.0, 0.92));
        col = mix(col, cyan,   clamp(length(q)*0.55, 0.0, 0.62));
        col = mix(col, amber,  clamp(r.x*0.38, 0.0, 0.40));
        col = mix(col, rose,   clamp(r.y*0.18, 0.0, 0.26));

        // luminous filaments (the "aurora" wisps)
        float fil = smoothstep(0.52, 0.60, abs(f));
        col += fil * 0.20 * mix(cyan, violet, 0.5);
        // soft additive bloom from the warp magnitude
        col += pow(clamp(length(q), 0.0, 1.0), 2.6) * 0.13 * cyan;

        // focal glow pushed to the upper-right, away from the headline & copy
        float d = length((uv - vec2(0.74, 0.80)) * vec2(u_res.x/u_res.y, 1.0));
        float vig = smoothstep(1.5, 0.08, d);
        col *= 0.13 + 0.80 * vig;

        // gentle deepening for a richer, premium falloff
        col = pow(col, vec3(0.98));

        // subtle dither to kill banding
        float dither = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898,78.233))) * 43758.5453);
        col += (dither - 0.5) * 0.015;

        gl_FragColor = vec4(col, 1.0);
      }`;

    function compile(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
        console.warn("HALCYON shader:", gl.getShaderInfoLog(s)); return null;
      }
      return s;
    }
    const vs = compile(gl.VERTEX_SHADER, vsrc);
    const fs = compile(gl.FRAGMENT_SHADER, fsrc);
    if (!vs || !fs) { canvas.style.background = "radial-gradient(120% 100% at 50% 0%, #1a1140, #06060a)"; return; }

    const prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "u_res");
    const uTime = gl.getUniformLocation(prog, "u_time");
    const uMouse = gl.getUniformLocation(prog, "u_mouse");

    let mouse = [0.5, 0.5], mouseTarget = [0.5, 0.5];
    window.addEventListener("pointermove", (e) => {
      mouseTarget = [e.clientX / window.innerWidth, 1.0 - e.clientY / window.innerHeight];
    }, { passive: true });

    const DPR = Math.min(window.devicePixelRatio || 1, 1.6);
    function resize() {
      const w = Math.floor(canvas.clientWidth * DPR);
      const h = Math.floor(canvas.clientHeight * DPR);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w; canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
    }

    let visible = true, running = true;
    const io = new IntersectionObserver((es) => { visible = es[0].isIntersecting; }, { threshold: 0 });
    io.observe(canvas);
    doc.addEventListener("visibilitychange", () => { running = !doc.hidden; });

    const startTime = performance.now();
    let frame = 0;
    function render(now) {
      requestAnimationFrame(render);
      if (!visible || !running) return;
      // For reduced motion, render a single static frame then idle
      if (prefersReduced && frame > 1) return;
      frame++;
      resize();
      mouse[0] = lerp(mouse[0], mouseTarget[0], 0.04);
      mouse[1] = lerp(mouse[1], mouseTarget[1], 0.04);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, prefersReduced ? 8.0 : (now - startTime) / 1000);
      gl.uniform2f(uMouse, mouse[0], mouse[1]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    requestAnimationFrame(render);
  }

  /* =========================================================
     11) SMOOTH ANCHOR SCROLL (respects reduced motion)
     (The "field" section is a Three.js scene owned by enhance.js —
      #coreCanvas — so there is no Canvas-2D fallback to wire here.)
  ========================================================= */
  function setupAnchors() {
    doc.querySelectorAll('a[href^="#"]').forEach((a) => {
      a.addEventListener("click", (e) => {
        const id = a.getAttribute("href");
        if (id === "#" || id.length < 2) { e.preventDefault(); return; }
        const target = doc.querySelector(id);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: prefersReduced ? "auto" : "smooth", block: "start" });
        }
      });
    });
  }

  /* =========================================================
     UTIL
  ========================================================= */
  function debounce(fn, ms) {
    let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  }

  /* =========================================================
     RAF master loop for scroll-coupled effects
  ========================================================= */
  let ticking = false;
  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(() => {
        onScrollUI();
        kineticType();
        updateManifesto();
        updateShowcase();
        ticking = false;
      });
    }
  }

  /* =========================================================
     BOOT
  ========================================================= */
  function init() {
    setupManifesto();
    setupReveal();
    setupMetrics();
    setupCtaReveal();
    setupAnchors();
    setupPointerFX();
    setupTilt();
    setupAurora();
    measureShowcase();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", debounce(() => { measureShowcase(); updateShowcase(); }, 200));

    onScrollUI();
    updateManifesto();
    updateShowcase();

    runPreloader();
  }

  if (doc.readyState === "loading") {
    doc.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
