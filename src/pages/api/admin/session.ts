import type { APIRoute } from 'astro';
import {
  adminFailureLimit, clientIp, endSession, error, isAdminKey, isAdminPassword, json, limitedFor, rateLimit, readJson, startSession,
} from '@/server/http';

export const prerender = false;

/** Sign in to the admin panel with the password from .env (ADMIN_PASSWORD). */
export const POST: APIRoute = async (ctx) => {
  if (!isAdminKey(ctx.request.headers.get('x-admin-key'))) return adminFailureLimit(ctx);
  // 10 wrong passwords per IP per 15 minutes; while locked out, even the right one is refused.
  const key = `admin-login:${clientIp(ctx)}`;
  const locked = limitedFor(key, 10, 15 * 60_000);
  if (locked) return error(429, 'too_many_requests', { retryAfter: locked });
  const body = await readJson(ctx);
  if (!isAdminPassword(body?.password)) {
    rateLimit(key, 10, 15 * 60_000);
    return error(401, 'wrong_password');
  }
  startSession(ctx);
  return json({ ok: true });
};

/** Sign out. */
export const DELETE: APIRoute = (ctx) => {
  endSession(ctx);
  return json({ ok: true });
};
