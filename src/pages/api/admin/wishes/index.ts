import type { APIRoute } from 'astro';
import { listWishes, wishCounts, type WishStatus } from '@/server/db';
import { json, requireAdmin } from '@/server/http';

export const prerender = false;

const FILTERS: (WishStatus | 'pinned')[] = ['pending', 'approved', 'rejected', 'pinned'];

export const GET: APIRoute = (ctx) => {
  const denied = requireAdmin(ctx);
  if (denied) return denied;
  const s = ctx.url.searchParams.get('status') as WishStatus | 'pinned' | null;
  const wishes = listWishes(s && FILTERS.includes(s) ? s : undefined)
    .map(({ claim: _claim, ...w }) => w);
  return json({ wishes, counts: wishCounts() });
};
