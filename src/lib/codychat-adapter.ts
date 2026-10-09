import {
  CODYCHAT_BASE_URL,
  CODYCHAT_PUBLIC_ORIGIN,
  resolveCodyEndpointUrl,
  resolveCodyPublicUrl,
} from "./chat/cody-chat-origin.ts";

export { CODYCHAT_BASE_URL };
export const CODYCHAT_ORIGIN = CODYCHAT_PUBLIC_ORIGIN;
const SESSION_COOKIE = "yaarzo_cody_session";

export type CodySession = {
  cookies: Record<string, string>;
  token: string;
  nickname: string;
  issuedAt: number;
  /** Set for registered Bridge sessions (Supabase auth user id). */
  yaarzoUserId?: string;
};

export type CodyMember = {
  id: string;
  name: string;
  avatar?: string;
  gender?: string;
  rank?: number;
  level?: number;
  country?: string;
  /** Supabase profile id when this Cody user is Bridge-linked; null = Cody guest. */
  yaarzoUserId?: string | null;
};

export function codyUserIdFromCookies(cookies: Record<string, string>) {
  const raw = cookies["tc_userid"];
  return raw ? String(raw).slice(0, 64) : undefined;
}

export type CodyRoom = {
  id: number;
  name: string;
  description: string;
  passwordRequired: boolean;
  access: number;
  online: number;
  icon?: string;
};

// PHP's default session_start() cookie carries the server-side tc_token checked
// by CodyChat. Keep it inside the encrypted Yaarzo session and forward it only
// from server-side requests to the configured CodyChat origin.
const allowedCookies = new Set(["tc_userid", "tc_utk", "tc_ssid", "PHPSESSID"]);

function base64UrlEncode(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
}

function base64UrlDecode(value: string) {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

async function encryptionKey(secret: string) {
  if (!secret) throw new Error("YAARZO_SESSION_ENCRYPTION_KEY is not configured");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function sealSession(session: CodySession, secret: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await encryptionKey(secret);
  const plaintext = new TextEncoder().encode(JSON.stringify(session));
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);
  return `v1.${base64UrlEncode(iv)}.${base64UrlEncode(new Uint8Array(ciphertext))}`;
}

export async function openSession(value: string | undefined, secret: string) {
  if (!value) return null;
  const [version, encodedIv, encodedCiphertext] = value.split(".");
  if (version !== "v1" || !encodedIv || !encodedCiphertext) return null;
  try {
    const key = await encryptionKey(secret);
    const plaintext = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: base64UrlDecode(encodedIv) },
      key,
      base64UrlDecode(encodedCiphertext),
    );
    const parsed = JSON.parse(new TextDecoder().decode(plaintext)) as Partial<CodySession>;
    if (!parsed.cookies || !parsed.token || !parsed.nickname || !parsed.issuedAt) return null;
    return parsed as CodySession;
  } catch {
    return null;
  }
}

export function parseRequestCookie(request: Request, name = SESSION_COOKIE) {
  const cookie = request.headers.get("cookie") ?? "";
  for (const part of cookie.split(";")) {
    const [rawName, ...rawValue] = part.trim().split("=");
    if (rawName === name) return decodeURIComponent(rawValue.join("="));
  }
  return undefined;
}

export function sessionCookie(value: string, maxAge = 60 * 60 * 24 * 365) {
  return `${SESSION_COOKIE}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAge}; HttpOnly; Secure; SameSite=Lax`;
}

