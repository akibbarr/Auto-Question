# Question Paper Generator — Supabase setup

## What I did
- Wrote `.env.local` with your `DATABASE_URL` (pooled Supabase Postgres, port 6543) and your Supabase URL/anon key.
- Replaced the hardcoded-localhost `drizzle.config.json` with `drizzle.config.ts` that reads `DATABASE_URL` from `.env.local`.
- Added `.gitignore` so `.env.local` and `node_modules` never get committed to GitHub.
- Added `db:push` / `db:studio` npm scripts.

**I could not run/test any of this myself** — this sandbox has no internet access, so I can't reach your Supabase project. You'll run the commands below on your own machine (or in Codespaces/StackBlitz, anywhere with internet + Node 20+).

## ⚠️ Double-check your DB password first
The connection string you pasted had the password wrapped like Supabase's placeholder template: `:[A9K5sWGTCAJykyw@]@`. I assumed the real password is `A9K5sWGTCAJykyw@` (dropped the brackets, percent-encoded the `@` as `%40` since `@` is a reserved URL character). **This is a guess** — please verify:

1. Supabase Dashboard → your project → **Project Settings → Database → Connection string**.
2. Copy the "Transaction pooler" URL fresh, and swap in your actual password with no brackets.
3. If the password itself contains `@ : / ? #` etc., percent-encode those characters.

If `DATABASE_URL` is wrong, everything below will fail with a connection error — that's your signal to fix it.

## Run it locally
```bash
npm install
npm run db:push       # creates the tables (classes, subjects, chapters, questions, exam_header_settings) in Supabase
npm run dev            # http://localhost:3000
```
Then check `http://localhost:3000/api/health` — it should return `{"ok":true}`. If it returns `{"ok":false}`, the DB connection is the problem — go fix the password above.

## Before you deploy for real: image uploads won't survive on Vercel
`src/app/api/upload/route.ts` currently saves images to `public/uploads/` on disk. That works locally, but **Vercel's filesystem is ephemeral/read-only** for deployed functions — uploaded images will vanish (or the upload will fail) in production. This is the first thing to extend:

- Add `@supabase/supabase-js`, create a Storage bucket (e.g. `question-images`) in the Supabase dashboard, and rewrite `upload/route.ts` to `supabase.storage.from('question-images').upload(...)` and return the public URL instead of writing to disk. I left `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` for exactly this — the current code doesn't use them yet.
- For the bucket, use a public bucket (simplest) since these are just paper header logos/question images with no auth in this app.

## Deploying to GitHub + Vercel
1. `git init && git add . && git commit -m "initial"` — `.gitignore` already excludes `.env.local`, so your secrets won't be pushed.
2. Push to a new GitHub repo, then import it in Vercel.
3. In Vercel → Project → Settings → Environment Variables, add the same three variables from `.env.local` (`DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
4. Deploy. Run `npm run db:push` once from your local machine pointed at the same `DATABASE_URL` (or via Vercel's CLI/build step) so the production DB has its tables before first use.

## One more thing worth doing
Since the DB password was pasted in plaintext in our chat, consider resetting it in Supabase (**Project Settings → Database → Reset database password**) once you're done testing, then update `DATABASE_URL` here and in Vercel. The anon key is fine to leave — it's meant to be public.
