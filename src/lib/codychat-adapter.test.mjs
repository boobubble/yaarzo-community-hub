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
  validateCodyChatOrigin,
} from "./chat/cody-chat-origin.ts";
import {
  codyAjaxHeaders,
  codyFetch,
  cookieHeader,
  extractCodyCaptchaMode,
  openSession,
  parseMembers,
  parseRooms,
  sealSession,
  sessionCookie,
  updateCookieJar,
  validateSameOrigin,
} from "./codychat-adapter.ts";
import { buildCodyRoomJoinBody, parseCodyRoomJoinResponse } from "./chat/cody-room-join.ts";

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

test("trusted CodyChat origin selects the matching installation base path", () => {
  const productionOrigin = "https://chat.yaarzo.com";
  assert.equal(
    resolveCodyEndpointUrl("system/action/login.php", productionOrigin),
    "https://chat.yaarzo.com/chatroom/system/action/login.php",
  );
  assert.equal(
    resolveCodyEndpointUrl("/chatroom/system/action/login.php", productionOrigin),
    "https://chat.yaarzo.com/chatroom/system/action/login.php",
  );
  assert.equal(
    resolveCodyPublicUrl("/upload/avatar.png", productionOrigin),
    "https://chat.yaarzo.com/chatroom/upload/avatar.png",
  );
  assert.equal(
    isSafeCodyPublicUrl("https://chat.yaarzo.com/chatroom/upload/avatar.png", productionOrigin),
    true,
  );
  assert.equal(isSafeCodyPublicUrl("https://chat.yaarzo.com/upload/avatar.png", productionOrigin), false);
  assert.throws(() => validateCodyChatOrigin("http://cody-test.yaarzo.com"));
  assert.throws(() => validateCodyChatOrigin("https://untrusted.example"));
  assert.throws(() => validateCodyChatOrigin("https://cody-test.yaarzo.com/path"));
});

