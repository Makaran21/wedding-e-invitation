import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { MONOGRAM_FALLBACK } from '@/lib/monogram';

interface Props { src: string; className?: string; style?: CSSProperties }

/** Monogram image that falls back to the MN mark if the chosen file is missing. */
export default function MonogramImage({ src, className, style }: Props) {
  const [current, setCurrent] = useState(src);
  const ref = useRef<HTMLImageElement>(null);
  const fallback = () => { if (current !== MONOGRAM_FALLBACK) setCurrent(MONOGRAM_FALLBACK); };

  // The server-rendered <img> may have failed before React attached onError.
  useEffect(() => {
    const img = ref.current;
    if (img && img.complete && img.naturalWidth === 0) fallback();
  }, []);

  return <img ref={ref} src={current} alt="Monogram" className={className} style={style} onError={fallback} />;
}
