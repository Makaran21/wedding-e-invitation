import type { APIRoute } from 'astro';
import { deleteGuest, renameGuest } from '@/server/db';
import { cleanText, error, json, readJson, requireAdmin } from '@/server/http';
import { MAX_NAME } from '@/lib/limits';

export const prerender = false;

export const PATCH: APIRoute = async (ctx) => {
  const denied = requireAdmin(ctx);
  if (denied) return denied;
  const name = cleanText((await readJson(ctx))?.name, MAX_NAME).replace(/\s+/g, ' ');
  if (!name) return error(400, 'name_required');
  return renameGuest(Number(ctx.params.id), name) ? json({ ok: true }) : error(404, 'not_found');
};

/** Deletes the guest and their link; any wish they sent stays, as a public one. */
export const DELETE: APIRoute = (ctx) => {
  const denied = requireAdmin(ctx);
  if (denied) return denied;
  return deleteGuest(Number(ctx.params.id)) ? json({ ok: true }) : error(404, 'not_found');
};
