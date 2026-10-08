import type { CodyMessagePart } from "@/lib/chat/cody-message-content";
import { codyHtmlToPlainText, parseCodyMessageHtml } from "@/lib/chat/cody-message-content";

export type CodyPublicQuote = {
  id: string;
  author: string;
  content: string;
  avatarUrl?: string;
};

export type CodyPublicMessage = {
  id: string;
  author: string;
  authorUserId?: string;
  content: string;
  parts?: CodyMessagePart[];
  quote?: CodyPublicQuote;
  /** CodyChat topic/system log (join, leave, etc.) */
  system?: boolean;
  /** Cody `log_type` e.g. system__join */
  systemLogType?: string;
  /** Subject username for system__join / system__leave (%user%) */
  systemSubjectName?: string;
  /** Cody `user_tumb` for system rows (e.g. default_system.png) */
  systemAvatarUrl?: string;
};

const QUOTE_EXCERPT_MAX = 220;

export function isCodyLogId(id: string) {
  return /^\d+$/u.test(id);
}

export function chatMessageDomId(logId: string) {
  return `chat-msg-${logId}`;
}

export { codyHtmlToPlainText } from "@/lib/chat/cody-message-content";

export function parseMessageBodyFromHtml(html: unknown) {
  return parseCodyMessageHtml(html);
}

