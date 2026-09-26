import { X } from "lucide-react";

import type { DirectConversation } from "@/lib/dm/direct-conversation";
import type { RecentDmStripItem } from "@/lib/dm/recent-dm-strip";

function chipClass(active: boolean) {
  return active
    ? "border-primary/60 bg-primary/15 text-foreground"
    : "border-border bg-secondary/55 text-foreground hover:bg-secondary";
}

export function ConversationNavStrip({
  currentRoomName,
  roomActive,
  onSelectCurrentRoom,
  items,
  selectedDmKey,
  onOpenConversation,
  onCloseConversation,
}: {
  currentRoomName?: string;
  roomActive: boolean;
  onSelectCurrentRoom: () => void;
  items: RecentDmStripItem[];
  selectedDmKey?: string;
  onOpenConversation: (conversation: DirectConversation) => void;
  onCloseConversation: (item: RecentDmStripItem) => void;
}) {
  const showRoom = !!currentRoomName;

  if (!showRoom && !items.length) {
    return (
      <div className="flex h-10 shrink-0 items-center border-b border-border bg-card/70 px-3">
        <p className="text-[10px] text-muted-foreground">No recent conversations</p>
      </div>
    );
  }

  return (
    <div className="flex h-10 shrink-0 items-stretch border-b border-border bg-card/70">
      {showRoom ? (
        <button
          type="button"
          onClick={onSelectCurrentRoom}
          className={`topic-chip sticky left-0 z-10 my-auto ml-3 inline-flex h-7 shrink-0 items-center gap-1.5 rounded-full border px-2.5 text-[10px] font-semibold transition ${chipClass(roomActive)}`}
        >
          <span className="max-w-[140px] truncate"># {currentRoomName}</span>
        </button>
      ) : null}
      <div
        className={`flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto py-1.5 scrollbar-none ${
          showRoom ? "pl-1.5 pr-3" : "px-3"
        }`}
      >
        {items.map((item) => (
          <div
            key={item.key}
            className={`topic-chip inline-flex h-7 shrink-0 items-center gap-0.5 rounded-full border pl-1.5 pr-0.5 text-[10px] font-semibold transition ${chipClass(selectedDmKey === item.key)}`}
          >
            <button
              type="button"
              onClick={() => onOpenConversation(item.conversation)}
              className="inline-flex min-w-0 items-center gap-1.5 rounded-full py-0 text-left"
            >
              {item.avatarUrl ? (
                <img
                  src={item.avatarUrl}
                  alt=""
                  className="size-5 shrink-0 rounded-full border border-border object-cover"
                />
              ) : null}
              <span className="max-w-[120px] truncate">{item.label}</span>
              {item.unread > 0 ? (
                <span className="rounded-full bg-alert px-1.5 text-[9px] font-bold leading-4 text-alert-foreground">
                  {item.unread}
                </span>
              ) : null}
            </button>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onCloseConversation(item);
              }}
              className="inline-flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted/70 hover:text-foreground"
              aria-label={`Close ${item.label} conversation`}
              title="Close conversation"
            >
              <X className="size-3" aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/** @deprecated Use ConversationNavStrip */
export const RecentDmStrip = ConversationNavStrip;
