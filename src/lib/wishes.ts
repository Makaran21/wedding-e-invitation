import type { Wish } from '@/content/wedding';

export type WishStatus = 'pending' | 'approved' | 'rejected';
/** A guest's own wish and where it stands. */
export interface OwnWish extends Wish {
  status: WishStatus;
  /** A change to an approved wish, waiting for approval; the approved message shows meanwhile. */
  edit: string | null;
  /** Why the wish (or, if it's approved, their last edit) wasn't approved. */
  reason: string | null;
}

export type SendError = 'already_sent' | 'too_many_requests' | 'name_required' | 'message_required' | 'unknown_guest' | 'network';
export type SendResult =
  | { ok: true; wish: OwnWish }
  | { ok: false; error: SendError; wish?: OwnWish };

/** Lets a guest without a personal link find their own wish again after a reload. */
const CLAIM_KEY = 'wish-claim';
const readClaim = () => { try { return localStorage.getItem(CLAIM_KEY); } catch { return null; } };
const saveClaim = (claim: string) => { try { localStorage.setItem(CLAIM_KEY, claim); } catch { /* storage blocked */ } };

/** Talks to the wishes API (src/pages/api/wishes). */
export const wishesApi = {
  /** Approved wishes, newest first. */
  async list(): Promise<Wish[]> {
    const res = await fetch('/api/wishes');
    if (!res.ok) throw new Error(`wishes: ${res.status}`);
    return (await res.json() as { wishes: Wish[] }).wishes;
  },

  /** This guest's own wish, if they've sent one: by personal link, else by what this browser remembers. */
  async mine(token?: string): Promise<OwnWish | null> {
    const claim = token ? null : readClaim();
    if (!token && !claim) return null;
    const q = token ? `g=${encodeURIComponent(token)}` : `claim=${encodeURIComponent(claim!)}`;
    const res = await fetch(`/api/wishes/mine?${q}`);
    if (!res.ok) return null;
    return (await res.json() as { wish: OwnWish | null }).wish;
  },

  /** Changes the guest's wish; once approved, the change waits for approval while the old one shows. */
  async edit(message: string, token?: string): Promise<SendResult> {
    try {
      const res = await fetch('/api/wishes/mine', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message, g: token, claim: token ? undefined : readClaim() }),
      });
      const data = await res.json() as { wish?: OwnWish; error?: SendError };
      return res.ok && data.wish ? { ok: true, wish: data.wish } : { ok: false, error: data.error ?? 'network' };
    } catch {
      return { ok: false, error: 'network' };
    }
  },

  async send(input: { message: string; name?: string; token?: string }): Promise<SendResult> {
    try {
      const res = await fetch('/api/wishes', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: input.message, name: input.name, g: input.token }),
      });
      const data = await res.json() as { wish?: OwnWish & { claim?: string }; error?: SendError };
      if (res.ok && data.wish) {
        if (data.wish.claim) saveClaim(data.wish.claim);
        const { claim: _claim, ...wish } = data.wish;
        return { ok: true, wish };
      }
      return { ok: false, error: data.error ?? 'network', wish: data.wish };
    } catch {
      return { ok: false, error: 'network' };
    }
  },
};
