import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";

import { supabase } from "../lib/supabase";

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  ready: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    let previousAccessToken: string | null = null;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;

      previousAccessToken = data.session?.access_token ?? null;
      setSession(data.session);
      setReady(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      // Also propagate SDK-driven expiry / cross-tab logout. Run outside the
      // Supabase auth callback lock and send only the previous access token.
      if (event === "SIGNED_OUT" && previousAccessToken) {
        const accessToken = previousAccessToken;
        setTimeout(() => {
          void fetch("/api/chat/grupo-sso", {
            method: "POST",
            cache: "no-store",
            signal: AbortSignal.timeout(5000),
            headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
            body: JSON.stringify({ operation: "revoke", scope: "local" }),
          }).catch(() => {});
        }, 0);
      }
      previousAccessToken = nextSession?.access_token ?? null;
      if (!active) return;

      setSession(nextSession);
      setReady(true);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        ready,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
