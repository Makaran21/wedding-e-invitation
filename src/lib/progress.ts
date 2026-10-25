/**
 * A gold-foil line along the very bottom of the screen that fills while one of the page's main
 * animations plays (the intro, opening into Save the Date, sending a wish), led by a glowing tip.
 * Part of the look; PUBLIC_ANIMATION_PROGRESS=false in .env turns it off (read at build time).
 */
const enabled = import.meta.env.PUBLIC_ANIMATION_PROGRESS !== 'false';

const CSS = `
.anim-progress {
  position: fixed; left: 50%; bottom: 0; transform: translateX(-50%); width: 100%; max-width: var(--page-max);
  height: 4px; z-index: 1000; pointer-events: none; opacity: 0; transition: opacity 400ms ease;
  background: rgba(244, 218, 155, 0.14);
}
.anim-progress.is-on { opacity: 1; }
.anim-progress-fill {
  position: absolute; inset: 0; transform-origin: left; transform: scaleX(0);
  background: linear-gradient(90deg, #8E5E16, #D9A441 25%, #FFF1C4 50%, #D9A441 75%, #8E5E16) 0 0 / 200% 100%;
  box-shadow: 0 0 10px rgba(217, 164, 65, 0.6);
  animation: anim-progress-shimmer 1.6s linear infinite;
}
.anim-progress-tip {
  position: absolute; top: 50%; left: 0; width: 10px; height: 10px; margin: -5px 0 0 -5px; border-radius: 50%;
  background: radial-gradient(circle, #FFF8E0 0%, #F4DA9B 45%, rgba(217, 164, 65, 0) 75%);
  box-shadow: 0 0 12px 4px rgba(244, 218, 155, 0.7);
}
@keyframes anim-progress-shimmer { to { background-position: -200% 0; } }
@media (prefers-reduced-motion: reduce) { .anim-progress-fill { animation: none; } }
`;

type Bar = { root: HTMLDivElement; fill: HTMLDivElement; tip: HTMLDivElement };
let bar: Bar | null = null;
let raf = 0;
let hide = 0;

function ensureBar(): Bar {
  if (bar) return bar;
  const style = document.createElement('style');
  style.textContent = CSS;
  document.head.append(style);
  const root = document.createElement('div');
  root.className = 'anim-progress';
  root.setAttribute('aria-hidden', 'true');
  const fill = document.createElement('div');
  fill.className = 'anim-progress-fill';
  const tip = document.createElement('div');
  tip.className = 'anim-progress-tip';
  root.append(fill, tip);
  document.body.append(root);
  bar = { root, fill, tip };
  return bar;
}

/** Fills the line over `ms`. A new call replaces whatever is running. */
export function showProgress(ms: number): void {
  if (!enabled) return;
  const { root, fill, tip } = ensureBar();
  cancelAnimationFrame(raf);
  clearTimeout(hide);
  root.classList.add('is-on');
  const start = performance.now();
  const frame = (now: number) => {
    const t = Math.min(1, (now - start) / ms);
    fill.style.transform = `scaleX(${t})`;
    tip.style.left = `${t * 100}%`;
    if (t < 1) raf = requestAnimationFrame(frame);
    else hide = window.setTimeout(() => root.classList.remove('is-on'), 500);
  };
  raf = requestAnimationFrame(frame);
}
