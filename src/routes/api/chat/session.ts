import { createFileRoute } from "@tanstack/react-router";

import {
  clearSessionCookie,
  codyFetch,
  cookieHeader,
  extractToken,
  isLoggedIn,
  openSession,
  parseRequestCookie,
  sealSession,
  sessionCookie,
  updateCookieJar,
} from "@/lib/codychat-adapter";

export const Route = createFileRoute("/api/chat/session")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const secret = process.env["YAARZO_SESSION_ENCRYPTION_KEY"];
        if (!secret) return Response.json({ authenticated: false, error: "Guest login is not configured." }, { status: 503 });
        const session = await openSession(parseRequestCookie(request), secret);
        if (!session) return Response.json({ authenticated: false }, { headers: { "Cache-Control": "no-store" } });
        try {
          const check = await codyFetch("", { headers: { Cookie: cookieHeader(session.cookies) } });
          const cookies = updateCookieJar(check, session.cookies);
          const html = await check.text();
          const token = extractToken(html);
          if (!isLoggedIn(html) || !token || token === "0") {
            return Response.json(
              { authenticated: false },
              { headers: { "Cache-Control": "no-store", "Set-Cookie": clearSessionCookie() } },
            );
          }
          const envelope = await sealSession({ ...session, cookies, token }, secret);
          return Response.json(
            { authenticated: true, guest: { nickname: session.nickname } },
            { headers: { "Cache-Control": "no-store", "Set-Cookie": sessionCookie(envelope) } },
          );
        } catch {
          return Response.json({ authenticated: false, error: "CodyChat is unavailable." }, { status: 502 });
        }
      },
    },
  },
});