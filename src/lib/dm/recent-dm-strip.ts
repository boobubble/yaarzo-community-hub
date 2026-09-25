import type { CodyPrivateConversation } from "@/lib/codychat-private";
import type { DirectConversation } from "@/lib/dm/direct-conversation";
import type { RegisteredDmConversation } from "@/lib/dm/use-registered-dm";
import type { DirectoryProfile } from "@/lib/profiles/use-profiles-directory";

export type RecentDmStripItem = {
  key: string;
  label: string;
  unread: number;
  avatarUrl?: string;
  conversation: DirectConversation;
  sortAt: number;
};

export function buildRecentDmStripItems(
  registered: RegisteredDmConversation[],
  cody: CodyPrivateConversation[],
  profiles: Record<string, DirectoryProfile>,
  maxItems = 12,
): RecentDmStripItem[] {
  const items: RecentDmStripItem[] = [];

  for (const row of registered) {
    const profile = profiles[row.peerId];
    items.push({
      key: `supabase:${row.peerId}`,
      label: profile?.display_name || profile?.username || "Member",
      unread: row.unread,
      avatarUrl: profile?.avatar_url ?? undefined,
      conversation: {
        backend: "supabase",
        peerSupabaseId: row.peerId,
        peerLabel: profile?.display_name || profile?.username,
      },
      sortAt: new Date(row.lastMessage?.created_at ?? 0).getTime(),
    });
  }

  const codyBase = Date.now();
  cody.forEach((row, index) => {
    items.push({
      key: `codychat:${row.userId}`,
      label: row.userName,
      unread: row.unread,
      avatarUrl: row.avatar,
      conversation: {
        backend: "codychat",
        peerCodyId: row.userId,
        peerName: row.userName,
        ...(row.avatar ? { peerAvatar: row.avatar } : {}),
      },
      sortAt: codyBase - index,
    });
  });

  items.sort((a, b) => b.sortAt - a.sortAt);
  return items.slice(0, maxItems);
}
