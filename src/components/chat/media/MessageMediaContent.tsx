import { FileIcon, Play } from "lucide-react";

import type { CodyMessagePart } from "@/lib/chat/cody-message-content";
import { messageDisplayText, resolveActiveMediaEmbed } from "@/lib/media/media-embed-text";
import { parseGiphyUrl, parseYoutubeId } from "@/lib/media/media-providers-config";
import type { MediaConfig } from "@/lib/media/media-providers-config";

type Props = {
  text: string;
  parts?: CodyMessagePart[] | undefined;
  media?: MediaConfig | null;
  className?: string;
};

export function MessageMediaContent({ text, parts, media, className }: Props) {
  if (parts && parts.length > 0) {
    return (
      <div className={`space-y-1 ${className ?? ""}`}>
        {parts.map((part, index) => {
          if (part.kind === "text") {
            const display = messageDisplayText(part.text, media);
            const resolved = resolveActiveMediaEmbed(part.text, media);
            return (
              <div key={`t-${index}`}>
                {display ? (
                  <p className="whitespace-pre-wrap break-words text-sm text-foreground">{display}</p>
                ) : null}
                {resolved.willRender && resolved.url && resolved.kind === "youtube" ? (
                  <YoutubeEmbed url={resolved.url} />
                ) : null}
                {resolved.willRender && resolved.url && resolved.kind === "giphy" ? (
                  <GiphyEmbed url={resolved.url} />
                ) : null}
              </div>
            );
          }
          if (part.kind === "emoji") {
            return (
              <img
                key={`e-${index}`}
                src={part.imageUrl}
                alt={part.token}
                title={part.token}
                className="inline-block h-5 w-5 align-text-bottom"
                loading="lazy"
              />
            );
          }
          if (part.kind === "image") {
            return (
              <a
                key={`i-${index}`}
                href={part.url}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-1 block max-w-[280px] overflow-hidden rounded-xl border border-border"
              >
                <img
                  src={part.url}
                  alt=""
                  loading="lazy"
                  className="block max-h-72 w-full object-contain bg-black/20"
                />
              </a>
            );
          }
          return (
            <a
              key={`f-${index}`}
              href={part.url}
              target="_blank"
              rel="noreferrer noopener"
              className="mt-1 flex max-w-[280px] items-center gap-2 rounded-xl border border-border bg-muted/40 px-3 py-2 text-left hover:bg-muted/60"
            >
              <FileIcon className="size-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 truncate text-xs font-semibold text-foreground">{part.filename}</span>
            </a>
          );
        })}
      </div>
    );
  }

  const display = messageDisplayText(text, media);
  const resolved = resolveActiveMediaEmbed(text, media);

  return (
    <div className={className}>
      {display ? <p className="whitespace-pre-wrap break-words text-sm text-foreground">{display}</p> : null}
      {resolved.willRender && resolved.url && resolved.kind === "youtube" ? (
        <YoutubeEmbed url={resolved.url} />
      ) : null}
      {resolved.willRender && resolved.url && resolved.kind === "giphy" ? (
        <GiphyEmbed url={resolved.url} />
      ) : null}
    </div>
  );
}

function YoutubeEmbed({ url }: { url: string }) {
  const id = parseYoutubeId(url);
  if (!id) return null;
  const watchUrl = `https://www.youtube.com/watch?v=${id}`;
  const thumb = `https://i.ytimg.com/vi/${id}/mqdefault.jpg`;
  return (
    <div className="mt-1 max-w-[320px]">
      <a
        href={watchUrl}
        target="_blank"
        rel="noreferrer noopener"
        className="block overflow-hidden rounded-xl border border-border bg-black"
      >
        <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
          <img src={thumb} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
          <span className="absolute inset-0 grid place-items-center bg-black/35">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-red-600 text-white">
              <Play className="ml-0.5 h-5 w-5 fill-current" />
            </span>
          </span>
        </div>
      </a>
      <a
        href={watchUrl}
        target="_blank"
        rel="noreferrer noopener"
        className="mt-1 block truncate text-[10px] text-primary hover:underline"
      >
        {url}
      </a>
    </div>
  );
}

function GiphyEmbed({ url }: { url: string }) {
  const giphy = parseGiphyUrl(url);
  const src = giphy?.gifUrl ?? (/\.gif($|\?)/i.test(url) ? url : null);
  if (!src) return null;
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer noopener"
      className="mt-1 block max-w-[280px] overflow-hidden rounded-xl border border-border"
    >
      <img src={src} alt="GIF" loading="lazy" className="block max-h-72 w-full object-contain bg-black/30" />
      <p className="px-2 py-1 text-[9px] text-muted-foreground">via GIPHY</p>
    </a>
  );
}
