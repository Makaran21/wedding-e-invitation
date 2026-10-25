import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { wedding } from '@/content/wedding';
import { markOpened } from '@/lib/events';
import { getGuestName } from '@/lib/guest';
import { monogramSrc } from '@/lib/monogram';
import MonogramImage from './MonogramImage';
import s from './LotusCover.module.css';

/**
 * A golden lotus. Its petals bloom open in three layers while a sunburst turns slowly behind,
 * and the monogram rises from its heart. On tap the lotus opens wide and lets its petals fall,
 * and the monogram flies onto the Save the Date monogram, which takes over.
 */
type Stage = 'idle' | 'opening' | 'out';
const FLY_DELAY = 250;
const FLY_DUR = 1300;
const OUT_MS = 260;
/** Scrolling stays locked until Save the Date has finished building (its last piece ends ~3.85s after hand-off). */
const SETTLE_MS = 3900;

const delay = (ms: number) => ({ '--d': `${ms}ms` }) as CSSProperties;

/** A petal pointing straight up from the lotus base at (150, 180), `len` long and `wid` wide at its fullest. */
const petal = (len: number, wid: number) => {
  const tip = 180 - len;
  return `M150 180 C${150 - wid} ${180 - len * 0.45} ${150 - wid * 0.62} ${180 - len * 0.86} 150 ${tip}`
    + ` C${150 + wid * 0.62} ${180 - len * 0.86} ${150 + wid} ${180 - len * 0.45} 150 180Z`;
};
/** Fan of `n` petals spread evenly between -spread and +spread degrees. */
const fan = (n: number, spread: number) => Array.from({ length: n }, (_, i) => -spread + (2 * spread * i) / (n - 1));

const LAYERS = [
  { key: 'back', angles: fan(9, 84), len: 118, wid: 30, fill: 'url(#lotus-deep)', start: 700 },
  { key: 'mid', angles: fan(7, 62), len: 132, wid: 34, fill: 'url(#lotus-gold)', start: 900 },
  { key: 'front', angles: [-58, -30, 30, 58], len: 84, wid: 30, fill: 'url(#lotus-light)', start: 1100 },
] as const;

