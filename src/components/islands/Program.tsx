import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { wedding, type ProgramItem } from '@/content/wedding';
import s from './Program.module.css';

type View = 'list' | 'path';

function pairs(items: ProgramItem[]): ProgramItem[][] {
  const rows: ProgramItem[][] = [];
  items.forEach((it, i) => (i % 2 === 0 ? rows.push([it]) : rows[rows.length - 1]!.push(it)));
  return rows;
}

/** Order of ceremony, switchable between a timeline list and a ceremonial scroll. */
export default function Program() {
  const { program, date } = wedding;
  const [view, setView] = useState<View>('list');
  const isPath = view === 'path';
  const root = useRef<HTMLDivElement>(null);

  // Play each icon's animation as it scrolls into view (and again after switching views).
  useEffect(() => {
    const icons = root.current?.querySelectorAll<HTMLElement>('[data-icon]');
    if (!icons?.length) return;
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.setAttribute('data-in', '');
        io.unobserve(e.target);
      }
    }, { threshold: 0.6, rootMargin: '0px 0px -8% 0px' });
    icons.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [view]);

  return (
    <div ref={root} className={s.root}>
      <div className={s.toggleWrap}>
        <button
          type="button"
          className={s.toggle}
          aria-label={isPath ? 'Switch to timeline view' : 'Switch to ceremonial scroll view'}
          onClick={() => setView(isPath ? 'list' : 'path')}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
               strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M1.8 12S5.4 5.4 12 5.4 22.2 12 22.2 12 18.6 18.6 12 18.6 1.8 12 1.8 12Z" />
            <circle cx="12" cy="12" r="3.1" />
          </svg>
          <span>{isPath ? 'View timeline' : 'View scroll'}</span>
        </button>
      </div>

      {!isPath ? (
        <div className={s.list}>
          {program.map((row) => (
            <div key={row.en} className={s.row}>
              <div className={s.rowIcon} data-icon>
                <svg width="28" height="28" aria-hidden="true"><use href={`#${row.icon}`} width="28" height="28" /></svg>
              </div>
              <div className={s.rowTime}>{row.time}</div>
              <div className={s.rowText}>
                <div className={s.rowKh}>{row.kh}</div>
                <div className={s.rowEn}>{row.en}</div>
              </div>
            </div>
          ))}
          <div className={s.listEnd} />
        </div>
      ) : (
        <div className={s.scroll}>
          <div className={s.grid} aria-hidden="true" />
          <div className={s.day}>
            <div className={s.dayKh}>{date.fullKh}</div>
            <div className={s.dayEn}>{date.fullEn}</div>
          </div>
          {pairs(program).map((pair, i) => (
            <div key={i} className={s.pathRow}>
              <div className={s.pathPair}>
                {pair.map((it, j) => (
                  <div key={it.en} className={s.stop}>
                    <svg width="34" height="34" aria-hidden="true" className={s.stopIcon} data-icon
                         style={{ '--delay': `${j * 140}ms` } as CSSProperties}>
                      <use href={`#${it.icon}`} width="34" height="34" />
                    </svg>
                    <div className={s.stopTime}>{it.time}</div>
                    <div className={s.stopKh}>{it.kh}</div>
                    <div className={s.stopEn}>{it.en}</div>
                  </div>
                ))}
              </div>
              <svg viewBox="0 0 300 16" width="100%" height="14" aria-hidden="true" preserveAspectRatio="none" className={s.path}>
                <path d="M6 10 C50 2 100 14 150 8 C200 2 250 14 294 6" fill="none" stroke="#AA2740" strokeWidth="1" />
                <circle cx="6" cy="10" r="2.4" fill="#AA2740" />
                <circle cx="150" cy="8" r="2.4" fill="#AA2740" />
                <circle cx="294" cy="6" r="2.4" fill="#AA2740" />
              </svg>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
