import { HomeModuleEmpty, HomeSectionShell } from "@/components/home/home-shared";

export function HomeFeaturedMembers() {
  return (
    <HomeSectionShell
      icon="⭐"
      title="Featured Members"
      suffix="(Stars of the week)"
      href="/leaderboard"
    >
      <HomeModuleEmpty
        message="Featured creators and top members will highlight here."
        liveCta={{ href: "/chatroom", label: "Meet people in chat" }}
      />
    </HomeSectionShell>
  );
}
