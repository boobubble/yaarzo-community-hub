import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Bell,
  Compass,
  Crown,
  Flame,
  HeartHandshake,
  Home,
  Image,
  Menu,
  MessageCircle,
  MoreHorizontal,
  Paperclip,
  PenLine,
  Radio,
  Search,
  Send,
  Sparkles,
  Trophy,
  UserPlus,
  Users,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Yaarzo — Community Chat" },
      {
        name: "description",
        content: "Yaarzo community chat, rooms, conversations and social spaces.",
      },
      { property: "og:title", content: "Yaarzo — Community Chat" },
      {
        property: "og:description",
        content: "Join conversations and explore community spaces on Yaarzo.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: YaarzoChat,
});

type NavItem = {
  label: string;
  icon: typeof Home;
  badge?: string;
};

const primaryNavigation: NavItem[] = [
  { label: "Home", icon: Home },
  { label: "Feed", icon: Compass },
  { label: "Trending", icon: Flame },
  { label: "Find Friends", icon: UserPlus },
  { label: "Chatrooms", icon: MessageCircle },
  { label: "Poetry / Shayari", icon: PenLine },
  { label: "Competitions", icon: Trophy },
  { label: "Confessions", icon: HeartHandshake },
  { label: "Live Arena", icon: Radio },
  { label: "Leaderboard", icon: Crown },
];

const personalNavigation: NavItem[] = [
  { label: "Friend Requests", icon: Users },
  { label: "Notifications", icon: Bell },
  { label: "Direct Messages", icon: Send },
];

function Brand() {
  return (
    <div className="flex h-16 items-center gap-3 border-b border-border px-5">
      <div className="flex size-9 items-center justify-center rounded-md bg-highlight text-highlight-foreground shadow-brand">
        <HeartHandshake className="size-5" aria-hidden="true" />
      </div>
      <div>
        <div className="text-xl font-extrabold leading-none text-foreground">Yaarzo</div>
        <div className="mt-1 text-[10px] font-semibold uppercase text-muted-foreground">Connect. Express. Belong.</div>
      </div>
    </div>
  );
}

