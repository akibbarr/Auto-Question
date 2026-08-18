import { NextRequest } from "next/server";
import { generateQuestionPaperDocx } from "@/lib/docxExporter";
import type { ExportPayload } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const payload = (await req.json()) as ExportPayload;
    if (!payload?.sections?.length) {
      return Response.json({ error: "কোনো প্রশ্ন নির্বাচিত হয়নি" }, { status: 400 });
    }

    const buffer = await generateQuestionPaperDocx(payload);
    const fileName = `question-paper-${Date.now()}.docx`;

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (err) {
    console.error("docx export failed", err);
    return Response.json({ error: "প্রশ্নপত্র তৈরি করা যায়নি" }, { status: 500 });
  }
}
