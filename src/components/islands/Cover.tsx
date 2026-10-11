import { useEffect, useState } from 'react';
import { wedding } from '@/content/wedding';
import { markOpened } from '@/lib/events';
import { monogramSrc } from '@/lib/monogram';
import MonogramImage from './MonogramImage';
import s from './Cover.module.css';

const FADE_MS = 700;

export default function Cover() {
  const { couple, date, settings } = wedding;
  const [opened, setOpened] = useState(false);
  const [mounted, setMounted] = useState(true);
  const mono = monogramSrc(settings.monogram);

  useEffect(() => {
    if (!opened) return;
    const t = setTimeout(() => setMounted(false), FADE_MS + 60);
    return () => clearTimeout(t);
  }, [opened]);

  const open = () => {
    document.body.classList.remove('is-locked');
    setOpened(true);
    markOpened();
  };

  if (!mounted) return null;

  return (
    <div className={s.cover} data-opened={opened || undefined} aria-hidden={opened || undefined}>
      <div className={s.glow} />
      <div className={`${s.rail} ${s.railLeft}`} aria-hidden="true" />
      <div className={`${s.rail} ${s.railRight}`} aria-hidden="true" />
      <div className={s.frameOuter} aria-hidden="true" />
      <div className={s.frameInner} aria-hidden="true" />
      {(['tl', 'tr', 'bl', 'br'] as const).map((c) => (
        <svg key={c} className={`${s.corner} ${s[c]}`} width="30" height="30" aria-hidden="true">
          <use href="#kbachCorner" width="30" height="30" />
        </svg>
      ))}

      <div className={s.content}>
        <div className={s.head}>
          <div className={s.kicker}>
            <div className={`${s.kickLine} rule-fade-r`} />
            <div className={s.kickText}>Wedding invitation</div>
            <div className={`${s.kickLine} rule-fade-l`} />
          </div>
          <h1 className={s.title}>សិរីមង្គលអាពាហ៍ពិពាហ៍</h1>
        </div>

        <div className={s.seal}>
          <svg viewBox="0 0 156 156" width="156" height="156" aria-hidden="true" className={s.sealRing}>
            <circle cx="78" cy="78" r="76" fill="none" stroke="#D9A441" strokeWidth="0.6" opacity="0.45" />
            <circle cx="78" cy="78" r="70" fill="none" stroke="#D9A441" strokeWidth="1" />
            <circle cx="78" cy="78" r="66" fill="none" stroke="#D9A441" strokeWidth="0.5" opacity="0.4" />
            <g stroke="#D9A441" strokeWidth="0.9" fill="none" opacity="0.9">
              <path d="M78 4 l4.5 7 -4.5 7 -4.5 -7z" />
              <path d="M78 152 l4.5 -7 -4.5 -7 -4.5 7z" />
              <path d="M4 78 l7 4.5 7 -4.5 -7 -4.5z" />
              <path d="M152 78 l-7 4.5 -7 -4.5 7 -4.5z" />
            </g>
          </svg>
          {mono
            ? <MonogramImage src={mono.src} className={mono.square ? s.sealImgSquare : s.sealImg} />
            : <div className={s.sealText}>{couple.monogramKh}</div>}
        </div>

        <div className={s.names}>
          <div className={s.person}>
            <div className={s.nameKh}>{couple.groom.kh}</div>
            <div className={s.nameEn}>{couple.groom.en}</div>
          </div>
          <div className={s.amp}>
            <div className={`${s.ampLine} rule-fade-r`} />
            <div className={s.ampBox}><span>&amp;</span></div>
            <div className={`${s.ampLine} rule-fade-l`} />
          </div>
          <div className={s.person}>
            <div className={s.nameKh}>{couple.bride.kh}</div>
            <div className={s.nameEn}>{couple.bride.en}</div>
          </div>
        </div>

        <div className={s.foot}>
          <div className={s.date}>
            <div className={s.dateKh}>{date.lunarKh}</div>
            <div className={s.dateEn}>{date.dots}</div>
          </div>
          <button type="button" className={s.open} onClick={open}>
            <span className={s.openKh}>បើកសំបុត្រ</span>
            <span className={s.openEn}>Open invitation</span>
          </button>
        </div>
      </div>
    </div>
  );
}
