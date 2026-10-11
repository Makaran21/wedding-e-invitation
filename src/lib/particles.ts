// Deterministic particle layouts, ported from the design's petals() / sparks() / dust().

export interface Petal {
  fall: 'petalFall' | 'petalVanish';
  sym: '#petalShape' | '#petalShapeLt';
  left: string; end: string; size: string; tall: string; op: string;
  dur: string; delay: string; land: string; land2: string; fade: string;
  sway: string; driftN: number; gust: string; gustN: number; flutter: string; flutterN: number;
}

export interface Spark {
  left: string; top: string; size: string; halo: string; dur: string; drift: string; delay: string;
}

export interface Dust { left: string; bottom: string; dur: string; delay: string }

const wave = (i: number) => (k: number) => (Math.sin((i + 1) * k) + 1) / 2;

export function makePetals(count: number): Petal[] {
  const n = Math.max(0, Math.round(count));
  const band = 92 / n;
  const out: Petal[] = [];
  for (let i = 0; i < n; i++) {
    const r = wave(i);
    const col = (i * 17) % n;
    const delayS = i < 10 ? i * 0.3 : 3 + (i - 10) * 1.4 + r(3.77) * 1.1;
    const dur = 70 + r(7.233) * 45;
    const sway = 5 + r(9.11) * 4;
    const gust = 9 + r(6.41) * 9;
    const flutter = 3.2 + r(8.07) * 3;
    const size = 8.5 + r(4.1414) * 5;
    const lingers = i % 3 === 0;
    out.push({
      fall: lingers ? 'petalFall' : 'petalVanish',
      sym: i % 2 === 0 ? '#petalShape' : '#petalShapeLt',
      left: (3 + col * band + r(12.9898) * band * 0.7).toFixed(1) + '%',
      end: (95.5 + r(2.19) * 3.6).toFixed(2) + '%',
      size: size.toFixed(1) + 'px',
      tall: (size * 1.06).toFixed(1) + 'px',
      op: (0.26 + r(5.31) * 0.3).toFixed(2),
      dur: dur.toFixed(1) + 's',
      delay: delayS.toFixed(1) + 's',
      land: (delayS + dur - 0.3).toFixed(1) + 's',
      land2: (delayS + dur).toFixed(1) + 's',
      fade: lingers ? 'none' : `petalFadeOut 1.6s ease-out ${(delayS + dur + 1.2).toFixed(1)}s 1 forwards`,
      sway: sway.toFixed(1) + 's',
      driftN: Math.max(1, Math.floor(dur / sway)),
      gust: gust.toFixed(1) + 's',
      gustN: Math.max(1, Math.floor(dur / gust)),
      flutter: flutter.toFixed(1) + 's',
      flutterN: Math.max(1, Math.floor(dur / flutter)),
    });
  }
  return out;
}

export function makeSparks(count: number): Spark[] {
  const n = Math.max(0, Math.round(count));
  const out: Spark[] = [];
  for (let i = 0; i < n; i++) {
    const r = wave(i);
    const sz = 2 + r(4.1414) * 3.4;
    out.push({
      left: (2 + ((i * 23) % n) * (95 / n) + r(12.9898) * 3).toFixed(2) + '%',
      top: (((i * 37) % n) * (100 / n) + r(7.71) * (60 / n)).toFixed(2) + '%',
      size: sz.toFixed(1) + 'px',
      halo: (sz * 1.8).toFixed(1) + 'px',
      dur: (3.4 + r(6.41) * 4.2).toFixed(1) + 's',
      drift: (6 + r(9.11) * 5).toFixed(1) + 's',
      delay: (r(3.77) * 7).toFixed(1) + 's',
    });
  }
  return out;
}

export function makeDust(count: number): Dust[] {
  const out: Dust[] = [];
  for (let i = 0; i < Math.round(count); i++) {
    const r = ((i * 9301 + 49297) % 233280) / 233280;
    const r2 = ((i * 4523 + 7919) % 100) / 100;
    out.push({
      left: Math.round(r * 96 + 2) + '%',
      bottom: Math.round(r2 * 70) + '%',
      dur: (7 + r2 * 9).toFixed(1) + 's',
      delay: (r * 10).toFixed(1) + 's',
    });
  }
  return out;
}
