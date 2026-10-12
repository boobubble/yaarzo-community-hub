import type { SupabaseClient } from "@supabase/supabase-js";

export const REACTION_TYPES = ["like", "love", "haha", "angry", "fire", "wow"] as const;
export type ReactionType = (typeof REACTION_TYPES)[number];
export type FeedComment = {
  id: string;
  post_id: string;
  author_id: string;
  parent_comment_id: string | null;
  text: string;
  created_at: string;
  moderation_status: string;
};

// Resolve identity at Supabase's server for EVERY mutation. Never accept a Grupo ID.
export async function requireFeedUser(client: SupabaseClient) {
  const { data, error } = await client.auth.getUser();
  if (error || !data.user || data.user.is_anonymous) {
    throw new Error("Sign in to your existing Yaarzo account to continue.");
  }
  return data.user;
}

function check(error: { message: string } | null) {
  if (error) throw new Error(error.message);
}

export function validateFeedText(text: string, maximum = 10000) {
  const value = text.trim();
  if (!value) throw new Error("Enter some text first.");
  if (value.length > maximum) throw new Error(`Use at most ${maximum} characters.`);
  return value;
}

export type FeedDraft = {
  id: string;
  text: string;
  files: File[];
  privacy: "public" | "friends" | "private";
  anonymous: boolean;
  eligibleForCompetitions: boolean;
  poll: { question: string; options: string[]; votes: Record<string, number> } | null;
};

export function validateFeedFiles(files: File[]) {
  if (files.length > 6) throw new Error("Attach at most six files.");
  for (const file of files) {
    const video = ["video/mp4", "video/webm"].includes(file.type);
    const image = ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type);
    if (!video && !image) throw new Error(`${file.name}: use JPEG, PNG, WebP, GIF, MP4 or WebM.`);
    const maximum = (video ? 100 : 20) * 1024 * 1024;
    if (!file.size || file.size > maximum)
      throw new Error(`${file.name}: maximum ${video ? 100 : 20} MB.`);
  }
}

export async function publishFeedPost(client: SupabaseClient, draft: FeedDraft) {
  if (!["public", "friends", "private"].includes(draft.privacy))
    throw new Error("Unsupported audience.");
  if (draft.text.trim().length > 10000) throw new Error("Use at most 10000 characters.");
  validateFeedFiles(draft.files);
  if (draft.poll) {
    if (!draft.poll.question.trim() || draft.poll.question.length > 280)
      throw new Error("Add a poll question (up to 280 characters).");
    if (
      draft.poll.options.length < 2 ||
      draft.poll.options.length > 6 ||
      draft.poll.options.some((option) => !option.trim() || option.length > 120)
    )
      throw new Error("Add two to six poll options (up to 120 characters each).");
  } else if (!draft.text.trim() && !draft.files.length)
    throw new Error("Write a post or attach media first.");
  // Existing bucket is PUBLIC: private/friends media cannot be made private by post RLS.
  if (draft.files.length && draft.privacy !== "public")
    throw new Error(
      "The existing media bucket is public. Use Public for media, or remove attachments to publish a restricted text post.",
    );
  const user = await requireFeedUser(client);
  const existing = await client
    .from("posts")
    .select("id,moderation_status")
    .eq("id", draft.id)
    .eq("owner_id", user.id)
    .maybeSingle();
  check(existing.error);
  if (existing.data) return existing.data; // Retry after an ambiguous response cannot duplicate a post.
  const urls: string[] = [];
  const extensions: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
    "video/mp4": "mp4",
    "video/webm": "webm",
  };
  for (const [index, file] of draft.files.entries()) {
    const path = `${user.id}/${draft.id}/${index}.${extensions[file.type]}`;
    const result = await client.storage
      .from("feed-media")
      .upload(path, file, { cacheControl: "3600", upsert: true });
    check(result.error);
    urls.push(client.storage.from("feed-media").getPublicUrl(path).data.publicUrl);
  }
  // Revalidate before posting in case the session changed while uploading.
  const current = await requireFeedUser(client);
  if (current.id !== user.id)
    throw new Error("Account changed. Reopen the composer before posting.");
  const { data, error } = await client
    .from("posts")
    .insert({
      id: draft.id,
      owner_id: user.id,
      author_id: draft.anonymous ? null : user.id,
      text: draft.text.trim(),
      kind: draft.poll
        ? "poll"
        : draft.files.length === 1 && draft.files[0]?.type === "image/gif"
          ? "gif"
          : urls.length
            ? "image"
            : "text",
      media_urls: urls,
      poll: draft.poll,
      privacy: draft.privacy,
      is_anonymous: draft.anonymous,
      hashtags: [
        ...new Set(
          (draft.text.match(/#[\p{L}0-9_]{2,32}/giu) ?? []).map((tag) =>
            tag.slice(1).toLowerCase(),
          ),
        ),
      ],
      eligible_for_competitions: draft.eligibleForCompetitions,
    })
    .select("id,moderation_status")
    .single();
  if (error) {
    // A concurrent retry may have committed the same client-generated ID.
    const committed = await client
      .from("posts")
      .select("id,moderation_status")
      .eq("id", draft.id)
      .eq("owner_id", user.id)
      .maybeSingle();
    if (!committed.error && committed.data) return committed.data;
    check(error);
  }
  return data;
}

