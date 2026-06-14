import Link from "next/link";
import { prisma } from "@/lib/prisma";
import TestList from "@/components/TestList";

export const dynamic = "force-dynamic";

type TestRow = {
  id: string; name: string; pdfUrl: string; createdAt: Date; updatedAt: Date;
  extractStatus: string; rawAiResponse: string | null; extractionError: string | null;
  questions: { id: string }[];
  attempts: { status: string; score: number | null }[];
};

async function getTests() {
  const tests = await prisma.test.findMany({
    select: {
      id: true, name: true, pdfUrl: true, createdAt: true, updatedAt: true,
      extractStatus: true, rawAiResponse: true, extractionError: true,
      questions: { select: { id: true } },
      attempts: {
        orderBy: { startedAt: "desc" },
        take: 1,
        select: { status: true, score: true },
      },
    },
    orderBy: { createdAt: "desc" },
  }) as unknown as TestRow[];

  return tests.map((test) => ({
    id: test.id,
    name: test.name,
    questionCount: test.questions.length,
    estimatedDuration: Math.ceil(test.questions.length * 1.5),
    status: test.attempts[0]?.status ?? "not_started",
    score: test.attempts[0]?.score ?? null,
    extractStatus: test.extractStatus,
    rawAiResponse: test.rawAiResponse,
    extractionError: test.extractionError,
  }));
}

export default async function HomePage() {
  const tests = await getTests();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-4 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">TestMaker</h1>
            <p className="text-xs text-gray-400 mt-0.5">Your personal test library</p>
          </div>
          <Link
            href="/upload"
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            New Test
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <TestList initialTests={tests} />
      </main>
    </div>
  );
}
