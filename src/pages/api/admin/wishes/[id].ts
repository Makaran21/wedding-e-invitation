import type { APIRoute } from 'astro';
import { decideEdit, deleteWish, setPinned, setWishMessage, setWishReason, setWishStatus, wishById, type WishStatus } from '@/server/db';
import { cleanText, error, json, readJson, requireAdmin } from '@/server/http';
import { MAX_MESSAGE } from '@/lib/limits';
import { deleteWishMessage, syncEditDecision, syncWishMessage } from '@/server/telegram';

export const prerender = false;

const STATUSES: WishStatus[] = ['pending', 'approved', 'rejected'];

/**
 * One of:
 * - { status, reason? }: approve, reject (with the reason the guest sees) or put back to pending;
 * - { edit: 'approve' | 'reject', reason? }: decide the guest's waiting edit;
 * - { reason }: change the reason on a rejection;
 * - { pinned }: pin an approved wish to the top of the site, or unpin it;
 * - { message }: correct the wish's text (shows straight away, no approval).
 */
export const PATCH: APIRoute = async (ctx) => {
  const denied = requireAdmin(ctx);
  if (denied) return denied;
  const id = Number(ctx.params.id);
  const before = wishById(id);
  if (!before) return error(404, 'not_found');
  const body = await readJson(ctx) ?? {};
  const reason = cleanText(body.reason, 300) || null;

  if (typeof body.message === 'string') {
    const message = cleanText(body.message, MAX_MESSAGE);
    if (message.length < 2) return error(400, 'message_required');
    await syncWishMessage(setWishMessage(id, message)!);
    return json({ ok: true });
  }
  if (typeof body.pinned === 'boolean') {
    return setPinned(id, body.pinned) ? json({ ok: true }) : error(409, 'not_approved');
  }
  if (body.edit === 'approve' || body.edit === 'reject') {
    if (!before.edit_message) return error(409, 'no_edit');
    const approve = body.edit === 'approve';
    const wish = decideEdit(id, approve, reason)!;
    await syncEditDecision(before, wish, approve, 'admin panel');
    await syncWishMessage(wish);
    return json({ ok: true });
  }
  if (body.status === undefined) {
    const wish = setWishReason(id, reason)!;
    await syncWishMessage(wish);
    return json({ ok: true });
  }
  const status = body.status as WishStatus;
  if (!STATUSES.includes(status)) return error(400, 'bad_status');
  const wish = setWishStatus(id, status, reason)!;
  await syncWishMessage(wish, 'admin panel');
  return json({ ok: true });
};

export const DELETE: APIRoute = async (ctx) => {
  const denied = requireAdmin(ctx);
  if (denied) return denied;
  const wish = deleteWish(Number(ctx.params.id));
  if (!wish) return error(404, 'not_found');
  await deleteWishMessage(wish);
  return json({ ok: true });
};
