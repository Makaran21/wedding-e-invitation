import { wedding, type Wish } from '@/content/wedding';

/**
 * Where wishes are read from and saved to. The UI only talks to this interface,
 * so a real backend (Supabase, Firebase, a Google Sheet endpoint…) can be dropped
 * in by implementing it and changing `wishesStore` below.
 */
export interface WishesStore {
  list(): Promise<Wish[]>;
  add(wish: Wish): Promise<void>;
}

/** In-memory store seeded from content — wishes last only for the current page view. */
function createLocalWishesStore(seed: Wish[]): WishesStore {
  let wishes = [...seed];
  return {
    async list() { return wishes; },
    async add(wish) { wishes = [wish, ...wishes]; },
  };
}

export const wishesStore: WishesStore = createLocalWishesStore(wedding.wishes);
