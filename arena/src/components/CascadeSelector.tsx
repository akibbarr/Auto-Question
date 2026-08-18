"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";
import type { ChapterItem, ClassItem, QuestionType, SubjectItem } from "@/lib/types";
import { QUESTION_TYPE_LABELS } from "@/lib/config";

export type CascadeValue = {
  classId: number | null;
  subjectId: number | null;
  chapterId: number | null;
  type: QuestionType | null;
};

export default function CascadeSelector({
  value,
  onChange,
  showType = true,
  multiChapter = false,
  chapterIds = [],
  onChapterIdsChange,
}: {
  value: CascadeValue;
  onChange: (v: CascadeValue) => void;
  showType?: boolean;
  multiChapter?: boolean;
  chapterIds?: number[];
  onChapterIdsChange?: (ids: number[]) => void;
}) {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [chapters, setChapters] = useState<ChapterItem[]>([]);

  useEffect(() => {
    apiGet<ClassItem[]>("/api/classes").then(setClasses).catch(() => setClasses([]));
  }, []);

  useEffect(() => {
    if (!value.classId) {
      setSubjects([]);
      return;
    }
    apiGet<SubjectItem[]>(`/api/subjects?classId=${value.classId}`)
      .then(setSubjects)
      .catch(() => setSubjects([]));
  }, [value.classId]);

  useEffect(() => {
    if (!value.subjectId) {
      setChapters([]);
      return;
    }
    apiGet<ChapterItem[]>(`/api/chapters?subjectId=${value.subjectId}`)
      .then(setChapters)
      .catch(() => setChapters([]));
  }, [value.subjectId]);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Field label="ক্লাস">
        <select
          className="select"
          value={value.classId ?? ""}
          onChange={(e) =>
            onChange({ classId: e.target.value ? Number(e.target.value) : null, subjectId: null, chapterId: null, type: value.type })
          }
        >
          <option value="">নির্বাচন করুন</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="বিষয়">
        <select
          className="select"
          disabled={!value.classId}
          value={value.subjectId ?? ""}
          onChange={(e) =>
            onChange({ ...value, subjectId: e.target.value ? Number(e.target.value) : null, chapterId: null })
          }
        >
          <option value="">নির্বাচন করুন</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </Field>

      {!multiChapter && (
        <Field label="অধ্যায়">
          <select
            className="select"
            disabled={!value.subjectId}
            value={value.chapterId ?? ""}
            onChange={(e) => onChange({ ...value, chapterId: e.target.value ? Number(e.target.value) : null })}
          >
            <option value="">নির্বাচন করুন</option>
            {chapters.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
      )}

      {multiChapter && (
        <Field label="অধ্যায় (একাধিক)">
          <div className="max-h-32 overflow-y-auto rounded-lg border border-slate-300 bg-white p-2">
            {chapters.length === 0 && <p className="text-xs text-slate-400">কোনো অধ্যায় নেই</p>}
            {chapters.map((c) => (
              <label key={c.id} className="flex items-center gap-2 py-0.5 text-sm">
                <input
                  type="checkbox"
                  checked={chapterIds.includes(c.id)}
                  onChange={(e) => {
                    if (!onChapterIdsChange) return;
                    if (e.target.checked) onChapterIdsChange([...chapterIds, c.id]);
                    else onChapterIdsChange(chapterIds.filter((id) => id !== c.id));
                  }}
                />
                {c.name}
              </label>
            ))}
          </div>
        </Field>
      )}

      {showType && (
        <Field label="প্রশ্নের ধরন">
          <select
            className="select"
            value={value.type ?? ""}
            onChange={(e) => onChange({ ...value, type: (e.target.value || null) as QuestionType | null })}
          >
            <option value="">নির্বাচন করুন</option>
            {Object.entries(QUESTION_TYPE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </Field>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-sm font-medium text-slate-700">
      {label}
      {children}
    </label>
  );
}
