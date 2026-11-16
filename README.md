# Secret Santa 2026

Pick your name, pick a shape, find out who you're buying for. Act surprised.

## How the draw works

- When the board is first opened, each person is hidden inside a random shape.
- Picking a shape gives you whoever is inside it. Taken shapes grey out on everyone's phone (it refreshes every 3 seconds).
- Your own shape is blocked for you, and so is your partner's (`KEEP_APART` in `src/lib/config.ts`).
- If a pick would leave someone later with nobody valid to draw, that shape is blocked too, so the draw always completes.
- Claims run one at a time behind a lock, so two people tapping the same shape at once can't both get it.
- The browser never receives the full list. Only the person who drew sees their match, and they can see it again on the same device.

## Run locally

```bash
npm install
npm run dev
```

Without Redis env vars, the draw is kept in memory and resets when the dev server restarts.

## Deploy on Vercel

1. Push to GitHub and import the repo in Vercel.
2. In the project, open **Storage**, add **Upstash for Redis** (free plan) and connect it. This sets the Redis env vars for you.
3. Add an env var `ADMIN_KEY` with a secret only you know.
4. Deploy and share the link.

## Admin

Open `/admin` and enter your `ADMIN_KEY`. You can see who has drawn (not who they got) and reset the whole draw.

## Adding someone

Add the name to `PEOPLE` in `src/lib/config.ts`, redeploy, then reset from `/admin`. There are 10 shapes, so up to 10 people works without other changes.
