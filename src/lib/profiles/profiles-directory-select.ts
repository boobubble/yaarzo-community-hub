/** Columns exposed by the `profiles_directory` view (PostgREST). */
export const PROFILES_DIRECTORY_SELECT =
  "id, username, bio, about_me, avatar_url, avatar_color, xp, level, status, gender, country_code, last_seen";

export type ProfilesDirectoryRow = {
  id: string;
  username: string;
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
