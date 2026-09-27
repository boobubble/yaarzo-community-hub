/** Public CodyChat origin used for asset URLs in message rendering. */
export const CODYCHAT_PUBLIC_ORIGIN = "https://chat.yaarzo.com/chatroom";

export function resolveCodyPublicUrl(pathOrUrl: string) {
  const value = pathOrUrl.trim();
  if (!value) return "";
  if (/^https?:\/\//iu.test(value)) return value;
  return `${CODYCHAT_PUBLIC_ORIGIN}/${value.replace(/^\/+/u, "")}`;
}

export function isSafeCodyPublicUrl(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return false;
    const allowed = new URL(CODYCHAT_PUBLIC_ORIGIN);
    return parsed.origin === allowed.origin;
  } catch {
    return false;
  }
}
