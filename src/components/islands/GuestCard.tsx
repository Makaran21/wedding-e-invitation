import { useEffect, useRef, useState } from 'react';
import { getGuestName } from '@/lib/guest';
import { onOpened } from '@/lib/events';
import { wedding } from '@/content/wedding';
import s from './GuestCard.module.css';

/** "Respectfully to…" card with the guest's name from the link and a one-time gold shine. */
export default function GuestCard() {
  const [name, setName] = useState(wedding.guestDefault);
  const [shine, setShine] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => { setName(getGuestName()); }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let io: IntersectionObserver | undefined;
    const off = onOpened(() => {
      if (!ref.current) return;
      io = new IntersectionObserver((entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        io?.disconnect();
        timer = setTimeout(() => setShine(true), 500);
      }, { threshold: 0.6 });
      io.observe(ref.current);
    });
    return () => { off(); io?.disconnect(); clearTimeout(timer); };
  }, []);

  return (
    <div ref={ref} className={s.card}>
      <div className={s.shine} data-on={shine || undefined} aria-hidden="true" />
      <div className={`${s.hair} ${s.hairTop}`} aria-hidden="true" />
      <div className={`${s.hair} ${s.hairBottom}`} aria-hidden="true" />
      <div className={`${s.tick} ${s.tl}`} aria-hidden="true" />
      <div className={`${s.tick} ${s.tr}`} aria-hidden="true" />
      <div className={`${s.tick} ${s.bl}`} aria-hidden="true" />
      <div className={`${s.tick} ${s.br}`} aria-hidden="true" />
      <div className={`${s.gem} ${s.gemTop}`} aria-hidden="true" />
      <div className={`${s.gem} ${s.gemBottom}`} aria-hidden="true" />
      <div className={s.body}>
        <div className={s.label}>សូមគោរពជូន</div>
        <div className={s.rule} aria-hidden="true" />
        <div className={s.name}>{name}</div>
      </div>
    </div>
  );
}
