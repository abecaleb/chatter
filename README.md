# Chatter (Bruce Wayne AI Group Chat)

A Vercel + Supabase app for a single WhatsApp-style room with:
- You (owner)
- 2 approved friends
- An AI persona that mimics **Bruce Wayne** based on your WhatsApp export.

## Stack
- Next.js (App Router)
- Supabase (Auth, Postgres, Realtime)
- OpenAI-compatible model API (OpenAI, OpenRouter, Ollama, LM Studio, vLLM)
- Deploy on Vercel free tier

## How access works
1. Friends submit an email request in the app.
2. You approve from `/admin`.
3. They log in via magic link and stay signed in.
4. Only approved users + owner can chat.
5. Optional: email notifications are sent to you on new access requests.

## Connect this repo to your local machine

```bash
git clone https://github.com/abecaleb/chatter.git
cd chatter
cp .env.example .env.local
npm install
```

Then set values in `.env.local`.

If you want local LLM inference, point `LLM_BASE_URL` to your local OpenAI-compatible endpoint, for example:

```env
LLM_BASE_URL=http://127.0.0.1:1234/v1
LLM_MODEL=your-local-model-name
LLM_API_KEY=not-needed-by-some-local-servers
```

> `NEXT_PUBLIC_APP_URL=http://localhost:3000` keeps login redirects working on local.

## Environment variables

Required:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
OWNER_EMAIL=you@example.com
LLM_API_KEY=...              # or OPENAI_API_KEY
LLM_MODEL=gpt-4o-mini        # or your local model name
```

Optional:

```env
LLM_BASE_URL=...             # for local/self-hosted OpenAI-compatible endpoint
RESEND_API_KEY=...           # to email owner on access request
OWNER_NOTIFY_EMAIL=...
```

## Supabase setup

Run SQL in Supabase SQL editor:

```sql
-- paste supabase/schema.sql
```

## Ingest WhatsApp style memory

Use your included export file:

```bash
npm run ingest
```

This extracts lines that match `Bruce Wayne` from `WhatsApp Chat with Intel footie .txt` and stores them in `training_snippets`.

## Run locally

```bash
npm run dev
```

Open `http://localhost:3000`.

## Deploy on Vercel
- Import this repo in Vercel.
- Add all env vars from `.env.local` to Vercel project settings.
- Deploy.

## Notes on "training"
This project uses retrieval-grounded prompting from your WhatsApp export (cheap/free-tier friendly persona grounding).
For true fine-tuning, switch the model call in `app/api/chat/route.ts` to your finetuned model endpoint.
