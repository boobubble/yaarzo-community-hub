import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { FeedPost } from "@/lib/feed/feed-data";
import type { DirectoryProfile } from "@/lib/profiles/use-profiles-directory";
import { supabase } from "@/lib/feed/feed-bridge";
import {
  REACTION_TYPES,
  addFeedComment,
  deleteFeedComment,
  deleteFeedPost,
  setPostReaction,
  updateFeedComment,
  updateFeedPost,
  type FeedComment,
  type ReactionType,
} from "@/lib/feed/feed-actions";
import { useFeedIdentity } from "./FeedIdentity";

const PAGE_SIZE = 30;

export function FeedInteractions({
  post,
  profiles,
  onChanged,
}: {
  post: FeedPost;
  profiles: Record<string, DirectoryProfile>;
  onChanged: () => void;
}) {
  const { user, ready, connect } = useFeedIdentity();
  const userId = user?.id;
  const [reaction, setReaction] = useState<ReactionType | null>(null);
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [reply, setReply] = useState<FeedComment | null>(null);
  const [editing, setEditing] = useState<{
    kind: "post" | "comment";
    id: string;
    text: string;
  } | null>(null);
  const [deleting, setDeleting] = useState<{ kind: "post" | "comment"; id: string } | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);
  const commentRequest = useRef<AbortController | null>(null);
  const commentsRef = useRef<FeedComment[]>([]);
  const alive = useRef(true);

  const loadComments = useCallback(
    async (more = false) => {
      commentRequest.current?.abort();
      const controller = new AbortController();
      commentRequest.current = controller;
      setCommentsLoading(true);
      setError("");
      const offset = more ? commentsRef.current.length : 0;
      const { data, error: queryError } = await supabase
        .from("comments")
        .select("id,post_id,author_id,parent_comment_id,text,created_at,moderation_status")
        .eq("post_id", post.id)
        .eq("moderation_status", "visible")
        .order("created_at")
        .order("id")
        .range(offset, offset + PAGE_SIZE - 1)
        .abortSignal(controller.signal);
      if (controller.signal.aborted || !alive.current) return;
      if (queryError) setError(queryError.message);
      else {
        const page = (data ?? []) as FeedComment[];
        const previous = more ? commentsRef.current : [];
        const ids = new Set(previous.map((comment) => comment.id));
        commentsRef.current = [...previous, ...page.filter((comment) => !ids.has(comment.id))];
        setComments(commentsRef.current);
        setHasMore(page.length === PAGE_SIZE);
      }
      setCommentsLoading(false);
    },
    [post.id],
  );

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
      commentRequest.current?.abort();
    };
  }, []);

  useEffect(() => {
    setEditing(null);
    setDeleting(null);
    setReply(null);
    setReaction(null);
    const controller = new AbortController();
    if (userId && ready) {
      void supabase
        .from("reactions")
        .select("type")
        .eq("user_id", userId)
        .eq("target_type", "post")
        .eq("target_id", post.id)
        .abortSignal(controller.signal)
        .maybeSingle()
        .then(({ data, error: queryError }) => {
          if (controller.signal.aborted) return;
          if (queryError) setError(queryError.message);
          else setReaction((data?.type as ReactionType | undefined) ?? null);
        });
    }
    return () => controller.abort();
  }, [userId, ready, post.id]);

  useEffect(() => {
    if (!commentsOpen) return;
    void loadComments();
    const channel = supabase
      .channel(`feed-comments-${post.id}-${crypto.randomUUID()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "comments", filter: `post_id=eq.${post.id}` },
        () => {
          void loadComments();
        },
      )
      .subscribe();
    return () => {
      commentRequest.current?.abort();
      void supabase.removeChannel(channel);
    };
  }, [commentsOpen, loadComments, userId, post.id]);

  const run = async (action: () => Promise<void>, write = true) => {
    if (locked.current || !ready) return;
    if (write && !user) {
      connect();
      return;
    }
    locked.current = true;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      await action();
    } catch (failure) {
      if (alive.current)
        setError(failure instanceof Error ? failure.message : "Action failed. Try again.");
    } finally {
      locked.current = false;
      if (alive.current) setBusy(false);
    }
  };

  return (
    <div className="mt-3 border-t border-border pt-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant={reaction ? "default" : "ghost"}
          disabled={busy || !ready}
          onClick={() =>
            void run(async () => {
              const next = reaction ? null : "like";
              await setPostReaction(supabase, post.id, next);
              setReaction(next);
              onChanged();
            })
          }
        >
          {reaction ?? "Like"} · {post.reaction_count}
        </Button>
        <label className="text-xs">
          React{" "}
          <select
            aria-label="Reaction"
            className="rounded border border-input bg-background p-1"
            value={reaction ?? ""}
            disabled={busy || !ready}
            onChange={(event) => {
              const next = event.target.value as ReactionType;
              void run(async () => {
                await setPostReaction(supabase, post.id, next);
                setReaction(next);
                onChanged();
              });
            }}
          >
            <option value="" disabled>
              Choose
            </option>
            {REACTION_TYPES.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>
        <Button size="sm" variant="ghost" onClick={() => setCommentsOpen((open) => !open)}>
          Comments · {post.comment_count}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          disabled={busy}
          onClick={() =>
            void run(async () => {
              // Share on the current authorized Feed entry. No private text/media is copied.
              const url = new URL(window.location.href);
              url.hash = `yaarzo-post-${post.id}`;
              if (navigator.share)
                await navigator.share({ title: "Yaarzo Feed post", url: url.href });
              else {
                await navigator.clipboard.writeText(url.href);
                setMessage("Post link copied.");
              }
            }, false)
          }
        >
          Share
        </Button>
        {user?.id === post.owner_id ? (
          <>
            <Button
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={() => setEditing({ kind: "post", id: post.id, text: post.text ?? "" })}
            >
              Edit
            </Button>
            <Button
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={() => setDeleting({ kind: "post", id: post.id })}
            >
              Delete
            </Button>
          </>
        ) : null}
      </div>
      {commentsOpen ? (
        <section className="mt-3 space-y-3" aria-label="Comments">
          {comments.map((comment) => (
            <div key={comment.id} className="rounded-lg border border-border bg-muted/30 p-3">
              <div className="flex items-center gap-2 text-xs">
                {profiles[comment.author_id]?.avatar_url ? (
                  <img
                    className="size-6 rounded-full object-cover"
                    src={profiles[comment.author_id]?.avatar_url ?? ""}
                    alt=""
                    referrerPolicy="no-referrer"
                  />
                ) : null}
                <strong>{profiles[comment.author_id]?.username ?? "Yaarzo User"}</strong>
                {comment.parent_comment_id ? (
                  <span className="text-muted-foreground">
                    Reply to{" "}
                    {profiles[
                      comments.find((parent) => parent.id === comment.parent_comment_id)
                        ?.author_id ?? ""
                    ]?.username ?? "earlier comment"}
                  </span>
                ) : null}
              </div>
              <p className="mt-1 whitespace-pre-wrap text-sm">{comment.text}</p>
              <div className="mt-1 flex flex-wrap gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={busy}
                  onClick={() => {
                    if (!user) connect();
                    else setReply(comment);
                  }}
                >
                  Reply
                </Button>
                {user?.id === comment.author_id ? (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busy}
                      onClick={() =>
                        setEditing({ kind: "comment", id: comment.id, text: comment.text })
                      }
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={busy}
                      onClick={() => setDeleting({ kind: "comment", id: comment.id })}
                    >
                      Delete
                    </Button>
                  </>
                ) : null}
              </div>
            </div>
          ))}
          {commentsLoading ? (
            <p role="status" className="text-xs">
              Loading comments…
            </p>
          ) : hasMore ? (
            <Button size="sm" variant="outline" onClick={() => void loadComments(true)}>
              More comments
            </Button>
          ) : null}
          <Button
            size="sm"
            variant="ghost"
            disabled={commentsLoading}
            onClick={() => void loadComments()}
          >
            Refresh comments
          </Button>
          {user ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                const form = event.currentTarget;
                const fields = new FormData(form);
                void run(async () => {
                  const result = await addFeedComment(
                    supabase,
                    post.id,
                    String(fields.get("comment") ?? ""),
                    reply?.id ?? null,
                  );
                  form.reset();
                  setReply(null);
                  await loadComments();
                  onChanged();
                  if (result?.moderation_status !== "visible")
                    setMessage("Comment submitted for moderation.");
                });
              }}
              className="grid gap-2"
            >
              {reply ? (
                <div className="text-xs">
                  Replying to {profiles[reply.author_id]?.username ?? "comment"}{" "}
                  <Button type="button" size="sm" variant="ghost" onClick={() => setReply(null)}>
                    Cancel reply
                  </Button>
                </div>
              ) : null}
              <textarea
                aria-label="Comment text"
                name="comment"
                required
                maxLength={5000}
                disabled={busy}
                className="w-full rounded border border-input bg-background p-2 text-sm"
                placeholder="Write a comment…"
              />
              <Button disabled={busy || !ready}>
                {busy ? "Sending…" : reply ? "Send reply" : "Comment"}
              </Button>
            </form>
          ) : (
            <Button onClick={connect}>Sign in to comment</Button>
          )}
        </section>
      ) : null}
      {editing ? (
        <form
          className="mt-3 grid gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            const text = editing.text;
            const edit = editing;
            void run(async () => {
              if (edit.kind === "post") await updateFeedPost(supabase, edit.id, text);
              else await updateFeedComment(supabase, edit.id, text);
              setEditing(null);
              if (commentsOpen) await loadComments();
              onChanged();
            });
          }}
        >
          <textarea
            aria-label={`Edit ${editing.kind}`}
            value={editing.text}
            maxLength={editing.kind === "comment" ? 5000 : 10000}
            required
            disabled={busy}
            className="w-full rounded border border-input bg-background p-2"
            onChange={(event) => setEditing({ ...editing, text: event.target.value })}
          />
          <div className="flex gap-2">
            <Button disabled={busy}>Save</Button>
            <Button
              type="button"
              variant="outline"
              disabled={busy}
              onClick={() => setEditing(null)}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : null}
      {deleting ? (
        <div className="mt-3 flex flex-wrap items-center gap-2" role="alert">
          <span className="text-sm">Delete this {deleting.kind}? Replies may also be deleted.</span>
          <Button
            disabled={busy}
            onClick={() =>
              void run(async () => {
                if (deleting.kind === "post") await deleteFeedPost(supabase, deleting.id);
                else await deleteFeedComment(supabase, deleting.id);
                setDeleting(null);
                if (commentsOpen) await loadComments();
                onChanged();
              })
            }
          >
            Confirm delete
          </Button>
          <Button variant="outline" disabled={busy} onClick={() => setDeleting(null)}>
            Cancel
          </Button>
        </div>
      ) : null}
      {error ? (
        <p className="mt-2 text-sm text-alert" role="alert">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="mt-2 text-xs" role="status">
          {message}
        </p>
      ) : null}
    </div>
  );
}
