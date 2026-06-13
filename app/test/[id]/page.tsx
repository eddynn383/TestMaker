import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TestSetup from "./TestSetup";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TestPage({ params }: Props) {
  const { id } = await params;

  const test = await prisma.test.findUnique({
    where: { id },
    include: { questions: { orderBy: { order: "asc" } } },
  });

  if (!test) return notFound();

  return <TestSetup test={test} />;
}
