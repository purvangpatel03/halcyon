/* ============================================================
   HALCYON — Enhancement Layer  (classic script — runs on file:// too)
   Three.js interactive 3D core · Motion (Framer Motion engine) ·
   native scroll · infinite seamless continuum.
   The libraries are loaded as classic globals (vendor/*.js) BEFORE this
   file, so everything works even when index.html is opened directly from
   disk. If any library is absent, the base site is untouched.
   ============================================================ */
(function () {
  "use strict";

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = matchMedia('(hover: none), (pointer: coarse)').matches;
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  /* ---- shared scroll signals (sampled from native scroll) ---- */
  const Scroll = { y: window.scrollY, vel: 0, velSmooth: 0 };

  /* ---------- library globals (graceful if any is missing) ---------- */
  const THREE = window.THREE || null;
  const motion = window.Motion || null;
  if (!THREE) console.warn('[halcyon] Three.js global missing — 3D core skipped');
  if (!motion) console.warn('[halcyon] Motion global missing — CSS reveals used');

/* =========================================================
   1) SCROLL — plain, native scrolling. No smooth-scroll library.
   The wheel / trackpad behave exactly like the OS default (no momentum
   hijacking). We only sample a lightweight velocity signal so the 3D core
   and the continuum marquee can still react to how fast you're scrolling.
   In-page anchor links are handled natively in app.js (setupAnchors).
========================================================= */
function initScroll() {
  let last = window.scrollY;
  const tick = () => {
    const y = window.scrollY;
    Scroll.vel = y - last; last = y; Scroll.y = y;
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/* continuously smooth the velocity for organic reactions */
function startSignalLoop() {
  const tick = () => {
    Scroll.velSmooth = lerp(Scroll.velSmooth, Scroll.vel, 0.12);
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/* =========================================================
   2) THREE.JS — the "intelligence core"
   A faceted, iridescent glass solid that breathes, morphs,
   and tilts toward the cursor. Surrounded by orbiting thought-motes.
========================================================= */
function initCore() {
  const canvas = document.getElementById('coreCanvas');
  if (!canvas || !THREE) return;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  } catch (e) { console.warn('[halcyon] core renderer failed:', e.message); return; }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  try { // match modern sRGB output on older (UMD) Three builds
    if ('outputColorSpace' in renderer && THREE.SRGBColorSpace !== undefined) renderer.outputColorSpace = THREE.SRGBColorSpace;
    else if ('outputEncoding' in renderer && THREE.sRGBEncoding !== undefined) renderer.outputEncoding = THREE.sRGBEncoding;
  } catch (e) {}

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
  camera.position.set(0, 0, 4.4);

  const group = new THREE.Group();
  scene.add(group);

  /* --- the core: custom iridescent shader on a subdivided icosahedron --- */
  const detail = isTouch ? 4 : 6;
  const coreGeo = new THREE.IcosahedronGeometry(1.25, detail);

  const coreUniforms = {
    uTime: { value: 0 },
    uScroll: { value: 0 },
    uPointer: { value: new THREE.Vector2(0, 0) },
    uHover: { value: 0 },
  };

  const coreMat = new THREE.ShaderMaterial({
    uniforms: coreUniforms,
    transparent: true,
    vertexShader: /* glsl */`
      uniform float uTime;
      uniform float uScroll;
      uniform vec2  uPointer;
      varying vec3 vN;
      varying vec3 vView;
      varying float vDisp;
      // layered sine "noise" — cheap, organic, smooth
      float n3(vec3 p){ return sin(p.x) * sin(p.y) * sin(p.z); }
      void main(){
        vec3 p = position;
        float t = uTime * 0.55;
        float d = 0.0;
        d += n3(p * 1.9 + t) * 0.55;
        d += n3(p * 3.7 - t * 1.3) * 0.27;
        d += n3(p * 6.9 + t * 0.7) * 0.13;
        // pointer ripple — attention bends the surface toward the cursor
        float pull = dot(normalize(p.xy + 0.0001), normalize(uPointer + 0.0001));
        d += pull * 0.18 * smoothstep(0.0, 1.0, length(uPointer));
        float amp = 0.16 + uScroll * 0.10;
        vec3 np = p + normal * d * amp;
        vDisp = d;
        vec4 mv = modelViewMatrix * vec4(np, 1.0);
        vView = -mv.xyz;
        vN = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */`
      precision highp float;
      uniform float uTime;
      uniform float uHover;
      varying vec3 vN;
      varying vec3 vView;
      varying float vDisp;
      // aurora triad palette: violet -> cyan -> amber
      vec3 palette(float h){
        vec3 v = vec3(0.490, 0.361, 1.000);
        vec3 c = vec3(0.133, 0.827, 0.933);
        vec3 a = vec3(1.000, 0.722, 0.420);
        h = fract(h);
        return (h < 0.5) ? mix(v, c, h * 2.0) : mix(c, a, (h - 0.5) * 2.0);
      }
      void main(){
        vec3 N = normalize(vN);
        vec3 V = normalize(vView);
        float fres = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 2.3);
        float h = fract(fres * 0.85 + vDisp * 0.35 + uTime * 0.02);
        vec3 irid = palette(h);
        vec3 base = vec3(0.018, 0.018, 0.045);
        vec3 col = mix(base, irid, clamp(fres * 1.15, 0.0, 1.0));
        col += irid * pow(fres, 3.0) * (1.6 + uHover * 0.9);     // luminous rim
        col += vec3(0.10, 0.12, 0.24) * (0.45 + 0.55 * vDisp);   // inner sheen
        float alpha = clamp(0.55 + fres * 0.7, 0.0, 1.0);
        gl_FragColor = vec4(col, alpha);
      }
    `,
  });
  const core = new THREE.Mesh(coreGeo, coreMat);
  group.add(core);

  /* --- faceted wireframe shell, counter-rotating --- */
  const shellGeo = new THREE.IcosahedronGeometry(1.62, 1);
  const shellMat = new THREE.MeshBasicMaterial({
    color: 0x7c5cff, wireframe: true, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const shell = new THREE.Mesh(shellGeo, shellMat);
  group.add(shell);

  /* --- orbiting thought-motes (points) --- */
  const COUNT = isTouch ? 320 : 900;
  const positions = new Float32Array(COUNT * 3);
  const colors = new Float32Array(COUNT * 3);
  const triad = [new THREE.Color(0x7c5cff), new THREE.Color(0x22d3ee), new THREE.Color(0xffb86b)];
  for (let i = 0; i < COUNT; i++) {
    const r = 1.9 + Math.pow(Math.sin(i * 12.9898) * 43758.5453 % 1, 2) * 1.7;
    const theta = Math.acos(2 * ((i * 0.61803398875) % 1) - 1);
    const phi = i * 2.399963;
    positions[i * 3] = r * Math.sin(theta) * Math.cos(phi);
    positions[i * 3 + 1] = r * Math.sin(theta) * Math.sin(phi);
    positions[i * 3 + 2] = r * Math.cos(theta);
    const col = triad[i % 3];
    colors[i * 3] = col.r; colors[i * 3 + 1] = col.g; colors[i * 3 + 2] = col.b;
  }
  const moteGeo = new THREE.BufferGeometry();
  moteGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  moteGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const moteMat = new THREE.PointsMaterial({
    size: 0.035, vertexColors: true, transparent: true, opacity: 0.9,
    blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true,
  });
  const motes = new THREE.Points(moteGeo, moteMat);
  group.add(motes);

  /* --- soft additive glow plane behind the core --- */
  const glowTex = makeRadialTexture(THREE);
  const glowMat = new THREE.SpriteMaterial({ map: glowTex, color: 0x7c5cff, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false });
  const glow = new THREE.Sprite(glowMat);
  glow.scale.set(6.5, 6.5, 1);
  glow.position.z = -1.2;
  scene.add(glow);

  /* --- pointer + visibility state --- */
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  const onMove = (e) => {
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    pointer.tx = (cx / window.innerWidth) * 2 - 1;
    pointer.ty = -((cy / window.innerHeight) * 2 - 1);
  };
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('touchmove', onMove, { passive: true });

  let hoverTarget = 0;
  const section = document.getElementById('field');
  if (section) {
    section.addEventListener('pointerenter', () => { hoverTarget = 1; });
    section.addEventListener('pointerleave', () => { hoverTarget = 0; });
  }

  let visible = true;
  const io = new IntersectionObserver((es) => { visible = es[0].isIntersecting; }, { threshold: 0 });
  io.observe(canvas);

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (w === 0 || h === 0) return;
    if (canvas.width !== Math.floor(w * renderer.getPixelRatio()) || canvas.height !== Math.floor(h * renderer.getPixelRatio())) {
      renderer.setSize(w, h, false);
      const aspect = w / h;
      camera.aspect = aspect;
      // pull the camera back on portrait/narrow screens so the core keeps margin
      camera.position.z = aspect >= 1 ? 4.4 : 4.4 + (1 - aspect) * 3.6;
      camera.updateProjectionMatrix();
    }
  }

  const clock = new THREE.Clock();
  let frame = 0;
  function render() {
    requestAnimationFrame(render);
    if (!visible) return;
    if (reduce && frame > 1) { return; } // static for reduced motion
    frame++;
    resize();

    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    coreUniforms.uTime.value = reduce ? 6.0 : t;
    coreUniforms.uHover.value = lerp(coreUniforms.uHover.value, hoverTarget, 0.08);

    // section-progress drives a gentle scale/scroll response
    let prog = 0;
    if (section) {
      const r = section.getBoundingClientRect();
      prog = clamp(1 - Math.abs((r.top + r.height / 2) - window.innerHeight / 2) / window.innerHeight, 0, 1);
    }
    coreUniforms.uScroll.value = lerp(coreUniforms.uScroll.value, prog * (0.4 + Math.min(Math.abs(Scroll.velSmooth) * 0.02, 1.2)), 0.1);

    // pointer-follow tilt
    pointer.x = lerp(pointer.x, pointer.tx, 0.05);
    pointer.y = lerp(pointer.y, pointer.ty, 0.05);
    coreUniforms.uPointer.value.set(pointer.x, pointer.y);

    if (!reduce) {
      group.rotation.y += dt * 0.18 + Scroll.velSmooth * 0.0008;
      group.rotation.x = lerp(group.rotation.x, pointer.y * 0.5, 0.06);
      group.rotation.z += dt * 0.02;
      shell.rotation.y -= dt * 0.25;
      shell.rotation.x += dt * 0.12;
      motes.rotation.y -= dt * 0.06;
      motes.rotation.z += dt * 0.03;
      const pulse = 1 + Math.sin(t * 1.2) * 0.015;
      core.scale.setScalar(pulse);
      glow.material.opacity = 0.45 + Math.sin(t * 1.2) * 0.1 + coreUniforms.uHover.value * 0.2;
      glow.scale.setScalar(6.2 + Math.sin(t * 0.8) * 0.4);
    }
    // subtle parallax of the whole group toward pointer
    group.position.x = lerp(group.position.x, pointer.x * 0.3, 0.05);
    group.position.y = lerp(group.position.y, pointer.y * 0.3, 0.05);

    renderer.render(scene, camera);
  }
  resize();
  requestAnimationFrame(render);
  window.addEventListener('resize', resize);
}

function makeRadialTexture(THREE) {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
  g.addColorStop(0, 'rgba(255,255,255,0.9)');
  g.addColorStop(0.25, 'rgba(150,130,255,0.45)');
  g.addColorStop(0.6, 'rgba(80,120,200,0.12)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c);
  return tex;
}

/* =========================================================
   3) INFINITE CONTINUUM — seamless, velocity-reactive marquee wall
========================================================= */
function initContinuum() {
  const host = document.getElementById('continuumRows');
  if (!host) return;

  const ROWS = [
    { items: ['REASONING', 'PERCEPTION', 'MEMORY', 'INTUITION', 'SYNTHESIS', 'FORESIGHT'], speed: 0.6, dir: 1, kind: 'word' },
    { items: ['vision', 'language', 'audio', 'motion', 'code', 'logic', 'empathy', 'craft'], speed: 0.9, dir: -1, kind: 'chip' },
    { items: ['INTELLIGENCE, DISTILLED', 'THINK IN LIGHT', 'A MIND THAT MEETS YOU', 'HALCYON'], speed: 0.45, dir: 1, kind: 'word' },
  ];

  const rowStates = [];

  ROWS.forEach((row) => {
    const rowEl = document.createElement('div');
    rowEl.className = 'continuum__row';
    const track = document.createElement('div');
    track.className = 'continuum__track' + (row.kind === 'chip' ? ' is-chips' : '');

    // build one "set", then duplicate until it comfortably exceeds 2x viewport
    const makeItem = (label) => {
      const el = document.createElement(row.kind === 'chip' ? 'span' : 'span');
      el.className = row.kind === 'chip' ? 'continuum__chip' : 'continuum__word';
      el.textContent = label;
      if (row.kind === 'word') {
        const dot = document.createElement('i');
        dot.className = 'continuum__sep';
        track.appendChild(el);
        track.appendChild(dot);
        return;
      }
      track.appendChild(el);
    };

    // fill generously so the duplicated half is wider than the viewport
    const baseSet = [];
    let guard = 0;
    while (guard < 6) { row.items.forEach((it) => baseSet.push(it)); guard++; }
    baseSet.forEach(makeItem);
    // duplicate the whole set once for seamless wrap
    const setHTML = track.innerHTML;
    track.innerHTML = setHTML + setHTML;

    rowEl.appendChild(track);
    host.appendChild(rowEl);

    rowStates.push({ track, offset: Math.random() * 100, speed: row.speed, dir: row.dir, half: 0 });
  });

  function measure() {
    rowStates.forEach((s) => { s.half = s.track.scrollWidth / 2; });
  }
  // measure after layout/fonts settle
  measure();
  setTimeout(measure, 400);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  window.addEventListener('resize', measure);

  let last = performance.now();
  function tick(now) {
    requestAnimationFrame(tick);
    const dt = Math.min((now - last) / 16.67, 3);
    last = now;
    rowStates.forEach((s) => {
      if (s.half <= 0) return;
      const mag = reduce ? 0 : (s.speed + Math.min(Math.abs(Scroll.velSmooth) * 0.5, 26));
      s.offset += mag * s.dir * dt;
      s.offset = ((s.offset % s.half) + s.half) % s.half; // seamless wrap
      s.track.style.transform = `translate3d(${(-s.offset).toFixed(2)}px,0,0)`;
    });
  }
  requestAnimationFrame(tick);
}

/* =========================================================
   4) MOTION (Framer Motion engine) — reveals + micro-interactions
========================================================= */
function initMotion() {
  if (!motion || reduce) {
    // ensure new-section content is simply visible if Motion is absent
    document.querySelectorAll('[data-mreveal]').forEach((el) => { el.style.opacity = '1'; el.style.transform = 'none'; });
    return;
  }
  const { animate, inView, stagger, scroll } = motion;

  // staggered spring reveals for opted-in groups
  document.querySelectorAll('[data-mreveal]').forEach((el) => { el.style.opacity = '0'; el.style.transform = 'translateY(34px)'; });

  document.querySelectorAll('[data-mgroup]').forEach((group) => {
    const items = group.querySelectorAll('[data-mreveal]');
    inView(group, () => {
      animate(items, { opacity: [0, 1], transform: ['translateY(34px)', 'translateY(0px)'] },
        { duration: 0.9, delay: stagger(0.08), easing: [0.16, 1, 0.3, 1] });
      return () => {};
    }, { margin: '0px 0px -12% 0px' });
  });

  // lone reveals
  document.querySelectorAll('[data-mreveal]:not([data-mgroup] [data-mreveal])').forEach((el) => {
    inView(el, () => {
      animate(el, { opacity: [0, 1], transform: ['translateY(34px)', 'translateY(0px)'] },
        { duration: 0.9, easing: [0.16, 1, 0.3, 1] });
      return () => {};
    }, { margin: '0px 0px -10% 0px' });
  });

  // spring hover on continuum chips
  if (!isTouch) {
    document.querySelectorAll('.continuum__chip').forEach((chip) => {
      chip.addEventListener('pointerenter', () => animate(chip, { scale: 1.12 }, { type: 'spring', stiffness: 420, damping: 18 }));
      chip.addEventListener('pointerleave', () => animate(chip, { scale: 1 }, { type: 'spring', stiffness: 420, damping: 22 }));
    });
  }

  // (The core's scroll reactivity lives in its shader via uScroll —
  //  no DOM parallax needed, which keeps the canvas edge-gap-free.)
}

/* =========================================================
   BOOT
========================================================= */
  function boot() {
    initScroll();
    startSignalLoop();
    initCore();
    initContinuum();
    initMotion();
    document.documentElement.classList.add('enhanced');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(); // end IIFE
