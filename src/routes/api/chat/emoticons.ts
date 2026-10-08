import { createFileRoute } from "@tanstack/react-router";

import {
  parseEmoticonPackHtml,
  parseEmoticonPackIdsFromChatHtml,
} from "@/lib/chat/cody-emoticon";
import {
  codyAjaxHeaders,
  codyFetch,
  cookieHeader,
  openSession,
  parseRequestCookie,
  type CodySession,
} from "@/lib/codychat-adapter";

async function loadPack(session: CodySession, packId: string) {
  const response = await codyFetch("system/action/emoticon.php", {
    method: "POST",
    headers: codyAjaxHeaders(session),
    body: new URLSearchParams({
      get_emo: packId,
      type: "1",
      token: session.token,
    }),
  });
  const html = await response.text();
  if (!response.ok) {
    throw new Error("Emoticon pack unavailable.");
  }
  return parseEmoticonPackHtml(html, packId);
}

export const Route = createFileRoute("/api/chat/emoticons")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const secret = process.env["YAARZO_SESSION_ENCRYPTION_KEY"];
        if (!secret) {
          return Response.json({ error: "Chat is not configured." }, { status: 503 });
        }
        const session = await openSession(parseRequestCookie(request), secret);
        if (!session) return Response.json({ error: "Not authenticated." }, { status: 401 });

        const url = new URL(request.url);
        const packId = (url.searchParams.get("pack") ?? "base_emo").slice(0, 64);

        try {
          if (url.searchParams.get("list") === "1") {
            const page = await codyFetch("", {
              headers: { Cookie: cookieHeader(session.cookies) },
            });
            const html = await page.text();
            const packs = parseEmoticonPackIdsFromChatHtml(html);
            return Response.json({ packs }, { headers: { "Cache-Control": "no-store" } });
          }

          const pack = await loadPack(session, packId);
          return Response.json(pack, { headers: { "Cache-Control": "no-store" } });
        } catch {
          return Response.json({ error: "Emoticons are unavailable." }, { status: 502 });
        }
      },
    },
  },
});
