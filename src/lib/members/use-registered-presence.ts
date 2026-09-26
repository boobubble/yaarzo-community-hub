import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export function useRegisteredPresence(userId?: string) {
  const [onlineIds, setOnlineIds] = useState<Set<string>>(() => userId ? new Set([userId]) : new Set());

  useEffect(() => {
    if (!userId) {
      setOnlineIds(new Set());
      return;
    }

    const channel = supabase.channel("yaarzo-registered-presence", {
      config: { presence: { key: userId } },
    });

    const sync = () => {
      const state = channel.presenceState();
      setOnlineIds(new Set([userId, ...Object.keys(state)]));
    };

    channel
      .on("presence", { event: "sync" }, sync)
      .on("presence", { event: "join" }, sync)
      .on("presence", { event: "leave" }, sync)
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({ user_id: userId, online_at: new Date().toISOString() });
        }
      });

    return () => {
      void channel.untrack();
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  return onlineIds;
}
