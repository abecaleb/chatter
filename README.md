# Chatter (Bruce Wayne AI Group Chat)

A Vercel + Supabase app for a single WhatsApp-style room with:
- You (owner)
- 2 approved friends
- An AI persona that mimics **Bruce Wayne** based on your WhatsApp export.

## Stack
- Next.js (App Router)
- Supabase (Auth, Postgres, Realtime)
- OpenAI-compatible model API (default `gpt-4o-mini`)
- Deploy on Vercel free tier

## How access works
1. Friends submit an email request in the app.
2. You approve from `/admin`.
3. They log in via magic link and stay signed in.
4. Only approved users + owner can chat.

## Local setup

```bash
npm install
```

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
OWNER_EMAIL=you@example.com
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-4o-mini
```

Run schema in Supabase SQL editor:

```sql
-- paste supabase/schema.sql
```

Ingest training snippets from your WhatsApp dump:

```bash
npm run ingest
```

Run app:

```bash
npm run dev
```

## Vercel deploy
- Import this repo in Vercel.
- Add all env vars from `.env.local` to Vercel project settings.
- Deploy.

## Notes on "training"
This implementation uses retrieval-grounded prompting from your WhatsApp export (lightweight "persona training" on free tier).
For true fine-tuning, use a finetuned model provider and swap `app/api/chat/route.ts` model call.
