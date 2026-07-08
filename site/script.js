/* ============================================================
   hoichoi onboarding — interactions
   ============================================================ */

/* ---------- Preloader + vertical gate ---------- */
const gateEl = document.getElementById('gate');

function openGate() {
  if (!gateEl) return;
  gateEl.classList.add('show');
  gateEl.setAttribute('aria-hidden', 'false');
  document.body.classList.add('locked');
}
function closeGate() {
  if (!gateEl) return;
  gateEl.classList.remove('show');
  gateEl.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('locked');
}
function chooseVertical(v) {
  try { localStorage.setItem('hoichoi-vertical', v); } catch (e) {}
  const page = document.body.dataset.page || 'index';
  const onRightPage = (page === 'logline') === (v === 'logline');
  if (!onRightPage) {
    window.location.href = v === 'logline' ? 'logline.html' : 'index.html';
    return;
  }
  setTheme(v);                       // applies theme + swaps navbar logo + recolours canvases
  closeGate();
  window.scrollTo(0, 0);
}

window.addEventListener('load', () => {
  setTimeout(() => {
    document.getElementById('preloader').classList.add('done');
    const page = document.body.dataset.page || 'index';
    if (page === 'logline') { document.body.classList.remove('locked'); return; } // never auto-gate here
    let chosen = null;
    try { chosen = localStorage.getItem('hoichoi-vertical'); } catch (e) {}
    if (chosen) document.body.classList.remove('locked'); // returning visitor — skip the gate
    else openGate();                                       // first visit — show the chooser
  }, 2000);
});

// gate panel selection + reopen control
document.querySelectorAll('#gate [data-vertical]').forEach(p =>
  p.addEventListener('click', () => chooseVertical(p.dataset.vertical)));
const gateOpenBtn = document.getElementById('gateOpen');
if (gateOpenBtn) gateOpenBtn.addEventListener('click', openGate);

/* ---------- Nav: scroll state + mobile toggle ---------- */
const nav = document.getElementById('nav');
const navLinks = document.getElementById('navLinks');
const navToggle = document.getElementById('navToggle');

window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 40);
  const h = document.documentElement;
  const pct = (h.scrollTop) / (h.scrollHeight - h.clientHeight) * 100;
  document.getElementById('progress').style.width = pct + '%';
});

navToggle.addEventListener('click', () => {
  navLinks.classList.toggle('open');
  navToggle.classList.toggle('open');
});
navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  navLinks.classList.remove('open');
  navToggle.classList.remove('open');
}));

/* ---------- Reveal on scroll ---------- */
const revObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); revObserver.unobserve(e.target); }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
document.querySelectorAll('.reveal').forEach(el => revObserver.observe(el));

/* ---------- Animated stat counters ---------- */
const fmt = (n) => n.toLocaleString('en-IN');
const countObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (!e.isIntersecting) return;
    const el = e.target;
    const target = +el.dataset.count;
    const valEl = el.querySelector('.v');
    const dur = 1600;
    const start = performance.now();
    const tick = (now) => {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      valEl.textContent = fmt(Math.floor(eased * target));
      if (p < 1) requestAnimationFrame(tick);
      else valEl.textContent = fmt(target);
    };
    requestAnimationFrame(tick);
    countObserver.unobserve(el);
  });
}, { threshold: 0.5 });
document.querySelectorAll('.num[data-count]').forEach(el => countObserver.observe(el));

/* ---------- Accordions (leave policy) — expand on hover ---------- */
document.querySelectorAll('.acc-item').forEach(item => {
  const head = item.querySelector('.acc-head');
  const body = head.nextElementSibling;
  const setOpen = (open) => {
    item.classList.toggle('open', open);
    body.style.maxHeight = open ? body.scrollHeight + 'px' : '0';
  };
  item.addEventListener('mouseenter', () => setOpen(true));
  item.addEventListener('mouseleave', () => setOpen(false));
  head.addEventListener('click', () => setOpen(!item.classList.contains('open'))); // touch/keyboard fallback
});

