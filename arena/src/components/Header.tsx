"use client";

import type { PaperHeaderData, TextAlign } from "@/lib/types";

export default function Header({ header, textAlign }: { header: PaperHeaderData; textAlign: TextAlign }) {
  const alignClass =
    textAlign === "left" ? "text-left" : textAlign === "right" ? "text-right" : textAlign === "justify" ? "text-justify" : "text-center";

  return (
    <div className="mb-4 border-b-2 border-slate-800 pb-3 text-center">
      <div className="flex items-center justify-center gap-3">
        {header.fields.logo && header.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={header.logoUrl} alt="logo" className="h-14 w-14 object-contain" />
        )}
        <div>
          {header.fields.schoolName && header.schoolName && (
            <h1 className="text-2xl font-extrabold">{header.schoolName}</h1>
          )}
          {header.fields.address && header.address && <p className="text-xs text-slate-600">{header.address}</p>}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-between text-sm">
        <span className="font-semibold">{header.fields.examName && header.examName}</span>
        <span>{header.fields.setCode && header.setCode ? `সেট কোড: ${header.setCode}` : ""}</span>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold">{header.fields.className && header.className}</span>
        <span>{header.fields.subjectCode && header.subjectCode ? `বিষয় কোড: ${header.subjectCode}` : ""}</span>
      </div>

      {header.fields.subjectName && header.subjectName && (
        <p className="text-lg font-bold">{header.subjectName}</p>
      )}
      {header.fields.chapterName && header.chapterName && (
        <p className="text-sm italic text-slate-600">{header.chapterName}</p>
      )}

      <div className="mt-2 flex items-center justify-between text-sm font-semibold">
        <span>সময়— {header.duration}</span>
        {header.fields.obtainedMarksBox && <span>প্রাপ্ত নম্বর: ______</span>}
        <span>পূর্ণমান— {header.fullMarks}</span>
      </div>

      {header.fields.instructions && header.instructions && (
        <p className={`mt-2 border-y border-dashed border-slate-400 py-1 text-xs italic ${alignClass}`}>
          {header.instructions}
        </p>
      )}
    </div>
  );
}
