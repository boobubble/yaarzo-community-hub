export type GrupoSsoClaims = {
  iss: string;
  aud: string;
  sub: string;
  preferred_username: string;
  iat: number;
  exp: number;
  jti: string;
};

function base64UrlEncode(value: string | Uint8Array) {
  const bytes = typeof value === "string" ? new TextEncoder().encode(value) : value;
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/u, "");
}

/**
 * Signs a short-lived HS256 assertion for the Grupo receiver.
 * The receiver MUST validate the signature, issuer, audience, expiry and jti,
 * and atomically reject a jti that has already been consumed.
 */
export async function createGrupoSsoTicket(
  claims: GrupoSsoClaims,
  secret: string,
): Promise<string> {
  if (new TextEncoder().encode(secret).byteLength < 32) {
    throw new Error("GRUPO_SSO_SHARED_SECRET must contain at least 32 bytes");
  }

  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64UrlEncode(JSON.stringify(claims));
  const signingInput = header + "." + payload;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(signingInput),
  );

  return signingInput + "." + base64UrlEncode(new Uint8Array(signature));
}