/* ---------- Leadership cards — click opens a full-profile modal ---------- */
(function leaderModal() {
  const modal = document.getElementById('leaderModal');
  if (!modal) return;
  const lmImg = modal.querySelector('.lm-img');
  const lmName = modal.querySelector('#lmName');
  const lmSubrole = modal.querySelector('.lm-subrole');
  const lmBio = modal.querySelector('.lm-bio');
  const closeBtn = modal.querySelector('.lm-close');

  function open(card) {
    const img = card.querySelector('.leader-img');
    const name = card.querySelector('h4')?.textContent || '';
    const subrole = card.querySelector('.subrole')?.textContent || '';
    const bioFull = card.querySelector('.bio-full');

    if (img && !img.classList.contains('hide')) {
      lmImg.src = img.src; lmImg.alt = name; lmImg.classList.remove('hide');
    } else {
      lmImg.removeAttribute('src'); lmImg.classList.add('hide');
    }
    lmName.textContent = name;
    lmSubrole.textContent = subrole;
    lmBio.innerHTML = bioFull ? bioFull.innerHTML : '';

    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('locked');
  }
  function close() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('locked');
  }

  document.querySelectorAll('.leader-card').forEach(card => {
    card.addEventListener('click', () => open(card));
  });
  closeBtn.addEventListener('click', close);
  modal.querySelector('.lm-backdrop').addEventListener('click', close);
  addEventListener('keydown', e => { if (e.key === 'Escape' && modal.classList.contains('open')) close(); });
})();

/* ---------- Onboarding journey tabs ---------- */
document.querySelectorAll('.jtab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.jtab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.jpanel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.j).classList.add('active');
  });
});

/* ---------- Engagement calendar expand ---------- */
document.querySelectorAll('.cal-card').forEach(card => {
  card.addEventListener('click', () => card.classList.toggle('open'));
});

/* ---------- Carousel arrows ---------- */
document.querySelectorAll('.row-nav button').forEach(btn => {
  btn.addEventListener('click', () => {
    const car = document.getElementById(btn.dataset.car);
    const amount = car.clientWidth * 0.8 * (+btn.dataset.dir);
    car.scrollBy({ left: amount, behavior: 'smooth' });
  });
});

/* ---------- Active nav link highlight ---------- */
const sections = [...document.querySelectorAll('section[id]')];
const linkFor = {};
navLinks.querySelectorAll('a').forEach(a => linkFor[a.getAttribute('href').slice(1)] = a);
const spy = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting && linkFor[e.target.id]) {
      navLinks.querySelectorAll('a').forEach(a => a.style.color = '');
      linkFor[e.target.id].style.color = '#fff';
    }
  });
}, { threshold: 0.4 });
sections.forEach(s => { if (linkFor[s.id]) spy.observe(s); });

/* ---------- Confetti finale ---------- */
const canvas = document.getElementById('confetti');
const ctx = canvas.getContext('2d');
let pieces = [], animId = null;
let colors = ['#d20820', '#ec1f52', '#6d0550', '#e9b872', '#ffffff'];

function resize() { canvas.width = innerWidth; canvas.height = innerHeight; }
resize();
addEventListener('resize', resize);

function burst() {
  pieces = [];
  for (let i = 0; i < 160; i++) {
    pieces.push({
      x: innerWidth / 2, y: innerHeight / 2,
      vx: (Math.random() - 0.5) * 16,
      vy: (Math.random() - 0.5) * 16 - 4,
      size: 5 + Math.random() * 7,
      color: colors[(Math.random() * colors.length) | 0],
      rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.3,
      life: 1
    });
  }
  if (!animId) loop();
}
function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  let alive = false;
  pieces.forEach(p => {
    p.vy += 0.28; p.x += p.vx; p.y += p.vy; p.vx *= 0.99; p.rot += p.vr; p.life -= 0.008;
    if (p.life > 0 && p.y < innerHeight + 40) {
      alive = true;
      ctx.save(); ctx.globalAlpha = Math.max(p.life, 0); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
      ctx.fillStyle = p.color; ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    }
  });
  if (alive) animId = requestAnimationFrame(loop);
  else { ctx.clearRect(0, 0, canvas.width, canvas.height); animId = null; }
}
document.getElementById('celebrate').addEventListener('click', burst);

