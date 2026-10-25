// Scroll-in reveal, parallax and scroll effects — ported from the design's
// setupReveal() / settle() / setupParallax() / sweepReveal().

const EASE = 'cubic-bezier(0.16,0.84,0.28,1)';
/** Dispatched on window to show every section at once, with no fade (e.g. while scrubbing the page). */
export const REVEAL_ALL_EVENT = 'invitation:reveal-all';
let started = false;

function settle(el: HTMLElement): void {
  el.style.opacity = '1';
  el.style.transform = 'none';
  if (el.style.filter) el.style.filter = 'none';
  for (const c of Array.from(el.children) as HTMLElement[]) {
    if (!c.hasAttribute('data-reveal-kid')) continue;
    c.style.opacity = '1';
    if (!c.hasAttribute('data-sfx')) c.style.transform = 'none';
  }
  setTimeout(() => { el.style.willChange = ''; }, 800);
}

function prime(el: HTMLElement, staggerIndex: number): void {
  const kind = el.getAttribute('data-reveal');
  if (kind === 'stagger') {
    el.style.transitionDelay = Math.min(staggerIndex * 50, 280) + 'ms';
    el.style.transition = `opacity 420ms ease-out, transform 560ms ${EASE}`;
    el.style.transform = 'translateY(16px) scale(0.975)';
  } else {
    el.style.transition = `opacity 500ms ease-out, transform 640ms ${EASE}, filter 500ms ease-out`;
    el.style.transform = 'translateY(22px)';
    el.style.filter = 'blur(5px)';
    const kids = Array.from(el.children) as HTMLElement[];
    if (kids.length > 1 && kids.length <= 10) {
      kids.forEach((c, i) => {
        const d = 60 + i * 60;
        if (c.hasAttribute('data-sfx')) {
          c.style.transition = `opacity 420ms ease-out ${d}ms`;
        } else {
          c.style.transition = `opacity 420ms ease-out ${d}ms, transform 520ms ${EASE} ${d}ms`;
          c.style.transform = 'translateY(14px)';
        }
        c.style.opacity = '0';
        c.setAttribute('data-reveal-kid', '1');
      });
    }
  }
  el.style.opacity = '0';
  el.style.willChange = 'opacity, transform';
}

function setupParallax(): void {
  const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-parallax]'));
  const fx = Array.from(document.querySelectorAll<HTMLElement>('[data-sfx]'));
  if (!nodes.length && !fx.length) return;
  const base = new Map(nodes.map((el) => [el, el.style.transform || '']));
  let queued = false;

  const draw = () => {
    queued = false;
    const vh = window.innerHeight;
    for (const el of nodes) {
      const r = el.getBoundingClientRect();
      if (r.bottom < -80 || r.top > vh + 80) continue;
      const p = (r.top + r.height / 2 - vh / 2) / vh;
      const amt = parseFloat(el.dataset.parallax ?? '') || 0.035;
      el.style.transform = `translate3d(0,${(-p * vh * amt).toFixed(1)}px,0) ${base.get(el)}`;
    }
    for (const el of fx) {
      const r = el.getBoundingClientRect();
      if (r.bottom < -120 || r.top > vh + 120) continue;
      const p = Math.max(-1.2, Math.min(1.2, (r.top + r.height / 2 - vh / 2) / vh));
      const near = 1 - Math.min(1, Math.abs(p));
      const k = el.dataset.sfx;
      if (k === 'turn') el.style.transform = `translate(-50%,-50%) rotate(${(p * 26).toFixed(1)}deg) scale(${(0.9 + near * 0.16).toFixed(3)})`;
      else if (k === 'zoom') el.style.transform = `scale(${(1.1 - near * 0.1).toFixed(3)}) translate3d(0,${(-p * vh * 0.03).toFixed(1)}px,0)`;
    }
  };
  const onScroll = () => { if (!queued) { queued = true; requestAnimationFrame(draw); } };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  draw();
}

export function setupReveal(): void {
  if (started) return;
  started = true;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const els = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      settle(e.target as HTMLElement);
      io.unobserve(e.target);
    }
  }, { threshold: 0.05, rootMargin: '0px 0px -6% 0px' });

  let n = 0;
  let prevParent: Element | null = null;
  for (const el of els) {
    if (el.getAttribute('data-reveal') === 'stagger') {
      if (el.parentElement !== prevParent) { n = 0; prevParent = el.parentElement; }
      prime(el, n++);
    } else {
      prime(el, 0);
    }
    io.observe(el);
  }

  // Safety net: settle anything already on screen that the observer missed.
  const sweep = () => {
    for (const el of els) {
      if (el.style.opacity !== '0') continue;
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.9 && r.bottom > 0) { settle(el); io.unobserve(el); }
    }
  };
  requestAnimationFrame(sweep);
  const timer = setInterval(() => {
    sweep();
    if (els.every((el) => el.style.opacity !== '0')) clearInterval(timer);
  }, 400);

  window.addEventListener(REVEAL_ALL_EVENT, () => {
    for (const el of els) {
      if (el.style.opacity !== '0') continue;
      el.style.transition = 'none';
      for (const c of Array.from(el.children) as HTMLElement[]) c.style.transition = 'none';
      settle(el);
      io.unobserve(el);
    }
  });

  setupParallax();
}
