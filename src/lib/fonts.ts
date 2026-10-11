import type { KhmerFont, LatinFont } from '@/content/wedding';

// Weights available on Google Fonts, as requested by the design (empty = regular only).
const WEIGHTS: Record<KhmerFont | LatinFont, string> = {
  'Moulpali': '', 'Moul': '', 'Preahvihear': '', 'Koulen': '', 'Marcellus': '',
  'Battambang': '400;700', 'Suwannaphum': '400;700', 'Kantumruy Pro': '300;400;500;600',
  'Cinzel': '400;500;600', 'Cormorant Garamond': '300;400;500;600', 'EB Garamond': '400;500',
  'Playfair Display': '400;500;600', 'Jost': '300;400;500',
};

export function googleFontsHref(...families: (KhmerFont | LatinFont)[]): string {
  const params = families.map((f) => {
    const w = WEIGHTS[f];
    return 'family=' + f.replace(/ /g, '+') + (w ? ':wght@' + w : '');
  });
  return `https://fonts.googleapis.com/css2?${params.join('&')}&display=swap`;
}
