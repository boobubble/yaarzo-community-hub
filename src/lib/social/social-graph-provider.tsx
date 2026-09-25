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
import { supabase } from "@/lib/supabase";
import {
  acceptFriendRequest,
  blockUserSocial,
  cancelFriendRequest,
  getFriendshipRelation,
  loadFriendships,
  rejectFriendRequest,
  sendFriendRequest,
  unfriend,
  unblockUserSocial,
  acceptedFriendIds,
  type FriendshipRelation,
  type FriendshipRow,
  type SocialMutationResult,
} from "@/lib/social/friendships";

type SocialGraphContextValue = {
  meId: string;
  friendships: FriendshipRow[];
  friendshipsLoaded: boolean;
  friendIds: Set<string>;
  getRelation: (otherId: string) => FriendshipRelation;
  refreshFriendships: () => Promise<void>;
  sendFriendRequest: (otherId: string) => Promise<SocialMutationResult>;
  acceptRequest: (rowId: string) => Promise<SocialMutationResult>;
  rejectRequest: (rowId: string) => Promise<SocialMutationResult>;
  cancelRequest: (rowId: string) => Promise<SocialMutationResult>;
  unfriendUser: (otherId: string) => Promise<SocialMutationResult>;
  blockUser: (otherId: string) => Promise<SocialMutationResult>;
  unblockUser: (otherId: string) => Promise<SocialMutationResult>;
};

const SocialGraphContext = createContext<SocialGraphContextValue | null>(null);

export function SocialGraphProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const meId = user?.id ?? "";
  const [friendships, setFriendships] = useState<FriendshipRow[]>([]);
  const [friendshipsLoaded, setFriendshipsLoaded] = useState(false);
  const friendshipsRef = useRef(friendships);
  friendshipsRef.current = friendships;

  const refreshFriendships = useCallback(async () => {
    if (!meId) {
      setFriendships([]);
      setFriendshipsLoaded(true);
      return;
    }
    const { data } = await loadFriendships(meId);
    setFriendships(data);
    setFriendshipsLoaded(true);
  }, [meId]);

  const refreshRef = useRef(refreshFriendships);
  refreshRef.current = refreshFriendships;

  useEffect(() => {
    setFriendshipsLoaded(false);
    void refreshRef.current();
  }, [meId]);

  useEffect(() => {
    if (!meId) return;
    const ch = supabase
      .channel(`friendships-${meId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "friendships" },
        () => {
          void refreshRef.current();
        },
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [meId]);

  const friendIds = useMemo(() => acceptedFriendIds(friendships, meId), [friendships, meId]);

  const value = useMemo<SocialGraphContextValue>(
    () => ({
      meId,
      friendships,
      friendshipsLoaded,
      friendIds,
      getRelation: (otherId) => getFriendshipRelation(friendships, meId, otherId),
      refreshFriendships,
      sendFriendRequest: (otherId) => sendFriendRequest(meId, otherId, friendshipsRef.current),
      acceptRequest: acceptFriendRequest,
      rejectRequest: rejectFriendRequest,
      cancelRequest: cancelFriendRequest,
      unfriendUser: (otherId) => unfriend(meId, otherId, friendshipsRef.current),
      blockUser: (otherId) => blockUserSocial(meId, otherId, friendshipsRef.current),
      unblockUser: (otherId) => unblockUserSocial(meId, otherId, friendshipsRef.current),
    }),
    [meId, friendships, friendshipsLoaded, friendIds, refreshFriendships],
  );

  return <SocialGraphContext.Provider value={value}>{children}</SocialGraphContext.Provider>;
}

export function useSocialGraph() {
  const ctx = useContext(SocialGraphContext);
  if (!ctx) throw new Error("useSocialGraph must be used within SocialGraphProvider");
  return ctx;
}
