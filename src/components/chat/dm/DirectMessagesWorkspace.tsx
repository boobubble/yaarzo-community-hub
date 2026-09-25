import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ChatComposer } from "@/components/chat/ChatComposer";
import { MessageMediaContent } from "@/components/chat/media/MessageMediaContent";
import { useRegisteredDmContext } from "@/lib/dm/registered-dm-provider";
import type { CodyPrivateMessage } from "@/lib/codychat-private";
import { isOwnPrivateMessage } from "@/lib/codychat-private";
import { codychatTargetFromConversation, type DirectConversation } from "@/lib/dm/direct-conversation";
import type { DirectoryProfile } from "@/lib/profiles/use-profiles-directory";
import { mergeMediaConfig } from "@/lib/media/media-providers-config";

export function DirectMessagesWorkspace({
  registeredUserId,
  guestName,
  hasCodySession,
  profiles,
  activeConversation,
}: {
  registeredUserId?: string;
  guestName?: string;
  hasCodySession: boolean;
  profiles: Record<string, DirectoryProfile>;
  activeConversation: DirectConversation | null;
}) {
  const registered = useRegisteredDmContext();
  const [codyMessages, setCodyMessages] = useState<CodyPrivateMessage[]>([]);
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

  const supabasePeerId =
    activeConversation?.backend === "supabase" ? activeConversation.peerSupabaseId : null;

  useEffect(() => {
    if (supabasePeerId) registered.openConversation(supabasePeerId);
  }, [supabasePeerId, registered]);

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
      }
    }, 2500);
    return () => window.clearInterval(interval);
  }, [codyTarget]);

  const displayName = (peerId: string) => {
    const p = profiles[peerId];
    return p?.display_name || p?.username || "Member";
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
    return true;
  };

  const threadIsSupabase = activeConversation?.backend === "supabase";
  const threadMessages = threadIsSupabase ? registered.messages : codyMessages;
  const threadSending = threadIsSupabase ? registered.sending : codySending;

  if (!hasCodySession && !registeredUserId) {
    return (
      <div className="m-auto max-w-xs px-4 text-center text-[11px] text-muted-foreground">
        Sign in or continue as guest to use direct messages.
      </div>
    );
  }

  if (!activeConversation) {
    return (
      <div className="m-auto flex max-w-sm flex-col items-center px-4 text-center">
        <p className="text-sm font-extrabold text-foreground">Direct Messages</p>
        <p className="mt-2 text-[11px] leading-5 text-muted-foreground">
          Select a recent conversation above, or message someone from Members.
        </p>
      </div>
    );
  }

  const peerTitle =
    activeConversation.backend === "supabase"
      ? displayName(activeConversation.peerSupabaseId)
      : activeConversation.peerName;

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col">
      <header className="shrink-0 border-b border-border px-3 py-2.5">
        <p className="text-sm font-extrabold text-foreground">{peerTitle}</p>
        <p className="text-[10px] text-muted-foreground">
          {activeConversation.backend === "supabase" ? "Registered Yaarzo DM" : "CodyChat private message"}
        </p>
      </header>
      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-4">
        {codyLoading && activeConversation.backend === "codychat" ? (
          <p className="m-auto text-xs text-muted-foreground">Loading messages…</p>
        ) : (
          <div className="yaarzo-chat-rail w-full space-y-3">
            {threadMessages.map((entry) => {
              const isOwn = threadIsSupabase
                ? entry.author_id === registeredUserId
                : isOwnPrivateMessage(entry as CodyPrivateMessage, guestName);
              const text = threadIsSupabase
                ? (entry as { text: string }).text
                : (entry as CodyPrivateMessage).content;
              return (
                <div key={entry.id} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                  <div className="max-w-[84%] rounded-xl border border-border bg-card px-3 py-2.5 shadow-sm sm:max-w-[70%]">
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
    </div>
  );
}

export type { DirectConversation } from "@/lib/dm/direct-conversation";
