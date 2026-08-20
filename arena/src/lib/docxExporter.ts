import fs from "fs";
import path from "path";
import { imageSize } from "image-size";
import {
  AlignmentType,
  Document,
  Footer,
  HeadingLevel,
  ImageRun,
  Packer,
  PageNumber,
  Paragraph,
  SectionType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  BorderStyle,
} from "docx";
import type { ExportPayload, Question } from "./types";
import { banglaSerial, optionLabel, toBanglaNumber } from "./bangla";
import { getSectionText } from "./paperText";
import { htmlToRuns } from "./htmlRuns";

const ALIGN_MAP = {
  left: AlignmentType.LEFT,
  center: AlignmentType.CENTER,
  right: AlignmentType.RIGHT,
  justify: AlignmentType.JUSTIFIED,
} as const;

function readFontBuffer(): Buffer | null {
  try {
    const fontPath = path.join(process.cwd(), "src", "assets", "fonts", "Kalpurush.ttf");
    return fs.readFileSync(fontPath);
  } catch {
    return null;
  }
}

function resolveUploadedImage(imageUrl: string): Buffer | null {
  try {
    if (imageUrl.startsWith("/uploads/")) {
      const filePath = path.join(process.cwd(), "public", imageUrl);
      return fs.readFileSync(filePath);
    }
    if (imageUrl.startsWith("/")) {
      const filePath = path.join(process.cwd(), "public", imageUrl);
      return fs.readFileSync(filePath);
    }
  } catch {
    return null;
  }
  return null;
}

function buildImageRun(imageUrl: string | null | undefined): Paragraph | null {
  if (!imageUrl) return null;
  const buffer = resolveUploadedImage(imageUrl);
  if (!buffer) return null;
  try {
    const dimensions = imageSize(buffer);
    const maxWidth = 360;
    const ratio = dimensions.height && dimensions.width ? dimensions.height / dimensions.width : 0.6;
    const width = Math.min(maxWidth, dimensions.width || maxWidth);
    const height = Math.round(width * ratio);
    const ext = (dimensions.type ?? "png") as "png" | "jpg" | "gif" | "bmp";
    return new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 100, after: 100 },
      children: [
        new ImageRun({
          data: buffer,
          type: ext === "jpg" ? "jpg" : ext === "gif" ? "gif" : ext === "bmp" ? "bmp" : "png",
          transformation: { width, height },
        }),
      ],
    });
  } catch {
    return null;
  }
}

