import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";

import { createGrupoSsoTicket } from "@/lib/chat/grupo-sso-ticket";

describe("createGrupoSsoTicket", () => {
  it("creates an HS256 JWT ticket with the supplied claims", () => {
    const secret = "test-only-secret-with-at-least-32-characters";
    const claims = {
      iss: "https://www.yaarzo.com",
      aud: "chatroom-origin.yaarzo.com",
      sub: "user-123",
      jti: "one-time-ticket-id",
      iat: 1_800_000_000,
      exp: 1_800_000_060,
    };

    const ticket = createGrupoSsoTicket(secret, claims);
    const [header, payload, signature] = ticket.split(".");
    const signingInput = `${header}.${payload}`;
    const expectedSignature = createHmac("sha256", secret)
      .update(signingInput)
      .digest("base64url");

    expect(ticket.split(".")).toHaveLength(3);
    expect(JSON.parse(Buffer.from(header!, "base64url").toString("utf8"))).toEqual({
      alg: "HS256",
      typ: "JWT",
    });
    expect(JSON.parse(Buffer.from(payload!, "base64url").toString("utf8"))).toEqual(claims);
    expect(signature).toBe(expectedSignature);
  });
});
