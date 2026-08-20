export type RichRun = {
  text: string;
  bold?: boolean;
  italics?: boolean;
  underline?: boolean;
  sizeHalfPt?: number;
};

const ENTITY_MAP: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', "#39": "'", nbsp: " " };

function decodeEntities(s: string): string {
  return s.replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (_, k) => ENTITY_MAP[k] ?? "");
}

/**
 * Turns the small rich-text subset produced by the in-app formatting toolbar
 * (<b>/<strong>, <i>/<em>, <u>, <span style="font-size:Npx">) into a flat list
 * of styled runs. Pure string parsing — no DOM — so it works both in the
 * browser (preview) and on the server (docx export, which has no DOM at all).
 * Anything else that looks like a stray "<"/"&" is left as plain text.
 */
export function htmlToRuns(html: string): RichRun[] {
  if (!html) return [];
  if (!/[<&]/.test(html)) return [{ text: html }];

  type Style = { bold?: boolean; italics?: boolean; underline?: boolean; sizeHalfPt?: number };
  const runs: RichRun[] = [];
  const stack: Style[] = [{}];
  const tagRe = /<(\/?)(b|strong|i|em|u|span)\b([^>]*)>/gi;
  let lastIndex = 0;
  let m: RegExpExecArray | null;

  const flush = (text: string) => {
    const decoded = decodeEntities(text);
    if (!decoded) return;
    runs.push({ text: decoded, ...stack[stack.length - 1] });
  };

  while ((m = tagRe.exec(html))) {
    flush(html.slice(lastIndex, m.index));
    lastIndex = tagRe.lastIndex;
    const closing = m[1] === "/";
    const tag = m[2].toLowerCase();
    const attrs = m[3] || "";
    if (closing) {
      if (stack.length > 1) stack.pop();
      continue;
    }
    const next: Style = { ...stack[stack.length - 1] };
    if (tag === "b" || tag === "strong") next.bold = true;
    if (tag === "i" || tag === "em") next.italics = true;
    if (tag === "u") next.underline = true;
    if (tag === "span") {
      const sizeMatch = attrs.match(/font-size:\s*([\d.]+)px/);
      if (sizeMatch) next.sizeHalfPt = Math.round(parseFloat(sizeMatch[1]) * 2);
    }
    stack.push(next);
  }
  flush(html.slice(lastIndex));
  return runs.length ? runs : [{ text: decodeEntities(html.replace(/<[^>]*>/g, "")) }];
}

/** Plain-text version, for list previews / duplicate detection / search. */
export function htmlToPlainText(html: string | null | undefined): string {
  if (!html) return "";
  return decodeEntities(html.replace(/<[^>]*>/g, "")).replace(/\s+/g, " ").trim();
}
