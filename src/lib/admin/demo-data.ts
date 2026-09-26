// Isolated Phase 1 demo data for the admin preview only.
// Never imported by public routes, CodyChat adapters, or API routes.

export const demoUsers = [
  { name: "Aarav", email: "aarav@example.com", type: "Registered", status: "Active", level: 12, coins: 1840, joined: "12 Mar 2026", active: "2 min ago" },
  { name: "Guest_9182", email: "—", type: "Guest", status: "Active", level: 1, coins: 0, joined: "Today", active: "Online" },
  { name: "Meher", email: "meher@example.com", type: "VIP", status: "Active", level: 27, coins: 9120, joined: "04 Jan 2026", active: "18 min ago" },
  { name: "Rohit", email: "rohit@example.com", type: "Registered", status: "Suspended", level: 8, coins: 260, joined: "22 Feb 2026", active: "3 days ago" },
  { name: "Simran", email: "simran@example.com", type: "Creator", status: "Active", level: 19, coins: 4310, joined: "09 Dec 2025", active: "1 hr ago" },
  { name: "Kabir", email: "kabir@example.com", type: "Registered", status: "Banned", level: 5, coins: 0, joined: "17 Nov 2025", active: "2 wks ago" },
];

export const demoRooms = [
  { name: "Yaarzo Lounge", online: 128, messages: 24310, status: "Active", visibility: "Public", mods: 4 },
  { name: "Shayari Mehfil", online: 46, messages: 8120, status: "Active", visibility: "Public", mods: 2 },
  { name: "Late Night Talks", online: 12, messages: 3402, status: "Quiet", visibility: "Public", mods: 1 },
  { name: "Support Desk", online: 3, messages: 940, status: "Restricted", visibility: "Staff", mods: 3 },
];

export const demoReports = [
  { user: "Kabir", reason: "Abusive language", reporter: "Meher", time: "6 min ago", priority: "High" },
  { user: "Guest_2210", reason: "Spam links", reporter: "Aarav", time: "22 min ago", priority: "Medium" },
  { user: "Rohit", reason: "Harassment in DM", reporter: "Simran", time: "1 hr ago", priority: "High" },
  { user: "Guest_7781", reason: "Off-topic flooding", reporter: "System", time: "3 hrs ago", priority: "Low" },
];

export const demoActivity = [
  { text: "Meher joined Shayari Mehfil", time: "just now", tone: "info" as const },
  { text: "New registration: Aarav", time: "4 min ago", tone: "success" as const },
  { text: "Report submitted against Kabir", time: "6 min ago", tone: "danger" as const },
  { text: "Moderator muted Guest_2210", time: "21 min ago", tone: "warning" as const },
  { text: "Competition vote recorded", time: "38 min ago", tone: "info" as const },
  { text: "New poetry post published", time: "52 min ago", tone: "success" as const },
];

export const demoStickerPacks = [
  { name: "Yaarzo Classics", count: 24, status: "Enabled" },
  { name: "Shayari Moods", count: 16, status: "Enabled" },
  { name: "Festival Pack", count: 32, status: "Disabled" },
  { name: "Reactions Mini", count: 12, status: "Enabled" },
];

export const demoGrowth: Record<string, number[]> = {
  "7d": [42, 51, 38, 64, 72, 58, 81],
  "30d": [120, 168, 142, 190, 205, 176, 243],
  "90d": [380, 420, 505, 470, 610, 588, 702],
};