/* auto-celebrate when finale enters view (once) */
let celebrated = false;
new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting && !celebrated) { celebrated = true; burst(); } });
}, { threshold: 0.6 }).observe(document.getElementById('finale'));

/* ============================================================
   INTERACTIVE LAYER (added)
   ============================================================ */
const finePointer = window.matchMedia('(hover:hover) and (pointer:fine)').matches;
const reduceMotion = window.matchMedia('(prefers-reduced-motion:reduce)').matches;

/* ---------- Theme switching ---------- */
const THEME_KEY = 'hoichoi-vertical';
const PAL = { accent: '210,8,32', dot: '255,255,255', c1: '#d20820', c2: '#ec1f52', c3: '#6d0550', gold: '#e9b872', hi: '#ffffff' };

function refreshPalette() {
  const cs = getComputedStyle(document.documentElement);
  const g = (v, d) => (cs.getPropertyValue(v).trim() || d);
  PAL.accent = g('--accent-rgb', PAL.accent);
  PAL.dot = g('--dot-rgb', PAL.dot);
  PAL.c1 = g('--red', PAL.c1);
  PAL.c2 = g('--red-2', PAL.c2);
  PAL.c3 = g('--red-deep', PAL.c3);
  PAL.gold = g('--gold', PAL.gold);
  PAL.hi = g('--hi', PAL.hi);
  colors = [PAL.c1, PAL.c2, PAL.c3, PAL.gold, PAL.hi];
}

function setTheme(t) {
  if (t === 'hoichoi') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', t);
  document.querySelectorAll('[data-theme-btn]').forEach(b =>
    b.classList.toggle('active', b.dataset.themeBtn === t));
  const li = document.getElementById('navLogoImg');
  if (li) li.src = 'assets/logos/' + t + '.png';
  refreshPalette();
}

document.querySelectorAll('[data-theme-btn]').forEach(b =>
  b.addEventListener('click', () => setTheme(b.dataset.themeBtn)));

const PAGE = document.body.dataset.page || 'index';
let savedTheme = 'hoichoi';
if (PAGE === 'logline') {
  savedTheme = 'logline'; // this page is always the LoglineAI experience
} else {
  try { savedTheme = localStorage.getItem(THEME_KEY) || 'hoichoi'; } catch (e) {}
}
setTheme(savedTheme);

