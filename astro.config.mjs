// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  output: 'static',
  integrations: [react()],
  vite: {
    // MapLibre's worker is an ES module that imports a shared chunk.
    worker: { format: 'es' },
    // Allow previewing the dev server through an ngrok or Cloudflare tunnel.
    server: { allowedHosts: ['.ngrok-free.dev', '.trycloudflare.com'] },
  },
});
