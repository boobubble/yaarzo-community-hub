import { FormEvent, useState } from "react";
import { Film, Image, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { GiphyPicker, type GifItem } from "@/components/chat/media/GiphyPicker";
import { YoutubePicker } from "@/components/chat/media/YoutubePicker";

type MediaFlags = {
  youtube: { enabled: boolean };
  giphy: { enabled: boolean };
};

export function ChatComposer({
  disabled,
  placeholder,
  sending,
  media,
  onSend,
}: {
  disabled?: boolean;
  placeholder: string;
  sending?: boolean;
  media: MediaFlags;
  onSend: (text: string) => Promise<boolean> | boolean;
}) {
  const [message, setMessage] = useState("");
  const [giphyOpen, setGiphyOpen] = useState(false);
  const [youtubeOpen, setYoutubeOpen] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = message.trim();
    if (!content || disabled || sending) return;
    const ok = await onSend(content);
    if (ok) setMessage("");
  };

  const sendMediaUrl = async (url: string) => {
    if (disabled || sending) return;
    const ok = await onSend(url);
    if (ok) {
      setGiphyOpen(false);
      setYoutubeOpen(false);
    }
  };

  const onGifPick = (gif: GifItem) => {
    void sendMediaUrl(gif.pageUrl || gif.fullUrl);
  };

  return (
    <form
      onSubmit={submit}
      className="mx-auto flex max-w-4xl items-end gap-1.5 rounded-lg border border-border bg-surface-raised p-1.5 shadow-brand focus-within:border-primary/60"
    >
      <Popover open={giphyOpen} onOpenChange={setGiphyOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled || !media.giphy.enabled}
            aria-label="Send a GIF"
            className="shrink-0 text-muted-foreground"
          >
            <Image />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto border-0 bg-transparent p-0 shadow-none">
          <GiphyPicker enabled={media.giphy.enabled} onPick={onGifPick} />
        </PopoverContent>
      </Popover>

      <Popover open={youtubeOpen} onOpenChange={setYoutubeOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={disabled || !media.youtube.enabled}
            aria-label="Share YouTube"
            className="shrink-0 text-muted-foreground"
          >
            <Film />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto border-0 bg-transparent p-0 shadow-none">
          <YoutubePicker enabled={media.youtube.enabled} onPick={(url) => void sendMediaUrl(url)} />
        </PopoverContent>
      </Popover>

      <textarea
        disabled={disabled}
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            event.currentTarget.form?.requestSubmit();
          }
        }}
        aria-label="Message"
        placeholder={placeholder}
        rows={1}
        className="max-h-28 min-h-9 flex-1 resize-none bg-transparent px-1 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
      />

      <Button
        size="icon"
        type="submit"
        disabled={disabled || !message.trim() || sending}
        aria-label="Send message"
        className="accent-button shrink-0"
      >
        <Send />
      </Button>
    </form>
  );
}
