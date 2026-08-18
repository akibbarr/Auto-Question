import { db } from "@/db";
import { examHeaderSettings } from "@/db/schema";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

async function getOrCreateSettings() {
  const rows = await db.select().from(examHeaderSettings).limit(1);
  if (rows.length > 0) return rows[0];
  const [row] = await db
    .insert(examHeaderSettings)
    .values({
      schoolName: "আদর্শ উচ্চ বিদ্যালয়",
      address: "",
      examName: "বার্ষিক পরীক্ষা - ২০২৬",
      instructions: "সময়মতো উত্তর করার চেষ্টা করবে। প্রতিটি প্রশ্নের মান ডানপাশে উল্লেখ আছে।",
      footerText: "",
      watermarkText: "",
    })
    .returning();
  return row;
}

export async function GET() {
  const row = await getOrCreateSettings();
  return Response.json(row);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const current = await getOrCreateSettings();

  const [row] = await db
    .update(examHeaderSettings)
    .set({
      schoolName: body?.schoolName ?? current.schoolName,
      address: body?.address ?? current.address,
      logoUrl: "logoUrl" in body ? body.logoUrl : current.logoUrl,
      examName: body?.examName ?? current.examName,
      instructions: body?.instructions ?? current.instructions,
      footerText: body?.footerText ?? current.footerText,
      watermarkText: body?.watermarkText ?? current.watermarkText,
      updatedAt: new Date(),
    })
    .where(eq(examHeaderSettings.id, current.id))
    .returning();

  return Response.json(row);
}
