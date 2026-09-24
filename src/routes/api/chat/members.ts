import { createFileRoute } from "@tanstack/react-router";

import {
  codyFetch,
  cookieHeader,
  openSession,
  parseMembers,
  parseRequestCookie,
} from "@/lib/codychat-adapter";

export const Route = createFileRoute("/api/chat/members")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const secret = process.env["YAARZO_SESSION_ENCRYPTION_KEY"];
        if (!secret) return Response.json({ error: "Guest member list is not configured." }, { status: 503 });
        const session = await openSession(parseRequestCookie(request), secret);
        if (!session) return Response.json({ error: "Not authenticated." }, { status: 401 });
        try {
          const roster = await codyFetch("system/panel/user_list.php", {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
              Cookie: cookieHeader(session.cookies),
              Origin: "https://chat.yaarzo.com",
              Referer: "https://chat.yaarzo.com/",
              "X-Requested-With": "XMLHttpRequest",
            },
            body: new URLSearchParams({ token: session.token }),
          });
          if (!roster.ok) return Response.json({ error: "CodyChat member list is unavailable." }, { status: 502 });
          return Response.json({ members: parseMembers(await roster.text()) }, { headers: { "Cache-Control": "no-store" } });
        } catch {
          return Response.json({ error: "CodyChat member list is unavailable." }, { status: 502 });
        }
      },
    },
  },
});