"use client";

import { useMemo, useState } from "react";
import { apiSend } from "@/lib/api";
import { detectQuickAddType, parseMcqBulk, parseShortBulk } from "@/lib/quickParser";
import type { QuestionType } from "@/lib/types";

type Mode = "auto" | QuestionType;

const PLACEHOLDER = `উদাহরণ (বহুনির্বাচনি):
১. বাংলাদেশের রাজধানীর নাম কী?
(ক) ঢাকা
(খ) চট্টগ্রাম
(গ) খুলনা
(ঘ) রাজশাহী
উত্তর: ক

উদাহরণ (সংক্ষিপ্ত):
১. মুক্তিযুদ্ধ কত সালে হয়েছিল? (২)
২. বাংলাদেশের জাতীয় ফুল কী?`;

/**
 * "সুপার-ফাস্ট" quick add — paste a whole block of raw questions (however
 * you already have them typed up) and this parses + saves them all at once,
 * instead of filling the one-by-one form for every single question.
 */
export default function QuickAddQuestions({
  classId,
  subjectId,
  chapterId,
  onSaved,
}: {
  classId: number;
  subjectId: number;
  chapterId: number;
  onSaved: () => void;
}) {
  const [mode, setMode] = useState<Mode>("auto");
  const [raw, setRaw] = useState("");
  const [defaultMarks, setDefaultMarks] = useState(2);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const effectiveType: QuestionType = mode === "auto" ? detectQuickAddType(raw) : mode;

  const preview = useMemo(() => {
    if (!raw.trim()) return { mcq: [], short: [] as ReturnType<typeof parseShortBulk> };
    return {
      mcq: effectiveType === "mcq" ? parseMcqBulk(raw) : [],
      short: effectiveType === "short" ? parseShortBulk(raw, defaultMarks) : [],
    };
  }, [raw, effectiveType, defaultMarks]);

  const count = effectiveType === "mcq" ? preview.mcq.length : preview.short.length;

  async function handleSave() {
    if (count === 0) return;
    setSaving(true);
    setMessage(null);
    try {
      const payload =
        effectiveType === "mcq"
          ? preview.mcq.map((q) => ({
              type: "mcq",
              classId,
              subjectId,
              chapterId,
              text: q.text,
              options: q.options.length ? q.options : null,
              correctAnswer: q.correctAnswer,
              marks: q.marks || 1,
            }))
          : preview.short.map((q) => ({
              type: "short",
              classId,
              subjectId,
              chapterId,
              text: q.text,
              marks: q.marks || defaultMarks,
            }));
      await apiSend("/api/questions", "POST", payload);
      setMessage(`✅ ${count}টি প্রশ্ন সেভ হয়েছে!`);
      setRaw("");
      onSaved();
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3 rounded-xl border-2 border-dashed border-emerald-300 bg-emerald-50/40 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="font-bold text-emerald-900">⚡ সুপার-ফাস্ট প্রশ্ন যোগ</h3>
          <p className="text-xs text-emerald-800/80">নিচে যেকোনো ফরম্যাটে প্রশ্নগুলো পেস্ট করুন — ধরন আপনা-আপনি চেনা হবে, চাইলে নিজে বেছেও দিতে পারেন।</p>
        </div>
        <div className="flex items-center gap-2">
          <select className="select" value={mode} onChange={(e) => setMode(e.target.value as Mode)}>
            <option value="auto">🪄 অটো ডিটেক্ট</option>
            <option value="mcq">বহুনির্বাচনি</option>
            <option value="short">সংক্ষিপ্ত</option>
          </select>
          {effectiveType === "short" && (
            <label className="flex items-center gap-1 text-xs text-slate-600">
              ডিফল্ট মান
              <input
                type="number"
                className="input w-14"
                value={defaultMarks}
                onChange={(e) => setDefaultMarks(Number(e.target.value) || 2)}
              />
            </label>
          )}
        </div>
      </div>

      <textarea
        className="textarea min-h-40"
        placeholder={PLACEHOLDER}
        value={raw}
        onChange={(e) => setRaw(e.target.value)}
      />

      {raw.trim() && (
        <div className="rounded-lg bg-white p-3 text-sm">
          <p className="mb-1 font-semibold text-slate-700">
            শনাক্ত হয়েছে: {effectiveType === "mcq" ? "বহুনির্বাচনি" : "সংক্ষিপ্ত"} — {count}টি প্রশ্ন
          </p>
          <ul className="max-h-40 list-disc space-y-1 overflow-y-auto pl-5 text-xs text-slate-600">
            {effectiveType === "mcq"
              ? preview.mcq.map((q, i) => (
                  <li key={i}>
                    {q.text} {q.options.length > 0 && <span className="text-slate-400">({q.options.length} অপশন{q.correctAnswer ? `, উত্তর: ${q.correctAnswer}` : ""})</span>}
                  </li>
                ))
              : preview.short.map((q, i) => (
                  <li key={i}>
                    {q.text} <span className="text-slate-400">(মান {q.marks})</span>
                  </li>
                ))}
          </ul>
        </div>
      )}

      {message && <p className="text-sm font-medium text-emerald-700">{message}</p>}

      <button className="btn btn-primary w-full" onClick={handleSave} disabled={saving || count === 0}>
        {saving ? "সেভ হচ্ছে..." : `⚡ ${count > 0 ? count + "টি " : ""}প্রশ্ন সেভ করুন`}
      </button>
    </div>
  );
}
