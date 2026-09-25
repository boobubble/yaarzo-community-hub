import { HomeModuleEmpty, HomeSectionShell } from "@/components/home/home-shared";

export function HomeLatestMembers() {
  return (
    <HomeSectionShell
      icon="👋"
      title="Latest Signups"
      suffix="(New members)"
      href="/find-friends"
    >
      <HomeModuleEmpty message="New member signups will appear when profiles are public on the hub." />
    </HomeSectionShell>
  );
}
