import assert from "node:assert/strict";
import test from "node:test";
import { fetchFeedPage } from "./feed-data.ts";
import {
  addFeedComment,
  deleteFeedComment,
  deleteFeedPost,
  publishFeedPost,
  requireFeedUser,
  setPostReaction,
  updateFeedComment,
  updateFeedPost,
  validateFeedFiles,
} from "./feed-actions.ts";

const uuid = "abdf18bc-8d2a-4fd1-a077-caa099782093";
const draft = (extra = {}) => ({
  id: "6b0678bf-0047-4149-a41a-7e88451d0b02",
  text: "Hello #Yaarzo",
  files: [],
  privacy: "public",
  anonymous: false,
  eligibleForCompetitions: true,
  poll: null,
  ...extra,
});
function mock({
  user = { id: uuid },
  response = { data: { id: "row", moderation_status: "visible" }, error: null },
  existing = null,
  authError = null,
} = {}) {
  const calls = [];
  const client = {
    calls,
    auth: {
      async getUser() {
        calls.push(["getUser"]);
        return { data: { user }, error: authError };
      },
    },
    from(table) {
      calls.push(["from", table]);
      let method = "select";
      const builder = {};
      for (const name of ["select", "eq", "insert", "update", "delete", "upsert"])
        builder[name] = (...args) => {
          calls.push([name, ...args]);
          if (["insert", "update", "delete", "upsert"].includes(name)) method = name;
          return builder;
        };
      builder.maybeSingle = async () => ({ data: existing, error: null });
      builder.single = async () => response;
      builder.then = (resolve) => Promise.resolve(response).then(resolve);
      return builder;
    },
    storage: {
      from(bucket) {
        return {
          async upload(path, file, options) {
            calls.push(["upload", bucket, path, file.type, options]);
            return { error: null };
          },
          getPublicUrl(path) {
            return { data: { publicUrl: `https://example.test/${path}` } };
          },
        };
      },
    },
  };
  return client;
}

test("every mutation rejects guests and anonymous Supabase users before touching tables/storage", async () => {
  for (const user of [null, { id: uuid, is_anonymous: true }]) {
    for (const operation of [
      (client) => publishFeedPost(client, draft()),
      (client) => setPostReaction(client, "post", "like"),
      (client) => addFeedComment(client, "post", "hello"),
      (client) => updateFeedComment(client, "comment", "hello"),
      (client) => deleteFeedComment(client, "comment"),
      (client) => updateFeedPost(client, "post", "hello"),
      (client) => deleteFeedPost(client, "post"),
    ]) {
      const client = mock({ user });
      await assert.rejects(operation(client), /Sign in/u);
      assert.deepEqual(client.calls, [["getUser"]]);
    }
  }
  await assert.rejects(requireFeedUser(mock({ authError: { message: "expired" } })), /Sign in/u);
});

test("posting derives both ownership fields from the validated server identity and retains visibility/hashtags", async () => {
  const client = mock();
  await publishFeedPost(client, draft({ privacy: "friends", userId: "grupo-123" }));
  const insert = client.calls.find((call) => call[0] === "insert")[1];
  assert.equal(insert.owner_id, uuid);
  assert.equal(insert.author_id, uuid);
  assert.equal(insert.privacy, "friends");
  assert.deepEqual(insert.hashtags, ["yaarzo"]);
  assert.equal(insert.userId, undefined);
  assert.equal(client.calls.filter((call) => call[0] === "getUser").length, 2);
});

test("anonymous posts retain validated ownership while masking author, and retries reuse the same post ID", async () => {
  const client = mock();
  await publishFeedPost(client, draft({ anonymous: true }));
  const insert = client.calls.find((call) => call[0] === "insert")[1];
  assert.equal(insert.owner_id, uuid);
  assert.equal(insert.author_id, null);
  const retry = mock({ existing: { id: draft().id, moderation_status: "visible" } });
  const result = await publishFeedPost(retry, draft());
  assert.equal(result.id, draft().id);
  assert.ok(!retry.calls.some((call) => call[0] === "insert" || call[0] === "upload"));
});

