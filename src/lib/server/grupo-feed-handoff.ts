import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyFeedRenewal(state: string, secret: string, audience: string, uuid: string) {
  if (state.length > 8192 || state.split(".").length !== 2) throw new Error("Invalid renewal");
  const [encoded, signature] = state.split(".") as [string, string];
  const expected = createHmac("sha256", secret).update(encoded).digest();
  const actual = Buffer.from(signature, "base64url");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
    throw new Error("Invalid renewal");
  const claims = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
  const now = Math.floor(Date.now() / 1000);
  if (
    claims.sub !== uuid ||
    claims.aud !== `feed-renew:${audience}` ||
    !Number.isInteger(claims.iat) ||
    !Number.isInteger(claims.exp) ||
    claims.exp <= now ||
    claims.iat > now + 30 ||
    claims.iat < now - 120 ||
    claims.exp - claims.iat > 120 ||
    !/^[A-Za-z0-9_-]{22,128}$/u.test(claims.nonce) ||
    !/^[a-f0-9]{64}$/u.test(claims.binding)
  )
    throw new Error("Invalid renewal");
  const redirect =
    typeof claims.return === "string" &&
    /^\/(?!\/)/u.test(claims.return) &&
    !Array.from(claims.return as string).some(
      (char) => char === "\\" || char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127,
    )
      ? claims.return
      : "/";
  return { nonce: String(claims.nonce), redirect };
}

export async function depositFeedHandoff(
  bridgeUrl: string,
  secret: string,
  assertion: string,
  accessToken: string,
  renewal = "",
  operation = "",
  scope = "",
) {
  const url = new URL("/feed_handoff/", bridgeUrl);
  if (url.protocol !== "https:") throw new Error("HTTPS required");
  const message = `feed-handoff-v1\n${assertion}\n${accessToken}\n${renewal}\n${operation}\n${scope}`;
  const response = await fetch(url, {
    method: "POST",
    redirect: "error",
    signal: AbortSignal.timeout(15000),
    headers: {
      "Content-Type": "application/json",
      "X-Yaarzo-Signature": createHmac("sha256", secret).update(message).digest("hex"),
    },
    body: JSON.stringify({ assertion, access_token: accessToken, renewal, operation, scope }),
  });
  if (!response.ok || (await response.json()).ok !== true)
    throw new Error("Feed handoff unavailable");
}
