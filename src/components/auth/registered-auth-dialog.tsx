import { RegisteredAuthPanel } from "@/components/auth/registered-auth-panel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm border-border bg-card">
        <DialogHeader>
          <DialogTitle>Sign in or create account</DialogTitle>
          <DialogDescription>
            Use your registered Yaarzo account to enter the chatroom.
          </DialogDescription>
        </DialogHeader>

        <RegisteredAuthPanel
          key={open ? initialMode : "closed"}
          initialMode={initialMode}
          onSuccess={() => {
            onOpenChange(false);
            onChatroomReady?.();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
