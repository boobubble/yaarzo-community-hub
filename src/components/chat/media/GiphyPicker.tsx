import { useEffect, useRef, useState } from "react";
import { AlertCircle, Loader2, Search } from "lucide-react";

export type GifItem = {
  id: string;
  title: string;
  previewUrl: string;
  fullUrl: string;
  pageUrl: string;
};

export function GiphyPicker({
  enabled,
  onPick,
}: {
  enabled: boolean;
  onPick: (gif: GifItem) => void;
}) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<GifItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounce = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;
    if (debounce.current) window.clearTimeout(debounce.current);
    debounce.current = window.setTimeout(() => {
      void load();
    }, q.trim() ? 350 : 0);
    return () => {
      if (debounce.current) window.clearTimeout(debounce.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, enabled]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      const res = await fetch(`/api/media/giphy?${params}`);
      if (!res.ok) throw new Error(`Giphy ${res.status}`);
      const json = (await res.json()) as { items?: GifItem[] };
      setItems(json.items ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load GIFs");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  if (!enabled) {
    return (
      <div className="rounded-lg border border-border bg-card p-3 text-center text-xs text-muted-foreground">
        <AlertCircle className="mx-auto mb-1 h-4 w-4" />
        Giphy is not configured.
      </div>
    );
  }

  return (
    <div className="w-[min(92vw,320px)] rounded-lg border border-border bg-card shadow-lg">
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <Search className="h-3.5 w-3.5 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search GIFs…"
          className="flex-1 bg-transparent text-xs outline-none"
        />
        <span className="text-[9px] text-muted-foreground">GIPHY</span>
      </div>
      <div className="max-h-64 overflow-y-auto p-2">
        {loading ? (
          <div className="grid place-items-center py-6 text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
          </div>
        ) : null}
        {error && !loading ? <p className="px-2 py-3 text-center text-xs text-destructive">{error}</p> : null}
        {!loading && !error ? (
          <div className="grid grid-cols-3 gap-1.5">
            {items.map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => onPick(g)}
                className="overflow-hidden rounded-md border border-transparent bg-black/30 transition hover:border-primary/60"
                title={g.title}
              >
                <img src={g.previewUrl} alt={g.title} className="block h-16 w-full object-cover" loading="lazy" />
              </button>
            ))}
            {items.length === 0 ? (
              <div className="col-span-3 py-6 text-center text-xs text-muted-foreground">No results</div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
