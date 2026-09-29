import { createFileRoute } from "@tanstack/react-router";

import { openSession, parseRequestCookie } from "@/lib/codychat-adapter";
import { resolveCodyUserByUsername } from "@/lib/server/cody-user-resolve";

export const Route = createFileRoute("/api/chat/cody-user-resolve")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const secret = process.env["YAARZO_SESSION_ENCRYPTION_KEY"];
        if (!secret) return Response.json({ error: "Chat is not configured." }, { status: 503 });

        const session = await openSession(parseRequestCookie(request), secret);
        if (!session) return Response.json({ error: "Not authenticated." }, { status: 401 });

        const username = new URL(request.url).searchParams.get("username")?.trim() ?? "";
        if (!username || username.length > 64) {
          return Response.json({ error: "Missing or invalid username." }, { status: 400 });
        }

        try {
          const member = await resolveCodyUserByUsername(session, username);
          return Response.json({ member }, { headers: { "Cache-Control": "no-store" } });
        } catch {
          return Response.json({ error: "CodyChat user lookup failed." }, { status: 502 });
        }
      },
    },
  },
});