/** Gold motes rising slowly. Stops when the cover goes away. */
function useGoldDust(canvas: React.RefObject<HTMLCanvasElement | null>, running: boolean) {
  useEffect(() => {
    const el = canvas.current;
    if (!el || !running || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = el.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let w = 0, h = 0;
    const resize = () => {
      w = el.clientWidth; h = el.clientHeight;
      el.width = w * dpr; el.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const motes = Array.from({ length: 44 }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      r: 0.6 + Math.random() * 1.7,
      vy: 0.12 + Math.random() * 0.32, vx: (Math.random() - 0.5) * 0.1,
      tw: Math.random() * Math.PI * 2, tws: 0.01 + Math.random() * 0.03,
    }));

    let raf = 0;
    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      for (const m of motes) {
        m.y -= m.vy; m.x += m.vx; m.tw += m.tws;
        if (m.y < -4) { m.y = h + 4; m.x = Math.random() * w; }
        ctx.beginPath();
        ctx.fillStyle = `rgba(244, 218, 155, ${0.2 + 0.55 * (0.5 + 0.5 * Math.sin(m.tw))})`;
        ctx.shadowColor = 'rgba(217, 164, 65, 0.8)';
        ctx.shadowBlur = m.r * 4;
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, [canvas, running]);
}

function Petals({ layers }: { layers: typeof LAYERS[number][] }) {
  return (
    <>
      {layers.map((l) => l.angles.map((a, i) => (
        <g
          key={`${l.key}${i}`}
          className={`${s.petal} ${s[l.key]}`}
          style={{ '--a': `${a}deg`, '--d': `${l.start + Math.abs(a) * 4}ms` } as CSSProperties}
        >
          <path d={petal(l.len, l.wid)} fill={l.fill} />
          <path className={s.vein} d={`M150 176 L150 ${186 - l.len}`} />
        </g>
      )))}
    </>
  );
}

export default function LotusCover() {
  const { couple, settings } = wedding;
  const [stage, setStage] = useState<Stage>('idle');
  const [mounted, setMounted] = useState(true);
  const [guest, setGuest] = useState(wedding.guestDefault);
  const dust = useRef<HTMLCanvasElement>(null);
  const monoRef = useRef<HTMLDivElement>(null);
  const mono = monogramSrc(settings.monogram);

  useEffect(() => { setGuest(getGuestName()); }, []);
  useGoldDust(dust, mounted && stage === 'idle');

  useEffect(() => {
    if (stage === 'opening') {
      const t = setTimeout(() => {
        // The monogram has landed: hand over to the page, which picks up from here.
        // Not tied to this component, which unmounts long before the section settles.
        window.setTimeout(() => document.body.classList.remove('is-locked'), SETTLE_MS);
        markOpened();
        setStage('out');
      }, FLY_DELAY + FLY_DUR);
      return () => clearTimeout(t);
    }
    if (stage === 'out') {
      const t = setTimeout(() => setMounted(false), OUT_MS);
      return () => clearTimeout(t);
    }
  }, [stage]);

  /** Moves the lotus monogram onto the Save the Date monogram, which sits under the cover. */
  const fly = () => {
    const from = monoRef.current;
    const to = document.querySelector<HTMLElement>('#date .mono-img, #date .mono-type');
    if (!from || !to) return;
    const a = from.getBoundingClientRect();
    const b = to.getBoundingClientRect();
    const dx = b.left + b.width / 2 - (a.left + a.width / 2);
    const dy = b.top + b.height / 2 - (a.top + a.height / 2);
    from.getAnimations().forEach((an) => an.cancel());
    from.animate([
      { transform: 'none', offset: 0 },
      { transform: 'translateY(-18px) scale(1.1)', offset: 0.25 },
      { transform: `translate(${dx}px, ${dy}px) scale(${b.width / a.width})`, offset: 1 },
    ], { duration: FLY_DUR, delay: FLY_DELAY, easing: 'cubic-bezier(0.6, 0, 0.3, 1)', fill: 'forwards' });
  };

  const open = () => {
    if (stage !== 'idle') return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.body.classList.remove('is-locked');
      markOpened();
      setMounted(false);
      return;
    }
    fly();
    setStage('opening');
  };

  if (!mounted) return null;

  return (
    <div className={s.cover} data-stage={stage} aria-hidden={stage !== 'idle' || undefined}>
      <div className={s.bg} aria-hidden="true" />
      <canvas ref={dust} className={s.dust} aria-hidden="true" />

      <div className={s.content}>
        <header className={s.head}>
          <div className={`${s.title} ${s.rise}`} style={delay(250)}>សិរីមង្គលអាពាហ៍ពិពាហ៍</div>
          <div className={`${s.couple} ${s.rise}`} style={delay(450)}>
            <span>{couple.groom.kh}</span>
            <span className={s.amp}>និង</span>
            <span>{couple.bride.kh}</span>
          </div>
        </header>

        <div className={s.lotus} onClick={open} aria-hidden="true">
          <div className={s.sunburst} />
          <div className={s.halo} />
          <svg className={s.petals} viewBox="0 0 300 200">
            <defs>
              <linearGradient id="lotus-deep" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#E9C674" />
                <stop offset=".55" stopColor="#B57D2E" />
                <stop offset="1" stopColor="#6B4210" />
              </linearGradient>
              <linearGradient id="lotus-gold" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#FFF1C4" />
                <stop offset=".35" stopColor="#D9A441" />
                <stop offset=".65" stopColor="#F4DA9B" />
                <stop offset="1" stopColor="#8E5E16" />
              </linearGradient>
              <linearGradient id="lotus-light" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#FFF5D2" />
                <stop offset=".6" stopColor="#E9C674" />
                <stop offset="1" stopColor="#A9721F" />
              </linearGradient>
            </defs>
            <Petals layers={[LAYERS[0], LAYERS[1]]} />
          </svg>
          <div ref={monoRef} className={s.mono}>
            {mono
              ? <MonogramImage src={mono.src} className={s.monoImg} />
              : <div className={s.monoText}>{couple.monogramKh}</div>}
          </div>
          <svg className={`${s.petals} ${s.front}`} viewBox="0 0 300 200">
            <Petals layers={[LAYERS[2]]} />
          </svg>
          <div className={s.base}><span /></div>
        </div>

        <div className={s.foot}>
          <div className={`${s.inviteLabel} ${s.rise}`} style={delay(2400)}>សូមគោរពអញ្ជើញ</div>
          <div className={`${s.guestName} ${s.rise}`} style={delay(2550)}>
            {guest !== wedding.guestDefault ? guest : 'លោក លោកស្រី អ្នកនាងកញ្ញា'}
          </div>
          <div className={`${s.openWrap} ${s.rise}`} style={delay(2850)}>
            <button type="button" className={s.open} onClick={open}>
              <span className={`${s.gem} ${s.gemTop}`} aria-hidden="true" />
              <span className={`${s.gem} ${s.gemBottom}`} aria-hidden="true" />
              <span className={s.openLabel}>បើកសំបុត្រ</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
