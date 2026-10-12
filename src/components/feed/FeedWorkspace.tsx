import { formatDistanceToNow } from "date-fns";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FEED_PAGE_SIZE,
  FEED_POST_SELECT,
  normalizeFeedPost,
  feedCursor,
  fetchFeedPage,
  mergeFeedPosts,
  type FeedMode,
  type FeedPoll,
  type FeedPost,
} from "@/lib/feed/feed-data";
import type { DirectoryProfile } from "@/lib/profiles/use-profiles-directory";
import { supabase } from "@/lib/feed/feed-bridge";
import { cn } from "@/lib/utils";
import { FeedIdentity, useFeedIdentity } from "./FeedIdentity";
import { FeedInteractions } from "./FeedInteractions";
import { Composer } from "./Composer";

function formatPostTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return formatDistanceToNow(date, { addSuffix: true });
}

function resolveAuthor(
  post: FeedPost,
  profiles: Record<string, DirectoryProfile>,
): {
  name: string;
  level: number | null;
  avatarUrl: string | null;
  avatarColor: string | null;
  anonymous: boolean;
} {
  if (post.is_anonymous) {
    return { name: "Anonymous", level: null, avatarUrl: null, avatarColor: null, anonymous: true };
  }
  const authorId = post.author_id ?? post.owner_id;
  const profile = authorId ? profiles[authorId] : undefined;
  return {
    name: profile?.username ?? "Yaarzo User",
    level: profile?.level ?? null,
    avatarUrl: profile?.avatar_url ?? null,
    avatarColor: profile?.avatar_color ?? null,
    anonymous: false,
  };
}

function PostAvatar({
  name,
  avatarUrl,
  avatarColor,
  anonymous,
}: {
  name: string;
  avatarUrl: string | null;
  avatarColor: string | null;
  anonymous: boolean;
}) {
  const initials = (name.trim().slice(0, 2) || "?").toUpperCase();
  if (avatarUrl && !anonymous) {
    return (
      <img
        src={avatarUrl}
        alt=""
        referrerPolicy="no-referrer"
        className="size-9 shrink-0 rounded-full border border-border object-cover"
      />
    );
  }
  return (
    <span
      className={cn(
        "flex size-9 shrink-0 items-center justify-center rounded-full border border-border text-[10px] font-bold",
        anonymous ? "bg-muted text-muted-foreground" : "brand-mark text-primary-foreground",
      )}
      style={!anonymous && avatarColor ? { backgroundColor: avatarColor } : undefined}
    >
      {initials}
    </span>
  );
}

