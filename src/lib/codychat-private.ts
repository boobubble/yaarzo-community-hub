import { resolveCodyPublicUrl } from "./chat/cody-chat-origin.ts";

function decodeHtml(value: string) {
  return value
    .replace(/&amp;/giu, "&")
    .replace(/&lt;/giu, "<")
    .replace(/&gt;/giu, ">")
    .replace(/&quot;/giu, '"')
    .replace(/&#39;/giu, "'");
}

export type CodyPrivateConversation = {
  userId: string;
  userName: string;
  avatar?: string;
  unread: number;
};

export type CodyPrivateMessage = {
  id: string;
  userId: string;
  userName: string;
  content: string;
};

export function parsePrivateNotifyHtml(html: string): CodyPrivateConversation[] {
  const items: CodyPrivateConversation[] = [];
  const seen = new Set<string>();
  for (const match of html.matchAll(
    /class=(["'])[^"']*\bgprivate\b[^"']*\1[^>]*>/giu,
  )) {
    const tag = match[0];
    const data = tag.match(/\bdata=(["'])(\d+)\1/u)?.[2];
    const value = tag.match(/\bvalue=(["'])(.*?)\1/u)?.[2];
    const av = tag.match(/\bdata-av=(["'])(.*?)\1/u)?.[2];
    if (!data || seen.has(data)) continue;
    seen.add(data);
    const blockStart = match.index ?? 0;
    const block = html.slice(blockStart, blockStart + 800);
    const unreadMatch = block.match(/class=(["'])[^"']*\bpm_notify\b[^"']*\1[^>]*>\s*(\d+)/iu);
    items.push({
      userId: data,
      userName: decodeHtml(value ?? "Guest"),
      ...(av ? { avatar: resolveCodyPublicUrl(decodeHtml(av)) } : {}),
      unread: unreadMatch ? Number.parseInt(unreadMatch[2] ?? "0", 10) : 0,
    });
  }
  return items;
}

function stripTags(html: string) {
  return decodeHtml(html.replace(/<br\s*\/?>/giu, "\n").replace(/<[^>]*>/gu, "").trim());
}

export function normalizeCodyPrivateLogs(value: unknown, selfName?: string): CodyPrivateMessage[] {
  const items = Array.isArray(value) ? value : value && typeof value === "object" ? [value] : [];
  return items.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const log = item as Record<string, unknown>;
    const content = stripTags(String(log.log_content ?? log.content ?? ""));
    if (!content) return [];
    const userName = stripTags(String(log.user_name ?? log.username ?? "Guest"));
    const userId = String(log.user_id ?? "");
    const id = String(log.log_id ?? log.id ?? `${userId}-${content.slice(0, 24)}`);
    return [{ id, userId, userName, content }];
  });
}

export function isOwnPrivateMessage(
  msg: CodyPrivateMessage,
  selfName?: string,
  selfCodyId?: string,
) {
  if (selfCodyId && msg.userId === selfCodyId) return true;
  if (selfName && msg.userName.trim().toLowerCase() === selfName.trim().toLowerCase()) return true;
  return false;
}
