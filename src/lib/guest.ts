import { wedding } from '@/content/wedding';

/** Guest name from the personalised link (`?to=…`), falling back to the generic salutation. */
export function getGuestName(): string {
  if (typeof window === 'undefined') return wedding.guestDefault;
  const to = new URLSearchParams(window.location.search).get('to')?.trim();
  return to || wedding.guestDefault;
}
