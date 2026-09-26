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

/**
 * Registered presence comes from Supabase Realtime Presence.
 * Guest presence comes from the CodyChat live roster.
 */
export function buildHybridOnlineMembers(
  codyMembers: CodyMember[],
  profiles: Record<string, DirectoryProfile>,
  registeredOnlineIds: Set<string>,
): HybridOnlineMember[] {
  const rows: HybridOnlineMember[] = [];

  for (const supabaseId of registeredOnlineIds) {
    const profile = profiles[supabaseId];
    if (!profile) continue;

    rows.push({
      key: `registered:${supabaseId}`,
      codyMember: {
        id: profile.id,
        name: profile.username,
        yaarzoUserId: profile.id,
        ...(profile.avatar_url ? { avatar: profile.avatar_url } : {}),
        ...(profile.level !== undefined ? { level: profile.level } : {}),
        ...(profile.gender ? { gender: profile.gender } : {}),
      },
      displayName: profile.display_name || profile.username,
      subtitle:
        [profile.gender, `Level ${profile.level}`, "Registered"]
          .filter(Boolean)
          .join(" · ") || "Online · Registered",
      avatarUrl: profile.avatar_url ?? undefined,
      isRegistered: true,
    });
  }

  for (const codyMember of codyMembers) {
    if (codyMember.yaarzoUserId) continue;

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

  rows.sort((a, b) =>
    a.displayName.localeCompare(b.displayName, undefined, { sensitivity: "base" }),
  );
  return rows;
}

export const RECENT_OFFLINE_REGISTERED_LIMIT = 30;

export function selectRecentOfflineRegisteredMembers(
  profiles: Record<string, DirectoryProfile>,
  registeredOnlineIds: Set<string>,
  viewerSupabaseId?: string,
): DirectoryProfile[] {
  const candidates = Object.values(profiles).filter((profile) => {
    if (
      viewerSupabaseId &&
      profile.id === viewerSupabaseId &&
      registeredOnlineIds.has(viewerSupabaseId)
    ) {
      return false;
    }
    if (registeredOnlineIds.has(profile.id)) return false;
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
