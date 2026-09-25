import { resolveCodyPublicUrl } from "@/lib/chat/cody-chat-origin";

export type CodyEmoticonItem = {
  token: string;
  imageUrl: string;
};

export type CodyEmoticonPack = {
  id: string;
  items: CodyEmoticonItem[];
};

export function parseEmoticonPackIdsFromChatHtml(html: string) {
  const packs = new Set<string>(["base_emo"]);
  const pattern =
    /data\s*=\s*["']([^"']+)["'][^>]*class\s*=\s*["'][^"']*\bemo_menu_item\b/giu;
  for (const match of html.matchAll(pattern)) {
    const id = match[1]?.trim();
    if (id) packs.add(id);
  }
  return [...packs];
}

/** Parse HTML returned by CodyChat `system/action/emoticon.php`. */
export function parseEmoticonPackHtml(html: string, packId: string): CodyEmoticonPack {
  const items: CodyEmoticonItem[] = [];
  const seen = new Set<string>();

  if (typeof DOMParser !== "undefined") {
    const doc = new DOMParser().parseFromString(html, "text/html");
    doc.querySelectorAll("img").forEach((img) => {
      const token =
        img.getAttribute("data")?.trim() ||
        img.getAttribute("title")?.trim() ||
        "";
      const src = img.getAttribute("src") || img.getAttribute("data-src") || "";
      if (!token || !/^:[^:]+:$/u.test(token) || !src || seen.has(token)) return;
      seen.add(token);
      items.push({ token, imageUrl: resolveCodyPublicUrl(src) });
    });
  } else {
    for (const match of html.matchAll(/data\s*=\s*["'](:[^"']+:)"[^>]*(?:src|data-src)\s*=\s*["']([^"']+)["']/giu)) {
      const token = match[1];
      const src = match[2];
      if (!token || !src || seen.has(token)) continue;
      seen.add(token);
      items.push({ token, imageUrl: resolveCodyPublicUrl(src) });
    }
  }

  return { id: packId, items };
}
