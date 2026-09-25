import { createFileRoute } from "@tanstack/react-router";

import { loadServerMediaConfig, publicMediaFlags } from "@/lib/server/media-config";

export const Route = createFileRoute("/api/media/config")({
  server: {
    handlers: {
      GET: async () => {
        const config = await loadServerMediaConfig();
        return Response.json(publicMediaFlags(config), {
          headers: { "Cache-Control": "private, max-age=60" },
        });
      },
    },
  },
});
