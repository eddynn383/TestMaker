---
name: project-issues-fixed
description: Build/runtime issues found and fixed in TestMaker initial setup
metadata:
  type: project
---

Issues found and fixed when running the app for the first time (2026-06-13):

**Why:** The initial commit had package versions that were too old or missing packages, causing build failures.

**How to apply:** If the app fails to build after a fresh clone, check these items first.

## Issues fixed

1. **Prisma client not generated** — `app/generated/prisma` is gitignored. Run `npx prisma generate` after clone.

2. **SQLite DB missing** — `prisma/dev.db` is gitignored. Run `npx prisma migrate deploy` after clone.

3. **`@prisma/client-runtime-utils` not accessible** — pnpm doesn't hoist this transitive dep to `node_modules/@prisma/`. Fixed by adding it as a direct dependency in package.json.

4. **Tailwind 4.0.0 had breaking API change** (`ScannerOptions.sources.negated` missing) — Updated `tailwindcss` and `@tailwindcss/postcss` from 4.0.0 → 4.3.1.

5. **`dotenv` not installed** — `prisma.config.ts` imports `dotenv/config` but dotenv wasn't in package.json. Added as devDependency.

6. **TypeScript 5.0.2 didn't satisfy Prisma 7 peer dep** (`>=5.4.0`) — Updated to TypeScript 6.
