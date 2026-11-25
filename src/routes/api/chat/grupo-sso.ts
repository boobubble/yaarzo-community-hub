import { randomUUID } from "node:crypto";
import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

import { createGrupoSsoTicket } from "@/lib/chat/grupo-sso-ticket";

const GRUPO_SSO_CONSUME_PATH = "/sso/consume.php";

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

        const supabaseUrl = process.env["VITE_SUPABASE_URL"];
        const supabaseKey = process.env["VITE_SUPABASE_ANON_KEY"];
        const ssoSecret = process.env["GRUPO_SSO_SHARED_SECRET"];
        if (!supabaseUrl || !supabaseKey || !ssoSecret || ssoSecret.length < 32) {
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

          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("username")
            .eq("id", user.id)
            .single();
          const username = typeof profile?.username === "string" ? profile.username.trim() : "";
          if (profileError || !username) {
            return jsonResponse({ error: "Yaarzo profile could not be loaded." }, 502);
          }

          const emailVerified = Boolean(user.email_confirmed_at || user.confirmed_at);
          if (!emailVerified || !user.email) {
            return jsonResponse({ error: "Verify your email before signing in to Grupo." }, 403);
          }
          if (Buffer.byteLength(username, "utf8") > 80) {
            return jsonResponse({ error: "Yaarzo username exceeds the Grupo limit." }, 400);
          }

          const now = Math.floor(Date.now() / 1000);
          const ticket = createGrupoSsoTicket(ssoSecret, {
            iss: "https://www.yaarzo.com",
            aud: "chatroom-origin.yaarzo.com",
            sub: user.id,
            jti: randomUUID(),
            email: user.email,
            email_verified: true,
            preferred_username: username,
            iat: now,
            exp: now + 60,
          });

          return jsonResponse({
            consumeUrl: GRUPO_SSO_CONSUME_PATH,
            ticket,
          });
        } catch {
          return jsonResponse({ error: "Grupo SSO is unavailable." }, 502);
        }
      },
    },
  },
});
