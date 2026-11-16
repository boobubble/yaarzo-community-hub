import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";

import { HomeJoinDialog } from "@/components/home/HomeJoinDialog";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";

function ChatroomEntryPage() {
  const { ready, session } = useAuth();
  const [joinOpen, setJoinOpen] = useState(false);
  const [message, setMessage] = useState("Checking your Yaarzo session…");
  const started = useRef(false);

  const startLiveSso = useCallback(async () => {
    const sessionResult = await supabase.auth.getSession().catch(() => null);
    const activeSession = sessionResult?.data.session;
    const accessToken = activeSession?.access_token;

    if (!accessToken || activeSession.user.is_anonymous) {
      setJoinOpen(true);
      setMessage("Sign in or create a Yaarzo account to continue, or enter as a guest.");
      return;
    }

    setMessage("Connecting securely to the live chatroom…");
    try {
      const response = await fetch("/api/chat/grupo-live-sso", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });
      const result = (await response.json()) as {
        bridgeUrl?: string;
        ticket?: string;
        redirect?: string;
        error?: string;
      };

      if (response.status === 401) {
        await supabase.auth.refreshSession().catch(() => null);
        setJoinOpen(true);
        setMessage("Your session needs attention. Please sign in again.");
        return;
      }

      if (!response.ok || !result.bridgeUrl || !result.ticket || !result.redirect) {
        setMessage(result.error || "Could not connect to the live chatroom. Please try again.");
        setJoinOpen(true);
        return;
      }

      const form = document.createElement("form");
      form.method = "POST";
      form.action = result.bridgeUrl;

      for (const [name, value] of Object.entries({
        ticket: result.ticket,
        redirect: result.redirect,
      })) {
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = name;
        input.value = value;
        form.append(input);
      }

      document.body.append(form);
      form.submit();
    } catch {
      setMessage("Live chatroom connection failed. Please try again.");
      setJoinOpen(true);
    }
  }, []);

  useEffect(() => {
    if (!ready || started.current) return;
    started.current = true;
    if (session && !session.user.is_anonymous) {
      void startLiveSso();
    } else {
      setMessage("Sign in or create a Yaarzo account to continue, or enter as a guest.");
      setJoinOpen(true);
    }
  }, [ready, session, startLiveSso]);

  return (
    <main className="grid min-h-screen place-items-center bg-[#070713] px-4 text-white">
      <section className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-7 text-center shadow-2xl">
        <div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 text-2xl font-black">
          Y
        </div>
        <h1 className="text-2xl font-extrabold">Yaarzo Chatroom</h1>
        <p className="mt-3 text-sm text-white/65" aria-live="polite">{message}</p>
        <div className="mt-6 grid gap-3">
          <button
            type="button"
            onClick={() => {
              started.current = false;
              void startLiveSso();
            }}
            className="rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-3 text-sm font-bold text-white"
          >
            Continue with Yaarzo
          </button>
          <a
            href="/chatroom/entry/guest_login"
            className="rounded-xl border border-white/15 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-white/85"
          >
            Continue as Guest
          </a>
        </div>
      </section>
      <HomeJoinDialog
        open={joinOpen}
        onOpenChange={setJoinOpen}
        initialView="choice"
        onChatroomReady={() => {
          started.current = false;
          void startLiveSso();
        }}
      />
    </main>
  );
}

export const Route = createFileRoute("/chatroom")({
  component: ChatroomEntryPage,
});
