-- AlterTable
ALTER TABLE "Question" ADD COLUMN IF NOT EXISTS "questionType" TEXT NOT NULL DEFAULT 'single';
