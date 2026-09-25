import { ArrowRight, Rocket } from "lucide-react";

import { WelcomeCard } from "@/components/home/welcome-primitives";
import { HOME_LANDING_CONFIG } from "@/lib/home/landing-config";

export function HomeFinalCta({
  onCreateAccount,
}: {
  onCreateAccount: () => void;
}) {
  const cfg = HOME_LANDING_CONFIG;
  return (
    <>
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8" data-seo-copy>
        <WelcomeCard className="p-5 sm:p-6">
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Start Exploring Yaarzo</h2>
          <p className="mt-3 text-sm leading-relaxed opacity-70 sm:text-base">
            Open the{" "}
            <a href="/chatroom" className="font-semibold text-purple-300 underline-offset-4 hover:underline">
              live chatroom
            </a>{" "}
            today. Feed, communities, competitions, poetry, and more are rolling out on this
            homepage as each module connects — without redesigning the page.
          </p>
          <a
            href="/chatroom"
            className="mt-5 inline-flex items-center justify-center rounded-2xl border border-white/15 bg-white/[0.04] px-5 py-2.5 text-sm font-bold hover:bg-white/[0.08]"
          >
            Browse chatrooms
          </a>
        </WelcomeCard>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
          <WelcomeCard
            className="relative overflow-hidden p-6 sm:p-8"
            style={{
              background:
                "linear-gradient(135deg,rgba(168,85,247,0.35),rgba(236,72,153,0.25) 60%,rgba(59,130,246,0.2))",
            }}
          >
            <h2 className="text-2xl font-black sm:text-3xl">{cfg.finalCtaTitle}</h2>
            <p className="mt-2 text-sm opacity-80">{cfg.finalCtaSubtitle}</p>
            <button
              type="button"
              onClick={onCreateAccount}
              className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-bold text-[#1a0b2e] shadow-lg transition-transform hover:scale-[1.03]"
            >
              Create Free Account <ArrowRight className="h-4 w-4" />
            </button>
          </WelcomeCard>

          <WelcomeCard
            className="relative overflow-hidden p-6"
            style={{
              background: "linear-gradient(135deg,rgba(139,92,246,0.4),rgba(59,130,246,0.3))",
            }}
          >
            <div className="flex items-center gap-2 text-base font-extrabold">
              <Rocket className="h-5 w-5 text-pink-300" /> {cfg.referralHeadline}
            </div>
            <p className="mt-2 text-xs opacity-80">{cfg.referralDescription}</p>
            <span className="mt-4 inline-flex rounded-2xl border border-white/15 bg-white/10 px-5 py-2.5 text-sm font-bold opacity-70">
              Invite — coming soon
            </span>
          </WelcomeCard>
        </div>
      </section>
    </>
  );
}
