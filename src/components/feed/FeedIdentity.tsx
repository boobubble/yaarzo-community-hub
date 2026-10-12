/* eslint-disable react-refresh/only-export-components -- island context and hook share their lifecycle */
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase, isFeedBridge, verifyFeedBridge, renewFeedBridge } from "@/lib/feed/feed-bridge";
import { Button } from "@/components/ui/button";

const Identity = createContext<{ user: User | null; ready: boolean; connect: () => void }>({
  user: null,
  ready: false,
  connect: () => {},
});
export const useFeedIdentity = () => useContext(Identity);

export function FeedIdentity({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [canRenew, setCanRenew] = useState(false);
  const [ready, setReady] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const locked = useRef(false);
  useEffect(() => {
    let active = true;
    let generation = 0;
    let expiryTimer: ReturnType<typeof setTimeout> | null = null;
    const verify = async () => {
      const request = ++generation;
      try {
        if (isFeedBridge()) {
          const status = await verifyFeedBridge();
          if (!active || request !== generation) return;
          if (expiryTimer !== null) clearTimeout(expiryTimer);
          if (status.user && status.expires_at)
            expiryTimer = setTimeout(
              () => {
                if (active) {
                  setUser(null);
                  void verify();
                }
              },
              Math.max(0, (status.expires_at - Date.now() / 1000 - 15) * 1000),
            );
          setUser(status.user);
          setCanRenew(status.canRenew === true);
          if (status.user) sessionStorage.removeItem("yaarzo-feed-renew-attempt");
          else if (status.canRenew && !sessionStorage.getItem("yaarzo-feed-renew-attempt")) {
            sessionStorage.setItem("yaarzo-feed-renew-attempt", "1");
            await renewFeedBridge();
          }
          return;
        }
        const { data, error: authError } = await supabase.auth.getUser();
        if (!active || request !== generation) return;
        setUser(!authError && data.user && !data.user.is_anonymous ? data.user : null);
      } catch {
        if (active && request === generation) setUser(null);
      } finally {
        if (active && request === generation) setReady(true);
      }
    };
    void verify();
    const timer = isFeedBridge() ? window.setInterval(() => void verify(), 30000) : null;
    const onVisible = () => {
      if (document.visibilityState === "visible") void verify();
    };
    document.addEventListener("visibilitychange", onVisible);
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        generation++;
        setUser(null);
        setReady(true);
      }
      // Auth API work must run outside the auth callback's lock.
      setTimeout(() => {
        if (active) void verify();
      }, 0);
    });
    return () => {
      active = false;
      generation++;
      subscription.unsubscribe();
      if (timer !== null) window.clearInterval(timer);
      if (expiryTimer !== null) clearTimeout(expiryTimer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  const connect = () => {
    if (!isFeedBridge()) {
      setConnecting(true);
      return;
    }
    if (!canRenew) {
      setError("Enter Grupo from your signed-in Yaarzo account to connect the Feed.");
      return;
    }
    void renewFeedBridge().catch(() =>
      setError("Could not reconnect. Return to Yaarzo and enter Grupo again."),
    );
  };
  return (
    <Identity.Provider value={{ user, ready, connect }}>
      <section
        className="mb-4 rounded-xl border border-border bg-card p-4"
        aria-label="Feed account"
      >
        {!ready ? (
          <p role="status">Checking Yaarzo account…</p>
        ) : user ? (
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm">Connected to Yaarzo: {user.email ?? "existing account"}</p>
            <Button
              variant="outline"
              disabled={busy}
              onClick={async () => {
                if (locked.current) return;
                locked.current = true;
                setBusy(true);
                setError("");
                try {
                  const result = await supabase.auth.signOut({ scope: "local" });
                  if (result.error) throw result.error;
                } catch {
                  setError("Could not disconnect. Try again.");
                } finally {
                  locked.current = false;
                  setBusy(false);
                }
              }}
            >
              Disconnect Feed
            </Button>
          </div>
        ) : (
          <>
            <p className="text-sm">
              Browse public posts. Connect your existing Yaarzo account to post, react or comment.
            </p>
            {isFeedBridge() ? (
              canRenew ? (
                <Button className="mt-2" onClick={connect}>
                  Reconnect Yaarzo
                </Button>
              ) : (
                <p className="mt-2 text-xs text-muted-foreground">
                  Enter Grupo from your signed-in Yaarzo account to connect the Feed.
                </p>
              )
            ) : (
              <Button className="mt-2" onClick={connect}>
                Sign In / Connect Account
              </Button>
            )}
          </>
        )}
        {connecting && !user && !isFeedBridge() ? (
          <form
            className="mt-3 grid gap-2"
            onSubmit={async (event) => {
              event.preventDefault();
              if (locked.current) return;
              locked.current = true;
              setBusy(true);
              setError("");
              const form = event.currentTarget;
              const fields = new FormData(form);
              try {
                const result = await supabase.auth.signInWithPassword({
                  email: String(fields.get("email") ?? "").trim(),
                  password: String(fields.get("password") ?? ""),
                });
                if (result.error) throw result.error;
                form.reset();
                setConnecting(false);
              } catch {
                setError("Could not sign in. Check your existing Yaarzo email and password.");
              } finally {
                locked.current = false;
                setBusy(false);
              }
            }}
          >
            <label className="text-sm">
              Yaarzo email
              <input
                className="mt-1 w-full rounded border border-input bg-background p-2"
                name="email"
                type="email"
                autoComplete="username"
                required
                disabled={busy}
              />
            </label>
            <label className="text-sm">
              Password
              <input
                className="mt-1 w-full rounded border border-input bg-background p-2"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                disabled={busy}
              />
            </label>
            <p className="text-xs text-muted-foreground">
              This connects only the Feed session. Your Grupo login stays active. Accounts and
              profiles are not created or merged.
            </p>
            <div className="flex gap-2">
              <Button disabled={busy}>{busy ? "Signing in…" : "Connect"}</Button>
              <Button
                type="button"
                variant="outline"
                disabled={busy}
                onClick={() => setConnecting(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        ) : null}
        {error ? (
          <p role="alert" className="mt-2 text-sm text-alert">
            {error}
          </p>
        ) : null}
      </section>
      {children}
    </Identity.Provider>
  );
}
