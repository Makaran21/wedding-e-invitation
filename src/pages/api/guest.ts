import type { APIRoute } from 'astro';
import { guestByToken } from '@/server/db';
import { clientIp, error, json, rateLimit } from '@/server/http';

export const prerender = false;

/** The name behind a personal link's token (?g=…). Limited per IP so tokens can't be guessed. */
export const GET: APIRoute = (ctx) => {
  const wait = rateLimit(`guest:${clientIp(ctx)}`, 30, 60_000);
  if (wait) return error(429, 'too_many_requests', { retryAfter: wait });
  const guest = guestByToken(ctx.url.searchParams.get('g') ?? '');
  return guest ? json({ name: guest.name }) : error(404, 'unknown_guest');
};
