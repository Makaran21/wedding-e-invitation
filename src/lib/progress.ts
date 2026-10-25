/**
 * A thin bar along the bottom of the screen that fills while one of the page's main animations
 * plays (intro, opening, Save the Date, sending a wish), with its name and timing.
 * A tool for tuning timings: on only when PUBLIC_ANIMATION_PROGRESS=true in .env (read at build time).
 */
const enabled = import.meta.env.PUBLIC_ANIMATION_PROGRESS === 'true';

type Bar = { root: HTMLDivElement; fill: HTMLDivElement; name: HTMLSpanElement; time: HTMLSpanElement };
let bar: Bar | null = null;
let raf = 0;
let hide = 0;

/** A thick bar with the text inside it: an "ANIMATION" tag, the animation's name, then its timing. */
function ensureBar(): Bar {
  if (bar) return bar;
  const root = document.createElement('div');
  root.setAttribute('aria-hidden', 'true');
  root.style.cssText = 'position:fixed;left:50%;bottom:0;transform:translateX(-50%);width:100%;max-width:var(--page-max);'
    + 'z-index:1000;pointer-events:none;box-sizing:border-box;padding:0 8px calc(8px + env(safe-area-inset-bottom,0px));'
    + 'opacity:0;transition:opacity 300ms ease;';
  const track = document.createElement('div');
  track.style.cssText = 'position:relative;height:26px;border-radius:6px;overflow:hidden;'
    + 'background:rgba(20,2,6,.82);border:1px solid rgba(244,218,155,.55);box-shadow:0 4px 14px rgba(0,0,0,.45);';
  const fill = document.createElement('div');
  fill.style.cssText = 'position:absolute;inset:0;transform-origin:left;transform:scaleX(0);'
    + 'background:linear-gradient(90deg,rgba(169,114,31,.85),rgba(217,164,65,.85));';
  const text = document.createElement('div');
  text.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;gap:8px;padding:0 8px;'
    + 'font:600 11px/1 ui-monospace,SFMono-Regular,Menlo,monospace;color:#FFF5D2;text-shadow:0 1px 2px rgba(0,0,0,.7);white-space:nowrap;';
  const tag = document.createElement('span');
  tag.textContent = '▶ ANIMATION';
  tag.style.cssText = 'padding:3px 5px;border-radius:3px;font-size:9px;letter-spacing:.08em;'
    + 'background:#FFF5D2;color:#5A0E1D;text-shadow:none;';
  const name = document.createElement('span');
  const time = document.createElement('span');
  time.style.cssText = 'margin-left:auto;';
  text.append(tag, name, time);
  track.append(fill, text);
  root.append(track);
  document.body.append(root);
  bar = { root, fill, name, time };
  return bar;
}

/** Fills the bar over `ms`, labelled `name`. A new call replaces whatever is running. */
export function showProgress(name: string, ms: number): void {
  if (!enabled) return;
  const { root, fill, name: nameEl, time } = ensureBar();
  cancelAnimationFrame(raf);
  clearTimeout(hide);
  root.style.opacity = '1';
  const start = performance.now();
  const total = (ms / 1000).toFixed(1);
  const frame = (now: number) => {
    const t = Math.min(1, (now - start) / ms);
    fill.style.transform = `scaleX(${t})`;
    nameEl.textContent = name;
    time.textContent = `${((now - start) / 1000).toFixed(1)}s / ${total}s · ${Math.round(t * 100)}%`;
    if (t < 1) raf = requestAnimationFrame(frame);
    else hide = window.setTimeout(() => { root.style.opacity = '0'; }, 900);
  };
  raf = requestAnimationFrame(frame);
}
