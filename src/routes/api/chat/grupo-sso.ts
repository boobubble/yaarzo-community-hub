import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

import { createGrupoSsoTicket } from "@/lib/server/grupo-sso-ticket";

const GRUPO_ORIGIN_HOST = "chatroom-origin.yaarzo.com";
const GRUPO_SSO_PATH = "/sso/consume.php";
const TICKET_TTL_SECONDS = 60;

function noStoreJson(body: Record<string, unknown>, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store, max-age=0", Pragma: "no-cache" },
  });
}

function resolveGrupoReceiver() {
  const configured =
    process.env["GRUPO_SSO_CONSUME_URL"] ??
    "https://" + GRUPO_ORIGIN_HOST + GRUPO_SSO_PATH;

  let url: URL;
  try {
    url = new URL(configured);
  } catch {
    throw new Error("Invalid Grupo SSO receiver URL");
  }

  if (
    url.protocol !== "https:" ||
    url.hostname !== GRUPO_ORIGIN_HOST ||
    url.port ||
    url.username ||
    url.password ||
    url.pathname !== GRUPO_SSO_PATH ||
    url.search ||
    url.hash
  ) {
    throw new Error("Grupo SSO receiver must use the approved HTTPS endpoint");
  }

  return url.toString();
}

export const Route = createFileRoute("/api/chat/grupo-sso")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const requestOrigin = request.headers.get("origin");
        if (!requestOrigin || requestOrigin !== new URL(request.url).origin) {
          return noStoreJson({ error: "Invalid request origin." }, 403);
        }

        const authorization = request.headers.get("authorization");
        if (!authorization?.startsWith("Bearer ")) {
          return noStoreJson({ error: "Yaarzo authentication required." }, 401);
        }

        const accessToken = authorization.slice(7).trim();
        if (!accessToken || accessToken.length > 8192) {
          return noStoreJson({ error: "Yaarzo authentication required." }, 401);
        }

        const supabaseUrl = process.env["VITE_SUPABASE_URL"];
        const supabaseKey = process.env["VITE_SUPABASE_ANON_KEY"];
        const signingSecret = process.env["GRUPO_SSO_SHARED_SECRET"];
        const audience = process.env["GRUPO_SSO_AUDIENCE"] ?? GRUPO_ORIGIN_HOST;

        if (!supabaseUrl || !supabaseKey || !signingSecret) {
          return noStoreJson({ error: "Grupo SSO is not configured." }, 503);
        }

        if (new TextEncoder().encode(signingSecret).byteLength < 32) {
          return noStoreJson({ error: "Grupo SSO signing key is invalid." }, 503);
        }

        try {
          const receiverUrl = resolveGrupoReceiver();
          const supabase = createClient(supabaseUrl, supabaseKey, {
            auth: { autoRefreshToken: false, persistSession: false },
          });

          const {
            data: { user },
            error: userError,
          } = await supabase.auth.getUser(accessToken);

          if (userError || !user || user.is_anonymous) {
            return noStoreJson({ error: "A valid registered Yaarzo account is required." }, 401);
          }

          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("username")
            .eq("id", user.id)
            .maybeSingle();

          const username =
            typeof profile?.username === "string" ? profile.username.trim() : "";

          if (profileError || !username || username.length > 64 || /[\u0000-\u001f\u007f]/u.test(username)) {
            return noStoreJson({ error: "Your Yaarzo username is not ready for chat login." }, 409);
          }

          const now = Math.floor(Date.now() / 1000);
          const ticket = await createGrupoSsoTicket(
            {
              iss: "https://www.yaarzo.com",
              aud: audience,
              sub: user.id,
              preferred_username: username,
              iat: now,
              exp: now + TICKET_TTL_SECONDS,
              jti: crypto.randomUUID(),
            },
            signingSecret,
          );

          return noStoreJson({
            ok: true,
            method: "POST",
            receiverUrl,
            ticket,
            expiresIn: TICKET_TTL_SECONDS,
          });
        } catch {
          return noStoreJson({ error: "Grupo SSO could not be started." }, 503);
        }
      },
    },
  },
});
