# FakeGuard

FakeGuard is a React + Express app for submitting article URLs or pasted article text for AI-assisted credibility analysis.

## Local Development

```bash
pnpm install
pnpm --filter @workspace/api-server run dev
pnpm --filter @workspace/fakeguard run dev
```

The frontend proxies `/api` requests to the API server.

## Vercel Deployment

This repo includes `vercel.json` and `api/[...path].ts` so Vercel can serve:

- the FakeGuard frontend from `artifacts/fakeguard/dist/public`
- the Express API through Vercel serverless functions at `/api/*`

Use these Vercel settings:

```text
Install Command: pnpm install --frozen-lockfile
Build Command: pnpm --filter @workspace/fakeguard run build
Output Directory: artifacts/fakeguard/dist/public
```

Set these environment variables in Vercel:

```text
DATABASE_URL
SESSION_SECRET
CLERK_SECRET_KEY
CLERK_PUBLISHABLE_KEY
VITE_CLERK_PUBLISHABLE_KEY
OPENAI_API_KEY
AI_MODEL
```

For production, use a hosted Postgres database and a model supported by your OpenAI account.
