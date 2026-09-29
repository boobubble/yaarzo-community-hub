import type { CodyFriendsSnapshot } from "@/lib/chat/cody-friends";
import type { FriendshipRelation, FriendshipRow } from "@/lib/social/friendships";

function peerYaarzoOrSynthetic(peer: { codyUserId: string; yaarzoUserId?: string | null }) {
  return peer.yaarzoUserId ?? `cody:${peer.codyUserId}`;
}

export function codySnapshotToFriendshipRows(meId: string, snapshot: CodyFriendsSnapshot): FriendshipRow[] {
  const stamp = new Date().toISOString();
  const rows: FriendshipRow[] = [];

  for (const peer of snapshot.incoming) {
    rows.push({
      id: `cody:incoming:${peer.codyUserId}`,
      sender_id: peerYaarzoOrSynthetic(peer),
      receiver_id: meId,
      status: "pending",
      created_at: stamp,
      updated_at: stamp,
      peerCodyUserId: peer.codyUserId,
      peerUsername: peer.username,
    });
  }

  for (const peer of snapshot.outgoing) {
    rows.push({
      id: `cody:outgoing:${peer.codyUserId}`,
      sender_id: meId,
      receiver_id: peerYaarzoOrSynthetic(peer),
      status: "pending",
      created_at: stamp,
      updated_at: stamp,
      peerCodyUserId: peer.codyUserId,
      peerUsername: peer.username,
    });
  }

  for (const peer of snapshot.accepted) {
    rows.push({
      id: `cody:accepted:${peer.codyUserId}`,
      sender_id: meId,
      receiver_id: peerYaarzoOrSynthetic(peer),
      status: "accepted",
      created_at: stamp,
      updated_at: stamp,
      peerCodyUserId: peer.codyUserId,
      peerUsername: peer.username,
    });
  }

  return rows;
}

export function codyRelationForYaarzoUser(
  snapshot: CodyFriendsSnapshot,
  meId: string,
  otherYaarzoId: string,
): FriendshipRelation {
  if (!meId || !otherYaarzoId || meId === otherYaarzoId) return "self";
  if (snapshot.accepted.some((p) => p.yaarzoUserId === otherYaarzoId)) return "friends";
  if (snapshot.incoming.some((p) => p.yaarzoUserId === otherYaarzoId)) return "pending_in";
  if (snapshot.outgoing.some((p) => p.yaarzoUserId === otherYaarzoId)) return "pending_out";
  return "none";
}

export function codyRelationForCodyUser(snapshot: CodyFriendsSnapshot, codyUserId: string): FriendshipRelation {
  if (snapshot.accepted.some((p) => p.codyUserId === codyUserId)) return "friends";
  if (snapshot.incoming.some((p) => p.codyUserId === codyUserId)) return "pending_in";
  if (snapshot.outgoing.some((p) => p.codyUserId === codyUserId)) return "pending_out";
  return "none";
}

export function parseCodyUserIdFromFriendRowId(rowId: string): string | null {
  const match = /^cody:(?:incoming|outgoing|accepted):(\d+)$/u.exec(rowId);
  return match?.[1] ?? null;
}
