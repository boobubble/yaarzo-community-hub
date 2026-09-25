import { FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { provisionRegisteredCodySession } from "@/lib/auth/enter-chatroom";
import { supabase } from "@/lib/supabase";

export function RegisteredAuthDialog({
  open,
  onOpenChange,
  initialMode = "signin",
  onChatroomReady,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialMode?: "signin" | "signup";
  onChatroomReady?: () => void;
}) {
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [gender, setGender] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) setMode(initialMode);
  }, [open, initialMode]);

  const finishAuth = async () => {
    const bridged = await provisionRegisteredCodySession();
    if (!bridged) {
      setError("Signed in, but CodyChat bridge is unavailable. Try again from the chatroom.");
      return;
    }
    onOpenChange(false);
    onChatroomReady?.();
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);

    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");

    try {
      if (mode === "signin") {
        const identifier = String(data.get("identifier") ?? "").trim();

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

        await finishAuth();
        return;
      }

      const username = String(data.get("username") ?? "").trim();

      if (!username) {
        setError("Username is required.");
        return;
      }

      if (!gender) {
        setError("Gender is required.");
        return;
      }

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { username, gender },
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (signUpData.session) {
        await finishAuth();
        return;
      }

      setMessage("Account created. Check your email to confirm your account before entering the chatroom.");
    } catch {
      setError("Authentication is unavailable. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const changeMode = (nextMode: "signin" | "signup") => {
    setMode(nextMode);
    setError("");
    setMessage("");
    setGender("");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (next) setMode(initialMode);
      }}
    >
      <DialogContent className="max-w-sm border-border bg-card">
        <DialogHeader>
          <DialogTitle>
            {mode === "signin" ? "Sign In to Yaarzo" : "Create Yaarzo Account"}
          </DialogTitle>
          <DialogDescription>
            {mode === "signin"
              ? "Sign in with your registered Yaarzo account."
              : "Create your registered Yaarzo identity."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant={mode === "signin" ? "default" : "outline"}
            onClick={() => changeMode("signin")}
          >
            Sign In
          </Button>
          <Button
            type="button"
            variant={mode === "signup" ? "default" : "outline"}
            onClick={() => changeMode("signup")}
          >
            Sign Up
          </Button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === "signup" ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="registered-username">Username</Label>
                <Input
                  id="registered-username"
                  name="username"
                  autoComplete="username"
                  maxLength={64}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label>Gender</Label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          ) : null}

          <div className="space-y-1.5">
            <Label
              htmlFor={
                mode === "signin" ? "registered-identifier" : "registered-email"
              }
            >
              {mode === "signin" ? "Email or Username" : "Email"}
            </Label>
            <Input
              id={
                mode === "signin" ? "registered-identifier" : "registered-email"
              }
              name={mode === "signin" ? "identifier" : "email"}
              type={mode === "signin" ? "text" : "email"}
              autoComplete={mode === "signin" ? "username" : "email"}
              maxLength={mode === "signin" ? 254 : undefined}
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="registered-password">Password</Label>
            <Input
              id="registered-password"
              name="password"
              type="password"
              autoComplete={
                mode === "signin" ? "current-password" : "new-password"
              }
              minLength={6}
              required
            />
          </div>

          {error ? (
            <p role="alert" className="text-xs text-destructive">{error}</p>
          ) : null}
          {message ? (
            <p className="text-xs text-muted-foreground">{message}</p>
          ) : null}

          <Button
            type="submit"
            className="w-full"
            disabled={submitting || (mode === "signup" && !gender)}
          >
            {submitting
              ? "Please wait..."
              : mode === "signin"
                ? "Sign In"
                : "Create Account"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
