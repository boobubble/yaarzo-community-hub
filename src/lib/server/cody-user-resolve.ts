import type { CodyMember, CodySession } from "@/lib/codychat-adapter";
import { codyAjaxHeaders, codyFetch, parseMembers } from "@/lib/codychat-adapter";
import { parsePrivateNotifyHtml } from "@/lib/codychat-private";
import { enrichMembersWithYaarzoIds } from "@/lib/server/member-yaarzo-lookup";

function pickExactUsername(members: CodyMember[], username: string): CodyMember | null {
  const needle = username.trim().toLowerCase();
  return members.find((m) => m.name.trim().toLowerCase() === needle) ?? null;
}

async function fetchFriendMembers(session: CodySession): Promise<CodyMember[]> {
  const response = await codyFetch("system/panel/friend_list.php", {
    method: "POST",
    headers: codyAjaxHeaders(session),
    body: new URLSearchParams({ token: session.token }),
  });
  if (!response.ok) return [];
  return parseMembers(await response.text());
}

async function searchMembers(session: CodySession, username: string): Promise<CodyMember[]> {
  const query = username.trim().slice(0, 64);
  if (!query) return [];

  for (const searchType of ["1", "0", "2", "3"]) {
    const response = await codyFetch("system/action/action_search.php", {
      method: "POST",
      headers: codyAjaxHeaders(session),
      body: new URLSearchParams({
        query,
        search_type: searchType,
        search_order: "1",
        token: session.token,
      }),
    });
    if (!response.ok) continue;
    const members = parseMembers(await response.text());
    const exact = pickExactUsername(members, username);
    if (exact) return [exact];
  }
  return [];
}

async function memberFromPrivateHistory(
  session: CodySession,
  username: string,
): Promise<CodyMember | null> {
  const response = await codyFetch("system/float/private_notify.php", {
    method: "POST",
    headers: codyAjaxHeaders(session),
    body: new URLSearchParams({ token: session.token }),
  });
  if (!response.ok) return null;

  const needle = username.trim().toLowerCase();
  const convo = parsePrivateNotifyHtml(await response.text()).find(
    (row) => row.userName.trim().toLowerCase() === needle,
  );
  if (!convo) return null;

  return {
    id: convo.userId,
    name: convo.userName,
    ...(convo.avatar ? { avatar: convo.avatar } : {}),
  };
}

/**
 * Resolve a CodyChat account by username (friends, PM history, or Cody user search).
 * Does not require the user to be on the live room roster.
 */
export async function resolveCodyUserByUsername(
  session: CodySession,
  username: string,
): Promise<CodyMember | null> {
  const trimmed = username.trim();
  if (!trimmed) return null;

  const friendsHit = pickExactUsername(await fetchFriendMembers(session), trimmed);
  if (friendsHit) {
    const [enriched] = await enrichMembersWithYaarzoIds([friendsHit]);
    return enriched ?? friendsHit;
  }

  const historyHit = await memberFromPrivateHistory(session, trimmed);
  if (historyHit) {
    const [enriched] = await enrichMembersWithYaarzoIds([historyHit]);
    return enriched ?? historyHit;
  }

  const searchHit = pickExactUsername(await searchMembers(session, trimmed), trimmed);
  if (!searchHit) return null;

  const [enriched] = await enrichMembersWithYaarzoIds([searchHit]);
  return enriched ?? searchHit;
}
