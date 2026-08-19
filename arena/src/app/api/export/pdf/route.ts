import { NextRequest } from "next/server";
import puppeteer from "puppeteer";
import { buildPaperHtml } from "@/lib/pdfHtml";
import type { ExportPayload } from "@/lib/types";

export const dynamic = "force-dynamic";

const PAPER_SIZE_MM: Record<string, { width: number; height: number }> = {
  A4: { width: 210, height: 297 },
  Letter: { width: 215.9, height: 279.4 },
  Legal: { width: 215.9, height: 355.6 },
  A5: { width: 148, height: 210 },
};

export async function POST(req: NextRequest) {
  let browser: Awaited<ReturnType<typeof puppeteer.launch>> | null = null;
  try {
    const payload = (await req.json()) as ExportPayload;
    if (!payload?.sections?.length) {
      return Response.json({ error: "কোনো প্রশ্ন নির্বাচিত হয়নি" }, { status: 400 });
    }

    // baseUrl lets the HTML resolve /fonts/*.ttf and /uploads/* images from this
    // same running Next.js server, since headless Chromium has no relative context.
    const baseUrl = req.nextUrl.origin;
    const html = buildPaperHtml(payload, baseUrl);
    const size = PAPER_SIZE_MM[payload.customization.paperSize] ?? PAPER_SIZE_MM.A4;

    browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });

    const pdfBuffer = await page.pdf({
      width: `${size.width}mm`,
      height: `${size.height}mm`,
      printBackground: true,
      // No fixed pageRanges: Chromium prints as many pages as the content needs,
      // so a short paper stays on 1 page and a long one automatically flows to 2+.
    });

    const fileName = `question-paper-${Date.now()}.pdf`;
    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (err) {
    console.error("pdf export failed", err);
    return Response.json({ error: "PDF তৈরি করা যায়নি" }, { status: 500 });
  } finally {
    if (browser) await browser.close();
  }
}
