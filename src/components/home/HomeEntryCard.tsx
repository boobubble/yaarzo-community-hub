import { HomeGuestEntryForm } from "@/components/home/HomeGuestEntryForm";
import { RegisteredMemberSignIn } from "@/components/auth/registered-member-sign-in";
import { Button } from "@/components/ui/button";
import { WelcomeCard } from "@/components/home/welcome-primitives";

export function HomeEntryCard({
  onChatroomReady,
  onOpenSignUp,
}: {
  onChatroomReady: () => void;
  onOpenSignUp: () => void;
}) {
  return (
    <WelcomeCard className="p-5 sm:p-6 shadow-[0_30px_80px_-30px_rgba(139,92,246,0.45)]">
      <p className="mb-4 text-center text-[11px] font-bold uppercase tracking-wider text-purple-300">
        Join the conversation
      </p>
      <HomeGuestEntryForm onJoined={onChatroomReady} />
      <RegisteredMemberSignIn onChatroomReady={onChatroomReady} />
      <div className="mt-4 border-t border-[var(--home-border)] pt-4 text-center">
        <p className="mb-2 text-xs font-semibold opacity-80">New to Yaarzo?</p>
        <Button
          type="button"
          variant="outline"
          className="w-full border-white/15 bg-white/[0.04] hover:bg-white/[0.08]"
          onClick={onOpenSignUp}
        >
          Create Account / Sign Up
        </Button>
      </div>
    </WelcomeCard>
  );
}
