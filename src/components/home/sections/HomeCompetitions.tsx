import { HomeModuleEmpty, HomeSectionShell } from "@/components/home/home-shared";

export function HomeCompetitions() {
  return (
    <HomeSectionShell
      icon="🏁"
      title="Competitions"
      suffix="(Creative challenges)"
      href="/competitions"
    >
      <HomeModuleEmpty message="Community contests and creative challenges will list active events here." />
    </HomeSectionShell>
  );
}
