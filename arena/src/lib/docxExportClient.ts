import type { ExportPayload } from "./types";

/** Sends the paper payload to the server, which builds a .docx (with Kalpurush font
 * embedded) and streams it back; then triggers a browser download. */
export async function exportQuestionPaperDocx(payload: ExportPayload, fileName = "প্রশ্নপত্র.docx"): Promise<void> {
  const res = await fetch("/api/export/docx", {
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
