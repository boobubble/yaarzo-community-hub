import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

import {
  codyFetch,
  cookieHeader,
  extractToken,
  isLoggedIn,
  sealSession,
  sessionCookie,
  updateCookieJar,
  validateSameOrigin,
} from "@/lib/codychat-adapter";

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

        try {
          const supabase = createClient(supabaseUrl, supabaseKey, {
            auth: {
              autoRefreshToken: false,
              persistSession: false,
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

          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("username, gender")
            .eq("id", user.id)
            .single();

          if (profileError || !profile?.username) {
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

          const bridge = await codyFetch("boom_bridge.php", {
            method: "POST",
            headers: {
              "Content-Type":
                "application/x-www-form-urlencoded; charset=UTF-8",
              "X-Yaarzo-Bridge-Secret": bridgeSecret,
            },
            body: bridgeBody,
          });

          let cookies = updateCookieJar(bridge);

          if (!bridge.ok) {
            return Response.json(
              { error: "CodyChat Bridge rejected the login." },
              { status: 502 },
            );
          }

          const bridgeResult = (await bridge.json()) as {
            authenticated?: boolean;
            username?: string;
          };

          if (!bridgeResult.authenticated || !bridgeResult.username) {
            return Response.json(
              { error: "CodyChat Bridge did not establish an account." },
              { status: 502 },
            );
          }

          const sessionPage = await codyFetch("", {
            headers: {
              Cookie: cookieHeader(cookies),
            },
          });

          cookies = updateCookieJar(sessionPage, cookies);

          const html = await sessionPage.text();
          const token = extractToken(html);

          if (!isLoggedIn(html) || !token || token === "0") {
            return Response.json(
              { error: "CodyChat did not establish a valid registered session." },
              { status: 502 },
            );
          }

          const envelope = await sealSession(
            {
              cookies,
              token,
              nickname: bridgeResult.username,
              issuedAt: Date.now(),
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
          return Response.json(
            { error: "Registered chat login is unavailable. Please try again." },
            { status: 502 },
          );
        }
      },
    },
  },
});