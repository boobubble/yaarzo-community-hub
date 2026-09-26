import { parseCodyMessageHtml } from "@/lib/chat/cody-message-content";
import { resolveCodyPublicUrl } from "@/lib/chat/cody-chat-origin";
import {
  enrichPublicMessagesWithQuotes,
  parseCodyQuoteFromElement,
  parseCodyQuoteFromLog,
  type CodyPublicMessage,
} from "@/lib/chat/cody-public-quote";

function readNumericField(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && /^\d+$/u.test(value.trim())) {
    return Number.parseInt(value.trim(), 10);
  }
  return undefined;
}

function plainText(value: unknown) {
  if (typeof value !== "string") return "";
  return value
    .replace(/<br\s*\/?\s*>/giu, "\n")
    .replace(/<[^>]*>/gu, "")
    .replace(/&nbsp;/giu, " ")
    .replace(/&amp;/giu, "&")
    .replace(/&lt;/giu, "<")
    .replace(/&gt;/giu, ">")
    .replace(/&quot;/giu, '"')
    .trim();
}

function codyLogType(log: Record<string, unknown>): string {
  return String(log.log_type ?? log.log_type_id ?? log.type ?? "").trim();
}

function isCodySystemLogType(logType: string): boolean {
  if (!logType) return false;
  if (logType.startsWith("system__")) return true;
  if (logType === "2" || logType === "3") return true;
  return false;
}

function systemSubjectName(log: Record<string, unknown>): string {
  return plainText(log.tname ?? log.tuser ?? "");
}

function codyLogAvatarUrl(log: Record<string, unknown>): string | undefined {
  const thumb = log.user_tumb ?? log.usertumb;
  if (typeof thumb !== "string" || !thumb.trim()) return undefined;
  const url = resolveCodyPublicUrl(thumb.trim());
  return url || undefined;
}

function isCodySystemLogRecord(log: Record<string, unknown>, logType: string): boolean {
  if (isCodySystemLogType(logType)) return true;
  if (log.log_sys === 1 || log.log_sys === "1") return true;
  if (log.syslog === 1 || log.syslog === "1") return true;
  return false;
}

/** Build display text for Cody JSON system logs (see chat `renderSystemMessage`). */
function systemMessageContent(log: Record<string, unknown>, logType: string): string {
  const fromHtml = plainText(log.log_content ?? log.content ?? log.message);
  if (fromHtml) return fromHtml;

  const name = systemSubjectName(log);
  if (logType === "system__join" && name) return `${name} has joined the room`;
  if (logType === "system__leave" && name) return `${name} has left the room`;
  if (logType === "system__name" && name) return name;

  return "";
}

function parseJsonChatLog(
  log: Record<string, unknown>,
  index: number,
): CodyPublicMessage | null {
  const logType = codyLogType(log);
  const isSystem = isCodySystemLogRecord(log, logType);

  if (isSystem) {
    const content = systemMessageContent(log, logType);
    if (!content) return null;
    const subject = systemSubjectName(log);
    const avatarUrl = codyLogAvatarUrl(log);
    const id = String(log.log_id ?? log.id ?? `system-${index}-${content.slice(0, 24)}`);
    return {
      id,
      author: "system",
      content,
      system: true,
      systemLogType: logType || "system",
      ...(subject ? { systemSubjectName: subject } : {}),
      ...(avatarUrl ? { systemAvatarUrl: avatarUrl } : {}),
    };
  }

  const body = parseCodyMessageHtml(log.log_content ?? log.content ?? log.message);
  let content = body.plainText || plainText(log.log_content ?? log.content ?? log.message);
  if (!content) return null;

  const author =
    plainText(log.user_name ?? log.username ?? log.name) || "Yaarzo";
  const id = String(log.log_id ?? log.id ?? `${author}-${index}-${content.slice(0, 24)}`);
  const quote = parseCodyQuoteFromLog(log);
  const authorUserId =
    log.user_id != null ? String(log.user_id).slice(0, 64) : undefined;

  return {
    id,
    author,
    authorUserId,
    content,
    parts: body.parts.length ? body.parts : undefined,
    quote,
  };
}

function systemTextFromElement(element: HTMLElement): string {
  const selectors = [
    ".sys_log",
    ".sysLog",
    ".chat_system",
    ".system_log",
    ".topic_log",
    ".chat_smessage",
    ".log_sys",
    ".smessage",
  ];
  for (const selector of selectors) {
    const node = element.querySelector(selector);
    if (node) {
      const text = plainText(node.textContent);
      if (text) return text;
    }
  }

  if (/sys|system|topic|sline/i.test(element.className)) {
    const text = plainText(element.textContent);
    if (text) return text;
  }

  return "";
}

function isCodySystemLogElement(element: HTMLElement, content: string): boolean {
  if (systemTextFromElement(element)) return true;
  if (
    element.querySelector(
      ".sys_log, .sysLog, .chat_system, .system_log, .topic_log, .chat_smessage, .log_sys, .smessage",
    )
  ) {
    return true;
  }
  const dataType = element.getAttribute("data-type") ?? element.dataset.type;
  if (dataType === "2" || dataType === "3") return true;
  return /has joined the room|has left the room/iu.test(content);
}

