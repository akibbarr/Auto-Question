import { db } from "@/db";
import { subjects } from "@/db/schema";
import { and, asc, eq } from "drizzle-orm";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const classId = req.nextUrl.searchParams.get("classId");
  const rows = await db
    .select()
    .from(subjects)
    .where(classId ? eq(subjects.classId, Number(classId)) : undefined)
    .orderBy(asc(subjects.sortOrder), asc(subjects.id));
  return Response.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const name = (body?.name ?? "").trim();
  const classId = Number(body?.classId);
  if (!name || !classId) return Response.json({ error: "ক্লাস ও নাম আবশ্যক" }, { status: 400 });

  const [row] = await db
    .insert(subjects)
    .values({ name, classId, code: body?.code ?? null, sortOrder: body?.sortOrder ?? 0 })
    .returning();
  return Response.json(row, { status: 201 });
}
