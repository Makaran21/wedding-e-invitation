import { useEffect, useRef } from 'react';
import type { Map as MapLibreMap } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import { wedding, type MapStyle } from '@/content/wedding';

const STYLES: Record<MapStyle, { url: string; tint: string }> = {
  'Dark matter': { url: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json', tint: 'sepia(0.4) saturate(1.15) hue-rotate(-12deg) contrast(1.05)' },
  'Dark matter (no labels)': { url: 'https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json', tint: 'sepia(0.45) saturate(1.2) hue-rotate(-12deg) contrast(1.05)' },
  'Positron': { url: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json', tint: 'sepia(0.35) saturate(0.95) contrast(1.02)' },
  'Positron (no labels)': { url: 'https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json', tint: 'sepia(0.4) saturate(0.9) contrast(1.02)' },
  'Voyager': { url: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json', tint: 'sepia(0.3) saturate(1.05)' },
  'Voyager (no labels)': { url: 'https://basemaps.cartocdn.com/gl/voyager-nolabels-gl-style/style.json', tint: 'sepia(0.32) saturate(1.05)' },
};

/** Tinted MapLibre map of the venue with a glowing gold pin. */
export default function VenueMap() {
  const host = useRef<HTMLDivElement>(null);
  const { lat, lng, zoom } = wedding.venue;
  const style = STYLES[wedding.settings.mapStyle];

  useEffect(() => {
    let map: MapLibreMap | undefined;
    let cancelled = false;
    import('maplibre-gl').then((maplibregl) => {
      if (cancelled || !host.current) return;
      // Point MapLibre at its bundled worker so it loads from our own build output.
      maplibregl.setWorkerUrl(workerUrl);
      const m = new maplibregl.Map({
        container: host.current, style: style.url, center: [lng, lat], zoom,
        attributionControl: false, cooperativeGestures: true,
      });
      m.addControl(new maplibregl.AttributionControl({ compact: true }));
      m.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'bottom-right');
      const pin = document.createElement('div');
      pin.style.cssText = 'width:20px;height:20px;border-radius:50%;background:#D9A441;border:2px solid #F4DA9B;box-shadow:0 0 0 8px rgba(217,164,65,0.22),0 0 18px rgba(217,164,65,0.6)';
      new maplibregl.Marker({ element: pin }).setLngLat([lng, lat]).addTo(m);
      map = m;
    });
    return () => { cancelled = true; map?.remove(); };
  }, [lat, lng, zoom, style.url]);

  return <div ref={host} style={{ position: 'absolute', inset: 0, filter: style.tint }} />;
}