test("Vite reads the non-public origin variable and injects only its validated value", () => {
  const config = readFileSync(new URL("../../vite.config.ts", import.meta.url), "utf8");
  assert.match(config, /loadEnv\(mode, process\.cwd\(\), ""\)/u);
  assert.match(config, /env\["YAARZO_CODYCHAT_ORIGIN"\]/u);
  assert.match(config, /validateCodyChatOrigin\(/u);
  assert.match(config, /__YAARZO_CODYCHAT_ORIGIN__:\s*JSON\.stringify\(codyChatOrigin\)/u);
  assert.doesNotMatch(config, /VITE_CODYCHAT_ORIGIN/u);
});

test("CodyChat captcha mode is parsed without exposing the provider site key", () => {
  assert.equal(extractCodyCaptchaMode('<script>var recapt = 0; var recaptKey = "public";</script>'), 0);
  assert.equal(extractCodyCaptchaMode('<script>var recapt = 1; var recaptKey = "public";</script>'), 1);
  assert.equal(extractCodyCaptchaMode('<script>var recapt = 2; var recaptKey = "public";</script>'), 2);
  assert.equal(extractCodyCaptchaMode('<script>var recapt = 3; var recaptKey = "public";</script>'), 3);
  assert.equal(extractCodyCaptchaMode('<script>var recapt = 4;</script>'), null);
  assert.equal(extractCodyCaptchaMode("<html></html>"), null);
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
  const session = { cookies: { tc_userid: "test-user", tc_utk: "test-token", tc_ssid: "test-session", PHPSESSID: "php-session", ignored: "discard" }, token: "test-token", nickname: "test", issuedAt: 1 };
  const headers = codyAjaxHeaders(session);
  assert.equal(headers.Origin, CODYCHAT_PUBLIC_ORIGIN);
  assert.equal(headers.Referer, CODYCHAT_BASE_URL);
  assert.equal(headers.Cookie, "tc_userid=test-user; tc_utk=test-token; tc_ssid=test-session; PHPSESSID=php-session");
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

test("CodyChat PHP session cookie stays server-side inside the encrypted session", async () => {
  const headers = new Headers();
  headers.append("Set-Cookie", "tc_userid=yaarzo-user; Path=/; Secure; HttpOnly; SameSite=Lax");
  headers.append("Set-Cookie", "tc_utk=token; Path=/; Secure; HttpOnly; SameSite=Lax");
  headers.append("Set-Cookie", "tc_ssid=session; Path=/; Secure; HttpOnly; SameSite=Lax");
  headers.append("Set-Cookie", "PHPSESSID=php-session; Path=/; Secure; HttpOnly; SameSite=Lax");
  headers.append("Set-Cookie", "untrusted=discard; Path=/; Secure");
  const cookies = updateCookieJar(new Response("", { headers }));
  assert.deepEqual(cookies, { tc_userid: "yaarzo-user", tc_utk: "token", tc_ssid: "session", PHPSESSID: "php-session" });
  assert.equal(cookieHeader({ ...cookies, untrusted: "discard" }), "tc_userid=yaarzo-user; tc_utk=token; tc_ssid=session; PHPSESSID=php-session");
  const session = { cookies, token: "test-token", nickname: "test", issuedAt: 1 };
  const sealed = await sealSession(session, "regression-test-only");
  assert.deepEqual(await openSession(sealed, "regression-test-only"), session);
  assert.equal(await openSession(sealed, "wrong-test-secret"), null);
  assert.match(sessionCookie(sealed), /Path=\/;.*HttpOnly; Secure; SameSite=Lax/u);
  assert.doesNotMatch(sessionCookie(sealed), /php-session|PHPSESSID/u);
  const expired = new Headers({ "Set-Cookie": "PHPSESSID=; Path=/; Max-Age=0; Secure; HttpOnly" });
  assert.deepEqual(updateCookieJar(new Response("", { headers: expired }), cookies), { tc_userid: "yaarzo-user", tc_utk: "token", tc_ssid: "session" });
  assert.equal(validateSameOrigin(new Request("https://yaarzo.example/api/chat/guest-login", { headers: { Origin: "https://other.example" } })), false);
});

test("registered, rooms and message routes preserve PHP session and POST token continuity", () => {
  const registered = readFileSync(new URL("../routes/api/chat/registered-login.ts", import.meta.url), "utf8");
  const rooms = readFileSync(new URL("../routes/api/chat/rooms.ts", import.meta.url), "utf8");
  const messages = readFileSync(new URL("../routes/api/chat/messages.ts", import.meta.url), "utf8");
  assert.match(registered, /updateCookieJar\(bridge\)[\s\S]*Cookie:\s*cookieHeader\(cookies\)[\s\S]*extractToken\(html\)[\s\S]*sealSession\(/u);
  assert.match(rooms, /method:\s*"POST"[\s\S]*headers:\s*codyAjaxHeaders\(session\)[\s\S]*body:\s*new URLSearchParams\(\{\s*token:\s*session\.token/u);
  assert.match(messages, /method:\s*"POST"[\s\S]*headers:\s*codyAjaxHeaders\(session\)[\s\S]*token:\s*session\.token/u);
});

test("password room joining uses the verified password and token fields", () => {
  assert.equal(
    buildCodyRoomJoinBody(7, "test-token").toString(),
    "room=7&token=test-token&join_room=1",
  );
  assert.equal(
    buildCodyRoomJoinBody(7, "test-token", "room pass").toString(),
    "room=7&token=test-token&pass=room+pass&join_room_pass=1",
  );

  assert.deepEqual(parseCodyRoomJoinResponse('{"code":5}', true), {
    ok: false,
    status: 400,
    reason: "wrong_password",
    error: "Incorrect room password.",
    code: 5,
  });
  assert.deepEqual(parseCodyRoomJoinResponse('{"access_requirement":true}', true), {
    ok: false,
    status: 403,
    reason: "access_requirement",
    error: "You do not have access to this room.",
  });
  assert.deepEqual(parseCodyRoomJoinResponse('{"code":10,"data":{"room_action":2}}', true), {
    ok: true,
    data: { room_action: 2 },
  });
  assert.deepEqual(parseCodyRoomJoinResponse("", true), { ok: true });
});

test("friend actions forward the required session token while ignore payloads stay unchanged", () => {
  const source = readFileSync(new URL("./server/cody-friends-service.ts", import.meta.url), "utf8");
  assert.match(source, /headers:\s*codyAjaxHeaders\(session\)[\s\S]*body:\s*new URLSearchParams\(fields\)/u);
  const friendActions = source.slice(source.indexOf('if (action === "send"'), source.indexOf('return { ok: false, error: "Unknown action." }'));
  assert.match(friendActions, /add_friend:\s*targetCodyUserId,[\s\S]*token:\s*session\.token/u);
  assert.match(friendActions, /remove_friend:\s*targetCodyUserId,[\s\S]*token:\s*session\.token/u);
  const ignoreActions = source.slice(source.indexOf('if (action === "ignore")'), source.indexOf('if (action === "send"'));
  assert.match(ignoreActions, /add_ignore:\s*targetCodyUserId/u);
  assert.match(ignoreActions, /remove_ignore:\s*targetCodyUserId/u);
  assert.doesNotMatch(ignoreActions, /token:\s*session\.token/u);
});

test("password room modal submits a password and keeps the prior room on join failure", () => {
  const source = readFileSync(new URL("../components/chat/YaarzoChatApp.tsx", import.meta.url), "utf8");
  assert.match(source, /Password-protected room/u);
  assert.match(source, /joinRoom\(passwordRoom, roomPassword\)/u);
  assert.match(source, /reason === "wrong_password"[\s\S]*setRoomPasswordError/u);
  assert.match(source, /reason === "access_requirement"[\s\S]*setRoomPasswordError/u);
  assert.match(source, /setRoomId\(room\.id\)/u);
});

test("guest login follows CodyChat's CAPTCHA mode and native response contract", () => {
  const guest = readFileSync(new URL("../routes/api/chat/guest-login.ts", import.meta.url), "utf8");
  const homeForm = readFileSync(new URL("../components/home/HomeGuestEntryForm.tsx", import.meta.url), "utf8");
  const chatForm = readFileSync(new URL("../components/chat/YaarzoChatApp.tsx", import.meta.url), "utf8");
  assert.match(guest, /extractCodyCaptchaMode\(bootstrapHtml\)/u);
  assert.match(guest, /captchaMode === 0 \? "disabled" : submittedCaptcha/u);
  assert.match(guest, /captchaMode > 0 && !submittedCaptcha[\s\S]*status:\s*503/u);
  assert.match(guest, /gusername:\s*nickname,[\s\S]*ggender:\s*gender,[\s\S]*gbirth:\s*birthDate,[\s\S]*recaptcha,/u);
  assert.match(guest, /result\.code !== 1/u);
  assert.match(guest, /4:\s*["']That nickname is not available\./u);
  assert.match(guest, /99:\s*["']This birth date is not eligible/u);
  assert.match(homeForm, /data\.set\("gender",\s*gender\)[\s\S]*data\.set\("birthDate",\s*birthDate\)/u);
  assert.match(homeForm, /if \(!ageOk\)/u);
  assert.match(chatForm, /GuestLoginDialog[\s\S]*data\.set\("gender",\s*gender\)[\s\S]*name="birthDate" type="date" required/u);
});

test("native SSO reports the missing CodyChat Test endpoint without falling back to production", () => {
  const source = readFileSync(new URL("../routes/api/chat/native-sso.ts", import.meta.url), "utf8");
  assert.match(source, /status:\s*503/u);
  assert.match(source, /\/yaarzo-sso\.php is not installed/u);
  assert.doesNotMatch(source, /chat\.yaarzo\.com/u);
});
