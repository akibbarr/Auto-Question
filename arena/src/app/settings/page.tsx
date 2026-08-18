"use client";

import { useEffect, useState } from "react";
import { apiGet, apiSend } from "@/lib/api";
import type { HeaderSettings } from "@/lib/types";

export default function SettingsPage() {
  const [settings, setSettings] = useState<HeaderSettings | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    apiGet<HeaderSettings>("/api/header-settings").then(setSettings);
  }, []);

  if (!settings) return <p className="p-6 text-slate-500">লোড হচ্ছে...</p>;

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    setMessage("");
    try {
      let logoUrl = settings.logoUrl;
      if (logoFile) {
        const fd = new FormData();
        fd.append("file", logoFile);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        if (res.ok) logoUrl = (await res.json()).url;
      }
      const updated = await apiSend<HeaderSettings>("/api/header-settings", "PUT", { ...settings, logoUrl });
      setSettings(updated);
      setLogoFile(null);
      setMessage("সেটিংস সংরক্ষণ হয়েছে ✅ — এটি নতুন প্রতিটি প্রশ্নপত্রে অটো-লোড হবে।");
    } catch (e) {
      setMessage(`ত্রুটি: ${(e as Error).message}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-extrabold text-slate-900">স্কুলের হেডার সেটিংস</h1>
      <p className="text-sm text-slate-600">
        এখানে একবার তথ্য দিলে প্রতিটি নতুন প্রশ্নপত্রে অটো-লোড হবে। প্রয়োজনে প্রশ্নপত্র তৈরির সময় ওভাররাইড করা যাবে।
      </p>

      <div className="card space-y-4 p-6">
        <Field label="স্কুলের নাম">
          <input
            className="input"
            value={settings.schoolName}
            onChange={(e) => setSettings({ ...settings, schoolName: e.target.value })}
          />
        </Field>

        <Field label="ঠিকানা">
          <input
            className="input"
            value={settings.address}
            onChange={(e) => setSettings({ ...settings, address: e.target.value })}
          />
        </Field>

        <Field label="লোগো">
          <div className="flex items-center gap-3">
            {settings.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={settings.logoUrl} alt="logo" className="h-14 w-14 rounded border object-contain" />
            )}
            <input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] ?? null)} />
          </div>
        </Field>

        <Field label="পরীক্ষার নাম (ডিফল্ট)">
          <input
            className="input"
            value={settings.examName}
            onChange={(e) => setSettings({ ...settings, examName: e.target.value })}
          />
        </Field>

        <Field label="নির্দেশনা (ডিফল্ট)">
          <textarea
            className="textarea"
            rows={2}
            value={settings.instructions}
            onChange={(e) => setSettings({ ...settings, instructions: e.target.value })}
          />
        </Field>

        <Field label="ফুটার টেক্সট">
          <input
            className="input"
            value={settings.footerText}
            onChange={(e) => setSettings({ ...settings, footerText: e.target.value })}
          />
        </Field>

        <Field label="জলছাপ টেক্সট (ঐচ্ছিক)">
          <input
            className="input"
            value={settings.watermarkText}
            onChange={(e) => setSettings({ ...settings, watermarkText: e.target.value })}
          />
        </Field>

        {message && <p className="text-sm text-slate-700">{message}</p>}

        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? "সংরক্ষণ হচ্ছে..." : "সেটিংস সংরক্ষণ করুন"}
        </button>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-semibold text-slate-700">{label}</span>
      {children}
    </label>
  );
}
