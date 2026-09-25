import { HomeGuestEntryForm } from "@/components/home/HomeGuestEntryForm";
import { Button } from "@/components/ui/button";
import { WelcomeCard } from "@/components/home/welcome-primitives";

export function HomeEntryCard({
  onChatroomReady,
  onOpenSignIn,
  onOpenSignUp,
}: {
  onChatroomReady: () => void;
  onOpenSignIn: () => void;
  onOpenSignUp: () => void;
}) {
  return (
    <WelcomeCard className="p-5 sm:p-6 shadow-[0_30px_80px_-30px_rgba(139,92,246,0.45)]">
      <p className="mb-3 text-center text-[11px] font-bold uppercase tracking-wider text-purple-300">
        Join the conversation
      </p>
      <HomeGuestEntryForm onJoined={onChatroomReady} />
      <div className="mt-4 flex items-center gap-3">
        <span className="h-px flex-1 bg-[var(--home-border)]" aria-hidden />
        <span className="text-[10px] font-bold uppercase tracking-widest text-[var(--home-text-muted)]">
          Or
        </span>
        <span className="h-px flex-1 bg-[var(--home-border)]" aria-hidden />
      </div>
      <div className="mt-3 grid gap-2">
        <Button
          type="button"
          variant="outline"
          className="w-full border-white/15 bg-white/[0.04] hover:bg-white/[0.08]"
          onClick={onOpenSignIn}
        >
          Sign In
        </Button>
        <Button
          type="button"
          className="accent-button w-full"
          onClick={onOpenSignUp}
        >
          Create Account
        </Button>
      </div>
    </WelcomeCard>
  );
}
