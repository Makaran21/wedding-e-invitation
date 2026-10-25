import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import type { APIContext } from 'astro';
import { ADMIN_KEY, ADMIN_PASSWORD, TRUST_PROXY } from 'astro:env/server';
import { startTelegram } from './telegram';

export const json = (body: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers },
  });

export const error = (status: number, code: string, extra: Record<string, unknown> = {}) =>
  json({ error: code, ...extra }, status);

/** The guest's IP: from Cloudflare's or the proxy's headers when TRUST_PROXY is on, else the socket. */
export function clientIp(ctx: APIContext): string {
  if (TRUST_PROXY) {
    const h = ctx.request.headers;
    const forwarded = h.get('cf-connecting-ip') ?? h.get('x-real-ip') ?? h.get('x-forwarded-for')?.split(',')[0];
    if (forwarded?.trim()) return forwarded.trim();
  }
  try { return ctx.clientAddress; } catch { return 'unknown'; }
}

/**
 * Sliding-window limit per key (e.g. "wish:1.2.3.4"): at most `max` hits in `windowMs`.
 * Returns 0 when allowed, else how many seconds until the oldest hit expires.
 * Kept in memory: limits reset when the server restarts, which is fine for this.
 */
const hits = new Map<string, number[]>();
export function rateLimit(key: string, max: number, windowMs: number): number {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  if (recent.length >= max) {
    hits.set(key, recent);
    return Math.ceil((recent[0] + windowMs - now) / 1000);
  }
  recent.push(now);
  hits.set(key, recent);
  return 0;
}
/** Seconds until `key` may try again under the same limit, without counting a hit (0 = may try now). */
export function limitedFor(key: string, max: number, windowMs: number): number {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  return recent.length >= max ? Math.ceil((recent[0] + windowMs - now) / 1000) : 0;
}

// Drop stale keys now and then so the map doesn't grow forever.
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of hits) if (v.every((t) => now - t > 60 * 60_000)) hits.delete(k);
}, 10 * 60_000).unref();

/** Constant-time string comparison (hashing first so lengths don't leak). */
function same(given: string, expected: string): boolean {
  const digest = (v: string) => createHash('sha256').update(v).digest();
  return timingSafeEqual(digest(given), digest(expected));
}

/** True when `given` matches the admin key, the secret part of the panel's path. */
export function isAdminKey(given: string | null | undefined): boolean {
  return Boolean(given && ADMIN_KEY && same(given, ADMIN_KEY));
}

export function isAdminPassword(given: unknown): boolean {
  return typeof given === 'string' && Boolean(ADMIN_PASSWORD) && same(given, ADMIN_PASSWORD);
}

// ---------- Admin session: a signed cookie set after the password is entered ----------

export const SESSION_COOKIE = 'admin_session';
const SESSION_DAYS = 30;
/** Signed with both secrets, so changing the password (or key) signs everyone out. */
const sign = (value: string) => createHmac('sha256', `${ADMIN_PASSWORD}\n${ADMIN_KEY}`).update(value).digest('base64url');

export function startSession(ctx: APIContext): void {
  const expires = Date.now() + SESSION_DAYS * 86_400_000;
  const https = ctx.url.protocol === 'https:' || ctx.request.headers.get('x-forwarded-proto') === 'https';
  ctx.cookies.set(SESSION_COOKIE, `${expires}.${sign(String(expires))}`, {
    httpOnly: true, sameSite: 'strict', secure: https, path: '/', expires: new Date(expires),
  });
}

export function endSession(ctx: APIContext): void {
  ctx.cookies.delete(SESSION_COOKIE, { path: '/' });
}

export function hasSession(ctx: Pick<APIContext, 'cookies'>): boolean {
  const [expires, sig] = (ctx.cookies.get(SESSION_COOKIE)?.value ?? '').split('.');
  return Boolean(expires && sig && Number(expires) > Date.now() && same(sig, sign(expires)));
}

/** Wrong passwords and keys: at most 10 per IP per 15 minutes, so neither can be guessed. */
export function adminFailureLimit(ctx: APIContext): Response {
  const wait = rateLimit(`admin-fail:${clientIp(ctx)}`, 10, 15 * 60_000);
  return wait ? error(429, 'too_many_requests', { retryAfter: wait }) : error(401, 'unauthorized');
}

/**
 * Guards an admin API request: it needs the admin key (X-Admin-Key header) and a signed-in
 * session. Returns a response to send back when the request must stop here.
 */
export function requireAdmin(ctx: APIContext): Response | undefined {
  startTelegram();
  if (!isAdminKey(ctx.request.headers.get('x-admin-key'))) return adminFailureLimit(ctx);
  if (!hasSession(ctx)) return error(401, 'signed_out');
  return undefined;
}

/** Trims, drops control characters and squeezes runs of blank lines; caps the length. */
export function cleanText(value: unknown, max: number): string {
  if (typeof value !== 'string') return '';
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/\r\n?/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
    .slice(0, max);
}

export async function readJson(ctx: APIContext): Promise<Record<string, unknown> | undefined> {
  try {
    const body = await ctx.request.json();
    return body && typeof body === 'object' ? body as Record<string, unknown> : undefined;
  } catch {
    return undefined;
  }
}
