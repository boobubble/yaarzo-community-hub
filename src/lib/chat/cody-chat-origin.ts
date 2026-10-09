/** CodyChat Test origin used for API calls and media URLs in Preview. */
export const CODYCHAT_PUBLIC_ORIGIN = "https://cody-test.yaarzo.com";
export const CODYCHAT_BASE_URL = `${CODYCHAT_PUBLIC_ORIGIN}/`;

/** Resolve only same-origin endpoints under the verified root installation. */
export function resolveCodyEndpointUrl(path: string) {
  const value = path.trim();
  if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/iu.test(value)) {
    throw new Error("CodyChat API endpoints must be relative paths");
  }

  // Accept callers still supplying the previous installation prefix, but resolve it at root.
  const pathEnd = value.search(/[?#]/u);
  const suffix = pathEnd === -1 ? "" : value.slice(pathEnd);
  const relativePath = (pathEnd === -1 ? value : value.slice(0, pathEnd))
    .replace(/^\/+/, "")
    .replace(/^chatroom(?:\/|$)/u, "");
  const segments = relativePath.split("/");
  const normalizedSegments: string[] = [];
  let invalidPath = relativePath.includes("\\");
  for (const segment of segments) {
    let decoded = segment;
    try {
      for (let pass = 0; pass < 3; pass += 1) {
        const next = decodeURIComponent(decoded);
        if (next === decoded) break;
        decoded = next;
      }
    } catch {
      invalidPath = true;
    }
    if (decoded === ".." || decoded.includes("/") || decoded.includes("\\")) invalidPath = true;
    if (decoded !== ".") normalizedSegments.push(segment);
  }
  if (invalidPath) {
    throw new Error("CodyChat API endpoint escapes its base path");
  }

  const url = new URL(`${normalizedSegments.join("/")}${suffix}`, CODYCHAT_BASE_URL);
  if (url.origin !== CODYCHAT_PUBLIC_ORIGIN) {
    throw new Error("CodyChat API endpoint escapes its base path");
  }
  return url.toString();
}

export function resolveCodyPublicUrl(pathOrUrl: string) {
  const value = pathOrUrl.trim();
  if (!value) return "";
  try {
    if (/^https?:\/\//iu.test(value)) {
      return isSafeCodyPublicUrl(value) ? new URL(value).toString() : "";
    }
    if (value.startsWith("//")) {
      const absolute = new URL(value, CODYCHAT_BASE_URL).toString();
      return isSafeCodyPublicUrl(absolute) ? absolute : "";
    }
    return resolveCodyEndpointUrl(value);
  } catch {
    return "";
  }
}

export function isSafeCodyPublicUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" && parsed.origin === CODYCHAT_PUBLIC_ORIGIN;
  } catch {
    return false;
  }
}
