import { supabase } from "@/lib/supabase";

export type FriendshipStatus = "pending" | "accepted" | "blocked";

export type FriendshipRow = {
  id: string;
  sender_id: string;
  receiver_id: string;
  status: FriendshipStatus;
  created_at: string;
  updated_at: string;
  /** CodyChat peer when the row is backed by native Cody friends. */
  peerCodyUserId?: string;
  peerUsername?: string;
};

export type FriendshipRelation =
  | "self"
  | "none"
  | "friends"
  | "pending_out"
  | "pending_in"
  | "blocked_out"
  | "blocked_in";

export type FriendshipAction =
  | "sent"
  | "accepted"
  | "already_friends"
  | "already_sent"
  | "rejected"
  | "cancelled"
  | "unfriended"
  | "blocked"
  | "unblocked"
  | "ignored"
  | "unignored";

export type SocialMutationResult =
  | { ok: true; action: FriendshipAction }
  | { ok: false; error: string; code?: string };

function findFriendshipRow(friendships: FriendshipRow[], meId: string, otherId: string) {
  return friendships.find(
    (f) =>
      (f.sender_id === meId && f.receiver_id === otherId) ||
      (f.sender_id === otherId && f.receiver_id === meId),
  );
}

export function getFriendshipRelation(
  friendships: FriendshipRow[],
  meId: string,
  otherId: string,
): FriendshipRelation {
  if (!meId || !otherId || meId === otherId) return "self";
  const row = findFriendshipRow(friendships, meId, otherId);
  if (!row) return "none";
  if (row.status === "accepted") return "friends";
  if (row.status === "blocked") return row.sender_id === meId ? "blocked_out" : "blocked_in";
  if (row.status === "pending") return row.sender_id === meId ? "pending_out" : "pending_in";
  return "none";
}

export async function loadFriendships(meId: string) {
  const { data, error } = await supabase
    .from("friendships")
    .select("*")
    .or(`sender_id.eq.${meId},receiver_id.eq.${meId}`);
  if (error) return { data: [] as FriendshipRow[], error: error.message };
  return { data: (data ?? []) as FriendshipRow[], error: null as string | null };
}

export async function sendFriendRequest(
  meId: string,
  otherId: string,
  friendships: FriendshipRow[],
): Promise<SocialMutationResult> {
  if (!meId || !otherId) return { ok: false, error: "Missing user" };
  if (meId === otherId) return { ok: false, error: "You cannot friend yourself" };
  const row = findFriendshipRow(friendships, meId, otherId);
  if (row?.status === "accepted") return { ok: true, action: "already_friends" };
  if (row?.status === "blocked") return { ok: false, error: "This user is blocked" };
  if (row?.status === "pending") {
    if (row.receiver_id === meId) {
      const { error } = await supabase.from("friendships").update({ status: "accepted" }).eq("id", row.id);
      if (error) return { ok: false, error: error.message, code: error.code };
      return { ok: true, action: "accepted" };
    }
    return { ok: true, action: "already_sent" };
  }
  const { error } = await supabase
    .from("friendships")
    .insert({ sender_id: meId, receiver_id: otherId, status: "pending" });
  if (error) {
    if (error.code === "23505") return { ok: true, action: "already_sent" };
    return { ok: false, error: error.message, code: error.code };
  }
  return { ok: true, action: "sent" };
}

export async function acceptFriendRequest(rowId: string): Promise<SocialMutationResult> {
  const { error } = await supabase.from("friendships").update({ status: "accepted" }).eq("id", rowId);
  if (error) return { ok: false, error: error.message, code: error.code };
  return { ok: true, action: "accepted" };
}

export async function rejectFriendRequest(rowId: string): Promise<SocialMutationResult> {
  const { error } = await supabase.from("friendships").delete().eq("id", rowId);
  if (error) return { ok: false, error: error.message, code: error.code };
  return { ok: true, action: "rejected" };
}

export async function cancelFriendRequest(rowId: string): Promise<SocialMutationResult> {
  const { error } = await supabase.from("friendships").delete().eq("id", rowId);
  if (error) return { ok: false, error: error.message, code: error.code };
  return { ok: true, action: "cancelled" };
}

export async function unfriend(
  meId: string,
  otherId: string,
  friendships: FriendshipRow[],
): Promise<SocialMutationResult> {
  const row = findFriendshipRow(friendships, meId, otherId);
  if (!row || row.status !== "accepted") return { ok: false, error: "Not friends" };
  const { error } = await supabase.from("friendships").delete().eq("id", row.id);
  if (error) return { ok: false, error: error.message, code: error.code };
  return { ok: true, action: "unfriended" };
}

export async function blockUserSocial(
  meId: string,
  otherId: string,
  friendships: FriendshipRow[],
): Promise<SocialMutationResult> {
  const existing = findFriendshipRow(friendships, meId, otherId);
  if (existing) {
    const { error: delErr } = await supabase.from("friendships").delete().eq("id", existing.id);
    if (delErr) return { ok: false, error: delErr.message, code: delErr.code };
  }
  const { error } = await supabase
    .from("friendships")
    .insert({ sender_id: meId, receiver_id: otherId, status: "blocked" });
  if (error) return { ok: false, error: error.message, code: error.code };
  return { ok: true, action: "blocked" };
}

export async function unblockUserSocial(
  meId: string,
  otherId: string,
  friendships: FriendshipRow[],
): Promise<SocialMutationResult> {
  const row = findFriendshipRow(friendships, meId, otherId);
  if (!row || row.status !== "blocked" || row.sender_id !== meId) {
    return { ok: false, error: "Not blocked" };
  }
  const { error } = await supabase.from("friendships").delete().eq("id", row.id);
  if (error) return { ok: false, error: error.message, code: error.code };
  return { ok: true, action: "unblocked" };
}

export function acceptedFriendIds(friendships: FriendshipRow[], meId: string): Set<string> {
  const ids = new Set<string>();
  for (const f of friendships) {
    if (f.status !== "accepted") continue;
    ids.add(f.sender_id === meId ? f.receiver_id : f.sender_id);
  }
  return ids;
}
