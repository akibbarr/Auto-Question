"use client";

import { FONT_OPTIONS, OPTION_STYLES, PAPER_SIZES } from "@/lib/config";
import type { FieldToggles, PaperCustomization, PaperHeaderData } from "@/lib/types";

const FIELD_LABELS: { key: keyof FieldToggles; label: string }[] = [
  { key: "logo", label: "লোগো" },
  { key: "schoolName", label: "স্কুলের নাম" },
  { key: "examName", label: "পরীক্ষার নাম" },
  { key: "className", label: "শ্রেণি" },
  { key: "subjectName", label: "বিষয়ের নাম" },
  { key: "chapterName", label: "অধ্যায়ের নাম" },
  { key: "setCode", label: "সেট কোড" },
  { key: "subjectCode", label: "বিষয় কোড" },
  { key: "instructions", label: "নির্দেশনা" },
  { key: "footer", label: "ফুটার" },
  { key: "watermark", label: "জলছাপ" },
  { key: "address", label: "ঠিকানা" },
  { key: "obtainedMarksBox", label: "প্রাপ্ত নম্বর ঘর" },
];

export default function SettingsPanel({
  customization,
  onCustomizationChange,
  header,
  onHeaderChange,
}: {
  customization: PaperCustomization;
  onCustomizationChange: (c: PaperCustomization) => void;
  header: PaperHeaderData;
  onHeaderChange: (h: PaperHeaderData) => void;
}) {
  function setC<K extends keyof PaperCustomization>(key: K, val: PaperCustomization[K]) {
    onCustomizationChange({ ...customization, [key]: val });
  }
  function setH<K extends keyof PaperHeaderData>(key: K, val: PaperHeaderData[K]) {
    onHeaderChange({ ...header, [key]: val });
  }
  function toggleField(key: keyof FieldToggles) {
    onHeaderChange({ ...header, fields: { ...header.fields, [key]: !header.fields[key] } });
  }

  return (
    <div className="card space-y-5 p-4">
      <div>
        <h3 className="mb-2 font-bold text-slate-800">হেডার ফিল্ড টগল</h3>
        <div className="grid grid-cols-2 gap-1 text-sm">
          {FIELD_LABELS.map((f) => (
            <label key={f.key} className="flex items-center gap-2">
              <input type="checkbox" checked={header.fields[f.key]} onChange={() => toggleField(f.key)} />
              {f.label}
            </label>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <TextField label="সেট কোড" value={header.setCode} onChange={(v) => setH("setCode", v)} />
        <TextField label="বিষয় কোড" value={header.subjectCode} onChange={(v) => setH("subjectCode", v)} />
        <TextField label="সময়" value={header.duration} onChange={(v) => setH("duration", v)} />
        <TextField label="পূর্ণমান" value={header.fullMarks} onChange={(v) => setH("fullMarks", v)} />
        <TextField label="পরীক্ষার নাম" value={header.examName} onChange={(v) => setH("examName", v)} full />
        <TextField label="শ্রেণি" value={header.className} onChange={(v) => setH("className", v)} full />
        <TextField label="বিষয়ের নাম" value={header.subjectName} onChange={(v) => setH("subjectName", v)} full />
        <TextField label="অধ্যায়ের নাম" value={header.chapterName} onChange={(v) => setH("chapterName", v)} full />
        <TextField label="ফুটার" value={header.footerText} onChange={(v) => setH("footerText", v)} full />
      </div>

      <hr className="border-slate-200" />

      <h3 className="font-bold text-slate-800">কাস্টমাইজেশন প্যানেল</h3>

      <label className="flex items-center justify-between text-sm font-medium">
        <span>
          এডিটিং মোড
          <span className="block text-xs font-normal text-slate-400">চালু করলে প্রিভিউতে হেডার, শিরোনাম, মান, প্রশ্ন — সবকিছু সরাসরি ক্লিক করে এডিট করা যাবে</span>
        </span>
        <input
          type="checkbox"
          checked={customization.editingMode}
          onChange={(e) => setC("editingMode", e.target.checked)}
        />
      </label>

      <SelectField
        label="টেক্সট এলাইনমেন্ট"
        value={customization.textAlign}
        options={[
          { value: "left", label: "বামে" },
          { value: "center", label: "মাঝে" },
          { value: "right", label: "ডানে" },
          { value: "justify", label: "জাস্টিফাই" },
        ]}
        onChange={(v) => setC("textAlign", v as PaperCustomization["textAlign"])}
      />

      <SelectField
        label="পেপার সাইজ"
        value={customization.paperSize}
        options={PAPER_SIZES}
        onChange={(v) => setC("paperSize", v as PaperCustomization["paperSize"])}
      />

      <label className="flex items-center justify-between text-sm font-medium">
        পৃষ্ঠা নম্বর
        <input
          type="checkbox"
          checked={customization.showPageNumber}
          onChange={(e) => setC("showPageNumber", e.target.checked)}
        />
      </label>

      {customization.showPageNumber && (
        <SelectField
          label="পৃষ্ঠা নম্বর পজিশন"
          value={customization.pageNumberPosition}
          options={[
            { value: "top", label: "উপরে" },
            { value: "bottom", label: "নিচে" },
          ]}
          onChange={(v) => setC("pageNumberPosition", v as PaperCustomization["pageNumberPosition"])}
        />
      )}

      <SelectField
        label="অপশন স্টাইল"
        value={customization.optionStyle}
        options={OPTION_STYLES}
        onChange={(v) => setC("optionStyle", v as PaperCustomization["optionStyle"])}
      />

      <SelectField
        label="ফন্ট"
        value={customization.fontFamily}
        options={FONT_OPTIONS}
        onChange={(v) => setC("fontFamily", v)}
      />

      <label className="flex items-center justify-between text-sm font-medium">
        ফন্ট সাইজ
        <span className="flex items-center gap-2">
          <button className="btn btn-secondary px-2 py-0.5" onClick={() => setC("fontSize", Math.max(8, customization.fontSize - 1))}>
            −
          </button>
          {customization.fontSize}
          <button className="btn btn-secondary px-2 py-0.5" onClick={() => setC("fontSize", Math.min(28, customization.fontSize + 1))}>
            +
          </button>
        </span>
      </label>

      <SelectField
        label="কলাম"
        value={String(customization.columns)}
        options={[
          { value: "1", label: "১ কলাম" },
          { value: "2", label: "২ কলাম" },
          { value: "3", label: "৩ কলাম" },
        ]}
        onChange={(v) => setC("columns", Number(v) as PaperCustomization["columns"])}
      />

      <label className="flex items-center justify-between text-sm font-medium">
        কলাম ডিভাইডার
        <input
          type="checkbox"
          checked={customization.columnDivider}
          onChange={(e) => setC("columnDivider", e.target.checked)}
        />
      </label>

      <SliderField
        label="প্রশ্নের নিচের গ্যাপ (px)"
        value={customization.questionGap}
        onChange={(v) => setC("questionGap", v)}
      />
      <SliderField
        label="কলামের গ্যাপ (px)"
        value={customization.columnGap}
        onChange={(v) => setC("columnGap", v)}
      />
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  full = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  full?: boolean;
}) {
  return (
    <label className={`block space-y-0.5 ${full ? "col-span-2" : ""}`}>
      <span className="text-xs font-semibold text-slate-600">{label}</span>
      <input className="input" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-2 text-sm font-medium">
      {label}
      <select className="select" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function SliderField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block space-y-1 text-sm font-medium">
      <span className="flex items-center justify-between">
        {label}
        <span>{value}px</span>
      </span>
      <input
        type="range"
        min={0}
        max={50}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
    </label>
  );
}
