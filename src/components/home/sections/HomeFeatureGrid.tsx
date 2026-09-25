import { WelcomeCard } from "@/components/home/welcome-primitives";
import { ComingSoonBadge } from "@/components/home/home-shared";
import { HOME_LANDING_CONFIG } from "@/lib/home/landing-config";
import { isHomeLivePath } from "@/lib/home/home-routes";

const PALETTES = [
  "linear-gradient(135deg,#8b5cf6,#6d28d9)",
  "linear-gradient(135deg,#3b82f6,#1d4ed8)",
  "linear-gradient(135deg,#f97316,#ea580c)",
  "linear-gradient(135deg,#10b981,#059669)",
  "linear-gradient(135deg,#ef4444,#b91c1c)",
  "linear-gradient(135deg,#a855f7,#7c3aed)",
];

export function HomeFeatureGrid() {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8" aria-label="Platform features">
      <h2 className="sr-only">What you can do on Yaarzo</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {HOME_LANDING_CONFIG.featureCards.map((f, i) => {
          const live = isHomeLivePath(f.href);
          const body = (
            <>
              <div
                className="mx-auto grid h-14 w-14 place-items-center rounded-2xl text-2xl shadow-lg"
                style={{ background: PALETTES[i % PALETTES.length] }}
              >
                {f.emoji}
              </div>
              <h3 className="mt-3 text-sm font-bold">{f.title}</h3>
              <p className="mt-1 text-[11px] leading-snug opacity-55">{f.description}</p>
              {!live ? (
                <div className="mt-2 flex justify-center">
                  <ComingSoonBadge />
                </div>
              ) : null}
            </>
          );
          return (
            <WelcomeCard
              key={f.title}
              className="overflow-hidden p-0 text-center transition-transform hover:-translate-y-0.5"
            >
              {live ? (
                <a href={f.href} className="block p-5">{body}</a>
              ) : (
                <div className="p-5">{body}</div>
              )}
            </WelcomeCard>
          );
        })}
      </div>
    </section>
  );
}

export function HomeProductStats() {
  const items = [
    { label: "Live chat", value: "Now", live: true },
    { label: "Social feed", value: "Soon", live: false },
    { label: "Communities", value: "Soon", live: false },
    { label: "Games", value: "Soon", live: false },
    { label: "Poetry hub", value: "Soon", live: false },
    { label: "Rewards", value: "Soon", live: false },
  ];
  return (
    <section className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8" aria-label="Platform pillars">
      <div
        className="relative overflow-hidden rounded-3xl border border-white/10 p-2 sm:p-3"
        style={{
          background:
            "linear-gradient(135deg,rgba(139,92,246,0.10),rgba(59,130,246,0.06) 50%,rgba(236,72,153,0.08))",
        }}
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
          {items.map((item) => (
            <div key={item.label} className="p-3 text-center sm:p-4">
              <p className="text-lg font-black">{item.value}</p>
              <p className="text-[10px] font-semibold uppercase tracking-wide opacity-60">
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