/* ---------- Hero particle constellation ---------- */
(function heroParticles() {
  const cv = document.getElementById('heroCanvas');
  if (!cv || reduceMotion) return;
  const c = cv.getContext('2d');
  const hero = document.getElementById('hero');
  let w, h, parts = [], running = true, rafId = null;
  const mouse = { x: -999, y: -999 };

  function size() {
    const r = hero.getBoundingClientRect();
    w = cv.width = r.width; h = cv.height = r.height;
    const count = Math.min(90, Math.floor(w * h / 16000));
    parts = Array.from({ length: count }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      vx: (Math.random() - .5) * .4, vy: (Math.random() - .5) * .4,
      r: Math.random() * 1.8 + .6
    }));
  }
  size();
  addEventListener('resize', size);
  addEventListener('load', size);
  hero.addEventListener('mousemove', e => {
    const r = hero.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
  });
  hero.addEventListener('mouseleave', () => { mouse.x = mouse.y = -999; });

  function start() { if (rafId == null && running) rafId = requestAnimationFrame(draw); }
  function draw() {
    rafId = null;
    if (!running) return;
    c.clearRect(0, 0, w, h);
    for (const p of parts) {
      // gentle drift + subtle attraction to cursor
      const dx = mouse.x - p.x, dy = mouse.y - p.y, d = Math.hypot(dx, dy);
      if (d < 160) { p.vx += dx / d * .06; p.vy += dy / d * .06; }
      p.vx *= .99; p.vy *= .99;
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
      c.beginPath(); c.arc(p.x, p.y, p.r, 0, 6.28);
      c.fillStyle = `rgba(${PAL.dot},.55)`; c.fill();
    }
    // links
    for (let i = 0; i < parts.length; i++) {
      for (let j = i + 1; j < parts.length; j++) {
        const a = parts[i], b = parts[j];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        if (dist < 120) {
          c.strokeStyle = `rgba(${PAL.accent},${(1 - dist / 120) * .28})`;
          c.lineWidth = 1; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke();
        }
      }
    }
    rafId = requestAnimationFrame(draw);
  }
  start();
  // pause when hero scrolled away
  new IntersectionObserver(es => es.forEach(e => {
    running = e.isIntersecting; start();
  }), { threshold: 0 }).observe(hero);
})();

/* ---------- Hero mouse-parallax (glows + reels) ---------- */
if (finePointer && !reduceMotion) {
  const heroEl = document.getElementById('hero');
  const layers = [
    { el: document.querySelector('.g1'), f: 26 },
    { el: document.querySelector('.g2'), f: -22 },
    { el: document.querySelector('.g3'), f: 16 },
    { el: document.querySelector('.reel-wrap-1'), f: -34 },
    { el: document.querySelector('.reel-wrap-2'), f: 28 },
    { el: document.querySelector('.hero-inner'), f: 10 }
  ].filter(l => l.el);
  heroEl.addEventListener('mousemove', e => {
    const cx = (e.clientX / innerWidth - .5), cy = (e.clientY / innerHeight - .5);
    layers.forEach(l => { l.el.style.transform = `translate(${cx * l.f}px, ${cy * l.f}px)`; });
  });
  heroEl.addEventListener('mouseleave', () => layers.forEach(l => l.el.style.transform = ''));
}

/* ---------- Custom cursor ---------- */
if (finePointer) {
  document.body.classList.add('cursor-on');
  const glow = document.getElementById('cursor-glow');
  const dot = document.getElementById('cursor-dot');
  let gx = 0, gy = 0, tx = 0, ty = 0, shown = false;
  addEventListener('mousemove', e => {
    tx = e.clientX; ty = e.clientY;
    dot.style.transform = `translate(${tx}px, ${ty}px)`;
    if (!shown) { shown = true; glow.style.opacity = 1; dot.style.opacity = 1; }
  });
  const hoverables = 'a, button, .flip, .tilt, .jtab, .cal-card, .acc-head, .org-chip';
  document.addEventListener('mouseover', e => {
    if (e.target.closest(hoverables)) { dot.style.transform += ' scale(2.6)'; glow.style.width = glow.style.height = '620px'; }
  });
  document.addEventListener('mouseout', e => {
    if (e.target.closest(hoverables)) { glow.style.width = glow.style.height = '460px'; }
  });
  (function lerp() {
    gx += (tx - gx) * .14; gy += (ty - gy) * .14;
    glow.style.transform = `translate(${gx}px, ${gy}px)`;
    requestAnimationFrame(lerp);
  })();
}

