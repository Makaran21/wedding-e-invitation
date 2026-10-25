import { useCallback, useEffect, useMemo, useState } from 'react';
import s from './AdminPanel.module.css';

type Status = 'pending' | 'approved' | 'rejected';
type Filter = Status | 'pinned' | 'all';
interface AdminWish {
  id: number; guest_id: number | null; name: string; message: string; status: Status;
  ip: string; created_at: string; decided_at: string | null;
  /** The guest's change to an approved wish, waiting for approval. */
  edit_message: string | null; edit_at: string | null;
  /** Shown to the guest: why the wish (or their last change) wasn't approved. */
  reason: string | null;
  /** Position among the pinned wishes (1 = top of the site); null when not pinned. */
  pin_order: number | null;
}
interface AdminGuest {
  id: number; token: string; name: string; created_at: string;
  wish_id: number | null; wish_status: Status | null;
}

/** Wishes are re-fetched this often, so ones decided in Telegram show up here too. */
const REFRESH_MS = 15_000;

const STATUS_LABEL: Record<Status, string> = { pending: 'Pending', approved: 'Approved', rejected: 'Rejected' };

/** SQLite's "YYYY-MM-DD HH:MM:SS" (UTC) as a short local time. */
const when = (sqlTime: string) =>
  new Date(`${sqlTime.replace(' ', 'T')}Z`).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });

/** Asks for the admin password (ADMIN_PASSWORD in .env) before showing anything. */
function SignIn({ adminKey, couple, onIn }: { adminKey: string; couple: string; onIn: () => void }) {
  const [password, setPassword] = useState('');
  const [fault, setFault] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!password || busy) return;
    setBusy(true);
    setFault('');
    try {
      const res = await fetch('/api/admin/session', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({ password }),
      });
      if (res.ok) { onIn(); return; }
      const { retryAfter } = await res.json() as { retryAfter?: number };
      setFault(res.status === 429
        ? `Too many tries. Try again in ${Math.ceil((retryAfter ?? 900) / 60)} min.`
        : 'Wrong password.');
      setPassword('');
    } catch {
      setFault("Can't reach the server.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={s.signInWrap}>
      <form className={s.signIn} onSubmit={submit}>
        <span className={s.title}>Wishes admin</span>
        <span className={s.signInCouple}>{couple}</span>
        <input
          className={s.search}
          type="password"
          autoComplete="current-password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoFocus
        />
        {fault && <div className={s.alert}>{fault}</div>}
        <button type="submit" className={`${s.btn} ${s.approve}`} disabled={busy || !password}>Sign in</button>
      </form>
    </div>
  );
}

/**
 * The couple's admin panel: approve or reject wishes, and make personal links for guests.
 * Every request carries the admin key (the secret part of this page's path) and the session
 * cookie from signing in.
 */
