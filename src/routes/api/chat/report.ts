import { createFileRoute } from "@tanstack/react-router";

import { CODY_CHAT_REPORT_REASONS, isValidCodyReportReason } from "@/lib/chat/cody-report";
import {
  codyAjaxHeaders,
  codyFetch,
  openSession,
  parseRequestCookie,
  validateSameOrigin,
} from "@/lib/codychat-adapter";
import { isCodyLogId } from "@/lib/chat/cody-public-quote";

export const Route = createFileRoute("/api/chat/report")({
  server: {
    handlers: {
      GET: async () => {
        return Response.json({ reasons: CODY_CHAT_REPORT_REASONS });
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

        let input: { postId?: string | number; reason?: number };
        try {
          input = (await request.json()) as { postId?: string | number; reason?: number };
        } catch {
          return Response.json({ error: "Invalid report." }, { status: 400 });
        }

        const postId = String(input.postId ?? "").trim();
        const reason = Number(input.reason);
        if (!isCodyLogId(postId) || !isValidCodyReportReason(reason)) {
          return Response.json({ error: "Invalid report." }, { status: 400 });
        }

        try {
          const response = await codyFetch("system/action/action_report.php", {
            method: "POST",
            headers: codyAjaxHeaders(session),
            body: new URLSearchParams({
              send_report: "1",
              type: "1",
              report: postId,
              reason: String(reason),
              token: session.token,
            }),
          });

          const payload = (await response.json()) as {
            code?: number;
            emessage?: string;
            etype?: string;
          };

          if (!response.ok) {
            return Response.json({ error: "Report could not be sent." }, { status: 502 });
          }

          if (payload.code !== 1) {
            return Response.json(
              { error: payload.emessage ?? "Report was not accepted.", code: payload.code ?? 0 },
              { status: 400 },
            );
          }

          return Response.json({ reported: true }, { headers: { "Cache-Control": "no-store" } });
        } catch {
          return Response.json({ error: "Report service is unavailable." }, { status: 502 });
        }
      },
    },
  },
});