export async function generateQuestionPaperDocx(payload: ExportPayload): Promise<Buffer> {
  const { header, customization, sections, questions } = payload;
  const questionMap = new Map<number, Question>(questions.map((q) => [q.id, q]));
  const fontFamily = customization.fontFamily;
  const fontSizeHalfPoints = customization.fontSize * 2; // docx uses half-points
  const align = ALIGN_MAP[customization.textAlign];

  const fontBuffer = fontFamily === "Kalpurush" ? readFontBuffer() : null;

  const paperSizeMap: Record<string, { width: number; height: number }> = {
    A4: { width: 11906, height: 16838 },
    Letter: { width: 12240, height: 15840 },
    Legal: { width: 12240, height: 20160 },
    A5: { width: 8391, height: 11906 },
  };
  const size = paperSizeMap[customization.paperSize] ?? paperSizeMap.A4;
  const usableWidth = size.width - 1440; // minus 720 twip margins on each side
  const centerTab = Math.round(usableWidth / 2);
  const rightTab = usableWidth;

  const baseRun = { font: fontFamily, size: fontSizeHalfPoints };

  /** Converts a (possibly rich-text) field into TextRuns, applying `extra` as
   * the default style — detected <b>/<i>/<u>/font-size tags layer on top. */
  function runsFor(html: string, extra: { bold?: boolean; italics?: boolean; underline?: boolean; size?: number } = {}): TextRun[] {
    const parsed = htmlToRuns(html);
    if (parsed.length === 0) return [];
    return parsed.map(
      (r) =>
        new TextRun({
          font: fontFamily,
          size: r.sizeHalfPt ?? extra.size ?? fontSizeHalfPoints,
          bold: extra.bold || r.bold || undefined,
          italics: extra.italics || r.italics || undefined,
          underline: extra.underline || r.underline ? {} : undefined,
          text: r.text,
        }),
    );
  }

  /** Mirrors the on-screen HeaderRow: left-aligned / truly centered / right-aligned
   * text on one line, using two tab stops (like real exam papers made in Word). */
  function threeSlotParagraph(left: string, center: string, right: string, bold = true) {
    if (!left && !center && !right) return null;
    return new Paragraph({
      tabStops: [
        { type: "center", position: centerTab },
        { type: "right", position: rightTab },
      ],
      spacing: { before: 60, after: 60 },
      children: [
        ...runsFor(left, { bold }),
        new TextRun({ ...baseRun, text: "\t" }),
        ...runsFor(center, { bold }),
        new TextRun({ ...baseRun, text: "\t" }),
        ...runsFor(right, {}),
      ],
    });
  }

  const headerChildren: Paragraph[] = [];

  if (header.fields.schoolName && header.schoolName) {
    headerChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: runsFor(header.schoolName, { bold: true, size: fontSizeHalfPoints + 8 }),
      }),
    );
  }
  if (header.fields.address && header.address) {
    headerChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: runsFor(header.address, { size: fontSizeHalfPoints - 2 }),
      }),
    );
  }

  const examLine = threeSlotParagraph(
    "",
    header.fields.examName && header.examName ? header.examName : "",
    header.fields.setCode && header.setCode ? `সেট কোড: ${header.setCode}` : "",
  );
  if (examLine) headerChildren.push(examLine);

  const classLine = threeSlotParagraph(
    "",
    header.fields.className && header.className ? header.className : "",
    header.fields.subjectCode && header.subjectCode ? `বিষয় কোড: ${header.subjectCode}` : "",
  );
  if (classLine) headerChildren.push(classLine);

  if (header.fields.subjectName && header.subjectName) {
    headerChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: runsFor(header.subjectName, { bold: true, size: fontSizeHalfPoints + 4 }),
      }),
    );
  }

  if (header.fields.chapterName && header.chapterName) {
    headerChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: runsFor(header.chapterName, { italics: true }),
      }),
    );
  }

  const marksLine2 = threeSlotParagraph(
    `সময়— ${header.duration}`,
    header.fields.obtainedMarksBox ? "প্রাপ্ত নম্বর: ______" : "",
    `পূর্ণমান— ${header.fullMarks}`,
  );
  if (marksLine2) headerChildren.push(marksLine2);

  if (header.fields.instructions && header.instructions) {
    headerChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        border: {
          top: { style: BorderStyle.SINGLE, size: 4, color: "999999" },
          bottom: { style: BorderStyle.SINGLE, size: 4, color: "999999" },
        },
        spacing: { before: 60, after: 120 },
        children: runsFor(header.instructions, { italics: true, size: fontSizeHalfPoints - 2 }),
      }),
    );
  }

  const bodyChildren: (Paragraph | Table)[] = [];

  for (const section of sections) {
    const sectionQuestions = section.questionIds
      .map((id) => questionMap.get(id))
      .filter((q): q is Question => Boolean(q));
    if (sectionQuestions.length === 0) continue;

    const { title: sectionTitle, marksLine } = getSectionText(section, sectionQuestions);

    bodyChildren.push(
      new Paragraph({
        spacing: { before: 240, after: 80 },
        tabStops: [{ type: "right", position: rightTab }],
        children: [
          ...runsFor(sectionTitle, { bold: true, underline: true }),
          new TextRun({ ...baseRun, text: "\t" }),
          ...runsFor(marksLine, { bold: true }),
        ],
      }),
    );

    sectionQuestions.forEach((q, index) => {
      const serial = banglaSerial(index + 1, 2);

      if (q.type === "creative") {
        bodyChildren.push(
          new Paragraph({
            alignment: align,
            spacing: { after: customization.questionGap },
            children: [new TextRun({ ...baseRun, text: `${serial}. `, bold: true }), ...runsFor(q.text)],
          }),
        );
        const img = buildImageRun(q.imageUrl);
        if (img) bodyChildren.push(img);

        (q.subQuestions ?? []).forEach((sub) => {
          bodyChildren.push(
            new Paragraph({
              alignment: align,
              indent: { left: 360 },
              spacing: { after: 60 },
              tabStops: [{ type: "right", position: rightTab }],
              children: [
                new TextRun({ ...baseRun, text: `${sub.label}. ` }),
                ...runsFor(sub.text),
                new TextRun({ ...baseRun, text: `\t${toBanglaNumber(sub.marks)}` }),
              ],
            }),
          );
        });
      } else if (q.type === "mcq") {
        bodyChildren.push(
          new Paragraph({
            alignment: align,
            spacing: { after: 40 },
            tabStops: [{ type: "right", position: rightTab }],
            children: [
              new TextRun({ ...baseRun, text: `${serial}. ` }),
              ...runsFor(q.text),
              new TextRun({ ...baseRun, text: `\t${toBanglaNumber(q.marks)}` }),
            ],
          }),
        );
        const img = buildImageRun(q.imageUrl);
        if (img) bodyChildren.push(img);
        (q.options ?? []).forEach((opt, optIndex) => {
          bodyChildren.push(
            new Paragraph({
              alignment: align,
              indent: { left: 360 },
              spacing: { after: customization.questionGap },
              children: [
                new TextRun({ ...baseRun, text: `${optionLabel(optIndex, customization.optionStyle)} ` }),
                ...runsFor(opt),
              ],
            }),
          );
        });
      } else {
        bodyChildren.push(
          new Paragraph({
            alignment: align,
            spacing: { after: customization.questionGap },
            tabStops: [{ type: "right", position: rightTab }],
            children: [
              new TextRun({ ...baseRun, text: `${serial}. ` }),
              ...runsFor(q.text),
              new TextRun({ ...baseRun, text: `\t${toBanglaNumber(q.marks)}` }),
            ],
          }),
        );
        const img = buildImageRun(q.imageUrl);
        if (img) bodyChildren.push(img);
      }
    });
  }

  if (header.fields.footer && header.footerText) {
    bodyChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 240 },
        children: runsFor(header.footerText, { italics: true, size: fontSizeHalfPoints - 2 }),
      }),
    );
  }

  const doc = new Document({
    fonts: fontBuffer ? [{ name: "Kalpurush", data: fontBuffer }] : undefined,
    styles: {
      default: {
        document: { run: { font: fontFamily, size: fontSizeHalfPoints } },
      },
    },
    sections: [
      {
        properties: {
          type: SectionType.CONTINUOUS,
          page: {
            size: { width: size.width, height: size.height },
            margin: { top: 720, bottom: 720, left: 720, right: 720 },
          },
          column: {
            count: customization.columns,
            space: customization.columnGap * 20,
            separate: customization.columnDivider,
          },
        },
        headers: undefined,
        footers: customization.showPageNumber
          ? {
              default: new Footer({
                children: [
                  new Paragraph({
                    alignment: AlignmentType.CENTER,
                    children: [
                      new TextRun({ ...baseRun, children: [PageNumber.CURRENT] }),
                    ],
                  }),
                ],
              }),
            }
          : undefined,
        children: [...headerChildren, ...bodyChildren],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return buffer;
}

// Re-export unused imports guard (Table/TableRow/TableCell/WidthType/HeadingLevel kept
// available for future header layout table if needed).
export const _unused = { Table, TableRow, TableCell, WidthType, HeadingLevel };
