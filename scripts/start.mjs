// Starts the built server (npm start), then wakes the database and the Telegram listener
// so Approve / Reject taps work even before the first guest visits.
await import('../dist/server/entry.mjs');

const port = process.env.PORT ?? '4321';
setTimeout(() => {
  fetch(`http://127.0.0.1:${port}/api/health`).catch((err) => console.error('[start] health check failed:', err.message));
}, 500);
