import { Circle } from "lucide-react";

import { HomeChatroomCta } from "@/components/home/home-entry-context";
import { SectionTitle, WelcomeCard } from "@/components/home/welcome-primitives";
import { ComingSoonBadge, HomeModuleEmpty } from "@/components/home/home-shared";
import { HOME_LANDING_CONFIG } from "@/lib/home/landing-config";

const THUMBS = [
  "linear-gradient(135deg,#f59e0b,#dc2626)",
  "linear-gradient(135deg,#3b82f6,#1e3a8a)",
  "linear-gradient(135deg,#10b981,#065f46)",
  "linear-gradient(135deg,#f97316,#7c2d12)",
  "linear-gradient(135deg,#ec4899,#831843)",
];

export function HomeLiveCommunity() {
  const { chatroomTopics, games, missions } = HOME_LANDING_CONFIG;
  return (
    <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8" aria-label="Live community">
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4">
          <WelcomeCard className="p-5">
            <SectionTitle icon="🔥" title="Trending Chatrooms" />
            <div className="mt-3 space-y-2.5">
              {chatroomTopics.map((r, i) => (
                <HomeChatroomCta
                  key={r.name}
                  className="flex w-full items-center gap-3 rounded-xl bg-white/[0.03] p-2.5 text-left hover:bg-white/[0.06]"
                >
                  <div
                    className="grid h-11 w-14 place-items-center rounded-lg text-xl ring-1 ring-white/10"
                    style={{ background: THUMBS[i % THUMBS.length] }}
                  >
                    {r.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold">{r.name}</div>
                    <div className="text-[11px] opacity-50">{r.topic}</div>
                  </div>
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                </HomeChatroomCta>
              ))}
            </div>
          </WelcomeCard>

          <WelcomeCard className="p-5">
            <div className="flex flex-wrap items-center gap-2">
              <SectionTitle icon="🏆" title="Top Members" suffix="(This Week)" />
              <ComingSoonBadge />
            </div>
            <HomeModuleEmpty
              message="Weekly leaderboard rankings will appear here when the social layer is live."
              liveCta={{ label: "Join chat meanwhile", join: true }}
            />
          </WelcomeCard>
        </div>

        <div className="space-y-4">
          <WelcomeCard className="p-5">
            <div className="flex flex-wrap items-center gap-2">
              <SectionTitle icon="📝" title="Latest Feed" />
              <ComingSoonBadge />
            </div>
            <HomeModuleEmpty message="Public feed posts will surface here — no placeholder posts shown." />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <SectionTitle icon="📊" title="Community Poll" />
              <ComingSoonBadge />
            </div>
            <HomeModuleEmpty message="Live polls will run on the feed when it launches." />
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <SectionTitle icon="🤫" title="Confession preview" />
              <ComingSoonBadge />
            </div>
            <HomeModuleEmpty message="Anonymous confessions will preview here." />
          </WelcomeCard>
        </div>

        <div className="space-y-4">
          <WelcomeCard className="p-5">
            <div className="flex flex-wrap items-center gap-2">
              <SectionTitle icon="🎮" title="Popular Games" />
              <ComingSoonBadge />
            </div>
            <div className="mt-3 space-y-2">
              {games.map((g) => (
                <div
                  key={g.name}
                  className="flex items-center gap-3 rounded-xl bg-white/[0.03] p-2.5"
                >
                  <div
                    className="grid h-10 w-10 place-items-center rounded-lg text-xl"
                    style={{ background: "linear-gradient(135deg,#ec4899,#8b5cf6)" }}
                  >
                    {g.emoji}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold">{g.name}</div>
                    <div className="text-[11px] opacity-55">{g.description}</div>
                  </div>
                  <span className="shrink-0 text-[10px] font-bold uppercase text-amber-200/80">
                    Soon
                  </span>
                </div>
              ))}
            </div>
          </WelcomeCard>

          <WelcomeCard className="p-5">
            <div className="flex flex-wrap items-center gap-2">
              <SectionTitle icon="🎯" title="Today's Missions" />
              <ComingSoonBadge />
            </div>
            <div className="mt-3 space-y-2.5">
              {missions.map((m) => (
                <div
                  key={m.title}
                  className="flex items-center gap-3 rounded-xl bg-white/[0.03] p-2.5"
                >
                  <Circle className="h-5 w-5 shrink-0 opacity-30" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{m.title}</div>
                    <div className="text-[11px] opacity-55">{m.description}</div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full w-0 rounded-full bg-white/20" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </WelcomeCard>
        </div>
      </div>
    </section>
  );
}
