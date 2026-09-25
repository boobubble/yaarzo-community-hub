import type { DirectConversation } from "@/lib/dm/direct-conversation";
import type { RecentDmStripItem } from "@/lib/dm/recent-dm-strip";

export function RecentDmStrip({
  items,
  onOpenConversation,
}: {
  items: RecentDmStripItem[];
  onOpenConversation: (conversation: DirectConversation) => void;
}) {
  if (!items.length) {
    return (
      <div className="flex h-10 shrink-0 items-center border-b border-border bg-card/70 px-3">
        <p className="text-[10px] text-muted-foreground">No recent direct messages</p>
      </div>
    );
  }

  return (
    <div className="flex h-10 shrink-0 items-center gap-1.5 overflow-x-auto border-b border-border bg-card/70 px-3 scrollbar-none">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          onClick={() => onOpenConversation(item.conversation)}
          className="topic-chip inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full border border-border bg-secondary/55 px-2.5 text-[10px] font-semibold text-foreground transition hover:bg-secondary"
        >
          {item.avatarUrl ? (
            <img
              src={item.avatarUrl}
              alt=""
              className="size-5 rounded-full border border-border object-cover"
            />
          ) : null}
          <span className="max-w-[120px] truncate">{item.label}</span>
          {item.unread > 0 ? (
            <span className="rounded-full bg-alert px-1.5 text-[9px] font-bold leading-4 text-alert-foreground">
              {item.unread}
            </span>
          ) : null}
        </button>
      ))}
    </div>
  );
}
