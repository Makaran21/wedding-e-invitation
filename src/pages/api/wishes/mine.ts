import type { APIContext, APIRoute } from 'astro';
import { editWish, guestByToken, latestWishOfGuest, wishByClaim, type WishRow } from '@/server/db';
import { cleanText, clientIp, error, json, rateLimit, readJson } from '@/server/http';
import { notifyEdit } from '@/server/telegram';
import { MAX_MESSAGE } from '@/lib/limits';

export const prerender = false;

/** What the guest sees of their own wish. */
const view = (w: WishRow) => ({ name: w.name, message: w.message, status: w.status, edit: w.edit_message, reason: w.reason });

/** The guest's wish, by personal link token (g) or by the claim handed back when they sent it. */
function findOwn(g: string | null | undefined, claim: string | null | undefined): WishRow | undefined {
  const guest = g ? guestByToken(g) : undefined;
  if (guest) return latestWishOfGuest(guest.id);
  return claim ? wishByClaim(claim) : undefined;
}

const limited = (ctx: APIContext, what: string, max: number) => {
  const wait = rateLimit(`${what}:${clientIp(ctx)}`, max, 10 * 60_000);
  return wait ? error(429, 'too_many_requests', { retryAfter: wait }) : undefined;
};

/** The guest's own wish and where it stands (?g=… or ?claim=…). */
export const GET: APIRoute = (ctx) => {
  const stop = limited(ctx, 'mine', 300);
  if (stop) return stop;
  const wish = findOwn(ctx.url.searchParams.get('g'), ctx.url.searchParams.get('claim'));
  return json({ wish: wish ? view(wish) : null });
};

/**
 * The guest changes their wish. While pending it's simply replaced; once approved, the approved
 * text keeps showing and the new one waits for approval; a rejected wish is sent for approval again.
 */
export const PATCH: APIRoute = async (ctx) => {
  const stop = limited(ctx, 'edit', 10);
  if (stop) return stop;
  const body = await readJson(ctx);
  const before = findOwn(body?.g as string, body?.claim as string);
  if (!before) return error(404, 'not_found');
  const message = cleanText(body?.message, MAX_MESSAGE);
  if (message.length < 2) return error(400, 'message_required');
  const after = editWish(before.id, message)!;
  void notifyEdit(before, after);
  return json({ wish: view(after) });
};
