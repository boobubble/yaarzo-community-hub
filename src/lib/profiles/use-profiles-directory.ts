import { useCallback, useEffect, useMemo, useState } from "react";

import { supabase } from "@/lib/supabase";

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
};

export function useProfilesDirectory(enabled: boolean) {
  const [profiles, setProfiles] = useState<Record<string, DirectoryProfile>>({});
  const [byUsername, setByUsername] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!enabled) {
      setProfiles({});
      setByUsername({});
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles_directory")
      .select(
        "id, username, display_name, bio, about_me, avatar_url, avatar_color, xp, level, status, gender, country_code",
      )
      .order("username", { ascending: true });
    if (!error && data) {
      const map: Record<string, DirectoryProfile> = {};
      const names: Record<string, string> = {};
      for (const row of data as DirectoryProfile[]) {
        map[row.id] = row;
        if (row.username) names[row.username.toLowerCase()] = row.id;
      }
      setProfiles(map);
      setByUsername(names);
    }
    setLoading(false);
  }, [enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!enabled) return;
    const ch = supabase
      .channel("profiles-directory-chat")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, () => {
        void refresh();
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(ch);
    };
  }, [enabled, refresh]);

  const resolveByUsername = useCallback(
    (username: string) => {
      const id = byUsername[username.trim().toLowerCase()];
      return id ? profiles[id] : undefined;
    },
    [byUsername, profiles],
  );

  return useMemo(
    () => ({ profiles, loading, refresh, resolveByUsername, getProfile: (id: string) => profiles[id] }),
    [profiles, loading, refresh, resolveByUsername],
  );
}
