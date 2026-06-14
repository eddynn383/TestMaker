import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const test = await prisma.test.findUnique({
    where: { id },
    include: {
      questions: { orderBy: { order: "asc" } },
      attempts: { orderBy: { startedAt: "desc" }, take: 1 },
    },
  });

  if (!test) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(test);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const attemptIds = (
      await prisma.testAttempt.findMany({ where: { testId: id }, select: { id: true } })
    ).map((a) => a.id);

    if (attemptIds.length > 0) {
      await prisma.answer.deleteMany({ where: { attemptId: { in: attemptIds } } });
    }
    await prisma.testAttempt.deleteMany({ where: { testId: id } });
    await prisma.question.deleteMany({ where: { testId: id } });
    await prisma.test.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete test error:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
