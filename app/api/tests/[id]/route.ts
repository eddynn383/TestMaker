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
  const test = await prisma.test.findUnique({ where: { id } });
  if (!test) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.test.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
