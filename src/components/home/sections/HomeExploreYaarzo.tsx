import { ComingSoonBadge } from "@/components/home/home-shared";
import { WelcomeCard } from "@/components/home/welcome-primitives";
import { HOME_EXPLORE_MODULES } from "@/lib/home/explore-modules";

export function HomeExploreYaarzo() {
  return (
    <section
      className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8"
      aria-label="Explore Yaarzo"
    >
      <div className="mb-6">
        <h2 className="text-2xl font-black tracking-tight sm:text-3xl">Explore Yaarzo</h2>
        <p className="mt-2 max-w-2xl text-sm opacity-65 sm:text-base">
          Every social module on the roadmap — compact today, expanding as each feature goes live.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {HOME_EXPLORE_MODULES.map((module) => (
          <WelcomeCard
            key={module.id}
            className="flex flex-col p-4 transition-transform hover:-translate-y-0.5"
          >
            <div className="flex items-start justify-between gap-2">
              <div
                className="grid h-11 w-11 shrink-0 place-items-center rounded-xl text-xl shadow-md"
                style={{ background: module.accent }}
                aria-hidden
              >
                {module.emoji}
              </div>
              <ComingSoonBadge />
            </div>
            <h3 className="mt-3 text-sm font-bold leading-snug">{module.name}</h3>
            <p className="mt-1 flex-1 text-[11px] leading-relaxed opacity-55">
              {module.description}
            </p>
          </WelcomeCard>
        ))}
      </div>
    </section>
  );
}
