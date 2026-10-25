import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { wedding } from '@/content/wedding';
import { markOpened } from '@/lib/events';
import { getGuestName } from '@/lib/guest';
import { monogramSrc } from '@/lib/monogram';
import MonogramImage from './MonogramImage';
import s from './Cover.module.css';

/** Cover → (tap) content dissolves → gate seam and handles appear → doors swing open → unmount. */
type Stage = 'idle' | 'leaving' | 'doors';
const LEAVE_MS = 650;
const DOORS_MS = 1500;

const delay = (ms: number) => ({ '--d': `${ms}ms` }) as CSSProperties;

/** Gold dust drifting up behind the cover content. Stops when the cover goes away. */
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

    const motes = Array.from({ length: 46 }, () => ({
      x: Math.random() * w, y: Math.random() * h,
      r: 0.5 + Math.random() * 1.6,
      vy: 0.12 + Math.random() * 0.35, vx: (Math.random() - 0.5) * 0.12,
      tw: Math.random() * Math.PI * 2, tws: 0.01 + Math.random() * 0.03,
    }));

    let raf = 0;
    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      for (const m of motes) {
        m.y -= m.vy; m.x += m.vx; m.tw += m.tws;
        if (m.y < -4) { m.y = h + 4; m.x = Math.random() * w; }
        const a = 0.25 + 0.55 * (0.5 + 0.5 * Math.sin(m.tw));
        ctx.beginPath();
        ctx.fillStyle = `rgba(244, 218, 155, ${a})`;
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

export default function Cover() {
  const { couple, date, settings } = wedding;
  const [stage, setStage] = useState<Stage>('idle');
  const [mounted, setMounted] = useState(true);
  const [guest, setGuest] = useState(wedding.guestDefault);
  const dust = useRef<HTMLCanvasElement>(null);
  const mono = monogramSrc(settings.monogram);

  useEffect(() => { setGuest(getGuestName()); }, []);
  useGoldDust(dust, mounted);

  useEffect(() => {
    if (stage === 'idle') return;
    if (stage === 'leaving') {
      const t = setTimeout(() => {
        // Unlock and start the page's own reveal as the doors begin to part.
        document.body.classList.remove('is-locked');
        markOpened();
        setStage('doors');
      }, LEAVE_MS);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setMounted(false), DOORS_MS + 80);
    return () => clearTimeout(t);
  }, [stage]);

  const open = () => {
    if (stage !== 'idle') return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      document.body.classList.remove('is-locked');
      markOpened();
      setMounted(false);
      return;
    }
    setStage('leaving');
  };

  if (!mounted) return null;

  return (
    <div className={s.cover} data-stage={stage} aria-hidden={stage !== 'idle' || undefined}>
      <div className={s.doors} aria-hidden="true">
        {(['left', 'right'] as const).map((side) => (
          <div key={side} className={`${s.leaf} ${s[side]}`}>
            <div className={s.leafPattern} />
            <div className={s.leafPanel} />
            <div className={s.leafEdge} />
            <div className={s.handle}><span /></div>
          </div>
        ))}
        <div className={s.beam} />
      </div>

      <div className={s.rays} aria-hidden="true">
        <span className={s.flare} />
        <span className={s.ray} style={delay(600)} />
        <span className={`${s.ray} ${s.rayWide}`} style={delay(3600)} />
        <span className={s.ray} style={delay(6800)} />
      </div>
      <canvas ref={dust} className={s.dust} aria-hidden="true" />
      {[[18, 22, 0], [82, 14, 1.2], [70, 46, 2.4], [12, 64, 3.1], [88, 78, 0.6], [30, 88, 1.8]].map(([x, y, t], i) => (
        <span key={i} className={s.twinkle} style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${t}s` }} aria-hidden="true" />
      ))}
      <div className={`${s.rail} ${s.railLeft}`} aria-hidden="true" />
      <div className={`${s.rail} ${s.railRight}`} aria-hidden="true" />

      <div className={s.content}>
        <div className={`${s.title} ${s.rise}`} style={delay(200)}>
          <span className={s.metal}>សិរីមង្គលអាពាហ៍ពិពាហ៍</span>
        </div>

        <div className={s.crest}>
          <div className={s.halo} aria-hidden="true" />
          <img className={s.crestFrame} src="/assets/monogram-crest-frame.png" alt="" aria-hidden="true" />
          <div className={s.mono}>
            {mono
              ? <MonogramImage src={mono.src} className={mono.square ? s.sealImgSquare : s.sealImg} />
              : <div className={s.sealText}>{couple.monogramKh}</div>}
          </div>
        </div>

        <div className={s.names}>
          <h1 className={s.namesTitle}>
            <span className={`${s.name} ${s.metal} ${s.wipe}`} style={delay(1600)}>{couple.groom.kh}</span>
            <span className={s.amp}>
              <span className={`${s.ampLine} ${s.ampL} rule-fade-r`} />
              <span className={`${s.ampWord} ${s.rise}`} style={delay(1950)}>និង</span>
              <span className={`${s.ampLine} ${s.ampR} rule-fade-l`} />
            </span>
            <span className={`${s.name} ${s.metal} ${s.wipe}`} style={delay(2150)}>{couple.bride.kh}</span>
          </h1>
          <div className={`${s.date} ${s.rise}`} style={delay(2550)}>{date.fullKh}</div>
        </div>

        <div className={s.foot}>
          <div className={`${s.guest} ${s.rise}`} style={delay(2800)}>
            <div className={`${s.inviteLabel} ${s.metal}`}>សូមគោរពអញ្ជើញ</div>
            {guest !== wedding.guestDefault && <div className={s.guestName}>{guest}</div>}
          </div>
          <svg className={s.divider} viewBox="0 0 260 12" width="240" height="12" aria-hidden="true">
            <path className={s.dividerLine} pathLength={1} d="M14 6 H246" stroke="#D9A441" strokeWidth="0.8" />
            <g className={s.dividerEnds} fill="none" stroke="#F4DA9B" strokeWidth="0.9">
              <path d="M2 6 l5 -3.5 5 3.5 -5 3.5z" /><circle cx="17" cy="6" r="1.6" fill="#F4DA9B" />
              <path d="M258 6 l-5 -3.5 -5 3.5 5 3.5z" /><circle cx="243" cy="6" r="1.6" fill="#F4DA9B" />
              <path d="M130 2 l4 4 -4 4 -4 -4z" fill="#D9A441" />
            </g>
          </svg>
          <div className={s.rise} style={delay(3300)}>
            <button type="button" className={s.open} onClick={open}>
              <svg className={`${s.openCurl} ${s.curlL}`} viewBox="0 0 16 28" width="14" height="26" aria-hidden="true">
                <path d="M14 2 C6 4 3 9 3 14 C3 19 6 24 14 26 M9 14 C9 11 12 10 13 12" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
              </svg>
              <span className={s.openKh}>ចុចដើម្បីបើកសំបុត្រ</span>
              <svg className={`${s.openCurl} ${s.curlR}`} viewBox="0 0 16 28" width="14" height="26" aria-hidden="true">
                <path d="M14 2 C6 4 3 9 3 14 C3 19 6 24 14 26 M9 14 C9 11 12 10 13 12" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
