// Adapted from Yaarzo emergent-v2/src/components/feed/Composer.tsx.
// Original card styling, post/poll controls, emoji, audience and media UI are retained.
import { useEffect, useRef, useState } from "react";
import {
  Image as ImageIcon,
  Smile,
  Hash,
  Loader2,
  X,
  Globe,
  Users,
  Lock,
  EyeOff,
  BarChart3,
  Plus,
} from "lucide-react";
import { supabase } from "@/lib/feed/feed-bridge";
import { publishFeedPost, validateFeedFiles, type FeedDraft } from "@/lib/feed/feed-actions";
import { EmojiPicker } from "./EmojiPicker";
import { VideoThumb } from "./VideoThumb";

type PostPrivacy = FeedDraft["privacy"];
const PRIVACY = [
  { id: "public", label: "Public", icon: Globe },
  { id: "friends", label: "Friends", icon: Users },
  { id: "private", label: "Only me", icon: Lock },
] as const;
function validateAndFilter(incoming: File[]) {
  const ok: File[] = [],
    rejected: string[] = [];
  for (const file of incoming) {
    try {
      validateFeedFiles([file]);
      ok.push(file);
    } catch (failure) {
      rejected.push(failure instanceof Error ? failure.message : "Unsupported file.");
    }
  }
  return { ok, rejected };
}
function ImagePreview({ file }: { file: File }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    const next = URL.createObjectURL(file);
    setUrl(next);
    return () => URL.revokeObjectURL(next);
  }, [file]);
  return url ? <img src={url} alt={file.name} className="h-full w-full object-cover" /> : null;
}

