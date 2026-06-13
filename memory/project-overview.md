---
name: project-overview
description: TestMaker app purpose, features, and tech stack
metadata:
  type: project
---

TestMaker is a Next.js 16 (App Router, Turbopack) app that converts PDFs into interactive quizzes.

**Why:** Personal study tool — upload an exam PDF, extract Q&A via Claude AI, take the test in-browser with timer, immediate feedback, and score tracking.

**How to apply:** All features should serve this quiz-taking flow; database schema and API routes are designed around Test > Question > TestAttempt > Answer hierarchy.

## Features
1. Upload PDF + name → Claude extracts questions → stored in SQLite
2. Home page lists tests with status (not_started/started/passed/failed), duration estimate, score
3. Test setup: user picks a countdown timer (hours + minutes)
4. Test player: one question at a time, immediate correct/incorrect feedback, "See correct answer" reveal button, countdown timer, score screen on finish

## Tech stack
- Next.js 16.2.9 + React 19.2.4 + Tailwind v4 + TypeScript 6
- UploadThing for PDF file uploads (pdfUploader endpoint, 16MB max)
- Prisma 7 with better-sqlite3 adapter (local SQLite at prisma/dev.db)
- Prisma client generated to app/generated/prisma
- Anthropic SDK (claude-sonnet-4-6) with PDF document input
- KaTeX / react-katex for LaTeX math rendering (MathText component, ssr:false)

## Required env vars (.env)
- DATABASE_URL=file:./prisma/dev.db
- UPLOADTHING_TOKEN=...
- ANTHROPIC_API_KEY=...

## Setup after clone
```
pnpm install
npx prisma generate
npx prisma migrate deploy
pnpm dev
```
