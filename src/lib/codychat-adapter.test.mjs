import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { parsePrivateNotifyHtml } from "./codychat-private.ts";
import {
  CODYCHAT_BASE_URL,
  CODYCHAT_PUBLIC_ORIGIN,
  isSafeCodyPublicUrl,
  resolveCodyEndpointUrl,
  resolveCodyPublicUrl,
} from "./chat/cody-chat-origin.ts";
import {
  codyAjaxHeaders,
  codyFetch,
  cookieHeader,
  openSession,
  parseMembers,
  parseRooms,
  sealSession,
  sessionCookie,
  updateCookieJar,
  validateSameOrigin,
} from "./codychat-adapter.ts";

test("bootstrap and slash-prefixed API paths stay under /chatroom/", () => {
  assert.equal(resolveCodyEndpointUrl(""), CODYCHAT_BASE_URL);
  for (const path of ["system/action/login.php", "/system/action/login.php", "/chatroom/system/action/login.php", "./system/action/login.php"]) {
    assert.equal(resolveCodyEndpointUrl(path), `${CODYCHAT_BASE_URL}system/action/login.php`);
  }
  assert.equal(resolveCodyEndpointUrl("/chatroom/"), CODYCHAT_BASE_URL);
  assert.equal(resolveCodyEndpointUrl("/system/action/chat_log.php?last=12"), `${CODYCHAT_BASE_URL}system/action/chat_log.php?last=12`);
});

test("API paths cannot escape the installation or forward credentials offsite", () => {
  for (const path of ["../login.php", "/../login.php", "%2e%2e/login.php", "https://other.example/login.php", "//other.example/login.php", "https://chat.yaarzo.com/system/action/login.php"]) {
    assert.throws(() => resolveCodyEndpointUrl(path));
  }
});

test("actual guest, registered, session, room, message and DM call paths use the base", async (t) => {
  const calls = [];
  t.mock.method(globalThis, "fetch", async (url, init) => {
    calls.push({ url, init });
    return new Response("", { status: 200 });
  });
  for (const route of ["guest-login", "registered-login", "session", "rooms", "messages", "private/messages", "private/conversations"]) {
    const source = readFileSync(new URL(`../routes/api/chat/${route}.ts`, import.meta.url), "utf8");
    const paths = [...source.matchAll(/codyFetch\("([^"]*)"/gu)].map((match) => match[1]);
    assert.ok(paths.length, `${route} must have an upstream request`);
    for (const path of paths) {
      await codyFetch(path);
      assert.equal(calls.at(-1).url, `${CODYCHAT_BASE_URL}${path}`);
      assert.equal(calls.at(-1).init.redirect, "manual");
      assert.equal(calls.at(-1).init.headers.Referer, CODYCHAT_BASE_URL);
      await codyFetch(`/${path}`);
      assert.equal(calls.at(-1).url, `${CODYCHAT_BASE_URL}${path}`);
    }
  }
});

test("Origin, Referer, authentication headers and request payload are preserved", async (t) => {
  const session = { cookies: { PHPSESSID: "test-session", tc_utk: "test-token", ignored: "discard" }, token: "test-token", nickname: "test", issuedAt: 1 };
  const headers = codyAjaxHeaders(session);
  assert.equal(headers.Origin, CODYCHAT_PUBLIC_ORIGIN);
  assert.equal(headers.Referer, CODYCHAT_BASE_URL);
  assert.equal(headers.Cookie, "PHPSESSID=test-session; tc_utk=test-token");
  const body = new URLSearchParams({ token: session.token });
  t.mock.method(globalThis, "fetch", async (url, init) => {
    assert.equal(url, `${CODYCHAT_BASE_URL}system/action/chat_process.php`);
    assert.equal(init.method, "POST");
    assert.equal(init.body, body);
    assert.equal(init.headers.Cookie, headers.Cookie);
    assert.equal(init.headers.Origin, CODYCHAT_PUBLIC_ORIGIN);
    assert.equal(init.headers["User-Agent"], "Yaarzo-CodyChat-Adapter/1.0");
    return new Response("");
  });
  await codyFetch("/system/action/chat_process.php", { method: "POST", headers, body });
});

test("hardcoded login, member, logout and upload headers use the shared base", () => {
  for (const route of ["guest-login", "members", "logout", "upload"]) {
    const source = readFileSync(new URL(`../routes/api/chat/${route}.ts`, import.meta.url), "utf8");
    assert.match(source, /Origin: CODYCHAT_ORIGIN/u);
    assert.match(source, /Referer: CODYCHAT_BASE_URL/u);
    assert.doesNotMatch(source, /Referer: "https:\/\/chat\.yaarzo\.com\/"/u);
  }
});

test("relative media, avatars and room icons use /chatroom/ without double-prefixing", () => {
  for (const value of ["upload/avatar.png", "/upload/avatar.png", "/chatroom/upload/avatar.png"]) {
    assert.equal(resolveCodyPublicUrl(value), `${CODYCHAT_BASE_URL}upload/avatar.png`);
  }
  assert.equal(resolveCodyPublicUrl("https://chat.yaarzo.com/chatroom/upload/avatar.png"), `${CODYCHAT_BASE_URL}upload/avatar.png`);
  assert.equal(resolveCodyPublicUrl(""), "");
  assert.equal(resolveCodyPublicUrl("javascript:alert(1)"), "");
  assert.equal(isSafeCodyPublicUrl(resolveCodyPublicUrl("https://other.example/avatar.png")), false);
  assert.equal(isSafeCodyPublicUrl(resolveCodyPublicUrl("//other.example/avatar.png")), false);
  assert.equal(parseMembers('<div class="user_item" data-id="1" data-name="Test" data-av="/upload/avatar.png"></div>')[0].avatar, `${CODYCHAT_BASE_URL}upload/avatar.png`);
  assert.equal(parsePrivateNotifyHtml('<div class="gprivate" data="1" value="Test" data-av="/upload/avatar.png"></div>')[0].avatar, `${CODYCHAT_BASE_URL}upload/avatar.png`);
  assert.equal(parseRooms('<div class="room_element" onclick="switchRoom(1, 0, 0);"><div class="roomtitle">Test</div><img class="room_cicon" src="/chatroom/default_images/room.png"></div>')[0].icon, `${CODYCHAT_BASE_URL}default_images/room.png`);
});

test("cookie allowlist, encrypted sessions and same-origin checks remain intact", async () => {
  const cookies = updateCookieJar(new Response("", { headers: { "Set-Cookie": "PHPSESSID=test-session; Path=/chatroom/; Secure; HttpOnly" } }));
  assert.equal(cookieHeader({ ...cookies, ignored: "discard" }), "PHPSESSID=test-session");
  const session = { cookies, token: "test-token", nickname: "test", issuedAt: 1 };
  const sealed = await sealSession(session, "regression-test-only");
  assert.deepEqual(await openSession(sealed, "regression-test-only"), session);
  assert.equal(await openSession(sealed, "wrong-test-secret"), null);
  assert.match(sessionCookie(sealed), /Path=\/;.*HttpOnly; Secure; SameSite=Lax/u);
  assert.equal(validateSameOrigin(new Request("https://yaarzo.example/api/chat/guest-login", { headers: { Origin: "https://other.example" } })), false);
});
