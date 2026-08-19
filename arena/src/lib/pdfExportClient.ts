import type { ExportPayload } from "./types";

/** Sends the paper payload to the server, which renders it with headless
 * Chromium into an A4 (or chosen size) PDF — auto-flowing to extra pages
 * whenever the content doesn't fit on one — then triggers a browser download. */
export async function exportQuestionPaperPdf(payload: ExportPayload, fileName = "প্রশ্নপত্র.pdf"): Promise<void> {
  const res = await fetch("/api/export/pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "এক্সপোর্ট ব্যর্থ হয়েছে" }));
    throw new Error(err.error ?? "এক্সপোর্ট ব্যর্থ হয়েছে");
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
