import { HomeModuleEmpty, HomeSectionShell } from "@/components/home/home-shared";

export function HomeTrendingPosts() {
  return (
    <HomeSectionShell icon="🔥" title="Trending Posts" suffix="(Hot right now)" href="/feed">
      <HomeModuleEmpty message="Trending feed posts will rank here when the social feed is connected." />
    </HomeSectionShell>
  );
}
