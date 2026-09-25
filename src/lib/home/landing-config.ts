/**
 * Homepage presentation config (admin-migratable later).
 * No demo user posts, counts, or activity — product copy and catalog only.
 */

export interface HomeFeatureCard {
  emoji: string;
  title: string;
  description: string;
  href: string;
}

export interface HomeGameCard {
  emoji: string;
  name: string;
  description: string;
}

export interface HomeMissionCard {
  emoji: string;
  title: string;
  description: string;
}

export interface HomeLandingConfig {
  heroEyebrow: string;
  heroSubtitle: string;
  heroBadges: string[];
  heroSocialProof: string;
  brandTagline: string;
  featureCards: HomeFeatureCard[];
  games: HomeGameCard[];
  missions: HomeMissionCard[];
  chatroomTopics: Array<{ emoji: string; name: string; topic: string }>;
  referralHeadline: string;
  referralDescription: string;
  finalCtaTitle: string;
  finalCtaSubtitle: string;
}

export const HOME_LANDING_CONFIG: HomeLandingConfig = {
  heroEyebrow: "Yaarzo Community",
  heroSubtitle:
    "Chat in real time, discover communities, share on the feed, play games, and grow with creators — starting with our premium live chatroom today.",
  heroBadges: ["💬 Chatrooms", "📱 Social Feed", "🎮 Games", "⭐ Rewards", "📜 Poetry", "🤫 Confessions"],
  heroSocialProof: "Guests and members connect in one premium social home.",
  brandTagline:
    "Free online chatrooms, social discovery, and community features — built to grow with you.",
  featureCards: [
    { emoji: "💬", title: "Live Chatrooms", description: "Public CodyChat rooms in the Yaarzo UI.", href: "/chatroom" },
    { emoji: "📱", title: "Social Feed", description: "Posts, polls, reactions, and trends.", href: "/feed" },
    { emoji: "🎮", title: "Games & Rewards", description: "Play, earn coins, XP, and badges.", href: "/games" },
    { emoji: "👥", title: "Find Friends", description: "Meet people and build friendships.", href: "/find-friends" },
    { emoji: "🏆", title: "Leaderboards", description: "Hall of fame and weekly ranks.", href: "/leaderboard" },
    { emoji: "🎯", title: "Daily Missions", description: "Complete missions for rewards.", href: "/achievements" },
  ],
  games: [
    { emoji: "🎲", name: "Ludo", description: "Classic board fun with friends" },
    { emoji: "🐟", name: "Fish Game", description: "Quick arcade-style play" },
    { emoji: "🍷", name: "Wine Game", description: "Community mini-game" },
    { emoji: "⛏️", name: "Dig Game", description: "Dig, collect, compete" },
  ],
  missions: [
    { emoji: "💬", title: "Send messages in chat", description: "Earn XP for active participation" },
    { emoji: "📝", title: "Share on the feed", description: "Post updates for the community" },
    { emoji: "❤️", title: "React to posts", description: "Support creators and friends" },
  ],
  chatroomTopics: [
    { emoji: "🌍", name: "General Lounge", topic: "Open chat" },
    { emoji: "🎮", name: "Gaming", topic: "Games & play" },
    { emoji: "🎓", name: "Students", topic: "Study & campus" },
    { emoji: "💭", name: "Late Night", topic: "Chill talk" },
    { emoji: "🎵", name: "Music", topic: "Playlists & vibes" },
  ],
  referralHeadline: "Invite Friends, Grow Together",
  referralDescription:
    "Referral rewards and community growth tools are rolling out with the full social layer.",
  finalCtaTitle: "Ready to Join the Fun?",
  finalCtaSubtitle:
    "Start as a guest in seconds or create a free account for DMs, feed, and more as modules go live.",
};
