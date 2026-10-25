import { wedding } from '@/content/wedding';

export interface Guest {
  name: string;
  /** The personal link's token (?g=…), when the guest came through one made in the admin panel. */
  token?: string;
}

/** Guest name written into the link (`?to=…`), falling back to the generic salutation. */
export function getGuestName(): string {
  if (typeof window === 'undefined') return wedding.guestDefault;
  const to = new URLSearchParams(window.location.search).get('to')?.trim();
  return to || wedding.guestDefault;
}

let guest: Promise<Guest> | undefined;

/**
 * The guest: from a personal link's token (`?g=…`, looked up once and remembered for the visit),
 * else from `?to=…`, else the generic salutation.
 */
export function loadGuest(): Promise<Guest> {
  if (guest) return guest;
  const token = new URLSearchParams(window.location.search).get('g')?.trim();
  const fallback = { name: getGuestName() };
  if (!token) return guest = Promise.resolve(fallback);

  const key = `guest:${token}`;
  let cached: string | null = null;
  try { cached = sessionStorage.getItem(key); } catch { /* storage blocked */ }
  if (cached) return guest = Promise.resolve({ name: cached, token });

  guest = fetch(`/api/guest?g=${encodeURIComponent(token)}`)
    .then((r) => (r.ok ? r.json() as Promise<{ name: string }> : null))
    .then((d) => {
      if (!d?.name) return fallback;
      try { sessionStorage.setItem(key, d.name); } catch { /* storage blocked */ }
      return { name: d.name, token };
    })
    .catch(() => fallback);
  return guest;
}