function FeedPollPreview({ poll }: { poll: FeedPoll }) {
  const title = poll.question ?? poll.title ?? "Poll";
  const rawOptions = poll.options ?? [];
  const options = rawOptions.map((option, index) => {
    if (typeof option === "string") {
      return { label: option, votes: undefined };
    }
    return {
      label: option.label ?? option.text ?? `Option ${index + 1}`,
      votes: option.votes ?? option.count,
    };
  });

  if (!options.length) return null;

  return (
    <div className="mt-3 rounded-lg border border-border/80 bg-muted/30 p-3">
      <p className="text-[11px] font-bold text-foreground">{title}</p>
      <ul className="mt-2 space-y-1.5">
        {options.map((option, index) => (
          <li
            key={`${option.label}-${index}`}
            className="flex items-center justify-between rounded-md border border-border/70 bg-card/80 px-2.5 py-1.5 text-[10px]"
          >
            <span className="font-medium text-foreground">{option.label}</span>
            {typeof option.votes === "number" ? (
              <span className="text-muted-foreground">{option.votes} votes</span>
            ) : (
              <span className="text-muted-foreground">Preview</span>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[9px] font-semibold uppercase text-muted-foreground">
        Voting is currently unavailable here.
      </p>
    </div>
  );
}

function PostMedia({ kind, urls }: { kind: string; urls: string[] }) {
  if (!urls.length) return null;
  const gridClass =
    urls.length === 1
      ? "grid-cols-1"
      : urls.length === 2
        ? "grid-cols-2"
        : "grid-cols-2 sm:grid-cols-3";

  return (
    <div className={cn("mt-3 grid gap-2", gridClass)}>
      {urls.map((url) =>
        /\.(mp4|webm)(\?|$)/i.test(url) ? (
          <video
            key={url}
            src={url}
            controls
            playsInline
            preload="metadata"
            className="max-h-80 w-full rounded-lg border border-border"
          />
        ) : (
          <a
            key={url}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="block overflow-hidden rounded-lg border border-border/80 bg-muted/20"
          >
            <img
              src={url}
              alt={kind === "gif" ? "GIF attachment" : "Post media"}
              loading="lazy"
              referrerPolicy="no-referrer"
              className="max-h-80 w-full object-cover"
            />
          </a>
        ),
      )}
    </div>
  );
}

function FeedPostCard({
  post,
  profiles,
  onChanged,
}: {
  post: FeedPost;
  profiles: Record<string, DirectoryProfile>;
  onChanged: () => void;
}) {
  const author = resolveAuthor(post, profiles);
  const showMedia = post.media_urls.length > 0;

  return (
    <article
      id={`yaarzo-post-${post.id}`}
      className="rounded-xl border border-border bg-card/90 p-3.5 shadow-sm sm:p-4"
    >
      <header className="flex items-start gap-2.5">
        <PostAvatar
          name={author.name}
          avatarUrl={author.avatarUrl}
          avatarColor={author.avatarColor}
          anonymous={author.anonymous}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="truncate text-[12px] font-extrabold text-foreground">
              {author.name}
            </span>
            {author.level != null ? (
              <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-bold text-primary">
                Lv {author.level}
              </span>
            ) : null}
            <span className="text-[10px] text-muted-foreground">
              {formatPostTime(post.created_at)}
            </span>
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[9px] text-muted-foreground">
            {post.privacy && post.privacy !== "public" ? (
              <span className="rounded border border-border px-1 py-0.5 capitalize">
                {post.privacy}
              </span>
            ) : null}
            {post.category ? (
              <span className="rounded border border-border px-1 py-0.5">{post.category}</span>
            ) : null}
          </div>
        </div>
      </header>

      {post.text ? (
        <p className="mt-3 whitespace-pre-wrap text-[12px] leading-relaxed text-foreground">
          {post.text}
        </p>
      ) : null}

      {showMedia ? <PostMedia kind={post.kind} urls={post.media_urls} /> : null}

      {post.poll ? <FeedPollPreview poll={post.poll} /> : null}

      {post.hashtags.length ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {post.hashtags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-semibold text-secondary-foreground"
            >
              #{tag.replace(/^#/, "")}
            </span>
          ))}
        </div>
      ) : null}

      <FeedInteractions post={post} profiles={profiles} onChanged={onChanged} />
    </article>
  );
}

function FeedSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="animate-pulse rounded-xl border border-border bg-card/60 p-4">
          <div className="flex gap-3">
            <div className="size-9 rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-32 rounded bg-muted" />
              <div className="h-3 w-full rounded bg-muted" />
              <div className="h-3 w-4/5 rounded bg-muted" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function FeedWorkspace({ profiles }: { profiles: Record<string, DirectoryProfile> }) {
  return (
    <FeedIdentity>
      <InteractiveFeedWorkspace profiles={profiles} />
    </FeedIdentity>
  );
}

function InteractiveFeedWorkspace({ profiles }: { profiles: Record<string, DirectoryProfile> }) {
  const { user, ready } = useFeedIdentity();
  const [mode, setMode] = useState<FeedMode>("latest");
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [newPosts, setNewPosts] = useState(false);
  const initialRequest = useRef<AbortController | null>(null);
  const moreRequest = useRef<AbortController | null>(null);
  const refreshRequest = useRef<AbortController | null>(null);
  const postsRef = useRef<FeedPost[]>([]);
  const feedElement = useRef<HTMLDivElement | null>(null);
  const initialRequestIdentity = user?.id ?? "guest";
  const moreLocked = useRef(false);
  postsRef.current = posts;

  const cursor = useMemo(() => feedCursor(mode, posts), [mode, posts]);

  const loadInitial = useCallback(async () => {
    initialRequest.current?.abort();
    moreRequest.current?.abort();
    refreshRequest.current?.abort();
    moreLocked.current = false;
    const controller = new AbortController();
    initialRequest.current = controller;
    setLoading(true);
    setLoadingMore(false);
    setError(null);
    setHasMore(true);
    setNewPosts(false);
    const {
      posts: page,
      error: queryError,
      aborted,
    } = await fetchFeedPage(supabase, mode, null, controller.signal);
    if (aborted || controller.signal.aborted) return;
    setPosts(page);
    setHasMore(page.length === FEED_PAGE_SIZE);
    setError(queryError);
    setLoading(false);
  }, [mode]);

  // Refresh loaded cards without throwing away pagination or changing scroll position.
  const refreshLoaded = useCallback(async () => {
    const ids = postsRef.current.map((post) => post.id);
    if (!ids.length) return;
    refreshRequest.current?.abort();
    const controller = new AbortController();
    refreshRequest.current = controller;
    const { data, error: queryError } = await supabase
      .from("posts_safe")
      .select(FEED_POST_SELECT)
      .in("id", ids)
      .abortSignal(controller.signal);
    if (controller.signal.aborted) return;
    if (queryError) {
      setError(queryError.message);
      return;
    }
    const rows = new Map(
      (data ?? []).map((row) => {
        const post = normalizeFeedPost(row as Record<string, unknown>);
        return [row.id as string, post] as const;
      }),
    );
    setPosts((previous) =>
      previous.flatMap((post) => {
        if (!rows.has(post.id)) return ids.includes(post.id) ? [] : [post];
        const updated = rows.get(post.id);
        return updated ? [updated] : [];
      }),
    );
  }, []);

  useEffect(() => {
    setPosts([]);
    if (!ready) return;
    void loadInitial();
    return () => {
      initialRequest.current?.abort();
      moreRequest.current?.abort();
      refreshRequest.current?.abort();
    };
  }, [loadInitial, initialRequestIdentity, ready]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const channel = supabase
      .channel(`grupo-feed-${crypto.randomUUID()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "posts" }, (payload) => {
        if (payload.eventType === "INSERT") setNewPosts(true);
        clearTimeout(timer);
        timer = setTimeout(() => void refreshLoaded(), 150);
      })
      .subscribe();
    return () => {
      clearTimeout(timer);
      void supabase.removeChannel(channel);
    };
  }, [refreshLoaded]);

  useEffect(() => {
    const match = /^#yaarzo-post-([0-9a-f-]{36})$/i.exec(window.location.hash);
    if (!match || loading || !ready) return;
    const id = match[1];
    const controller = new AbortController();
    const reveal = () =>
      feedElement.current?.querySelector(`#yaarzo-post-${id}`)?.scrollIntoView({ block: "start" });
    if (posts.some((post) => post.id === id)) {
      reveal();
      return;
    }
    void supabase
      .from("posts_safe")
      .select(FEED_POST_SELECT)
      .eq("id", id)
      .is("community_id", null)
      .abortSignal(controller.signal)
      .maybeSingle()
      .then(({ data, error: queryError }) => {
        if (controller.signal.aborted) return;
        if (queryError || !data) {
          setError("Shared post is unavailable or requires a different account.");
          return;
        }
        const post = normalizeFeedPost(data as Record<string, unknown>);
        if (post) {
          setPosts((previous) => [post, ...previous.filter((item) => item.id !== id)]);
        }
      });
    return () => controller.abort();
  }, [loading, posts, ready]);

  const loadMore = async () => {
    if (moreLocked.current || loadingMore || !hasMore || loading) return;
    moreLocked.current = true;
    moreRequest.current?.abort();
    const controller = new AbortController();
    moreRequest.current = controller;
    setLoadingMore(true);
    setError(null);
    const {
      posts: page,
      error: queryError,
      aborted,
    } = await fetchFeedPage(supabase, mode, cursor, controller.signal);
    if (aborted || controller.signal.aborted) return;
    setPosts((prev) => mergeFeedPosts(prev, page));
    setHasMore(page.length === FEED_PAGE_SIZE);
    setError(queryError);
    setLoadingMore(false);
    moreLocked.current = false;
  };

  return (
    <div ref={feedElement} className="yaarzo-chat-rail mx-auto flex w-full max-w-4xl flex-col pb-6">
      {ready && user ? (
        <Composer
          key={user.id}
          name={profiles[user.id]?.username ?? "Yaarzo User"}
          onPosted={() => void loadInitial()}
        />
      ) : null}
      <header className="mb-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={loading || !ready}
          onClick={() => void loadInitial()}
        >
          {newPosts ? "New posts — Refresh Feed" : "Refresh Feed"}
        </Button>
        <Tabs
          value={mode}
          onValueChange={(value) => {
            if (value === "latest" || value === "trending") setMode(value);
          }}
          className="mt-3"
        >
          <TabsList className="grid h-9 w-full max-w-xs grid-cols-2">
            <TabsTrigger value="latest" className="text-[11px]">
              Latest
            </TabsTrigger>
            <TabsTrigger value="trending" className="text-[11px]">
              Trending
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </header>

      {loading ? (
        <FeedSkeleton />
      ) : error && posts.length === 0 ? (
        <div className="rounded-xl border border-border bg-card/80 px-4 py-8 text-center">
          <p className="text-sm font-semibold text-foreground">Could not load feed</p>
          <p className="mt-1 text-[11px] text-muted-foreground">{error}</p>
          <Button type="button" size="sm" className="mt-4" onClick={() => void loadInitial()}>
            Retry
          </Button>
        </div>
      ) : posts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 px-4 py-10 text-center">
          <p className="text-sm font-semibold text-foreground">No posts yet</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            When community members share to the global feed, they&apos;ll appear here.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {posts.map((post) => (
              <FeedPostCard
                key={post.id}
                post={post}
                profiles={profiles}
                onChanged={() => void refreshLoaded()}
              />
            ))}
          </div>

          {error ? (
            <div className="mt-4 rounded-lg border border-alert/30 bg-alert/5 px-3 py-2 text-center text-[11px] text-alert">
              {error}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="ml-2 h-7 text-[10px]"
                onClick={() => void loadMore()}
              >
                Retry
              </Button>
            </div>
          ) : null}

          <div className="mt-5 flex flex-col items-center gap-2">
            {loadingMore ? (
              <p className="text-[11px] text-muted-foreground">Loading more…</p>
            ) : hasMore ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 text-[11px]"
                onClick={() => void loadMore()}
              >
                Load more
              </Button>
            ) : (
              <p className="text-[11px] text-muted-foreground">You&apos;re caught up.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
