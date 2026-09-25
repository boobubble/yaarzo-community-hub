import { useEffect, useState } from "react";

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

type JoinPanel = "guest" | "signin" | "signup";

function panelFromView(view: HomeJoinView): JoinPanel {
  return view;
}

export function HomeJoinDialog({
  open,
  onOpenChange,
  initialView = "guest",
  onChatroomReady,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialView?: HomeJoinView;
  onChatroomReady: () => void;
}) {
  const [panel, setPanel] = useState<JoinPanel>("guest");

  useEffect(() => {
    if (open) setPanel(panelFromView(initialView));
  }, [open, initialView]);

  const closeAndEnter = () => {
    onOpenChange(false);
    onChatroomReady();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[min(92vh,720px)] w-[calc(100%-1.5rem)] max-w-md flex-col gap-0 overflow-hidden border-border bg-card p-0 sm:w-full"
      >
        <div className="shrink-0 border-b border-border px-5 py-4 sm:px-6">
          <DialogHeader className="text-left">
            <DialogTitle>Join Yaarzo</DialogTitle>
            <DialogDescription>
              Join instantly as a guest or use your Yaarzo account.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6">
          {panel === "guest" ? (
            <div className="space-y-4">
              <HomeGuestEntryForm onJoined={closeAndEnter} />
              <div className="flex items-center gap-3">
                <span className="h-px flex-1 bg-border" aria-hidden />
                <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  Or
                </span>
                <span className="h-px flex-1 bg-border" aria-hidden />
              </div>
              <div className="grid gap-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setPanel("signin")}
                >
                  Sign In
                </Button>
                <Button
                  type="button"
                  className="accent-button w-full"
                  onClick={() => setPanel("signup")}
                >
                  Create Account
                </Button>
              </div>
            </div>
          ) : (
            <RegisteredAuthPanel
              initialMode={panel === "signup" ? "signup" : "signin"}
              idPrefix="home-join-auth"
              showModeSwitcher={false}
              onBack={() => setPanel("guest")}
              onSuccess={closeAndEnter}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
