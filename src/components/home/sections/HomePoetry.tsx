import { WelcomeCard } from "@/components/home/welcome-primitives";
import { ComingSoonBadge, HomeModuleEmpty, HomeSectionShell } from "@/components/home/home-shared";

export function HomePoetryTrending() {
  return (
    <HomeSectionShell icon="📜" title="Trending on Poetry Hub" suffix="(Poetry & battles)" href="/poetry">
      <HomeModuleEmpty message="Mehfil battles and trending verses will embed here." />
    </HomeSectionShell>
  );
}

export function HomePoetrySeo() {
  return (
    <section data-seo-copy className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
      <WelcomeCard className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Poetry and Shayari</h2>
          <ComingSoonBadge />
        </div>
        <p className="mt-3 text-sm leading-relaxed opacity-70 sm:text-base">
          Writers will share verses, shayari, and quiet reflections in the poetry hub.
          Read trending pieces, follow favourite writers, or publish your own lines — a
          calmer room beside live chatrooms, still part of the same Yaarzo community.
        </p>
      </WelcomeCard>
    </section>
  );
}
