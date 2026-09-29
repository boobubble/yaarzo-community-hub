import type { CodyMember } from "@/lib/codychat-adapter";
import { parseMembers } from "@/lib/codychat-adapter";

export type CodyFriendPeer = {
  codyUserId: string;
  username: string;
  avatar?: string;
  yaarzoUserId?: string | null;
};

export type CodyFriendsSnapshot = {
  accepted: CodyFriendPeer[];
  incoming: CodyFriendPeer[];
  outgoing: CodyFriendPeer[];
  ignored: CodyFriendPeer[];
};

export type CodyFriendAction =
  | "send"
  | "accept"
  | "remove"
  | "ignore"
  | "unignore";

export type CodyActionJson = {
  code?: number;
  etype?: string;
  emessage?: string;
};

export function isValidCodyUserId(value: string) {
  return /^\d{1,16}$/u.test(value);
}

const FRIEND_ACTIONS = new Set<CodyFriendAction>(["send", "accept", "remove", "ignore", "unignore"]);

export function isValidCodyFriendAction(value: string): value is CodyFriendAction {
  return FRIEND_ACTIONS.has(value as CodyFriendAction);
}

export function parseCodyActionJson(raw: string): CodyActionJson {
  try {
    return JSON.parse(raw) as CodyActionJson;
  } catch {
    return {};
  }
}

export function codyActionOk(payload: CodyActionJson) {
  return payload.code === 1;
}

/** Incoming friend requests from `system/float/friend_request.php`. */
export function parseIncomingFriendRequests(html: string): CodyFriendPeer[] {
  const peers: CodyFriendPeer[] = [];
  const seen = new Set<string>();
  for (const block of html.split("friend_request")) {
    if (!block.includes("get_info")) continue;
    const codyUserId = block.match(/\bget_info\b[^>]*\sdata=(["'])(\d+)\1/u)?.[2];
    if (!codyUserId || seen.has(codyUserId)) continue;
    const username = decodeHtmlText(
      block.match(/class=(["'])[^"']*\busername\b[^"']*\1[^>]*>([\s\S]*?)<\/p>/iu)?.[2] ?? "",
    );
    seen.add(codyUserId);
    peers.push({ codyUserId, username: username || `User ${codyUserId}` });
  }
  return peers;
}

/** Ignored users from `system/box/manage_ignore.php` (deleteIgnore onclick). */
export function parseIgnoredUsers(html: string): CodyFriendPeer[] {
  const peers: CodyFriendPeer[] = [];
  const seen = new Set<string>();
  for (const match of html.matchAll(/deleteIgnore\([^,]+,\s*(\d+)\s*\)/gu)) {
    const codyUserId = match[1];
    if (!codyUserId || seen.has(codyUserId)) continue;
    seen.add(codyUserId);
    peers.push({ codyUserId, username: `User ${codyUserId}` });
  }
  const withNames = enrichPeersWithUsernames(html, peers);
  return withNames;
}

function enrichPeersWithUsernames(html: string, peers: CodyFriendPeer[]): CodyFriendPeer[] {
  const namesById = new Map<string, string>();
  for (const match of html.matchAll(
    /deleteIgnore\([^,]+,\s*(\d+)\s*\)[\s\S]*?class=(["'])[^"']*\busername\b[^"']*\2[^>]*>([\s\S]*?)<\/p>/giu,
  )) {
    const id = match[1];
    const name = decodeHtmlText(match[3] ?? "");
    if (id && name) namesById.set(id, name);
  }
  return peers.map((p) => ({
    ...p,
    username: namesById.get(p.codyUserId) ?? p.username,
  }));
}

function decodeHtmlText(value: string) {
  return value.replace(/<[^>]*>/gu, "").trim();
}

export function membersToFriendPeers(members: CodyMember[]): CodyFriendPeer[] {
  return members.map((m) => ({
    codyUserId: m.id,
    username: m.name,
    ...(m.avatar ? { avatar: m.avatar } : {}),
    yaarzoUserId: m.yaarzoUserId ?? null,
  }));
}

export function diffOutgoingPending(
  manageFriends: CodyMember[],
  accepted: CodyMember[],
): CodyFriendPeer[] {
  const acceptedIds = new Set(accepted.map((m) => m.id));
  return membersToFriendPeers(manageFriends.filter((m) => !acceptedIds.has(m.id)));
}

export function parseAcceptedFriends(html: string) {
  return parseMembers(html);
}

export function parseManageFriends(html: string) {
  return parseMembers(html);
}
