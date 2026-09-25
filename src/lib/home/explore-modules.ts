/**
 * Future homepage modules shown in Explore Yaarzo.
 * `sectionExport` maps to the full section component to mount when live.
 */
export type HomeExploreModule = {
  id: string;
  emoji: string;
  name: string;
  description: string;
  sectionExport: string;
  accent: string;
};

export const HOME_EXPLORE_MODULES: HomeExploreModule[] = [
  {
    id: "trending-posts",
    emoji: "🔥",
    name: "Trending Posts",
    description: "Hot posts from the social feed.",
    sectionExport: "HomeTrendingPosts",
    accent: "linear-gradient(135deg,#f97316,#ea580c)",
  },
  {
    id: "poetry",
    emoji: "📜",
    name: "Poetry & Shayari",
    description: "Verses, mehfil battles, and quiet reflections.",
    sectionExport: "HomePoetryTrending",
    accent: "linear-gradient(135deg,#a855f7,#7c3aed)",
  },
  {
    id: "discussions",
    emoji: "💬",
    name: "Public Discussions",
    description: "Room and feed threads in one place.",
    sectionExport: "HomeDiscussions",
    accent: "linear-gradient(135deg,#3b82f6,#1d4ed8)",
  },
  {
    id: "communities",
    emoji: "🌐",
    name: "Communities",
    description: "Interest groups and topic hubs.",
    sectionExport: "HomeCommunities",
    accent: "linear-gradient(135deg,#10b981,#059669)",
  },
  {
    id: "competitions",
    emoji: "🏁",
    name: "Competitions",
    description: "Creative challenges and contests.",
    sectionExport: "HomeCompetitions",
    accent: "linear-gradient(135deg,#ef4444,#b91c1c)",
  },
  {
    id: "featured-members",
    emoji: "⭐",
    name: "Featured Members",
    description: "Stars and creators to follow.",
    sectionExport: "HomeFeaturedMembers",
    accent: "linear-gradient(135deg,#f59e0b,#d97706)",
  },
  {
    id: "latest-members",
    emoji: "👋",
    name: "Latest Signups",
    description: "New members joining Yaarzo.",
    sectionExport: "HomeLatestMembers",
    accent: "linear-gradient(135deg,#06b6d4,#0891b2)",
  },
  {
    id: "confessions",
    emoji: "🤫",
    name: "Confessions",
    description: "Anonymous stories from the community.",
    sectionExport: "HomeConfessions",
    accent: "linear-gradient(135deg,#ec4899,#be185d)",
  },
  {
    id: "activity",
    emoji: "⚡",
    name: "Community Activity",
    description: "Posts, wins, and joins across Yaarzo.",
    sectionExport: "HomeRecentActivity",
    accent: "linear-gradient(135deg,#8b5cf6,#6d28d9)",
  },
  {
    id: "blog",
    emoji: "📰",
    name: "Community Blog",
    description: "Stories, guides, and announcements.",
    sectionExport: "HomeBlog",
    accent: "linear-gradient(135deg,#6366f1,#4338ca)",
  },
];
