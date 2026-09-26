import { FormEvent, useRef, useState } from "react";
import { Film, Image, Paperclip, Plus, Send, Smile, X } from "lucide-react";

import { CodyEmojiPicker } from "@/components/chat/media/CodyEmojiPicker";
import { GiphyPicker, type GifItem } from "@/components/chat/media/GiphyPicker";
import { YoutubePicker } from "@/components/chat/media/YoutubePicker";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type MediaFlags = {
  youtube: { enabled: boolean };
  giphy: { enabled: boolean };
};

export type ChatComposerReplyPreview = {
  author: string;
  excerpt: string;
  onClear: () => void;
};

export function ChatComposer({
  disabled,
  placeholder,
  sending,
  uploading,
  media,
  canUpload,
  replyPreview,
  onSend,
  onUploadFile,
}: {
  disabled?: boolean;
  placeholder: string;
  sending?: boolean;
  uploading?: boolean;
  media: MediaFlags;
  canUpload?: boolean;
  replyPreview?: ChatComposerReplyPreview;
  onSend: (text: string) => Promise<boolean> | boolean;
  onUploadFile?: (file: File) => Promise<boolean>;
}) {
  const [message, setMessage] = useState("");
  const [giphyOpen, setGiphyOpen] = useState(false);
  const [youtubeOpen, setYoutubeOpen] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [plusOpen, setPlusOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const composerDisabled = disabled || uploading;
  const sendBlocked = composerDisabled || sending;

  const focusComposer = () => {
    textareaRef.current?.focus();
  };

  const hasPlusActions =
    !!canUpload || media.giphy.enabled || media.youtube.enabled;

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const content = message.trim();
    if (!content || sendBlocked) return;
    const contentToSend = content;
    setMessage("");
    focusComposer();
    const ok = await onSend(contentToSend);
    if (!ok) {
      setMessage((prev) => (prev.trim() ? prev : contentToSend));
    }
  };

  const sendMediaUrl = async (url: string) => {
    if (sendBlocked) return;
    focusComposer();
    const ok = await onSend(url);
    if (ok) {
      setGiphyOpen(false);
      setYoutubeOpen(false);
      setPlusOpen(false);
    }
  };

  const onGifPick = (gif: GifItem) => {
    void sendMediaUrl(gif.pageUrl || gif.fullUrl);
  };

  const insertEmojiToken = (token: string) => {
    setMessage((prev) => {
      const base = prev.trimEnd();
      return base ? `${base} ${token} ` : `${token} `;
    });
    setEmojiOpen(false);
  };

  const onFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !onUploadFile || composerDisabled) return;
    setPlusOpen(false);
    await onUploadFile(file);
  };

  const iconBtnClass = "shrink-0 text-muted-foreground";

  return (
    <div className="yaarzo-chat-rail w-full">
      {replyPreview ? (
        <div
          className="mb-2 flex items-start gap-2 rounded-lg border border-primary/35 bg-primary/5 px-2.5 py-2"
          role="status"
          aria-label="Replying to message"
        >
          <div className="min-w-0 flex-1 text-left">
            <p className="text-[10px] font-extrabold text-primary">
              Replying to {replyPreview.author}
            </p>
            <p className="line-clamp-2 text-[10px] leading-4 text-muted-foreground whitespace-pre-wrap break-words">
              {replyPreview.excerpt}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 shrink-0 text-muted-foreground"
            aria-label="Cancel reply"
            onClick={replyPreview.onClear}
          >
            <X className="size-4" />
          </Button>
        </div>
      ) : null}

      <form
        onSubmit={submit}
        className="flex items-end gap-1 rounded-lg border border-border bg-surface-raised p-1.5 shadow-brand focus-within:border-primary/60"
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*,.zip,.pdf,.doc,.docx,.txt"
          onChange={(event) => void onFileChange(event)}
        />

        {hasPlusActions ? (
          <Popover open={plusOpen} onOpenChange={setPlusOpen}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={iconBtnClass}
                disabled={composerDisabled}
                aria-label="More actions"
                aria-expanded={plusOpen}
              >
                <Plus />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start" className="w-44 p-2">
              <div className="grid gap-1">
                {canUpload ? (
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-9 justify-start gap-2 text-sm"
                    disabled={composerDisabled}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Paperclip className="size-4" /> Attach file
                  </Button>
                ) : null}
                {media.giphy.enabled ? (
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-9 justify-start gap-2 text-sm"
                    disabled={composerDisabled}
                    onClick={() => {
                      setPlusOpen(false);
                      setGiphyOpen(true);
                    }}
                  >
                    <Image className="size-4" /> GIF
                  </Button>
                ) : null}
                {media.youtube.enabled ? (
                  <Button
                    type="button"
                    variant="ghost"
                    className="h-9 justify-start gap-2 text-sm"
                    disabled={composerDisabled}
                    onClick={() => {
                      setPlusOpen(false);
                      setYoutubeOpen(true);
                    }}
                  >
                    <Film className="size-4" /> YouTube
                  </Button>
                ) : null}
              </div>
            </PopoverContent>
          </Popover>
        ) : null}

        <Popover open={emojiOpen} onOpenChange={setEmojiOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              disabled={composerDisabled}
              aria-label="Emoji"
              className={iconBtnClass}
            >
              <Smile />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto border-0 bg-transparent p-0 shadow-none">
            <CodyEmojiPicker onPick={insertEmojiToken} />
          </PopoverContent>
        </Popover>

        {media.giphy.enabled ? (
          <Popover open={giphyOpen} onOpenChange={setGiphyOpen}>
            <PopoverTrigger asChild>
              <button type="button" className="sr-only" tabIndex={-1} aria-hidden="true" />
            </PopoverTrigger>
            <PopoverContent align="start" side="top" className="w-auto border-0 bg-transparent p-0 shadow-none">
              <GiphyPicker enabled={media.giphy.enabled} onPick={onGifPick} />
            </PopoverContent>
          </Popover>
        ) : null}

        {media.youtube.enabled ? (
          <Popover open={youtubeOpen} onOpenChange={setYoutubeOpen}>
            <PopoverTrigger asChild>
              <button type="button" className="sr-only" tabIndex={-1} aria-hidden="true" />
            </PopoverTrigger>
            <PopoverContent align="start" side="top" className="w-auto border-0 bg-transparent p-0 shadow-none">
              <YoutubePicker
                enabled={media.youtube.enabled}
                onPick={(url) => void sendMediaUrl(url)}
              />
            </PopoverContent>
          </Popover>
        ) : null}

        <textarea
          ref={textareaRef}
          disabled={composerDisabled}
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              if (event.nativeEvent.isComposing) return;
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
          aria-label="Message"
          placeholder={uploading ? "Uploading…" : placeholder}
          rows={1}
          className="max-h-28 min-h-9 flex-1 resize-none bg-transparent px-1 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
        />

        <Button
          size="icon"
          type="submit"
          disabled={sendBlocked || !message.trim()}
          aria-label="Send message"
          className="accent-button shrink-0"
        >
          <Send />
        </Button>
      </form>
    </div>
  );
}
