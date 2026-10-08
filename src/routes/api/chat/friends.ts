import { createFileRoute } from "@tanstack/react-router";

import { isValidCodyFriendAction, type CodyFriendAction } from "@/lib/chat/cody-friends";
import { openSession, parseRequestCookie, validateSameOrigin } from "@/lib/codychat-adapter";
import {
  loadCodyFriendsSnapshot,
  resolveCodyTargetId,
  runCodyFriendAction,
} from "@/lib/server/cody-friends-service";

export const Route = createFileRoute("/api/chat/friends")({
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
          const snapshot = await loadCodyFriendsSnapshot(session);
          return Response.json(snapshot, { headers: { "Cache-Control": "no-store" } });
        } catch {
          return Response.json({ error: "Friends list is unavailable." }, { status: 502 });
        }
      },
      POST: async ({ request }) => {
        if (!validateSameOrigin(request)) {
          return Response.json({ error: "Invalid request origin." }, { status: 403 });
        }
        const secret = process.env["YAARZO_SESSION_ENCRYPTION_KEY"];
        if (!secret) {
          return Response.json({ error: "Chat is not configured." }, { status: 503 });
        }
        const session = await openSession(parseRequestCookie(request), secret);
        if (!session) return Response.json({ error: "Not authenticated." }, { status: 401 });

        let body: {
          action?: CodyFriendAction;
          codyUserId?: string | undefined;
          yaarzoUserId?: string | undefined;
        };
        try {
          body = (await request.json()) as typeof body;
        } catch {
          return Response.json({ error: "Invalid request." }, { status: 400 });
        }

        const action = body.action;
        if (!action || !isValidCodyFriendAction(action)) {
          return Response.json({ error: "Invalid action." }, { status: 400 });
        }

        const targetCodyUserId = await resolveCodyTargetId(session, {
          codyUserId: body.codyUserId,
          yaarzoUserId: body.yaarzoUserId,
        });
        if (!targetCodyUserId) {
          return Response.json({ error: "User could not be resolved for CodyChat." }, { status: 400 });
        }

        const result = await runCodyFriendAction(session, action, targetCodyUserId);
        if (!result.ok) {
          return Response.json({ error: result.error, code: result.code ?? 0 }, { status: 400 });
        }
        return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
      },
    },
  },
});
