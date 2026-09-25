import { createFileRoute } from "@tanstack/react-router";

import {
  codyFetch,
  cookieHeader,
  openSession,
  parseRequestCookie,
  validateSameOrigin,
} from "@/lib/codychat-adapter";
import { parseCodyChatCapabilitiesFromHtml } from "@/lib/chat/cody-chat-capabilities";

export const Route = createFileRoute("/api/chat/upload")({
  server: {
    handlers: {
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

        const incoming = await request.formData();
        const file = incoming.get("file");
        if (!(file instanceof File) || file.size <= 0) {
          return Response.json({ error: "Choose a file to upload." }, { status: 400 });
        }

        try {
          const page = await codyFetch("", {
            headers: { Cookie: cookieHeader(session.cookies) },
          });
          const html = await page.text();
          const caps = parseCodyChatCapabilitiesFromHtml(html);
          if (!caps.canUploadChat) {
            return Response.json(
              { error: "File uploads are not available for your account." },
              { status: 403 },
            );
          }

          const fileMb = file.size / 1024 / 1024;
          if (fileMb > caps.fileMaxMb) {
            return Response.json(
              { error: `File is too large. Maximum size is ${caps.fileMaxMb} MB.` },
              { status: 400 },
            );
          }

          const forward = new FormData();
          forward.append("file", file, file.name);
          forward.append("token", session.token);

          const response = await codyFetch("system/action/file_chat.php", {
            method: "POST",
            headers: {
              Cookie: cookieHeader(session.cookies),
              Origin: "https://chat.yaarzo.com",
              Referer: "https://chat.yaarzo.com/",
              "X-Requested-With": "XMLHttpRequest",
            },
            body: forward,
          });

          const raw = await response.text();
          let payload: { code?: number; logs?: unknown; emessage?: string } | null = null;
          try {
            payload = JSON.parse(raw) as { code?: number; logs?: unknown; emessage?: string };
          } catch {
            payload = null;
          }

          if (!response.ok || !payload) {
            return Response.json({ error: "CodyChat upload failed." }, { status: 502 });
          }

          if (payload.code !== 5) {
            return Response.json(
              {
                error: payload.emessage ?? "CodyChat rejected the upload.",
                code: payload.code ?? 0,
              },
              { status: 400 },
            );
          }

          return Response.json(
            { uploaded: true, code: payload.code, log: payload.logs ?? null },
            { headers: { "Cache-Control": "no-store" } },
          );
        } catch {
          return Response.json({ error: "CodyChat upload is unavailable." }, { status: 502 });
        }
      },
    },
  },
});
