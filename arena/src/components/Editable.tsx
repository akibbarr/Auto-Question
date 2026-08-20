"use client";

import type { FocusEvent } from "react";
import { sanitizeRichHtml } from "@/lib/richText";

/**
 * A small inline "click-to-edit" span used across the paper preview.
 * When `editable` is false it just renders the (sanitized) rich HTML;
 * when true it becomes a contentEditable field with a dashed highlight,
 * supports the floating format toolbar (bold/italic/underline/size), and
 * calls onSave with the new HTML on blur.
 */
export default function Editable({
  editable,
  value,
  onSave,
  placeholder,
  className = "",
  as = "span",
}: {
  editable: boolean;
  value: string;
  onSave: (v: string) => void;
  placeholder?: string;
  className?: string;
  as?: "span" | "div";
}) {
  const Tag = as;
  const html = value || "";

  if (!editable) {
    if (!html) return <Tag className={className}>{placeholder ? <span className="text-slate-300">{placeholder}</span> : null}</Tag>;
    return <Tag className={className} dangerouslySetInnerHTML={{ __html: html }} />;
  }

  return (
    <Tag
      contentEditable
      suppressContentEditableWarning
      data-placeholder={placeholder}
      className={`editable-field rounded px-1 outline-dashed outline-1 outline-amber-300 ${className}`}
      dangerouslySetInnerHTML={{ __html: html }}
      onBlur={(e: FocusEvent<HTMLElement>) => {
        const next = sanitizeRichHtml(e.currentTarget.innerHTML ?? "");
        if (next !== value) onSave(next);
      }}
    />
  );
}
