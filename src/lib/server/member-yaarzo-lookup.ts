import { createClient } from "@supabase/supabase-js";

import type { CodyMember } from "@/lib/codychat-adapter";

let usernameMapCache: { at: number; map: Map<string, string> } | null = null;
const CACHE_MS = 45_000;

async function loadUsernameToIdMap(): Promise<Map<string, string>> {
  const now = Date.now();
  if (usernameMapCache && now - usernameMapCache.at < CACHE_MS) {
    return usernameMapCache.map;
  }

  const serviceKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  const url = process.env["VITE_SUPABASE_URL"];
  if (!serviceKey || !url) {
    return new Map();
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await admin.from("profiles_directory").select("id, username");
  if (error || !data) {
    return usernameMapCache?.map ?? new Map();
  }

  const map = new Map<string, string>();
  for (const row of data as { id: string; username: string }[]) {
    if (row.username) map.set(row.username.trim().toLowerCase(), row.id);
  }
  usernameMapCache = { at: now, map };
  return map;
}

/**
 * Bridge-linked Cody users use their Supabase profile username as the Cody nickname.
 * Map roster names to Supabase UUIDs server-side (not display-name guessing).
 */
export async function enrichMembersWithYaarzoIds(members: CodyMember[]): Promise<CodyMember[]> {
  const map = await loadUsernameToIdMap();
  if (!map.size) return members.map((m) => ({ ...m, yaarzoUserId: null }));

  return members.map((member) => {
    const yaarzoUserId = map.get(member.name.trim().toLowerCase()) ?? null;
    return { ...member, yaarzoUserId };
  });
}
