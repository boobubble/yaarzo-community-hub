import { createClient } from "@supabase/supabase-js";

import { MEDIA_DEFAULTS, mergeMediaConfig, type MediaConfig } from "@/lib/media/media-providers-config";

let cached: { at: number; config: MediaConfig } | null = null;
const CACHE_MS = 60_000;

function envMediaConfig(): MediaConfig {
  const base = mergeMediaConfig(null);
  const giphyKey = process.env["GIPHY_API_KEY"]?.trim();
  const youtubeKey = process.env["YOUTUBE_API_KEY"]?.trim();
  return {
    youtube: {
      ...base.youtube,
      enabled: base.youtube.enabled || !!youtubeKey,
      apiKey: youtubeKey || base.youtube.apiKey,
    },
    giphy: {
      ...base.giphy,
      enabled: base.giphy.enabled || !!giphyKey,
      apiKey: giphyKey || base.giphy.apiKey,
    },
  };
}

export async function loadServerMediaConfig(): Promise<MediaConfig> {
  const now = Date.now();
  if (cached && now - cached.at < CACHE_MS) return cached.config;

  const serviceKey = process.env["SUPABASE_SERVICE_ROLE_KEY"];
  const url = process.env["VITE_SUPABASE_URL"];

  if (serviceKey && url) {
    try {
      const admin = createClient(url, serviceKey, {
        auth: { autoRefreshToken: false, persistSession: false },
      });
      const { data } = await admin.from("app_settings").select("value").eq("key", "media").maybeSingle();
      const merged = mergeMediaConfig(data?.value ?? null);
      const withEnv = envMediaConfig();
      const config: MediaConfig = {
        youtube: {
          ...merged.youtube,
          apiKey: withEnv.youtube.apiKey || merged.youtube.apiKey,
          enabled: merged.youtube.enabled || withEnv.youtube.enabled,
        },
        giphy: {
          ...merged.giphy,
          apiKey: withEnv.giphy.apiKey || merged.giphy.apiKey,
          enabled: merged.giphy.enabled || withEnv.giphy.enabled,
        },
      };
      cached = { at: now, config };
      return config;
    } catch {
      /* fall through */
    }
  }

  const config = envMediaConfig();
  cached = { at: now, config };
  return config;
}

export function publicMediaFlags(config: MediaConfig) {
  return {
    youtube: { enabled: config.youtube.enabled && !!config.youtube.apiKey.trim() },
    giphy: {
      enabled: config.giphy.enabled && !!config.giphy.apiKey.trim(),
      rating: config.giphy.rating,
      pageSize: config.giphy.pageSize,
    },
  };
}

export { MEDIA_DEFAULTS };
