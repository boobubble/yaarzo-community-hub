import { createFileRoute } from "@tanstack/react-router";

import { loadServerMediaConfig } from "@/lib/server/media-config";

export const Route = createFileRoute("/api/media/giphy")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const config = await loadServerMediaConfig();
        const giphy = config.giphy;
        if (!giphy.enabled || !giphy.apiKey.trim()) {
          return Response.json({ error: "Giphy is not configured." }, { status: 503 });
        }

        const url = new URL(request.url);
        const q = url.searchParams.get("q")?.trim() ?? "";
        const limit = Math.min(
          Math.max(Number.parseInt(url.searchParams.get("limit") ?? String(giphy.pageSize), 10) || giphy.pageSize, 1),
          50,
        );
        const base = q
          ? `https://api.giphy.com/v1/gifs/search?q=${encodeURIComponent(q)}`
          : "https://api.giphy.com/v1/gifs/trending?";
        const upstream = `${base}&api_key=${encodeURIComponent(giphy.apiKey)}&limit=${limit}&rating=${giphy.rating}&bundle=messaging_non_clips`;

        const res = await fetch(upstream);
        if (!res.ok) return Response.json({ error: "Giphy request failed." }, { status: 502 });
        const json = await res.json();
        const items = (json.data ?? []).map((g: Record<string, unknown>) => {
          const images = g["images"] as Record<string, { url?: string }> | undefined;
          return {
            id: g["id"],
            title: g["title"],
            previewUrl:
              images?.["fixed_width_small"]?.url || images?.["fixed_width"]?.url || images?.["preview_gif"]?.url,
            fullUrl: images?.["original"]?.url || images?.["downsized"]?.url,
            pageUrl: g["url"] || `https://giphy.com/gifs/${String(g["id"])}`,
          };
        });
        return Response.json({ items }, { headers: { "Cache-Control": "private, max-age=30" } });
      },
    },
  },
});
