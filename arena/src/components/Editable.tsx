"use client";

import type { FocusEvent } from "react";

/**
 * A small inline "click-to-edit" span used across the paper preview.
 * When `editable` is false it just renders plain text; when true it becomes
 * a contentEditable field with a dashed highlight, and calls onSave on blur.
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
  if (!editable) {
    return <Tag className={className}>{value || <span className="text-slate-300">{placeholder}</span>}</Tag>;
  }
  return (
    <Tag
      contentEditable
      suppressContentEditableWarning
      data-placeholder={placeholder}
      className={`editable-field rounded px-1 outline-dashed outline-1 outline-amber-300 ${className}`}
      onBlur={(e: FocusEvent<HTMLElement>) => {
        const text = e.currentTarget.textContent ?? "";
        if (text !== value) onSave(text);
      }}
    >
      {value}
    </Tag>
  );
}
