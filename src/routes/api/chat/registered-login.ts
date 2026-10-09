import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

import {
  CODYCHAT_BASE_URL,
  CODYCHAT_ORIGIN,
  codyFetch,
  cookieHeader,
  extractToken,
  isLoggedIn,
  sealSession,
  sessionCookie,
  updateCookieJar,
  validateSameOrigin,
} from "@/lib/codychat-adapter";

function logRegisteredLoginFailure(stage: string, upstreamStatus?: number) {
  console.error("CodyChat registered login failed", {
    stage,
    ...(upstreamStatus ? { upstreamStatus } : {}),
  });
}

export const Route = createFileRoute("/api/chat/registered-login")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!validateSameOrigin(request)) {
          return Response.json(
            { error: "Invalid request origin." },
            { status: 403 },
          );
        }

        const sessionSecret = process.env["YAARZO_SESSION_ENCRYPTION_KEY"];
        const bridgeSecret = process.env["YAARZO_CODY_BRIDGE_SECRET"];
        const supabaseUrl = process.env["VITE_SUPABASE_URL"];
        const supabaseKey = process.env["VITE_SUPABASE_ANON_KEY"];

        if (!sessionSecret || !bridgeSecret || !supabaseUrl || !supabaseKey) {
          return Response.json(
            { error: "Registered chat login is not configured." },
            { status: 503 },
          );
        }

        const authorization = request.headers.get("authorization");

        if (!authorization?.startsWith("Bearer ")) {
          return Response.json(
            { error: "Authentication required." },
            { status: 401 },
          );
        }

        const accessToken = authorization.slice(7).trim();

        if (!accessToken) {
          return Response.json(
            { error: "Authentication required." },
            { status: 401 },
          );
        }

        let stage = "supabase_user_validation";
        let upstreamStatus: number | undefined;

        try {
          const supabase = createClient(supabaseUrl, supabaseKey, {
            auth: {
              autoRefreshToken: false,
              persistSession: false,
            },
            global: {
              headers: { Authorization: `Bearer ${accessToken}` },
            },
          });

          const {
            data: { user },
            error: userError,
          } = await supabase.auth.getUser(accessToken);

          if (userError || !user) {
            return Response.json(
              { error: "Invalid or expired Yaarzo session." },
              { status: 401 },
            );
          }

          stage = "supabase_profile_lookup";
          const {
            data: profile,
            error: profileError,
            status: profileStatus,
          } = await supabase
            .from("profiles")
            .select("username, gender")
            .eq("id", user.id)
            .single();

          if (profileError || !profile?.username) {
            logRegisteredLoginFailure(stage, profileStatus);
            return Response.json(
              { error: "Yaarzo profile could not be loaded." },
              { status: 502 },
            );
          }

          const gender =
            profile.gender === "male" || profile.gender === "1"
              ? "male"
              : profile.gender === "female" || profile.gender === "2"
                ? "female"
                : "other";

          const bridgeBody = new URLSearchParams({
            id: user.id,
            name: String(profile.username).slice(0, 64),
            gender,
          });

          stage = "codychat_bridge_request";
          const bridge = await codyFetch("boom_bridge.php", {
            method: "POST",
            headers: {
              "Content-Type":
                "application/x-www-form-urlencoded; charset=UTF-8",
              "X-Yaarzo-Bridge-Secret": bridgeSecret,
              Origin: CODYCHAT_ORIGIN,
              Referer: CODYCHAT_BASE_URL,
            },
            body: bridgeBody,
          });
          upstreamStatus = bridge.status;

          let cookies = updateCookieJar(bridge);

          if (!bridge.ok) {
            logRegisteredLoginFailure(stage, upstreamStatus);
            return Response.json(
              { error: "CodyChat Bridge rejected the login." },
              { status: 502 },
            );
          }

          stage = "codychat_bridge_response";
          const bridgeResult = (await bridge.json()) as {
            authenticated?: boolean;
            username?: string;
          };

          if (!bridgeResult.authenticated || !bridgeResult.username) {
            logRegisteredLoginFailure(stage, upstreamStatus);
            return Response.json(
              { error: "CodyChat Bridge did not establish an account." },
              { status: 502 },
            );
          }

          stage = "codychat_session_request";
          const sessionPage = await codyFetch("", {
            headers: {
              Cookie: cookieHeader(cookies),
            },
          });
          upstreamStatus = sessionPage.status;

          cookies = updateCookieJar(sessionPage, cookies);

          const html = await sessionPage.text();
          const token = extractToken(html);

          if (!isLoggedIn(html) || !token || token === "0") {
            logRegisteredLoginFailure("codychat_session_validation", upstreamStatus);
            return Response.json(
              { error: "CodyChat did not establish a valid registered session." },
              { status: 502 },
            );
          }

          stage = "session_encryption";
          const envelope = await sealSession(
            {
              cookies,
              token,
              nickname: bridgeResult.username,
              issuedAt: Date.now(),
              yaarzoUserId: user.id,
            },
            sessionSecret,
          );

          return Response.json(
            {
              authenticated: true,
              registered: {
                nickname: bridgeResult.username,
              },
            },
            {
              headers: {
                "Cache-Control": "no-store",
                "Set-Cookie": sessionCookie(envelope),
              },
            },
          );
        } catch {
          logRegisteredLoginFailure(stage, upstreamStatus);
          return Response.json(
            { error: "Registered chat login is unavailable. Please try again." },
            { status: 502 },
          );
        }
      },
    },
  },
});
