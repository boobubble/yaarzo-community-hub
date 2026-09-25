import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CircleUser, MessageCircle } from "lucide-react";

import { ChatComposer } from "@/components/chat/ChatComposer";
import { MessageMediaContent } from "@/components/chat/media/MessageMediaContent";
import { useRegisteredDmContext } from "@/lib/dm/registered-dm-provider";
import type { CodyPrivateConversation, CodyPrivateMessage } from "@/lib/codychat-private";
import { isOwnPrivateMessage } from "@/lib/codychat-private";
import { buildDmChannel } from "@/lib/dm/dm-utils";
import type { DirectoryProfile } from "@/lib/profiles/use-profiles-directory";
import { mergeMediaConfig } from "@/lib/media/media-providers-config";

type GuestTarget = {
  userId: string;
  userName: string;
  avatar?: string;
};

export function DirectMessagesWorkspace({
  registeredUserId,
  guestName,
  guestOnly,
  profiles,
  initialRegisteredPeerId,
  initialGuestTarget,
  onClearInitial,
}: {
  registeredUserId?: string;
  guestName?: string;
  guestOnly: boolean;
  profiles: Record<string, DirectoryProfile>;
  initialRegisteredPeerId?: string | null;
  initialGuestTarget?: GuestTarget | null;
  onClearInitial?: () => void;
}) {
  const registered = useRegisteredDmContext();
  const [guestConversations, setGuestConversations] = useState<CodyPrivateConversation[]>([]);
  const [guestMessages, setGuestMessages] = useState<CodyPrivateMessage[]>([]);
  const [guestTarget, setGuestTarget] = useState<GuestTarget | null>(null);
  const [guestLoading, setGuestLoading] = useState(false);
  const [guestSending, setGuestSending] = useState(false);
  const lastPrivRef = useRef(0);
  const pCountRef = useRef(0);
  const [mediaFlags, setMediaFlags] = useState(mergeMediaConfig(null));
  const media = useMemo(() => mergeMediaConfig(mediaFlags), [mediaFlags]);

  useEffect(() => {
    void fetch("/api/media/config")
      .then((r) => r.json())
      .then((json) => setMediaFlags({ youtube: json.youtube, giphy: json.giphy }))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (initialRegisteredPeerId && registeredUserId) {
      registered.openConversation(initialRegisteredPeerId);
      onClearInitial?.();
    }
  }, [initialRegisteredPeerId, registeredUserId, registered, onClearInitial]);

  useEffect(() => {
    if (initialGuestTarget) {
      setGuestTarget(initialGuestTarget);
      onClearInitial?.();
    }
  }, [initialGuestTarget, onClearInitial]);

  const loadGuestInbox = useCallback(async () => {
    if (!guestName || registeredUserId) return;
    const res = await fetch("/api/chat/private/conversations", { cache: "no-store" });
    if (!res.ok) return;
    const json = (await res.json()) as { conversations?: CodyPrivateConversation[] };
    setGuestConversations(json.conversations ?? []);
  }, [guestName, registeredUserId]);

  const loadGuestThread = useCallback(async (target: GuestTarget) => {
    setGuestLoading(true);
    const res = await fetch(
      `/api/chat/private/messages?mode=history&target=${encodeURIComponent(target.userId)}`,
      { cache: "no-store" },
    );
    if (res.ok) {
      const json = (await res.json()) as { messages?: CodyPrivateMessage[]; lastPriv?: number };
      setGuestMessages(json.messages ?? []);
      lastPrivRef.current = json.lastPriv ?? 0;
    }
    setGuestLoading(false);
  }, []);

  useEffect(() => {
    if (guestTarget) void loadGuestThread(guestTarget);
  }, [guestTarget, loadGuestThread]);

  useEffect(() => {
    void loadGuestInbox();
  }, [loadGuestInbox]);

  useEffect(() => {
    if (!guestTarget || registeredUserId) return;
    const interval = window.setInterval(async () => {
      const res = await fetch(
        `/api/chat/private/messages?target=${encodeURIComponent(guestTarget.userId)}&lastp=${lastPrivRef.current}&pcount=${pCountRef.current}`,
        { cache: "no-store" },
      );
      if (!res.ok) return;
      const json = (await res.json()) as {
        messages?: CodyPrivateMessage[];
        pcount?: number;
      };
      if (typeof json.pcount === "number") pCountRef.current = json.pcount;
      const incoming = json.messages ?? [];
      if (incoming.length) {
        const last = incoming[incoming.length - 1];
        const lastId = Number.parseInt(last?.id ?? "0", 10);
        if (Number.isFinite(lastId)) lastPrivRef.current = lastId;
        setGuestMessages((current) => {
          const map = new Map(current.map((m) => [m.id, m]));
          for (const m of incoming) map.set(m.id, m);
          return [...map.values()];
        });
      }
    }, 2500);
    return () => window.clearInterval(interval);
  }, [guestTarget, registeredUserId]);

  const displayName = (peerId: string) => {
    const p = profiles[peerId];
    return p?.display_name || p?.username || "Member";
  };

  const registeredList = registered.conversations;
  const showRegistered = !!registeredUserId;

  const sendRegistered = async (text: string) => registered.sendMessage(text);

  const sendGuest = async (text: string) => {
    if (!guestTarget) return false;
    setGuestSending(true);
    const res = await fetch("/api/chat/private/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target: Number.parseInt(guestTarget.userId, 10), content: text }),
    });
    setGuestSending(false);
    if (!res.ok) return false;
    const json = (await res.json()) as { messages?: CodyPrivateMessage[] };
    if (json.messages?.length) {
      setGuestMessages((current) => {
        const map = new Map(current.map((m) => [m.id, m]));
        for (const m of json.messages ?? []) map.set(m.id, m);
        return [...map.values()];
      });
    }
    void loadGuestInbox();
    return true;
  };

  const activeRegisteredPeer = registered.activePeerId;
  const threadMessages = showRegistered ? registered.messages : guestMessages;
  const threadSending = showRegistered ? registered.sending : guestSending;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1">
        <aside className="flex w-full max-w-[240px] shrink-0 flex-col border-r border-border bg-card/50 md:w-[240px]">
          <div className="border-b border-border px-3 py-2.5">
            <p className="text-[10px] font-bold uppercase text-muted-foreground">Direct Messages</p>
            <p className="text-[10px] text-muted-foreground">
              {showRegistered ? "Registered · Supabase" : "Guest · CodyChat PM"}
            </p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {!guestName && !registeredUserId ? (
              <p className="px-2 py-4 text-center text-[11px] text-muted-foreground">
                Sign in to view direct messages.
              </p>
            ) : showRegistered ? (
              registeredList.length ? (
                registeredList.map((c) => (
                  <button
                    key={c.peerId}
                    type="button"
                    onClick={() => registered.openConversation(c.peerId)}
                    className={`mb-1 flex w-full items-center gap-2 rounded-md px-2 py-2 text-left hover:bg-secondary/60 ${
                      activeRegisteredPeer === c.peerId ? "bg-secondary" : ""
                    }`}
                  >
                    <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-highlight/15">
                      {profiles[c.peerId]?.avatar_url ? (
                        <img src={profiles[c.peerId].avatar_url!} alt="" className="size-full object-cover" />
                      ) : (
                        <CircleUser className="size-4 text-highlight" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-bold text-foreground">{displayName(c.peerId)}</p>
                      <p className="truncate text-[10px] text-muted-foreground">
                        {c.lastMessage?.text ?? "No messages yet"}
                      </p>
                    </div>
                    {c.unread > 0 ? (
                      <span className="rounded-full bg-alert px-1.5 text-[9px] font-bold text-alert-foreground">
                        {c.unread}
                      </span>
                    ) : null}
                  </button>
                ))
              ) : (
                <p className="px-2 py-4 text-center text-[11px] text-muted-foreground">
                  {registered.loadingInbox ? "Loading…" : "No conversations yet."}
                </p>
              )
            ) : guestConversations.length ? (
              guestConversations.map((c) => (
                <button
                  key={c.userId}
                  type="button"
                  onClick={() => setGuestTarget({ userId: c.userId, userName: c.userName, avatar: c.avatar })}
                  className={`mb-1 flex w-full items-center gap-2 rounded-md px-2 py-2 text-left hover:bg-secondary/60 ${
                    guestTarget?.userId === c.userId ? "bg-secondary" : ""
                  }`}
                >
                  <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-highlight/15">
                    {c.avatar ? (
                      <img src={c.avatar} alt="" className="size-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <CircleUser className="size-4 text-highlight" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-bold">{c.userName}</p>
                    <p className="text-[10px] text-muted-foreground">CodyChat private</p>
                  </div>
                  {c.unread > 0 ? (
                    <span className="rounded-full bg-alert px-1.5 text-[9px] font-bold text-alert-foreground">
                      {c.unread}
                    </span>
                  ) : null}
                </button>
              ))
            ) : (
              <p className="px-2 py-4 text-center text-[11px] text-muted-foreground">
                Open a guest private chat from a room member profile.
              </p>
            )}
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {(showRegistered && activeRegisteredPeer) || (!showRegistered && guestTarget) ? (
            <>
              <header className="border-b border-border px-3 py-2.5">
                <p className="text-sm font-extrabold text-foreground">
                  {showRegistered && activeRegisteredPeer
                    ? displayName(activeRegisteredPeer)
                    : guestTarget?.userName}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {showRegistered
                    ? buildDmChannel(registeredUserId!, activeRegisteredPeer!) ?? ""
                    : "Guest private message"}
                </p>
              </header>
              <main className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-4">
                {guestLoading && !showRegistered ? (
                  <p className="m-auto text-xs text-muted-foreground">Loading messages…</p>
                ) : (
                  <div className="mx-auto w-full max-w-3xl space-y-3">
                    {threadMessages.map((entry) => {
                      const isOwn = showRegistered
                        ? entry.author_id === registeredUserId
                        : isOwnPrivateMessage(entry as CodyPrivateMessage, guestName);
                      const text = showRegistered
                        ? (entry as { text: string }).text
                        : (entry as CodyPrivateMessage).content;
                      return (
                        <div key={entry.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                          <div className="max-w-[84%] rounded-xl border border-border bg-card px-3 py-2.5 shadow-sm">
                            <MessageMediaContent text={text} media={media} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </main>
              <footer className="shrink-0 border-t border-border bg-card/90 p-2.5">
                <ChatComposer
                  disabled={false}
                  sending={threadSending}
                  media={{
                    youtube: { enabled: media.youtube.enabled },
                    giphy: { enabled: media.giphy.enabled },
                  }}
                  placeholder="Write a private message…"
                  onSend={showRegistered ? sendRegistered : sendGuest}
                />
              </footer>
            </>
          ) : (
            <div className="m-auto max-w-xs text-center">
              <MessageCircle className="mx-auto mb-3 size-8 text-primary" />
              <p className="text-sm font-bold text-foreground">Select a conversation</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {guestOnly
                  ? "Guest private messages use CodyChat and are not stored in Supabase."
                  : "Choose a registered member to open a Supabase direct message."}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export type { GuestTarget };
