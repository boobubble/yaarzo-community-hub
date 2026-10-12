import type { SupabaseClient } from "@supabase/supabase-js";

export const FEED_PAGE_SIZE = 20;

export const FEED_POST_SELECT =
  "id, owner_id, author_id, kind, text, media_urls, poll, privacy, is_anonymous, hashtags, reaction_count, comment_count, trending_score, created_at, slug, community_id, category";

export type FeedPollOption = {
  label?: string;
  text?: string;
  votes?: number;
  count?: number;
};

export type FeedPoll = {
  question?: string;
  title?: string;
  options?: FeedPollOption[] | string[];
};

export type FeedPost = {
  id: string;
  owner_id: string;
  author_id: string | null;
  kind: string;
  text: string | null;
  media_urls: string[];
  poll: FeedPoll | null;
  privacy: string | null;
  is_anonymous: boolean;
  hashtags: string[];
  reaction_count: number;
  comment_count: number;
  trending_score: number;
  created_at: string;
  slug: string | null;
  community_id: string | null;
  category: string | null;
};

export type FeedMode = "latest" | "trending";
export type LatestCursor = { created_at: string; id: string };
export type TrendingCursor = { trending_score: number; created_at: string; id: string };
export type FeedCursor = LatestCursor | TrendingCursor | null;

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.length > 0);
}

function parsePoll(value: unknown): FeedPoll | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const options = record["options"];
  if (options !== undefined && !Array.isArray(options)) return null;
  return {
    ...(typeof record["question"] === "string" ? { question: record["question"] } : {}),
    ...(typeof record["title"] === "string" ? { title: record["title"] } : {}),
    ...(Array.isArray(options) ? { options: options as FeedPollOption[] | string[] } : {}),
  };
}

export function normalizeFeedPost(row: Record<string, unknown>): FeedPost | null {
  if (typeof row["id"] !== "string") return null;
  return {
    id: row["id"],
    owner_id: typeof row["owner_id"] === "string" ? row["owner_id"] : "",
    author_id: typeof row["author_id"] === "string" ? row["author_id"] : null,
    kind: typeof row["kind"] === "string" ? row["kind"] : "text",
    text: typeof row["text"] === "string" ? row["text"] : null,
    media_urls: asStringArray(row["media_urls"]),
    poll: parsePoll(row["poll"]),
    privacy: typeof row["privacy"] === "string" ? row["privacy"] : null,
    is_anonymous: row["is_anonymous"] === true,
    hashtags: asStringArray(row["hashtags"]),
    reaction_count: typeof row["reaction_count"] === "number" ? row["reaction_count"] : 0,
    comment_count: typeof row["comment_count"] === "number" ? row["comment_count"] : 0,
    trending_score: typeof row["trending_score"] === "number" ? row["trending_score"] : 0,
    created_at:
      typeof row["created_at"] === "string" ? row["created_at"] : new Date(0).toISOString(),
    slug: typeof row["slug"] === "string" ? row["slug"] : null,
    community_id: typeof row["community_id"] === "string" ? row["community_id"] : null,
    category: typeof row["category"] === "string" ? row["category"] : null,
  };
}

export function mergeFeedPosts(existing: FeedPost[], incoming: FeedPost[]) {
  if (!incoming.length) return existing;
  const seen = new Set(existing.map((post) => post.id));
  const merged = [...existing];
  for (const post of incoming) {
    if (seen.has(post.id)) continue;
    merged.push(post);
    seen.add(post.id);
  }
  return merged;
}

export function feedCursor(mode: FeedMode, posts: FeedPost[]): FeedCursor {
  const last = posts[posts.length - 1];
  if (!last) return null;
  return mode === "latest"
    ? { created_at: last.created_at, id: last.id }
    : { trending_score: last.trending_score, created_at: last.created_at, id: last.id };
}

export async function fetchFeedPage(
  client: SupabaseClient,
  mode: FeedMode,
  cursor: FeedCursor,
  signal?: AbortSignal,
): Promise<{ posts: FeedPost[]; error: string | null; aborted: boolean }> {
  let query = client
    .from("posts_safe")
    .select(FEED_POST_SELECT)
    .is("community_id", null)
    .limit(FEED_PAGE_SIZE);

  if (mode === "latest") {
    const latest = cursor as LatestCursor | null;
    if (latest) {
      query = query.or(
        `created_at.lt.${latest.created_at},and(created_at.eq.${latest.created_at},id.lt.${latest.id})`,
      );
    }
    query = query.order("created_at", { ascending: false }).order("id", { ascending: false });
  } else {
    const trending = cursor as TrendingCursor | null;
    if (trending) {
      query = query.or(
        `trending_score.lt.${trending.trending_score},and(trending_score.eq.${trending.trending_score},created_at.lt.${trending.created_at}),and(trending_score.eq.${trending.trending_score},created_at.eq.${trending.created_at},id.lt.${trending.id})`,
      );
    }
    query = query
      .order("trending_score", { ascending: false })
      .order("created_at", { ascending: false })
      .order("id", { ascending: false });
  }

  const { data, error } = await (signal ? query.abortSignal(signal) : query);
  if (signal?.aborted) return { posts: [], error: null, aborted: true };
  if (error) return { posts: [], error: error.message, aborted: false };

  const posts: FeedPost[] = [];
  for (const row of data ?? []) {
    const normalized = normalizeFeedPost(row as Record<string, unknown>);
    if (normalized) posts.push(normalized);
  }
  return { posts, error: null, aborted: false };
}
