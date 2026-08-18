"use client";

import { useCallback, useEffect, useState } from "react";
import CascadeSelector, { type CascadeValue } from "@/components/CascadeSelector";
import CreativeQuestionParser from "@/components/CreativeQuestionParser";
import QuestionForm from "@/components/QuestionForm";
import QuestionList from "@/components/QuestionList";
import { apiGet } from "@/lib/api";
import type { Question } from "@/lib/types";

export default function QuestionsPage() {
  const [value, setValue] = useState<CascadeValue>({ classId: null, subjectId: null, chapterId: null, type: null });
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);

  const loadQuestions = useCallback(async () => {
    if (!value.classId) {
      setQuestions([]);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("classId", String(value.classId));
      if (value.subjectId) params.set("subjectId", String(value.subjectId));
      if (value.chapterId) params.set("chapterId", String(value.chapterId));
      if (value.type) params.set("type", value.type);
      const data = await apiGet<Question[]>(`/api/questions?${params.toString()}`);
      setQuestions(data);
    } finally {
      setLoading(false);
    }
  }, [value.classId, value.subjectId, value.chapterId, value.type]);

  useEffect(() => {
    loadQuestions();
  }, [loadQuestions]);

  const canAddQuestion = value.classId && value.subjectId && value.chapterId && value.type;

  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-extrabold text-slate-900">প্রশ্ন যোগ করুন ও ব্যবস্থাপনা করুন</h1>

      <div className="card p-4">
        <CascadeSelector value={value} onChange={setValue} />
      </div>

      {canAddQuestion && value.type === "creative" && (
        <section className="card p-4">
          <h2 className="mb-3 text-lg font-bold text-slate-800">সৃজনশীল প্রশ্ন যোগ করুন (বাল্ক পেস্ট)</h2>
          <CreativeQuestionParser
            classId={value.classId!}
            subjectId={value.subjectId!}
            chapterId={value.chapterId!}
            onSaved={loadQuestions}
          />
        </section>
      )}

      {canAddQuestion && (value.type === "mcq" || value.type === "short") && (
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-800">
            {value.type === "mcq" ? "বহুনির্বাচনি" : "সংক্ষিপ্ত"} প্রশ্ন যোগ করুন
          </h2>
          <QuestionForm
            type={value.type}
            classId={value.classId!}
            subjectId={value.subjectId!}
            chapterId={value.chapterId!}
            onSaved={loadQuestions}
          />
        </section>
      )}

      {!canAddQuestion && (
        <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
          নতুন প্রশ্ন যোগ করতে ক্লাস, বিষয়, অধ্যায় ও ধরন — সবগুলো নির্বাচন করুন।
        </p>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-800">
          সংরক্ষিত প্রশ্নসমূহ {value.classId ? `(${questions.length}টি)` : ""}
        </h2>
        {loading ? (
          <p className="text-sm text-slate-500">লোড হচ্ছে...</p>
        ) : value.classId ? (
          <QuestionList questions={questions} onChanged={loadQuestions} />
        ) : (
          <p className="text-sm text-slate-400">প্রশ্ন দেখতে অন্তত ক্লাস নির্বাচন করুন।</p>
        )}
      </section>
    </main>
  );
}
