import Link from "next/link";
import { prisma } from "@/lib/prisma";
import TestCard from "@/components/TestCard";

export const dynamic = "force-dynamic";

async function getTests() {
  const tests = await prisma.test.findMany({
    include: {
      questions: { select: { id: true } },
      attempts: {
        orderBy: { startedAt: "desc" },
        take: 1,
        select: { status: true, score: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return tests.map((test) => ({
    id: test.id,
    name: test.name,
    questionCount: test.questions.length,
    estimatedDuration: Math.ceil(test.questions.length * 1.5),
    status: test.attempts[0]?.status ?? "not_started",
    score: test.attempts[0]?.score ?? null,
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
        {tests.length === 0 ? (
          <div className="text-center py-24">
            <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-800 mb-2">No tests yet</h2>
            <p className="text-sm text-gray-400 mb-6">Upload a PDF to create your first test.</p>
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors"
            >
              Upload PDF
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {tests.map((test) => (
              <TestCard key={test.id} {...test} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
