import { useCallback, useEffect, useMemo, useState } from "react";

import type { CodyPrivateConversation } from "@/lib/codychat-private";
import { rememberCodyMembersFromPrivateConversations } from "@/lib/dm/cody-user-id-cache";

/** Shared Cody PM inbox poll interval (single loop for strip + unread badge). */
export const CODY_DM_INBOX_POLL_MS = 15_000;

export function useCodyDmInbox(hasCodySession: boolean) {
  const [conversations, setConversations] = useState<CodyPrivateConversation[]>([]);

  const refreshInbox = useCallback(async () => {
    if (!hasCodySession) return;
    const res = await fetch("/api/chat/private/conversations", { cache: "no-store" });
    if (!res.ok) return;
    const json = (await res.json()) as { conversations?: CodyPrivateConversation[] };
    const list = json.conversations ?? [];
    setConversations(list);
    rememberCodyMembersFromPrivateConversations(list);
  }, [hasCodySession]);

  useEffect(() => {
    if (!hasCodySession) {
      setConversations([]);
      return;
    }

    void refreshInbox();
    const interval = window.setInterval(() => void refreshInbox(), CODY_DM_INBOX_POLL_MS);
    return () => window.clearInterval(interval);
  }, [hasCodySession, refreshInbox]);

  const totalUnread = useMemo(
    () => conversations.reduce((sum, row) => sum + row.unread, 0),
    [conversations],
  );

  return { conversations, totalUnread, refreshInbox };
}