export function quoteExcerpt(text: string, max = QUOTE_EXCERPT_MAX) {
  const trimmed = text.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max)}…`;
}

export function parseCodyQuoteFromLog(
  log: Record<string, unknown>,
): CodyPublicQuote | undefined {
  const fromPayload = parseCodyQuotePayload(log["quote"]);
  if (fromPayload?.content || (fromPayload?.id && isCodyLogId(fromPayload.id))) {
    return fromPayload;
  }

  const qpost = log["qpost"] ?? log["qid"];
  const postId = Number(qpost);
  if (Number.isFinite(postId) && postId > 0) {
    const author = codyHtmlToPlainText(log["qname"] ?? "");
    const content = codyHtmlToPlainText(
      log["qcontent"] ?? log["qmess"] ?? "",
    );
    if (author || content) {
      return {
        id: String(postId),
        author: author || "User",
        content,
      };
    }
    return { id: String(postId), author: "User", content: "" };
  }

  return fromPayload;
}

export function parseCodyQuotePayload(raw: unknown): CodyPublicQuote | undefined {
  if (raw === null || raw === undefined) return undefined;

  let quote: Record<string, unknown>;
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed || trimmed === "null") return undefined;
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (!parsed || typeof parsed !== "object") return undefined;
      quote = parsed as Record<string, unknown>;
    } catch {
      return undefined;
    }
  } else if (typeof raw === "object") {
    quote = raw as Record<string, unknown>;
  } else {
    return undefined;
  }

  const author =
    codyHtmlToPlainText(quote["qname"] ?? quote["quser"] ?? quote["name"] ?? "") ||
    "User";
  const content = codyHtmlToPlainText(
    quote["qcontent"] ?? quote["qmess"] ?? quote["content"] ?? quote["message"] ?? "",
  );
  const id = String(quote["qid"] ?? quote["qpost"] ?? quote["id"] ?? "").trim();
  const avatarUrl =
    typeof quote["qtumb"] === "string" && quote["qtumb"].trim()
      ? quote["qtumb"].trim()
      : undefined;

  if (!content && !id) return undefined;

  return {
    id,
    author,
    content,
    ...(avatarUrl ? { avatarUrl } : {}),
  };
}

export function parseCodyQuoteFromElement(
  element: HTMLElement,
): CodyPublicQuote | undefined {
  const quoteRoot = element.querySelector(".cquote, .cqbox");
  if (!quoteRoot) return undefined;

  const author = codyHtmlToPlainText(
    quoteRoot.querySelector(".cqname")?.innerHTML ?? "",
  );
  const content = codyHtmlToPlainText(
    quoteRoot.querySelector(".cqmess")?.innerHTML ?? "",
  );
  const id =
    quoteRoot.className.match(/quote(\d+)/u)?.[1] ??
    element.getAttribute("data") ??
    element.id?.replace(/^log/u, "") ??
    "";

  if (!author && !content) return undefined;

  const avatarSrc = quoteRoot.querySelector(".cqav img, img")?.getAttribute("src");

  return {
    id: String(id),
    author: author || "User",
    content,
    ...(avatarSrc ? { avatarUrl: avatarSrc } : {}),
  };
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

/** Remove redundant @nickname prefix from reply body when quote block is shown. */
export function stripRedundantReplyMention(
  content: string,
  quoteAuthor: string,
) {
  const trimmed = content.trim();
  if (!trimmed || !quoteAuthor.trim()) return trimmed;

  const author = quoteAuthor.trim();
  const pattern = new RegExp(
    `^@?${escapeRegExp(author)}\\s*[:,-]?\\s*`,
    "iu",
  );
  return trimmed.replace(pattern, "").trim() || trimmed;
}

export function enrichPublicMessagesWithQuotes(
  messages: CodyPublicMessage[],
): CodyPublicMessage[] {
  const byId = new Map(messages.map((entry) => [entry.id, entry]));

  return messages.map((entry) => {
    let quote = entry.quote;

    if (quote?.id && !quote.content) {
      const original = byId.get(quote.id);
      if (original?.content) {
        quote = { ...quote, content: original.content };
      }
    }

    const content =
      quote?.author
        ? stripRedundantReplyMention(entry.content, quote.author)
        : entry.content;

    if (!quote) {
      return { ...entry, content };
    }

    return {
      ...entry,
      content,
      quote,
    };
  });
}

export function mergePublicMessages(
  previous: CodyPublicMessage | undefined,
  incoming: CodyPublicMessage,
): CodyPublicMessage {
  const mergedQuote = (() => {
    const next = incoming.quote;
    const prev = previous?.quote;
    if (!next && prev) return prev;
    if (!next) return undefined;
    if (!prev) return next;
    const avatarUrl = next.avatarUrl ?? prev.avatarUrl;
    return {
      id: next.id || prev.id,
      author: next.author || prev.author,
      content: next.content || prev.content,
      ...(avatarUrl !== undefined ? { avatarUrl } : {}),
    };
  })();
  const parts = incoming.parts?.length ? incoming.parts : previous?.parts;
  const authorUserId = incoming.authorUserId ?? previous?.authorUserId;
  const system = incoming.system ?? previous?.system;
  const systemLogType = incoming.systemLogType ?? previous?.systemLogType;
  const systemSubjectName = incoming.systemSubjectName ?? previous?.systemSubjectName;
  const systemAvatarUrl = incoming.systemAvatarUrl ?? previous?.systemAvatarUrl;

  return {
    ...incoming,
    ...(mergedQuote ? { quote: mergedQuote } : {}),
    content: incoming.content || previous?.content || "",
    ...(parts !== undefined ? { parts } : {}),
    ...(authorUserId !== undefined ? { authorUserId } : {}),
    ...(system !== undefined ? { system } : {}),
    ...(systemLogType !== undefined ? { systemLogType } : {}),
    ...(systemSubjectName !== undefined ? { systemSubjectName } : {}),
    ...(systemAvatarUrl !== undefined ? { systemAvatarUrl } : {}),
  };
}

export function mergePublicMessageLists(
  current: CodyPublicMessage[],
  incoming: CodyPublicMessage[],
) {
  const map = new Map(current.map((entry) => [entry.id, entry]));

  for (const entry of incoming) {
    map.set(entry.id, mergePublicMessages(map.get(entry.id), entry));
  }

  return enrichPublicMessagesWithQuotes([...map.values()].slice(-150));
}
