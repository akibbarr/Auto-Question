"use client";

import { useState } from "react";
import { apiSend } from "@/lib/api";
import type { Question } from "@/lib/types";
import { QUESTION_TYPE_LABELS } from "@/lib/config";

export default function QuestionList({
  questions,
  onChanged,
}: {
  questions: Question[];
  onChanged: () => void;
}) {
  if (questions.length === 0) {
    return <p className="text-sm text-slate-400">এই ফিল্টারে কোনো প্রশ্ন পাওয়া যায়নি।</p>;
  }

  return (
    <div className="space-y-3">
      {questions.map((q) => (
        <QuestionCard key={q.id} question={q} onChanged={onChanged} />
      ))}
    </div>
  );
}

function QuestionCard({ question, onChanged }: { question: Question; onChanged: () => void }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Question>(question);
  const [saving, setSaving] = useState(false);

  async function handleDelete() {
    if (!confirm("এই প্রশ্নটি ডিলিট করবেন?")) return;
    await apiSend(`/api/questions/${question.id}`, "DELETE");
    onChanged();
  }

  async function handleSave() {
    setSaving(true);
    try {
      await apiSend(`/api/questions/${question.id}`, "PATCH", {
        text: draft.text,
        options: draft.options,
        correctAnswer: draft.correctAnswer,
        subQuestions: draft.subQuestions,
        marks: Number(draft.marks),
      });
      setEditing(false);
      onChanged();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
          {QUESTION_TYPE_LABELS[question.type]}
        </span>
        <div className="flex gap-2">
          <button className="btn btn-ghost px-2 py-1 text-xs" onClick={() => setEditing((v) => !v)}>
            {editing ? "বাতিল" : "এডিট"}
          </button>
          <button className="btn btn-ghost px-2 py-1 text-xs text-red-600" onClick={handleDelete}>
            ডিলিট
          </button>
        </div>
      </div>

      {!editing && (
        <div className="space-y-2 text-sm text-slate-800">
          <p className="whitespace-pre-wrap">{question.text}</p>
          {question.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={question.imageUrl} alt="question" className="h-24 rounded border" />
          )}
          {question.type === "mcq" && question.options && (
            <ul className="ml-4 list-disc space-y-0.5">
              {question.options.map((o, i) => (
                <li key={i} className={o === question.correctAnswer ? "font-bold text-emerald-700" : ""}>
                  {o}
                </li>
              ))}
            </ul>
          )}
          {question.type === "creative" && question.subQuestions && (
            <ul className="ml-4 space-y-0.5">
              {question.subQuestions.map((s, i) => (
                <li key={i}>
                  <span className="font-semibold">{s.label}.</span> {s.text}{" "}
                  <span className="text-slate-500">({s.marks})</span>
                </li>
              ))}
            </ul>
          )}
          <p className="text-xs text-slate-500">মান: {question.marks}</p>
        </div>
      )}

      {editing && (
        <div className="space-y-2">
          <textarea
            className="textarea"
            rows={3}
            value={draft.text}
            onChange={(e) => setDraft({ ...draft, text: e.target.value })}
          />
          {draft.type === "mcq" && draft.options && (
            <div className="space-y-1">
              {draft.options.map((o, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={draft.correctAnswer === o}
                    onChange={() => setDraft({ ...draft, correctAnswer: o })}
                  />
                  <input
                    className="input"
                    value={o}
                    onChange={(e) => {
                      const options = draft.options!.map((op, oi) => (oi === i ? e.target.value : op));
                      const correctAnswer = draft.correctAnswer === o ? e.target.value : draft.correctAnswer;
                      setDraft({ ...draft, options, correctAnswer });
                    }}
                  />
                </div>
              ))}
            </div>
          )}
          {draft.type === "creative" && draft.subQuestions && (
            <div className="space-y-2">
              {draft.subQuestions.map((s, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="font-semibold">{s.label}.</span>
                  <input
                    className="input flex-1"
                    value={s.text}
                    onChange={(e) => {
                      const subQuestions = draft.subQuestions!.map((sq, si) =>
                        si === i ? { ...sq, text: e.target.value } : sq,
                      );
                      setDraft({ ...draft, subQuestions });
                    }}
                  />
                  <input
                    type="number"
                    className="input w-16"
                    value={s.marks}
                    onChange={(e) => {
                      const subQuestions = draft.subQuestions!.map((sq, si) =>
                        si === i ? { ...sq, marks: Number(e.target.value) } : sq,
                      );
                      setDraft({ ...draft, subQuestions });
                    }}
                  />
                </div>
              ))}
            </div>
          )}
          <label className="flex items-center gap-2 text-sm font-semibold">
            মান:
            <input
              type="number"
              className="input w-20"
              value={draft.marks}
              onChange={(e) => setDraft({ ...draft, marks: Number(e.target.value) })}
            />
          </label>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "সংরক্ষণ হচ্ছে..." : "পরিবর্তন সংরক্ষণ করুন"}
          </button>
        </div>
      )}
    </div>
  );
}
