import { db } from "@/db";
import { questions } from "@/db/schema";
import { and, asc, eq, inArray } from "drizzle-orm";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const classId = sp.get("classId");
  const subjectId = sp.get("subjectId");
  const chapterIds = sp.getAll("chapterId");
  const type = sp.get("type");

  const conditions = [];
  if (classId) conditions.push(eq(questions.classId, Number(classId)));
  if (subjectId) conditions.push(eq(questions.subjectId, Number(subjectId)));
  if (chapterIds.length > 0) {
    conditions.push(inArray(questions.chapterId, chapterIds.map(Number)));
  }
  if (type) conditions.push(eq(questions.type, type));

  const rows = await db
    .select()
    .from(questions)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(asc(questions.id));
  return Response.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const items = Array.isArray(body) ? body : [body];

  if (items.length === 0) return Response.json({ error: "কোনো প্রশ্ন পাওয়া যায়নি" }, { status: 400 });

  const values = items.map((item) => ({
    type: item.type,
    classId: Number(item.classId),
    subjectId: Number(item.subjectId),
    chapterId: Number(item.chapterId),
    text: item.text ?? "",
    options: item.options ?? null,
    correctAnswer: item.correctAnswer ?? null,
    subQuestions: item.subQuestions ?? null,
    marks: Number(item.marks) || 1,
    imageUrl: item.imageUrl ?? null,
    tags: item.tags ?? null,
  }));

  for (const v of values) {
    if (!v.type || !v.classId || !v.subjectId || !v.chapterId) {
      return Response.json({ error: "ক্লাস/বিষয়/অধ্যায়/ধরন আবশ্যক" }, { status: 400 });
    }
  }

  const rows = await db.insert(questions).values(values).returning();
  return Response.json(rows, { status: 201 });
}
