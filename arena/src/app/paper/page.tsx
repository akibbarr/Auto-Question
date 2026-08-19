"use client";

import { useEffect, useMemo, useState } from "react";
import { apiGet } from "@/lib/api";
import { exportQuestionPaperDocx } from "@/lib/docxExportClient";
import { exportQuestionPaperPdf } from "@/lib/pdfExportClient";
import CascadeSelector, { type CascadeValue } from "@/components/CascadeSelector";
import SettingsPanel from "@/components/SettingsPanel";
import QuestionPaperPreview from "@/components/QuestionPaperPreview";
import { DEFAULT_CUSTOMIZATION, DEFAULT_HEADER, QUESTION_TYPE_LABELS } from "@/lib/config";
import { banglaSerial } from "@/lib/bangla";
import { getSectionText } from "@/lib/paperText";
import type {
  ChapterItem,
  ClassItem,
  HeaderSettings,
  PaperCustomization,
  PaperHeaderData,
  Question,
  QuestionType,
  SectionSelection,
  SubjectItem,
} from "@/lib/types";

const SET_LETTERS = ["ক", "খ", "গ", "ঘ", "ঙ"];

export default function PaperPage() {
  const [cascade, setCascade] = useState<CascadeValue>({ classId: null, subjectId: null, chapterId: null, type: null });
  const [chapterIds, setChapterIds] = useState<number[]>([]);
  const [allChapters, setAllChapters] = useState<ChapterItem[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
  const [selectedByType, setSelectedByType] = useState<Record<QuestionType, number[]>>({ mcq: [], short: [], creative: [] });
  const [answerCounts, setAnswerCounts] = useState<Record<QuestionType, number>>({ mcq: 0, short: 0, creative: 0 });
  const [marksEach, setMarksEach] = useState<Record<QuestionType, number | null>>({ mcq: null, short: null, creative: null });
  const [titleOverride, setTitleOverride] = useState<Record<QuestionType, string | null>>({ mcq: null, short: null, creative: null });
  const [marksLineOverride, setMarksLineOverride] = useState<Record<QuestionType, string | null>>({ mcq: null, short: null, creative: null });

  const [customization, setCustomization] = useState<PaperCustomization>(DEFAULT_CUSTOMIZATION);
  const [header, setHeader] = useState<PaperHeaderData>(DEFAULT_HEADER);
  const [questionMap, setQuestionMap] = useState<Map<number, Question>>(new Map());
  const [exporting, setExporting] = useState(false);
  const [setLetterIndex, setSetLetterIndex] = useState(0);

  useEffect(() => {
    apiGet<ClassItem[]>("/api/classes").then(setClasses);
    apiGet<HeaderSettings>("/api/header-settings").then((s) => {
      setHeader((h) => ({
        ...h,
        schoolName: s.schoolName || h.schoolName,
        address: s.address || h.address,
        logoUrl: s.logoUrl,
        examName: s.examName || h.examName,
        instructions: s.instructions || h.instructions,
        footerText: s.footerText || h.footerText,
        watermarkText: s.watermarkText || h.watermarkText,
      }));
    });
  }, []);

  useEffect(() => {
    if (!cascade.classId) return;
    apiGet<SubjectItem[]>(`/api/subjects?classId=${cascade.classId}`).then(setSubjects);
  }, [cascade.classId]);

  useEffect(() => {
    if (!cascade.subjectId) {
      setAllChapters([]);
      return;
    }
    apiGet<ChapterItem[]>(`/api/chapters?subjectId=${cascade.subjectId}`).then(setAllChapters);
  }, [cascade.subjectId]);

  useEffect(() => {
    setChapterIds([]);
  }, [cascade.subjectId]);

  const className = classes.find((c) => c.id === cascade.classId)?.name ?? "";
  const subjectName = subjects.find((s) => s.id === cascade.subjectId)?.name ?? "";
  const chapterNames = allChapters.filter((c) => chapterIds.includes(c.id)).map((c) => c.name).join(", ");

  useEffect(() => {
    setHeader((h) => ({ ...h, className, subjectName, chapterName: chapterNames }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [className, subjectName, chapterNames]);

  async function loadAvailableQuestions() {
    if (!cascade.classId || !cascade.subjectId || chapterIds.length === 0) {
      setAvailableQuestions([]);
      return;
    }
    const params = new URLSearchParams();
    params.set("classId", String(cascade.classId));
    params.set("subjectId", String(cascade.subjectId));
    chapterIds.forEach((id) => params.append("chapterId", String(id)));
    const data = await apiGet<Question[]>(`/api/questions?${params.toString()}`);
    setAvailableQuestions(data);
    setQuestionMap((prev) => {
      const next = new Map(prev);
      data.forEach((q) => next.set(q.id, q));
      return next;
    });
  }

  useEffect(() => {
    loadAvailableQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cascade.classId, cascade.subjectId, chapterIds.join(",")]);

  // Duplicate detection: mark questions sharing normalized text.
  const duplicateTextSet = useMemo(() => {
    const counts = new Map<string, number>();
    availableQuestions.forEach((q) => {
      const norm = q.text.trim().replace(/\s+/g, " ").toLowerCase();
      counts.set(norm, (counts.get(norm) ?? 0) + 1);
    });
    const dupes = new Set<string>();
    counts.forEach((count, key) => {
      if (count > 1) dupes.add(key);
    });
    return dupes;
  }, [availableQuestions]);

  function isDuplicate(q: Question) {
    const norm = q.text.trim().replace(/\s+/g, " ").toLowerCase();
    return duplicateTextSet.has(norm);
  }

  function toggleQuestion(type: QuestionType, id: number) {
    setSelectedByType((prev) => {
      const list = prev[type];
      const next = list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
      setAnswerCounts((ac) => (ac[type] === 0 || ac[type] > next.length ? { ...ac, [type]: next.length } : ac));
      return { ...prev, [type]: next };
    });
  }

  function shuffleType(type: QuestionType) {
    setSelectedByType((prev) => {
      const list = [...prev[type]];
      for (let i = list.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [list[i], list[j]] = [list[j], list[i]];
      }
      return { ...prev, [type]: list };
    });
    setSetLetterIndex((i) => (i + 1) % SET_LETTERS.length);
    setHeader((h) => ({ ...h, setCode: SET_LETTERS[(setLetterIndex + 1) % SET_LETTERS.length] }));
  }

  const sections: SectionSelection[] = useMemo(() => {
    return (["mcq", "short", "creative"] as QuestionType[])
      .filter((t) => selectedByType[t].length > 0)
      .map((t) => ({
        type: t,
        questionIds: selectedByType[t],
        answerCount: answerCounts[t] || selectedByType[t].length,
        marksEach: marksEach[t],
        titleOverride: titleOverride[t],
        marksLineOverride: marksLineOverride[t],
      }));
  }, [selectedByType, answerCounts, marksEach, titleOverride, marksLineOverride]);

  function handleSectionTextChange(type: QuestionType, patch: { titleOverride?: string; marksLineOverride?: string }) {
    if (patch.titleOverride !== undefined) setTitleOverride((s) => ({ ...s, [type]: patch.titleOverride || null }));
    if (patch.marksLineOverride !== undefined) setMarksLineOverride((s) => ({ ...s, [type]: patch.marksLineOverride || null }));
  }

  const totalSelected = sections.reduce((s, sec) => s + sec.questionIds.length, 0);

  const [exportingPdf, setExportingPdf] = useState(false);

  async function handleExport() {
    if (totalSelected === 0) return;
    setExporting(true);
    try {
      const questions = sections.flatMap((s) => s.questionIds.map((id) => questionMap.get(id)!).filter(Boolean));
      await exportQuestionPaperDocx({ header, customization, sections, questions }, `${header.subjectName || "প্রশ্নপত্র"}.docx`);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setExporting(false);
    }
  }

  async function handleExportPdf() {
    if (totalSelected === 0) return;
    setExportingPdf(true);
    try {
      const questions = sections.flatMap((s) => s.questionIds.map((id) => questionMap.get(id)!).filter(Boolean));
      await exportQuestionPaperPdf({ header, customization, sections, questions }, `${header.subjectName || "প্রশ্নপত্র"}.pdf`);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setExportingPdf(false);
    }
  }

  const grouped = useMemo(() => {
    const g: Record<QuestionType, Question[]> = { mcq: [], short: [], creative: [] };
    availableQuestions.forEach((q) => g[q.type].push(q));
    return g;
  }, [availableQuestions]);

  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-extrabold text-slate-900">প্রশ্নপত্র তৈরি করুন</h1>

      <div className="card p-4">
        <CascadeSelector
          value={cascade}
          onChange={setCascade}
          showType={false}
          multiChapter
          chapterIds={chapterIds}
          onChapterIdsChange={setChapterIds}
        />
      </div>

      {chapterIds.length === 0 ? (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          প্রশ্ন দেখতে ক্লাস, বিষয় ও অন্তত একটি অধ্যায় নির্বাচন করুন।
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-1">
            {(["mcq", "short", "creative"] as QuestionType[]).map((type) => (
              <div key={type} className="card p-4">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="font-bold text-slate-800">{QUESTION_TYPE_LABELS[type]}</h3>
                  <button className="btn btn-secondary px-2 py-1 text-xs" onClick={() => shuffleType(type)}>
                    🔀 শাফল
                  </button>
                </div>

                {selectedByType[type].length > 0 && (
                  <label className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-600">
                    উত্তর করতে হবে (যেকোনো)
                    <input
                      type="number"
                      className="input w-16"
                      min={1}
                      max={selectedByType[type].length}
                      value={answerCounts[type] || selectedByType[type].length}
                      onChange={(e) => setAnswerCounts((ac) => ({ ...ac, [type]: Number(e.target.value) }))}
                    />
                  </label>
                )}
                {type === "short" && selectedByType[type].length > 0 && (
                  <label className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-600">
                    প্রতিটির মান
                    <input
                      type="number"
                      className="input w-16"
                      value={marksEach[type] ?? questionMap.get(selectedByType[type][0])?.marks ?? 2}
                      onChange={(e) => setMarksEach((m) => ({ ...m, [type]: Number(e.target.value) }))}
                    />
                  </label>
                )}

                {selectedByType[type].length > 0 && (() => {
                  const secQuestions = selectedByType[type].map((id) => questionMap.get(id)).filter((q): q is Question => Boolean(q));
                  const auto = getSectionText(
                    { type, answerCount: answerCounts[type] || selectedByType[type].length, marksEach: marksEach[type] },
                    secQuestions,
                  );
                  return (
                    <div className="mb-2 space-y-1">
                      <label className="block text-xs font-semibold text-slate-600">
                        হেডিং (এডিট করা যাবে)
                        <input
                          className="input mt-1 w-full text-xs"
                          value={titleOverride[type] ?? ""}
                          placeholder={auto.title}
                          onChange={(e) => setTitleOverride((s) => ({ ...s, [type]: e.target.value || null }))}
                        />
                      </label>
                      <label className="block text-xs font-semibold text-slate-600">
                        মান প্রেসেট, যেমন: ১০ × ২ = ২০ (এডিট করা যাবে)
                        <input
                          className="input mt-1 w-full text-xs"
                          value={marksLineOverride[type] ?? ""}
                          placeholder={auto.marksLine}
                          onChange={(e) => setMarksLineOverride((s) => ({ ...s, [type]: e.target.value || null }))}
                        />
                      </label>
                    </div>
                  );
                })()}

                <div className="max-h-72 space-y-1 overflow-y-auto">
                  {grouped[type].length === 0 && <p className="text-xs text-slate-400">কোনো প্রশ্ন নেই</p>}
                  {grouped[type].map((q) => (
                    <label
                      key={q.id}
                      className={`flex items-start gap-2 rounded-lg border p-2 text-xs ${
                        selectedByType[type].includes(q.id) ? "border-emerald-400 bg-emerald-50" : "border-slate-200"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedByType[type].includes(q.id)}
                        onChange={() => toggleQuestion(type, q.id)}
                        className="mt-0.5"
                      />
                      <span className="line-clamp-3">
                        {isDuplicate(q) && <span className="mr-1 rounded bg-red-100 px-1 text-red-700">⚠ পুনরাবৃত্ত</span>}
                        {q.text || "(উদ্দীপক খালি)"}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}

            <div className="card p-4">
              <p className="mb-2 text-sm font-semibold text-slate-700">মোট নির্বাচিত: {banglaSerial(totalSelected, 1)}টি</p>
              <div className="grid grid-cols-2 gap-2">
                <button className="btn btn-primary" onClick={handleExport} disabled={exporting || totalSelected === 0}>
                  {exporting ? "তৈরি হচ্ছে..." : "📥 .docx"}
                </button>
                <button className="btn btn-primary" onClick={handleExportPdf} disabled={exportingPdf || totalSelected === 0}>
                  {exportingPdf ? "তৈরি হচ্ছে..." : "📄 .pdf"}
                </button>
              </div>
            </div>

            <SettingsPanel
              customization={customization}
              onCustomizationChange={setCustomization}
              header={header}
              onHeaderChange={setHeader}
            />
          </div>

          <div className="lg:col-span-2">
            <QuestionPaperPreview
              header={header}
              customization={customization}
              sections={sections}
              questionMap={questionMap}
              onQuestionUpdated={(q) => setQuestionMap((prev) => new Map(prev).set(q.id, q))}
              onSectionTextChange={handleSectionTextChange}
            />
          </div>
        </div>
      )}
    </main>
  );
}
