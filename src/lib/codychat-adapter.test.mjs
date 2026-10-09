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

test("bootstrap and slash-prefixed API paths resolve under the CodyChat Test root", () => {
  assert.equal(resolveCodyEndpointUrl(""), CODYCHAT_BASE_URL);
  for (const path of ["system/action/login.php", "/system/action/login.php", "/chatroom/system/action/login.php", "./system/action/login.php"]) {
    assert.equal(resolveCodyEndpointUrl(path), `${CODYCHAT_BASE_URL}system/action/login.php`);
  }
  assert.equal(resolveCodyEndpointUrl("/chatroom/"), CODYCHAT_BASE_URL);
  assert.equal(resolveCodyEndpointUrl("/system/action/chat_log.php?last=12"), `${CODYCHAT_BASE_URL}system/action/chat_log.php?last=12`);
});

test("API paths reject traversal and offsite credential forwarding", () => {
  for (const path of ["../login.php", "/../login.php", "%2e%2e/login.php", "%252e%252e/login.php", "foo/%2f..%2fbar", "https://other.example/login.php", "//other.example/login.php", "https://chat.yaarzo.com/system/action/login.php"]) {
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
  const session = { cookies: { tc_userid: "test-user", tc_utk: "test-token", tc_ssid: "test-session", ignored: "discard" }, token: "test-token", nickname: "test", issuedAt: 1 };
  const headers = codyAjaxHeaders(session);
  assert.equal(headers.Origin, CODYCHAT_PUBLIC_ORIGIN);
  assert.equal(headers.Referer, CODYCHAT_BASE_URL);
  assert.equal(headers.Cookie, "tc_userid=test-user; tc_utk=test-token; tc_ssid=test-session");
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

test("registered login uses the verified Supabase bearer for profile RLS and safe diagnostics", () => {
  const source = readFileSync(new URL("../routes/api/chat/registered-login.ts", import.meta.url), "utf8");
  assert.match(source, /global:\s*\{\s*headers:\s*\{\s*Authorization:\s*`Bearer \$\{accessToken\}`/u);
  assert.match(source, /logRegisteredLoginFailure\(stage, upstreamStatus\)/u);
  assert.match(source, /codyFetch\("boom_bridge\.php"/u);
  assert.match(source, /"X-Yaarzo-Bridge-Secret": bridgeSecret/u);
  assert.match(source, /Origin: CODYCHAT_ORIGIN,[\s\S]*Referer: CODYCHAT_BASE_URL/u);
  assert.match(source, /id: user\.id,[\s\S]*name: String\(profile\.username\)/u);
  assert.doesNotMatch(source, /console\.error\([^)]*(?:accessToken|bridgeSecret|Cookie|profile)/iu);
});

test("relative media, avatars and room icons use the test root without double-prefixing", () => {
  for (const value of ["upload/avatar.png", "/upload/avatar.png", "/chatroom/upload/avatar.png"]) {
    assert.equal(resolveCodyPublicUrl(value), `${CODYCHAT_BASE_URL}upload/avatar.png`);
  }
  assert.equal(resolveCodyPublicUrl("https://cody-test.yaarzo.com/upload/avatar.png"), `${CODYCHAT_BASE_URL}upload/avatar.png`);
  assert.equal(resolveCodyPublicUrl("https://chat.yaarzo.com/chatroom/upload/avatar.png"), "");
  assert.equal(resolveCodyPublicUrl(""), "");
  assert.equal(resolveCodyPublicUrl("javascript:alert(1)"), "");
  assert.equal(isSafeCodyPublicUrl("https://cody-test.yaarzo.com/upload/avatar.png"), true);
  assert.equal(isSafeCodyPublicUrl("http://cody-test.yaarzo.com/upload/avatar.png"), false);
  assert.equal(isSafeCodyPublicUrl(resolveCodyPublicUrl("https://other.example/avatar.png")), false);
  assert.equal(isSafeCodyPublicUrl(resolveCodyPublicUrl("//other.example/avatar.png")), false);
  assert.equal(parseMembers('<div class="user_item" data-id="1" data-name="Test" data-av="/upload/avatar.png"></div>')[0].avatar, `${CODYCHAT_BASE_URL}upload/avatar.png`);
  assert.equal(parsePrivateNotifyHtml('<div class="gprivate" data="1" value="Test" data-av="/upload/avatar.png"></div>')[0].avatar, `${CODYCHAT_BASE_URL}upload/avatar.png`);
  assert.equal(parseRooms('<div class="room_element" onclick="switchRoom(1, 0, 0);"><div class="roomtitle">Test</div><img class="room_cicon" src="/chatroom/default_images/room.png"></div>')[0].icon, `${CODYCHAT_BASE_URL}default_images/room.png`);
});

test("test cookie allowlist, encrypted sessions and same-origin checks remain intact", async () => {
  const headers = new Headers();
  headers.append("Set-Cookie", "tc_userid=yaarzo-user; Path=/; Secure; HttpOnly; SameSite=Lax");
  headers.append("Set-Cookie", "tc_utk=token; Path=/; Secure; HttpOnly; SameSite=Lax");
  headers.append("Set-Cookie", "tc_ssid=session; Path=/; Secure; HttpOnly; SameSite=Lax");
  headers.append("Set-Cookie", "PHPSESSID=ignored; Path=/; Secure");
  const cookies = updateCookieJar(new Response("", { headers }));
  assert.equal(cookieHeader({ ...cookies, ignored: "discard" }), "tc_userid=yaarzo-user; tc_utk=token; tc_ssid=session");
  const session = { cookies, token: "test-token", nickname: "test", issuedAt: 1 };
  const sealed = await sealSession(session, "regression-test-only");
  assert.deepEqual(await openSession(sealed, "regression-test-only"), session);
  assert.equal(await openSession(sealed, "wrong-test-secret"), null);
  assert.match(sessionCookie(sealed), /Path=\/;.*HttpOnly; Secure; SameSite=Lax/u);
  assert.equal(validateSameOrigin(new Request("https://yaarzo.example/api/chat/guest-login", { headers: { Origin: "https://other.example" } })), false);
});

test("native SSO reports the missing CodyChat Test endpoint without falling back to production", () => {
  const source = readFileSync(new URL("../routes/api/chat/native-sso.ts", import.meta.url), "utf8");
  assert.match(source, /status:\s*503/u);
  assert.match(source, /\/yaarzo-sso\.php is not installed/u);
  assert.doesNotMatch(source, /chat\.yaarzo\.com/u);
});
