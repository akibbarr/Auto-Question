"use client";

import { useEffect, useState } from "react";
import { apiGet, apiSend } from "@/lib/api";
import type { ChapterItem, ClassItem, SubjectItem } from "@/lib/types";

export default function ManagePage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectItem[]>([]);
  const [chapters, setChapters] = useState<ChapterItem[]>([]);
  const [selectedClass, setSelectedClass] = useState<number | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadClasses() {
    const data = await apiGet<ClassItem[]>("/api/classes");
    setClasses(data);
    if (data.length && !selectedClass) setSelectedClass(data[0].id);
  }

  async function loadSubjects(classId: number) {
    const data = await apiGet<SubjectItem[]>(`/api/subjects?classId=${classId}`);
    setSubjects(data);
  }

  async function loadChapters(subjectId: number) {
    const data = await apiGet<ChapterItem[]>(`/api/chapters?subjectId=${subjectId}`);
    setChapters(data);
  }

  useEffect(() => {
    loadClasses()
      .catch((e) => setError(String(e.message ?? e)))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadSubjects(selectedClass).catch(() => setSubjects([]));
      setSelectedSubject(null);
      setChapters([]);
    } else {
      setSubjects([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClass]);

  useEffect(() => {
    if (selectedSubject) {
      loadChapters(selectedSubject).catch(() => setChapters([]));
    } else {
      setChapters([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSubject]);

  if (loading) return <p className="p-6 text-slate-500">লোড হচ্ছে...</p>;

  return (
    <main className="space-y-6">
      <h1 className="text-2xl font-extrabold text-slate-900">ক্লাস / বিষয় / অধ্যায় ব্যবস্থাপনা</h1>
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <CrudColumn
          title="ক্লাস"
          items={classes.map((c) => ({ id: c.id, name: c.name }))}
          selectedId={selectedClass}
          onSelect={setSelectedClass}
          onAdd={async (name) => {
            const row = await apiSend<ClassItem>("/api/classes", "POST", { name });
            setClasses((prev) => [...prev, row]);
            setSelectedClass(row.id);
          }}
          onRename={async (id, name) => {
            await apiSend(`/api/classes/${id}`, "PATCH", { name });
            setClasses((prev) => prev.map((c) => (c.id === id ? { ...c, name } : c)));
          }}
          onDelete={async (id) => {
            await apiSend(`/api/classes/${id}`, "DELETE");
            setClasses((prev) => prev.filter((c) => c.id !== id));
            if (selectedClass === id) setSelectedClass(null);
          }}
        />

        <CrudColumn
          title="বিষয়"
          disabled={!selectedClass}
          items={subjects.map((s) => ({ id: s.id, name: s.name }))}
          selectedId={selectedSubject}
          onSelect={setSelectedSubject}
          onAdd={async (name) => {
            if (!selectedClass) return;
            const row = await apiSend<SubjectItem>("/api/subjects", "POST", { name, classId: selectedClass });
            setSubjects((prev) => [...prev, row]);
            setSelectedSubject(row.id);
          }}
          onRename={async (id, name) => {
            await apiSend(`/api/subjects/${id}`, "PATCH", { name });
            setSubjects((prev) => prev.map((s) => (s.id === id ? { ...s, name } : s)));
          }}
          onDelete={async (id) => {
            await apiSend(`/api/subjects/${id}`, "DELETE");
            setSubjects((prev) => prev.filter((s) => s.id !== id));
            if (selectedSubject === id) setSelectedSubject(null);
          }}
        />

        <CrudColumn
          title="অধ্যায়"
          disabled={!selectedSubject}
          items={chapters.map((c) => ({ id: c.id, name: c.name }))}
          selectedId={null}
          onSelect={() => {}}
          onAdd={async (name) => {
            if (!selectedSubject) return;
            const row = await apiSend<ChapterItem>("/api/chapters", "POST", { name, subjectId: selectedSubject });
            setChapters((prev) => [...prev, row]);
          }}
          onRename={async (id, name) => {
            await apiSend(`/api/chapters/${id}`, "PATCH", { name });
            setChapters((prev) => prev.map((c) => (c.id === id ? { ...c, name } : c)));
          }}
          onDelete={async (id) => {
            await apiSend(`/api/chapters/${id}`, "DELETE");
            setChapters((prev) => prev.filter((c) => c.id !== id));
          }}
        />
      </div>
    </main>
  );
}

function CrudColumn({
  title,
  items,
  selectedId,
  onSelect,
  onAdd,
  onRename,
  onDelete,
  disabled = false,
}: {
  title: string;
  items: { id: number; name: string }[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onAdd: (name: string) => Promise<void>;
  onRename: (id: number, name: string) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
  disabled?: boolean;
}) {
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editValue, setEditValue] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <div className="card flex flex-col p-4">
      <h2 className="mb-3 text-lg font-bold text-slate-800">{title}</h2>

      {disabled && <p className="text-sm text-slate-400">আগে উপরেরটি নির্বাচন করুন</p>}

      {!disabled && (
        <>
          <div className="mb-3 flex gap-2">
            <input
              className="input"
              placeholder={`নতুন ${title} নাম`}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && newName.trim()) {
                  setBusy(true);
                  onAdd(newName.trim()).then(() => {
                    setNewName("");
                    setBusy(false);
                  });
                }
              }}
            />
            <button
              className="btn btn-primary"
              disabled={busy || !newName.trim()}
              onClick={async () => {
                setBusy(true);
                await onAdd(newName.trim());
                setNewName("");
                setBusy(false);
              }}
            >
              যোগ
            </button>
          </div>

          <ul className="flex-1 space-y-1">
            {items.length === 0 && <p className="text-sm text-slate-400">কিছু নেই</p>}
            {items.map((item) => (
              <li
                key={item.id}
                className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm ${
                  selectedId === item.id ? "border-emerald-400 bg-emerald-50" : "border-slate-200 bg-white"
                }`}
              >
                {editingId === item.id ? (
                  <input
                    className="input"
                    value={editValue}
                    autoFocus
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={async (e) => {
                      if (e.key === "Enter" && editValue.trim()) {
                        await onRename(item.id, editValue.trim());
                        setEditingId(null);
                      }
                    }}
                    onBlur={async () => {
                      if (editValue.trim() && editValue !== item.name) await onRename(item.id, editValue.trim());
                      setEditingId(null);
                    }}
                  />
                ) : (
                  <button className="flex-1 text-left" onClick={() => onSelect(item.id)}>
                    {item.name}
                  </button>
                )}
                <div className="flex shrink-0 gap-1">
                  <button
                    className="btn btn-ghost px-2 py-1 text-xs"
                    onClick={() => {
                      setEditingId(item.id);
                      setEditValue(item.name);
                    }}
                  >
                    এডিট
                  </button>
                  <button
                    className="btn btn-ghost px-2 py-1 text-xs text-red-600"
                    onClick={() => {
                      if (confirm(`"${item.name}" ডিলিট করবেন?`)) onDelete(item.id);
                    }}
                  >
                    ডিলিট
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
