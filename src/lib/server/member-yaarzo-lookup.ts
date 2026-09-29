import { createClient } from "@supabase/supabase-js";

import type { CodyMember } from "@/lib/codychat-adapter";
import {
  PROFILES_DIRECTORY_SELECT,
  type ProfilesDirectoryRow,
} from "@/lib/profiles/profiles-directory-select";

let usernameMapCache: { at: number; map: Map<string, string> } | null = null;
const CACHE_MS = 45_000;

export type RegisteredMemberProfile = {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  about_me: string | null;
  avatar_url: string | null;
  avatar_color: string | null;
  xp: number;
  level: number;
  status: string | null;
  gender: string | null;
  country_code: string | null;
  last_seen: string | null;
};

export async function loadRegisteredMemberProfiles(): Promise<RegisteredMemberProfile[]> {
  const serviceKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  const url = process.env["VITE_SUPABASE_URL"];
  if (!serviceKey || !url) return [];

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await admin
    .from("profiles_directory")
    .select(PROFILES_DIRECTORY_SELECT)
    .order("username", { ascending: true });

  if (error || !data) return [];
  return (data as ProfilesDirectoryRow[]).map((row) => ({
    ...row,
    display_name: null,
    status: row.status ?? null,
  }));
}

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
export async function resolveUsernameByYaarzoId(yaarzoUserId: string): Promise<string | null> {
  const id = yaarzoUserId.trim();
  if (!id) return null;

  const serviceKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  const url = process.env["VITE_SUPABASE_URL"];
  if (!serviceKey || !url) return null;

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await admin.from("profiles_directory").select("username").eq("id", id).maybeSingle();
  if (error || !data?.username) return null;
  return String(data.username);
}

export async function enrichMembersWithYaarzoIds(members: CodyMember[]): Promise<CodyMember[]> {
  const map = await loadUsernameToIdMap();
  if (!map.size) return members.map((m) => ({ ...m, yaarzoUserId: null }));

  return members.map((member) => {
    const yaarzoUserId = map.get(member.name.trim().toLowerCase()) ?? null;
    return { ...member, yaarzoUserId };
  });
}
