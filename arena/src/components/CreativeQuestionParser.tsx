"use client";

import { useState } from "react";
import { parseCreativeBulk, type ParsedCreativeQuestion } from "@/lib/creativeParser";
import { apiSend } from "@/lib/api";

type EditableBlock = ParsedCreativeQuestion & { imageFile: File | null; imagePreview: string | null };

export default function CreativeQuestionParser({
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
  const [rawText, setRawText] = useState("");
  const [blocks, setBlocks] = useState<EditableBlock[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  function handleParse() {
    const parsed = parseCreativeBulk(rawText);
    setBlocks(parsed.map((p) => ({ ...p, imageFile: null, imagePreview: null })));
    setMessage(parsed.length ? `${parsed.length}টি প্রশ্ন পার্স হয়েছে — নিচে দেখে ঠিক করে নিন` : "কোনো প্রশ্ন পাওয়া যায়নি");
  }

  function updateBlock(index: number, patch: Partial<EditableBlock>) {
    setBlocks((prev) => prev.map((b, i) => (i === index ? { ...b, ...patch } : b)));
  }

  function updateSub(index: number, subIndex: number, patch: Partial<{ text: string; marks: number }>) {
    setBlocks((prev) =>
      prev.map((b, i) => {
        if (i !== index) return b;
        const subQuestions = b.subQuestions.map((s, si) => (si === subIndex ? { ...s, ...patch } : s));
        return { ...b, subQuestions };
      }),
    );
  }

  function removeBlock(index: number) {
    setBlocks((prev) => prev.filter((_, i) => i !== index));
  }

  function addEmptyBlock() {
    setBlocks((prev) => [
      ...prev,
      {
        stimulus: "",
        subQuestions: [
          { label: "ক", text: "", marks: 1 },
          { label: "খ", text: "", marks: 2 },
          { label: "গ", text: "", marks: 3 },
          { label: "ঘ", text: "", marks: 4 },
        ],
        raw: "",
        imageFile: null,
        imagePreview: null,
      },
    ]);
  }

  async function saveAll() {
    if (blocks.length === 0) return;
    setSaving(true);
    setMessage("");
    try {
      const prepared = [];
      for (const b of blocks) {
        let imageUrl: string | null = null;
        if (b.imageFile) {
          const fd = new FormData();
          fd.append("file", b.imageFile);
          const res = await fetch("/api/upload", { method: "POST", body: fd });
          if (res.ok) {
            const data = await res.json();
            imageUrl = data.url;
          }
        }
        const marks = b.subQuestions.reduce((sum, s) => sum + Number(s.marks || 0), 0) || 10;
        prepared.push({
          type: "creative",
          classId,
          subjectId,
          chapterId,
          text: b.stimulus,
          subQuestions: b.subQuestions,
          marks,
          imageUrl,
        });
      }
      await apiSend("/api/questions", "POST", prepared);
      setMessage(`${prepared.length}টি সৃজনশীল প্রশ্ন সংরক্ষণ হয়েছে ✅`);
      setBlocks([]);
      setRawText("");
      onSaved();
    } catch (e) {
      setMessage(`ত্রুটি: ${(e as Error).message}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-semibold text-slate-700">
          একাধিক সৃজনশীল প্রশ্ন একসাথে পেস্ট করুন ("প্রশ্ন ০১:", "প্রশ্ন ০২:" দিয়ে আলাদা করুন)
        </label>
        <textarea
          className="textarea"
          rows={8}
          placeholder={"প্রশ্ন ০১: উদ্দীপক লিখুন...\nক. প্রশ্ন\nখ. প্রশ্ন\nগ. প্রশ্ন\nঘ. প্রশ্ন\n\nপ্রশ্ন ০২: ..."}
          value={rawText}
          onChange={(e) => setRawText(e.target.value)}
        />
        <div className="mt-2 flex gap-2">
          <button className="btn btn-primary" onClick={handleParse} disabled={!rawText.trim()}>
            পার্স করুন
          </button>
          <button className="btn btn-secondary" onClick={addEmptyBlock}>
            + খালি প্রশ্ন যোগ করুন
          </button>
        </div>
      </div>

      {message && <p className="rounded-lg bg-slate-50 p-2 text-sm text-slate-700">{message}</p>}

      {blocks.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-bold text-slate-800">প্রিভিউ — যাচাই করে সেভ করুন ({blocks.length}টি)</h3>
          {blocks.map((b, i) => (
            <div key={i} className="card space-y-3 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-emerald-700">প্রশ্ন {i + 1}</span>
                <button className="btn btn-ghost px-2 py-1 text-xs text-red-600" onClick={() => removeBlock(i)}>
                  বাদ দিন
                </button>
              </div>
              <textarea
                className="textarea"
                rows={3}
                placeholder="উদ্দীপক"
                value={b.stimulus}
                onChange={(e) => updateBlock(i, { stimulus: e.target.value })}
              />
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {b.subQuestions.map((s, si) => (
                  <div key={si} className="flex items-start gap-2 rounded-lg border border-slate-200 p-2">
                    <span className="mt-1.5 font-bold text-slate-500">{s.label}.</span>
                    <textarea
                      className="textarea flex-1"
                      rows={2}
                      value={s.text}
                      onChange={(e) => updateSub(i, si, { text: e.target.value })}
                    />
                    <input
                      type="number"
                      className="input w-16"
                      value={s.marks}
                      min={1}
                      onChange={(e) => updateSub(i, si, { marks: Number(e.target.value) })}
                    />
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-slate-600">ছবি (ঐচ্ছিক):</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    updateBlock(i, { imageFile: file, imagePreview: file ? URL.createObjectURL(file) : null });
                  }}
                />
                {b.imagePreview && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={b.imagePreview} alt="preview" className="h-16 rounded border" />
                )}
              </div>
            </div>
          ))}

          <button className="btn btn-primary" onClick={saveAll} disabled={saving}>
            {saving ? "সংরক্ষণ হচ্ছে..." : `সব সেভ করুন (${blocks.length}টি)`}
          </button>
        </div>
      )}
    </div>
  );
}
