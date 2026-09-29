import type { CodyFriendAction, CodyFriendsSnapshot } from "@/lib/chat/cody-friends";

export async function fetchCodyFriendsSnapshot(): Promise<CodyFriendsSnapshot | null> {
  const response = await fetch("/api/chat/friends", { cache: "no-store" });
  if (response.status === 401) return null;
  if (!response.ok) return null;
  return (await response.json()) as CodyFriendsSnapshot;
}

export async function postCodyFriendAction(input: {
  action: CodyFriendAction;
  codyUserId?: string;
  yaarzoUserId?: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const response = await fetch("/api/chat/friends", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const json = (await response.json().catch(() => ({}))) as { error?: string };
  if (!response.ok) return { ok: false, error: json.error ?? "Request failed." };
  return { ok: true };
}
