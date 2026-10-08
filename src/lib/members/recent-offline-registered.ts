import type { CodyMember } from "@/lib/codychat-adapter";
import type { DirectoryProfile } from "@/lib/profiles/use-profiles-directory";

export type HybridOnlineMember = {
  key: string;
  codyMember: CodyMember;
  displayName: string;
  subtitle: string;
  avatarUrl?: string;
  isRegistered: boolean;
};

/** Yaarzo profile IDs currently on the CodyChat live roster. */
export function onlineYaarzoIdsFromRoster(codyMembers: CodyMember[]): Set<string> {
  const ids = new Set<string>();
  for (const member of codyMembers) {
    if (member.yaarzoUserId) ids.add(member.yaarzoUserId);
  }
  return ids;
}

/**
 * Online members come from the CodyChat live roster, enriched with Supabase profile data when mapped.
 */
export function buildHybridOnlineMembers(
  codyMembers: CodyMember[],
  profiles: Record<string, DirectoryProfile>,
): HybridOnlineMember[] {
  const rows: HybridOnlineMember[] = [];

  for (const codyMember of codyMembers) {
    const yaarzoId = codyMember.yaarzoUserId ?? null;
    const profile = yaarzoId ? profiles[yaarzoId] : undefined;
    const isRegistered = Boolean(yaarzoId);

    const displayName = profile
      ? profile.display_name || profile.username
      : codyMember.name;
    const avatarUrl = profile?.avatar_url ?? codyMember.avatar;
    const level = profile?.level ?? codyMember.level;
    const gender = profile?.gender ?? codyMember.gender;

    rows.push({
      key: `cody:${codyMember.id}`,
      codyMember: {
        ...codyMember,
        ...(avatarUrl ? { avatar: avatarUrl } : {}),
        ...(level !== undefined ? { level } : {}),
        ...(gender ? { gender } : {}),
      },
      displayName,
      subtitle: isRegistered
        ? [gender, level !== undefined ? `Level ${level}` : undefined, "Registered"]
            .filter(Boolean)
            .join(" · ") || "Online · Registered"
        : [gender, level !== undefined ? `Level ${level}` : undefined, "Guest"]
            .filter(Boolean)
            .join(" · ") || "Guest",
      ...(avatarUrl ? { avatarUrl } : {}),
      isRegistered,
    });
  }

  rows.sort((a, b) =>
    a.displayName.localeCompare(b.displayName, undefined, { sensitivity: "base" }),
  );
  return rows;
}

export const RECENT_OFFLINE_REGISTERED_LIMIT = 30;

export function selectRecentOfflineRegisteredMembers(
  profiles: Record<string, DirectoryProfile>,
  onlineYaarzoIds: Set<string>,
  viewerSupabaseId?: string,
): DirectoryProfile[] {
  const candidates = Object.values(profiles).filter((profile) => {
    if (
      viewerSupabaseId &&
      profile.id === viewerSupabaseId &&
      onlineYaarzoIds.has(viewerSupabaseId)
    ) {
      return false;
    }
    if (onlineYaarzoIds.has(profile.id)) return false;
    return true;
  });

  candidates.sort((a, b) => {
    const aHasLastSeen = Boolean(a.last_seen);
    const bHasLastSeen = Boolean(b.last_seen);
    if (aHasLastSeen && !bHasLastSeen) return -1;
    if (!aHasLastSeen && bHasLastSeen) return 1;
    if (aHasLastSeen && bHasLastSeen) {
      const aTs = new Date(a.last_seen!).getTime();
      const bTs = new Date(b.last_seen!).getTime();
      if (bTs !== aTs) return bTs - aTs;
    }
    return a.username.localeCompare(b.username);
  });

  return candidates.slice(0, RECENT_OFFLINE_REGISTERED_LIMIT);
}

/** Fast path: match a profile against the live room roster only. */
export function findCodyMemberForProfile(
  profile: DirectoryProfile,
  roster: CodyMember[],
): CodyMember | null {
  const byYaarzo = roster.find((m) => m.yaarzoUserId === profile.id);
  if (byYaarzo) return byYaarzo;

  const needle = profile.username.trim().toLowerCase();
  return roster.find((m) => m.name.trim().toLowerCase() === needle) ?? null;
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
