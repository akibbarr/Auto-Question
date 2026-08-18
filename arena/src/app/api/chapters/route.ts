import { db } from "@/db";
import { chapters } from "@/db/schema";
import { asc, eq } from "drizzle-orm";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const subjectId = req.nextUrl.searchParams.get("subjectId");
  const rows = await db
    .select()
    .from(chapters)
    .where(subjectId ? eq(chapters.subjectId, Number(subjectId)) : undefined)
    .orderBy(asc(chapters.sortOrder), asc(chapters.id));
  return Response.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const name = (body?.name ?? "").trim();
  const subjectId = Number(body?.subjectId);
  if (!name || !subjectId) return Response.json({ error: "বিষয় ও নাম আবশ্যক" }, { status: 400 });

  const [row] = await db
    .insert(chapters)
    .values({ name, subjectId, sortOrder: body?.sortOrder ?? 0 })
    .returning();
  return Response.json(row, { status: 201 });
}
