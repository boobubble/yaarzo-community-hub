import type { CodyMember } from "@/lib/codychat-adapter";

export type DirectConversation =
  | {
      backend: "supabase";
      peerSupabaseId: string;
      peerLabel?: string;
    }
  | {
      backend: "codychat";
      peerCodyId: string;
      peerName: string;
      peerAvatar?: string;
    };

export type ViewerIdentity = {
  supabaseUserId?: string | null | undefined;
};

export type MemberIdentity = Pick<CodyMember, "id" | "name" | "avatar" | "yaarzoUserId">;

/** CodyChat is the sole DM backend; target must be a CodyChat roster member. */
export function resolveDmRoute(
  _viewer: ViewerIdentity,
  target: MemberIdentity,
): DirectConversation | null {
  if (!target.id || !target.name) return null;

  return {
    backend: "codychat",
    peerCodyId: target.id,
    peerName: target.name,
    ...(target.avatar ? { peerAvatar: target.avatar } : {}),
  };
}

export function codychatTargetFromConversation(
  conv: DirectConversation,
): { userId: string; userName: string; avatar?: string } | null {
  if (conv.backend !== "codychat") return null;
  return {
    userId: conv.peerCodyId,
    userName: conv.peerName,
    ...(conv.peerAvatar ? { avatar: conv.peerAvatar } : {}),
  };
}

export function conversationKey(conv: DirectConversation): string {
  return conv.backend === "supabase"
    ? `supabase:${conv.peerSupabaseId}`
    : `codychat:${conv.peerCodyId}`;
}
