declare const __YAARZO_CODYCHAT_ORIGIN__: string | undefined;

export const DEFAULT_CODYCHAT_ORIGIN = "https://cody-test.yaarzo.com";
const trustedBasePaths = new Map([
  ["https://cody-test.yaarzo.com", "/"],
  ["https://chat.yaarzo.com", "/chatroom/"],
]);

export function validateCodyChatOrigin(value: string) {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error("YAARZO_CODYCHAT_ORIGIN must be a trusted HTTPS origin");
  }
  if (
    parsed.protocol !== "https:" ||
    parsed.origin !== value ||
    !trustedBasePaths.has(parsed.origin)
  ) {
    throw new Error("YAARZO_CODYCHAT_ORIGIN must be a trusted HTTPS origin");
  }
  return parsed.origin;
}

const configuredOrigin =
  typeof __YAARZO_CODYCHAT_ORIGIN__ === "string"
    ? __YAARZO_CODYCHAT_ORIGIN__
    : DEFAULT_CODYCHAT_ORIGIN;

export const CODYCHAT_PUBLIC_ORIGIN = validateCodyChatOrigin(configuredOrigin);
export const CODYCHAT_BASE_URL = `${CODYCHAT_PUBLIC_ORIGIN}${trustedBasePaths.get(CODYCHAT_PUBLIC_ORIGIN)}`;

function baseUrlForOrigin(origin: string) {
  const trustedOrigin = validateCodyChatOrigin(origin);
  return `${trustedOrigin}${trustedBasePaths.get(trustedOrigin)}`;
}

/** Resolve only same-origin endpoints under the verified installation base path. */
export function resolveCodyEndpointUrl(path: string, origin = CODYCHAT_PUBLIC_ORIGIN) {
  const baseUrl = baseUrlForOrigin(origin);
  const trustedOrigin = validateCodyChatOrigin(origin);
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

  const url = new URL(`${normalizedSegments.join("/")}${suffix}`, baseUrl);
  if (url.origin !== trustedOrigin || !url.pathname.startsWith(new URL(baseUrl).pathname)) {
    throw new Error("CodyChat API endpoint escapes its base path");
  }
  return url.toString();
}

export function resolveCodyPublicUrl(pathOrUrl: string, origin = CODYCHAT_PUBLIC_ORIGIN) {
  const baseUrl = baseUrlForOrigin(origin);
  const value = pathOrUrl.trim();
  if (!value) return "";
  try {
    if (/^https?:\/\//iu.test(value)) {
      return isSafeCodyPublicUrl(value, origin) ? new URL(value).toString() : "";
    }
    if (value.startsWith("//")) {
      const absolute = new URL(value, baseUrl).toString();
      return isSafeCodyPublicUrl(absolute, origin) ? absolute : "";
    }
    return resolveCodyEndpointUrl(value, origin);
  } catch {
    return "";
  }
}

export function isSafeCodyPublicUrl(url: string, origin = CODYCHAT_PUBLIC_ORIGIN) {
  try {
    const parsed = new URL(url);
    const baseUrl = new URL(baseUrlForOrigin(origin));
    return (
      parsed.protocol === "https:" &&
      parsed.origin === baseUrl.origin &&
      parsed.pathname.startsWith(baseUrl.pathname)
    );
  } catch {
    return false;
  }
}
