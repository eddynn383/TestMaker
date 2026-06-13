@AGENTS.md

# TestMaker — App Context

## What is this app?

TestMaker is a Next.js 16 app that turns a PDF into an interactive quiz. The user uploads a PDF (test/exam), Claude AI (claude-sonnet-4-6) extracts all questions and answers, and the app stores them in a SQLite database. The user can then take the test in a step-by-step player.

## Core features

1. **Upload page** (`/upload`): User provides a test name and uploads a PDF via UploadThing. After upload, calls `/api/extract` which uses Claude to extract Q&A from the PDF and stores them in the DB.
2. **Home page** (`/`): Lists all tests with name, question count, estimated duration (~1.5 min/question), status (not_started / started / passed / failed), and score if completed. Play button navigates to the test.
3. **Test setup page** (`/test/[id]`): Pre-test screen where user sets a timer (hours + minutes) before starting. Creates a `TestAttempt` record.
4. **Test player** (client component `TestPlayer`): Shows one question at a time. After submitting an answer: shows correct/incorrect feedback immediately. Correct answer is hidden behind a "See correct answer" button. Supports a countdown timer. On finish, shows pass/fail score screen.

## Tech stack

- **Next.js 16.2.9** with App Router (Turbopack by default)
- **React 19.2.4**
- **Tailwind CSS v4** + `@tailwindcss/postcss`
- **UploadThing** for PDF uploads (endpoint: `pdfUploader`, max 16MB)
- **Prisma 7** with `better-sqlite3` adapter — local SQLite at `prisma/dev.db`
- **Prisma client generated** at `app/generated/prisma` (run `prisma generate` after schema changes)
- **Anthropic SDK** — uses `claude-sonnet-4-6` model with PDF document input to extract questions
- **KaTeX / react-katex** — renders LaTeX math in question text and answer options (inline `$...$`, block `$$...$$`)

## Database schema (Prisma)

- `Test` — id, name, pdfUrl, createdAt, updatedAt
- `Question` — id, testId, text, options (JSON string array), correctAnswer, explanation?, order
- `TestAttempt` — id, testId, status (started/passed/failed), score (float %), timeLimit (seconds), startedAt, completedAt?
- `Answer` — id, attemptId, questionId, selectedAnswer, isCorrect; unique on (attemptId, questionId)

Pass threshold: score ≥ 50%.

## Key files

- `app/page.tsx` — home page (server component, fetches tests)
- `app/upload/page.tsx` + `components/UploadForm.tsx` — upload flow
- `app/test/[id]/page.tsx` + `app/test/[id]/TestSetup.tsx` — test setup (client)
- `components/TestPlayer.tsx` — test player (client)
- `components/Timer.tsx` — countdown timer
- `components/TestCard.tsx` — test list item
- `components/MathText.tsx` — LaTeX renderer (dynamically imported, ssr: false)
- `app/api/extract/route.ts` — POST: fetch PDF, call Claude, save to DB
- `app/api/upload/core.ts` + `app/api/upload/route.ts` — UploadThing router
- `app/api/tests/[id]/attempt/route.ts` — POST: create attempt; PUT: submit answer or complete
- `lib/prisma.ts` — Prisma client singleton using better-sqlite3 adapter
- `prisma/schema.prisma` — DB schema (no url in datasource; url set in prisma.config.ts)
- `prisma.config.ts` — Prisma config with DB path from `DATABASE_URL` env or `file:./prisma/dev.db`

## Environment variables

Required (copy `.env.example` to `.env`):
- `DATABASE_URL` — SQLite path, e.g. `file:./prisma/dev.db`
- `UPLOADTHING_TOKEN` — from uploadthing.com
- `ANTHROPIC_API_KEY` — from console.anthropic.com

## Setup commands

```bash
pnpm install
npx prisma generate        # generates Prisma client to app/generated/prisma
npx prisma migrate deploy  # applies migrations, creates prisma/dev.db
pnpm dev                   # start dev server
```

## Known issues fixed

- `@prisma/client-runtime-utils` must be a direct dependency (pnpm doesn't hoist it automatically from @prisma/client's deps)
- `tailwindcss` and `@tailwindcss/postcss` must be ≥4.3.1 (4.0.0 had a breaking ScannerOptions API change)
- `dotenv` must be installed for `prisma.config.ts` to work at build time
- TypeScript must be ≥5.4.0 (Prisma 7 peer dep)
- `prisma/dev.db` is gitignored; run `prisma migrate deploy` to create it
- `app/generated/prisma` is gitignored; run `prisma generate` to create it
