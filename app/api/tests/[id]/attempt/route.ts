import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Start a new attempt
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { timeLimit } = await req.json();

  const test = await prisma.test.findUnique({ where: { id } });
  if (!test) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const attempt = await prisma.testAttempt.create({
    data: { testId: id, timeLimit: timeLimit ?? null, status: "started" },
  });

  return NextResponse.json(attempt);
}

// Submit an answer or complete the attempt
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  if (body.action === "answer") {
    const { attemptId, questionId, selectedAnswer } = body;

    const question = await prisma.question.findUnique({ where: { id: questionId } });
    if (!question) return NextResponse.json({ error: "Question not found" }, { status: 404 });

    const isCorrect = question.correctAnswer === selectedAnswer;

    const answer = await prisma.answer.upsert({
      where: { attemptId_questionId: { attemptId, questionId } },
      create: { attemptId, questionId, selectedAnswer, isCorrect },
      update: { selectedAnswer, isCorrect },
    });

    return NextResponse.json({ isCorrect, correctAnswer: question.correctAnswer, explanation: question.explanation, answer });
  }

  if (body.action === "complete") {
    const { attemptId } = body;

    const attempt = await prisma.testAttempt.findUnique({
      where: { id: attemptId },
      include: {
        answers: true,
        test: { include: { questions: { select: { id: true } } } },
      },
    });

    if (!attempt) return NextResponse.json({ error: "Attempt not found" }, { status: 404 });

    const total = attempt.test.questions.length;
    const correct = attempt.answers.filter((a) => a.isCorrect).length;
    const score = total > 0 ? (correct / total) * 100 : 0;
    const status = score >= 50 ? "passed" : "failed";

    const updated = await prisma.testAttempt.update({
      where: { id: attemptId },
      data: { status, score, completedAt: new Date() },
    });

    return NextResponse.json({ ...updated, correct, total });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