function Navigation({ active, onSelect }: { active: string; onSelect: (label: string) => void }) {
  const renderItem = ({ label, icon: Icon, badge }: NavItem) => {
    const selected = active === label;
    return (
      <Button
        key={label}
        variant="ghost"
        onClick={() => onSelect(label)}
        className={`h-10 w-full justify-start gap-3 px-3 font-medium ${selected ? "bg-sidebar-accent text-sidebar-primary" : "text-sidebar-foreground/70 hover:text-sidebar-foreground"}`}
      >
        <Icon className="size-[18px]" aria-hidden="true" />
        <span className="truncate">{label}</span>
        {badge ? <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-[10px] text-primary-foreground">{badge}</span> : null}
      </Button>
    );
  };

  return (
    <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto px-3 py-4" aria-label="Yaarzo navigation">
      <div className="space-y-1">{primaryNavigation.map(renderItem)}</div>
      <div className="my-4 border-t border-border" />
      <p className="mb-2 px-3 text-[10px] font-bold uppercase text-muted-foreground">Your space</p>
      <div className="space-y-1">{personalNavigation.map(renderItem)}</div>
    </nav>
  );
}

function LeftSidebar({
  active,
  onSelect,
  mobile,
  onClose,
}: {
  active: string;
  onSelect: (label: string) => void;
  mobile?: boolean;
  onClose?: () => void;
}) {
  return (
    <aside className={`${mobile ? "flex" : "hidden lg:flex"} h-full w-[220px] shrink-0 flex-col border-r border-border bg-sidebar`}>
      <div className="relative">
        <Brand />
        {mobile ? (
          <Button variant="ghost" size="icon" onClick={onClose} className="absolute right-3 top-3 text-muted-foreground" aria-label="Close menu">
            <X />
          </Button>
        ) : null}
      </div>
      <div className="px-4 pt-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input aria-label="Search Yaarzo" placeholder="Search Yaarzo" className="h-10 border-border bg-background/60 pl-9" />
        </div>
      </div>
      <Navigation active={active} onSelect={onSelect} />
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3 rounded-md px-2 py-2">
          <div className="flex size-9 items-center justify-center rounded-full border border-border bg-secondary text-muted-foreground">
            <Users className="size-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">Guest</p>
            <p className="truncate text-xs text-muted-foreground">Sign in through CodyChat</p>
          </div>
          <Button variant="ghost" size="icon" aria-label="More account options" className="size-8 text-muted-foreground">
            <MoreHorizontal />
          </Button>
        </div>
      </div>
    </aside>
  );
}

function MembersPanel({ mobile, onClose }: { mobile?: boolean; onClose?: () => void }) {
  return (
    <aside className={`${mobile ? "flex" : "hidden xl:flex"} h-full w-[210px] shrink-0 flex-col border-l border-border bg-card`}>
      <header className="flex h-16 items-center justify-between border-b border-border px-5">
        <div>
          <h2 className="font-bold text-foreground">Room members</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">Online users</p>
        </div>
        {mobile ? (
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close members">
            <X />
          </Button>
        ) : (
          <Button variant="ghost" size="icon" aria-label="Member options" className="text-muted-foreground">
            <MoreHorizontal />
          </Button>
        )}
      </header>
      <div className="flex flex-1 flex-col items-center justify-center px-7 text-center">
        <div className="mb-4 flex size-14 items-center justify-center rounded-full border border-border bg-secondary text-muted-foreground">
          <Users className="size-6" />
        </div>
        <h3 className="text-sm font-bold text-foreground">No member list connected</h3>
        <p className="mt-2 text-xs leading-5 text-muted-foreground">
          CodyChat’s live member data will appear here when its server connection is added.
        </p>
      </div>
      <div className="border-t border-border p-5">
        <p className="text-[10px] font-bold uppercase text-muted-foreground">Profile & highlights</p>
        <div className="mt-3 rounded-md border border-dashed border-border px-4 py-5 text-center text-xs leading-5 text-muted-foreground">
          Select a member to view their profile.
        </div>
      </div>
    </aside>
  );
}

function ProfilePanel() {
  return (
    <aside className="hidden h-full w-[240px] shrink-0 flex-col border-l border-border bg-sidebar 2xl:flex">
      <header className="flex h-16 items-center justify-between border-b border-border px-4">
        <p className="text-xs font-bold uppercase text-muted-foreground">Profile</p>
        <Button variant="ghost" size="icon" aria-label="Profile options" className="size-8 text-muted-foreground">
          <MoreHorizontal />
        </Button>
      </header>
      <div className="flex flex-1 flex-col items-center justify-center px-5 text-center">
        <div className="relative mb-4 flex size-20 items-center justify-center rounded-full border-2 border-highlight/60 bg-highlight/10 shadow-highlight">
          <Users className="size-8 text-highlight" />
          <span className="absolute bottom-1 right-0 size-3 rounded-full border-2 border-sidebar bg-muted-foreground" />
        </div>
        <h2 className="font-extrabold text-foreground">Guest profile</h2>
        <p className="mt-1 text-xs text-muted-foreground">No CodyChat user selected</p>
        <Button disabled className="mt-5 w-full bg-primary">View profile</Button>
        <div className="mt-5 grid w-full grid-cols-3 border-y border-border py-3">
          {[
            ["—", "Posts"],
            ["—", "Friends"],
            ["—", "Level"],
          ].map(([value, label]) => (
            <div key={label} className="text-center">
              <p className="text-sm font-extrabold text-foreground">{value}</p>
              <p className="text-[10px] text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-border p-4">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold uppercase text-muted-foreground">Today’s highlights</p>
          <span className="text-[10px] font-semibold text-primary">Preview</span>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-1.5">
          {[Image, Flame, PenLine, Trophy].map((Icon, index) => (
            <div key={index} className="flex aspect-square items-center justify-center rounded-md border border-border bg-secondary text-muted-foreground">
              <Icon className="size-4" />
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

function EmptyChat({ active }: { active: string }) {
  const isChat = active === "Chatrooms" || active === "Home";
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4 sm:px-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-muted-foreground" />
            <h1 className="truncate text-sm font-bold text-foreground">{isChat ? "Community chat" : active}</h1>
          </div>
          <p className="mt-1 truncate text-xs text-muted-foreground">{isChat ? "Waiting for CodyChat connection" : "Yaarzo social space"}</p>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" aria-label="Search conversation" className="text-muted-foreground">
            <Search />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Conversation options" className="text-muted-foreground">
            <MoreHorizontal />
          </Button>
        </div>
      </header>

      <div className="flex h-11 shrink-0 items-center gap-2 overflow-x-auto border-b border-border bg-card/70 px-4 scrollbar-none">
        <span className="flex shrink-0 items-center gap-1.5 text-xs font-bold text-highlight">
          <Flame className="size-3.5" /> Trending
        </span>
        {["Delhi", "Mumbai", "Cricket", "Bollywood", "Travel", "Food", "Music"].map((topic) => (
          <Button key={topic} variant="outline" size="sm" className="h-7 shrink-0 rounded-full bg-background px-3 text-[10px] text-muted-foreground">
            {topic}
          </Button>
        ))}
      </div>

      <main className="chat-canvas flex min-h-0 flex-1 items-center justify-center overflow-y-auto px-6 py-10">
        <div className="max-w-sm text-center">
          <div className="mx-auto mb-5 flex size-16 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-primary">
            {isChat ? <MessageCircle className="size-7" /> : <Sparkles className="size-7" />}
          </div>
          <h2 className="text-lg font-extrabold text-foreground">{isChat ? "Your conversations will appear here" : `${active} is coming to Yaarzo`}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {isChat
              ? "No sample messages were added. Your existing rooms and chat history can be connected in the backend phase."
              : "This is a navigation preview only. No data or activity is being created for this section."}
          </p>
        </div>
      </main>

      <footer className="shrink-0 border-t border-border bg-card/85 p-3 sm:p-4">
        <div className="mx-auto flex max-w-4xl items-end gap-2 rounded-md border border-border bg-background p-2 focus-within:border-primary/60">
          <Button variant="ghost" size="icon" disabled aria-label="Attach a file" className="shrink-0 text-muted-foreground">
            <Paperclip />
          </Button>
          <textarea
            disabled
            aria-label="Message"
            placeholder="Connect CodyChat to send a message"
            rows={1}
            className="max-h-28 min-h-9 flex-1 resize-none bg-transparent px-1 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
          />
          <Button variant="ghost" size="icon" disabled aria-label="Add media" className="hidden shrink-0 text-muted-foreground sm:inline-flex">
            <Image />
          </Button>
          <Button size="icon" disabled aria-label="Send message" className="shrink-0">
            <Send />
          </Button>
        </div>
      </footer>
    </div>
  );
}

function YaarzoChat() {
  const [active, setActive] = useState("Chatrooms");
  const [leftOpen, setLeftOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);

  const selectNavigation = (label: string) => {
    setActive(label);
    setLeftOpen(false);
  };

  return (
    <div className="dark h-dvh overflow-hidden bg-background text-foreground">
      <div className="flex h-full">
        <LeftSidebar active={active} onSelect={selectNavigation} />

        <section className="flex min-w-0 flex-1 flex-col bg-background">
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-3 lg:hidden">
            <Button variant="ghost" size="icon" onClick={() => setLeftOpen(true)} aria-label="Open navigation">
              <Menu />
            </Button>
            <div className="flex items-center gap-2 font-extrabold">
              <HeartHandshake className="size-5 text-highlight" /> Yaarzo
            </div>
            <Button variant="ghost" size="icon" onClick={() => setMembersOpen(true)} aria-label="Open room members">
              <Users />
            </Button>
          </div>
          <EmptyChat active={active} />
        </section>

        <MembersPanel />
        <ProfilePanel />
      </div>

      {leftOpen ? (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="absolute inset-0 bg-overlay" onClick={() => setLeftOpen(false)} aria-hidden="true" />
          <div className="relative h-full max-w-[86vw] shadow-2xl">
            <LeftSidebar active={active} onSelect={selectNavigation} mobile onClose={() => setLeftOpen(false)} />
          </div>
        </div>
      ) : null}

      {membersOpen ? (
        <div className="fixed inset-0 z-50 flex justify-end xl:hidden">
          <div className="absolute inset-0 bg-overlay" onClick={() => setMembersOpen(false)} aria-hidden="true" />
          <div className="relative h-full max-w-[88vw] shadow-2xl">
            <MembersPanel mobile onClose={() => setMembersOpen(false)} />
          </div>
        </div>
      ) : null}
    </div>
  );
}