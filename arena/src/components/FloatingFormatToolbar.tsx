"use client";

import { useEffect, useState, type MouseEvent } from "react";

type Pos = { top: number; left: number };

function nearestEditable(node: Node | null): HTMLElement | null {
  let el: Node | null = node;
  while (el) {
    if (el instanceof HTMLElement && el.classList.contains("editable-field")) return el;
    el = el.parentNode;
  }
  return null;
}

function currentFontSize(el: HTMLElement): number {
  return Math.round(parseFloat(getComputedStyle(el).fontSize)) || 16;
}

/** Wraps the current selection in a <span style="font-size:Npx">, adjusting
 * by `delta` px from whatever size the selection start currently has. */
function stepFontSize(delta: number, root: HTMLElement) {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
  const range = sel.getRangeAt(0);
  const startEl = range.startContainer.nodeType === 3 ? range.startContainer.parentElement : (range.startContainer as HTMLElement);
  const base = startEl ? currentFontSize(startEl) : currentFontSize(root);
  const next = Math.max(8, Math.min(72, base + delta));
  const span = document.createElement("span");
  span.style.fontSize = `${next}px`;
  try {
    range.surroundContents(span);
  } catch {
    const content = range.extractContents();
    span.appendChild(content);
    range.insertNode(span);
  }
  sel.removeAllRanges();
  sel.addRange(range);
}

/**
 * A small selection-triggered toolbar (bold/italic/underline/align/font-size)
 * for any element with the "editable-field" class inside the paper preview.
 * Mounted once; only shows itself while there's a live text selection inside
 * an editable field, positioned just above the selection.
 */
export default function FloatingFormatToolbar({ containerSelector = ".print-area" }: { containerSelector?: string }) {
  const [pos, setPos] = useState<Pos | null>(null);
  const [activeEl, setActiveEl] = useState<HTMLElement | null>(null);
  const [size, setSize] = useState(16);

  useEffect(() => {
    function onSelectionChange() {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
        setPos(null);
        return;
      }
      const anchor = nearestEditable(sel.anchorNode);
      const focus = nearestEditable(sel.focusNode);
      if (!anchor || anchor !== focus) {
        setPos(null);
        return;
      }
      const container = anchor.closest(containerSelector);
      if (!container) {
        setPos(null);
        return;
      }
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) {
        setPos(null);
        return;
      }
      setActiveEl(anchor);
      const startEl = range.startContainer.nodeType === 3 ? range.startContainer.parentElement : (range.startContainer as HTMLElement);
      setSize(startEl ? currentFontSize(startEl) : 16);
      setPos({ top: rect.top - 44, left: Math.max(8, rect.left + rect.width / 2 - 120) });
    }
    document.addEventListener("selectionchange", onSelectionChange);
    return () => document.removeEventListener("selectionchange", onSelectionChange);
  }, [containerSelector]);

  if (!pos || !activeEl) return null;

  // onMouseDown + preventDefault keeps the current selection alive (otherwise
  // clicking the button would blur the contentEditable and lose it first).
  const guard = (e: MouseEvent) => e.preventDefault();

  function exec(cmd: string) {
    document.execCommand(cmd);
  }

  return (
    <div
      className="fixed z-50 flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl"
      style={{ top: pos.top, left: pos.left }}
      onMouseDown={guard}
    >
      <button
        className="rounded px-1.5 py-1 text-sm font-bold text-slate-700 hover:bg-slate-100"
        onMouseDown={guard}
        onClick={() => activeEl && stepFontSize(-2, activeEl)}
        title="ছোট করুন"
      >
        −
      </button>
      <span className="w-6 text-center text-xs text-slate-500">{size}</span>
      <button
        className="rounded px-1.5 py-1 text-sm font-bold text-slate-700 hover:bg-slate-100"
        onMouseDown={guard}
        onClick={() => activeEl && stepFontSize(2, activeEl)}
        title="বড় করুন"
      >
        +
      </button>
      <span className="mx-1 h-5 w-px bg-slate-200" />
      <button className="rounded px-2 py-1 font-bold text-slate-700 hover:bg-slate-100" onMouseDown={guard} onClick={() => exec("bold")} title="Bold">
        B
      </button>
      <button className="rounded px-2 py-1 italic text-slate-700 hover:bg-slate-100" onMouseDown={guard} onClick={() => exec("italic")} title="Italic">
        I
      </button>
      <button
        className="rounded px-2 py-1 text-slate-700 underline hover:bg-slate-100"
        onMouseDown={guard}
        onClick={() => exec("underline")}
        title="Underline"
      >
        U
      </button>
      <span className="mx-1 h-5 w-px bg-slate-200" />
      <button className="rounded px-2 py-1 text-slate-700 hover:bg-slate-100" onMouseDown={guard} onClick={() => exec("justifyLeft")} title="বামে">
        ≡
      </button>
      <button
        className="rounded bg-emerald-600 px-2 py-1 text-white hover:bg-emerald-700"
        onMouseDown={guard}
        onClick={() => exec("justifyCenter")}
        title="মাঝে"
      >
        ≡
      </button>
      <button className="rounded px-2 py-1 text-slate-700 hover:bg-slate-100" onMouseDown={guard} onClick={() => exec("justifyRight")} title="ডানে">
        ≡
      </button>
      <span className="mx-1 h-5 w-px bg-slate-200" />
      <button
        className="rounded bg-rose-50 px-2 py-1 text-rose-500 hover:bg-rose-100"
        onMouseDown={guard}
        onClick={() => exec("removeFormat")}
        title="ফরম্যাট মুছুন"
      >
        ⌫
      </button>
    </div>
  );
}
