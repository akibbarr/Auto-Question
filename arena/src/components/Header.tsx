"use client";

import type { ReactNode } from "react";
import Editable from "./Editable";
import type { PaperHeaderData, TextAlign } from "@/lib/types";

/** Left / center / right slots in one row, using an even 3-column grid so a
 * lone center item (e.g. class name) sits truly centered while a right item
 * (e.g. subject code) floats to the page edge — matching real exam-paper
 * headers where these are independent tab stops, not just a two-way split. */
function HeaderRow({ left, center, right }: { left?: ReactNode; center?: ReactNode; right?: ReactNode }) {
  if (!left && !center && !right) return null;
  return (
    <div className="mt-1 grid grid-cols-3 items-center text-sm">
      <div className="text-left font-semibold">{left}</div>
      <div className="text-center font-semibold">{center}</div>
      <div className="text-right">{right}</div>
    </div>
  );
}

export default function Header({
  header,
  textAlign,
  editable = false,
  onChange,
}: {
  header: PaperHeaderData;
  textAlign: TextAlign;
  editable?: boolean;
  onChange?: (patch: Partial<PaperHeaderData>) => void;
}) {
  const alignClass =
    textAlign === "left" ? "text-left" : textAlign === "right" ? "text-right" : textAlign === "justify" ? "text-justify" : "text-center";

  const set = (patch: Partial<PaperHeaderData>) => onChange?.(patch);

  return (
    <div className="mb-4 border-b-2 border-slate-800 pb-3 text-center">
      <div className="flex items-center justify-center gap-3">
        {header.fields.logo && header.logoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={header.logoUrl} alt="logo" className="h-14 w-14 object-contain" />
        )}
        <div>
          {(header.fields.schoolName && (header.schoolName || editable)) && (
            <Editable
              as="div"
              editable={editable}
              value={header.schoolName}
              placeholder="স্কুলের নাম"
              className="text-2xl font-extrabold"
              onSave={(v) => set({ schoolName: v })}
            />
          )}
          {(header.fields.address && (header.address || editable)) && (
            <Editable
              as="div"
              editable={editable}
              value={header.address}
              placeholder="ঠিকানা"
              className="text-xs text-slate-600"
              onSave={(v) => set({ address: v })}
            />
          )}
        </div>
      </div>

      <HeaderRow
        center={
          header.fields.examName && (header.examName || editable) ? (
            <Editable editable={editable} value={header.examName} placeholder="পরীক্ষার নাম" onSave={(v) => set({ examName: v })} />
          ) : null
        }
        right={
          header.fields.setCode && (header.setCode || editable) ? (
            <>
              সেট কোড:{" "}
              <Editable editable={editable} value={header.setCode} placeholder="ক" onSave={(v) => set({ setCode: v })} />
            </>
          ) : null
        }
      />

      <HeaderRow
        center={
          header.fields.className && (header.className || editable) ? (
            <Editable editable={editable} value={header.className} placeholder="শ্রেণি" onSave={(v) => set({ className: v })} />
          ) : null
        }
        right={
          header.fields.subjectCode && (header.subjectCode || editable) ? (
            <>
              বিষয় কোড:{" "}
              <Editable editable={editable} value={header.subjectCode} placeholder="—" onSave={(v) => set({ subjectCode: v })} />
            </>
          ) : null
        }
      />

      {(header.fields.subjectName && (header.subjectName || editable)) && (
        <Editable
          as="div"
          editable={editable}
          value={header.subjectName}
          placeholder="বিষয়ের নাম"
          className="mt-1 text-lg font-bold"
          onSave={(v) => set({ subjectName: v })}
        />
      )}
      {(header.fields.chapterName && (header.chapterName || editable)) && (
        <Editable
          as="div"
          editable={editable}
          value={header.chapterName}
          placeholder="অধ্যায়"
          className="text-sm italic text-slate-600"
          onSave={(v) => set({ chapterName: v })}
        />
      )}

      <HeaderRow
        left={
          <>
            সময়— <Editable editable={editable} value={header.duration} placeholder="৩ ঘণ্টা" onSave={(v) => set({ duration: v })} />
          </>
        }
        center={header.fields.obtainedMarksBox ? "প্রাপ্ত নম্বর: ______" : null}
        right={
          <>
            পূর্ণমান— <Editable editable={editable} value={header.fullMarks} placeholder="১০০" onSave={(v) => set({ fullMarks: v })} />
          </>
        }
      />

      {(header.fields.instructions && (header.instructions || editable)) && (
        <Editable
          as="div"
          editable={editable}
          value={header.instructions}
          placeholder="নির্দেশনা"
          className={`mt-2 border-y border-dashed border-slate-400 py-1 text-xs italic ${alignClass}`}
          onSave={(v) => set({ instructions: v })}
        />
      )}
    </div>
  );
}
