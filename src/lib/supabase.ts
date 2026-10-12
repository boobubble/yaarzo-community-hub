import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env["VITE_SUPABASE_URL"];
const supabasePublishableKey = import.meta.env["VITE_SUPABASE_ANON_KEY"];

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey);

// Notify Grupo before Supabase revokes the originating Yaarzo session. Never send
// refresh tokens; failures still allow the normal logout and tokens expire normally.
const originalSignOut = supabase.auth.signOut.bind(supabase.auth);
supabase.auth.signOut = async (options) => {
  if (typeof window !== "undefined" && options?.scope !== "others") {
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session?.access_token)
        await fetch("/api/chat/grupo-sso", {
          method: "POST",
          cache: "no-store",
          signal: AbortSignal.timeout(5000),
          headers: {
            Authorization: `Bearer ${data.session.access_token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ operation: "revoke", scope: options?.scope ?? "global" }),
        });
    } catch {
      /* Network failures must not prevent Yaarzo logout. */
    }
  }
  return originalSignOut(options);
};