export async function setPostReaction(
  client: SupabaseClient,
  postId: string,
  type: ReactionType | null,
) {
  const user = await requireFeedUser(client);
  if (type !== null && !REACTION_TYPES.includes(type)) throw new Error("Unsupported reaction.");
  if (type === null) {
    const { error } = await client
      .from("reactions")
      .delete()
      .eq("user_id", user.id)
      .eq("target_type", "post")
      .eq("target_id", postId);
    check(error);
  } else {
    const { error } = await client.from("reactions").upsert(
      {
        user_id: user.id,
        target_type: "post",
        target_id: postId,
        type,
      },
      { onConflict: "user_id,target_type,target_id" },
    );
    check(error);
  }
}

export async function addFeedComment(
  client: SupabaseClient,
  postId: string,
  text: string,
  parentId: string | null = null,
) {
  const value = validateFeedText(text, 5000);
  const user = await requireFeedUser(client);
  // The existing FK does not ensure that a parent belongs to this post.
  if (parentId) {
    const { data, error } = await client
      .from("comments")
      .select("id")
      .eq("id", parentId)
      .eq("post_id", postId)
      .single();
    check(error);
    if (!data) throw new Error("Reply target is unavailable.");
  }
  const { data, error } = await client
    .from("comments")
    .insert({
      post_id: postId,
      author_id: user.id,
      text: value,
      parent_comment_id: parentId,
    })
    .select("id,moderation_status")
    .single();
  check(error);
  return data;
}

export async function updateFeedComment(client: SupabaseClient, id: string, text: string) {
  const value = validateFeedText(text, 5000);
  const user = await requireFeedUser(client);
  const { data, error } = await client
    .from("comments")
    .update({ text: value })
    .eq("id", id)
    .eq("author_id", user.id)
    .select("id")
    .single();
  check(error);
  if (!data) throw new Error("Comment is unavailable or you do not own it.");
}

export async function deleteFeedComment(client: SupabaseClient, id: string) {
  const user = await requireFeedUser(client);
  const { data, error } = await client
    .from("comments")
    .delete()
    .eq("id", id)
    .eq("author_id", user.id)
    .select("id")
    .single();
  check(error);
  if (!data) throw new Error("Comment is unavailable or you do not own it.");
}

export async function updateFeedPost(client: SupabaseClient, id: string, text: string) {
  const value = validateFeedText(text);
  const user = await requireFeedUser(client);
  const { data, error } = await client
    .from("posts")
    .update({ text: value })
    .eq("id", id)
    .eq("owner_id", user.id)
    .select("id")
    .single();
  check(error);
  if (!data) throw new Error("Post is unavailable or you do not own it.");
}

export async function deleteFeedPost(client: SupabaseClient, id: string) {
  const user = await requireFeedUser(client);
  const { data, error } = await client
    .from("posts")
    .delete()
    .eq("id", id)
    .eq("owner_id", user.id)
    .select("id")
    .single();
  check(error);
  if (!data) throw new Error("Post is unavailable or you do not own it.");
}
