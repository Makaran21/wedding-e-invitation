import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { wedding } from '@/content/wedding';
import { markOpened } from '@/lib/events';
import { loadGuest } from '@/lib/guest';
import { monogramSrc } from '@/lib/monogram';
import MonogramImage from './MonogramImage';
import s from './VerticalCover.module.css';

/**
 * A tall, portrait invitation envelope addressed to the guest. It rises in open, its long flap folds
 * shut and the wax seal stamps down, then the title, the guest's name on the front and the button appear.
 * On tap the wax breaks away, the flap opens and the card slides out in warm light, while the
 * gold monogram lifts off the seal and flies onto the Save the Date monogram, which takes over.
 */
type Stage = 'idle' | 'opening' | 'out';
const FLY_DELAY = 320;
const FLY_DUR = 1300;
const OUT_MS = 260;
/** Scrolling stays locked until Save the Date has finished building (its last piece ends ~3.85s after hand-off). */
const SETTLE_MS = 3900;

const delay = (ms: number) => ({ '--d': `${ms}ms` }) as CSSProperties;

/** Wax seal outline: a circle with a soft, uneven rim. */
const SEAL_PATH = (() => {
  const pts: string[] = [];
  for (let i = 0; i <= 72; i++) {
    const a = (i / 72) * Math.PI * 2;
    const r = 46 + 1.6 * Math.sin(a * 9) + 0.9 * Math.sin(a * 23 + 1.3);
    pts.push(`${(50 + r * Math.cos(a)).toFixed(2)} ${(50 + r * Math.sin(a)).toFixed(2)}`);
  }
  return `M${pts.join(' L')} Z`;
})();

/** Gold motes rising slowly behind the envelope. Stops when the cover goes away. */
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

    const motes = Array.from({ length: 40 }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      r: 0.6 + Math.random() * 1.7,
      vy: 0.1 + Math.random() * 0.3, vx: (Math.random() - 0.5) * 0.1,
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

export default function VerticalCover() {
  const { couple, settings } = wedding;
  const [stage, setStage] = useState<Stage>('idle');
  const [mounted, setMounted] = useState(true);
  const [guest, setGuest] = useState(wedding.guestDefault);
  const dust = useRef<HTMLCanvasElement>(null);
  const monoRef = useRef<HTMLDivElement>(null);
  const mono = monogramSrc(settings.monogram);

  useEffect(() => { loadGuest().then((g) => setGuest(g.name)); }, []);
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

  /** Moves the seal's monogram onto the Save the Date monogram, which sits under the cover. */
  const fly = () => {
    const from = monoRef.current;
    const to = document.querySelector<HTMLElement>('#date .mono-img, #date .mono-type');
    if (!from || !to) return;
    const a = from.getBoundingClientRect();
    const b = to.getBoundingClientRect();
    const dx = b.left + b.width / 2 - (a.left + a.width / 2);
    const dy = b.top + b.height / 2 - (a.top + a.height / 2);
    const k = b.width / a.width;
    from.getAnimations().forEach((an) => an.cancel());
    // Lift off the seal first, then glide onto the target.
    from.animate([
      { transform: 'none', offset: 0 },
      { transform: 'translateY(-14px) scale(1.25)', offset: 0.25 },
      { transform: `translate(${dx}px, ${dy}px) scale(${k})`, offset: 1 },
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
      <div className={s.bg} aria-hidden="true">
        <div className={s.damask} />
        <div className={s.glow} />
      </div>
      <canvas ref={dust} className={s.dust} aria-hidden="true" />

      <div className={s.content}>
        <header className={s.head}>
          <div className={`${s.title} ${s.rise}`} style={delay(2250)}>សិរីមង្គលអាពាហ៍ពិពាហ៍</div>
          <div className={`${s.couple} ${s.rise}`} style={delay(2450)}>
            <span>{couple.groom.kh}</span>
            <span className={s.amp}>និង</span>
            <span>{couple.bride.kh}</span>
          </div>
        </header>

        {/* The seal sits beside the envelope, not in it, so its monogram outlives the envelope's fade. */}
        <div className={s.stage}>
          <div className={s.envelope} onClick={open} aria-hidden="true">
            <div className={s.inside} />
            <div className={s.card}>
              <div className={s.cardLine} />
              <div className={s.cardText}>សូមស្វាគមន៍</div>
              <div className={s.cardLine} />
            </div>
            <div className={s.pocket} />
            <svg className={s.lines} viewBox="0 0 232 330" preserveAspectRatio="none">
              <defs>
                <linearGradient id="cover-foil" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#FFF1C4" />
                  <stop offset=".3" stopColor="#D9A441" />
                  <stop offset=".55" stopColor="#F4DA9B" />
                  <stop offset=".8" stopColor="#A9721F" />
                  <stop offset="1" stopColor="#F4DA9B" />
                </linearGradient>
              </defs>
              <rect className={`${s.draw} ${s.frame}`} pathLength={1} x="1" y="1" width="230" height="328" />
              <rect className={`${s.draw} ${s.frameIn}`} pathLength={1} x="8" y="8" width="216" height="314" />
            </svg>
            <div className={s.flap}>
              <div className={s.flapFace} />
              <svg className={s.flapEdge} viewBox="0 0 232 162" preserveAspectRatio="none">
                <path className={`${s.draw} ${s.flapFoil}`} pathLength={1} d="M1 1 L116 161 L231 1" />
                <path className={`${s.draw} ${s.flapLace}`} pathLength={1} d="M14 1 L116 145 L218 1" />
              </svg>
            </div>
            <div className={`${s.address} ${s.rise}`} style={delay(2700)}>
              <div className={s.inviteLabel}>សូមគោរពអញ្ជើញ</div>
              <div className={s.guestName}>
                {guest !== wedding.guestDefault ? guest : 'លោក លោកស្រី អ្នកនាងកញ្ញា'}
              </div>
            </div>
            <div className={s.sheen} />
          </div>
          <div className={s.seal} onClick={open}>
            <svg className={s.wax} viewBox="0 0 100 100">
              <defs>
                <radialGradient id="cover-wax" cx="38%" cy="32%" r="75%">
                  <stop offset="0" stopColor="#C23A52" />
                  <stop offset=".55" stopColor="#8E1B2E" />
                  <stop offset="1" stopColor="#5A0E1D" />
                </radialGradient>
              </defs>
              <path d={SEAL_PATH} fill="url(#cover-wax)" stroke="url(#cover-foil)" strokeWidth="2.2" />
              <circle cx="50" cy="50" r="38" fill="none" stroke="#F4DA9B" strokeOpacity=".7" strokeWidth=".9" />
              <circle cx="50" cy="50" r="35.5" fill="none" stroke="#F4DA9B" strokeOpacity=".45" strokeWidth=".6" strokeDasharray="1 2.2" />
              <circle cx="50" cy="50" r="32" fill="none" stroke="#3E0812" strokeOpacity=".35" strokeWidth="1.4" />
            </svg>
            <div ref={monoRef} className={s.mono}>
              {mono
                ? <MonogramImage src={mono.src} className={s.monoImg} />
                : <div className={s.monoText}>{couple.monogramKh}</div>}
            </div>
          </div>
        </div>

        <div className={s.foot}>
          <div className={`${s.openWrap} ${s.rise}`} style={delay(3000)}>
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