export default function AdminPanel({ adminKey, couple, signedIn }: { adminKey: string; couple: string; signedIn: boolean }) {
  const [authed, setAuthed] = useState(signedIn);
  const [tab, setTab] = useState<'wishes' | 'guests'>('wishes');
  const [filter, setFilter] = useState<Filter>('pending');
  const [wishes, setWishes] = useState<AdminWish[]>([]);
  const [counts, setCounts] = useState<Record<Filter, number>>({ pending: 0, approved: 0, rejected: 0, pinned: 0, all: 0 });
  const [guests, setGuests] = useState<AdminGuest[]>([]);
  const [names, setNames] = useState('');
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState<number | 'add' | null>(null);
  const [toast, setToast] = useState('');
  const [failed, setFailed] = useState(false);

  const api = useCallback(async <T,>(path: string, init: RequestInit = {}): Promise<T> => {
    const res = await fetch(`/api/admin/${path}`, {
      ...init,
      headers: { 'content-type': 'application/json', 'x-admin-key': adminKey, ...init.headers },
    });
    if (res.status === 401) setAuthed(false);
    if (!res.ok) throw new Error(`${res.status}`);
    return res.json() as Promise<T>;
  }, [adminKey]);

  const signOut = async () => {
    await fetch('/api/admin/session', { method: 'DELETE', headers: { 'content-type': 'application/json' } }).catch(() => {});
    setAuthed(false);
  };

  const flash = (text: string) => {
    setToast(text);
    window.setTimeout(() => setToast((t) => (t === text ? '' : t)), 2200);
  };

  const loadWishes = useCallback(async () => {
    try {
      const q = filter === 'all' ? '' : `?status=${filter}`;
      const data = await api<{ wishes: AdminWish[]; counts: Record<Filter, number> }>(`wishes${q}`);
      setWishes(data.wishes);
      setCounts(data.counts);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, [api, filter]);

  const loadGuests = useCallback(async () => {
    try {
      setGuests((await api<{ guests: AdminGuest[] }>('guests')).guests);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, [api]);

  useEffect(() => {
    if (!authed) return;
    loadWishes();
    const t = setInterval(() => { if (!document.hidden) loadWishes(); }, REFRESH_MS);
    return () => clearInterval(t);
  }, [authed, loadWishes]);

  useEffect(() => { if (authed && tab === 'guests') loadGuests(); }, [authed, tab, loadGuests]);

  /** Asks for the reason the guest will see; null when the admin cancels. */
  const askReason = (current = '') => prompt('Reason for the guest (they will see it — optional):', current);

  const patch = async (w: AdminWish, body: Record<string, unknown>, done: string) => {
    setBusy(w.id);
    try {
      await api(`wishes/${w.id}`, { method: 'PATCH', body: JSON.stringify(body) });
      flash(done);
      await loadWishes();
    } catch {
      flash('Could not update — try again');
    } finally {
      setBusy(null);
    }
  };

  const decide = (w: AdminWish, status: Status) => {
    const reason = status === 'rejected' ? askReason() : '';
    if (reason === null) return;
    patch(w, { status, reason }, `${STATUS_LABEL[status]}: ${w.name}`);
  };

  const decideEdit = (w: AdminWish, approve: boolean) => {
    const reason = approve ? '' : askReason();
    if (reason === null) return;
    patch(w, { edit: approve ? 'approve' : 'reject', reason }, approve ? `Change approved: ${w.name}` : `Change rejected: ${w.name}`);
  };

  const editText = (w: AdminWish) => {
    const message = prompt('Edit the wish (shows on the site as you write it):', w.message)?.trim();
    if (!message || message === w.message) return;
    patch(w, { message }, 'Wish text saved');
  };

  const pin = (w: AdminWish, pinned: boolean) =>
    patch(w, { pinned }, pinned ? `Pinned: ${w.name}` : `Unpinned: ${w.name}`);

  /** Moves a pinned wish up (-1) or down (+1) among the pinned ones. */
  const move = async (index: number, by: -1 | 1) => {
    const order = [...wishes];
    const [w] = order.splice(index, 1);
    order.splice(index + by, 0, w);
    setWishes(order);
    try {
      await api('wishes/pins', { method: 'PUT', body: JSON.stringify({ ids: order.map((x) => x.id) }) });
    } catch {
      flash('Could not reorder — try again');
    }
    await loadWishes();
  };

  const changeReason = (w: AdminWish) => {
    const reason = askReason(w.reason ?? '');
    if (reason === null) return;
    patch(w, { reason }, 'Reason saved');
  };

  const removeWish = async (w: AdminWish) => {
    if (!confirm(`Delete the wish from ${w.name}? This can't be undone.`)) return;
    setBusy(w.id);
    try {
      await api(`wishes/${w.id}`, { method: 'DELETE' });
      flash('Wish deleted');
      await loadWishes();
    } catch {
      flash('Could not delete — try again');
    } finally {
      setBusy(null);
    }
  };

  const linkFor = (g: AdminGuest) => `${location.origin}/?g=${g.token}`;

  const copy = async (text: string, done: string) => {
    try {
      await navigator.clipboard.writeText(text);
      flash(done);
    } catch {
      prompt('Copy this:', text);
    }
  };

  const addGuests = async () => {
    const list = names.split('\n').map((n) => n.trim()).filter(Boolean);
    if (!list.length) return;
    setBusy('add');
    try {
      const { guests: made } = await api<{ guests: AdminGuest[] }>('guests', { method: 'POST', body: JSON.stringify({ names: list }) });
      setNames('');
      flash(made.length === 1 ? 'Link created' : `${made.length} links created`);
      await loadGuests();
    } catch {
      flash('Could not create links — try again');
    } finally {
      setBusy(null);
    }
  };

  const rename = async (g: AdminGuest) => {
    const name = prompt('Guest name', g.name)?.trim();
    if (!name || name === g.name) return;
    setBusy(g.id);
    try {
      await api(`guests/${g.id}`, { method: 'PATCH', body: JSON.stringify({ name }) });
      await loadGuests();
    } catch {
      flash('Could not rename — try again');
    } finally {
      setBusy(null);
    }
  };

  const removeGuest = async (g: AdminGuest) => {
    if (!confirm(`Delete ${g.name}'s link? It will stop working. Any wish they sent is kept.`)) return;
    setBusy(g.id);
    try {
      await api(`guests/${g.id}`, { method: 'DELETE' });
      flash('Guest deleted');
      await loadGuests();
    } catch {
      flash('Could not delete — try again');
    } finally {
      setBusy(null);
    }
  };

  const shownGuests = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? guests.filter((g) => g.name.toLowerCase().includes(q)) : guests;
  }, [guests, search]);

  const filters: [Filter, string, number][] = [
    ['pending', 'Pending', counts.pending],
    ['approved', 'Approved', counts.approved],
    ['rejected', 'Rejected', counts.rejected],
    ['pinned', '📌 Pinned', counts.pinned],
    ['all', 'All', counts.all],
  ];

  if (!authed) return <SignIn adminKey={adminKey} couple={couple} onIn={() => setAuthed(true)} />;

  return (
    <div className={s.app}>
      <header className={s.top}>
        <div className={s.brand}>
          <span className={s.title}>Wishes admin</span>
          <span className={s.couple}>{couple}</span>
        </div>
        <nav className={s.tabs}>
          <button type="button" className={s.tab} data-on={tab === 'wishes' || undefined} onClick={() => setTab('wishes')}>
            Wishes{counts.pending > 0 && <span className={s.dot}>{counts.pending}</span>}
          </button>
          <button type="button" className={s.tab} data-on={tab === 'guests' || undefined} onClick={() => setTab('guests')}>
            Guest links
          </button>
          <button type="button" className={s.tab} onClick={signOut} title="Sign out">Sign out</button>
        </nav>
      </header>

      <main className={s.main}>
        {failed && <div className={s.alert}>Can't reach the server. Retrying…</div>}

        {tab === 'wishes' ? (
          <>
            <div className={s.chips} role="tablist">
              {filters.map(([f, label, n]) => (
                <button key={f} type="button" className={s.chip} data-on={filter === f || undefined} onClick={() => setFilter(f)}>
                  {label} <span className={s.count}>{n}</span>
                </button>
              ))}
            </div>

            {wishes.length === 0 ? (
              <p className={s.empty}>
                {filter === 'pending' ? 'Nothing waiting for approval.'
                  : filter === 'pinned' ? 'Nothing pinned. Pin approved wishes to show them first on the site.'
                    : 'No wishes here yet.'}
              </p>
            ) : (
              <div className={s.grid}>
                {filter === 'pinned' && <p className={s.hint}>Shown first on the site, in this order. Use ↑ ↓ to sort.</p>}
                {wishes.map((w, i) => (
                  <article key={w.id} className={s.card} data-status={w.status}>
                    <div className={s.cardHead}>
                      <span className={s.name}>{w.name}</span>
                      <span className={s.badges}>
                        {w.pin_order !== null && <span className={s.pin}>📌 {w.pin_order}</span>}
                        <span className={s.badge} data-status={w.status}>{STATUS_LABEL[w.status]}</span>
                      </span>
                    </div>
                    <p className={s.message}>{w.message}</p>
                    {w.edit_message && (
                      <div className={s.edit}>
                        <span className={s.editLabel}>Wants to change it to{w.edit_at ? ` · ${when(w.edit_at)}` : ''}</span>
                        <p className={s.message}>{w.edit_message}</p>
                        <div className={s.actions}>
                          <button type="button" className={`${s.btn} ${s.approve}`} disabled={busy === w.id} onClick={() => decideEdit(w, true)}>Approve change</button>
                          <button type="button" className={`${s.btn} ${s.reject}`} disabled={busy === w.id} onClick={() => decideEdit(w, false)}>Reject change</button>
                        </div>
                      </div>
                    )}
                    {w.reason && (
                      <p className={s.reason}>
                        <b>{w.status === 'rejected' ? 'Reason' : 'Change rejected'}:</b> {w.reason}
                      </p>
                    )}
                    <div className={s.meta}>
                      <span>{w.guest_id ? 'Guest link' : 'Public'}</span>
                      <span>{when(w.created_at)}</span>
                      <span title="IP address">{w.ip}</span>
                    </div>
                    {filter === 'pinned' && (
                      <div className={s.actions}>
                        <button type="button" className={s.btn} disabled={i === 0} onClick={() => move(i, -1)} aria-label="Move up">↑ Up</button>
                        <button type="button" className={s.btn} disabled={i === wishes.length - 1} onClick={() => move(i, 1)} aria-label="Move down">↓ Down</button>
                      </div>
                    )}
                    <div className={s.actions}>
                      {w.status === 'approved' && (
                        <button type="button" className={`${s.btn} ${s.pinBtn}`} disabled={busy === w.id} onClick={() => pin(w, w.pin_order === null)}>
                          {w.pin_order === null ? '📌 Pin to top' : 'Unpin'}
                        </button>
                      )}
                      {w.status !== 'approved' && (
                        <button type="button" className={`${s.btn} ${s.approve}`} disabled={busy === w.id} onClick={() => decide(w, 'approved')}>Approve</button>
                      )}
                      {w.status !== 'rejected' && (
                        <button type="button" className={`${s.btn} ${s.reject}`} disabled={busy === w.id} onClick={() => decide(w, 'rejected')}>Reject</button>
                      )}
                      {w.status !== 'pending' && (
                        <button type="button" className={s.btn} disabled={busy === w.id} onClick={() => decide(w, 'pending')}>Back to pending</button>
                      )}
                      <button type="button" className={s.btn} disabled={busy === w.id} onClick={() => editText(w)}>Edit text</button>
                      {w.status === 'rejected' && (
                        <button type="button" className={s.btn} disabled={busy === w.id} onClick={() => changeReason(w)}>{w.reason ? 'Change reason' : 'Add reason'}</button>
                      )}
                      <button type="button" className={`${s.btn} ${s.ghost}`} disabled={busy === w.id} onClick={() => removeWish(w)}>Delete</button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <section className={s.panel}>
              <label className={s.fieldLabel} htmlFor="names">New guests — one name per line</label>
              <textarea
                id="names"
                className={s.names}
                rows={4}
                value={names}
                onChange={(e) => setNames(e.target.value)}
                placeholder={'លោក សុខ សាន្ត\nកញ្ញា ចាន់ ធីតា'}
              />
              <div className={s.row}>
                <button type="button" className={`${s.btn} ${s.approve}`} disabled={busy === 'add' || !names.trim()} onClick={addGuests}>
                  Create links
                </button>
                {guests.length > 0 && (
                  <button
                    type="button"
                    className={s.btn}
                    onClick={() => copy(shownGuests.map((g) => `${g.name}\t${linkFor(g)}`).join('\n'), `Copied ${shownGuests.length} links`)}
                  >
                    Copy all links
                  </button>
                )}
              </div>
            </section>

            {guests.length > 0 && (
              <input className={s.search} type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Search ${guests.length} guests`} />
            )}

            {shownGuests.length === 0 ? (
              <p className={s.empty}>{guests.length ? 'No guest matches.' : 'No guest links yet. Add names above.'}</p>
            ) : (
              <div className={s.grid}>
                {shownGuests.map((g) => (
                  <article key={g.id} className={s.card}>
                    <div className={s.cardHead}>
                      <span className={s.name}>{g.name}</span>
                      <span className={s.badge} data-status={g.wish_status ?? 'none'}>
                        {g.wish_status ? `Wish ${STATUS_LABEL[g.wish_status].toLowerCase()}` : 'No wish yet'}
                      </span>
                    </div>
                    <code className={s.link}>{linkFor(g)}</code>
                    <div className={s.actions}>
                      <button type="button" className={`${s.btn} ${s.approve}`} onClick={() => copy(linkFor(g), 'Link copied')}>Copy link</button>
                      {'share' in navigator && (
                        <button type="button" className={s.btn} onClick={() => navigator.share({ title: couple, url: linkFor(g) }).catch(() => {})}>Share</button>
                      )}
                      <button type="button" className={s.btn} disabled={busy === g.id} onClick={() => rename(g)}>Rename</button>
                      <button type="button" className={`${s.btn} ${s.ghost}`} disabled={busy === g.id} onClick={() => removeGuest(g)}>Delete</button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </main>

      {toast && <div className={s.toast} role="status">{toast}</div>}
    </div>
  );
}
