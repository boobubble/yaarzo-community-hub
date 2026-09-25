import { useEffect, useState, type ReactNode } from "react";
import { ArrowLeft, LogIn, Sparkles, UserRound } from "lucide-react";

import { RegisteredAuthPanel } from "@/components/auth/registered-auth-panel";
import { HomeGuestEntryForm } from "@/components/home/HomeGuestEntryForm";
import type { HomeJoinView } from "@/components/home/home-entry-context";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export type HomeEntryView = "choice" | "guest" | "signin" | "signup";

function viewToPanel(view: HomeJoinView): HomeEntryView {
  if (view === "signin" || view === "signup" || view === "guest") return view;
  return "choice";
}

function ChoiceOption({
  icon,
  title,
  subtitle,
  onClick,
  accent = false,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  onClick: () => void;
  accent?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left transition-colors hover:bg-muted/50 ${
        accent
          ? "border-purple-500/30 bg-purple-500/10"
          : "border-border bg-card"
      }`}
    >
      <span
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
          accent ? "bg-purple-500/20 text-purple-300" : "bg-muted text-foreground"
        }`}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold">{title}</span>
        <span className="block text-xs text-muted-foreground">{subtitle}</span>
      </span>
    </button>
  );
}

export function HomeJoinDialog({
  open,
  onOpenChange,
  initialView = "choice",
  onChatroomReady,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialView?: HomeJoinView;
  onChatroomReady: () => void;
}) {
  const [panel, setPanel] = useState<HomeEntryView>("choice");

  useEffect(() => {
    if (open) setPanel(viewToPanel(initialView));
  }, [open, initialView]);

  const closeAndEnter = () => {
    onOpenChange(false);
    onChatroomReady();
  };

  const backToChoice = () => setPanel("choice");

  const headerDescription =
    panel === "choice"
      ? "How would you like to continue?"
      : panel === "guest"
        ? "Join the live chatroom in seconds."
        : panel === "signin"
          ? "Sign in with your Yaarzo account."
          : "Create your registered Yaarzo profile.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[min(92vh,720px)] w-[calc(100%-1.5rem)] max-w-md flex-col gap-0 overflow-hidden border-border bg-card p-0 sm:w-full"
      >
        <div className="shrink-0 border-b border-border px-5 py-4 sm:px-6">
          <DialogHeader className="text-left">
            <DialogTitle>Join Yaarzo</DialogTitle>
            <DialogDescription>{headerDescription}</DialogDescription>
          </DialogHeader>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6">
          {panel === "choice" ? (
            <div className="grid gap-2.5">
              <ChoiceOption
                icon={<UserRound className="h-5 w-5" />}
                title="Continue as Guest"
                subtitle="No account needed"
                accent
                onClick={() => setPanel("guest")}
              />
              <ChoiceOption
                icon={<LogIn className="h-5 w-5" />}
                title="Sign In"
                subtitle="Already have a Yaarzo account"
                onClick={() => setPanel("signin")}
              />
              <ChoiceOption
                icon={<Sparkles className="h-5 w-5" />}
                title="Create Account"
                subtitle="Create your Yaarzo profile"
                onClick={() => setPanel("signup")}
              />
            </div>
          ) : null}

          {panel === "guest" ? (
            <div className="space-y-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="-ml-2 h-8 gap-1 px-2 text-xs"
                onClick={backToChoice}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Back
              </Button>
              <HomeGuestEntryForm onJoined={closeAndEnter} />
            </div>
          ) : null}

          {panel === "signin" || panel === "signup" ? (
            <RegisteredAuthPanel
              initialMode={panel === "signup" ? "signup" : "signin"}
              idPrefix="home-join-auth"
              showModeSwitcher={false}
              backLabel="Back"
              onBack={backToChoice}
              onSuccess={closeAndEnter}
            />
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
