import { HomeModuleEmpty, HomeSectionShell } from "@/components/home/home-shared";

export function HomeBlog() {
  return (
    <HomeSectionShell
      icon="📰"
      title="Community Blog"
      suffix="(Stories & guides)"
      href="/blog"
    >
      <HomeModuleEmpty message="Editorial stories and guides will publish to the blog hub." />
    </HomeSectionShell>
  );
}
