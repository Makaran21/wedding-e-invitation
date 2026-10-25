// @ts-check
import { defineConfig, envField } from 'astro/config';
import react from '@astrojs/react';
import node from '@astrojs/node';

export default defineConfig({
  // Pages are still prerendered; only the wishes API and the admin panel run on the server.
  output: 'static',
  adapter: node({ mode: 'standalone' }),
  integrations: [react()],
  env: {
    schema: {
      /** Secret part of the admin panel's path: /<ADMIN_KEY>. Long and random. */
      ADMIN_KEY: envField.string({ context: 'server', access: 'secret' }),
      /** Password asked on the admin panel before anything shows. */
      ADMIN_PASSWORD: envField.string({ context: 'server', access: 'secret' }),
      /** Telegram bot that posts each new wish to a group with Approve / Reject buttons. Optional. */
      TELEGRAM_BOT_TOKEN: envField.string({ context: 'server', access: 'secret', optional: true }),
      /** The group's chat id (negative for groups), e.g. -1001234567890. */
      TELEGRAM_CHAT_ID: envField.string({ context: 'server', access: 'secret', optional: true }),
      /** Where the SQLite database lives. */
      DB_PATH: envField.string({ context: 'server', access: 'secret', default: 'data/wishes.db' }),
      /** Behind Cloudflare or another proxy: take the guest's IP from its headers. */
      TRUST_PROXY: envField.boolean({ context: 'server', access: 'secret', default: false }),
    },
  },
  vite: {
    // MapLibre's worker is an ES module that imports a shared chunk.
    worker: { format: 'es' },
    // Allow previewing the dev server through an ngrok or Cloudflare tunnel.
    server: { allowedHosts: ['.ngrok-free.dev', '.trycloudflare.com'] },
  },
});
