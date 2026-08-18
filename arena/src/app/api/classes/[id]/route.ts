import { db } from "@/db";
import { classes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const [row] = await db
    .update(classes)
    .set({ name: body?.name, sortOrder: body?.sortOrder })
    .where(eq(classes.id, Number(id)))
    .returning();
  if (!row) return Response.json({ error: "পাওয়া যায়নি" }, { status: 404 });
  return Response.json(row);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.delete(classes).where(eq(classes.id, Number(id)));
  return Response.json({ ok: true });
}
