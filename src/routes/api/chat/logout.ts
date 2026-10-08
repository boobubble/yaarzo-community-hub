import { createFileRoute } from "@tanstack/react-router";

import {
  CODYCHAT_BASE_URL,
  CODYCHAT_ORIGIN,
  clearSessionCookie,
  codyFetch,
  cookieHeader,
  openSession,
  parseRequestCookie,
  validateSameOrigin,
} from "@/lib/codychat-adapter";

export const Route = createFileRoute("/api/chat/logout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!validateSameOrigin(request)) return Response.json({ error: "Invalid request origin." }, { status: 403 });
        const secret = process.env["YAARZO_SESSION_ENCRYPTION_KEY"];
        if (!secret) return Response.json({ error: "Guest logout is not configured." }, { status: 503 });
        const session = await openSession(parseRequestCookie(request), secret);
        let upstreamLoggedOut = true;
        if (session) {
          try {
            const logout = await codyFetch("system/action/logout.php", {
              method: "POST",
              headers: {
                "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                Cookie: cookieHeader(session.cookies),
                Origin: CODYCHAT_ORIGIN,
                Referer: CODYCHAT_BASE_URL,
                "X-Requested-With": "XMLHttpRequest",
              },
              body: new URLSearchParams({ logout_from_system: "1", token: session.token }),
            });
            const result = await logout.text();
            upstreamLoggedOut = logout.ok && /(?:"code"\s*:\s*1|^\s*1\s*$)/u.test(result);
          } catch {
            upstreamLoggedOut = false;
          }
        }
        return Response.json(
          { authenticated: false, upstreamLoggedOut },
          { status: upstreamLoggedOut ? 200 : 502, headers: { "Cache-Control": "no-store", "Set-Cookie": clearSessionCookie() } },
        );
      },
    },
  },
});