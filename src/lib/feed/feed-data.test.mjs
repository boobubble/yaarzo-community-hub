import assert from "node:assert/strict";
import test from "node:test";

import { feedCursor, mergeFeedPosts, normalizeFeedPost } from "./feed-data.ts";

function post(id, overrides = {}) {
  return normalizeFeedPost({
    id,
    owner_id: "owner",
    created_at: "2026-10-10T00:00:00.000Z",
    trending_score: 4,
    ...overrides,
  });
}

test("normalizes a public feed row without trusting malformed arrays", () => {
  const normalized = post("one", {
    hashtags: ["news", 42],
    media_urls: "not-an-array",
    poll: { title: "Question", options: ["A", "B"] },
  });

  assert.ok(normalized);
  assert.deepEqual(normalized.hashtags, ["news"]);
  assert.deepEqual(normalized.media_urls, []);
  assert.deepEqual(normalized.poll?.options, ["A", "B"]);
  assert.equal(normalizeFeedPost({ id: 7 }), null);
});

test("deduplicates paginated rows and produces stable latest/trending cursors", () => {
  const first = post("one");
  const second = post("two", {
    created_at: "2026-10-09T00:00:00.000Z",
    trending_score: 9,
  });
  assert.ok(first && second);

  assert.deepEqual(
    mergeFeedPosts([first], [first, second]).map(({ id }) => id),
    ["one", "two"],
  );
  assert.deepEqual(feedCursor("latest", [first, second]), {
    created_at: second.created_at,
    id: "two",
  });
  assert.deepEqual(feedCursor("trending", [first, second]), {
    trending_score: 9,
    created_at: second.created_at,
    id: "two",
  });
});
