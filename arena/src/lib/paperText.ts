import { toBanglaNumber } from "./bangla";
import type { Question, SectionSelection } from "./types";

/**
 * Builds the auto-generated section heading + marks preset (e.g. "১০ × ২ = ২০").
 * If the user has typed a manual override (titleOverride / marksLineOverride),
 * that text wins instead — this is what powers the editable preset fields on
 * the paper builder page.
 */
export function getSectionText(
  section: Pick<SectionSelection, "type" | "answerCount" | "marksEach" | "titleOverride" | "marksLineOverride">,
  sectionQuestions: Pick<Question, "marks">[],
): { title: string; marksLine: string } {
  let title = "";
  let marksLine = "";

  if (section.type === "short") {
    const marksEach = section.marksEach ?? sectionQuestions[0]?.marks ?? 2;
    title = `সংক্ষিপ্ত প্রশ্ন গুলোর উত্তর লিখ: (যেকোনো ${toBanglaNumber(section.answerCount)} টি)`;
    marksLine = `${toBanglaNumber(section.answerCount)} × ${toBanglaNumber(marksEach)} = ${toBanglaNumber(section.answerCount * marksEach)}`;
  } else if (section.type === "creative") {
    title = `সৃজনশীল অংশ: (যেকোনো ${toBanglaNumber(section.answerCount)} টি)`;
    marksLine = `${toBanglaNumber(section.answerCount)} × ১০ = ${toBanglaNumber(section.answerCount * 10)}`;
  } else {
    const total = sectionQuestions.reduce((s, q) => s + (q.marks || 1), 0);
    title = `বহুনির্বাচনি প্রশ্ন`;
    marksLine = `মোট মান = ${toBanglaNumber(total)}`;
  }

  return {
    title: section.titleOverride?.trim() ? section.titleOverride : title,
    marksLine: section.marksLineOverride?.trim() ? section.marksLineOverride : marksLine,
  };
}
