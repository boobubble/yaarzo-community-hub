import { Bell, UserPlus, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNotifications, notificationKindLabel, timeAgo } from "@/lib/notifications/notifications-provider";
import { useSocialGraph } from "@/lib/social/social-graph-provider";
import type { DirectoryProfile } from "@/lib/profiles/use-profiles-directory";
import { useMemo, useState } from "react";

export function NotificationsPanel({ profiles }: { profiles: Record<string, DirectoryProfile> }) {
  const { items, loaded, unread, markAllRead, markOne } = useNotifications();

  return (
    <div className="mx-auto flex h-full w-full max-w-2xl flex-col px-4 py-5">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="size-5 text-pink" />
          <h2 className="text-base font-extrabold">Notifications</h2>
          {unread > 0 ? (
            <span className="rounded-full bg-alert px-2 text-[10px] font-bold text-alert-foreground">{unread}</span>
          ) : null}
        </div>
        {unread > 0 ? (
          <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => void markAllRead()}>
            Mark all read
          </Button>
        ) : null}
      </div>
      {!loaded ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : items.length ? (
        <ul className="space-y-2 overflow-y-auto">
          {items.map((n) => {
            const actor = n.actor_id ? profiles[n.actor_id] : undefined;
            const name = actor?.display_name || actor?.username || "Someone";
            return (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => void markOne(n.id)}
                  className={`w-full rounded-lg border border-border px-3 py-2.5 text-left ${
                    n.read ? "bg-card/50" : "bg-card shadow-sm"
                  }`}
                >
                  <p className="text-[11px] font-bold text-foreground">
                    {name} <span className="font-medium text-muted-foreground">{notificationKindLabel(n.kind)}</span>
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">{timeAgo(n.created_at)}</p>
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">You&apos;re all caught up.</p>
      )}
    </div>
  );
}

export function FriendRequestsPanel({
  profiles,
  meId,
}: {
  profiles: Record<string, DirectoryProfile>;
  meId: string;
}) {
  const { friendships, acceptRequest, rejectRequest, cancelRequest } = useSocialGraph();
  const incomingRows = friendships.filter((f) => f.status === "pending" && f.receiver_id === meId);
  const outgoingRows = friendships.filter((f) => f.status === "pending" && f.sender_id === meId);

  return (
    <div className="mx-auto flex h-full w-full max-w-2xl flex-col px-4 py-5">
      <div className="mb-4 flex items-center gap-2">
        <Users className="size-5 text-cyan" />
        <h2 className="text-base font-extrabold">Friend Requests</h2>
      </div>
      <section className="mb-6">
        <p className="mb-2 text-[10px] font-bold uppercase text-muted-foreground">Incoming</p>
        {incomingRows.length ? (
          <ul className="space-y-2">
            {incomingRows.map((f) => {
              const sender = profiles[f.sender_id];
              return (
                <li key={f.id} className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2">
                  <span className="text-[11px] font-semibold">{sender?.username ?? "Member"}</span>
                  <div className="flex gap-1">
                    <Button size="sm" className="h-7 text-[10px]" onClick={() => void acceptRequest(f.id)}>Accept</Button>
                    <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => void rejectRequest(f.id)}>
                      Decline
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground">No incoming requests.</p>
        )}
      </section>
      <section>
        <p className="mb-2 text-[10px] font-bold uppercase text-muted-foreground">Sent</p>
        {outgoingRows.length ? (
          <ul className="space-y-2">
            {outgoingRows.map((f) => {
              const receiver = profiles[f.receiver_id];
              return (
                <li key={f.id} className="flex items-center justify-between rounded-lg border border-border bg-card px-3 py-2">
                  <span className="text-[11px] font-semibold">{receiver?.username ?? "Member"}</span>
                  <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => void cancelRequest(f.id)}>
                    Cancel
                  </Button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground">No pending outgoing requests.</p>
        )}
      </section>
    </div>
  );
}

export function FindFriendsPanel({
  profiles,
  meId,
  onMessage,
}: {
  profiles: Record<string, DirectoryProfile>;
  meId: string;
  onMessage: (peerId: string) => void;
}) {
  const [q, setQ] = useState("");
  const social = useSocialGraph();

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return [];
    return Object.values(profiles)
      .filter((p) => p.id !== meId && (p.username.toLowerCase().includes(needle) || (p.display_name ?? "").toLowerCase().includes(needle)))
      .slice(0, 20);
  }, [profiles, q, meId]);

  return (
    <div className="mx-auto flex h-full w-full max-w-2xl flex-col px-4 py-5">
      <div className="mb-4 flex items-center gap-2">
        <UserPlus className="size-5 text-violet" />
        <h2 className="text-base font-extrabold">Find Friends</h2>
      </div>
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by username…" className="mb-4" />
      <ul className="space-y-2 overflow-y-auto">
        {results.map((p) => {
          const relation = social.getRelation(p.id);
          return (
            <li key={p.id} className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-[11px] font-bold">{p.display_name || p.username}</p>
                <p className="text-[10px] text-muted-foreground">@{p.username} · L{p.level}</p>
              </div>
              <div className="flex shrink-0 gap-1">
                <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => onMessage(p.id)}>
                  Message
                </Button>
                {relation === "none" ? (
                  <Button size="sm" className="h-7 text-[10px]" onClick={() => void social.sendFriendRequest(p.id)}>
                    Add
                  </Button>
                ) : relation === "friends" ? (
                  <span className="px-2 text-[10px] text-muted-foreground">Friends</span>
                ) : relation === "pending_out" ? (
                  <span className="px-2 text-[10px] text-muted-foreground">Pending</span>
                ) : null}
              </div>
            </li>
          );
        })}
        {q.trim() && !results.length ? (
          <p className="text-xs text-muted-foreground">No members matched your search.</p>
        ) : null}
      </ul>
    </div>
  );
}
