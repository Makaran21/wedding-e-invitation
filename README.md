# Makaran & Vouchnea — Wedding Invitation

Astro + React + TypeScript site built from the Claude Design file
*Khmer Wedding Invitation – Phone*. The page is a static site, so it works on any host
(Vercel, Netlify, Cloudflare Pages, GitHub Pages…).

## Run it

```sh
npm install
npm run dev       # http://localhost:4321
npm run build     # type-check + build to dist/
npm run preview   # serve the built site
```

## Change the content

Everything guests read is in **`src/content/wedding.ts`**: names, dates, parents, letter text,
program, venue and map pin, gratitude, sample wishes, and the look-and-feel settings (rail width,
fonts, petals or gold dust, monogram, map style, cover lock). Text written as `.....` is still a
placeholder from the design.

## Personalised links

Add `?to=` with the guest's name to the link:

```
https://your-site.com/?to=លោក%20សុខ%20សាន្ត
```

The name appears on the save-the-date card and as the sender in the wishes form. Without it, the
page uses `guestDefault` from the content file.

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

The form and list are built. For now, wishes are kept in memory only: a guest sees their own wish
until they reload, and other guests never see it. To collect wishes for real, implement the
`WishesStore` interface in `src/lib/wishes.ts` (for example with Supabase, Firebase, or a Google
Apps Script endpoint) and export it as `wishesStore`. The UI doesn't need to change. Remove or
replace the sample wishes in `wedding.ts` before sharing the site.

## Structure

```
src/content/wedding.ts        all content + types
src/pages/index.astro         section order
src/components/*.astro        static sections (no JavaScript shipped)
src/components/islands/*.tsx  interactive React pieces: cover, petals, guest card,
                              program toggle, venue map, wishes
src/lib/                      guest name, particle math, fonts, monogram, wishes store
src/scripts/reveal.ts         scroll-in reveal and parallax
design-src/                   original Claude Design source, kept for reference
```
# wedding-e-invitation
