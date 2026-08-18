"use client";

import { useState } from "react";
import { apiSend } from "@/lib/api";
import type { QuestionType } from "@/lib/types";
import { DEFAULT_MCQ_MARKS, DEFAULT_SHORT_MARKS } from "@/lib/config";

export default function QuestionForm({
  type,
  classId,
  subjectId,
  chapterId,
  onSaved,
}: {
  type: Extract<QuestionType, "mcq" | "short">;
  classId: number;
  subjectId: number;
  chapterId: number;
  onSaved: () => void;
}) {
  const [text, setText] = useState("");
  const [options, setOptions] = useState(["", "", "", ""]);
  const [correctIndex, setCorrectIndex] = useState(0);
  const [marks, setMarks] = useState(type === "mcq" ? DEFAULT_MCQ_MARKS : DEFAULT_SHORT_MARKS);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  function resetForm() {
    setText("");
    setOptions(["", "", "", ""]);
    setCorrectIndex(0);
    setMarks(type === "mcq" ? DEFAULT_MCQ_MARKS : DEFAULT_SHORT_MARKS);
    setImageFile(null);
  }

  async function handleSave() {
    if (!text.trim()) {
      setMessage("প্রশ্নের লেখা আবশ্যক");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      let imageUrl: string | null = null;
      if (imageFile) {
        const fd = new FormData();
        fd.append("file", imageFile);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        if (res.ok) imageUrl = (await res.json()).url;
      }

      await apiSend("/api/questions", "POST", {
        type,
        classId,
        subjectId,
        chapterId,
        text: text.trim(),
        options: type === "mcq" ? options : null,
        correctAnswer: type === "mcq" ? options[correctIndex] : null,
        marks,
        imageUrl,
      });
      setMessage("প্রশ্ন সংরক্ষণ হয়েছে ✅");
      resetForm();
      onSaved();
    } catch (e) {
      setMessage(`ত্রুটি: ${(e as Error).message}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card space-y-3 p-4">
      <label className="block text-sm font-semibold text-slate-700">প্রশ্নের লেখা</label>
      <textarea className="textarea" rows={3} value={text} onChange={(e) => setText(e.target.value)} />

      {type === "mcq" && (
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-700">অপশনসমূহ (সঠিকটি বাছাই করুন)</label>
          {options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="radio"
                name="correct"
                checked={correctIndex === i}
                onChange={() => setCorrectIndex(i)}
              />
              <input
                className="input"
                placeholder={`অপশন ${i + 1}`}
                value={opt}
                onChange={(e) => setOptions((prev) => prev.map((o, oi) => (oi === i ? e.target.value : o)))}
              />
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          মান:
          <input
            type="number"
            className="input w-20"
            value={marks}
            min={0.5}
            step={0.5}
            onChange={(e) => setMarks(Number(e.target.value))}
          />
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          ছবি (ঐচ্ছিক):
          <input type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} />
        </label>
      </div>

      {message && <p className="text-sm text-slate-600">{message}</p>}

      <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
        {saving ? "সংরক্ষণ হচ্ছে..." : "প্রশ্ন সংরক্ষণ করুন"}
      </button>
    </div>
  );
}
