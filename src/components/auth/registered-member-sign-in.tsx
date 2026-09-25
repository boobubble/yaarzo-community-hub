import { FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { provisionRegisteredCodySession } from "@/lib/auth/enter-chatroom";
import { supabase } from "@/lib/supabase";

export function RegisteredMemberSignIn({
  onChatroomReady,
}: {
  onChatroomReady: () => void;
}) {
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    const data = new FormData(event.currentTarget);
    const identifier = String(data.get("identifier") ?? "").trim();
    const password = String(data.get("password") ?? "");

    try {
      if (!identifier) {
        setError("Email or username is required.");
        return;
      }

      if (identifier.includes("@")) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: identifier,
          password,
        });
        if (signInError) {
          setError("Invalid email/username or password.");
          return;
        }
      } else {
        const response = await fetch("/api/auth/username-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ username: identifier, password }),
        });
        const result = (await response.json()) as {
          error?: string;
          session?: { access_token: string; refresh_token: string };
        };

        if (
          !response.ok ||
          !result.session?.access_token ||
          !result.session?.refresh_token
        ) {
          setError(result.error ?? "Invalid email/username or password.");
          return;
        }

        const { error: sessionError } = await supabase.auth.setSession({
          access_token: result.session.access_token,
          refresh_token: result.session.refresh_token,
        });

        if (sessionError) {
          setError("Unable to start your session. Please try again.");
          return;
        }
      }

      const bridged = await provisionRegisteredCodySession();
      if (!bridged) {
        setError("Signed in, but CodyChat bridge failed. Try again.");
        return;
      }

      onChatroomReady();
    } catch {
      setError("Authentication is unavailable. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3 border-t border-[var(--home-border)] pt-4">
      <p className="text-sm font-extrabold text-[var(--home-text)]">
        Existing member
      </p>
      <div className="space-y-1.5">
        <Label htmlFor="home-signin-identifier" className="text-xs text-[var(--home-text-muted)]">
          Email or Username
        </Label>
        <Input
          id="home-signin-identifier"
          name="identifier"
          autoComplete="username"
          maxLength={254}
          required
          className="border-[var(--home-border)] bg-black/20 text-[var(--home-text)]"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="home-signin-password" className="text-xs text-[var(--home-text-muted)]">
          Password
        </Label>
        <Input
          id="home-signin-password"
          name="password"
          type="password"
          autoComplete="current-password"
          minLength={6}
          required
          className="border-[var(--home-border)] bg-black/20 text-[var(--home-text)]"
        />
      </div>
      {error ? (
        <p role="alert" className="text-xs text-rose-400">{error}</p>
      ) : null}
      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? "Signing in…" : "Sign In"}
      </Button>
    </form>
  );
}
