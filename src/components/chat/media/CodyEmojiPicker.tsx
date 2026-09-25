import { useEffect, useState } from "react";

import type { CodyEmoticonItem, CodyEmoticonPack } from "@/lib/chat/cody-emoticon";
import { Button } from "@/components/ui/button";

export function CodyEmojiPicker({
  onPick,
}: {
  onPick: (token: string) => void;
}) {
  const [packs, setPacks] = useState<string[]>(["base_emo"]);
  const [activePack, setActivePack] = useState("base_emo");
  const [items, setItems] = useState<CodyEmoticonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void fetch("/api/chat/emoticons?list=1", { cache: "no-store" })
      .then((r) => r.json())
      .then((json: { packs?: string[] }) => {
        if (json.packs?.length) setPacks(json.packs);
      })
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    setLoading(true);
    setError("");
    void fetch(`/api/chat/emoticons?pack=${encodeURIComponent(activePack)}`, {
      cache: "no-store",
    })
      .then(async (r) => {
        const json = (await r.json()) as CodyEmoticonPack & { error?: string };
        if (!r.ok) throw new Error(json.error ?? "Could not load emojis.");
        setItems(json.items ?? []);
      })
      .catch((err: unknown) => {
        setItems([]);
        setError(err instanceof Error ? err.message : "Could not load emojis.");
      })
      .finally(() => setLoading(false));
  }, [activePack]);

  return (
    <div className="w-[min(100vw-2rem,320px)] rounded-xl border border-border bg-card p-2 shadow-lg">
      {packs.length > 1 ? (
        <div className="mb-2 flex gap-1 overflow-x-auto pb-1">
          {packs.map((pack) => (
            <Button
              key={pack}
              type="button"
              size="sm"
              variant={pack === activePack ? "default" : "outline"}
              className="h-7 shrink-0 text-[10px]"
              onClick={() => setActivePack(pack)}
            >
              {pack === "base_emo" ? "Classic" : pack.replace(/_/gu, " ")}
            </Button>
          ))}
        </div>
      ) : null}
      {loading ? (
        <p className="px-2 py-6 text-center text-xs text-muted-foreground">Loading emojis…</p>
      ) : error ? (
        <p className="px-2 py-4 text-center text-xs text-destructive">{error}</p>
      ) : (
        <div className="grid max-h-52 grid-cols-8 gap-0.5 overflow-y-auto">
          {items.map((item) => (
            <button
              key={item.token}
              type="button"
              className="grid h-9 w-9 place-items-center rounded-md hover:bg-muted"
              title={item.token}
              onClick={() => onPick(item.token)}
            >
              <img src={item.imageUrl} alt={item.token} className="h-6 w-6 object-contain" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
