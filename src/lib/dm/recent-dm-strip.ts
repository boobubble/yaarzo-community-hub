import type { CodyPrivateConversation } from "@/lib/codychat-private";
import type { DirectConversation } from "@/lib/dm/direct-conversation";
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
  cody: CodyPrivateConversation[],
  profiles: Record<string, DirectoryProfile>,
  maxItems = 12,
): RecentDmStripItem[] {
  const items: RecentDmStripItem[] = [];
  const codyBase = Date.now();
  const profileByUsername = new Map<string, DirectoryProfile>();
  for (const profile of Object.values(profiles)) {
    profileByUsername.set(profile.username.trim().toLowerCase(), profile);
  }

  cody.forEach((row, index) => {
    const profile = profileByUsername.get(row.userName.trim().toLowerCase());

    const avatarUrl = profile?.avatar_url ?? row.avatar;
    items.push({
      key: `codychat:${row.userId}`,
      label: profile?.display_name || profile?.username || row.userName,
      unread: row.unread,
      ...(avatarUrl ? { avatarUrl } : {}),
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
