"use client";

import { useMemo } from "react";
import Header from "./Header";
import { apiSend } from "@/lib/api";
import { banglaSerial, optionLabel, toBanglaNumber } from "@/lib/bangla";
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
}: {
  header: PaperHeaderData;
  customization: PaperCustomization;
  sections: SectionSelection[];
  questionMap: Map<number, Question>;
  onQuestionUpdated: (q: Question) => void;
  /** Called when the user edits a section's heading or "১০ × ২ = ২০" style marks preset inline. */
  onSectionTextChange?: (type: SectionSelection["type"], patch: { titleOverride?: string; marksLineOverride?: string }) => void;
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
    <div className="relative mx-auto overflow-hidden rounded-xl border border-slate-300 bg-white p-8 shadow-inner" style={{ maxWidth: PAPER_WIDTH_PX[customization.paperSize] }}>
      {header.fields.watermark && header.watermarkText && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
          <span className="rotate-[-30deg] text-6xl font-black text-slate-200 opacity-40">{header.watermarkText}</span>
        </div>
      )}

      <div className="relative">
        <Header header={header} textAlign={customization.textAlign} />

        <div style={containerStyle}>
          {sections.map((section) => {
            const sectionQuestions = section.questionIds
              .map((id) => questionMap.get(id))
              .filter((q): q is Question => Boolean(q));
            if (sectionQuestions.length === 0) return null;

            const { title, marksLine } = getSectionText(section, sectionQuestions);

            return (
              <div key={section.type} className="mb-4 break-inside-avoid-column">
                <p className="mb-2 font-bold underline decoration-2 underline-offset-2">
                  <Editable
                    editable={customization.editingMode}
                    value={title}
                    onSave={(v) => onSectionTextChange?.(section.type, { titleOverride: v })}
                  />{" "}
                  <span className="ml-3 no-underline">
                    <Editable
                      editable={customization.editingMode}
                      value={marksLine}
                      onSave={(v) => onSectionTextChange?.(section.type, { marksLineOverride: v })}
                    />
                  </span>
                </p>

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
                            <span className="shrink-0">{toBanglaNumber(sub.marks)}</span>
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
                          <span className="shrink-0">{toBanglaNumber(q.marks)}</span>
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
                        <span className="shrink-0">{toBanglaNumber(q.marks)}</span>
                      </p>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {header.fields.footer && header.footerText && (
          <p className="mt-4 text-center text-xs italic text-slate-500">{header.footerText}</p>
        )}
      </div>
    </div>
  );
}

function Editable({ editable, value, onSave }: { editable: boolean; value: string; onSave: (v: string) => void }) {
  if (!editable) return <span>{value}</span>;
  return (
    <span
      contentEditable
      suppressContentEditableWarning
      className="rounded bg-amber-50 px-1 outline-dashed outline-1 outline-amber-300"
      onBlur={(e) => {
        const text = e.currentTarget.textContent ?? "";
        if (text !== value) onSave(text);
      }}
    >
      {value}
    </span>
  );
}
