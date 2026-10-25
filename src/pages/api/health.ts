import type { APIRoute } from 'astro';
import { getDb } from '@/server/db';
import { json } from '@/server/http';
import { startTelegram } from '@/server/telegram';

export const prerender = false;

/** Liveness check; also wakes the database and the Telegram listener after a restart. */
export const GET: APIRoute = () => {
  getDb();
  startTelegram();
  return json({ ok: true });
};
