import type { CodyMember } from "@/lib/codychat-adapter";
import { getCodyMemberFromUsernameCache, rememberCodyMember } from "@/lib/dm/cody-user-id-cache";
import { findCodyMemberForProfile } from "@/lib/members/recent-offline-registered";
import type { DirectoryProfile } from "@/lib/profiles/use-profiles-directory";

/**
 * Resolve a CodyChat user for DM (online roster is optional fast path only).
 */
export async function resolveCodyMemberForDm(
  profile: DirectoryProfile,
  roster: CodyMember[],
): Promise<CodyMember | null> {
  const fromRoster = findCodyMemberForProfile(profile, roster);
  if (fromRoster) {
    rememberCodyMember(fromRoster);
    return fromRoster;
  }

  const fromCache = getCodyMemberFromUsernameCache(profile.username);
  if (fromCache) return fromCache;

  const response = await fetch(
    `/api/chat/cody-user-resolve?username=${encodeURIComponent(profile.username)}`,
    { cache: "no-store" },
  );
  if (!response.ok) return null;

  const json = (await response.json()) as { member?: CodyMember | null };
  const member = json.member ?? null;
  if (member) rememberCodyMember(member);
  return member;
}
