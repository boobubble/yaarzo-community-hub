import { useEffect, useRef, useState } from "react";
import { AlertCircle, Loader2, Search, Youtube } from "lucide-react";

import { parseYoutubeId } from "@/lib/media/media-providers-config";

export type YoutubeItem = {
  id: string;
  title: string;
  thumbnail: string;
  url: string;
};

export function YoutubePicker({
  enabled,
  onPick,
}: {
  enabled: boolean;
  onPick: (url: string) => void;
}) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<YoutubeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounce = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (debounce.current) window.clearTimeout(debounce.current);
    debounce.current = window.setTimeout(() => {
      void load();
    }, 400);
    return () => {
      if (debounce.current) window.clearTimeout(debounce.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, enabled]);

  async function load() {
    const query = q.trim();
    if (!query) {
      setItems([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/media/youtube-search?q=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error(`YouTube ${res.status}`);
      const json = (await res.json()) as { items?: YoutubeItem[] };
      setItems(json.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Search failed");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  const pasteId = parseYoutubeId(q);
  const pastePreview = pasteId ? `https://i.ytimg.com/vi/${pasteId}/mqdefault.jpg` : null;

  if (!enabled) {
    return (
      <div className="rounded-lg border border-border bg-card p-3 text-center text-xs text-muted-foreground">
        <AlertCircle className="mx-auto mb-1 h-4 w-4" />
        YouTube sharing is not configured.
      </div>
    );
  }

  return (
    <div className="w-[min(92vw,340px)] rounded-lg border border-border bg-card p-3 shadow-lg">
      <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
        <Youtube className="h-4 w-4 text-red-500" />
        Search or paste a YouTube link
      </div>
      <div className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-2">
        <Search className="h-3.5 w-3.5 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Song, video, or URL…"
          className="flex-1 bg-transparent py-2 text-xs outline-none"
        />
      </div>
      {pasteId ? (
        <button
          type="button"
          onClick={() => onPick(`https://youtu.be/${pasteId}`)}
          className="mt-2 w-full overflow-hidden rounded-lg border border-border text-left"
        >
          {pastePreview ? (
            <img src={pastePreview} alt="" className="block h-28 w-full object-cover" />
          ) : null}
          <p className="px-2 py-1.5 text-[11px] font-medium">Share this link</p>
        </button>
      ) : null}
      <div className="mt-2 max-h-52 overflow-y-auto">
        {loading ? (
          <div className="grid place-items-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : null}
        {error ? <p className="text-xs text-destructive">{error}</p> : null}
        {!loading && !error
          ? items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onPick(item.url)}
                className="mb-1.5 flex w-full gap-2 rounded-md border border-border p-1.5 text-left hover:bg-secondary/50"
              >
                <img src={item.thumbnail} alt="" className="h-12 w-20 shrink-0 rounded object-cover" />
                <span className="line-clamp-2 text-[11px] font-medium text-foreground">{item.title}</span>
              </button>
            ))
          : null}
      </div>
    </div>
  );
}
