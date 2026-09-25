import { supabase } from "@/lib/supabase";
import { isRemoteDmChannel, isUuid, parseDmChannel } from "@/lib/dm/dm-utils";

export const DM_CONVERSATION_READ_EVENT = "yaarzo:dm-conversation-read";

export function dispatchDmConversationRead(channelId: string) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(DM_CONVERSATION_READ_EVENT, { detail: { channelId } }));
}

export async function markDmConversationRead(
  userId: string,
  channelId: string,
  opts?: { lastReadAt?: string; skipNotificationDispatch?: boolean },
): Promise<{ lastReadAt: string } | null> {
  if (!isUuid(userId) || !isRemoteDmChannel(channelId, userId)) return null;

  const { peerId } = parseDmChannel(channelId, userId);
  if (!peerId || !isUuid(peerId)) return null;

  const lastReadAt = opts?.lastReadAt ?? new Date().toISOString();

  const { error: readErr } = await supabase.from("dm_reads").upsert(
    { user_id: userId, channel_id: channelId, last_read_at: lastReadAt },
    { onConflict: "user_id,channel_id" },
  );
  if (readErr) {
    console.error("[dm-read] dm_reads upsert failed", readErr);
    return null;
  }

  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userId)
    .eq("target_type", "dm")
    .eq("actor_id", peerId)
    .eq("read", false);

  if (!opts?.skipNotificationDispatch) {
    dispatchDmConversationRead(channelId);
  }

  return { lastReadAt };
}
