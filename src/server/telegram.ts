import { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } from 'astro:env/server';
import {
  decideEdit, kvGet, kvSet, setWishReason, setWishStatus, setWishTelegramEditMessage, setWishTelegramMessage,
  wishById, wishByTelegramMessage, type WishRow, type WishStatus,
} from './db';

/**
 * Telegram: each new wish (and each edit of an approved wish) is posted to the group with
 * Approve / Reject buttons, and the post is kept in step with its status. After a rejection,
 * replying to the post sets the reason the guest sees. Taps and replies are read by
 * long-polling getUpdates, so no public webhook URL is needed.
 * Does nothing unless TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are set.
 */
const API = (process.env.TELEGRAM_API_URL ?? 'https://api.telegram.org').replace(/\/$/, '');
const enabled = () => Boolean(TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID);

type Button = { text: string; callback_data: string };
type Post = { text: string; reply_markup: { inline_keyboard: Button[][] } };

async function call<T = unknown>(method: string, body: Record<string, unknown>, timeoutMs = 15_000): Promise<T> {
  const res = await fetch(`${API}/bot${TELEGRAM_BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  const data = await res.json() as { ok: boolean; result: T; description?: string };
  if (!data.ok) throw new Error(`Telegram ${method}: ${data.description ?? res.status}`);
  return data.result;
}

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const quote = (s: string) => `<blockquote>${esc(s)}</blockquote>`;
const from = (w: WishRow) => `<b>${esc(w.name)}</b> (${w.guest_id ? 'invited guest' : `public · IP ${esc(w.ip)}`})`;
const REASON_HINT = '<i>Reply to this message with a reason to show the guest.</i>';

const STATUS_LINE: Record<WishStatus, string> = {
  pending: '⏳ <b>Waiting for approval</b>',
  approved: '✅ <b>Approved</b>',
  rejected: '❌ <b>Rejected</b>',
};

/** The post for a wish itself. */
function wishPost(wish: WishRow, decidedBy?: string): Post {
  const by = decidedBy && wish.status !== 'pending' ? ` by ${esc(decidedBy)}` : '';
  let status = `${STATUS_LINE[wish.status]}${by}`;
  if (wish.status === 'rejected') status += wish.reason ? `\nReason: ${esc(wish.reason)}` : `\n${REASON_HINT}`;
  const approve = { text: '✅ Approve', callback_data: `wish:${wish.id}:approved` };
  const reject = { text: '❌ Reject', callback_data: `wish:${wish.id}:rejected` };
  const row = wish.status === 'pending' ? [approve, reject] : wish.status === 'approved' ? [reject] : [approve];
  return {
    text: `💌 <b>Wish #${wish.id}</b>\nFrom: ${from(wish)}\n\n${quote(wish.message)}\n\n${status}`,
    reply_markup: { inline_keyboard: [row] },
  };
}

/** The post for an edit of an approved wish: what shows now, and what the guest wants instead. */
function editPost(wish: WishRow, edit: string, state: WishStatus, decidedBy?: string): Post {
  const by = decidedBy && state !== 'pending' ? ` by ${esc(decidedBy)}` : '';
  let status = `${STATUS_LINE[state].replace('Approved', 'Edit approved').replace('Rejected', 'Edit rejected')}${by}`;
  if (state === 'rejected') status += wish.reason ? `\nReason: ${esc(wish.reason)}` : `\n${REASON_HINT}`;
  const buttons = state === 'pending'
    ? [[{ text: '✅ Approve edit', callback_data: `edit:${wish.id}:approve` }, { text: '❌ Reject edit', callback_data: `edit:${wish.id}:reject` }]]
    : [];
  return {
    text: `✏️ <b>Edit to wish #${wish.id}</b>\nFrom: ${from(wish)}\n\n`
      + `${state === 'approved' ? 'Was' : 'Showing now'}:\n${quote(wish.message)}\n${state === 'pending' ? 'Wants to change it to' : 'Change'}:\n${quote(edit)}\n\n${status}`,
    reply_markup: { inline_keyboard: buttons },
  };
}

