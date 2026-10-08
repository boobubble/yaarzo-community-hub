import { createFileRoute } from "@tanstack/react-router";

import {
  CODYCHAT_BASE_URL,
  CODYCHAT_ORIGIN,
  codyFetch,
  cookieHeader,
  extractToken,
  isLoggedIn,
  sealSession,
  sessionCookie,
  updateCookieJar,
  validateSameOrigin,
} from "@/lib/codychat-adapter";

const responseForCode: Record<number, string> = {
  0: "CodyChat could not complete the login.",
  4: "That nickname is not available.",
  17: "CodyChat requires reCAPTCHA for this login.",
  99: "This birth date is not eligible for guest access.",
};

export const Route = createFileRoute("/api/chat/guest-login")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!validateSameOrigin(request)) return Response.json({ error: "Invalid request origin." }, { status: 403 });
        const secret = process.env["YAARZO_SESSION_ENCRYPTION_KEY"];
        if (!secret) return Response.json({ error: "Guest login is not configured." }, { status: 503 });
        let input: FormData;
        try {
          input = await request.formData();
        } catch {
          return Response.json({ error: "Please complete the guest details." }, { status: 400 });
        }
        const nickname = String(input.get("nickname") ?? "").trim();
        const gender = String(input.get("gender") ?? "");
        const birthDate = String(input.get("birthDate") ?? "");
        if (!nickname || nickname.length > 64 || !["1", "2", "3"].includes(gender) || !/^\d{4}-\d{2}-\d{2}$/u.test(birthDate)) {
          return Response.json({ error: "Please complete the guest details." }, { status: 400 });
        }

        try {
          const bootstrap = await codyFetch("");
          let cookies = updateCookieJar(bootstrap);
          const body = new URLSearchParams({
            gusername: nickname,
            ggender: gender,
            gbirth: birthDate,
            recaptcha: "disabled",
          });
          const login = await codyFetch("system/action/login.php", {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
              Cookie: cookieHeader(cookies),
              Origin: CODYCHAT_ORIGIN,
              Referer: CODYCHAT_BASE_URL,
              "X-Requested-With": "XMLHttpRequest",
            },
            body,
          });
          cookies = updateCookieJar(login, cookies);
          const result = (await login.json()) as { code?: number };
          if (result.code !== 1) {
            return Response.json(
              { error: responseForCode[result.code ?? 0] ?? "CodyChat rejected this guest login.", code: result.code ?? 0 },
              { status: 400 },
            );
          }

          const sessionPage = await codyFetch("", { headers: { Cookie: cookieHeader(cookies) } });
          cookies = updateCookieJar(sessionPage, cookies);
          const html = await sessionPage.text();
          const token = extractToken(html);
          if (!isLoggedIn(html) || !token || token === "0") {
            return Response.json({ error: "CodyChat did not establish a valid guest session." }, { status: 502 });
          }
          const envelope = await sealSession({ cookies, token, nickname, issuedAt: Date.now() }, secret);
          return Response.json(
            { authenticated: true, guest: { nickname } },
            { headers: { "Cache-Control": "no-store", "Set-Cookie": sessionCookie(envelope) } },
          );
        } catch {
          return Response.json({ error: "CodyChat is unavailable. Please try again." }, { status: 502 });
        }
      },
    },
  },
});