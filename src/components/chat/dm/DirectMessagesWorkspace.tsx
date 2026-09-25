import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CircleUser, MessageCircle } from "lucide-react";

import { ChatComposer } from "@/components/chat/ChatComposer";
import { MessageMediaContent } from "@/components/chat/media/MessageMediaContent";
import { useRegisteredDmContext } from "@/lib/dm/registered-dm-provider";
import type { CodyPrivateConversation, CodyPrivateMessage } from "@/lib/codychat-private";
import { isOwnPrivateMessage } from "@/lib/codychat-private";
import { codychatTargetFromConversation, type DirectConversation } from "@/lib/dm/direct-conversation";
import { buildDmChannel } from "@/lib/dm/dm-utils";
import type { DirectoryProfile } from "@/lib/profiles/use-profiles-directory";
import { mergeMediaConfig } from "@/lib/media/media-providers-config";

export function DirectMessagesWorkspace({
  registeredUserId,
  guestName,
  hasCodySession,
  profiles,
  initialConversation,
  onClearInitial,
}: {
  registeredUserId?: string;
  guestName?: string;
  hasCodySession: boolean;
  profiles: Record<string, DirectoryProfile>;
  initialConversation?: DirectConversation | null;
  onClearInitial?: () => void;
}) {
  const registered = useRegisteredDmContext();
  const [codyConversations, setCodyConversations] = useState<CodyPrivateConversation[]>([]);
  const [codyMessages, setCodyMessages] = useState<CodyPrivateMessage[]>([]);
  const [activeConversation, setActiveConversation] = useState<DirectConversation | null>(null);
  const [codyLoading, setCodyLoading] = useState(false);
  const [codySending, setCodySending] = useState(false);
  const lastPrivRef = useRef(0);
  const pCountRef = useRef(0);
  const [mediaFlags, setMediaFlags] = useState(mergeMediaConfig(null));
  const media = useMemo(() => mergeMediaConfig(mediaFlags), [mediaFlags]);

  const codyTarget = useMemo(
    () => (activeConversation ? codychatTargetFromConversation(activeConversation) : null),
    [activeConversation],
  );

  useEffect(() => {
    void fetch("/api/media/config")
      .then((r) => r.json())
      .then((json) => setMediaFlags({ youtube: json.youtube, giphy: json.giphy }))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!initialConversation) return;
    if (initialConversation.backend === "supabase") {
      registered.openConversation(initialConversation.peerSupabaseId);
      setActiveConversation(initialConversation);
    } else {
      setActiveConversation(initialConversation);
    }
    onClearInitial?.();
  }, [initialConversation, onClearInitial, registered]);

  const loadCodyInbox = useCallback(async () => {
    if (!hasCodySession) return;
    const res = await fetch("/api/chat/private/conversations", { cache: "no-store" });
    if (!res.ok) return;
    const json = (await res.json()) as { conversations?: CodyPrivateConversation[] };
    setCodyConversations(json.conversations ?? []);
  }, [hasCodySession]);

  const loadCodyThread = useCallback(async (target: { userId: string }) => {
    setCodyLoading(true);
    const res = await fetch(
      `/api/chat/private/messages?mode=history&target=${encodeURIComponent(target.userId)}`,
      { cache: "no-store" },
    );
    if (res.ok) {
      const json = (await res.json()) as { messages?: CodyPrivateMessage[]; lastPriv?: number };
      setCodyMessages(json.messages ?? []);
      lastPrivRef.current = json.lastPriv ?? 0;
    }
    setCodyLoading(false);
  }, []);

  useEffect(() => {
    if (codyTarget) void loadCodyThread(codyTarget);
    else setCodyMessages([]);
  }, [codyTarget, loadCodyThread]);

  useEffect(() => {
    void loadCodyInbox();
    if (!hasCodySession) return;
    const interval = window.setInterval(() => void loadCodyInbox(), 15000);
    return () => window.clearInterval(interval);
  }, [hasCodySession, loadCodyInbox]);

  useEffect(() => {
    if (!codyTarget) return;
    const interval = window.setInterval(async () => {
      const res = await fetch(
        `/api/chat/private/messages?target=${encodeURIComponent(codyTarget.userId)}&lastp=${lastPrivRef.current}&pcount=${pCountRef.current}`,
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
        setCodyMessages((current) => {
          const map = new Map(current.map((m) => [m.id, m]));
          for (const m of incoming) map.set(m.id, m);
          return [...map.values()];
        });
        void loadCodyInbox();
      }
    }, 2500);
    return () => window.clearInterval(interval);
  }, [codyTarget, loadCodyInbox]);

  const displayName = (peerId: string) => {
    const p = profiles[peerId];
    return p?.display_name || p?.username || "Member";
  };

  const openSupabase = (peerId: string) => {
    registered.openConversation(peerId);
    setActiveConversation({ backend: "supabase", peerSupabaseId: peerId });
  };

  const openCody = (conv: Extract<DirectConversation, { backend: "codychat" }>) => {
    setActiveConversation(conv);
  };

  const sendSupabase = async (text: string) => registered.sendMessage(text);

  const sendCody = async (text: string) => {
    if (!codyTarget) return false;
    setCodySending(true);
    const res = await fetch("/api/chat/private/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target: Number.parseInt(codyTarget.userId, 10), content: text }),
    });
    setCodySending(false);
    if (!res.ok) return false;
    const json = (await res.json()) as { messages?: CodyPrivateMessage[] };
    if (json.messages?.length) {
      setCodyMessages((current) => {
        const map = new Map(current.map((m) => [m.id, m]));
        for (const m of json.messages ?? []) map.set(m.id, m);
        return [...map.values()];
      });
    }
    void loadCodyInbox();
    return true;
  };

  const activeSupabasePeer =
    activeConversation?.backend === "supabase" ? activeConversation.peerSupabaseId : null;

  const threadIsSupabase = activeConversation?.backend === "supabase";
  const threadMessages = threadIsSupabase ? registered.messages : codyMessages;
  const threadSending = threadIsSupabase ? registered.sending : codySending;

  const codyUnread = codyConversations.reduce((sum, c) => sum + c.unread, 0);

  if (!hasCodySession && !registeredUserId) {
    return (
      <div className="m-auto max-w-xs px-4 text-center text-[11px] text-muted-foreground">
        Sign in or continue as guest to use direct messages.
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1">
        <aside className="flex w-full max-w-[240px] shrink-0 flex-col border-r border-border bg-card/50 md:w-[240px]">
          <div className="border-b border-border px-3 py-2.5">
            <p className="text-[10px] font-bold uppercase text-muted-foreground">Direct Messages</p>
            <p className="text-[10px] text-muted-foreground">
              Supabase + CodyChat PM
              {codyUnread > 0 ? ` · ${codyUnread} Cody unread` : ""}
            </p>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {registeredUserId && registered.conversations.length ? (
              <>
                <p className="mb-1 px-1 text-[9px] font-bold uppercase text-muted-foreground">Registered</p>
                {registered.conversations.map((c) => (
                  <button
                    key={`supabase-${c.peerId}`}
                    type="button"
                    onClick={() => openSupabase(c.peerId)}
                    className={`mb-1 flex w-full items-center gap-2 rounded-md px-2 py-2 text-left hover:bg-secondary/60 ${
                      activeSupabasePeer === c.peerId ? "bg-secondary" : ""
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
                ))}
              </>
            ) : null}

            {hasCodySession && codyConversations.length ? (
              <>
                <p className="mb-1 mt-2 px-1 text-[9px] font-bold uppercase text-muted-foreground">CodyChat PM</p>
                {codyConversations.map((c) => {
                  const conv: DirectConversation = {
                    backend: "codychat",
                    peerCodyId: c.userId,
                    peerName: c.userName,
                    ...(c.avatar ? { peerAvatar: c.avatar } : {}),
                  };
                  const selected =
                    activeConversation?.backend === "codychat" &&
                    activeConversation.peerCodyId === c.userId;
                  return (
                    <button
                      key={`cody-${c.userId}`}
                      type="button"
                      onClick={() => openCody(conv)}
                      className={`mb-1 flex w-full items-center gap-2 rounded-md px-2 py-2 text-left hover:bg-secondary/60 ${
                        selected ? "bg-secondary" : ""
                      }`}
                    >
                      <div className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-highlight/15">
                        {c.avatar ? (
                          <img
                            src={c.avatar}
                            alt=""
                            className="size-full object-cover"
                            referrerPolicy="no-referrer"
                          />
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
                  );
                })}
              </>
            ) : null}

            {!registered.conversations.length && !codyConversations.length ? (
              <p className="px-2 py-4 text-center text-[11px] text-muted-foreground">
                {registered.loadingInbox ? "Loading…" : "No conversations yet. Message someone from the member list."}
              </p>
            ) : null}
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {activeConversation ? (
            <>
              <header className="border-b border-border px-3 py-2.5">
                <p className="text-sm font-extrabold text-foreground">
                  {activeConversation.backend === "supabase"
                    ? displayName(activeConversation.peerSupabaseId)
                    : activeConversation.peerName}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {activeConversation.backend === "supabase"
                    ? buildDmChannel(registeredUserId!, activeConversation.peerSupabaseId) ?? "Supabase DM"
                    : `CodyChat PM · ${activeConversation.peerCodyId}`}
                </p>
              </header>
              <main className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-4">
                {codyLoading && activeConversation.backend === "codychat" ? (
                  <p className="m-auto text-xs text-muted-foreground">Loading messages…</p>
                ) : (
                  <div className="mx-auto w-full max-w-3xl space-y-3">
                    {threadMessages.map((entry) => {
                      const isOwn = threadIsSupabase
                        ? entry.author_id === registeredUserId
                        : isOwnPrivateMessage(entry as CodyPrivateMessage, guestName);
                      const text = threadIsSupabase
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
                  onSend={threadIsSupabase ? sendSupabase : sendCody}
                />
              </footer>
            </>
          ) : (
            <div className="m-auto max-w-xs text-center">
              <MessageCircle className="mx-auto mb-3 size-8 text-primary" />
              <p className="text-sm font-bold text-foreground">Select a conversation</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Registered ↔ registered uses Supabase. Any guest involved uses CodyChat PM.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export type { DirectConversation } from "@/lib/dm/direct-conversation";
