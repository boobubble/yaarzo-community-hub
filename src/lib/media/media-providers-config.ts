export interface YoutubeConfig {
  enabled: boolean;
  apiKey: string;
  defaultPrivacy: "public" | "unlisted";
  allowedDomains: string[];
}

export interface GiphyConfig {
  enabled: boolean;
  apiKey: string;
  rating: "g" | "pg" | "pg-13" | "r";
  pageSize: number;
}

export interface MediaConfig {
  youtube: YoutubeConfig;
  giphy: GiphyConfig;
}

export const MEDIA_DEFAULTS: MediaConfig = {
  youtube: {
    enabled: false,
    apiKey: "",
    defaultPrivacy: "public",
    allowedDomains: ["youtube.com", "youtu.be"],
  },
  giphy: {
    enabled: false,
    apiKey: "",
    rating: "pg-13",
    pageSize: 24,
  },
};

export function mergeMediaConfig(raw: unknown): MediaConfig {
  const p = (raw ?? {}) as Partial<MediaConfig>;
  return {
    youtube: { ...MEDIA_DEFAULTS.youtube, ...(p.youtube ?? {}) },
    giphy: { ...MEDIA_DEFAULTS.giphy, ...(p.giphy ?? {}) },
  };
}

export function parseYoutubeId(input: string): string | null {
  const s = (input || "").trim();
  if (!s) return null;
  if (/^[\w-]{11}$/.test(s)) return s;
  try {
    const u = new URL(s);
    const host = u.hostname.replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = u.pathname.slice(1).split("/")[0];
      return id && /^[\w-]{11}$/.test(id) ? id : null;
    }
    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      if (u.pathname === "/watch") {
        const id = u.searchParams.get("v");
        return id && /^[\w-]{11}$/.test(id) ? id : null;
      }
      const m = u.pathname.match(/^\/(embed|shorts|v|live)\/([\w-]{11})/);
      if (m?.[2]) return m[2];
    }
  } catch {
    /* not a URL */
  }
  return null;
}

export function parseGiphyUrl(input: string): { id: string; gifUrl: string } | null {
  const s = (input || "").trim();
  if (!s) return null;
  try {
    const u = new URL(s);
    const host = u.hostname.replace(/^www\./, "");
    if (host.endsWith("giphy.com")) {
      const m =
        u.pathname.match(/-([A-Za-z0-9]{6,})\/?$/) ||
        u.pathname.match(/\/media\/([A-Za-z0-9]+)\//) ||
        u.pathname.match(/\/gifs\/([A-Za-z0-9]+)/);
      if (m) {
        const id = m[1];
        if (!id) return null;
        return { id, gifUrl: `https://media.giphy.com/media/${id}/giphy.gif` };
      }
    }
  } catch {
    /* */
  }
  return null;
}
