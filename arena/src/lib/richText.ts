const ALLOWED_TAGS = new Set(["b", "strong", "i", "em", "u", "span"]);

/**
 * Small allow-list HTML sanitizer for the rich-text fields produced by the
 * in-app formatting toolbar (bold/italic/underline/font-size only). Runs on
 * the client right before we save, since the string later gets rendered via
 * dangerouslySetInnerHTML — strips anything else (scripts, event handler
 * attributes, unknown tags) rather than trusting whatever the browser's
 * contentEditable / execCommand happened to produce.
 */
export function sanitizeRichHtml(html: string): string {
  if (!html || typeof document === "undefined") return html || "";
  const container = document.createElement("div");
  container.innerHTML = html;
  sanitizeNode(container);
  return container.innerHTML;
}

function sanitizeNode(node: Node) {
  const children = Array.from(node.childNodes);
  for (const child of children) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      const el = child as HTMLElement;
      const tag = el.tagName.toLowerCase();
      if (!ALLOWED_TAGS.has(tag)) {
        // Unwrap disallowed elements (e.g. <div>, <p>, <script>) but keep their text.
        while (el.firstChild) node.insertBefore(el.firstChild, el);
        node.removeChild(el);
        sanitizeNode(node); // re-scan with the promoted children in place
        return;
      }
      const style = el.getAttribute("style");
      Array.from(el.attributes).forEach((a) => el.removeAttribute(a.name));
      if (tag === "span" && style) {
        const m = style.match(/font-size:\s*[\d.]+px/);
        if (m) el.setAttribute("style", m[0]);
      }
      sanitizeNode(el);
    } else if (child.nodeType === Node.COMMENT_NODE) {
      node.removeChild(child);
    }
  }
}

export function stripHtml(html: string | null | undefined): string {
  if (!html) return "";
  if (typeof document !== "undefined") {
    const d = document.createElement("div");
    d.innerHTML = html;
    return d.textContent ?? "";
  }
  return html.replace(/<[^>]+>/g, "");
}
