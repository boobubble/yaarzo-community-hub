import { createFileRoute } from "@tanstack/react-router";

import {
  codyAjaxHeaders,
  codyFetch,
  openSession,
  parseRequestCookie,
  validateSameOrigin,
} from "@/lib/codychat-adapter";

function integerParam(url: URL, name: string, fallback = 0) {
  const value = Number.parseInt(url.searchParams.get(name) ?? "", 10);
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

export const Route = createFileRoute("/api/chat/messages")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const secret = process.env["YAARZO_SESSION_ENCRYPTION_KEY"];
        if (!secret) return Response.json({ error: "Public chat is not configured." }, { status: 503 });
        const session = await openSession(parseRequestCookie(request), secret);
        if (!session) return Response.json({ error: "Not authenticated." }, { status: 401 });

        const url = new URL(request.url);
        const body = new URLSearchParams({
          fload: String(integerParam(url, "fload")),
          caction: String(integerParam(url, "caction")),
          last: String(integerParam(url, "last")),
          priv: String(integerParam(url, "priv")),
          lastp: String(integerParam(url, "lastp")),
          pcount: String(integerParam(url, "pcount")),
          room: String(integerParam(url, "room")),
          notify: String(integerParam(url, "notify")),
          curset: String(integerParam(url, "curset")),
        });

        try {
          const response = await codyFetch("system/action/chat_log.php", {
            method: "POST",
            headers: codyAjaxHeaders(session),
            body,
          });
          if (!response.ok) return Response.json({ error: "CodyChat messages are unavailable." }, { status: 502 });
          const payload = await response.json();
          return Response.json(payload, { headers: { "Cache-Control": "no-store" } });
        } catch {
          return Response.json({ error: "CodyChat messages are unavailable." }, { status: 502 });
        }
      },
      POST: async ({ request }) => {
        if (!validateSameOrigin(request)) return Response.json({ error: "Invalid request origin." }, { status: 403 });
        const secret = process.env["YAARZO_SESSION_ENCRYPTION_KEY"];
        if (!secret) return Response.json({ error: "Public chat is not configured." }, { status: 503 });
        const session = await openSession(parseRequestCookie(request), secret);
        if (!session) return Response.json({ error: "Not authenticated." }, { status: 401 });

        let input: { content?: string; quote?: string | number | null };
        try {
          input = (await request.json()) as { content?: string; quote?: string | number | null };
        } catch {
          return Response.json({ error: "Invalid message." }, { status: 400 });
        }
        const content = String(input.content ?? "").trim();
        if (!content || content.length > 5000) return Response.json({ error: "Message must be between 1 and 5000 characters." }, { status: 400 });

        try {
          const response = await codyFetch("system/action/chat_process.php", {
            method: "POST",
            headers: codyAjaxHeaders(session),
            body: new URLSearchParams({
              content,
              quote: input.quote == null ? "0" : String(input.quote).slice(0, 64),
            }),
          });
          const payload = (await response.json()) as { code?: number; log?: unknown };
          if (payload.code !== 1) {
            return Response.json({ error: "CodyChat rejected the message.", code: payload.code ?? 0 }, { status: 400 });
          }
          return Response.json({ sent: true, log: payload.log ?? "" }, { headers: { "Cache-Control": "no-store" } });
        } catch {
          return Response.json({ error: "CodyChat message send is unavailable." }, { status: 502 });
        }
      },
    },
  },
});
