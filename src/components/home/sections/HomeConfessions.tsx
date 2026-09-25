import { HomeModuleEmpty, HomeSectionShell } from "@/components/home/home-shared";

export function HomeConfessions() {
  return (
    <HomeSectionShell
      icon="🤫"
      title="Recent Confessions"
      suffix="(Anonymous)"
      href="/confessions"
    >
      <HomeModuleEmpty message="Anonymous confession cards will stream here when the module is live." />
    </HomeSectionShell>
  );
}
