import { createHmac, randomBytes, randomUUID } from "node:crypto";
import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

import { depositFeedHandoff, verifyFeedRenewal } from "@/lib/server/grupo-feed-handoff";

const GRUPO_BRIDGE_URL = "https://grupo-test.yaarzo.com/supabase_bridge/";
const GRUPO_SSO_CONSUME_URL = "https://chatroom-origin.yaarzo.com/sso/consume.php";

function jsonResponse(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export const Route = createFileRoute("/api/chat/grupo-sso")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (request.headers.get("origin") !== new URL(request.url).origin) {
          return jsonResponse({ error: "Invalid request origin." }, 403);
        }

        const secret = process.env["GRUPO_SUPABASE_BRIDGE_SECRET"];
        const ssoSecret = process.env["GRUPO_SSO_SHARED_SECRET"];
        const supabaseUrl = process.env["VITE_SUPABASE_URL"];
        const supabaseKey = process.env["VITE_SUPABASE_ANON_KEY"];

        if (
          !secret || secret.length < 32 ||
          !ssoSecret || ssoSecret.length < 32 ||
          !supabaseUrl || !supabaseKey
        ) {
          return jsonResponse({ error: "Grupo SSO is not configured." }, 503);
        }

        const authorization = request.headers.get("authorization");
        if (!authorization?.startsWith("Bearer ")) {
          return jsonResponse({ error: "Authentication required." }, 401);
        }

        const accessToken = authorization.slice(7).trim();
        if (!accessToken) {
          return jsonResponse({ error: "Authentication required." }, 401);
        }

        try {
          const supabase = createClient(supabaseUrl, supabaseKey, {
            auth: { autoRefreshToken: false, persistSession: false },
            global: { headers: { Authorization: `Bearer ${accessToken}` } },
          });

          const {
            data: { user },
            error: userError,
          } = await supabase.auth.getUser(accessToken);

          if (userError || !user || user.is_anonymous) {
            return jsonResponse({ error: "Invalid or expired Yaarzo session." }, 401);
          }

          const body = request.headers.get("content-type")?.includes("application/json")
            ? await request.json()
            : {};
          if (
            !body ||
            typeof body !== "object" ||
            Object.keys(body).some((key) => !["renewal", "operation", "scope"].includes(key)) ||
            (body.renewal !== undefined && typeof body.renewal !== "string")
          )
            return jsonResponse({ error: "Invalid handoff request." }, 400);
          const audience = process.env["GRUPO_SUPABASE_BRIDGE_AUDIENCE"] || "grupo-test.yaarzo.com";
          const now = Math.floor(Date.now() / 1000);
          const sign = (claims: object) => {
            const encoded = Buffer.from(JSON.stringify(claims)).toString("base64url");
            return `${encoded}.${createHmac("sha256", secret).update(encoded).digest("base64url")}`;
          };
          if (body.operation === "revoke") {
            if (!["global", "local"].includes(body.scope))
              return jsonResponse({ error: "Invalid scope." }, 400);
            await depositFeedHandoff(
              GRUPO_BRIDGE_URL,
              secret,
              sign({
                sub: user.id,
                aud: audience,
                iat: now,
                exp: now + 60,
                nonce: randomBytes(24).toString("base64url"),
                operation: "revoke",
              }),
              accessToken,
              "",
              "revoke",
              body.scope,
            );
            return jsonResponse({ ok: true });
          }
          if (body.operation !== undefined)
            return jsonResponse({ error: "Invalid operation." }, 400);
          const renewal = body.renewal
            ? verifyFeedRenewal(body.renewal, secret, audience, user.id)
            : null;

          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("username, display_name")
            .eq("id", user.id)
            .single();

          const username = typeof profile?.username === "string" ? profile.username.trim() : "";
          if (profileError || !username) {
            return jsonResponse({ error: "Yaarzo profile could not be loaded." }, 502);
          }

          const email = typeof user.email === "string" ? user.email.trim().toLowerCase() : "";
          const emailVerified = Boolean(user.email_confirmed_at || user.confirmed_at);
          if (!renewal && !emailVerified) {
            return jsonResponse({ error: "Verify your email before entering Grupo chat." }, 403);
          }
          if (!renewal && Buffer.byteLength(username, "utf8") > 80) {
            return jsonResponse({ error: "Your Yaarzo username is too long for Grupo." }, 422);
          }

          const payload = {
            sub: user.id,
            aud: process.env["GRUPO_SUPABASE_BRIDGE_AUDIENCE"] || "grupo-test.yaarzo.com",
            iat: now,
            exp: now + 60,
            nonce: randomBytes(24).toString("base64url"),
            preferred_username: username,
            display_name:
              typeof profile.display_name === "string" && profile.display_name.trim()
                ? profile.display_name.trim()
                : username,
            email: user.email || "",
            email_verified: Boolean(user.email_confirmed_at || user.confirmed_at),
          };

          let ticket: string | undefined;
          if (!renewal) {
            const jwtHeader = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
            const jwtClaims = Buffer.from(JSON.stringify({
              iss: "https://www.yaarzo.com",
              aud: "chatroom-origin.yaarzo.com",
              sub: user.id,
              jti: randomUUID(),
              email,
              email_verified: emailVerified,
              preferred_username: username,
              iat: now,
              exp: now + 60,
            })).toString("base64url");
            const signingInput = `${jwtHeader}.${jwtClaims}`;
            const signature = createHmac("sha256", ssoSecret).update(signingInput).digest("base64url");
            ticket = `${signingInput}.${signature}`;
          }

          const feedPayload = {
            ...payload,
            feed_grant: true,
            ...(renewal ? { renewal_nonce: renewal.nonce } : {}),
          };
          let assertion = sign(feedPayload);
          let feedHandoff = true;
          try {
            await depositFeedHandoff(
              GRUPO_BRIDGE_URL,
              secret,
              assertion,
              accessToken,
              body.renewal || "",
            );
          } catch {
            // Keep ordinary Grupo login available if the optional Feed handoff fails.
            if (renewal) return jsonResponse({ error: "Feed renewal unavailable." }, 502);
            assertion = sign(payload);
            feedHandoff = false;
          }
          if (renewal) {
            // Keep the existing Feed renewal protocol on its legacy bridge endpoint.
            return jsonResponse({
              bridgeUrl: GRUPO_BRIDGE_URL,
              assertion,
              redirect: renewal.redirect,
              feedHandoff,
            });
          }

          return jsonResponse({
            consumeUrl: GRUPO_SSO_CONSUME_URL,
            ticket,
            feedHandoff,
          });
        } catch {
          return jsonResponse({ error: "Grupo test login is unavailable." }, 502);
        }
      },
    },
  },
});
