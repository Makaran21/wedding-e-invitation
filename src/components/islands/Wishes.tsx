import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { wedding, type Wish } from '@/content/wedding';
import { loadGuest, type Guest } from '@/lib/guest';
import { MAX_MESSAGE, MAX_NAME } from '@/lib/limits';
import { showProgress } from '@/lib/progress';
import { wishesApi, type OwnWish, type SendError } from '@/lib/wishes';
import s from './Wishes.module.css';

/** How long the little envelope takes to fly up from the message box. */
const FLIGHT_MS = 1100;
/** How long the guest's own wish keeps its glow after sending. */
const FRESH_MS = 2400;
const SPARKS = 10;
/** The flight plus the guest's wish opening. */
const SEND_MS = FLIGHT_MS + 900;
/** While their wish waits for approval, check on it this often. */
const RECHECK_MS = 20_000;

type Flight = { x: number; y: number; dx: number; dy: number };

const ERRORS: Record<SendError, string> = {
  already_sent: 'អ្នកបានផ្ញើការជូនពររួចហើយ · You have already sent a wish.',
  too_many_requests: 'សូមរង់ចាំបន្តិច រួចព្យាយាមម្ដងទៀត · Too many tries — please wait a few minutes.',
  name_required: 'សូមបញ្ចូលឈ្មោះរបស់អ្នក · Please enter your name.',
  message_required: 'សូមសរសេរសារជូនពរ · Please write a message.',
  unknown_guest: 'តំណអញ្ជើញនេះមិនត្រឹមត្រូវ · This invitation link isn’t valid.',
  network: 'មិនអាចផ្ញើបានទេ សូមព្យាយាមម្ដងទៀត · Couldn’t send — please try again.',
};

/**
 * Guestbook. Guests with a personal link send as the name on it; others type their name.
 * Each guest sends one wish, which shows to everyone once approved. They can edit it later: once
 * approved, the approved text keeps showing while the change waits for approval.
 * On send, the message folds into a small sealed envelope that lifts off, and the guest's
 * wish opens in place of the form in a burst of gold.
 */
