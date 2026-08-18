import { fromBanglaDigits } from "./bangla";

export type ParsedSubQuestion = {
  label: string;
  text: string;
  marks: number;
};

export type ParsedCreativeQuestion = {
  stimulus: string;
  subQuestions: ParsedSubQuestion[];
  raw: string;
};

const SUB_LABELS = ["ক", "খ", "গ", "ঘ"];
const DEFAULT_MARKS = [1, 2, 3, 4];

/**
 * Splits a bulk-pasted block of text into individual creative-question blocks
 * using "প্রশ্ন ০১:" / "প্রশ্ন ২." / "প্রশ্ন-৩" style markers. If no markers are
 * found the whole text is treated as a single question.
 */
export function splitQuestionBlocks(raw: string): string[] {
  const text = raw.replace(/\r\n/g, "\n").trim();
  if (!text) return [];

  const markerRegex = /প্রশ্ন\s*[:\-–]?\s*[০-৯0-9]+\s*[:।.\-–]?/g;
  const matches = [...text.matchAll(markerRegex)];

  if (matches.length === 0) {
    return [text];
  }

  const blocks: string[] = [];
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const start = (m.index ?? 0) + m[0].length;
    const end = i + 1 < matches.length ? matches[i + 1].index ?? text.length : text.length;
    const block = text.slice(start, end).trim();
    if (block) blocks.push(block);
  }
  return blocks;
}

/** Parses a single creative-question block into a stimulus + ক/খ/গ/ঘ sub-questions. */
export function parseSingleCreative(block: string): ParsedCreativeQuestion {
  const cleaned = block.trim();

  // Matches "ক." "খ)" "(গ)" "ঘ:" style sub-question markers. A lookbehind requires the
  // marker to start at the beginning of the text or right after whitespace/punctuation,
  // so that a "ক"/"খ"/"গ"/"ঘ" appearing mid-word (e.g. "কৃষক।") is never mistaken for a marker.
  const markerRegex = /(?<=^|[\s।,;:\-])(?:\(\s*(ক|খ|গ|ঘ)\s*\)|(ক|খ|গ|ঘ)\s*[.।:)])/g;
  const matches = [...cleaned.matchAll(markerRegex)];

  if (matches.length === 0) {
    return { stimulus: cleaned, subQuestions: [], raw: block };
  }

  const stimulus = cleaned.slice(0, matches[0].index ?? 0).trim();
  const subQuestions: ParsedSubQuestion[] = [];

  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    const label = m[1] || m[2];
    const contentStart = (m.index ?? 0) + m[0].length;
    const contentEnd = i + 1 < matches.length ? matches[i + 1].index ?? cleaned.length : cleaned.length;
    let content = cleaned.slice(contentStart, contentEnd).trim();

    const labelIndex = SUB_LABELS.indexOf(label);
    let marks = DEFAULT_MARKS[labelIndex] ?? 1;

    // Try to detect an explicit trailing mark, e.g. "...ব্যাখ্যা কর। (৪)" or "...কর ৪"
    const marksMatch = content.match(/[(（]\s*([০-৯0-9]{1,2})\s*[)）]\s*$/) ?? content.match(/([০-৯0-9]{1,2})\s*$/);
    if (marksMatch) {
      const numeric = parseInt(fromBanglaDigits(marksMatch[1]), 10);
      if (!Number.isNaN(numeric) && numeric > 0 && numeric <= 20) {
        marks = numeric;
        content = content.slice(0, marksMatch.index).trim();
      }
    }

    subQuestions.push({ label, text: content, marks });
  }

  return { stimulus, subQuestions, raw: block };
}

export function parseCreativeBulk(raw: string): ParsedCreativeQuestion[] {
  return splitQuestionBlocks(raw).map(parseSingleCreative);
}
