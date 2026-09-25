import type { CodyMember } from "@/lib/codychat-adapter";
import type { DirectoryProfile } from "@/lib/profiles/use-profiles-directory";

export const RECENT_OFFLINE_REGISTERED_LIMIT = 18;

export type HybridOnlineMember = {
  key: string;
  codyMember: CodyMember;
  displayName: string;
  subtitle: string;
  avatarUrl?: string;
  isRegistered: boolean;
};

/**
 * Cody live roster supplies presence; registered rows are deduped by Supabase id
 * and enriched from profiles_directory. Guests stay Cody-only (no Supabase row).
 */
export function buildHybridOnlineMembers(
  codyMembers: CodyMember[],
  profiles: Record<string, DirectoryProfile>,
): HybridOnlineMember[] {
  const registeredBySupabaseId = new Map<string, CodyMember>();
  const guests: CodyMember[] = [];

  for (const member of codyMembers) {
    const supabaseId = member.yaarzoUserId?.trim();
    if (supabaseId) {
      if (!registeredBySupabaseId.has(supabaseId)) {
        registeredBySupabaseId.set(supabaseId, member);
      }
      continue;
    }
    guests.push(member);
  }

  const rows: HybridOnlineMember[] = [];

  for (const [supabaseId, codyMember] of registeredBySupabaseId) {
    const profile = profiles[supabaseId];
    rows.push({
      key: `registered:${supabaseId}`,
      codyMember,
      displayName: profile?.display_name || profile?.username || codyMember.name,
      subtitle:
        [
          profile?.gender ?? codyMember.gender,
          profile?.level !== undefined
            ? `Level ${profile.level}`
            : codyMember.level !== undefined
              ? `Level ${codyMember.level}`
              : undefined,
          "Registered",
        ]
          .filter(Boolean)
          .join(" · ") || "Online · Registered",
      avatarUrl: profile?.avatar_url ?? codyMember.avatar,
      isRegistered: true,
    });
  }

  for (const codyMember of guests) {
    rows.push({
      key: `guest:${codyMember.id}`,
      codyMember,
      displayName: codyMember.name,
      subtitle:
        [
          codyMember.gender,
          codyMember.level !== undefined ? `Level ${codyMember.level}` : undefined,
          "Guest",
        ]
          .filter(Boolean)
          .join(" · ") || "Guest",
      avatarUrl: codyMember.avatar,
      isRegistered: false,
    });
  }

  rows.sort((a, b) => a.displayName.localeCompare(b.displayName, undefined, { sensitivity: "base" }));
  return rows;
}

/** Cody `yaarzoUserId` is the stable Supabase profile id when Bridge-linked. */
export function onlineRegisteredSupabaseIds(members: CodyMember[]): Set<string> {
  const ids = new Set<string>();
  for (const member of members) {
    if (member.yaarzoUserId) ids.add(member.yaarzoUserId);
  }
  return ids;
}

export function selectRecentOfflineRegisteredMembers(
  profiles: Record<string, DirectoryProfile>,
  onlineMembers: CodyMember[],
  viewerSupabaseId?: string,
): DirectoryProfile[] {
  const onlineRegistered = onlineRegisteredSupabaseIds(onlineMembers);

  const candidates = Object.values(profiles).filter((profile) => {
    if (viewerSupabaseId && profile.id === viewerSupabaseId) return false;
    if (onlineRegistered.has(profile.id)) return false;
    return true;
  });

  candidates.sort((a, b) => {
    const aTs = a.last_seen ? new Date(a.last_seen).getTime() : 0;
    const bTs = b.last_seen ? new Date(b.last_seen).getTime() : 0;
    if (bTs !== aTs) return bTs - aTs;
    return a.username.localeCompare(b.username);
  });

  return candidates.slice(0, RECENT_OFFLINE_REGISTERED_LIMIT);
}

export function directoryProfileToCodyMember(profile: DirectoryProfile): CodyMember {
  return {
    id: profile.id,
    name: profile.username,
    yaarzoUserId: profile.id,
    ...(profile.avatar_url ? { avatar: profile.avatar_url } : {}),
    ...(profile.level !== undefined ? { level: profile.level } : {}),
    ...(profile.gender ? { gender: profile.gender } : {}),
  };
}
