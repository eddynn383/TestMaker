import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type TestRow = {
  id: string; name: string; pdfUrl: string; createdAt: Date; updatedAt: Date;
  questions: { id: string }[];
  attempts: { id: string; status: string; score: number | null; completedAt: Date | null }[];
};

export async function GET() {
  const tests = await prisma.test.findMany({
    include: {
      questions: { select: { id: true } },
      attempts: {
        orderBy: { startedAt: "desc" },
        take: 1,
        select: { id: true, status: true, score: true, completedAt: true },
      },
    },
    orderBy: { createdAt: "desc" },
  }) as unknown as TestRow[];

  const result = tests.map((test) => {
    const questionCount = test.questions.length;
    const latestAttempt = test.attempts[0] ?? null;
    const estimatedMinutes = Math.ceil(questionCount * 1.5);

    return {
      id: test.id,
      name: test.name,
      pdfUrl: test.pdfUrl,
      questionCount,
      estimatedDuration: estimatedMinutes,
      status: latestAttempt?.status ?? "not_started",
      score: latestAttempt?.score ?? null,
      createdAt: test.createdAt,
    };
  });

  return NextResponse.json(result);
}
