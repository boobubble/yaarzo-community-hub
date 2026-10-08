import type { CodySession } from "@/lib/codychat-adapter";
import { codyAjaxHeaders, codyFetch, parseMembers } from "@/lib/codychat-adapter";
import {
  type CodyFriendAction,
  type CodyFriendsSnapshot,
  codyActionOk,
  diffOutgoingPending,
  parseCodyActionJson,
  parseIncomingFriendRequests,
  parseIgnoredUsers,
  isValidCodyUserId,
} from "@/lib/chat/cody-friends";
import { enrichMembersWithYaarzoIds, resolveUsernameByYaarzoId } from "@/lib/server/member-yaarzo-lookup";
import { resolveCodyUserByUsername } from "@/lib/server/cody-user-resolve";

async function codyPost(
  session: CodySession,
  path: string,
  fields: Record<string, string>,
) {
  return codyFetch(path, {
    method: "POST",
    headers: codyAjaxHeaders(session),
    body: new URLSearchParams(fields),
  });
}

export async function loadCodyFriendsSnapshot(session: CodySession): Promise<CodyFriendsSnapshot> {
  const headers = codyAjaxHeaders(session);
  const [friendListRes, incomingRes, manageRes, ignoreRes] = await Promise.all([
    codyFetch("system/panel/friend_list.php", { method: "POST", headers, body: "" }),
    codyFetch("system/float/friend_request.php", { method: "POST", headers, body: "" }),
    codyFetch("system/box/manage_friends.php", { method: "POST", headers, body: "" }),
    codyFetch("system/box/manage_ignore.php", { method: "POST", headers, body: "" }),
  ]);

  const friendListHtml = friendListRes.ok ? await friendListRes.text() : "";
  const incomingHtml = incomingRes.ok ? await incomingRes.text() : "";
  const manageHtml = manageRes.ok ? await manageRes.text() : "";
  const ignoreHtml = ignoreRes.ok ? await ignoreRes.text() : "";

  const acceptedMembers = parseMembers(friendListHtml);
  const manageMembers = parseMembers(manageHtml);
  const [acceptedEnriched, manageEnriched, incomingBase, ignoredBase] = await Promise.all([
    enrichMembersWithYaarzoIds(acceptedMembers),
    enrichMembersWithYaarzoIds(manageMembers),
    Promise.resolve(parseIncomingFriendRequests(incomingHtml)),
    Promise.resolve(parseIgnoredUsers(ignoreHtml)),
  ]);

  const accepted = acceptedEnriched.map((m) => ({
    codyUserId: m.id,
    username: m.name,
    ...(m.avatar ? { avatar: m.avatar } : {}),
    yaarzoUserId: m.yaarzoUserId ?? null,
  }));

  const outgoing = diffOutgoingPending(manageEnriched, acceptedEnriched).map((p) => ({
    ...p,
    yaarzoUserId: manageEnriched.find((m) => m.id === p.codyUserId)?.yaarzoUserId ?? null,
  }));

  const incoming = await enrichPeers(incomingBase);
  const ignored = await enrichPeers(ignoredBase);

  return { accepted, incoming, outgoing, ignored };
}

async function enrichPeers(
  peers: { codyUserId: string; username: string; avatar?: string }[],
) {
  const asMembers = peers.map((p) => ({ id: p.codyUserId, name: p.username, ...(p.avatar ? { avatar: p.avatar } : {}) }));
  const enriched = await enrichMembersWithYaarzoIds(asMembers);
  return enriched.map((m) => ({
    codyUserId: m.id,
    username: m.name,
    ...(m.avatar ? { avatar: m.avatar } : {}),
    yaarzoUserId: m.yaarzoUserId ?? null,
  }));
}

export async function resolveCodyTargetId(
  session: CodySession,
  input: { codyUserId?: string | undefined; yaarzoUserId?: string | undefined },
): Promise<string | null> {
  if (input.codyUserId && isValidCodyUserId(input.codyUserId)) return input.codyUserId;
  if (!input.yaarzoUserId) return null;
  const username = await resolveUsernameByYaarzoId(input.yaarzoUserId);
  if (!username) return null;
  const member = await resolveCodyUserByUsername(session, username);
  return member?.id ?? null;
}

export async function runCodyFriendAction(
  session: CodySession,
  action: CodyFriendAction,
  targetCodyUserId: string,
): Promise<{ ok: true } | { ok: false; error: string; code?: number }> {
  if (!isValidCodyUserId(targetCodyUserId)) {
    return { ok: false, error: "Invalid user." };
  }

  if (action === "ignore") {
    const response = await codyPost(session, "system/action/action_member.php", {
      add_ignore: targetCodyUserId,
    });
    const payload = parseCodyActionJson(await response.text());
    if (!response.ok || !codyActionOk(payload)) {
      return { ok: false, error: payload.emessage ?? "Could not ignore user.", ...(payload.code !== undefined ? { code: payload.code } : {}) };
    }
    return { ok: true };
  }

  if (action === "unignore") {
    const response = await codyPost(session, "system/action/action_member.php", {
      remove_ignore: targetCodyUserId,
    });
    const payload = parseCodyActionJson(await response.text());
    if (!response.ok || !codyActionOk(payload)) {
      return { ok: false, error: payload.emessage ?? "Could not unignore user.", ...(payload.code !== undefined ? { code: payload.code } : {}) };
    }
    return { ok: true };
  }

  if (action === "send" || action === "accept") {
    const response = await codyPost(session, "system/action/action_friend.php", {
      add_friend: targetCodyUserId,
    });
    const payload = parseCodyActionJson(await response.text());
    if (!response.ok || !codyActionOk(payload)) {
      return {
        ok: false,
        error: payload.emessage ?? "Friend action was not accepted.",
        ...(payload.code !== undefined ? { code: payload.code } : {}),
      };
    }
    return { ok: true };
  }

  if (action === "remove") {
    const response = await codyPost(session, "system/action/action_friend.php", {
      remove_friend: targetCodyUserId,
    });
    const payload = parseCodyActionJson(await response.text());
    if (!response.ok || !codyActionOk(payload)) {
      return { ok: false, error: payload.emessage ?? "Could not remove friend.", ...(payload.code !== undefined ? { code: payload.code } : {}) };
    }
    return { ok: true };
  }

  return { ok: false, error: "Unknown action." };
}
