import { db } from "@/db";
import { classes } from "@/db/schema";
import { asc } from "drizzle-orm";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const rows = await db.select().from(classes).orderBy(asc(classes.sortOrder), asc(classes.id));
  return Response.json(rows);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const name = (body?.name ?? "").trim();
  if (!name) return Response.json({ error: "নাম আবশ্যক" }, { status: 400 });

  const [row] = await db
    .insert(classes)
    .values({ name, sortOrder: body?.sortOrder ?? 0 })
    .returning();
  return Response.json(row, { status: 201 });
}
