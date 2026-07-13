/* ============================================================
   LoglineAI — premium motion & experience layer
   Scoped ENTIRELY to logline.html. Never loaded by index.html,
   so hoichoi/Sooper are completely unaffected by anything in here.
   Everything in this file guards against missing elements so it
   degrades gracefully if markup ever changes.
   ============================================================ */
(function () {
  'use strict';
  if (document.body.dataset.page !== 'logline') return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ============================================================
     1) LIGHT / DARK MODE TOGGLE
     ============================================================ */
  (function modeToggle() {
    const btn = document.getElementById('lpModeToggle');
    if (!btn) return;
    const root = document.documentElement;

    function syncAria() {
      const isLight = root.getAttribute('data-lp-mode') === 'light';
      btn.setAttribute('aria-pressed', String(isLight));
      btn.setAttribute('aria-label', isLight ? 'Switch to dark mode' : 'Switch to light mode');
    }
    syncAria();

    btn.addEventListener('click', () => {
      const isLight = root.getAttribute('data-lp-mode') === 'light';
      const next = isLight ? 'dark' : 'light';
      if (next === 'light') root.setAttribute('data-lp-mode', 'light');
      else root.removeAttribute('data-lp-mode');
      try { localStorage.setItem('logline-mode', next); } catch (e) {}
      syncAria();
      // let the Three.js scene (if running) know, so particle color can adapt
      window.dispatchEvent(new CustomEvent('logline:modechange', { detail: { mode: next } }));
    });

    // if the user has never explicitly chosen, keep following the OS setting live
    try {
      if (!localStorage.getItem('logline-mode')) {
        window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
          if (e.matches) root.setAttribute('data-lp-mode', 'light'); else root.removeAttribute('data-lp-mode');
          syncAria();
          window.dispatchEvent(new CustomEvent('logline:modechange', { detail: { mode: e.matches ? 'light' : 'dark' } }));
        });
      }
    } catch (e) {}
  })();

  /* ============================================================
     2) LENIS SMOOTH SCROLL + GSAP / SCROLLTRIGGER
     Both are progressive enhancements: if either library fails to
     load, the page falls back to native scroll + the existing CSS
     `.reveal`/`.in` IntersectionObserver system untouched above.
     ============================================================ */
  const hasGsap = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  const hasLenis = typeof window.Lenis !== 'undefined';
  let lenis = null;

  if (hasLenis && !reduceMotion) {
    lenis = new Lenis({
      duration: 0.75,
      easing: (t) => 1 - Math.pow(1 - t, 3),
      smoothWheel: true,
      wheelMultiplier: 1,
    });
  }

  if (hasGsap) {
    gsap.registerPlugin(ScrollTrigger);

    if (lenis) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => { if (!document.body.classList.contains('locked')) lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
    }

    if (!reduceMotion) {
      /* Layer GSAP-driven reveals on top of the existing .reveal elements.
         Inline styles from GSAP win the cascade over the CSS .in class,
         so this simply supersedes the CSS transition visually — if GSAP
         ever fails to init, the original CSS fallback still works. */
      const revealEls = gsap.utils.toArray('.reveal');
      if (revealEls.length) {
        gsap.set(revealEls, { opacity: 0, y: 40 });
        ScrollTrigger.batch(revealEls, {
          start: 'top 88%',
          once: true,
          onEnter: (batch) => gsap.to(batch, {
            opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.09,
          }),
        });
      }

      /* Card-grid stagger for the denser grids, slightly snappier than the
         generic reveal above. */
      ['.info-grid', '.pillars', '.jcards', '.stats', '.vm-grid', '.okr-grid', '.tools-grid'].forEach((sel) => {
        document.querySelectorAll(sel).forEach((grid) => {
          const cards = gsap.utils.toArray(grid.children);
          if (!cards.length) return;
          gsap.set(cards, { opacity: 0, y: 28 });
          ScrollTrigger.create({
            trigger: grid,
            start: 'top 85%',
            once: true,
            onEnter: () => gsap.to(cards, {
              opacity: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.07,
            }),
          });
        });
      });
    }
  }

  /* ============================================================
     2b) KEYBOARD ACCESSIBILITY FOR CLICK-DRIVEN CARDS
     .acc-head and .cal-card are plain divs with only mouse/click
     handlers wired up in script.js. Make them reachable and
     operable by keyboard without touching that shared file's
     behavior for the other two pages.
     ============================================================ */
  (function keyboardAccess() {
    document.querySelectorAll('.acc-head, .cal-card').forEach((el) => {
      if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '0');
      if (!el.hasAttribute('role')) el.setAttribute('role', 'button');
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          el.click();
        }
      });
    });
  })();

  /* ============================================================
     2c) AI WORKFLOW — single-panel stepper
     ============================================================ */
  (function workflowStepper() {
    const btns = document.querySelectorAll('.wf-btn');
    if (!btns.length) return;
    btns.forEach((btn) => {
      btn.addEventListener('click', () => {
        btns.forEach((b) => { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
        document.querySelectorAll('.wf-panel').forEach((p) => p.classList.remove('active'));
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');
        document.getElementById(btn.dataset.wf)?.classList.add('active');
      });
    });
  })();

  /* ============================================================
     3) THREE.JS HERO EXPERIENCE
     A quiet particle-network field — nodes drifting and linking
     when close, echoing "logline" connecting scattered signals.
     Replaces the old 2D canvas particle system on this page only
     (see the page-guard added to heroParticles() in script.js).
     Skips entirely if THREE failed to load, WebGL is unavailable,
     or the user prefers reduced motion — the existing .hero-bg
     gradient glows and .hero-decor reels remain the fallback look.
     ============================================================ */
  (function heroScene() {
    if (reduceMotion) return;
    if (typeof window.THREE === 'undefined') return;
    const canvas = document.getElementById('heroCanvas');
    const hero = document.getElementById('hero');
    if (!canvas || !hero) return;

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    } catch (e) {
      return; // no WebGL support — CSS hero-bg glow + reels remain the visual
    }
    if (!renderer) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
    camera.position.z = 14;

    function accentColor() {
      const rgb = getComputedStyle(document.documentElement).getPropertyValue('--accent-rgb').trim() || '255,58,79';
      const [r, g, b] = rgb.split(',').map((n) => parseFloat(n) / 255);
      return new THREE.Color(r, g, b);
    }

    const NODE_COUNT = window.innerWidth < 700 ? 46 : 90;
    const spread = { x: 16, y: 9, z: 6 };
    const positions = new Float32Array(NODE_COUNT * 3);
    const velocities = [];
    for (let i = 0; i < NODE_COUNT; i++) {
      positions[i * 3] = (Math.random() - 0.5) * spread.x * 2;
      positions[i * 3 + 1] = (Math.random() - 0.5) * spread.y * 2;
      positions[i * 3 + 2] = (Math.random() - 0.5) * spread.z * 2;
      velocities.push({
        x: (Math.random() - 0.5) * 0.006,
        y: (Math.random() - 0.5) * 0.006,
        z: (Math.random() - 0.5) * 0.004,
      });
    }

    const pointsGeo = new THREE.BufferGeometry();
    pointsGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const pointsMat = new THREE.PointsMaterial({
      color: accentColor(), size: 0.09, transparent: true, opacity: 0.85,
    });
    const points = new THREE.Points(pointsGeo, pointsMat);
    scene.add(points);

    const LINK_DIST = 3.6;
    const maxLines = NODE_COUNT * 6;
    const linePositions = new Float32Array(maxLines * 6);
    const lineGeo = new THREE.BufferGeometry();
    lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
    const lineMat = new THREE.LineBasicMaterial({
      color: accentColor(), transparent: true, opacity: 0.16,
    });
    const lines = new THREE.LineSegments(lineGeo, lineMat);
    scene.add(lines);

    function applyMode() {
      const c = accentColor();
      pointsMat.color.copy(c);
      lineMat.color.copy(c);
    }
    window.addEventListener('logline:modechange', applyMode);

    function resize() {
      const r = hero.getBoundingClientRect();
      const w = Math.max(1, r.width), h = Math.max(1, r.height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }
    resize();
    window.addEventListener('resize', resize);

    const mouse = { x: 0, y: 0 };
    hero.addEventListener('mousemove', (e) => {
      const r = hero.getBoundingClientRect();
      mouse.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
      mouse.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
    });

    let visible = true;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((entries) => {
        entries.forEach((e) => { visible = e.isIntersecting; });
      }).observe(hero);
    }

    let rafId = null;
    function tick() {
      rafId = requestAnimationFrame(tick);
      if (document.body.classList.contains('locked')) return;
      if (!visible) return;
      const pos = pointsGeo.attributes.position.array;
      for (let i = 0; i < NODE_COUNT; i++) {
        pos[i * 3] += velocities[i].x;
        pos[i * 3 + 1] += velocities[i].y;
        pos[i * 3 + 2] += velocities[i].z;
        if (Math.abs(pos[i * 3]) > spread.x) velocities[i].x *= -1;
        if (Math.abs(pos[i * 3 + 1]) > spread.y) velocities[i].y *= -1;
        if (Math.abs(pos[i * 3 + 2]) > spread.z) velocities[i].z *= -1;
      }
      pointsGeo.attributes.position.needsUpdate = true;

      let li = 0;
      const linePos = lineGeo.attributes.position.array;
      for (let i = 0; i < NODE_COUNT && li < maxLines; i++) {
        for (let j = i + 1; j < NODE_COUNT && li < maxLines; j++) {
          const dx = pos[i * 3] - pos[j * 3];
          const dy = pos[i * 3 + 1] - pos[j * 3 + 1];
          const dz = pos[i * 3 + 2] - pos[j * 3 + 2];
          const d2 = dx * dx + dy * dy + dz * dz;
          if (d2 < LINK_DIST * LINK_DIST) {
            linePos[li * 6] = pos[i * 3]; linePos[li * 6 + 1] = pos[i * 3 + 1]; linePos[li * 6 + 2] = pos[i * 3 + 2];
            linePos[li * 6 + 3] = pos[j * 3]; linePos[li * 6 + 4] = pos[j * 3 + 1]; linePos[li * 6 + 5] = pos[j * 3 + 2];
            li++;
          }
        }
      }
      lineGeo.setDrawRange(0, li * 2);
      lineGeo.attributes.position.needsUpdate = true;

      camera.position.x += (mouse.x * 1.4 - camera.position.x) * 0.03;
      camera.position.y += (-mouse.y * 0.9 - camera.position.y) * 0.03;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    }
    tick();

    document.addEventListener('visibilitychange', () => {
      if (document.hidden && rafId) { cancelAnimationFrame(rafId); rafId = null; }
      else if (!rafId) tick();
    });
  })();
})();
