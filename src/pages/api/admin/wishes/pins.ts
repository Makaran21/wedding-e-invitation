import type { APIRoute } from 'astro';
import { orderPins } from '@/server/db';
import { error, json, readJson, requireAdmin } from '@/server/http';

export const prerender = false;

/** Reorders the pinned wishes: { ids: [top, second, …] }. */
export const PUT: APIRoute = async (ctx) => {
  const denied = requireAdmin(ctx);
  if (denied) return denied;
  const ids = (await readJson(ctx))?.ids;
  if (!Array.isArray(ids) || !ids.every((id) => Number.isInteger(id))) return error(400, 'ids_required');
  orderPins(ids as number[]);
  return json({ ok: true });
};
