import { createHmac, randomUUID } from "node:crypto";
import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

const GRUPO_SSO_CONSUME_URL = "https://chatroom-origin.yaarzo.com/sso/consume.php";
const GRUPO_SSO_ISSUER = "https://www.yaarzo.com";
const GRUPO_SSO_AUDIENCE = "chatroom-origin.yaarzo.com";

function jsonResponse(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export const Route = createFileRoute("/api/chat/grupo-live-sso")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (request.headers.get("origin") !== new URL(request.url).origin) {
          return jsonResponse({ error: "Invalid request origin." }, 403);
        }

        const secret = process.env["GRUPO_SSO_SHARED_SECRET"];
        const supabaseUrl = process.env["VITE_SUPABASE_URL"];
        const supabaseKey = process.env["VITE_SUPABASE_ANON_KEY"];

        if (!secret || secret.length < 32 || !supabaseUrl || !supabaseKey) {
          return jsonResponse({ error: "Live Grupo SSO is not configured." }, 503);
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

          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("username, display_name")
            .eq("id", user.id)
            .single();

          const username = typeof profile?.username === "string" ? profile.username.trim() : "";
          if (profileError || !username) {
            return jsonResponse({ error: "Yaarzo profile could not be loaded." }, 502);
          }

          const now = Math.floor(Date.now() / 1000);
          const claims = {
            iss: GRUPO_SSO_ISSUER,
            aud: GRUPO_SSO_AUDIENCE,
            sub: user.id,
            jti: randomUUID(),
            iat: now,
            exp: now + 60,
            preferred_username: username,
            display_name:
              typeof profile.display_name === "string" && profile.display_name.trim()
                ? profile.display_name.trim()
                : username,
            email: user.email || "",
            email_verified: Boolean(user.email_confirmed_at || user.confirmed_at),
          };

          const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
          const payload = Buffer.from(JSON.stringify(claims)).toString("base64url");
          const signingInput = `${header}.${payload}`;
          const signature = createHmac("sha256", secret).update(signingInput).digest("base64url");
          const ticket = `${signingInput}.${signature}`;

          return jsonResponse({
            bridgeUrl: GRUPO_SSO_CONSUME_URL,
            ticket,
            redirect: "/",
          });
        } catch {
          return jsonResponse({ error: "Live Grupo SSO is unavailable." }, 502);
        }
      },
    },
  },
});
