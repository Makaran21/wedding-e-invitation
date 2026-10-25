import type { APIRoute } from 'astro';
import { listWishes, wishCounts, type WishStatus } from '@/server/db';
import { json, requireAdmin } from '@/server/http';

export const prerender = false;

const STATUSES: WishStatus[] = ['pending', 'approved', 'rejected'];

export const GET: APIRoute = (ctx) => {
  const denied = requireAdmin(ctx);
  if (denied) return denied;
  const s = ctx.url.searchParams.get('status') as WishStatus | null;
  const wishes = listWishes(s && STATUSES.includes(s) ? s : undefined)
    .map(({ claim: _claim, ...w }) => w);
  return json({ wishes, counts: wishCounts() });
};
