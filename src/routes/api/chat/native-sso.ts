import { createHmac } from "node:crypto";

import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

function base64Url(value: string | Buffer) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export const Route = createFileRoute("/api/chat/native-sso")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["YAARZO_CODY_BRIDGE_SECRET"];
        const supabaseUrl = process.env["VITE_SUPABASE_URL"];
        const supabaseKey = process.env["VITE_SUPABASE_ANON_KEY"];

        if (!secret || !supabaseUrl || !supabaseKey) {
          return Response.json(
            { error: "Native chat SSO is not configured." },
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

        try {
          const supabase = createClient(supabaseUrl, supabaseKey, {
            auth: {
              autoRefreshToken: false,
              persistSession: false,
            },
          });

          const {
            data: { user },
            error,
          } = await supabase.auth.getUser(accessToken);

          if (error || !user) {
            return Response.json(
              { error: "Invalid Yaarzo session." },
              { status: 401 },
            );
          }

          const { data: profile } = await supabase
            .from("profiles")
            .select("username, gender")
            .eq("id", user.id)
            .single();

          if (!profile?.username) {
            return Response.json(
              { error: "Yaarzo profile not found." },
              { status: 404 },
            );
          }

          const gender =
            profile.gender === "male" || profile.gender === "1"
              ? "male"
              : profile.gender === "female" || profile.gender === "2"
                ? "female"
                : "other";

          const payload = {
            sub: user.id,
            username: String(profile.username).slice(0, 50),
            gender,
            exp: Math.floor(Date.now() / 1000) + 60,
          };

          const encodedPayload = base64Url(JSON.stringify(payload));

          const signature = createHmac("sha256", secret)
            .update(encodedPayload)
            .digest("base64")
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=+$/g, "");

          const token = `${encodedPayload}.${signature}`;

          return Response.json(
            {
              url: `https://chat.yaarzo.com/chatroom/yaarzo-sso.php?token=${encodeURIComponent(token)}`,
            },
            {
              headers: {
                "Cache-Control": "no-store",
              },
            },
          );
        } catch {
          return Response.json(
            { error: "Native chat login failed." },
            { status: 502 },
          );
        }
      },
    },
  },
});