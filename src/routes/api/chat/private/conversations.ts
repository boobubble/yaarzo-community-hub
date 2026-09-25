import { createFileRoute } from "@tanstack/react-router";

import { parsePrivateNotifyHtml } from "@/lib/codychat-private";
import {
  codyAjaxHeaders,
  codyFetch,
  openSession,
  parseRequestCookie,
} from "@/lib/codychat-adapter";

export const Route = createFileRoute("/api/chat/private/conversations")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const secret = process.env["YAARZO_SESSION_ENCRYPTION_KEY"];
        if (!secret) return Response.json({ error: "Chat is not configured." }, { status: 503 });
        const session = await openSession(parseRequestCookie(request), secret);
        if (!session) return Response.json({ error: "Not authenticated." }, { status: 401 });

        try {
          const response = await codyFetch("system/float/private_notify.php", {
            method: "POST",
            headers: codyAjaxHeaders(session),
            body: new URLSearchParams({ token: session.token }),
          });
          const html = await response.text();
          if (!response.ok) {
            return Response.json({ error: "Private conversations unavailable." }, { status: 502 });
          }
          const conversations = parsePrivateNotifyHtml(html);
          return Response.json({ conversations }, { headers: { "Cache-Control": "no-store" } });
        } catch {
          return Response.json({ error: "Private conversations unavailable." }, { status: 502 });
        }
      },
    },
  },
});