async function post(p: Post): Promise<number> {
  return (await call<{ message_id: number }>('sendMessage', { chat_id: TELEGRAM_CHAT_ID, parse_mode: 'HTML', ...p })).message_id;
}

async function update(messageId: number, p: Post): Promise<void> {
  try {
    await call('editMessageText', { chat_id: TELEGRAM_CHAT_ID, message_id: messageId, parse_mode: 'HTML', ...p });
  } catch (err) {
    if (!String(err).includes('message is not modified')) throw err;
  }
}

/** Runs a Telegram step without letting an outage break the request that caused it. */
const quietly = (what: string, step: () => Promise<unknown>) =>
  enabled() ? step().catch((err) => console.error(`[telegram] could not ${what}:`, err instanceof Error ? err.message : err)) : Promise.resolve();

/** Posts a new (or re-sent) wish to the group. */
export function notifyNewWish(wish: WishRow): Promise<unknown> {
  return quietly(`post wish ${wish.id}`, async () => setWishTelegramMessage(wish.id, await post(wishPost(wish))));
}

/** Updates a wish's post after its status, text or reason changes. */
export function syncWishMessage(wish: WishRow, decidedBy?: string): Promise<unknown> {
  if (!wish.tg_message_id) return Promise.resolve();
  return quietly(`update wish ${wish.id}`, () => update(wish.tg_message_id!, wishPost(wish, decidedBy)));
}

/**
 * After the guest edits their wish. A pending wish's post just shows the new text; a re-sent
 * rejected wish gets a fresh post; an approved wish's edit gets its own post to approve.
 */
export function notifyEdit(before: WishRow, after: WishRow): Promise<unknown> {
  if (before.status === 'rejected') return notifyNewWish(after);
  if (after.status === 'pending') return syncWishMessage(after);
  return quietly(`post edit of wish ${after.id}`, async () => {
    if (after.edit_message === null) {
      // The guest went back to the approved text: the waiting edit is withdrawn.
      if (before.tg_edit_message_id && before.edit_message) {
        await update(before.tg_edit_message_id, { text: `✏️ <b>Edit to wish #${after.id}</b> — withdrawn by the guest.`, reply_markup: { inline_keyboard: [] } });
      }
      return;
    }
    if (before.edit_message && before.tg_edit_message_id) await update(before.tg_edit_message_id, editPost(after, after.edit_message, 'pending'));
    else setWishTelegramEditMessage(after.id, await post(editPost(after, after.edit_message, 'pending')));
  });
}

/** Updates an edit's post once it's decided: still showing the text before and the change. */
export function syncEditDecision(before: WishRow, after: WishRow, approved: boolean, decidedBy?: string): Promise<unknown> {
  if (!after.tg_edit_message_id || !before.edit_message) return Promise.resolve();
  const shown = { ...before, reason: after.reason };
  return quietly(`update edit of wish ${after.id}`, async () => {
    await update(after.tg_edit_message_id!, editPost(shown, before.edit_message!, approved ? 'approved' : 'rejected', decidedBy));
    // An approved edit's post is done with; a rejected one stays the place to reply with a reason.
    if (approved) setWishTelegramEditMessage(after.id, null);
  });
}

/** Removes a deleted wish's posts. */
export function deleteWishMessage(wish: WishRow): Promise<unknown> {
  return quietly(`delete posts of wish ${wish.id}`, async () => {
    for (const id of [wish.tg_message_id, wish.tg_edit_message_id]) {
      if (id) await call('deleteMessage', { chat_id: TELEGRAM_CHAT_ID, message_id: id }).catch(() => {});
    }
  });
}

type From = { username?: string; first_name?: string };
type Message = { message_id: number; chat: { id: number }; from?: From; text?: string; reply_to_message?: { message_id: number } };
type CallbackQuery = { id: string; data?: string; from: From; message?: Message };

