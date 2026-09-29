import type { CodyMember } from "@/lib/codychat-adapter";
import type { CodyPrivateConversation } from "@/lib/codychat-private";

const SESSION_STORAGE_KEY = "yaarzo_cody_user_by_username_v1";
const MAX_ENTRIES = 400;

type CachedCodyUser = {
  id: string;
  name: string;
  avatar?: string;
  yaarzoUserId?: string | null;
};

const memory = new Map<string, CachedCodyUser>();

function normalizeUsername(username: string) {
  return username.trim().toLowerCase();
}

function isValidCodyUserId(id: string) {
  return /^\d+$/u.test(id);
}

function readSessionMap(): Map<string, CachedCodyUser> {
  if (typeof sessionStorage === "undefined") return new Map();
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return new Map();
    const parsed = JSON.parse(raw) as Record<string, CachedCodyUser>;
    return new Map(Object.entries(parsed));
  } catch {
    return new Map();
  }
}

function writeSessionMap(map: Map<string, CachedCodyUser>) {
  if (typeof sessionStorage === "undefined") return;
  try {
    const entries = [...map.entries()];
    const trimmed =
      entries.length > MAX_ENTRIES ? entries.slice(entries.length - MAX_ENTRIES) : entries;
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(Object.fromEntries(trimmed)));
  } catch {
    // Quota or private mode — memory cache still works for the tab.
  }
}

function toMember(entry: CachedCodyUser): CodyMember | null {
  if (!entry.id || !entry.name || !isValidCodyUserId(entry.id)) return null;
  return {
    id: entry.id,
    name: entry.name,
    ...(entry.avatar ? { avatar: entry.avatar } : {}),
    yaarzoUserId: entry.yaarzoUserId ?? null,
  };
}

/** Fast path: Cody user id by username (no session secrets). */
export function getCodyMemberFromUsernameCache(username: string): CodyMember | null {
  const key = normalizeUsername(username);
  if (!key) return null;
  const hit = memory.get(key);
  if (hit) return toMember(hit);
  const sessionHit = readSessionMap().get(key);
  if (!sessionHit) return null;
  memory.set(key, sessionHit);
  return toMember(sessionHit);
}

export function rememberCodyMember(
  member: Pick<CodyMember, "id" | "name" | "avatar" | "yaarzoUserId">,
) {
  const name = member.name?.trim();
  const id = member.id?.trim();
  if (!name || !id || !isValidCodyUserId(id)) return;

  const key = normalizeUsername(name);
  const entry: CachedCodyUser = {
    id,
    name,
    ...(member.avatar ? { avatar: member.avatar } : {}),
    yaarzoUserId: member.yaarzoUserId ?? null,
  };
  memory.set(key, entry);

  const session = readSessionMap();
  session.set(key, entry);
  writeSessionMap(session);
}

export function rememberCodyMembersFromRoster(members: CodyMember[]) {
  for (const member of members) rememberCodyMember(member);
}

export function rememberCodyMembersFromPrivateConversations(
  conversations: CodyPrivateConversation[],
) {
  for (const row of conversations) {
    rememberCodyMember({
      id: row.userId,
      name: row.userName,
      ...(row.avatar ? { avatar: row.avatar } : {}),
    });
  }
}
