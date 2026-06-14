import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TestSetup from "./TestSetup";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ new?: string }>;
}

export default async function TestPage({ params, searchParams }: Props) {
  const { id } = await params;
  const { new: isNew } = await searchParams;

  type TestWithQuestions = {
    id: string; name: string; pdfUrl: string; createdAt: Date; updatedAt: Date;
    questions: { id: string; text: string; options: string; correctAnswer: string; questionType: string; explanation: string | null; order: number }[];
  };

  const test = await prisma.test.findUnique({
    where: { id },
    include: { questions: { orderBy: { order: "asc" } } },
  }) as TestWithQuestions | null;

  if (!test) return notFound();

  // Resume an in-progress attempt unless the user explicitly wants to restart
  type ExistingAttempt = { id: string; timeLimit: number | null };
  let existingAttempt: ExistingAttempt | null = null;
  if (!isNew) {
    existingAttempt = await prisma.testAttempt.findFirst({
      where: { testId: id, status: "started" },
      orderBy: { startedAt: "desc" },
      select: { id: true, timeLimit: true },
    }) as ExistingAttempt | null;
  }

  return <TestSetup test={test} existingAttempt={existingAttempt} />;
}