export function maxNumericPublicLogId(messages: CodyPublicMessage[]): number {
  let max = 0;
  for (const message of messages) {
    if (!/^\d+$/u.test(message.id)) continue;
    const id = Number.parseInt(message.id, 10);
    if (id > max) max = id;
  }
  return max;
}

/**
 * Cody incremental polls deliver new rows on `mlogs`.
 * `rdata.room_logs` is for room reset/bootstrap only — do not prefer it when `mlogs` is present.
 */
export function extractChatPollLogs(payload: Record<string, unknown>): unknown {
  if ("mlogs" in payload && payload.mlogs != null) {
    return payload.mlogs;
  }
  const rdata = payload.rdata;
  if (rdata && typeof rdata === "object") {
    const roomLogs = (rdata as Record<string, unknown>).room_logs;
    if (roomLogs != null) return roomLogs;
  }
  return undefined;
}

/** Room-action cursor (`cact`), not chat log id. */
export function readChatPollRoomAction(payload: Record<string, unknown>): number | undefined {
  const cact = readNumericField(payload.cact);
  if (cact !== undefined) return cact;
  const rdata = payload.rdata;
  if (rdata && typeof rdata === "object") {
    return readNumericField((rdata as Record<string, unknown>).room_action);
  }
  return undefined;
}

/** Latest chat log id cursor (`last`), not room-action counter. */
export function readChatPollLastLogId(payload: Record<string, unknown>): number | undefined {
  return readNumericField(payload.last);
}

export function normalizePublicChatLogs(value: unknown): CodyPublicMessage[] {
  if (typeof value === "string") {
    if (!value.trim() || typeof DOMParser === "undefined") return [];

    const trimmed = value.trim();
    if (trimmed.startsWith("[") || trimmed.startsWith("{")) {
      try {
        return normalizePublicChatLogs(JSON.parse(trimmed) as unknown);
      } catch {
        /* fall through to HTML */
      }
    }

    const document = new DOMParser().parseFromString(value, "text/html");
    const candidates = Array.from(
      document.querySelectorAll(
        "[data], .chat_message, .chat_log, .chat_line, .log, li",
      ),
    );
    const nodes = candidates.length
      ? candidates
      : Array.from(document.body.children);

    const parsed = nodes.flatMap((node, index) => {
      const element = node as HTMLElement;
      const quote = parseCodyQuoteFromElement(element);
      const bubbleNode = element.querySelector(
        ".mbubble, .bubble, .chat_message .chat_message",
      );
      const contentNode = element.querySelector(
        ".chat_message, .chat_content, .message, .content, .chat_text, .log_content",
      );
      const authorNode = element.querySelector(
        ".user_name, .username, .cname .username, .chat_name, .name, .sysname",
      );

      const html =
        bubbleNode?.innerHTML ??
        contentNode?.querySelector(".mbubble, .bubble")?.innerHTML ??
        contentNode?.innerHTML ??
        element.innerHTML;
      let body = parseCodyMessageHtml(html);
      const systemLine = systemTextFromElement(element);
      const isSystem = isCodySystemLogElement(
        element,
        body.plainText || systemLine,
      );

      let content = body.plainText || systemLine;
      if (!content && isSystem) {
        content = plainText(element.textContent);
      }
      if (!content) return [];

      if (isSystem && systemLine) {
        content = systemLine;
        body = { parts: [{ kind: "text", text: systemLine }], plainText: systemLine };
      }

      const author =
        plainText(authorNode?.textContent) ||
        (isSystem ? "system" : "Yaarzo");

      const id =
        element.dataset.log ??
        element.getAttribute("data") ??
        element.dataset.id ??
        (element.id?.replace(/^log/u, "") ||
          `${author}-${index}-${content.slice(0, 24)}`);

      const authorUserId = element.getAttribute("data-user") ?? undefined;
      const subject = isSystem ? plainText(element.querySelector(".sysname")?.textContent) : "";

      return [
        {
          id,
          author: isSystem ? "system" : author,
          authorUserId: isSystem ? undefined : authorUserId,
          content,
          parts: body.parts.length ? body.parts : undefined,
          quote: isSystem ? undefined : quote,
          system: isSystem,
          ...(isSystem ? { systemLogType: "system" } : {}),
          ...(subject ? { systemSubjectName: subject } : {}),
        },
      ];
    });

    return enrichPublicMessagesWithQuotes(parsed);
  }

  const items = Array.isArray(value)
    ? value
    : value && typeof value === "object"
      ? [value]
      : [];

  const parsed = items.flatMap((item, index) => {
    if (!item || typeof item !== "object") return [];
    const row = parseJsonChatLog(item as Record<string, unknown>, index);
    return row ? [row] : [];
  });

  return enrichPublicMessagesWithQuotes(parsed);
}

export function summarizePublicChatLogsForDebug(value: unknown): {
  kind: string;
  count: number;
  rows: { id: string; logType?: string; text: string; system?: boolean }[];
} {
  const normalized = normalizePublicChatLogs(value);
  return {
    kind: Array.isArray(value)
      ? "array"
      : typeof value === "string"
        ? "string"
        : value == null
          ? "null"
          : typeof value,
    count: normalized.length,
    rows: normalized.slice(0, 8).map((row) => ({
      id: row.id,
      logType: row.systemLogType,
      text: row.content.slice(0, 120),
      system: row.system,
    })),
  };
}
