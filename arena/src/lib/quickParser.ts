import { fromBanglaDigits } from "./bangla";

const QUESTION_LINE = /^\s*(?:[০-৯0-9]{1,3})\s*[.।)]\s*(.*)$/;
const OPTION_LINE = /^\s*[(（]?\s*(ক|খ|গ|ঘ|ঙ|চ)\s*[)．.।:]\s*(.*)$/;
const ANSWER_LINE = /^\s*(?:সঠিক\s*)?উত্তর\s*[:।\-–]?\s*(.*)$/;
const OPTION_LETTERS = ["ক", "খ", "গ", "ঘ", "ঙ", "চ"];

export type ParsedMcq = {
  text: string;
  options: string[];
  correctAnswer: string | null;
  marks: number;
};

export type ParsedShort = {
  text: string;
  marks: number;
};

function stripTrailingMarks(text: string, fallback: number): { text: string; marks: number } {
  let marks = fallback;
  const m = text.match(/[(（]\s*([০-৯0-9]{1,2})\s*[)）]\s*$/) ?? text.match(/[।.]?\s*([০-৯0-9]{1,2})\s*$/);
  if (m) {
    const numeric = parseInt(fromBanglaDigits(m[1]), 10);
    if (!Number.isNaN(numeric) && numeric > 0 && numeric <= 20) {
      marks = numeric;
      text = text.slice(0, m.index).trim();
    }
  }
  return { text: text.trim(), marks };
}

/** Parses a pasted block of numbered MCQs (with ক/খ/গ/ঘ options and an
 * optional "উত্তর:" line) into structured questions. Wrapped question text
 * that spans multiple lines before the first option is stitched together. */
export function parseMcqBulk(raw: string): ParsedMcq[] {
  const lines = raw.replace(/\r\n/g, "\n").split("\n");
  const result: ParsedMcq[] = [];
  let current: ParsedMcq | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const ansMatch = line.match(ANSWER_LINE);
    if (ansMatch && current) {
      const letter = ansMatch[1].trim().replace(/[।.)]/g, "");
      const idx = OPTION_LETTERS.indexOf(letter);
      current.correctAnswer = idx >= 0 && current.options[idx] ? current.options[idx] : ansMatch[1].trim() || null;
      continue;
    }

    const optMatch = line.match(OPTION_LINE);
    if (optMatch && current) {
      current.options.push(optMatch[2].trim());
      continue;
    }

    const qMatch = line.match(QUESTION_LINE);
    if (qMatch) {
      if (current) result.push(current);
      current = { text: qMatch[1].trim(), options: [], correctAnswer: null, marks: 1 };
      continue;
    }

    if (current && current.options.length === 0) {
      current.text = `${current.text} ${line}`.trim();
    }
  }
  if (current) result.push(current);
  return result.filter((q) => q.text);
}

/** Parses a pasted block where each numbered line is one short question,
 * with an optional trailing mark like "...লিখ। (৩)" or "...লিখ ৩". */
export function parseShortBulk(raw: string, defaultMarks = 2): ParsedShort[] {
  const lines = raw
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const result: ParsedShort[] = [];
  for (const line of lines) {
    const m = line.match(QUESTION_LINE);
    const raw2 = m ? m[1].trim() : line;
    const { text, marks } = stripTrailingMarks(raw2, defaultMarks);
    if (text) result.push({ text, marks });
  }
  return result;
}

/** Guesses whether a pasted block looks like MCQs (has ≥2 option-style lines)
 * or a plain list of short questions. */
export function detectQuickAddType(raw: string): "mcq" | "short" {
  const lines = raw.split(/\r?\n/);
  const optionLines = lines.filter((l) => OPTION_LINE.test(l.trim())).length;
  return optionLines >= 2 ? "mcq" : "short";
}
