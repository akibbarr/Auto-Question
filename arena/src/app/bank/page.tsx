"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiGet } from "@/lib/api";
import QuestionList from "@/components/QuestionList";
import { QUESTION_TYPE_LABELS } from "@/lib/config";
import type { ChapterItem, ClassItem, Question, QuestionType, SubjectItem } from "@/lib/types";

/**
 * "প্রশ্নব্যাংক" — a single page that shows every question you've ever
 * created, across all classes/subjects/chapters, so you can quickly see
 * what's already in the bank without picking filters first. You can still
 * narrow it down with the search box and the type/class chips.
 */
export default function QuestionBankPage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [chapters, setChapters] = useState<ChapterItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<QuestionType | "all">("all");
  const [classFilter, setClassFilter] = useState<number | "all">("all");

  async function loadAll() {
    setLoading(true);
    try {
      const [qs, cls, subs, chs] = await Promise.all([
        apiGet<Question[]>("/api/questions"),
        apiGet<ClassItem[]>("/api/classes"),
        apiGet<SubjectItem[]>("/api/subjects"),
        apiGet<ChapterItem[]>("/api/chapters"),
      ]);
      setQuestions(qs);
      setClasses(cls);
      setSubjects(subs);
      setChapters(chs);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  const classNameById = useMemo(() => new Map(classes.map((c) => [c.id, c.name])), [classes]);
  const subjectNameById = useMemo(() => new Map(subjects.map((s) => [s.id, s.name])), [subjects]);
  const chapterNameById = useMemo(() => new Map(chapters.map((c) => [c.id, c.name])), [chapters]);

  const counts = useMemo(() => {
    const byType: Record<string, number> = { mcq: 0, short: 0, creative: 0 };
    questions.forEach((q) => {
      byType[q.type] = (byType[q.type] ?? 0) + 1;
    });
    return byType;
  }, [questions]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return questions.filter((q) => {
      if (typeFilter !== "all" && q.type !== typeFilter) return false;
      if (classFilter !== "all" && q.classId !== classFilter) return false;
      if (term && !q.text.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [questions, typeFilter, classFilter, search]);

  // Group filtered results by class -> subject -> chapter for easy scanning.
  const grouped = useMemo(() => {
    type Group = { classId: number; subjectId: number; chapterId: number; items: Question[] };
    const map = new Map<string, Group>();
    filtered.forEach((q) => {
      const key = `${q.classId}-${q.subjectId}-${q.chapterId}`;
      if (!map.has(key)) map.set(key, { classId: q.classId, subjectId: q.subjectId, chapterId: q.chapterId, items: [] });
      map.get(key)!.items.push(q);
    });
    return Array.from(map.values()).sort((a, b) => a.classId - b.classId || a.subjectId - b.subjectId || a.chapterId - b.chapterId);
  }, [filtered]);

  return (
    <main className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">প্রশ্নব্যাংক — সব প্রশ্ন</h1>
          <p className="mt-1 text-sm text-slate-600">
            আপনি এ পর্যন্ত মোট {questions.length}টি প্রশ্ন তৈরি করেছেন — বহুনির্বাচনি {counts.mcq}, সংক্ষিপ্ত {counts.short}, সৃজনশীল{" "}
            {counts.creative}।
          </p>
        </div>
        <Link href="/questions" className="btn btn-secondary">
          + নতুন প্রশ্ন যোগ করুন
        </Link>
      </div>

      <div className="card flex flex-wrap items-center gap-3 p-4">
        <input
          className="input max-w-xs"
          placeholder="🔎 প্রশ্নের লেখায় খুঁজুন..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value as QuestionType | "all")}>
          <option value="all">সব ধরন</option>
          <option value="mcq">{QUESTION_TYPE_LABELS.mcq}</option>
          <option value="short">{QUESTION_TYPE_LABELS.short}</option>
          <option value="creative">{QUESTION_TYPE_LABELS.creative}</option>
        </select>
        <select
          className="select"
          value={classFilter}
          onChange={(e) => setClassFilter(e.target.value === "all" ? "all" : Number(e.target.value))}
        >
          <option value="all">সব ক্লাস</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <span className="text-xs text-slate-500">দেখানো হচ্ছে: {filtered.length}টি</span>
      </div>

      {loading ? (
        <p className="text-sm text-slate-500">লোড হচ্ছে...</p>
      ) : grouped.length === 0 ? (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">কোনো প্রশ্ন পাওয়া যায়নি।</p>
      ) : (
        <div className="space-y-6">
          {grouped.map((g) => (
            <section key={`${g.classId}-${g.subjectId}-${g.chapterId}`} className="space-y-2">
              <h2 className="text-sm font-bold text-slate-700">
                {classNameById.get(g.classId) ?? "?"} <span className="text-slate-400">/</span>{" "}
                {subjectNameById.get(g.subjectId) ?? "?"} <span className="text-slate-400">/</span>{" "}
                {chapterNameById.get(g.chapterId) ?? "?"}{" "}
                <span className="ml-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                  {g.items.length}টি
                </span>
              </h2>
              <QuestionList questions={g.items} onChanged={loadAll} />
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
