import { db } from "@/db";
import { questions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();

  const update: Record<string, unknown> = { updatedAt: new Date() };
  for (const key of [
    "text",
    "options",
    "correctAnswer",
    "subQuestions",
    "marks",
    "imageUrl",
    "tags",
    "classId",
    "subjectId",
    "chapterId",
    "type",
  ]) {
    if (key in body) update[key] = body[key];
  }

  const [row] = await db
    .update(questions)
    .set(update)
    .where(eq(questions.id, Number(id)))
    .returning();
  if (!row) return Response.json({ error: "পাওয়া যায়নি" }, { status: 404 });
  return Response.json(row);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.delete(questions).where(eq(questions.id, Number(id)));
  return Response.json({ ok: true });
}
