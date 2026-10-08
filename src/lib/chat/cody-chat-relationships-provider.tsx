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

import type { CodyFriendsSnapshot } from "@/lib/chat/cody-friends";
import { fetchCodyFriendsSnapshot, postCodyFriendAction } from "@/lib/social/cody-friends-client";
import {
  codyRelationForCodyUser,
  codyRelationForYaarzoUser,
} from "@/lib/social/cody-social-map";
import type { FriendshipRelation } from "@/lib/social/friendships";

type CodyChatRelationshipsContextValue = {
  loaded: boolean;
  available: boolean;
  snapshot: CodyFriendsSnapshot | null;
  ignoredCodyUserIds: Set<string>;
  refresh: () => Promise<void>;
  getRelationForCodyUser: (codyUserId: string) => FriendshipRelation;
  getRelationForYaarzoUser: (yaarzoUserId: string) => FriendshipRelation;
  sendToCodyUser: (codyUserId: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  sendToYaarzoUser: (yaarzoUserId: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  acceptCodyUser: (codyUserId: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  declineCodyUser: (codyUserId: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  cancelCodyUser: (codyUserId: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  unfriendCodyUser: (codyUserId: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  ignoreCodyUser: (codyUserId: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  unignoreCodyUser: (codyUserId: string) => Promise<{ ok: true } | { ok: false; error: string }>;
};

const CodyChatRelationshipsContext = createContext<CodyChatRelationshipsContextValue | null>(null);

export function CodyChatRelationshipsProvider({
  children,
  chatSessionActive,
  yaarzoUserId,
}: {
  children: ReactNode;
  /** True when the user has an active CodyChat session in this chatroom. */
  chatSessionActive: boolean;
  yaarzoUserId?: string | undefined;
}) {
  const [snapshot, setSnapshot] = useState<CodyFriendsSnapshot | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [available, setAvailable] = useState(false);
  const snapshotRef = useRef(snapshot);
  snapshotRef.current = snapshot;

  const refresh = useCallback(async () => {
    if (!chatSessionActive || !yaarzoUserId) {
      setSnapshot(null);
      setAvailable(false);
      setLoaded(true);
      return;
    }
    const next = await fetchCodyFriendsSnapshot();
    if (next) {
      setSnapshot(next);
      setAvailable(true);
    } else {
      setSnapshot(null);
      setAvailable(false);
    }
    setLoaded(true);
  }, [chatSessionActive, yaarzoUserId]);

  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  useEffect(() => {
    setLoaded(false);
    void refreshRef.current();
  }, [chatSessionActive, yaarzoUserId]);

  const afterMutation = useCallback(async () => {
    await refreshRef.current();
  }, []);

  const mutate = useCallback(
    async (
      action: "send" | "accept" | "remove" | "ignore" | "unignore",
      input: { codyUserId?: string; yaarzoUserId?: string },
    ) => {
      const result = await postCodyFriendAction({ action, ...input });
      if (!result.ok) return result;
      await afterMutation();
      return result;
    },
    [afterMutation],
  );

  const ignoredCodyUserIds = useMemo(
    () => new Set(snapshot?.ignored.map((p) => p.codyUserId) ?? []),
    [snapshot],
  );

  const value = useMemo<CodyChatRelationshipsContextValue>(
    () => ({
      loaded,
      available,
      snapshot,
      ignoredCodyUserIds,
      refresh,
      getRelationForCodyUser: (codyUserId) => {
        if (!snapshotRef.current) return "none";
        return codyRelationForCodyUser(snapshotRef.current, codyUserId);
      },
      getRelationForYaarzoUser: (otherYaarzoId) => {
        if (!snapshotRef.current || !yaarzoUserId) return "none";
        return codyRelationForYaarzoUser(snapshotRef.current, yaarzoUserId, otherYaarzoId);
      },
      sendToCodyUser: (codyUserId) => mutate("send", { codyUserId }),
      sendToYaarzoUser: (id) => mutate("send", { yaarzoUserId: id }),
      acceptCodyUser: (codyUserId) => mutate("accept", { codyUserId }),
      declineCodyUser: (codyUserId) => mutate("remove", { codyUserId }),
      cancelCodyUser: (codyUserId) => mutate("remove", { codyUserId }),
      unfriendCodyUser: (codyUserId) => mutate("remove", { codyUserId }),
      ignoreCodyUser: (codyUserId) => mutate("ignore", { codyUserId }),
      unignoreCodyUser: (codyUserId) => mutate("unignore", { codyUserId }),
    }),
    [loaded, available, snapshot, ignoredCodyUserIds, refresh, mutate, yaarzoUserId],
  );

  return (
    <CodyChatRelationshipsContext.Provider value={value}>{children}</CodyChatRelationshipsContext.Provider>
  );
}

export function useCodyChatRelationships() {
  const ctx = useContext(CodyChatRelationshipsContext);
  if (!ctx) {
    throw new Error("useCodyChatRelationships must be used within CodyChatRelationshipsProvider");
  }
  return ctx;
}
