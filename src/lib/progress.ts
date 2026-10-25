/**
 * A thin bar along the bottom of the screen that fills while one of the page's main animations
 * plays (intro, opening, Save the Date, sending a wish), with its name and timing.
 * A tool for tuning timings: on only when PUBLIC_ANIMATION_PROGRESS=true in .env (read at build time).
 */
const enabled = import.meta.env.PUBLIC_ANIMATION_PROGRESS === 'true';

type Bar = { root: HTMLDivElement; fill: HTMLDivElement; label: HTMLDivElement };
let bar: Bar | null = null;
let raf = 0;
let hide = 0;

function ensureBar(): Bar {
  if (bar) return bar;
  const root = document.createElement('div');
  root.setAttribute('aria-hidden', 'true');
  root.style.cssText = 'position:fixed;left:50%;bottom:0;transform:translateX(-50%);width:100%;max-width:var(--page-max);'
    + 'z-index:1000;pointer-events:none;padding:0 0 env(safe-area-inset-bottom,0px);'
    + 'background:linear-gradient(0deg,rgba(20,2,6,.55),rgba(20,2,6,0));opacity:0;transition:opacity 300ms ease;';
  const label = document.createElement('div');
  label.style.cssText = 'padding:10px 12px 5px;font:600 10px/1.2 ui-monospace,SFMono-Regular,Menlo,monospace;'
    + 'letter-spacing:.06em;color:#F4DA9B;text-shadow:0 1px 2px rgba(0,0,0,.6);';
  const track = document.createElement('div');
  track.style.cssText = 'height:4px;background:rgba(244,218,155,.18);';
  const fill = document.createElement('div');
  fill.style.cssText = 'height:100%;transform-origin:left;transform:scaleX(0);'
    + 'background:linear-gradient(90deg,#A9721F,#F4DA9B,#D9A441);box-shadow:0 0 8px rgba(244,218,155,.7);';
  track.append(fill);
  root.append(label, track);
  document.body.append(root);
  bar = { root, fill, label };
  return bar;
}

/** Fills the bar over `ms`, labelled `name`. A new call replaces whatever is running. */
export function showProgress(name: string, ms: number): void {
  if (!enabled) return;
  const { root, fill, label } = ensureBar();
  cancelAnimationFrame(raf);
  clearTimeout(hide);
  root.style.opacity = '1';
  const start = performance.now();
  const total = (ms / 1000).toFixed(1);
  const frame = (now: number) => {
    const t = Math.min(1, (now - start) / ms);
    fill.style.transform = `scaleX(${t})`;
    label.textContent = `${name}  ${((now - start) / 1000).toFixed(1)}s / ${total}s  ${Math.round(t * 100)}%`;
    if (t < 1) raf = requestAnimationFrame(frame);
    else hide = window.setTimeout(() => { root.style.opacity = '0'; }, 900);
  };
  raf = requestAnimationFrame(frame);
}
