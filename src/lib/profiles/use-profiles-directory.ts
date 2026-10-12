import type { SupabaseClient } from "@supabase/supabase-js";
import { useCallback, useEffect, useMemo, useState } from "react";

import { supabase } from "@/lib/supabase";
import {
  PROFILES_DIRECTORY_SELECT,
  type ProfilesDirectoryRow,
} from "@/lib/profiles/profiles-directory-select";

export type DirectoryProfile = {
  id: string;
  username: string;
  display_name: string | null;
  bio: string | null;
  about_me: string | null;
  avatar_url: string | null;
  avatar_color: string | null;
  xp: number;
  level: number;
  status: string;
  gender: string | null;
  country_code: string | null;
  last_seen: string | null;
};

export function useProfilesDirectory(enabled: boolean, client: SupabaseClient = supabase) {
  const [profiles, setProfiles] = useState<Record<string, DirectoryProfile>>({});
  const [byUsername, setByUsername] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setProfiles({});
      setByUsername({});
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    const { data, error: queryError } = await client
      .from("profiles_directory")
      .select(PROFILES_DIRECTORY_SELECT)
      .order("username", { ascending: true });
    if (queryError) {
      setProfiles({});
      setByUsername({});
      setError(queryError.message);
    } else if (data) {
      const map: Record<string, DirectoryProfile> = {};
      const names: Record<string, string> = {};
      for (const row of data as ProfilesDirectoryRow[]) {
        map[row.id] = { ...row, display_name: null };
        if (row.username) names[row.username.toLowerCase()] = row.id;
      }
      setProfiles(map);
      setByUsername(names);
    }
    setLoading(false);
  }, [enabled, client]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!enabled) return;
    const ch = client
      .channel("profiles-directory-chat")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
        void refresh();
      })
      .subscribe();
    return () => {
      void client.removeChannel(ch);
    };
  }, [enabled, refresh, client]);

  const resolveByUsername = useCallback(
    (username: string) => {
      const id = byUsername[username.trim().toLowerCase()];
      return id ? profiles[id] : undefined;
    },
    [byUsername, profiles],
  );

  return useMemo(
    () => ({
      profiles,
      loading,
      error,
      refresh,
      resolveByUsername,
      getProfile: (id: string) => profiles[id],
    }),
    [profiles, loading, error, refresh, resolveByUsername],
  );
}
