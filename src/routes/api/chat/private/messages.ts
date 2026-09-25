import { createFileRoute } from "@tanstack/react-router";

import { normalizeCodyPrivateLogs } from "@/lib/codychat-private";
import {
  codyAjaxHeaders,
  codyFetch,
  openSession,
  parseRequestCookie,
  validateSameOrigin,
} from "@/lib/codychat-adapter";

function integerParam(value: unknown, fallback = 0) {
  const n = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

export const Route = createFileRoute("/api/chat/private/messages")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const secret = process.env["YAARZO_SESSION_ENCRYPTION_KEY"];
        if (!secret) return Response.json({ error: "Chat is not configured." }, { status: 503 });
        const session = await openSession(parseRequestCookie(request), secret);
        if (!session) return Response.json({ error: "Not authenticated." }, { status: 401 });

        const url = new URL(request.url);
        const target = integerParam(url.searchParams.get("target"));
        const mode = url.searchParams.get("mode") ?? "poll";

        if (!target) return Response.json({ error: "Missing target." }, { status: 400 });

        try {
          if (mode === "history") {
            const response = await codyFetch("system/action/private_load.php", {
              method: "POST",
              headers: codyAjaxHeaders(session),
              body: new URLSearchParams({ target: String(target), token: session.token }),
            });
            const payload = await response.json();
            if (!response.ok) {
              return Response.json({ error: "Could not load private history." }, { status: 502 });
            }
            const messages = normalizeCodyPrivateLogs(payload);
            const lastId = messages.length
              ? Number.parseInt(messages[messages.length - 1]?.id ?? "0", 10)
              : 0;
            return Response.json({ messages, lastPriv: lastId }, { headers: { "Cache-Control": "no-store" } });
          }

          const lastp = integerParam(url.searchParams.get("lastp"));
          const pcount = integerParam(url.searchParams.get("pcount"));
          const body = new URLSearchParams({
            fload: "0",
            caction: "0",
            last: "0",
            priv: String(target),
            lastp: String(lastp),
            pcount: String(pcount),
            room: "0",
            notify: "0",
            curset: "0",
            token: session.token,
          });
          const response = await codyFetch("system/action/chat_log.php", {
            method: "POST",
            headers: codyAjaxHeaders(session),
            body,
          });
          const payload = (await response.json()) as {
            plogs?: unknown;
            pcount?: number;
            curp?: number;
          };
          if (!response.ok) {
            return Response.json({ error: "Private poll unavailable." }, { status: 502 });
          }
          const messages =
            payload.curp === target ? normalizeCodyPrivateLogs(payload.plogs) : [];
          return Response.json(
            {
              messages,
              pcount: payload.pcount ?? pcount,
              curp: payload.curp ?? target,
            },
            { headers: { "Cache-Control": "no-store" } },
          );
        } catch {
          return Response.json({ error: "Private messages unavailable." }, { status: 502 });
        }
      },
      POST: async ({ request }) => {
        if (!validateSameOrigin(request)) {
          return Response.json({ error: "Invalid request origin." }, { status: 403 });
        }
        const secret = process.env["YAARZO_SESSION_ENCRYPTION_KEY"];
        if (!secret) return Response.json({ error: "Chat is not configured." }, { status: 503 });
        const session = await openSession(parseRequestCookie(request), secret);
        if (!session) return Response.json({ error: "Not authenticated." }, { status: 401 });

        let input: { target?: number; content?: string; quote?: string | number };
        try {
          input = (await request.json()) as { target?: number; content?: string; quote?: string | number };
        } catch {
          return Response.json({ error: "Invalid message." }, { status: 400 });
        }
        const target = integerParam(input.target);
        const content = String(input.content ?? "").trim();
        if (!target || !content || content.length > 5000) {
          return Response.json({ error: "Invalid private message." }, { status: 400 });
        }

        try {
          const response = await codyFetch("system/action/private_process.php", {
            method: "POST",
            headers: codyAjaxHeaders(session),
            body: new URLSearchParams({
              target: String(target),
              content,
              quote: input.quote == null ? "0" : String(input.quote).slice(0, 64),
              token: session.token,
            }),
          });
          const payload = (await response.json()) as { code?: number; log?: unknown };
          if (!response.ok || payload.code !== 1) {
            return Response.json(
              { error: "Private message rejected.", code: payload.code ?? 0 },
              { status: 400 },
            );
          }
          const messages = normalizeCodyPrivateLogs(payload.log);
          return Response.json({ sent: true, messages }, { headers: { "Cache-Control": "no-store" } });
        } catch {
          return Response.json({ error: "Private send unavailable." }, { status: 502 });
        }
      },
    },
  },
});
