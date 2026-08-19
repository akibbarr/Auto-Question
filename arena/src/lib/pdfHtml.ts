import type { ExportPayload, Question } from "./types";
import { banglaSerial, optionLabel, toBanglaNumber } from "./bangla";
import { getSectionText } from "./paperText";

const PAPER_SIZE_MM: Record<string, { width: number; height: number }> = {
  A4: { width: 210, height: 297 },
  Letter: { width: 215.9, height: 279.4 },
  Legal: { width: 215.9, height: 355.6 },
  A5: { width: 148, height: 210 },
};

function esc(input: string | null | undefined): string {
  if (!input) return "";
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function resolveUrl(url: string | null | undefined, baseUrl: string): string | null {
  if (!url) return null;
  if (/^https?:\/\//i.test(url)) return url;
  return `${baseUrl}${url.startsWith("/") ? "" : "/"}${url}`;
}

/**
 * Renders the question paper as a single, print-ready HTML document.
 * Used by the /api/export/pdf route (via headless Chromium) so that PDFs
 * match the on-screen preview and .docx export pixel-for-pixel: A4 by
 * default, and it naturally flows onto a 2nd (or 3rd...) page whenever the
 * selected questions don't fit on one page.
 */
export function buildPaperHtml(payload: ExportPayload, baseUrl: string): string {
  const { header, customization, sections, questions } = payload;
  const questionMap = new Map<number, Question>(questions.map((q) => [q.id, q]));
  const size = PAPER_SIZE_MM[customization.paperSize] ?? PAPER_SIZE_MM.A4;

  const alignClass =
    customization.textAlign === "left"
      ? "left"
      : customization.textAlign === "right"
        ? "right"
        : customization.textAlign === "justify"
          ? "justify"
          : "center";

  const logoUrl = resolveUrl(header.logoUrl, baseUrl);

  const headerHtml = `
    <div class="paper-header">
      <div class="header-top">
        ${header.fields.logo && logoUrl ? `<img class="logo" src="${esc(logoUrl)}" alt="logo" />` : ""}
        <div>
          ${header.fields.schoolName && header.schoolName ? `<h1>${esc(header.schoolName)}</h1>` : ""}
          ${header.fields.address && header.address ? `<p class="address">${esc(header.address)}</p>` : ""}
        </div>
      </div>
      ${
        (header.fields.examName && header.examName) || (header.fields.setCode && header.setCode)
          ? `<div class="row"><span class="bold">${esc(header.fields.examName ? header.examName : "")}</span><span>${
              header.fields.setCode && header.setCode ? `সেট কোড: ${esc(header.setCode)}` : ""
            }</span></div>`
          : ""
      }
      ${
        (header.fields.className && header.className) || (header.fields.subjectCode && header.subjectCode)
          ? `<div class="row"><span class="bold">${esc(header.fields.className ? header.className : "")}</span><span>${
              header.fields.subjectCode && header.subjectCode ? `বিষয় কোড: ${esc(header.subjectCode)}` : ""
            }</span></div>`
          : ""
      }
      ${header.fields.subjectName && header.subjectName ? `<p class="subject">${esc(header.subjectName)}</p>` : ""}
      ${header.fields.chapterName && header.chapterName ? `<p class="chapter">${esc(header.chapterName)}</p>` : ""}
      <div class="row bold">
        <span>সময়— ${esc(header.duration)}</span>
        ${header.fields.obtainedMarksBox ? `<span>প্রাপ্ত নম্বর: ______</span>` : ""}
        <span>পূর্ণমান— ${esc(header.fullMarks)}</span>
      </div>
      ${
        header.fields.instructions && header.instructions
          ? `<p class="instructions">${esc(header.instructions)}</p>`
          : ""
      }
    </div>
  `;

  const sectionsHtml = sections
    .map((section) => {
      const sectionQuestions = section.questionIds
        .map((id) => questionMap.get(id))
        .filter((q): q is Question => Boolean(q));
      if (sectionQuestions.length === 0) return "";

      const { title, marksLine } = getSectionText(section, sectionQuestions);

      const questionsHtml = sectionQuestions
        .map((q, index) => {
          const serial = banglaSerial(index + 1);
          const img = resolveUrl(q.imageUrl, baseUrl);
          const imgHtml = img ? `<img class="q-img" src="${esc(img)}" alt="" />` : "";

          if (q.type === "creative") {
            const subsHtml = (q.subQuestions ?? [])
              .map(
                (sub) =>
                  `<p class="sub-row"><span><b>${esc(sub.label)}.</b> ${esc(sub.text)}</span><span class="marks">${toBanglaNumber(sub.marks)}</span></p>`,
              )
              .join("");
            return `<div class="question avoid-break ${alignClass}">
              <p><b>${serial}.</b> ${esc(q.text)}</p>
              ${imgHtml}
              ${subsHtml}
            </div>`;
          }

          if (q.type === "mcq") {
            const optionsHtml = (q.options ?? [])
              .map((opt, oi) => `<span class="option">${esc(optionLabel(oi, customization.optionStyle))} ${esc(opt)}</span>`)
              .join("");
            return `<div class="question avoid-break ${alignClass}">
              <p class="q-row"><span><b>${serial}.</b> ${esc(q.text)}</span><span class="marks">${toBanglaNumber(q.marks)}</span></p>
              ${imgHtml}
              <div class="options-grid">${optionsHtml}</div>
            </div>`;
          }

          return `<div class="question avoid-break ${alignClass}">
            <p class="q-row"><span><b>${serial}.</b> ${esc(q.text)}</span><span class="marks">${toBanglaNumber(q.marks)}</span></p>
            ${imgHtml}
          </div>`;
        })
        .join("");

      return `<div class="section avoid-break">
        <p class="section-title"><span class="underline">${esc(title)}</span> <span class="marks-line">${esc(marksLine)}</span></p>
        ${questionsHtml}
      </div>`;
    })
    .join("");

  const footerHtml =
    header.fields.footer && header.footerText ? `<p class="footer-text">${esc(header.footerText)}</p>` : "";

  const watermarkHtml =
    header.fields.watermark && header.watermarkText
      ? `<div class="watermark"><span>${esc(header.watermarkText)}</span></div>`
      : "";

  return `<!DOCTYPE html>
<html lang="bn">
<head>
<meta charset="utf-8" />
<style>
  @font-face {
    font-family: "Kalpurush";
    src: url("${baseUrl}/fonts/Kalpurush.ttf") format("truetype");
    font-display: swap;
  }
  @font-face {
    font-family: "SolaimanLipi";
    src: url("${baseUrl}/fonts/SolaimanLipi.ttf") format("truetype");
    font-display: swap;
  }
  @font-face {
    font-family: "Nikosh";
    src: url("${baseUrl}/fonts/Nikosh.ttf") format("truetype");
    font-display: swap;
  }
  @font-face {
    font-family: "Siyam Rupali";
    src: url("${baseUrl}/fonts/SiyamRupali.ttf") format("truetype");
    font-display: swap;
  }
  @page {
    size: ${size.width}mm ${size.height}mm;
    margin: 12mm;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: "${customization.fontFamily}", "Noto Sans Bengali", sans-serif;
    font-size: ${customization.fontSize}px;
    color: #0f172a;
  }
  .avoid-break { break-inside: avoid; page-break-inside: avoid; }
  .paper-header { border-bottom: 2px solid #1e293b; padding-bottom: 10px; margin-bottom: 14px; text-align: center; }
  .header-top { display: flex; align-items: center; justify-content: center; gap: 10px; }
  .logo { height: 52px; width: 52px; object-fit: contain; }
  .paper-header h1 { font-size: 1.5em; font-weight: 800; margin: 0; }
  .address { font-size: 0.75em; color: #475569; margin: 2px 0; }
  .row { display: flex; align-items: center; justify-content: space-between; font-size: 0.9em; margin-top: 4px; }
  .row.bold { font-weight: 700; }
  .bold { font-weight: 700; }
  .subject { font-size: 1.15em; font-weight: 700; margin: 4px 0; }
  .chapter { font-size: 0.85em; font-style: italic; color: #475569; margin: 0; }
  .instructions {
    margin-top: 8px; padding: 4px 0; border-top: 1px dashed #94a3b8; border-bottom: 1px dashed #94a3b8;
    font-size: 0.78em; font-style: italic; text-align: ${alignClass};
  }
  .section { margin-bottom: 16px; }
  .section-title { font-weight: 700; margin-bottom: 8px; }
  .section-title .underline { text-decoration: underline; text-underline-offset: 2px; }
  .section-title .marks-line { margin-left: 12px; }
  .question { margin-bottom: ${customization.questionGap}px; text-align: ${alignClass}; }
  .question.left { text-align: left; }
  .question.right { text-align: right; }
  .question.center { text-align: center; }
  .question.justify { text-align: justify; }
  .q-row { display: flex; justify-content: space-between; gap: 12px; margin: 0; }
  .sub-row { display: flex; justify-content: space-between; gap: 12px; margin: 4px 0 0 24px; }
  .marks { flex-shrink: 0; }
  .q-img { max-height: 160px; margin: 4px 0; display: block; }
  .options-grid { margin-left: 24px; display: grid; grid-template-columns: 1fr 1fr; gap: 0 12px; }
  .footer-text { text-align: center; font-size: 0.78em; font-style: italic; color: #64748b; margin-top: 16px; }
  .watermark {
    position: fixed; inset: 0; display: flex; align-items: center; justify-content: center;
    pointer-events: none; z-index: -1;
  }
  .watermark span { transform: rotate(-30deg); font-size: 4em; font-weight: 900; color: #e2e8f0; }
  .content {
    column-count: ${customization.columns};
    column-gap: ${customization.columnGap}px;
    ${customization.columnDivider ? "column-rule: 1px solid #94a3b8;" : ""}
  }
</style>
</head>
<body>
  ${watermarkHtml}
  ${headerHtml}
  <div class="content">
    ${sectionsHtml}
  </div>
  ${footerHtml}
</body>
</html>`;
}
