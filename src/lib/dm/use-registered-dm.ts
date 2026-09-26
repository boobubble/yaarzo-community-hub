import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { markDmConversationRead } from "@/lib/dm/dm-read";
import {
  buildDmChannel,
  isRemoteDmChannel,
  isUuid,
  parseDmChannel,
} from "@/lib/dm/dm-utils";
import { supabase } from "@/lib/supabase";

export type RegisteredDmMessage = {
  id: string;
  channel_id: string;
  author_id: string;
  text: string;
  kind: string;
  created_at: string;
};

export type RegisteredDmConversation = {
  peerId: string;
  channelId: string;
  lastMessage?: RegisteredDmMessage;
  unread: number;
};

function peerFromChannel(channelId: string, meId: string) {
  const { peerId } = parseDmChannel(channelId, meId);
  return peerId;
}

export function useRegisteredDm(meId: string | undefined) {
  const [conversations, setConversations] = useState<RegisteredDmConversation[]>([]);
  const [messages, setMessages] = useState<RegisteredDmMessage[]>([]);
  const [activePeerId, setActivePeerId] = useState<string | null>(null);
  const [loadingInbox, setLoadingInbox] = useState(false);
  const [sending, setSending] = useState(false);
  const readMapRef = useRef<Record<string, string>>({});

  const activeChannel = useMemo(() => {
    if (!meId || !activePeerId) return null;
    return buildDmChannel(meId, activePeerId);
  }, [meId, activePeerId]);

  const refreshReads = useCallback(async () => {
    if (!meId) return;
    const { data } = await supabase.from("dm_reads").select("channel_id, last_read_at").eq("user_id", meId);
    const map: Record<string, string> = {};
    for (const row of data ?? []) {
      map[row.channel_id as string] = row.last_read_at as string;
    }
    readMapRef.current = map;
  }, [meId]);

  const hydrateInbox = useCallback(async () => {
    if (!meId || !isUuid(meId)) {
      setConversations([]);
      return;
    }
    setLoadingInbox(true);
    await refreshReads();
    const { data } = await supabase
      .from("messages")
      .select("id, channel_id, author_id, text, kind, created_at")
      .like("channel_id", "dm:%")
      .order("created_at", { ascending: false })
      .limit(400);

    const latestByPeer = new Map<string, RegisteredDmMessage>();
    const unreadByPeer = new Map<string, number>();

    for (const row of (data ?? []) as RegisteredDmMessage[]) {
      if (!isRemoteDmChannel(row.channel_id, meId)) continue;
      const peer = peerFromChannel(row.channel_id, meId);
      if (!peer) continue;
      if (!latestByPeer.has(peer)) latestByPeer.set(peer, row);
      const lastRead = readMapRef.current[row.channel_id];
      if (row.author_id !== meId) {
        if (!lastRead || new Date(row.created_at) > new Date(lastRead)) {
          unreadByPeer.set(peer, (unreadByPeer.get(peer) ?? 0) + 1);
        }
      }
    }

    const list: RegisteredDmConversation[] = [...latestByPeer.entries()].map(([peerId, lastMessage]) => ({
      peerId,
      channelId: buildDmChannel(meId, peerId) ?? "",
      lastMessage,
      unread: unreadByPeer.get(peerId) ?? 0,
    }));

    list.sort(
      (a, b) =>
        new Date(b.lastMessage?.created_at ?? 0).getTime() -
        new Date(a.lastMessage?.created_at ?? 0).getTime(),
    );
    setConversations(list);
    setLoadingInbox(false);
  }, [meId, refreshReads]);

  const loadThread = useCallback(
    async (peerId: string) => {
      if (!meId) return;
      const channelId = buildDmChannel(meId, peerId);
      if (!channelId) return;
      const { data } = await supabase
        .from("messages")
        .select("id, channel_id, author_id, text, kind, created_at")
        .eq("channel_id", channelId)
        .order("created_at", { ascending: true })
        .limit(200);
      setMessages((data ?? []) as RegisteredDmMessage[]);
      await markDmConversationRead(meId, channelId);
      void hydrateInbox();
    },
    [meId, hydrateInbox],
  );

  const openConversation = useCallback(
    (peerId: string) => {
      setActivePeerId(peerId);
      void loadThread(peerId);
    },
    [loadThread],
  );

  const sendMessage = useCallback(
    async (text: string) => {
      if (!meId || !activeChannel || !text.trim()) return false;
      setSending(true);
      const optimisticId = crypto.randomUUID();
      const optimistic: RegisteredDmMessage = {
        id: optimisticId,
        channel_id: activeChannel,
        author_id: meId,
        text: text.trim(),
        kind: "text",
        created_at: new Date().toISOString(),
      };
      setMessages((current) => [...current, optimistic]);
      const { data, error } = await supabase
        .from("messages")
        .insert({
          id: optimisticId,
          channel_id: activeChannel,
          author_id: meId,
          text: text.trim(),
          kind: "text",
        })
        .select("id, channel_id, author_id, text, kind, created_at")
        .single();
      setSending(false);
      if (error) {
        setMessages((current) => current.filter((m) => m.id !== optimisticId));
        return false;
      }
      if (data) {
        setMessages((current) =>
          current.map((m) => (m.id === optimisticId ? (data as RegisteredDmMessage) : m)),
        );
      }
      void hydrateInbox();
      return true;
    },
    [meId, activeChannel, hydrateInbox],
  );

  useEffect(() => {
    void hydrateInbox();
  }, [hydrateInbox]);

  useEffect(() => {
    if (!meId) return;
    const ch = supabase
      .channel(`registered-dm-${meId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const row = payload.new as RegisteredDmMessage;
          if (!isRemoteDmChannel(row.channel_id, meId)) return;
          const peer = peerFromChannel(row.channel_id, meId);
          if (activeChannel && row.channel_id === activeChannel) {
            setMessages((current) => {
              if (current.some((m) => m.id === row.id)) return current;
              return [...current, row];
            });
            if (row.author_id !== meId) {
              void markDmConversationRead(meId, row.channel_id);
            }
          } else if (peer && row.author_id !== meId) {
            void hydrateInbox();
          } else {
            void hydrateInbox();
          }
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [meId, activeChannel, hydrateInbox]);

  const totalUnread = useMemo(
    () => conversations.reduce((sum, c) => sum + c.unread, 0),
    [conversations],
  );

  return {
    conversations,
    messages,
    activePeerId,
    activeChannel,
    loadingInbox,
    sending,
    totalUnread,
    openConversation,
    sendMessage,
    refreshInbox: hydrateInbox,
    setActivePeerId,
  };
}
