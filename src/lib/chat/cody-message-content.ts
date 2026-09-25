import { isSafeCodyPublicUrl, resolveCodyPublicUrl } from "@/lib/chat/cody-chat-origin";
import { firstUrlInText, resolveActiveMediaEmbed } from "@/lib/media/media-embed-text";
import type { MediaConfig } from "@/lib/media/media-providers-config";

export type CodyMessagePart =
  | { kind: "text"; text: string }
  | { kind: "emoji"; token: string; imageUrl: string }
  | { kind: "image"; url: string }
  | { kind: "file"; url: string; filename: string };

export type ParsedCodyMessageContent = {
  parts: CodyMessagePart[];
  plainText: string;
};

function decodeBasicEntities(value: string) {
  return value
    .replace(/&nbsp;/giu, " ")
    .replace(/&amp;/giu, "&")
    .replace(/&lt;/giu, "<")
    .replace(/&gt;/giu, ">")
    .replace(/&quot;/giu, '"')
    .replace(/&#39;/giu, "'");
}

function pushText(parts: CodyMessagePart[], text: string) {
  const normalized = text.replace(/\u00a0/gu, " ");
  if (!normalized) return;
  const last = parts[parts.length - 1];
  if (last?.kind === "text") {
    last.text += normalized;
    return;
  }
  parts.push({ kind: "text", text: normalized });
}

function filenameFromUrl(url: string) {
  try {
    const path = new URL(url).pathname;
    const base = path.split("/").pop() ?? "download";
    return decodeURIComponent(base);
  } catch {
    return "download";
  }
}

function readEmojiToken(img: Element) {
  const data = img.getAttribute("data")?.trim();
  if (data && /^:[^:]+:$/u.test(data)) return data;
  const title = img.getAttribute("title")?.trim();
  if (title && /^:[^:]+:$/u.test(title)) return title;
  return null;
}

function walkNodes(node: Node, parts: CodyMessagePart[]) {
  if (node.nodeType === Node.TEXT_NODE) {
    pushText(parts, node.textContent ?? "");
    return;
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return;

  const el = node as HTMLElement;
  const tag = el.tagName.toLowerCase();

  if (tag === "br") {
    pushText(parts, "\n");
    return;
  }

  if (tag === "img") {
    const className = el.getAttribute("class") ?? "";
    const src = el.getAttribute("src") || el.getAttribute("data-src") || "";
    const token = readEmojiToken(el);

    if (className.includes("chat_image") && src) {
      const url = resolveCodyPublicUrl(src);
      if (isSafeCodyPublicUrl(url)) parts.push({ kind: "image", url });
      return;
    }

    if (className.includes("chat_file")) {
      const parent = el.closest("a");
      const href = parent?.getAttribute("href") ?? "";
      if (href) {
        const url = resolveCodyPublicUrl(href);
        if (isSafeCodyPublicUrl(url)) {
          parts.push({ kind: "file", url, filename: filenameFromUrl(url) });
        }
      }
      return;
    }

    if (token && src && (className.includes("emocc") || className.includes("emo_"))) {
      const imageUrl = resolveCodyPublicUrl(src);
      if (isSafeCodyPublicUrl(imageUrl)) {
        parts.push({ kind: "emoji", token, imageUrl });
      } else {
        pushText(parts, token);
      }
      return;
    }

    if (token) {
      pushText(parts, token);
      return;
    }
    return;
  }

  if (tag === "a") {
    const href = el.getAttribute("href") ?? "";
    const childImg = el.querySelector("img.chat_image");
    if (childImg) {
      walkNodes(childImg, parts);
      return;
    }
    if (el.hasAttribute("download") && href) {
      const url = resolveCodyPublicUrl(href);
      if (isSafeCodyPublicUrl(url)) {
        parts.push({ kind: "file", url, filename: filenameFromUrl(url) });
        return;
      }
    }
  }

  el.childNodes.forEach((child) => walkNodes(child, parts));
}

export function parseCodyMessageHtml(html: unknown): ParsedCodyMessageContent {
  const raw = typeof html === "string" ? html : html == null ? "" : String(html);
  if (!raw.trim()) {
    return { parts: [], plainText: "" };
  }

  const parts: CodyMessagePart[] = [];

  if (typeof DOMParser === "undefined") {
    const plain = decodeBasicEntities(raw.replace(/<br\s*\/?\s*>/giu, "\n").replace(/<[^>]*>/gu, ""));
    return { parts: plain ? [{ kind: "text", text: plain.trim() }] : [], plainText: plain.trim() };
  }

  const withBreaks = raw.replace(/<br\s*\/?\s*>/giu, "<br />");
  const doc = new DOMParser().parseFromString(withBreaks, "text/html");
  doc.body.childNodes.forEach((child) => walkNodes(child, parts));

  const plainText = parts
    .map((part) => {
      if (part.kind === "text") return part.text;
      if (part.kind === "emoji") return part.token;
      if (part.kind === "image") return "[image]";
      if (part.kind === "file") return part.filename;
      return "";
    })
    .join("")
    .replace(/[ \t]+\n/gu, "\n")
    .replace(/\n{3,}/gu, "\n\n")
    .trim();

  return { parts, plainText };
}

export function codyHtmlToPlainText(html: unknown) {
  return parseCodyMessageHtml(html).plainText;
}

export function mergeMediaPartsFromPlainText(text: string, media?: MediaConfig | null) {
  const url = firstUrlInText(text);
  if (!url) return [];
  const resolved = resolveActiveMediaEmbed(text, media);
  if (!resolved.willRender) return [];
  return [{ kind: "text" as const, text: text.replace(url, "").trim() }];
}
