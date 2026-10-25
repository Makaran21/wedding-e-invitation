import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { wedding, type Wish } from '@/content/wedding';
import { getGuestName } from '@/lib/guest';
import { showProgress } from '@/lib/progress';
import { wishesStore } from '@/lib/wishes';
import s from './Wishes.module.css';

/** How long the little envelope takes to fly from the message box into the list. */
const FLIGHT_MS = 1100;
/** How long the new wish keeps its glow, and the button its "sent" state. */
const FRESH_MS = 2400;
const SPARKS = 10;
/** The flight plus the new wish opening in the list. */
const SEND_MS = FLIGHT_MS + 900;

type Flight = { x: number; y: number; dx: number; dy: number };

/**
 * Guestbook: the sender is fixed to the guest named in the link.
 * On send, the message folds into a small sealed envelope that arcs down into the list,
 * where the new wish opens at the top in a burst of gold.
 */
export default function Wishes() {
  const [guest, setGuest] = useState(wedding.guestDefault);
  const [wishes, setWishes] = useState<Wish[]>(wedding.wishes);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [fresh, setFresh] = useState(false);
  const [flight, setFlight] = useState<Flight | null>(null);
  const boxRef = useRef<HTMLTextAreaElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const flyerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setGuest(getGuestName());
    wishesStore.list().then(setWishes);
  }, []);

  // Fly the envelope once it's on screen.
  useEffect(() => {
    const el = flyerRef.current;
    if (!flight || !el) return;
    const at = (x: number, y: number, scale: number, rot: number) =>
      `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(${scale}) rotate(${rot}deg)`;
    const { dx, dy } = flight;
    el.animate([
      { transform: at(0, 0, 0.2, 0), opacity: 0 },
      { transform: at(0, -10, 1.12, 0), opacity: 1, offset: 0.16 },
      { transform: at(0, -26, 1, -8), opacity: 1, offset: 0.3 },
      { transform: at(dx * 0.55, dy * 0.45 - 46, 0.92, 9), opacity: 1, offset: 0.66 },
      { transform: at(dx, dy, 0.55, 0), opacity: 0.4 },
    ], { duration: FLIGHT_MS, easing: 'cubic-bezier(0.45, 0, 0.35, 1)', fill: 'forwards' });
  }, [flight]);

  const send = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    const text = message.trim();
    if (!text || sending) return;
    setSending(true);

    const box = boxRef.current?.getBoundingClientRect();
    const list = listRef.current?.getBoundingClientRect();
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let landed = Promise.resolve();
    if (box && list && !reduced) {
      const x = box.left + box.width / 2;
      const y = box.top + box.height / 2;
      setFlight({ x, y, dx: list.left + list.width / 2 - x, dy: list.top + 34 - y });
      showProgress(SEND_MS);
      setMessage('');
      landed = new Promise((done) => setTimeout(done, FLIGHT_MS - 80));
    }

    try {
      await Promise.all([wishesStore.add({ name: guest, message: text }), landed]);
      setFlight(null);
      setWishes(await wishesStore.list());
      setMessage('');
      setFresh(true);
      setSent(true);
      setTimeout(() => { setFresh(false); setSent(false); }, FRESH_MS);
    } catch {
      // Give the guest their words back if saving failed.
      setFlight(null);
      setMessage(text);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <form className={s.form} onSubmit={send}>
        <div className={s.field}>
          <span className={s.label}>From · ពី</span>
          <div className={s.from}>
            <svg width="15" height="15" aria-hidden="true"><use href="#icoLock" width="15" height="15" /></svg>
            <span>{guest}</span>
          </div>
        </div>
        <label className={s.field}>
          <span className={s.label}>Message · សារជូនពរ</span>
          <textarea
            ref={boxRef}
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="សូមជូនពរដល់គូស្វាមីភរិយា ..."
            className={s.textarea}
          />
        </label>
        <button type="submit" className={s.send} data-sent={sent || undefined} disabled={sending}>
          {sent ? (
            <>
              <span className={s.sendKh}>បានផ្ញើ</span>
              <span className={s.sendEn}>Thank you</span>
            </>
          ) : (
            <>
              <span className={s.sendKh}>{sending ? 'កំពុងផ្ញើ…' : 'ផ្ញើពរ'}</span>
              <span className={s.sendEn}>Send wish</span>
            </>
          )}
        </button>
      </form>

      {flight && (
        <div ref={flyerRef} className={s.flyer} style={{ left: flight.x, top: flight.y }} aria-hidden="true">
          <span className={s.flyerFlap} />
          <span className={s.flyerSeal} />
        </div>
      )}

      <div ref={listRef} className={s.list} aria-live="polite">
        {wishes.map((w, i) => (
          <div
            key={`${i}-${w.message.slice(0, 12)}`}
            className={fresh && i === 0 ? `${s.wish} ${s.fresh}` : s.wish}
          >
            <div className={s.wishName}>{w.name}</div>
            <div className={s.wishMsg}>{w.message}</div>
            {fresh && i === 0 && Array.from({ length: SPARKS }, (_, k) => (
              <span key={k} className={s.spark} style={{ '--a': `${(360 / SPARKS) * k}deg` } as CSSProperties} aria-hidden="true" />
            ))}
          </div>
        ))}
      </div>
    </>
  );
}