export function Composer({ name, onPosted }: { name: string; onPosted: () => void }) {
  const [text, setText] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [privacy, setPrivacy] = useState<PostPrivacy>("public");
  const [anonymous, setAnonymous] = useState(false);
  const [eligibleForCompetitions, setEligibleForCompetitions] = useState(true);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [mode, setMode] = useState<"post" | "poll">("post");
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const locked = useRef(false);
  const draftId = useRef(crypto.randomUUID());
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const updateText = (value: string) => setText(value);
  async function submit() {
    if (locked.current) return;
    locked.current = true;
    setPosting(true);
    setError(null);
    setMessage("");
    try {
      const draft: FeedDraft = {
        id: draftId.current,
        text,
        files,
        privacy,
        anonymous,
        eligibleForCompetitions,
        poll:
          mode === "poll"
            ? {
                question: pollQuestion.trim(),
                options: pollOptions.map((option) => option.trim()).filter(Boolean),
                votes: {},
              }
            : null,
      };
      const result = await publishFeedPost(supabase, draft);
      if (!alive.current) return;
      setText("");
      setFiles([]);
      setPollQuestion("");
      setPollOptions(["", ""]);
      setMode("post");
      setEmojiOpen(false);
      draftId.current = crypto.randomUUID();
      setMessage(
        result?.moderation_status === "visible"
          ? "Post published."
          : "Post submitted for moderation.",
      );
      onPosted();
    } catch (failure) {
      if (alive.current)
        setError(
          failure instanceof Error ? failure.message : "Failed to post. Your draft is retained.",
        );
    } finally {
      locked.current = false;
      if (alive.current) setPosting(false);
    }
  }
  const PrivacyIconEl = PRIVACY.find((p) => p.id === privacy)!.icon;
  return (
    <fieldset disabled={posting} className="mb-4 min-w-0 border-0 p-0">
      <div className="relative min-w-0 overflow-x-hidden rounded-[1.25rem] border border-border bg-card p-4 shadow-[0_8px_24px_-16px_oklch(0_0_0/0.5)] sm:p-5">
        <div className="flex gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-linear-to-br from-primary to-primary/60 text-primary-foreground font-bold ring-2 ring-card">
            {name.slice(0, 1).toUpperCase()}
          </div>
          <textarea
            disabled={posting}
            ref={textareaRef}
            value={text}
            onChange={(e) => updateText(e.target.value)}
            rows={2}
            aria-label="Post text"
            maxLength={10000}
            placeholder={
              mode === "poll"
                ? "Optional context for your poll…"
                : "What's on your mind? Use #hashtags and @mentions…"
            }
            className="w-full resize-none rounded-2xl border border-transparent bg-transparent px-1 py-2 text-[15px] leading-relaxed placeholder:text-muted-foreground focus:outline-none"
          />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <ModeChip active={mode === "post"} onClick={() => setMode("post")} label="Post" />
          <ModeChip
            active={mode === "poll"}
            onClick={() => setMode("poll")}
            icon={BarChart3}
            label="Poll"
            tone="primary"
          />
        </div>
        {mode === "poll" && (
          <div className="mt-3 rounded-2xl border border-primary/30 bg-primary/5 p-3">
            <input
              value={pollQuestion}
              onChange={(e) => setPollQuestion(e.target.value)}
              aria-label="Poll question"
              placeholder="Ask a question…"
              maxLength={280}
              className="mb-2 w-full rounded-xl border border-border bg-background/70 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
            <div className="space-y-2">
              {pollOptions.map((opt, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    value={opt}
                    onChange={(e) =>
                      setPollOptions((p) => p.map((v, j) => (j === i ? e.target.value : v)))
                    }
                    aria-label={`Option ${i + 1}`}
                    placeholder={`Option ${i + 1}`}
                    maxLength={120}
                    className="flex-1 rounded-xl border border-border bg-background/70 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                  {pollOptions.length > 2 && (
                    <button
                      onClick={() => setPollOptions((p) => p.filter((_, j) => j !== i))}
                      className="rounded-full p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      aria-label={`Remove option ${i + 1}`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {pollOptions.length < 6 && (
              <button
                onClick={() => setPollOptions((p) => [...p, ""])}
                className="mt-2 inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold text-primary hover:bg-primary/10"
              >
                <Plus className="h-3 w-3" /> Add option
              </button>
            )}
          </div>
        )}
        {files.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {files.map((f, i) => (
              <div
                key={i}
                className="relative h-24 w-24 overflow-hidden rounded-xl border border-border bg-black"
              >
                {f.type.startsWith("video/") ? <VideoThumb file={f} /> : <ImagePreview file={f} />}
                <button
                  onClick={() => setFiles(files.filter((_, j) => j !== i))}
                  className="absolute right-1 top-1 grid min-h-11 min-w-11 place-items-center rounded-full bg-black/70 text-white"
                  aria-label="Remove file"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
        {error && (
          <p role="alert" className="mt-2 text-xs text-alert">
            {error}
          </p>
        )}
        {message && (
          <p role="status" className="mt-2 text-xs">
            {message}
          </p>
        )}
        <div className="mt-4 flex min-w-0 flex-wrap items-center gap-1 border-t border-border pt-3">
          <button
            type="button"
            aria-label="Attach photo or video"
            onClick={() => fileRef.current?.click()}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-emerald-400 hover:bg-emerald-400/10 transition"
          >
            <ImageIcon className="h-4 w-4 shrink-0" />{" "}
            <span className="hidden sm:inline">Photo / video</span>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,video/mp4,video/webm,.mp4,.webm"
            multiple
            className="hidden"
            onChange={(e) => {
              const picked = Array.from(e.target.files ?? []);
              const { ok, rejected } = validateAndFilter(picked);
              if (rejected.length) setError(rejected.join("\n"));
              if (ok.length) {
                setFiles([...files, ...ok]);
              }
              if (fileRef.current) fileRef.current.value = "";
            }}
          />
          <div>
            <button
              type="button"
              onClick={() => setEmojiOpen((open) => !open)}
              aria-expanded={emojiOpen}
              aria-label="Emoji"
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-amber-400 hover:bg-amber-400/10 transition"
            >
              <Smile className="h-4 w-4 shrink-0" /> <span className="hidden sm:inline">Emoji</span>
            </button>
            {emojiOpen ? (
              <div className="mt-2 w-full max-w-xs">
                <EmojiPicker embedded onPick={(e) => updateText(text + e)} />
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => updateText(text + " #")}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium text-sky-400 hover:bg-sky-400/10 transition"
          >
            <Hash className="h-4 w-4 shrink-0" /> <span className="hidden sm:inline">Tag</span>
          </button>
          <div className="ml-auto flex min-w-0 flex-wrap items-center justify-end gap-2">
            <select
              value={privacy}
              onChange={(e) => setPrivacy(e.target.value as PostPrivacy)}
              className="min-h-11 max-w-[7.5rem] rounded-full border border-border bg-background/50 px-3 py-2 text-xs font-medium sm:max-w-none"
              aria-label="Post audience"
            >
              {PRIVACY.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setAnonymous(!anonymous)}
              className={`inline-flex min-h-11 items-center gap-1 rounded-full border px-3 py-2 text-xs font-medium transition ${anonymous ? "border-primary bg-primary/15 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
            >
              <EyeOff className="h-3 w-3 shrink-0" /> Anon
            </button>
            <button
              type="button"
              onClick={() => setEligibleForCompetitions((v) => !v)}
              title="Allow this post to auto-qualify for matching competitions"
              className={`hidden min-h-11 items-center gap-1 rounded-full border px-3 py-2 text-xs font-medium transition sm:inline-flex ${eligibleForCompetitions ? "border-amber-400/60 bg-amber-400/10 text-amber-300" : "border-border text-muted-foreground hover:text-foreground"}`}
            >
              🏆 Eligible
            </button>
            <PrivacyIconEl className="hidden h-3.5 w-3.5 text-muted-foreground sm:block" />
            <button
              type="button"
              onClick={submit}
              disabled={
                posting ||
                (mode === "post" && !text.trim() && !files.length) ||
                (mode === "poll" &&
                  (!pollQuestion.trim() || pollOptions.filter((o) => o.trim()).length < 2))
              }
              className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-linear-to-r from-primary to-primary/80 px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-[0_8px_24px_-8px_var(--primary-glow)] hover:scale-[1.03] active:scale-[0.97] transition disabled:opacity-50 disabled:hover:scale-100"
            >
              {posting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {posting ? "Publishing…" : mode === "poll" ? "Publish poll" : "Post"}
            </button>
          </div>
        </div>
      </div>
    </fieldset>
  );
}
function ModeChip({
  active,
  onClick,
  icon: Icon,
  label,
  tone,
}: {
  active: boolean;
  onClick: () => void;
  icon?: typeof BarChart3;
  label: string;
  tone?: "primary" | "fuchsia" | "amber";
}) {
  const accent =
    tone === "fuchsia"
      ? "border-fuchsia-500 bg-fuchsia-500/15 text-fuchsia-500"
      : tone === "amber"
        ? "border-amber-500 bg-amber-500/15 text-amber-500"
        : "border-primary bg-primary/15 text-primary";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-11 items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold transition ${
        active ? accent : "border-border text-muted-foreground hover:text-foreground"
      }`}
    >
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {label}
    </button>
  );
}