export default function Wishes() {
  const [guest, setGuest] = useState<Guest>({ name: wedding.guestDefault });
  const [name, setName] = useState('');
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [own, setOwn] = useState<OwnWish | null>(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [fault, setFault] = useState<SendError | null>(null);
  const [fresh, setFresh] = useState(false);
  const [flight, setFlight] = useState<Flight | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const boxRef = useRef<HTMLTextAreaElement>(null);
  const flyerRef = useRef<HTMLDivElement>(null);

  const refreshList = () => wishesApi.list().then(setWishes).catch(() => {});

  useEffect(() => {
    refreshList();
    loadGuest().then((g) => {
      setGuest(g);
      if (!g.token && g.name !== wedding.guestDefault) setName(g.name);
      wishesApi.mine(g.token).then(setOwn).catch(() => {});
    });
  }, []);

  // While their wish (or their edit) waits for approval, check on it now and then.
  const waiting = own?.status === 'pending' || Boolean(own?.edit);
  useEffect(() => {
    if (!waiting) return;
    const t = setInterval(() => {
      if (document.hidden) return;
      wishesApi.mine(guest.token).then((w) => {
        if (!w) return;
        setOwn(w);
        if (w.status === 'approved' && !w.edit) refreshList();
      }).catch(() => {});
    }, RECHECK_MS);
    return () => clearInterval(t);
  }, [waiting, guest.token]);

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
      { transform: at(0, 16, 1, -8), opacity: 1, offset: 0.3 },
      { transform: at(dx * 0.4, dy * 0.6 - 30, 0.95, 9), opacity: 1, offset: 0.66 },
      { transform: at(dx, dy, 0.6, 0), opacity: 0.3 },
    ], { duration: FLIGHT_MS, easing: 'cubic-bezier(0.45, 0, 0.35, 1)', fill: 'forwards' });
  }, [flight]);

  const send = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    const text = message.trim();
    if (sending) return;
    if (!guest.token && !name.trim()) { setFault('name_required'); return; }
    if (text.length < 2) { setFault('message_required'); return; }
    setFault(null);
    setSending(true);

    const box = boxRef.current?.getBoundingClientRect();
    const form = formRef.current?.getBoundingClientRect();
    let landed = Promise.resolve();
    if (box && form && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
      // From the message box up to where the guest's wish will open, at the top of the form.
      const x = box.left + box.width / 2;
      const y = box.top + box.height / 2;
      setFlight({ x, y, dx: form.left + form.width / 2 - x, dy: form.top + 40 - y });
      setMessage('');
      showProgress(SEND_MS);
      landed = new Promise((done) => setTimeout(done, FLIGHT_MS - 80));
    }

    const [result] = await Promise.all([
      wishesApi.send({ message: text, name: guest.token ? undefined : name.trim(), token: guest.token }),
      landed,
    ]);
    setFlight(null);
    setSending(false);
    if (result.ok) {
      setOwn(result.wish);
      glow();
    } else if (result.error === 'already_sent' && result.wish) {
      setOwn(result.wish);
    } else {
      // Give the guest their words back.
      setMessage(text);
      setFault(result.error);
    }
  };

  const glow = () => {
    setFresh(true);
    setTimeout(() => setFresh(false), FRESH_MS);
  };

  const saveEdit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    const text = editing?.trim() ?? '';
    if (sending) return;
    if (text.length < 2) { setFault('message_required'); return; }
    setFault(null);
    setSending(true);
    const result = await wishesApi.edit(text, guest.token);
    setSending(false);
    if (!result.ok) { setFault(result.error); return; }
    setOwn(result.wish);
    setEditing(null);
    glow();
  };

  return (
    <>
      {!own ? (
        <form ref={formRef} className={s.form} onSubmit={send} noValidate>
          <label className={s.field}>
            <span className={s.label}>From · ពី</span>
            {guest.token ? (
              <div className={s.from}>
                <svg width="15" height="15" aria-hidden="true"><use href="#icoLock" width="15" height="15" /></svg>
                <span>{guest.name}</span>
              </div>
            ) : (
              <input
                className={s.input}
                value={name}
                maxLength={MAX_NAME}
                onChange={(e) => setName(e.target.value)}
                placeholder="ឈ្មោះរបស់អ្នក · Your name"
                autoComplete="name"
              />
            )}
          </label>
          <label className={s.field}>
            <span className={s.label}>Message · សារជូនពរ</span>
            <textarea
              ref={boxRef}
              rows={3}
              value={message}
              maxLength={MAX_MESSAGE}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="សូមជូនពរដល់គូស្វាមីភរិយា ..."
              className={s.textarea}
            />
          </label>
          {fault && <p className={s.fault} role="alert">{ERRORS[fault]}</p>}
          <button type="submit" className={s.send} disabled={sending}>
            <span className={s.sendKh}>{sending ? 'កំពុងផ្ញើ…' : 'ផ្ញើពរ'}</span>
            <span className={s.sendEn}>Send wish</span>
          </button>
        </form>
      ) : editing !== null ? (
        <form className={s.form} onSubmit={saveEdit} noValidate>
          <span className={s.label}>Edit your wish · កែការជូនពរ</span>
          {own.status === 'approved' && (
            <p className={s.note}>ការជូនពរដែលបានអនុម័តនឹងបង្ហាញដដែល រហូតដល់ការកែប្រែត្រូវបានអនុម័ត · Your approved wish keeps showing until the change is approved.</p>
          )}
          <textarea
            rows={4}
            value={editing}
            maxLength={MAX_MESSAGE}
            onChange={(e) => setEditing(e.target.value)}
            className={s.textarea}
            autoFocus
          />
          {fault && <p className={s.fault} role="alert">{ERRORS[fault]}</p>}
          <div className={s.editActions}>
            <button type="button" className={s.cancel} onClick={() => { setEditing(null); setFault(null); }}>បោះបង់ · Cancel</button>
            <button type="submit" className={s.send} disabled={sending}>
              <span className={s.sendKh}>{sending ? 'កំពុងរក្សាទុក…' : 'រក្សាទុក'}</span>
              <span className={s.sendEn}>Save</span>
            </button>
          </div>
        </form>
      ) : (
        <div className={fresh ? `${s.own} ${s.fresh}` : s.own} aria-live="polite">
          <div className={s.ownHead}>
            <span className={s.label}>Your wish · ការជូនពររបស់អ្នក</span>
            <span className={s.badge} data-status={own.status}>
              {own.status === 'approved' ? 'បានអនុម័ត · Approved' : own.status === 'rejected' ? 'មិនអនុម័ត · Not approved' : 'រង់ចាំ · Pending'}
            </span>
          </div>
          <div className={s.wishName}>{own.name}</div>
          <div className={s.wishMsg}>{own.message}</div>

          {own.edit && (
            <div className={s.pendingEdit}>
              <span className={s.label}>Your change · ការកែប្រែ — រង់ចាំ · waiting for approval</span>
              <div className={s.wishMsg}>{own.edit}</div>
            </div>
          )}
          {own.reason && (
            <p className={s.reason}>
              <b>{own.status === 'rejected' ? 'មិនត្រូវបានអនុម័ត · Not approved' : 'ការកែប្រែមិនត្រូវបានអនុម័ត · Your change wasn’t approved'}</b>
              <br />{own.reason}
            </p>
          )}

          <p className={s.ownNote}>
            {own.status === 'rejected'
              ? 'អ្នកអាចកែ ហើយផ្ញើម្ដងទៀត · You can edit it and send it again.'
              : own.edit
                ? 'ការជូនពរដែលបានអនុម័តនៅតែបង្ហាញ រហូតដល់ការកែប្រែត្រូវបានអនុម័ត · Your approved wish keeps showing until the change is approved.'
                : own.status === 'approved'
                  ? 'សូមអរគុណ! ការជូនពររបស់អ្នកបង្ហាញខាងក្រោមហើយ · Thank you! Your wish is shown below.'
                  : 'សូមអរគុណ! ការជូនពររបស់អ្នកនឹងបង្ហាញបន្ទាប់ពីការអនុម័ត · Thank you! It will appear once approved.'}
          </p>
          <button type="button" className={s.editBtn} onClick={() => { setFault(null); setEditing(own.edit ?? own.message); }}>
            ✎ កែប្រែ · Edit
          </button>
          {fresh && Array.from({ length: SPARKS }, (_, k) => (
            <span key={k} className={s.spark} style={{ '--a': `${(360 / SPARKS) * k}deg` } as CSSProperties} aria-hidden="true" />
          ))}
        </div>
      )}

      {flight && (
        <div ref={flyerRef} className={s.flyer} style={{ left: flight.x, top: flight.y }} aria-hidden="true">
          <span className={s.flyerFlap} />
          <span className={s.flyerSeal} />
        </div>
      )}

      <div className={s.list} aria-live="polite">
        {wishes.length === 0 && (
          <p className={s.empty}>មិនទាន់មានការជូនពរនៅឡើយទេ · No wishes yet — be the first.</p>
        )}
        {wishes.map((w, i) => (
          <div key={`${i}-${w.message.slice(0, 12)}`} className={w.pinned ? `${s.wish} ${s.pinned}` : s.wish}>
            {w.pinned && <span className={s.pinMark} aria-label="Pinned">📌</span>}
            <div className={s.wishName}>{w.name}</div>
            <div className={s.wishMsg}>{w.message}</div>
          </div>
        ))}
      </div>
    </>
  );
}
