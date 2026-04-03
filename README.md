# Repository Atlas

Repository Atlas is a Next.js MVP that analyzes public GitHub repositories and turns them into a shareable developer-facing report with:

- a repository tree
- a dependency graph
- deterministic structural insights
- optional AI-generated summaries

## Stack

- Next.js App Router
- Prisma schema for PostgreSQL
- BullMQ + Redis worker support
- Local JSON fallback for storage and in-process jobs during development

## Environment

Create `.env.local` with any of the following:

```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
DATABASE_URL=postgresql://...
REDIS_URL=redis://localhost:6379
GITHUB_TOKEN=ghp_...
OPENAI_API_KEY=...
OPENAI_MODEL=gpt-5-mini
```

`DATABASE_URL` and `REDIS_URL` are optional for local development because the app falls back to a JSON store and in-process jobs.

## Run

```bash
npm install
npm run dev
```

Optional production-style worker:

```bash
npm run worker
```

## Test

```bash
npm run test
```

