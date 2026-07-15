/* ============================================================
   hoichoi — premium motion & experience layer
   Scoped ENTIRELY to the hoichoi theme (html without a data-theme
   attribute) on index.html. Sooper and LoglineAI are completely
   unaffected — this file is never loaded by logline.html, and every
   effect here checks the live theme before acting so a mid-session
   "Switch vertical" to Sooper cleanly steps aside.
   ============================================================ */
(function () {
  'use strict';
  if (document.body.dataset.page) return; // only index.html (hoichoi/Sooper) has no data-page

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;

  function isHoichoi() { return !root.getAttribute('data-theme'); }

  /* ============================================================
     1) LIGHT / DARK MODE TOGGLE (hoichoi + Sooper)
     One button, shared across both verticals. hoichoi defaults dark
     (data-hc-mode="light" is the non-default state); Sooper defaults
     light (data-sp-mode="dark" is the non-default state) — each theme
     keeps its own saved preference under its own localStorage key.
     ============================================================ */
  (function modeToggle() {
    const btn = document.getElementById('hcModeToggle');
    if (!btn) return;

    function isSooper() { return root.getAttribute('data-theme') === 'sooper'; }
    function isLightNow() {
      return isSooper() ? root.getAttribute('data-sp-mode') !== 'dark' : root.getAttribute('data-hc-mode') === 'light';
    }

    function syncAria() {
      const light = isLightNow();
      btn.setAttribute('aria-pressed', String(light));
      btn.setAttribute('aria-label', light ? 'Switch to dark mode' : 'Switch to light mode');
    }
    syncAria();

    function applyMode(mode) {
      if (isSooper()) {
        if (mode === 'dark') root.setAttribute('data-sp-mode', 'dark'); else root.removeAttribute('data-sp-mode');
        try { localStorage.setItem('sooper-mode', mode); } catch (e) {}
      } else {
        if (mode === 'light') root.setAttribute('data-hc-mode', 'light'); else root.removeAttribute('data-hc-mode');
        try { localStorage.setItem('hoichoi-mode', mode); } catch (e) {}
      }
      syncAria();
      window.dispatchEvent(new CustomEvent('hoichoi:modechange', { detail: { mode } }));
    }

    btn.addEventListener('click', () => applyMode(isLightNow() ? 'dark' : 'light'));

    // when the vertical switches live, re-apply that vertical's own saved
    // mode (or system preference) and refresh the button's displayed state
    window.addEventListener('vertical:themechange', () => {
      if (isSooper()) {
        let saved;
        try { saved = localStorage.getItem('sooper-mode'); } catch (e) {}
        const mode = saved || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
        if (mode === 'dark') root.setAttribute('data-sp-mode', 'dark'); else root.removeAttribute('data-sp-mode');
      }
      syncAria();
    });

    try {
      window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
        const key = isSooper() ? 'sooper-mode' : 'hoichoi-mode';
        if (localStorage.getItem(key)) return; // this vertical has an explicit saved choice already
        applyMode(e.matches ? 'light' : 'dark');
      });
    } catch (e) {}
  })();

  /* ============================================================
     2) LENIS SMOOTH SCROLL + GSAP / SCROLLTRIGGER
     Neutral motion infrastructure — identical visual result to the
     existing CSS `.reveal`/`.in` IntersectionObserver system, just
     GSAP-driven, so this is safe to run for both hoichoi and Sooper.
     If either library fails to load, the original CSS reveal system
     (already shared by both themes) is the automatic fallback.
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

      ['.info-grid', '.pillars', '.jcards', '.stats', '.vm-grid', '.okr-grid', '.init-grid', '.sooper-team-grid'].forEach((sel) => {
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
     Same fix applied to LoglineAI — .acc-head/.cal-card are plain
     divs with only mouse/click handlers wired up in script.js.
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
     3) THREE.JS HERO EXPERIENCE (hoichoi only)
     A quiet particle-network field in hoichoi's red/purple brand
     colors. Skips entirely if THREE failed to load, WebGL is
     unavailable, reduced motion is preferred, or Sooper is active —
     Sooper keeps its original 2D canvas (script.js's heroParticles).
     ============================================================ */
  (function heroScene() {
    if (reduceMotion) return;
    if (typeof window.THREE === 'undefined') return;
    // dedicated canvas — #heroCanvas is permanently 2d-bound by script.js's
    // heroParticles() (Sooper's particle field), and a canvas element can
    // never switch context types once one has been requested on it.
    const canvas = document.getElementById('heroCanvasGL');
    const hero = document.getElementById('hero');
    if (!canvas || !hero) return;

    let renderer = null;
    let scene, camera, points, pointsGeo, pointsMat, lines, lineGeo, lineMat;
    let rafId = null;
    let active = false;
    let buildAttempted = false;
    const NODE_COUNT = window.innerWidth < 700 ? 46 : 90;
    const spread = { x: 16, y: 9, z: 6 };
    const velocities = [];
    const mouse = { x: 0, y: 0 };
    let visible = true;

    function accentColor() {
      const rgb = getComputedStyle(root).getPropertyValue('--accent-rgb').trim() || '210,8,32';
      const [r, g, b] = rgb.split(',').map((n) => parseFloat(n) / 255);
      return new THREE.Color(r, g, b);
    }

    function build() {
      if (buildAttempted) return; // only ever try WebGL creation once, success or fail
      buildAttempted = true;
      try {
        renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
      } catch (e) {
        renderer = null;
        return;
      }
      scene = new THREE.Scene();
      camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
      camera.position.z = 14;

      const positions = new Float32Array(NODE_COUNT * 3);
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

      pointsGeo = new THREE.BufferGeometry();
      pointsGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      pointsMat = new THREE.PointsMaterial({ color: accentColor(), size: 0.09, transparent: true, opacity: 0.85 });
      points = new THREE.Points(pointsGeo, pointsMat);
      scene.add(points);

      const maxLines = NODE_COUNT * 6;
      const linePositions = new Float32Array(maxLines * 6);
      lineGeo = new THREE.BufferGeometry();
      lineGeo.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
      lineMat = new THREE.LineBasicMaterial({ color: accentColor(), transparent: true, opacity: 0.16 });
      lines = new THREE.LineSegments(lineGeo, lineMat);
      scene.add(lines);

      resize();
      window.addEventListener('resize', resize);
      hero.addEventListener('mousemove', onMouseMove);

      if ('IntersectionObserver' in window) {
        new IntersectionObserver((entries) => {
          entries.forEach((e) => { visible = e.isIntersecting; });
        }).observe(hero);
      }
      document.addEventListener('visibilitychange', () => {
        if (document.hidden && rafId) { cancelAnimationFrame(rafId); rafId = null; }
        else if (!document.hidden && active && !rafId) tick();
      });
    }

    function resize() {
      if (!renderer) return;
      const r = hero.getBoundingClientRect();
      const w = Math.max(1, r.width), h = Math.max(1, r.height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    }

    function onMouseMove(e) {
      const r = hero.getBoundingClientRect();
      mouse.x = ((e.clientX - r.left) / r.width - 0.5) * 2;
      mouse.y = ((e.clientY - r.top) / r.height - 0.5) * 2;
    }

    function applyMode() {
      if (!pointsMat) return;
      const c = accentColor();
      pointsMat.color.copy(c);
      lineMat.color.copy(c);
    }
    window.addEventListener('hoichoi:modechange', applyMode);
    window.addEventListener('vertical:themechange', applyMode);

    function tick() {
      rafId = requestAnimationFrame(tick);
      // skip all work while the vertical gate overlay is up — no visible
      // benefit to rendering behind it, and it was competing for main-thread
      // time with the gate panel's own hover transition, making it feel laggy
      if (document.body.classList.contains('locked')) return;
      if (!active || !visible || !renderer) return;
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
      const LINK_DIST = 3.6;
      const linePos = lineGeo.attributes.position.array;
      const maxLines = NODE_COUNT * 6;
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

    function enable() {
      if (active) return;
      build();
      if (!renderer) return; // no WebGL — CSS hero-bg glow remains the fallback
      active = true;
      canvas.style.display = 'block';
      if (!rafId) tick();
    }
    function disable() {
      active = false;
      canvas.style.display = 'none';
    }

    if (isHoichoi()) enable();
    window.addEventListener('vertical:themechange', () => {
      if (isHoichoi()) enable(); else disable();
    });
  })();
})();
