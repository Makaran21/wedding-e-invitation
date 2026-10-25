import type { APIRoute } from 'astro';
import { addGuests, listGuests } from '@/server/db';
import { cleanText, error, json, readJson, requireAdmin } from '@/server/http';
import { MAX_NAME } from '@/lib/limits';

export const prerender = false;

export const GET: APIRoute = (ctx) => {
  const denied = requireAdmin(ctx);
  if (denied) return denied;
  return json({ guests: listGuests() });
};

/** Creates personal links: one guest per name (send several, one per line). */
export const POST: APIRoute = async (ctx) => {
  const denied = requireAdmin(ctx);
  if (denied) return denied;
  const raw = (await readJson(ctx))?.names;
  const list = Array.isArray(raw) ? raw : typeof raw === 'string' ? raw.split('\n') : [];
  const names = list.map((n) => cleanText(n, MAX_NAME).replace(/\s+/g, ' ')).filter(Boolean).slice(0, 500);
  if (!names.length) return error(400, 'names_required');
  return json({ guests: addGuests(names) }, 201);
};
