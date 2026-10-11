import { useEffect, useState } from 'react';
import { wedding, type Wish } from '@/content/wedding';
import { getGuestName } from '@/lib/guest';
import { wishesStore } from '@/lib/wishes';
import s from './Wishes.module.css';

/** Guestbook: the sender is fixed to the guest named in the link. */
export default function Wishes() {
  const [guest, setGuest] = useState(wedding.guestDefault);
  const [wishes, setWishes] = useState<Wish[]>(wedding.wishes);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    setGuest(getGuestName());
    wishesStore.list().then(setWishes);
  }, []);

  const send = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    const text = message.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      await wishesStore.add({ name: guest, message: text });
      setWishes(await wishesStore.list());
      setMessage('');
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
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="សូមជូនពរដល់គូស្វាមីភរិយា ..."
            className={s.textarea}
          />
        </label>
        <button type="submit" className={s.send} disabled={sending}>
          <span className={s.sendKh}>ផ្ញើពរ</span>
          <span className={s.sendEn}>Send wish</span>
        </button>
      </form>

      <div className={s.list} aria-live="polite">
        {wishes.map((w, i) => (
          <div key={`${i}-${w.message.slice(0, 12)}`} className={s.wish}>
            <div className={s.wishName}>{w.name}</div>
            <div className={s.wishMsg}>{w.message}</div>
          </div>
        ))}
      </div>
    </>
  );
}
