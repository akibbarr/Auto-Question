import { db } from "@/db";
import { chapters } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const [row] = await db
    .update(chapters)
    .set({ name: body?.name, sortOrder: body?.sortOrder })
    .where(eq(chapters.id, Number(id)))
    .returning();
  if (!row) return Response.json({ error: "পাওয়া যায়নি" }, { status: 404 });
  return Response.json(row);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.delete(chapters).where(eq(chapters.id, Number(id)));
  return Response.json({ ok: true });
}
