# Makaran & Vouchnea — Wedding Invitation

Astro + React + TypeScript site built from the Claude Design file
*Khmer Wedding Invitation – Phone*. The page is a static site, so it works on any host
(Vercel, Netlify, Cloudflare Pages, GitHub Pages…).

## Run it

```sh
npm install
cp .env.example .env   # then fill it in (see below)
npm run dev            # http://localhost:4321
npm run build          # type-check + build to dist/
npm start              # run the built site: pages, wishes API and admin panel (reads .env)
```

The pages are prerendered, but the wishes and the admin panel need the small Node server that
`npm start` runs (Node 22.13+, which has SQLite built in). Wishes are kept in `data/wishes.db`.
Set `PORT` and `HOST` to change where it listens, e.g. `HOST=0.0.0.0 PORT=4321 npm start`.

### Settings (`.env`)

| Variable | What it does |
| --- | --- |
| `ADMIN_KEY` | The admin panel's address: `https://your-site/<ADMIN_KEY>`. Long and random, so nobody can guess it. |
| `ADMIN_PASSWORD` | Asked on the admin panel. 10 wrong tries locks that IP out for 15 minutes. |
| `TRUST_PROXY` | `true` behind Cloudflare (tunnel or proxy) or another reverse proxy, so the guest's real IP is used. |
| `DB_PATH` | Where the database lives (default `data/wishes.db`). |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | Optional: post each wish to a Telegram group with Approve / Reject buttons. |
| `PUBLIC_NAVBAR`, `PUBLIC_NAVBAR_POSITION` | The compact section dock: `false` hides it; `right` (default) or `bottom` (needs a rebuild). |
| `PUBLIC_ANIMATION_PROGRESS` | `false` hides the gold progress line along the bottom during animations (needs a rebuild). |

## Change the content

Everything guests read is in **`src/content/wedding.ts`**: names, dates, parents, letter text,
program, venue and map pin, gratitude, sample wishes, and the look-and-feel settings (rail width,
fonts, petals or gold dust, monogram, map style, cover lock). Text written as `.....` is still a
placeholder from the design.

## Personalised links

Make them in the admin panel (**Guest links**): paste names, one per line, and each guest gets a
link with a random token:

```
https://your-site.com/?g=y8o2_md36wFi
```

The name shows on the cover and the save-the-date card, and is locked in as the sender of their
wish. The older `?to=<name>` links still work for the name, but those guests send as public guests.
Without either, the page uses `guestDefault` from the content file.

## Photos

Drop files into `public/assets/photos/` using the names in `wedding.ts → photos`
(`strip-1.jpg`…`strip-3.jpg`, `couple.jpg` in 4:5, `gallery-*.jpg`). Until a file exists, a soft
placeholder shows its label.

## Images still to export from Claude Design

The Claude Design API caps downloads at 256 KB, so these came through incomplete or weren't
fetched. Download them from the design project and put them in `public/assets/`:

| File | Used for | Until added |
| --- | --- | --- |
| `kbach-flame.png` | Flame ornament on the cover's side rails | Plain rail pattern only |

## Wishes guestbook

- Guests with a personal link send as the name on it; everyone else types their name.
- **One wish per guest**: per personal link, or per IP for guests without one. Sending is limited
  to 5 tries per IP every 10 minutes.
- Wishes show on the site only once **approved**. Until then the guest sees theirs as pending.
- Guests can **edit** their wish. While pending, the text is just replaced. Once approved, the
  approved text keeps showing and the change waits for approval. A rejected wish can be edited and
  sent again.
- When you reject a wish or a change, you can give a **reason**, which the guest sees.

### Admin panel

Open `https://your-site/<ADMIN_KEY>` and sign in with `ADMIN_PASSWORD`. On phone or desktop:

- **Wishes**: Pending (new wishes and changes waiting), Approved, Rejected, Pinned, All. Approve,
  reject (with a reason), put back to pending, correct the text, or delete.
- **Pin** approved wishes to show them first on the site, and sort the pinned ones with ↑ ↓ under
  **Pinned**. A wish that stops being approved is unpinned.
- **Guest links**: create links (many at once), copy or share them, rename, delete, and see who has
  sent a wish.

### Telegram

1. Create a bot with [@BotFather](https://t.me/BotFather) and put its token in `TELEGRAM_BOT_TOKEN`.
2. Add the bot to your group and send any message there.
3. Open `https://api.telegram.org/bot<TOKEN>/getUpdates` and copy the group's `chat.id`
   (a negative number) into `TELEGRAM_CHAT_ID`. Then restart the server.

Each new wish, and each change to an approved wish, is posted to the group with **Approve** and
**Reject** buttons. After rejecting, **reply to the post** with a reason and the guest sees it.
Decisions made in the admin panel update the post too. Only buttons in that group count.

## Structure

```
src/content/wedding.ts        all content + types
src/pages/index.astro         section order
src/components/*.astro        static sections (no JavaScript shipped)
src/components/islands/*.tsx  interactive React pieces: cover, petals, guest card,
                              program toggle, venue map, wishes
src/components/admin/         the admin panel
src/pages/api/                wishes API (public) and admin API
src/pages/[key].astro         the admin page, at the secret ADMIN_KEY path
src/server/                   SQLite database, request helpers, Telegram bot
src/lib/                      guest lookup, particle math, fonts, monogram, wishes API client
src/scripts/reveal.ts         scroll-in reveal and parallax
design-src/                   original Claude Design source, kept for reference
```
# wedding-e-invitation
