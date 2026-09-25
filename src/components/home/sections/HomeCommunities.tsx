import { HomeModuleEmpty, HomeSectionShell } from "@/components/home/home-shared";

export function HomeCommunities() {
  return (
    <HomeSectionShell icon="🌐" title="Communities" suffix="(Interest groups)" href="/communities">
      <HomeModuleEmpty message="Browse and join communities by topic when discovery goes live." />
    </HomeSectionShell>
  );
}
