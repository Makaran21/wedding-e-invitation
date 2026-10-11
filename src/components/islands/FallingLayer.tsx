import { useEffect, useMemo, useState, type CSSProperties } from 'react';
import { wedding } from '@/content/wedding';
import { onOpened } from '@/lib/events';
import { makePetals, makeSparks } from '@/lib/particles';

type Vars = CSSProperties & Record<`--${string}`, string>;

/** Rose petals (or gold dust) drifting down the whole invitation once it's opened. */
export default function FallingLayer() {
  const { falling, petalCount, sparkCount } = wedding.settings;
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (falling === 'None') return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    return onOpened(() => setActive(true));
  }, [falling]);

  const petals = useMemo(() => (falling === 'Rose petals' ? makePetals(petalCount) : []), [falling, petalCount]);
  const sparks = useMemo(() => (falling === 'Gold dust' ? makeSparks(sparkCount) : []), [falling, sparkCount]);

  if (!active) return null;

  return (
    <div aria-hidden="true" style={{
      position: 'absolute', top: 0, bottom: 0, left: 'var(--rail)', right: 'var(--rail)',
      zIndex: 52, pointerEvents: 'none', overflow: 'hidden',
    }}>
      {petals.map((p, i) => (
        <span key={i} style={{
          position: 'absolute', top: '-4%', left: p.left, '--end': p.end, transformOrigin: '50% 100%', opacity: 0,
          animation: `${p.fall} ${p.dur} linear ${p.delay} 1 both, petalLand 1.8s ease-out ${p.land} 1 both`,
        } as Vars}>
          <span style={{ ...ripple, width: 34, height: 12, borderColor: 'rgba(217,164,65,0.7)', animation: `petalRipple 1.6s ease-out ${p.land} 1 both` }} />
          <span style={{ ...ripple, width: 52, height: 18, borderColor: 'rgba(217,164,65,0.45)', animation: `petalRipple 2.2s ease-out ${p.land2} 1 both` }} />
          <span style={{ ...glint, animation: `petalGlint 0.9s ease-out ${p.land} 1 both` }} />
          <span style={{ display: 'block', animation: `petalDrift ${p.sway} ease-in-out ${p.driftN} alternate both, ${p.fade}` }}>
            <span style={{ display: 'block', animation: `petalGust ${p.gust} linear ${p.gustN} both` }}>
              <svg viewBox="0 0 30 32" width={p.size} height={p.tall} style={{
                display: 'block', opacity: Number(p.op), filter: 'drop-shadow(1.5px 3px 2px rgba(44,5,16,0.35))',
                animation: `petalFlutter ${p.flutter} ease-in-out ${p.flutterN} both`,
              }}>
                <use href={p.sym} width="30" height="32" />
              </svg>
            </span>
          </span>
        </span>
      ))}
      {sparks.map((k, i) => (
        <span key={i} style={{
          position: 'absolute', left: k.left, top: k.top, width: k.size, height: k.size, borderRadius: '50%', opacity: 0,
          background: 'radial-gradient(circle, #FFF4DA 0%, #F4DA9B 35%, rgba(217,164,65,0) 72%)',
          boxShadow: `0 0 ${k.halo} rgba(217,164,65,0.55)`,
          animation: `sparkTwinkle ${k.dur} ease-in-out ${k.delay} infinite, sparkFloat ${k.drift} ease-in-out ${k.delay} infinite alternate`,
        }} />
      ))}
    </div>
  );
}

const ripple: CSSProperties = {
  position: 'absolute', left: '50%', top: '60%', borderRadius: '50%', border: '1px solid',
  pointerEvents: 'none', opacity: 0,
};

const glint: CSSProperties = {
  position: 'absolute', left: '50%', top: '10%', width: 9, height: 9, pointerEvents: 'none', opacity: 0,
  background: 'radial-gradient(circle, #FFF4DA 0%, rgba(244,218,155,0.9) 30%, rgba(217,164,65,0) 70%)',
  clipPath: 'polygon(50% 0,60% 40%,100% 50%,60% 60%,50% 100%,40% 60%,0 50%,40% 40%)',
};
