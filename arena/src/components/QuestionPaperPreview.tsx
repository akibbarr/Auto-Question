"use client";

import { useMemo } from "react";
import Header from "./Header";
import Editable from "./Editable";
import FloatingFormatToolbar from "./FloatingFormatToolbar";
import { apiSend } from "@/lib/api";
import { banglaSerial, fromBanglaDigits, optionLabel, toBanglaNumber } from "@/lib/bangla";
import { getSectionText } from "@/lib/paperText";
import type { PaperCustomization, PaperHeaderData, Question, SectionSelection } from "@/lib/types";

const PAPER_WIDTH_PX: Record<PaperCustomization["paperSize"], number> = {
  A4: 794,
  Letter: 816,
  Legal: 816,
  A5: 559,
};

export default function QuestionPaperPreview({
  header,
  customization,
  sections,
  questionMap,
  onQuestionUpdated,
  onSectionTextChange,
  onHeaderChange,
}: {
  header: PaperHeaderData;
  customization: PaperCustomization;
  sections: SectionSelection[];
  questionMap: Map<number, Question>;
  onQuestionUpdated: (q: Question) => void;
  /** Called when the user edits a section's heading or "১০ × ২ = ২০" style marks preset inline. */
  onSectionTextChange?: (type: SectionSelection["type"], patch: { titleOverride?: string; marksLineOverride?: string }) => void;
  /** Called when the user edits a header field (school name, exam name, time, etc.) inline. */
  onHeaderChange?: (patch: Partial<PaperHeaderData>) => void;
}) {
  const alignClass =
    customization.textAlign === "left"
      ? "text-left"
      : customization.textAlign === "right"
        ? "text-right"
        : customization.textAlign === "justify"
          ? "text-justify"
          : "text-center";

  const containerStyle = useMemo(
    () => ({
      fontFamily: customization.fontFamily,
      fontSize: `${customization.fontSize}px`,
      maxWidth: PAPER_WIDTH_PX[customization.paperSize],
      columnCount: customization.columns,
      columnGap: `${customization.columnGap}px`,
      columnRule: customization.columnDivider ? "1px solid #94a3b8" : "none",
    }),
    [customization],
  );

  async function saveField(id: number, patch: Partial<Question>) {
    const updated = await apiSend<Question>(`/api/questions/${id}`, "PATCH", patch);
    onQuestionUpdated(updated);
  }

  return (
    <div
      className="print-area relative mx-auto overflow-hidden rounded-xl border border-slate-300 bg-white p-8 shadow-inner"
      style={{ maxWidth: PAPER_WIDTH_PX[customization.paperSize] }}
    >
      {customization.editingMode && <FloatingFormatToolbar />}
      {header.fields.watermark && header.watermarkText && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
          <span className="rotate-[-30deg] text-6xl font-black text-slate-200 opacity-40">{header.watermarkText}</span>
        </div>
      )}

      <div className="relative">
        <Header header={header} textAlign={customization.textAlign} editable={customization.editingMode} onChange={onHeaderChange} />

        <div style={containerStyle}>
          {sections.map((section) => {
            const sectionQuestions = section.questionIds
              .map((id) => questionMap.get(id))
              .filter((q): q is Question => Boolean(q));
            if (sectionQuestions.length === 0) return null;

            const { title, marksLine } = getSectionText(section, sectionQuestions);

            return (
              <div key={section.type} className="mb-4 break-inside-avoid-column">
                <div className="mb-2 flex items-baseline justify-between gap-3 font-bold">
                  <Editable
                    editable={customization.editingMode}
                    value={title}
                    className="underline decoration-2 underline-offset-2"
                    onSave={(v) => onSectionTextChange?.(section.type, { titleOverride: v })}
                  />
                  <Editable
                    editable={customization.editingMode}
                    value={marksLine}
                    className="shrink-0"
                    onSave={(v) => onSectionTextChange?.(section.type, { marksLineOverride: v })}
                  />
                </div>

                {sectionQuestions.map((q, index) => (
                  <div
                    key={q.id}
                    className={`break-inside-avoid-column ${alignClass}`}
                    style={{ marginBottom: `${customization.questionGap}px` }}
                  >
                    {q.type === "creative" ? (
                      <>
                        <p>
                          <b>{banglaSerial(index + 1)}.</b>{" "}
                          <Editable
                            editable={customization.editingMode}
                            value={q.text}
                            onSave={(v) => saveField(q.id, { text: v })}
                          />
                        </p>
                        {q.imageUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={q.imageUrl} alt="" className="my-1 max-h-40" />
                        )}
                        {(q.subQuestions ?? []).map((sub, si) => (
                          <p key={si} className="ml-6 flex justify-between gap-3">
                            <span>
                              <b>{sub.label}.</b>{" "}
                              <Editable
                                editable={customization.editingMode}
                                value={sub.text}
                                onSave={(v) => {
                                  const subQuestions = (q.subQuestions ?? []).map((s, i) =>
                                    i === si ? { ...s, text: v } : s,
                                  );
                                  saveField(q.id, { subQuestions });
                                }}
                              />
                            </span>
                            <Editable
                              editable={customization.editingMode}
                              value={toBanglaNumber(sub.marks)}
                              className="shrink-0"
                              onSave={(v) => {
                                const marks = parseInt(fromBanglaDigits(v), 10);
                                if (Number.isNaN(marks)) return;
                                const subQuestions = (q.subQuestions ?? []).map((s, i) => (i === si ? { ...s, marks } : s));
                                saveField(q.id, { subQuestions });
                              }}
                            />
                          </p>
                        ))}
                      </>
                    ) : q.type === "mcq" ? (
                      <>
                        <p className="flex justify-between gap-3">
                          <span>
                            <b>{banglaSerial(index + 1)}.</b>{" "}
                            <Editable
                              editable={customization.editingMode}
                              value={q.text}
                              onSave={(v) => saveField(q.id, { text: v })}
                            />
                          </span>
                          <Editable
                            editable={customization.editingMode}
                            value={toBanglaNumber(q.marks)}
                            className="shrink-0"
                            onSave={(v) => {
                              const marks = parseInt(fromBanglaDigits(v), 10);
                              if (!Number.isNaN(marks)) saveField(q.id, { marks });
                            }}
                          />
                        </p>
                        {q.imageUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={q.imageUrl} alt="" className="my-1 max-h-40" />
                        )}
                        <div className="ml-6 grid grid-cols-2 gap-x-3">
                          {(q.options ?? []).map((opt, oi) => (
                            <span key={oi}>
                              {optionLabel(oi, customization.optionStyle)}{" "}
                              <Editable
                                editable={customization.editingMode}
                                value={opt}
                                onSave={(v) => {
                                  const options = (q.options ?? []).map((o, i) => (i === oi ? v : o));
                                  saveField(q.id, { options });
                                }}
                              />
                            </span>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p className="flex justify-between gap-3">
                        <span>
                          <b>{banglaSerial(index + 1)}.</b>{" "}
                          <Editable
                            editable={customization.editingMode}
                            value={q.text}
                            onSave={(v) => saveField(q.id, { text: v })}
                          />
                        </span>
                        <Editable
                          editable={customization.editingMode}
                          value={toBanglaNumber(q.marks)}
                          className="shrink-0"
                          onSave={(v) => {
                            const marks = parseInt(fromBanglaDigits(v), 10);
                            if (!Number.isNaN(marks)) saveField(q.id, { marks });
                          }}
                        />
                      </p>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {(header.fields.footer && (header.footerText || customization.editingMode)) && (
          <Editable
            as="div"
            editable={customization.editingMode}
            value={header.footerText}
            placeholder="ফুটার লেখা"
            className="mt-4 text-center text-xs italic text-slate-500"
            onSave={(v) => onHeaderChange?.({ footerText: v })}
          />
        )}
      </div>
    </div>
  );
}