/* ---------- 3D tilt on cards ---------- */
if (finePointer && !reduceMotion) {
  const tiltSel = '.leader-card, .team-card, .stat, .pillar, .info-card, .cal-card, .icc-card, .jcard, .okr-card, .vm-card';
  document.querySelectorAll(tiltSel).forEach(card => {
    card.classList.add('tilt');
    const shine = document.createElement('span');
    shine.className = 'tilt-shine';
    card.appendChild(shine);
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      const rx = (py - .5) * -10, ry = (px - .5) * 12;
      card.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg) translateY(-6px)`;
      card.style.setProperty('--mx', px * 100 + '%');
      card.style.setProperty('--my', py * 100 + '%');
      card.classList.add('tilting');
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.classList.remove('tilting');
    });
  });
}

/* ---------- Magnetic buttons ---------- */
if (finePointer && !reduceMotion) {
  document.querySelectorAll('.btn').forEach(btn => {
    btn.classList.add('magnetic');
    btn.addEventListener('mousemove', e => {
      const r = btn.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
      btn.style.transform = `translate(${x * .3}px, ${y * .4}px)`;
    });
    btn.addEventListener('mouseleave', () => btn.style.transform = '');
  });
}

/* ---------- Scroll-linked timeline scroller ---------- */
(function timelineScroller() {
  const timelines = [...document.querySelectorAll('.timeline')];
  if (!timelines.length) return;
  let ticking = false;

  function update() {
    ticking = false;
    const vh = window.innerHeight;
    const line = vh * 0.58; // the "activation line" in the viewport
    timelines.forEach(tl => {
      const fill = tl.querySelector('.tl-spine-fill');
      const r = tl.getBoundingClientRect();
      let p = (line - r.top) / r.height;
      p = Math.max(0, Math.min(1, p));
      if (fill) fill.style.height = (p * r.height) + 'px';
      tl.querySelectorAll('.tl-item').forEach(item => {
        const dot = item.querySelector('.dot');
        const dy = dot ? dot.getBoundingClientRect().top : (r.top + item.offsetTop);
        item.classList.toggle('reached', dy <= line);
      });
    });
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll);
  addEventListener('load', update);
  update();
})();

/* ---------- Brand partner logo marquee ---------- */
(function partnerLogoMarquee() {
  const track = document.getElementById('partnerTrack');
  if (!track) return;
  // Edit / extend — { name, file } one entry per logo in assets/partner-logos/
  const logos = [
    { name: 'Amazon', file: 'amazon.svg' },
    { name: 'KFC', file: 'kfc.svg' },
    { name: 'Sprite', file: 'sprite.svg' },
    { name: "L'Oréal", file: 'loreal.svg' },
    { name: 'Bacardí', file: 'bacardi.svg' },
    { name: 'Bumble', file: 'bumble.svg' },
    { name: 'ICICI Bank', file: 'icici.svg' },
    { name: 'Tinder', file: 'tinder.svg' },
    { name: 'Colgate', file: 'colgate.svg' },
    { name: 'Dabur', file: 'dabur.svg' },
    { name: 'Vivo', file: 'vivo.svg' },
    { name: 'Samsung', file: 'samsung.svg' },
    { name: 'TATA', file: 'tata.svg' }
  ];
  const item = (l) => `<span class="m-logo"><img src="assets/partner-logos/${l.file}" alt="${l.name}"><span class="sep">◆</span></span>`;
  const html = logos.map(item).join('');
  track.innerHTML = html + html; // duplicate for a seamless loop
})();

/* ============================================================
   Cinematic auto-scroll tour
   ============================================================ */
(function cinematicTour() {
  const startBtn = document.getElementById('startTour');
  const bar = document.getElementById('tourBar');
  if (!startBtn || !bar) return;

  const captionEl = document.getElementById('tourCaption');
  const progressEl = document.getElementById('tourProgress');
  const pauseBtn = document.getElementById('tourPause');
  const nextBtn = document.getElementById('tourNext');
  const exitBtn = document.getElementById('tourExit');

  const NAV = 90;
  let state = { paused: false, skip: false, abort: false };
  let timer = null;

  const setCaption = (t) => { captionEl.textContent = t; };
  const scrollToEl = (el, off = NAV) => {
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - off;
    window.scrollTo({ top: Math.max(0, y), behavior: 'smooth' });
  };

  // cancellable wait that also drives the mini progress bar.
  // resolves 'done' | 'skip' | 'abort'
  function wait(ms) {
    return new Promise((resolve) => {
      let elapsed = 0; const tick = 80;
      progressEl.style.width = '0%';
      clearInterval(timer);
      timer = setInterval(() => {
        if (state.abort) { clearInterval(timer); resolve('abort'); return; }
        if (state.skip) { state.skip = false; clearInterval(timer); resolve('skip'); return; }
        if (state.paused) return;
        elapsed += tick;
        progressEl.style.width = Math.min(100, (elapsed / ms) * 100) + '%';
        if (elapsed >= ms) { clearInterval(timer); resolve('done'); }
      }, tick);
    });
  }

  /* ---- interactive walkthroughs ---- */
  function timelineWalk(sectionSel) {
    return async () => {
      const sec = document.querySelector(sectionSel);
      const tl = sec && sec.querySelector('.timeline');
      if (!tl) return;
      scrollToEl(tl, 140);
      if (await wait(1500) === 'abort') return;
      const bottom = tl.getBoundingClientRect().top + window.scrollY + tl.offsetHeight - window.innerHeight * 0.55;
      window.scrollTo({ top: bottom, behavior: 'smooth' });
      await wait(2800);
    };
  }

  async function cultureWalk() {
    const grid = document.querySelector('.values-grid');
    scrollToEl(grid, 120);
    if (await wait(1000) === 'abort') return;
    const flips = [...document.querySelectorAll('.values-grid .flip')];
    for (const f of flips) {
      if (state.abort) return;
      f.classList.add('tour-flip');
      if (await wait(950) === 'abort') { flips.forEach(x => x.classList.remove('tour-flip')); return; }
    }
    if (await wait(600) === 'abort') { flips.forEach(x => x.classList.remove('tour-flip')); return; }
    flips.forEach(f => f.classList.remove('tour-flip'));
    setCaption('Our rallying cry · #hoyejak');
    scrollToEl(document.querySelector('.hoyejak-banner'), 150);
    if (await wait(2200) === 'abort') return;
    setCaption('Vision & mission');
    scrollToEl(document.querySelector('.vm-grid'), 150);
    await wait(2600);
  }

  async function hrWalk() {
    scrollToEl(document.getElementById('hr'), 80);
    setCaption('HR brief & benefits');
    if (await wait(2400) === 'abort') return;
    const acc = document.querySelector('#hr .accordion');
    if (!acc) return;
    setCaption('Leave policy');
    scrollToEl(acc, 150);
    if (await wait(900) === 'abort') return;
    for (const it of acc.querySelectorAll('.acc-item')) {
      if (state.abort) return;
      if (!it.classList.contains('open')) it.querySelector('.acc-head').click();
      scrollToEl(acc, 150);
      if (await wait(1100) === 'abort') return;
    }
    await wait(700);
  }

  async function journeyWalk() {
    const sec = document.getElementById('journey');
    scrollToEl(sec, 80);
    if (await wait(1100) === 'abort') return;
    for (const tab of document.querySelectorAll('.jtab')) {
      if (state.abort) return;
      tab.click();
      setCaption('Your first 90 days · ' + tab.textContent.trim());
      scrollToEl(sec, 80);
      if (await wait(2700) === 'abort') return;
    }
  }

  async function calendarWalk() {
    scrollToEl(document.getElementById('calendar'), 80);
    setCaption('Engagement calendar · FY26');
    if (await wait(1500) === 'abort') return;
    const cards = [...document.querySelectorAll('#calendar .cal-card')];
    for (let i = 0; i < cards.length; i++) {
      cards[i].classList.add('open');
      if (i % 2) { if (await wait(500) === 'abort') { cards.forEach(c => c.classList.remove('open')); return; } }
    }
    if (await wait(2600) === 'abort') { cards.forEach(c => c.classList.remove('open')); return; }
    cards.forEach(c => c.classList.remove('open'));
  }

  async function teamsWalk() {
    const sec = document.getElementById('teams');
    scrollToEl(sec, 80);
    setCaption('Meet our teams');
    if (await wait(1600) === 'abort') return;
    const car = document.getElementById('teamCar');
    if (!car) return;
    car.scrollTo({ left: 0, behavior: 'auto' });
    const max = car.scrollWidth - car.clientWidth;
    const stepPx = car.clientWidth * 0.85;
    let pos = 0;
    while (pos < max - 5) {
      if (state.abort) return;
      pos = Math.min(pos + stepPx, max);
      car.scrollTo({ left: pos, behavior: 'smooth' });
      if (await wait(1300) === 'abort') return;
    }
    car.scrollTo({ left: 0, behavior: 'smooth' });
  }

  /* ---- the itinerary (top → bottom, every section) ---- */
  const steps = [
    { cap: 'About us · the one correct brand name', el: '#about' },
    { cap: 'By the numbers', el: '.stats' },
    { cap: 'Our story so far · three decades', action: timelineWalk('#story') },
    { cap: 'The hoichoi journey', action: timelineWalk('#hoichoi-story') },
    { cap: 'What we stand for', el: '#hoichoi-story .pillars' },
    { cap: 'New initiatives from the family', el: '.init-grid' },
    { cap: 'Our brand partners', el: '#partnerMarquee', dur: 4400 },
    { cap: 'Meet our leadership', el: '.leader-grid', dur: 3800 },
    { cap: 'Our core values', action: cultureWalk },
    { cap: 'HR brief & benefits', action: hrWalk },
    { cap: 'POSH guidelines', el: '#posh' },
    { cap: 'POSH · Internal Complaints Committee', el: '.icc-grid' },
    { cap: 'Essentials at work', el: '#essentials' },
    { cap: 'Your first 90 days', action: journeyWalk },
    { cap: 'Engagement calendar', action: calendarWalk },
    { cap: 'Meet our teams', action: teamsWalk },
    { cap: 'Objectives & key responsibilities', el: '#okr' },
    { cap: 'Welcome to hoichoi · #hoyejak', el: '#finale', dur: 5000 }
  ];

  async function runStep(step) {
    setCaption(step.cap);
    if (step.action) { await step.action(); return; }
    scrollToEl(document.querySelector(step.el), step.off || NAV);
    await wait(step.dur || 3300);
  }

  async function run() {
    if (document.body.classList.contains('touring')) return;
    document.documentElement.style.scrollBehavior = 'auto';
    state = { paused: false, skip: false, abort: false };
    pauseBtn.textContent = '❚❚';
    document.body.classList.add('touring');
    bar.setAttribute('aria-hidden', 'false');
    for (let i = 0; i < steps.length; i++) {
      if (state.abort) break;
      await runStep(steps[i]);
    }
    end();
  }

  function end() {
    clearInterval(timer);
    document.body.classList.remove('touring');
    bar.setAttribute('aria-hidden', 'true');
    document.querySelectorAll('.tour-flip').forEach(f => f.classList.remove('tour-flip'));
  }

  startBtn.addEventListener('click', (e) => { e.preventDefault(); run(); });
  pauseBtn.addEventListener('click', () => {
    state.paused = !state.paused;
    pauseBtn.textContent = state.paused ? '▶' : '❚❚';
    pauseBtn.setAttribute('aria-label', state.paused ? 'Resume' : 'Pause');
  });
  nextBtn.addEventListener('click', () => { state.skip = true; });
  exitBtn.addEventListener('click', () => { state.abort = true; });
  addEventListener('keydown', (e) => { if (e.key === 'Escape' && document.body.classList.contains('touring')) state.abort = true; });
})();
