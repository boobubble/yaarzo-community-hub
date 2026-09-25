import { HomeModuleEmpty, HomeSectionShell } from "@/components/home/home-shared";

export function HomeDiscussions() {
  return (
    <HomeSectionShell
      icon="💬"
      title="Latest Public Discussions"
      href="/feed"
    >
      <HomeModuleEmpty
        message="Room and feed discussions will list here."
        liveCta={{ href: "/chatroom", label: "Chat in public rooms" }}
      />
    </HomeSectionShell>
  );
}