export function clearSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Lax`;
}

function splitSetCookieHeader(header: string) {
  return header.split(/,(?=\s*[^;,=\s]+=[^;,]+)/u);
}

export function updateCookieJar(response: Response, current: Record<string, string> = {}) {
  const next = { ...current };
  const extendedHeaders = response.headers as Headers & { getSetCookie?: () => string[] };
  const values = extendedHeaders.getSetCookie?.() ?? splitSetCookieHeader(response.headers.get("set-cookie") ?? "");
  for (const value of values) {
    const pair = value.split(";", 1)[0] ?? "";
    const separator = pair.indexOf("=");
    if (separator < 1) continue;
    const name = pair.slice(0, separator).trim();
    if (!allowedCookies.has(name)) continue;
    const cookieValue = pair.slice(separator + 1).trim();
    if (!cookieValue || /max-age=0|expires=Thu, 01 Jan 1970/i.test(value)) delete next[name];
    else next[name] = cookieValue;
  }
  return next;
}

export function cookieHeader(cookies: Record<string, string>) {
  return Object.entries(cookies)
    .filter(([name]) => allowedCookies.has(name))
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
}

export async function codyFetch(path: string, init: RequestInit = {}) {
  return fetch(resolveCodyEndpointUrl(path), {
    ...init,
    redirect: "manual",
    headers: {
      Accept: "text/html,application/json;q=0.9,*/*;q=0.8",
      "User-Agent": "Yaarzo-CodyChat-Adapter/1.0",
      Referer: CODYCHAT_BASE_URL,
      ...init.headers,
    },
  });
}

export function extractToken(html: string) {
  return html.match(/var\s+utk\s*=\s*['"]([^'"]+)['"]/u)?.[1] ?? null;
}

/** Read CodyChat's public captcha mode from the bootstrapped page without returning its site key. */
export function extractCodyCaptchaMode(html: string): 0 | 1 | 2 | 3 | null {
  const mode = html.match(/\bvar\s+recapt\s*=\s*([0-3])\s*;/u)?.[1];
  if (mode === undefined) return null;
  return Number(mode) as 0 | 1 | 2 | 3;
}

export function isLoggedIn(html: string) {
  return /var\s+logged\s*=\s*1\s*;/u.test(html);
}

function decodeHtml(value: string) {
  const entities: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    quot: '"',
  };
  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/giu, (_, entity: string) => {
    if (entity.startsWith("#x")) return String.fromCodePoint(Number.parseInt(entity.slice(2), 16));
    if (entity.startsWith("#")) return String.fromCodePoint(Number.parseInt(entity.slice(1), 10));
    return entities[entity.toLowerCase()] ?? "";
  });
}

function attributes(fragment: string) {
  const result: Record<string, string> = {};
  for (const match of fragment.matchAll(/([\w-]+)\s*=\s*(["'])(.*?)\2/gsu)) {
    if (match[1] && match[3] !== undefined) result[match[1]] = decodeHtml(match[3]);
  }
  return result;
}

export function parseMembers(html: string): CodyMember[] {
  const members: CodyMember[] = [];
  const seen = new Set<string>();
  for (const match of html.matchAll(/<[^>]+class=(["'])[^"']*\buser_item\b[^"']*\1[^>]*>/giu)) {
    const attrs = attributes(match[0]);
    const id = attrs["data-id"]?.slice(0, 64);
    const name = attrs["data-name"]?.slice(0, 64);
    if (!id || !name || seen.has(id)) continue;
    seen.add(id);
    const avatarValue = attrs["data-av"];
    const avatar = avatarValue
      ? resolveCodyPublicUrl(avatarValue)
      : undefined;
    const rank = Number.parseInt(attrs["data-rank"] ?? "", 10);
    const level = Number.parseInt(attrs["data-level"] ?? "", 10);
    members.push({
      id,
      name,
      ...(avatar ? { avatar } : {}),
      ...(attrs["data-gender"] ? { gender: attrs["data-gender"].slice(0, 16) } : {}),
      ...(attrs["data-country"] ? { country: attrs["data-country"].slice(0, 64) } : {}),
      ...(Number.isFinite(rank) ? { rank } : {}),
      ...(Number.isFinite(level) ? { level } : {}),
    });
  }
  return members;
}

export function parseRooms(html: string): CodyRoom[] {
  const starts = [...html.matchAll(/<div[^>]+class=(["'])[^"']*\broom_element\b[^"']*\1[^>]+onclick=(["'])switchRoom\((\d+),\s*(\d+),\s*(\d+)\);\2[^>]*>/giu)];
  return starts.flatMap((match, index) => {
    const id = Number.parseInt(match[3] ?? "", 10);
    const passwordRequired = match[4] === "1";
    const access = Number.parseInt(match[5] ?? "", 10);
    if (!Number.isFinite(id) || !Number.isFinite(access)) return [];
    const start = match.index ?? 0;
    const end = starts[index + 1]?.index ?? html.length;
    const block = html.slice(start, end);
    const name = decodeHtml(block.match(/class=(["'])[^"']*\broomtitle\b[^"']*\1[^>]*>([\s\S]*?)<\/div>/iu)?.[2]?.replace(/<[^>]*>/gu, "").trim() ?? "");
    const description = decodeHtml(block.match(/class=(["'])[^"']*\broomdesc\b[^"']*\1[^>]*>([\s\S]*?)<\/div>/iu)?.[2]?.replace(/<[^>]*>/gu, "").trim() ?? "");
    const onlineText = block.match(/class=(["'])[^"']*\broom_ccount\b[^"']*\1[^>]*>([\s\S]*?)<\/div>/iu)?.[2]?.replace(/<[^>]*>/gu, "").trim() ?? "0";
    const online = Number.parseInt(onlineText, 10);
    const iconValue = block.match(/class=(["'])[^"']*\broom_cicon\b[^"']*\1[^>]*(?:data-src|src)=(["'])(.*?)\2/iu)?.[3];
    const icon = iconValue ? resolveCodyPublicUrl(decodeHtml(iconValue)) : undefined;
    return [{ id, name, description, passwordRequired, access, online: Number.isFinite(online) ? online : 0, ...(icon ? { icon } : {}) }];
  });
}

export function codyAjaxHeaders(session: CodySession) {
  return {
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
    Cookie: cookieHeader(session.cookies),
    Origin: CODYCHAT_ORIGIN,
    Referer: CODYCHAT_BASE_URL,
    "X-Requested-With": "XMLHttpRequest",
  };
}

export function validateSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}

export const codySessionCookieName = SESSION_COOKIE;
