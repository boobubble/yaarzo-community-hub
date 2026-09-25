/** Routes that exist in yaarzo-community-hub today. */
export const HOME_LIVE_PATHS = new Set<string>(["/", "/chatroom"]);

export function isHomeLivePath(path: string) {
  return HOME_LIVE_PATHS.has(path);
}

export const HOME_NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Chatrooms", href: "/chatroom" },
  { label: "Feed", href: "/feed" },
  { label: "Communities", href: "/communities" },
  { label: "Competitions", href: "/competitions" },
  { label: "Poetry", href: "/poetry" },
] as const;

export const HOME_EXPLORE_LINKS = [
  { label: "Chatrooms", href: "/chatroom" },
  { label: "Feed", href: "/feed" },
  { label: "Communities", href: "/communities" },
  { label: "Competitions", href: "/competitions" },
  { label: "Poetry", href: "/poetry" },
  { label: "Confessions", href: "/confessions" },
  { label: "Blog", href: "/blog" },
  { label: "Leaderboard", href: "/leaderboard" },
  { label: "Games", href: "/games" },
  { label: "Find Friends", href: "/find-friends" },
] as const;

export const HOME_FOOTER_COLUMNS = [
  {
    title: "Product",
    links: [
      { label: "Live Chat", href: "/chatroom" },
      { label: "Social Feed", href: "/feed" },
      { label: "Direct Messages", href: "/chatroom" },
    ],
  },
  {
    title: "Community",
    links: [
      { label: "Communities", href: "/communities" },
      { label: "Competitions", href: "/competitions" },
      { label: "Poetry Hub", href: "/poetry" },
    ],
  },
  {
    title: "Discover",
    links: [
      { label: "Confessions", href: "/confessions" },
      { label: "Blog", href: "/blog" },
      { label: "Leaderboard", href: "/leaderboard" },
    ],
  },
] as const;
