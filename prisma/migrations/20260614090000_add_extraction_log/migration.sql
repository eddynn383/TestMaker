-- AlterTable
ALTER TABLE "Test" ADD COLUMN "extractStatus" TEXT NOT NULL DEFAULT 'ready';
ALTER TABLE "Test" ADD COLUMN "rawAiResponse" TEXT;
ALTER TABLE "Test" ADD COLUMN "extractionError" TEXT;