const nameOf = (f?: From) => (f?.username ? `@${f.username}` : f?.first_name ?? 'someone');
const inGroup = (m?: { chat: { id: number } }) => String(m?.chat.id) === String(TELEGRAM_CHAT_ID);

async function handleCallback(q: CallbackQuery): Promise<void> {
  const answer = (text: string) => call('answerCallbackQuery', { callback_query_id: q.id, text });
  const match = /^(wish|edit):(\d+):(approved|rejected|approve|reject)$/.exec(q.data ?? '');
  // Only buttons in the configured group count.
  if (!match || !inGroup(q.message)) { await answer('Not allowed here.'); return; }
  const id = Number(match[2]);
  const before = wishById(id);
  if (!before) { await answer('This wish was deleted.'); return; }
  const by = nameOf(q.from);

  if (match[1] === 'wish') {
    const status = match[3] as WishStatus;
    const wish = setWishStatus(id, status)!;
    await syncWishMessage(wish, by);
    await answer(status === 'approved' ? 'Approved — it now shows on the site.' : 'Rejected. Reply to the post to give a reason.');
    return;
  }
  const approve = match[3] === 'approve';
  if (!before.edit_message) { await answer('This edit was already decided or withdrawn.'); return; }
  const wish = decideEdit(id, approve)!;
  await syncEditDecision(before, wish, approve, by);
  await syncWishMessage(wish);
  await answer(approve ? 'Edit approved — the new text shows on the site.' : 'Edit rejected. Reply to the post to give a reason.');
}

/** A reply to a rejected wish's (or rejected edit's) post becomes the reason the guest sees. */
async function handleReply(m: Message): Promise<void> {
  const replyTo = m.reply_to_message?.message_id;
  const reason = m.text?.trim().slice(0, 300);
  if (!replyTo || !reason || !inGroup(m)) return;
  const wish = wishByTelegramMessage(replyTo);
  if (!wish) return;
  const onEdit = replyTo === wish.tg_edit_message_id;
  const rejected = onEdit ? wish.status === 'approved' && !wish.edit_message : wish.status === 'rejected';
  if (!rejected) return;
  const updated = setWishReason(wish.id, reason)!;
  if (onEdit) {
    await quietly('add reason', () => update(replyTo, {
      text: `✏️ <b>Edit to wish #${wish.id}</b> — ❌ <b>rejected</b>\nReason: ${esc(reason)}`, reply_markup: { inline_keyboard: [] },
    }));
  } else {
    await syncWishMessage(updated);
  }
  await call('setMessageReaction', { chat_id: TELEGRAM_CHAT_ID, message_id: m.message_id, reaction: [{ type: 'emoji', emoji: '👌' }] })
    .catch(() => {});
}

let started = false;

/** Starts listening for button taps and replies, once per process. Safe to call on every request. */
export function startTelegram(): void {
  if (started || !enabled()) return;
  // The dev server and the built server would fight over the same updates; poll from one only.
  if (import.meta.env.DEV && !process.env.TELEGRAM_POLL_IN_DEV) return;
  started = true;
  void poll();
}

async function poll(): Promise<void> {
  // getUpdates doesn't work while a webhook is set.
  await call('deleteWebhook', {}).catch((err) => console.error('[telegram]', err));
  console.log('[telegram] listening for Approve / Reject taps and reasons');
  for (;;) {
    try {
      const offset = Number(kvGet('tg_offset') ?? 0);
      const updates = await call<{ update_id: number; callback_query?: CallbackQuery; message?: Message }[]>('getUpdates', {
        offset, timeout: 50, allowed_updates: ['callback_query', 'message'],
      }, 65_000);
      for (const u of updates) {
        kvSet('tg_offset', String(u.update_id + 1));
        const handled = u.callback_query ? handleCallback(u.callback_query) : u.message ? handleReply(u.message) : undefined;
        await handled?.catch((err) => console.error('[telegram]', err));
      }
    } catch (err) {
      console.error('[telegram] polling failed, retrying in 10s:', err instanceof Error ? err.message : err);
      await new Promise((r) => setTimeout(r, 10_000));
    }
  }
}
