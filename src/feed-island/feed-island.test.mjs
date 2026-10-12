import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./feed-island.tsx", import.meta.url), "utf8");

test("feed island owns a Shadow DOM root and exposes an idempotent lifecycle", () => {
  assert.match(source, /attachShadow\(\{ mode: "open" \}\)/u);
  assert.match(source, /unmountFeed\(container\);/u);
  assert.match(source, /mounted\.root\.unmount\(\)/u);
  assert.match(source, /setFeedTheme/u);
});
