import type { APIRoute } from 'astro';
import { activeWishFor, addWish, approvedWishes, guestByToken } from '@/server/db';
import { cleanText, clientIp, error, json, rateLimit, readJson } from '@/server/http';
import { notifyNewWish, startTelegram } from '@/server/telegram';
import { MAX_MESSAGE, MAX_NAME } from '@/lib/limits';

export const prerender = false;

/** Approved wishes, newest first: what every guest sees. */
export const GET: APIRoute = () => {
  startTelegram();
  return json({ wishes: approvedWishes().map(({ name, message, pin_order }) => ({ name, message, pinned: pin_order !== null })) });
};

/**
 * A guest sends a wish. It waits for approval before anyone else sees it.
 * One wish per guest: per personal link, or per IP for guests without one (a rejected wish
 * doesn't count, so they can try again). Sending is limited to 5 tries per IP per 10 minutes.
 */
export const POST: APIRoute = async (ctx) => {
  startTelegram();
  const ip = clientIp(ctx);
  const wait = rateLimit(`wish:${ip}`, 5, 10 * 60_000);
  if (wait) return error(429, 'too_many_requests', { retryAfter: wait });

  const body = await readJson(ctx);
  if (!body) return error(400, 'bad_request');
  const message = cleanText(body.message, MAX_MESSAGE);
  if (message.length < 2) return error(400, 'message_required');

  let guestId: number | null = null;
  let name: string;
  const token = typeof body.g === 'string' ? body.g : '';
  if (token) {
    const guest = guestByToken(token);
    if (!guest) return error(404, 'unknown_guest');
    guestId = guest.id;
    name = guest.name;
  } else {
    name = cleanText(body.name, MAX_NAME).replace(/\s+/g, ' ');
    if (!name) return error(400, 'name_required');
  }

  const existing = activeWishFor(guestId ? { guestId } : { ip });
  if (existing) {
    return error(409, 'already_sent', {
      wish: { name: existing.name, message: existing.message, status: existing.status, edit: existing.edit_message, reason: existing.reason },
    });
  }

  const wish = addWish({ guestId, name, message, ip });
  void notifyNewWish(wish);
  return json({ wish: { name: wish.name, message: wish.message, status: wish.status, edit: null, reason: null, claim: wish.claim } }, 201);
};
