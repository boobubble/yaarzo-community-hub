import { createFileRoute } from "@tanstack/react-router";

import {
  codyAjaxHeaders,
  codyFetch,
  openSession,
  parseRequestCookie,
  parseRooms,
  validateSameOrigin,
} from "@/lib/codychat-adapter";

export const Route = createFileRoute("/api/chat/rooms")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const secret = process.env["YAARZO_SESSION_ENCRYPTION_KEY"];
        if (!secret) return Response.json({ error: "Chat rooms are not configured." }, { status: 503 });
        const session = await openSession(parseRequestCookie(request), secret);
        if (!session) return Response.json({ error: "Not authenticated." }, { status: 401 });
        try {
          const response = await codyFetch("system/panel/room_list.php", {
            method: "POST",
            headers: codyAjaxHeaders(session),
            body: new URLSearchParams(),
          });
          if (!response.ok) return Response.json({ error: "CodyChat room list is unavailable." }, { status: 502 });
          const payload = (await response.json()) as { content?: string; title?: string };
          return Response.json(
            { rooms: parseRooms(payload.content ?? ""), title: payload.title ?? "" },
            { headers: { "Cache-Control": "no-store" } },
          );
        } catch {
          return Response.json({ error: "CodyChat room list is unavailable." }, { status: 502 });
        }
      },
      POST: async ({ request }) => {
        if (!validateSameOrigin(request)) return Response.json({ error: "Invalid request origin." }, { status: 403 });
        const secret = process.env["YAARZO_SESSION_ENCRYPTION_KEY"];
        if (!secret) return Response.json({ error: "Chat rooms are not configured." }, { status: 503 });
        const session = await openSession(parseRequestCookie(request), secret);
        if (!session) return Response.json({ error: "Not authenticated." }, { status: 401 });

        let input: { room?: number; password?: string };
        try {
          input = (await request.json()) as { room?: number; password?: string };
        } catch {
          return Response.json({ error: "Invalid room request." }, { status: 400 });
        }
        const room = Number(input.room);
        if (!Number.isInteger(room) || room <= 0) return Response.json({ error: "Invalid room." }, { status: 400 });

        const body = new URLSearchParams({ room: String(room) });
        if (input.password) {
          body.set("pass", input.password.slice(0, 128));
          body.set("join_room_pass", "1");
        } else {
          body.set("join_room", "1");
        }

        try {
          const response = await codyFetch("system/action/action_room.php", {
            method: "POST",
            headers: codyAjaxHeaders(session),
            body,
          });
          const payload = (await response.json()) as { code?: number; data?: unknown };
          if (payload.code !== 10) {
            return Response.json(
              { error: payload.code === 5 ? "Incorrect room password." : "CodyChat rejected the room change.", code: payload.code ?? 0 },
              { status: 400 },
            );
          }
          return Response.json({ joined: true, room, data: payload.data }, { headers: { "Cache-Control": "no-store" } });
        } catch {
          return Response.json({ error: "CodyChat room change is unavailable." }, { status: 502 });
        }
      },
    },
  },
});
