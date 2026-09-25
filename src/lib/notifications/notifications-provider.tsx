import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";

import { useAuth } from "@/contexts/auth-context";
import { DM_CONVERSATION_READ_EVENT } from "@/lib/dm/dm-read";
import { parseDmChannel } from "@/lib/dm/dm-utils";
import { supabase } from "@/lib/supabase";

export type AppNotification = {
  id: string;
  user_id: string;
  actor_id: string | null;
  kind: string;
  target_type: string | null;
  target_id: string | null;
  payload: Record<string, unknown> | null;
  read: boolean;
  created_at: string;
};

const KIND_LABELS: Record<string, string> = {
  friend_request: "sent you a friend request",
  friend_accepted: "accepted your friend request",
  dm: "sent you a message",
};

export function notificationKindLabel(kind: string): string {
  if (KIND_LABELS[kind]) return KIND_LABELS[kind];
  const normalized = kind.replace(/_/g, " ").trim();
  return normalized ? `sent a notification: ${normalized}` : "sent you a notification";
}

export function timeAgo(iso: string) {
  const d = Date.now() - new Date(iso).getTime();
  const s = Math.floor(d / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

type NotificationsContextValue = {
  meId: string;
  items: AppNotification[];
  unread: number;
  loaded: boolean;
  load: () => Promise<void>;
  markAllRead: () => Promise<void>;
  markOne: (id: string) => Promise<void>;
};

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

const NOTIFICATION_LIMIT = 40;

async function loadNotifications(meId: string) {
  const { data } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", meId)
    .order("created_at", { ascending: false })
    .limit(NOTIFICATION_LIMIT);
  return (data ?? []) as AppNotification[];
}

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const meId = user?.id ?? "";
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    if (!meId) {
      setItems([]);
      setLoaded(true);
      return;
    }
    const data = await loadNotifications(meId);
    setItems(data);
    setLoaded(true);
  }, [meId]);

  const loadRef = useRef(load);
  loadRef.current = load;

  useEffect(() => {
    if (!meId) {
      setItems([]);
      setLoaded(false);
      return;
    }
    setLoaded(false);
    void loadRef.current();
    const ch = supabase
      .channel(`notifications-${meId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${meId}` },
        () => {
          void loadRef.current();
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [meId]);

  useEffect(() => {
    const onDmRead = (event: Event) => {
      const channelId = (event as CustomEvent<{ channelId?: string }>).detail?.channelId;
      if (!channelId || !meId) return;
      const { peerId } = parseDmChannel(channelId, meId);
      if (!peerId) return;
      setItems((current) =>
        current.map((n) =>
          n.target_type === "dm" && n.actor_id === peerId && !n.read ? { ...n, read: true } : n,
        ),
      );
    };
    window.addEventListener(DM_CONVERSATION_READ_EVENT, onDmRead);
    return () => window.removeEventListener(DM_CONVERSATION_READ_EVENT, onDmRead);
  }, [meId]);

  const markAllRead = useCallback(async () => {
    if (!meId) return;
    await supabase.from("notifications").update({ read: true }).eq("user_id", meId).eq("read", false);
    setItems((current) => current.map((n) => ({ ...n, read: true })));
  }, [meId]);

  const markOne = useCallback(async (id: string) => {
    if (!meId) return;
    await supabase.from("notifications").update({ read: true }).eq("id", id).eq("user_id", meId);
    setItems((current) => current.map((n) => (n.id === id ? { ...n, read: true } : n)));
  }, [meId]);

  const unread = useMemo(() => items.filter((n) => !n.read).length, [items]);

  const value = useMemo(
    () => ({ meId, items, unread, loaded, load, markAllRead, markOne }),
    [meId, items, unread, loaded, load, markAllRead, markOne],
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationsProvider");
  return ctx;
}
