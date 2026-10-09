import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/chat/native-sso")({
  server: {
    handlers: {
      POST: async () =>
        Response.json(
          {
            error:
              "Native CodyChat SSO is unavailable on CodyChat Test because /yaarzo-sso.php is not installed. Use chat inside Yaarzo instead.",
          },
          {
            status: 503,
            headers: { "Cache-Control": "no-store" },
          },
        ),
    },
  },
});
