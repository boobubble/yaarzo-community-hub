import { HomeModuleEmpty, HomeSectionShell } from "@/components/home/home-shared";

export function HomeRecentActivity() {
  return (
    <HomeSectionShell
      icon="⚡"
      title="Latest Community Activity"
      suffix="(Live feed)"
      href="/feed"
    >
      <HomeModuleEmpty message="Cross-feature activity (posts, wins, joins) will show here." />
    </HomeSectionShell>
  );
}
