import { createFileRoute } from "@tanstack/react-router";

import { parseYoutubeId } from "@/lib/media/media-providers-config";
import { loadServerMediaConfig } from "@/lib/server/media-config";

export const Route = createFileRoute("/api/media/youtube-search")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const config = await loadServerMediaConfig();
        const youtube = config.youtube;
        if (!youtube.enabled || !youtube.apiKey.trim()) {
          return Response.json({ error: "YouTube search is not configured." }, { status: 503 });
        }

        const url = new URL(request.url);
        const q = url.searchParams.get("q")?.trim() ?? "";
        if (!q) return Response.json({ items: [] });

        const bareId = parseYoutubeId(q);
        if (bareId) {
          return Response.json({
            items: [
              {
                id: bareId,
                title: "YouTube video",
                thumbnail: `https://i.ytimg.com/vi/${bareId}/mqdefault.jpg`,
                url: `https://youtu.be/${bareId}`,
              },
            ],
          });
        }

        const upstream = new URL("https://www.googleapis.com/youtube/v3/search");
        upstream.searchParams.set("part", "snippet");
        upstream.searchParams.set("type", "video");
        upstream.searchParams.set("maxResults", "12");
        upstream.searchParams.set("q", q);
        upstream.searchParams.set("key", youtube.apiKey.trim().split(/\s+/)[0] ?? "");

        const res = await fetch(upstream);
        if (!res.ok) return Response.json({ error: "YouTube search failed." }, { status: 502 });
        const json = (await res.json()) as {
          items?: Array<{ id?: { videoId?: string }; snippet?: { title?: string; thumbnails?: { medium?: { url?: string } } } }>;
        };
        const items = (json.items ?? [])
          .map((item) => {
            const id = item.id?.videoId;
            if (!id) return null;
            return {
              id,
              title: item.snippet?.title ?? "YouTube video",
              thumbnail: item.snippet?.thumbnails?.medium?.url ?? `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
              url: `https://youtu.be/${id}`,
            };
          })
          .filter(Boolean);
        return Response.json({ items }, { headers: { "Cache-Control": "private, max-age=60" } });
      },
    },
  },
});
