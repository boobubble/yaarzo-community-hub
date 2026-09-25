import {
  mergeMediaConfig,
  parseGiphyUrl,
  parseYoutubeId,
  type MediaConfig,
} from "@/lib/media/media-providers-config";

export function trimUrlTrailingPunctuation(url: string): string {
  return url.replace(/[)\]},.!?:;]+$/, "");
}

export function firstUrlInText(text: string): string | null {
  const m = (text || "").match(/https?:\/\/\S+/);
  return m ? trimUrlTrailingPunctuation(m[0]) : null;
}

export function resolveActiveMediaEmbed(text: string, mediaInput?: unknown) {
  const media = mergeMediaConfig(mediaInput);
  const url = firstUrlInText(text);
  if (!url) return { url: null, kind: null as "youtube" | "giphy" | null, willRender: false };

  const ytId = parseYoutubeId(url);
  if (ytId) {
    return { url, kind: "youtube" as const, willRender: true };
  }

  const giphy = parseGiphyUrl(url);
  if (giphy && media.giphy.enabled) {
    return { url, kind: "giphy" as const, willRender: true };
  }

  if (/\.gif($|\?)/i.test(url) && /giphy\.com/i.test(url) && media.giphy.enabled) {
    return { url, kind: "giphy" as const, willRender: true };
  }

  return { url, kind: null, willRender: false };
}

export function messageDisplayText(
  text: string,
  mediaInput?: unknown,
): string {
  const safe = (text || "").trim();
  const resolved = resolveActiveMediaEmbed(safe, mediaInput);
  if (!resolved.willRender || !resolved.url) return safe;
  const stripped = safe.replace(resolved.url, "").replace(/\s{2,}/g, " ").trim();
  return stripped || safe;
}

export type { MediaConfig };
