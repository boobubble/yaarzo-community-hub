import { createFileRoute } from "@tanstack/react-router";

import { loadRegisteredMemberProfiles } from "@/lib/server/member-yaarzo-lookup";

export const Route = createFileRoute("/api/chat/registered-members")({
  server: {
    handlers: {
      GET: async () => {
        try {
          const profiles = await loadRegisteredMemberProfiles();
          return Response.json({ profiles }, { headers: { "Cache-Control": "no-store" } });
        } catch {
          return Response.json({ error: "Registered member directory is unavailable." }, { status: 502 });
        }
      },
    },
  },
});
