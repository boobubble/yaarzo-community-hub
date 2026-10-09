import { createFileRoute } from "@tanstack/react-router";

import {
  codyAjaxHeaders,
  codyFetch,
  openSession,
  parseRequestCookie,
  parseRooms,
  validateSameOrigin,
} from "@/lib/codychat-adapter";
import { buildCodyRoomJoinBody, parseCodyRoomJoinResponse } from "@/lib/chat/cody-room-join";

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
            body: new URLSearchParams({ token: session.token }),
          });
          const raw = await response.text();
          let payload: { content?: string; title?: string } | null = null;
          try {
            payload = JSON.parse(raw) as { content?: string; title?: string };
          } catch {
            // Keep the raw upstream body for server-side diagnostics only.
          }

          if (!response.ok || !payload) {
            console.error("[CodyChat rooms] unexpected upstream response", {
              status: response.status,
              contentType: response.headers.get("content-type"),
              body: raw.slice(0, 1000),
            });
            return Response.json({ error: "CodyChat room list is unavailable." }, { status: 502 });
          }

          return Response.json(
            { rooms: parseRooms(payload.content ?? ""), title: payload.title ?? "" },
            { headers: { "Cache-Control": "no-store" } },
          );
        } catch (error) {
          console.error("[CodyChat rooms] upstream request failed", {
            message: error instanceof Error ? error.message : String(error),
          });
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

        const password = input.password;
        const body = buildCodyRoomJoinBody(room, session.token, password);

        try {
          const response = await codyFetch("system/action/action_room.php", {
            method: "POST",
            headers: codyAjaxHeaders(session),
            body,
          });
          const raw = await response.text();
          const result = parseCodyRoomJoinResponse(raw, response.ok);
          if (!result.ok) {
            return Response.json(
              { error: result.error, reason: result.reason, ...(result.code !== undefined ? { code: result.code } : {}) },
              { status: result.status },
            );
          }
          return Response.json({ joined: true, room, ...(result.data !== undefined ? { data: result.data } : {}) }, { headers: { "Cache-Control": "no-store" } });
        } catch {
          return Response.json({ error: "CodyChat room change is unavailable." }, { status: 502 });
        }
      },
    },
  },
});





