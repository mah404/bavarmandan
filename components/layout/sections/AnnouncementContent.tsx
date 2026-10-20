"use client";

import { createElement, useMemo, type CSSProperties, type ReactNode } from "react";

/**
 * Renders announcement content with the formatting the admin wrote (bold, colors, headings, lists…).
 * The HTML is never injected: it is parsed, filtered through an allowlist and rebuilt as React elements,
 * so scripts, event handlers and unknown tags/attributes cannot reach the page.
 */

const HTML_HINT = /<\/?(p|b|strong|i|em|u|s|strike|div|br|h2|h3|ul|ol|li|blockquote|a|span|font|hr)\b/i;

const ALLOWED_TAGS = new Set([
  "b", "strong", "i", "em", "u", "s", "strike", "p", "div", "br", "h2", "h3",
  "ul", "ol", "li", "blockquote", "a", "span", "font", "hr",
]);
const DROPPED_TAGS = new Set(["script", "style", "iframe", "object", "embed", "noscript", "template", "svg", "math"]);
const VOID_TAGS = new Set(["br", "hr"]);

const COLOR_VALUE =
  /^(inherit|transparent|currentcolor|#[0-9a-f]{3,8}|(rgb|hsl)a?\(\s*[\d.\s,%/deg-]+\))$/i;
const NAMED_COLOR = /^[a-z]{3,20}$/i;
const ALIGN_VALUE = /^(left|right|center|justify|start|end)$/i;
const SAFE_HREF = /^(https?:\/\/|mailto:|\/(?!\/)|#)/i;

function safeColor(value: string) {
  const v = value.trim();
  return COLOR_VALUE.test(v) || NAMED_COLOR.test(v) ? v : null;
}

function safeStyle(element: Element, extraColor?: string | null): CSSProperties | undefined {
  const source = (element as HTMLElement).style;
  const style: CSSProperties = {};

  const color = safeColor(source?.color || extraColor || "");
  if (color) style.color = color;

  const background = safeColor(source?.backgroundColor || "");
  if (background) {
    style.backgroundColor = background;
    style.borderRadius = "0.25em";
    style.padding = "0 0.15em";
  }

  const align = (source?.textAlign || "").trim();
  if (ALIGN_VALUE.test(align)) style.textAlign = align as CSSProperties["textAlign"];

  return Object.keys(style).length ? style : undefined;
}

let keyCounter = 0;

function convert(node: Node, keyPrefix: string): ReactNode {
  if (node.nodeType === 3) return node.nodeValue;
  if (node.nodeType !== 1) return null;

  const element = node as Element;
  const tag = element.tagName.toLowerCase();
  if (DROPPED_TAGS.has(tag)) return null;

  const children = Array.from(element.childNodes).map((child, index) =>
    convert(child, `${keyPrefix}.${index}`)
  );

  if (!ALLOWED_TAGS.has(tag)) return <>{children}</>;

  const key = `${keyPrefix}-${keyCounter++}`;
  const props: Record<string, unknown> = { key };

  const style = safeStyle(element, tag === "font" ? element.getAttribute("color") : null);
  if (style) props.style = style;

  const dir = element.getAttribute("dir");
  if (dir === "ltr" || dir === "rtl") props.dir = dir;

  if (tag === "a") {
    const href = element.getAttribute("href") || "";
    if (SAFE_HREF.test(href)) {
      props.href = href;
      props.target = "_blank";
      props.rel = "noopener noreferrer";
    }
  }

  if (VOID_TAGS.has(tag)) return createElement(tag, props);
  return createElement(tag === "font" ? "span" : tag, props, ...children);
}

export function AnnouncementContent({ content }: { content: string }) {
  const isHtml = HTML_HINT.test(content);

  const nodes = useMemo(() => {
    if (!isHtml) return null;
    const doc = new DOMParser().parseFromString(`<body>${content}</body>`, "text/html");
    return Array.from(doc.body.childNodes).map((child, index) => convert(child, String(index)));
  }, [content, isHtml]);

  if (!isHtml) return <p className="announcements-plain">{content}</p>;
  return <div className="announcements-content">{nodes}</div>;
}
