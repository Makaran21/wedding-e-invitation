/** Fired on window when the guest taps "Open invitation" (or on load when the cover lock is off). */
export const OPEN_EVENT = 'invitation:open';

declare global {
  interface Window { __invitationOpened?: boolean }
}

export function markOpened(): void {
  window.__invitationOpened = true;
  window.dispatchEvent(new Event(OPEN_EVENT));
}

/** Runs `fn` once the invitation is open — immediately if it already is. */
export function onOpened(fn: () => void): () => void {
  if (window.__invitationOpened) { fn(); return () => {}; }
  window.addEventListener(OPEN_EVENT, fn, { once: true });
  return () => window.removeEventListener(OPEN_EVENT, fn);
}