test("media uploads use the existing bucket and server UUID folder; public bucket cannot leak restricted media", async () => {
  const file = new File(["image"], "hello.png", { type: "image/png" });
  const client = mock();
  await publishFeedPost(client, draft({ files: [file] }));
  const upload = client.calls.find((call) => call[0] === "upload");
  assert.equal(upload[1], "feed-media");
  assert.equal(upload[2], `${uuid}/${draft().id}/0.png`);
  for (const privacy of ["private", "friends"]) {
    const restricted = mock();
    await assert.rejects(
      publishFeedPost(restricted, draft({ files: [file], privacy })),
      /bucket is public/u,
    );
    assert.deepEqual(restricted.calls, []);
  }
  assert.throws(
    () => validateFeedFiles([new File(["x"], "code.svg", { type: "image/svg+xml" })]),
    /use JPEG/u,
  );
  assert.throws(() => validateFeedFiles(Array(7).fill(file)), /six files/u);
});

test("poll and empty-post validation prevents backend mutations", async () => {
  for (const invalid of [
    draft({ text: "" }),
    draft({ poll: { question: "?", options: ["one"], votes: {} } }),
  ]) {
    const client = mock();
    await assert.rejects(publishFeedPost(client, invalid));
    assert.deepEqual(client.calls, []);
  }
});

test("reactions use the existing unique key and deleting filters the validated user", async () => {
  const client = mock();
  await setPostReaction(client, "post", "love");
  const upsert = client.calls.find((call) => call[0] === "upsert");
  assert.deepEqual(upsert[1], {
    user_id: uuid,
    target_type: "post",
    target_id: "post",
    type: "love",
  });
  assert.equal(upsert[2].onConflict, "user_id,target_type,target_id");
  const remove = mock();
  await setPostReaction(remove, "post", null);
  assert.ok(
    remove.calls.some((call) => call[0] === "eq" && call[1] === "user_id" && call[2] === uuid),
  );
});

test("comments and replies derive author identity and verify parent membership", async () => {
  const client = mock();
  await addFeedComment(client, "post", " hello ", "parent");
  assert.ok(
    client.calls.some((call) => call[0] === "eq" && call[1] === "post_id" && call[2] === "post"),
  );
  assert.deepEqual(client.calls.find((call) => call[0] === "insert")[1], {
    post_id: "post",
    author_id: uuid,
    text: "hello",
    parent_comment_id: "parent",
  });
  await assert.rejects(
    addFeedComment(
      mock({ response: { data: null, error: { message: "parent missing" } } }),
      "post",
      "hello",
      "bad",
    ),
    /parent missing/u,
  );
});

test("own-post/comment edits and deletes add ownership filters and reject zero affected rows", async () => {
  for (const [operation, owner] of [
    [(client) => updateFeedPost(client, "post", "text"), "owner_id"],
    [(client) => deleteFeedPost(client, "post"), "owner_id"],
    [(client) => updateFeedComment(client, "comment", "text"), "author_id"],
    [(client) => deleteFeedComment(client, "comment"), "author_id"],
  ]) {
    const client = mock();
    await operation(client);
    assert.ok(
      client.calls.some((call) => call[0] === "eq" && call[1] === owner && call[2] === uuid),
    );
    await assert.rejects(operation(mock({ response: { data: null, error: null } })), /do not own/u);
  }
});

test("RLS and moderation errors remain visible to the caller", async () => {
  const client = mock({ response: { data: null, error: { message: "posting banned" } } });
  await assert.rejects(publishFeedPost(client, draft()), /posting banned/u);
});

test("Feed pagination uses the existing safe view and deterministic cursors; cancelled requests return no rows", async () => {
  const calls = [];
  const query = {};
  for (const name of ["select", "is", "limit", "or", "order", "abortSignal"]) query[name] = (...args) => { calls.push([name, ...args]); return query; };
  query.then = (resolve) => Promise.resolve({ data: [], error: null }).then(resolve);
  const client = { from: (table) => { calls.push(["from", table]); return query; } };
  const cursor = { id: uuid, created_at: "2026-10-10T00:00:00Z", trending_score: 2 };
  await fetchFeedPage(client, "trending", cursor);
  assert.deepEqual(calls[0], ["from", "posts_safe"]);
  assert.ok(calls.some((call) => call[0] === "is" && call[1] === "community_id" && call[2] === null));
  assert.ok(calls.some((call) => call[0] === "or" && call[1].includes(`id.lt.${uuid}`)));
  const controller = new AbortController(); controller.abort();
  const cancelled = await fetchFeedPage(client, "latest", cursor, controller.signal);
  assert.equal(cancelled.aborted, true); assert.deepEqual(cancelled.posts, []);
});
