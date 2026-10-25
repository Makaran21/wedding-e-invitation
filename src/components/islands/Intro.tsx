import { useEffect, useState } from 'react';
import { wedding } from '@/content/wedding';
import Cover from './Cover';
import LotusCover from './LotusCover';
import VerticalCover from './VerticalCover';

type Style = typeof wedding.settings.intro;
const FROM_QUERY: Record<string, Style> = { lotus: 'Lotus', envelope: 'Envelope', vertical: 'Vertical' };

/** The opening cover chosen in settings, unless the link asks for another (?intro=vertical|envelope|lotus). */
export default function Intro() {
  const [style, setStyle] = useState<Style>(wedding.settings.intro);
  useEffect(() => {
    const q = new URLSearchParams(location.search).get('intro');
    if (q && FROM_QUERY[q]) setStyle(FROM_QUERY[q]);
  }, []);
  if (style === 'Lotus') return <LotusCover />;
  return style === 'Vertical' ? <VerticalCover /> : <Cover />;
}
