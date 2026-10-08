/** Public CodyChat origin used for asset URLs in message rendering. */
export const CODYCHAT_PUBLIC_ORIGIN = "https://chat.yaarzo.com";
export const CODYCHAT_BASE_URL = `${CODYCHAT_PUBLIC_ORIGIN}/chatroom/`;

/** Keep API paths inside the CodyChat installation, including leading-slash paths. */
export function resolveCodyEndpointUrl(path: string) {
  const value = path.trim();
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/iu.test(value)) {
    throw new Error("CodyChat API endpoints must be relative paths");
  }
  const relativePath = value.replace(/^\/+/u, "").replace(/^chatroom(?:\/|$)/u, "");
  const url = new URL(relativePath, CODYCHAT_BASE_URL);
  if (url.origin !== CODYCHAT_PUBLIC_ORIGIN || !url.pathname.startsWith("/chatroom/")) {
    throw new Error("CodyChat API endpoint escapes its base path");
  }
  return url.toString();
}

export function resolveCodyPublicUrl(pathOrUrl: string) {
  const value = pathOrUrl.trim();
  if (!value) return "";
  if (/^https?:\/\//iu.test(value)) return value;
  // Absolute media links retain their existing origin; callers apply the safety check.
  try {
    if (value.startsWith("//")) return new URL(value, CODYCHAT_BASE_URL).toString();
    return resolveCodyEndpointUrl(value);
  } catch {
    return "";
  }
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
