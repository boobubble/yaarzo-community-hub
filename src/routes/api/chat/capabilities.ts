import { createFileRoute } from "@tanstack/react-router";

import { parseCodyChatCapabilitiesFromHtml } from "@/lib/chat/cody-chat-capabilities";
import {
  codyFetch,
  cookieHeader,
  openSession,
  parseRequestCookie,
} from "@/lib/codychat-adapter";

export const Route = createFileRoute("/api/chat/capabilities")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const secret = process.env["YAARZO_SESSION_ENCRYPTION_KEY"];
        if (!secret) {
          return Response.json({ error: "Chat is not configured." }, { status: 503 });
        }
        const session = await openSession(parseRequestCookie(request), secret);
        if (!session) return Response.json({ error: "Not authenticated." }, { status: 401 });

        try {
          const response = await codyFetch("", {
            headers: { Cookie: cookieHeader(session.cookies) },
          });
          const html = await response.text();
          const capabilities = parseCodyChatCapabilitiesFromHtml(html);
          return Response.json(capabilities, { headers: { "Cache-Control": "no-store" } });
        } catch {
          return Response.json({ error: "CodyChat is unavailable." }, { status: 502 });
        }
      },
    },
  },
});
