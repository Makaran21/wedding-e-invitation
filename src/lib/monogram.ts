import type { Settings } from '@/content/wedding';

export const MONOGRAM_FALLBACK = '/assets/monogram-khmer-gold.png';

export interface Monogram { src: string; /** Square artwork (vs. the tall kbach crest). */ square: boolean }

/** Image for a monogram setting, or null when the setting asks for lettering instead. */
export function monogramSrc(choice: Settings['monogram'] | Settings['dateMonogram']): Monogram | null {
  switch (choice) {
    case 'Khmer ម ន mark': return { src: '/assets/monogram-khmer-gold.png', square: true };
    case 'Latin MN mark': return { src: '/assets/monogram-mn-gold.png', square: true };
    case 'Khmer kbach mark': return { src: '/assets/monogram-crest.png', square: false };
    default: return null;
  }
}
