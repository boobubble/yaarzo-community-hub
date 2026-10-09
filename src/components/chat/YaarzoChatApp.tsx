import {
  FormEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Bell,
  ChevronDown,
  Compass,
  Crown,
  Flame,
  HeartHandshake,
  Home,
  Image,
  CircleUser,
  PanelLeft,
  MessageCircle,
  CornerDownRight,
  Flag,
  MoreHorizontal,
  Palette,
  Paperclip,
  PenLine,
  Radio,
  Search,
  Send,
  Mail,
  ShieldCheck,
  Trophy,
  UserPlus,
  Users,
  X,
  LogOut,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AppearanceModePicker } from "@/components/chat/AppearanceModePicker";
import { ChatComposer } from "@/components/chat/ChatComposer";
import { useChatroomAppearance } from "@/hooks/use-chatroom-appearance";
import {
  DirectMessagesWorkspace,
  type DirectConversation,
} from "@/components/chat/dm/DirectMessagesWorkspace";
import { conversationKey, resolveDmRoute } from "@/lib/dm/direct-conversation";
import { resolveCodyMemberForDm } from "@/lib/dm/resolve-cody-dm-target";
import { ChatReportDialog } from "@/components/chat/ChatReportDialog";
import { PublicChatQuotedReply } from "@/components/chat/PublicChatQuotedReply";
import { MessageMediaContent } from "@/components/chat/media/MessageMediaContent";
import type { CodyChatCapabilities } from "@/lib/chat/cody-chat-capabilities";
import {
  type CodyPublicMessage,
  isCodyLogId,
  mergePublicMessageLists,
  quoteExcerpt,
} from "@/lib/chat/cody-public-quote";
import {
  maxNumericPublicLogId,
  normalizePublicChatLogs,
  extractChatPollLogs,
  readChatPollLastLogId,
  readChatPollRoomAction,
} from "@/lib/chat/cody-public-log";
import { resolveCodyPublicUrl } from "@/lib/chat/cody-chat-origin";
import { ConversationNavStrip } from "@/components/chat/RecentDmStrip";
import { FindFriendsPanel, NotificationsPanel } from "@/components/chat/social/SocialPanels";
import {
  CodyChatRelationshipsProvider,
  useCodyChatRelationships,
} from "@/lib/chat/cody-chat-relationships-provider";
import { rememberCodyMembersFromRoster } from "@/lib/dm/cody-user-id-cache";
import { buildRecentDmStripItems } from "@/lib/dm/recent-dm-strip";
import type { RecentDmStripItem } from "@/lib/dm/recent-dm-strip";

import { useCodyDmInbox } from "@/lib/dm/use-cody-dm-inbox";
import type { CodyPrivateConversation } from "@/lib/codychat-private";
import {
  buildHybridOnlineMembers,
  directoryProfileToCodyMember,
  onlineYaarzoIdsFromRoster,
  selectRecentOfflineRegisteredMembers,
} from "@/lib/members/recent-offline-registered";
import { timeAgo } from "@/lib/notifications/notifications-provider";
import type { CodyMember } from "@/lib/codychat-adapter";
import { mergeMediaConfig } from "@/lib/media/media-providers-config";
import { useProfilesDirectory } from "@/lib/profiles/use-profiles-directory";
import { useNotifications } from "@/lib/notifications/notifications-provider";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";
import type { AppearancePreference } from "@/lib/chatroom-appearance";

type NavItem = {
  label: string;
  icon: typeof Home;
  badge?: string;
  tone?: "violet" | "pink" | "cyan" | "amber" | "green";
};

type YaarzoTheme = "glass" | "cyber" | "neon" | "black";

const themeLabels: Record<YaarzoTheme, string> = {
  glass: "Premium Glass",
  cyber: "Cyberpunk",
  neon: "Neon Glass",
  black: "Black",
};

function ThemePicker({ value, onChange, compact = false }: { value: YaarzoTheme; onChange: (theme: YaarzoTheme) => void; compact?: boolean }) {
  return (
    <div className={compact ? "w-9" : "w-full"}>
      <Select value={value} onValueChange={(next) => onChange(next as YaarzoTheme)}>
        <SelectTrigger aria-label="Choose visual theme" className={`${compact ? "w-9 px-2 [&>span]:hidden [&>svg:last-child]:hidden" : "w-full"} theme-trigger h-8 border-border bg-secondary/70 text-[9px] shadow-brand`}>
          <Palette className="size-3.5 shrink-0 text-highlight" />
          <SelectValue />
          {!compact ? <span className="ml-auto flex items-center gap-0.5" aria-hidden="true"><i className="size-1.5 rounded-full bg-highlight" /><i className="size-1.5 rounded-full bg-cyan" /><i className="size-1.5 rounded-full bg-amber" /></span> : null}
        </SelectTrigger>
        <SelectContent>
          {Object.entries(themeLabels).map(([theme, label]) => (
            <SelectItem key={theme} value={theme}>{label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

const primaryNavigation: NavItem[] = [
  { label: "Home", icon: Home, tone: "cyan" },
  { label: "Feed", icon: Compass, tone: "amber" },
  { label: "Trending", icon: Flame, tone: "pink" },
  { label: "Find Friends", icon: UserPlus, tone: "violet" },
  { label: "Chatrooms", icon: MessageCircle, tone: "cyan" },
  { label: "Poetry / Shayari", icon: PenLine, tone: "violet" },
  { label: "Competitions", icon: Trophy, tone: "amber" },
  { label: "Confessions", icon: HeartHandshake, tone: "pink" },
  { label: "Live Arena", icon: Radio, tone: "pink" },
  { label: "Leaderboard", icon: Crown, tone: "amber" },
];

function Brand() {
  return (
    <div className="flex h-[68px] items-center gap-2.5 border-b border-sidebar-border px-3.5">
      <div className="brand-mark flex size-9 items-center justify-center rounded-lg text-highlight-foreground">
        <HeartHandshake className="size-[18px]" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <div className="font-display text-[19px] font-extrabold italic leading-none text-foreground">Yaarzo</div>
        <div className="mt-1 truncate text-[8px] font-bold uppercase text-muted-foreground">Chat ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· Connect ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· Belong</div>
      </div>
      <MoreHorizontal className="ml-auto size-4 text-muted-foreground" aria-hidden="true" />
    </div>
  );
}

type ChatroomNavProps = {
  rooms: CodyRoom[];
  activeRoomId?: number | undefined;
  canLoad: boolean;
  onJoinRoom: (room: CodyRoom) => void;
  onCloseMobileDrawer?: (() => void) | undefined;
};

function Navigation({
  active,
  onSelect,
  badges,
  chatrooms,
}: {
  active: string;
  onSelect: (label: string) => void;
  badges?: Partial<Record<string, number>> | undefined;
  chatrooms?: ChatroomNavProps | undefined;
}) {
  const chatActive = active === "Chatrooms" || active === "Home";
  const [chatroomsExpanded, setChatroomsExpanded] = useState(false);

  const renderItem = ({ label, icon: Icon, badge, tone = "violet" }: NavItem) => {
    const selected = active === label || (label === "Chatrooms" && chatActive);
    return (
      <Button
        key={label}
        variant="ghost"
        onClick={() => onSelect(label)}
        className={`nav-row h-8 w-full justify-start gap-2.5 rounded-md px-2.5 text-[11px] font-semibold ${selected ? "active-glow bg-sidebar-accent text-sidebar-primary" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"}`}
      >
        <Icon className={`nav-icon nav-icon-${tone} size-4 ${selected ? "is-selected" : ""}`} aria-hidden="true" />
        <span className="truncate">{label}</span>
        {badge ? (
          <span className="ml-auto rounded-full bg-alert px-2 py-0.5 text-[10px] text-alert-foreground shadow-alert">
            {badge}
          </span>
        ) : badges?.[label] ? (
          <span className="ml-auto rounded-full bg-alert px-2 py-0.5 text-[10px] text-alert-foreground shadow-alert">
            {badges[label]}
          </span>
        ) : null}
      </Button>
    );
  };

  const renderChatroomsItem = (item: NavItem) => {
    const { label, icon: Icon, tone = "cyan" } = item;
    const selected = chatActive;
    return (
      <div key={label} className="space-y-0.5">
        <Button
          variant="ghost"
          onClick={() => {
            onSelect("Chatrooms");
            setChatroomsExpanded((open) => !open);
          }}
          className={`nav-row h-8 w-full justify-start gap-2.5 rounded-md px-2.5 text-[11px] font-semibold ${selected ? "active-glow bg-sidebar-accent text-sidebar-primary" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"}`}
        >
          <Icon className={`nav-icon nav-icon-${tone} size-4 ${selected ? "is-selected" : ""}`} aria-hidden="true" />
          <span className="truncate">{label}</span>
          <ChevronDown
            className={`ml-auto size-3.5 shrink-0 transition-transform ${chatroomsExpanded ? "rotate-180" : ""}`}
            aria-hidden="true"
          />
        </Button>
        {chatroomsExpanded && chatrooms ? (
          chatrooms.canLoad ? (
            <div className="ml-3 max-h-36 space-y-0.5 overflow-y-auto border-l border-sidebar-border pl-2 scrollbar-none">
              {chatrooms.rooms.length ? (
                chatrooms.rooms.map((room) => {
                  const roomSelected = chatrooms.activeRoomId === room.id;
                  return (
                    <Button
                      key={room.id}
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        chatrooms.onJoinRoom(room);
                        onSelect("Chatrooms");
                        setChatroomsExpanded(false);
                        chatrooms.onCloseMobileDrawer?.();
                      }}
                      className={`h-7 w-full justify-start px-2 text-[10px] font-semibold ${
                        roomSelected
                          ? "bg-sidebar-accent text-sidebar-primary"
                          : "text-sidebar-foreground/75 hover:bg-sidebar-accent/50"
                      }`}
                    >
                      <span className="truncate"># {room.name}</span>
                    </Button>
                  );
                })
              ) : (
                <p className="px-2 py-1 text-[9px] text-muted-foreground">Loading roomsÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦</p>
              )}
            </div>
          ) : (
            <p className="ml-5 py-1 text-[9px] text-muted-foreground">Join chat to browse rooms.</p>
          )
        ) : null}
      </div>
    );
  };

  return (
    <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto px-2.5 py-2.5 scrollbar-none" aria-label="Yaarzo navigation">
      <div className="space-y-0.5">{primaryNavigation.slice(0, 4).map(renderItem)}</div>
      <p className="mb-1 mt-2.5 px-2.5 text-[8px] font-extrabold uppercase text-muted-foreground">Community</p>
      <div className="space-y-0.5">
        {primaryNavigation.slice(4).map((item) =>
          item.label === "Chatrooms" ? renderChatroomsItem(item) : renderItem(item),
        )}
      </div>
    </nav>
  );
}

function LeftSidebar({
  active,
  onSelect,
  navBadges,
  guestName,
  registered,
  registeredLabel,
  onRegisteredAuth,
  onGuestLogin,
  onLogout,
  presentation = "inline",
  onClose,
  theme,
  onThemeChange,
  appearancePreference,
  resolvedAppearance,
  onAppearancePreferenceChange,
  chatrooms,
}: {
  active: string;
  onSelect: (label: string) => void;
  navBadges?: Partial<Record<string, number>>;
  chatrooms?: ChatroomNavProps | undefined;
  guestName: string | undefined;
  registered: boolean;
  registeredLabel: string;
  onRegisteredAuth: () => void;
  onGuestLogin: () => void;
  onLogout: () => void;
  presentation?: "inline" | "drawer";
  onClose?: () => void;
  theme: YaarzoTheme;
  onThemeChange: (theme: YaarzoTheme) => void;
  appearancePreference: AppearancePreference;
  resolvedAppearance: "light" | "dark";
  onAppearancePreferenceChange: (preference: AppearancePreference) => void;
}) {
  return (
    <aside
      className={`${
        presentation === "drawer" ? "flex" : "hidden lg:flex"
      } premium-panel h-full w-[208px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar`}
    >
      <div className="relative">
        <Brand />
        {presentation === "drawer" ? (
          <Button variant="ghost" size="icon" onClick={onClose} className="absolute right-3 top-3 text-muted-foreground" aria-label="Close menu">
            <X />
          </Button>
        ) : null}
      </div>
      <div className="px-2.5 pt-2.5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input aria-label="Search Yaarzo" placeholder="Search rooms, users, postsÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦" className="h-8 border-sidebar-border bg-background/55 pl-8 text-[10px]" />
        </div>
      </div>
      <Navigation
        active={active}
        onSelect={onSelect}
        badges={navBadges}
        chatrooms={
          chatrooms
            ? {
                ...chatrooms,
                onCloseMobileDrawer:
                  presentation === "drawer" ? onClose : chatrooms.onCloseMobileDrawer,
              }
            : undefined
        }
      />
      <div className="space-y-2 border-t border-sidebar-border p-2.5">
        <div className="flex items-center gap-1.5">
          <ThemePicker value={theme} onChange={onThemeChange} />
          <AppearanceModePicker
            compact
            preference={appearancePreference}
            resolved={resolvedAppearance}
            onChange={onAppearancePreferenceChange}
          />
        </div>
        <div className="rounded-md border border-sidebar-border bg-background/35 p-2">
          <div className="flex items-center gap-2">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full border border-border bg-secondary text-muted-foreground">
              <Users className="size-4" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-[11px] font-bold text-foreground">
                {registered ? registeredLabel : guestName ?? "Yaarzo"}
              </p>
              <p className="truncate text-[8px] text-muted-foreground">
                {registered
                  ? "Registered Yaarzo account"
                  : guestName
                    ? "CodyChat guest"
                    : "Sign in or continue as guest"}
              </p>
            </div>

            {(registered || guestName) ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={onLogout}
                aria-label="Log out"
                className="size-8 shrink-0 text-muted-foreground"
              >
                <LogOut />
              </Button>
            ) : null}
          </div>

          {!registered && !guestName ? (
            <div className="mt-2 grid grid-cols-2 gap-1.5">
              <Button
                type="button"
                size="sm"
                onClick={onRegisteredAuth}
                className="h-7 text-[9px] font-bold"
              >
                Sign In / Up
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={onGuestLogin}
                className="h-7 text-[9px] font-bold"
              >
                Guest
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
}

function MembersPanel({
  members,
  loading,
  profiles,
  viewerSupabaseId,
  selfCodyUserId,
  onClose,
  onSelectMember,
  onSelectRegisteredProfile,
  onMessageMember,
  onMessageProfile,
}: {
  members: CodyMember[];
  loading: boolean;
  profiles: Record<string, import("@/lib/profiles/use-profiles-directory").DirectoryProfile>;
  viewerSupabaseId?: string | undefined;
  selfCodyUserId?: string | undefined;
  onClose: () => void;
  onSelectMember: (member: CodyMember) => void;
  onSelectRegisteredProfile: (profile: import("@/lib/profiles/use-profiles-directory").DirectoryProfile) => void;
  onMessageMember: (member: CodyMember) => void;
  onMessageProfile: (profile: import("@/lib/profiles/use-profiles-directory").DirectoryProfile) => void;
}) {
  const onlineYaarzoIds = useMemo(() => onlineYaarzoIdsFromRoster(members), [members]);

  const onlineRows = useMemo(
    () => buildHybridOnlineMembers(members, profiles),
    [members, profiles],
  );

  const recentOffline = useMemo(
    () => selectRecentOfflineRegisteredMembers(profiles, onlineYaarzoIds, viewerSupabaseId),
    [profiles, onlineYaarzoIds, viewerSupabaseId],
  );

  const renderOnlineRow = (row: ReturnType<typeof buildHybridOnlineMembers>[number]) => {
    const { codyMember, displayName, subtitle, avatarUrl } = row;
    const isSelf = selfCodyUserId && codyMember.id === selfCodyUserId;
    return (
      <div
        key={row.key}
        className="member-row group flex w-full items-center gap-1 rounded-md px-1 py-0.5 hover:bg-secondary"
      >
        <button
          type="button"
          onClick={() => onSelectMember(codyMember)}
          aria-label={`Open ${displayName}'s profile`}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1 py-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="relative size-8 shrink-0">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt=""
                className="size-8 rounded-full border border-border object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex size-8 items-center justify-center rounded-full border border-border bg-secondary text-muted-foreground">
                <Users className="size-3.5" />
              </div>
            )}
            <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-card bg-success shadow-brand" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[10px] font-bold text-foreground">{displayName}</p>
            <p className="truncate text-[8px] text-muted-foreground">{subtitle}</p>
          </div>
        </button>
        {!isSelf ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 shrink-0 text-muted-foreground opacity-100 sm:opacity-80 sm:group-hover:opacity-100"
            aria-label={`Message ${displayName}`}
            title="Message"
            onClick={() => onMessageMember(codyMember)}
          >
            <Mail className="size-3.5" />
          </Button>
        ) : null}
      </div>
    );
  };

  return (
    <aside className="premium-panel flex h-full w-[202px] shrink-0 flex-col border-l border-border bg-card">
      <header className="flex h-[68px] items-center justify-between border-b border-border px-3.5">
        <div>
          <h2 className="text-[13px] font-extrabold text-foreground">Members</h2>
          <p className="mt-0.5 text-[9px] text-muted-foreground">
            {onlineRows.length ? `${onlineRows.length} online` : "Room roster"}
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close members" title="Close members" className="text-muted-foreground">
          <X />
        </Button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto p-2 scrollbar-none">
        <p className="mb-1 px-1 text-[9px] font-bold uppercase text-muted-foreground">Online</p>
        {onlineRows.length ? (
          <div className="mb-3 space-y-0.5">{onlineRows.map(renderOnlineRow)}</div>
        ) : (
          <div className="mb-3 rounded-md border border-dashed border-border px-3 py-4 text-center">
            <p className="text-[10px] font-semibold text-foreground">{loading ? "Loading room members" : "No one online"}</p>
            <p className="mt-1 text-[9px] leading-4 text-muted-foreground">
              {loading ? "Checking CodyChat live presence." : "Sign in or join as guest to see live members."}
            </p>
          </div>
        )}

        {recentOffline.length ? (
          <>
            <p className="mb-1 mt-1 px-1 text-[9px] font-bold uppercase text-muted-foreground">Offline</p>
            <div>
              {recentOffline.map((profile) => {
                const displayName = profile.display_name || profile.username;
                const isSelf = Boolean(viewerSupabaseId && profile.id === viewerSupabaseId);
                return (
                  <div
                    key={profile.id}
                    className="group flex w-full items-center gap-1 rounded-md px-1 py-[2px] hover:bg-secondary"
                  >
                    <button
                      type="button"
                      onClick={() => onSelectRegisteredProfile(profile)}
                      aria-label={`Open ${displayName}'s profile`}
                      className="flex min-w-0 flex-1 items-center gap-1.5 rounded-md px-1 py-0 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <div className="relative size-7 shrink-0">
                        {profile.avatar_url ? (
                          <img
                            src={profile.avatar_url}
                            alt=""
                            className="size-7 rounded-full border border-border object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="flex size-7 items-center justify-center rounded-full border border-border bg-secondary text-muted-foreground">
                            <Users className="size-3" />
                          </div>
                        )}
                        <span className="absolute bottom-0 right-0 size-2 rounded-full border-2 border-card bg-muted-foreground" />
                      </div>
                      <p className="min-w-0 flex-1 truncate text-[10px] font-bold leading-none text-foreground">
                        {displayName}
                      </p>
                    </button>
                    {!isSelf ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="size-7 shrink-0 text-muted-foreground opacity-100 sm:opacity-80 sm:group-hover:opacity-100"
                        aria-label={`Message ${profile.username}`}
                        title="Message"
                        onClick={() => onMessageProfile(profile)}
                      >
                        <Mail className="size-3.5" />
                      </Button>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </>
        ) : null}
      </div>
    </aside>
  );
}

function RegisteredAuthDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [gender, setGender] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setSubmitting(true);

    const data = new FormData(event.currentTarget);
    const email = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");

    try {
      if (mode === "signin") {
  const identifier = String(data.get("identifier") ?? "").trim();

  if (!identifier) {
    setError("Email or username is required.");
    return;
  }

  if (identifier.includes("@")) {
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: identifier,
      password,
    });

    if (signInError) {
      setError("Invalid email/username or password.");
      return;
    }
  } else {
    const response = await fetch("/api/auth/username-login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "same-origin",
      body: JSON.stringify({
        username: identifier,
        password,
      }),
    });

    const result = (await response.json()) as {
      error?: string;
      session?: {
        access_token: string;
        refresh_token: string;
      };
    };

    if (
      !response.ok ||
      !result.session?.access_token ||
      !result.session?.refresh_token
    ) {
      setError(result.error ?? "Invalid email/username or password.");
      return;
    }

    const { error: sessionError } = await supabase.auth.setSession({
      access_token: result.session.access_token,
      refresh_token: result.session.refresh_token,
    });

    if (sessionError) {
      setError("Unable to start your session. Please try again.");
      return;
    }
  }

  onOpenChange(false);
  return;
}

      const username = String(data.get("username") ?? "").trim();

      if (!username) {
        setError("Username is required.");
        return;
      }

      if (!gender) {
        setError("Gender is required.");
        return;
      }

      const { data: signUpData, error: signUpError } =
        await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username,
              gender,
            },
          },
        });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (signUpData.session) {
        onOpenChange(false);
        return;
      }

      setMessage("Account created. Check your email to confirm your account.");
    } catch {
      setError("Authentication is unavailable. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const changeMode = (nextMode: "signin" | "signup") => {
    setMode(nextMode);
    setError("");
    setMessage("");
    setGender("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm border-border bg-card">
        <DialogHeader>
          <DialogTitle>
            {mode === "signin" ? "Sign In to Yaarzo" : "Create Yaarzo Account"}
          </DialogTitle>
          <DialogDescription>
            {mode === "signin"
              ? "Sign in with your registered Yaarzo account."
              : "Create your registered Yaarzo identity."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant={mode === "signin" ? "default" : "outline"}
            onClick={() => changeMode("signin")}
          >
            Sign In
          </Button>
          <Button
            type="button"
            variant={mode === "signup" ? "default" : "outline"}
            onClick={() => changeMode("signup")}
          >
            Sign Up
          </Button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === "signup" ? (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="registered-username">Username</Label>
                <Input
                  id="registered-username"
                  name="username"
                  autoComplete="username"
                  maxLength={64}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label>Gender</Label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          ) : null}

          <div className="space-y-1.5">
  <Label
    htmlFor={
      mode === "signin" ? "registered-identifier" : "registered-email"
    }
  >
    {mode === "signin" ? "Email or Username" : "Email"}
  </Label>
  <Input
    id={
      mode === "signin" ? "registered-identifier" : "registered-email"
    }
    name={mode === "signin" ? "identifier" : "email"}
    type={mode === "signin" ? "text" : "email"}
    autoComplete={mode === "signin" ? "username" : "email"}
    maxLength={mode === "signin" ? 254 : undefined}
    required
  />
</div>
 
<div className="space-y-1.5">
  <Label htmlFor="registered-password">Password</Label>
  <Input
    id="registered-password"
    name="password"
    type="password"
    autoComplete={mode === "signin" ? "current-password" : "new-password"}
    minLength={6}
    required
  />
</div>

          {error ? (
            <p role="alert" className="text-xs text-destructive">
              {error}
            </p>
          ) : null}

          {message ? (
            <p className="text-xs text-muted-foreground">
              {message}
            </p>
          ) : null}

          <Button
            type="submit"
            className="w-full"
            disabled={submitting || (mode === "signup" && !gender)}
          >
            {submitting
              ? "Please wait..."
              : mode === "signin"
                ? "Sign In"
                : "Create Account"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function GuestLoginDialog({ open, onOpenChange, onAuthenticated }: { open: boolean; onOpenChange: (open: boolean) => void; onAuthenticated: (nickname: string) => void }) {
  const [gender, setGender] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    const data = new FormData(event.currentTarget);
    data.set("gender", gender);
    try {
      const response = await fetch("/api/chat/guest-login", { method: "POST", body: data });
      const result = (await response.json()) as { authenticated?: boolean; guest?: { nickname?: string }; error?: string };
      if (!response.ok || !result.authenticated || !result.guest?.nickname) {
        setError(result.error ?? "CodyChat could not complete the login.");
        return;
      }
      onAuthenticated(result.guest.nickname);
      onOpenChange(false);
    } catch {
      setError("CodyChat is unavailable. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm border-border bg-card">
        <DialogHeader>
          <DialogTitle>Continue as Guest</DialogTitle>
          <DialogDescription>Enter the details required by CodyChat.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="guest-nickname" className="text-xs font-semibold text-foreground">Nickname</label>
            <Input id="guest-nickname" name="nickname" autoComplete="nickname" maxLength={64} required />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Gender</label>
            <Select value={gender} onValueChange={setGender} required>
              <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Male</SelectItem>
                <SelectItem value="2">Female</SelectItem>
                <SelectItem value="3">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="guest-birth-date" className="text-xs font-semibold text-foreground">Birth date</label>
            <Input id="guest-birth-date" name="birthDate" type="date" required />
          </div>
          {error ? <p role="alert" className="text-xs text-destructive">{error}</p> : null}
          <Button type="submit" className="accent-button w-full" disabled={submitting || !gender}>
            {submitting ? "ConnectingÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦" : "Continue as Guest"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type ProfileTarget = { kind: "self" } | { kind: "member"; member: CodyMember };

function ProfilePanel({
  target,
  guestName,
  registeredUserId,
  resolveProfileByUsername,
  onClose,
  onGuestLogin,
  onMessageMember,
  onMessageProfile,
  selfCodyUserId,
}: {
  target: ProfileTarget;
  guestName: string | undefined;
  registeredUserId?: string | undefined;
  selfCodyUserId?: string | undefined;
  resolveProfileByUsername: ReturnType<typeof useProfilesDirectory>["resolveByUsername"];
  onClose: () => void;
  onGuestLogin: () => void;
  onMessageMember: (member: CodyMember) => void;
  onMessageProfile?: (profile: import("@/lib/profiles/use-profiles-directory").DirectoryProfile) => void;
}) {
  const cody = useCodyChatRelationships();
  const member = target.kind === "member" ? target.member : undefined;
  const supabaseProfile = member?.yaarzoUserId
    ? resolveProfileByUsername(member.name)
    : member
      ? resolveProfileByUsername(member.name)
      : undefined;
  const title = member ? member.name : guestName ?? "My profile";
  const subtitle = member
    ? [member.gender, member.country].filter(Boolean).join(" ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· ") || "Online in this room"
    : guestName
      ? "Guest ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· CodyChat session"
      : "Not signed in";
  const canMessage =
    !!member &&
    !!guestName &&
    (!selfCodyUserId || member.id !== selfCodyUserId);
  return (
    <aside className="premium-panel flex h-full w-[224px] shrink-0 flex-col border-l border-border bg-sidebar">
      <header className="flex h-[68px] items-center justify-between border-b border-border px-3.5">
        <p className="text-[10px] font-bold uppercase text-muted-foreground">{member ? "Member profile" : "My profile"}</p>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close profile" title="Close profile" className="size-8 text-muted-foreground">
          <X />
        </Button>
      </header>
      <div className="profile-glow flex flex-1 flex-col items-center justify-center overflow-y-auto px-4 text-center">
        <div className="profile-ring relative mb-4 flex size-20 items-center justify-center overflow-hidden rounded-full border-2 border-highlight/70 bg-highlight/10 shadow-highlight">
          {member?.avatar ? (
            <img src={member.avatar} alt="" className="size-full object-cover" referrerPolicy="no-referrer" />
          ) : (
            <CircleUser className="size-8 text-highlight" />
          )}
        </div>
        <h2 className="max-w-full truncate text-sm font-extrabold text-foreground">{title}</h2>
        <p className="mt-1 text-[9px] text-muted-foreground">{subtitle}</p>
        {supabaseProfile ? (
          <p className="mt-1 text-[9px] text-muted-foreground">
            @{supabaseProfile.username} Ãƒâ€šÃ‚Â· Level {supabaseProfile.level}
          </p>
        ) : null}
        {canMessage ? (
          <Button
            className="accent-button mt-4 h-8 w-full text-[10px]"
            onClick={() => {
              if (supabaseProfile && onMessageProfile) {
                onMessageProfile(supabaseProfile);
              } else {
                onMessageMember(member!);
              }
              onClose();
            }}
          >
            Message
          </Button>
        ) : null}
        {member && cody.available ? (
          <div className="mt-2 flex w-full flex-col gap-1.5">
            {(() => {
              const relation = cody.getRelationForCodyUser(member.id);
              const ignored = cody.ignoredCodyUserIds.has(member.id);
              if (ignored) {
                return (
                  <Button
                    variant="outline"
                    className="h-8 w-full text-[10px]"
                    onClick={() => void cody.unignoreCodyUser(member.id)}
                  >
                    Unignore
                  </Button>
                );
              }
              return (
                <>
                  {relation === "none" ? (
                    <Button
                      className="accent-button h-8 w-full text-[10px]"
                      onClick={() => void cody.sendToCodyUser(member.id)}
                    >
                      Add friend
                    </Button>
                  ) : null}
                  {relation === "pending_in" ? (
                    <Button
                      className="accent-button h-8 w-full text-[10px]"
                      onClick={() => void cody.acceptCodyUser(member.id)}
                    >
                      Accept friend request
                    </Button>
                  ) : null}
                  {relation === "friends" ? (
                    <Button
                      variant="outline"
                      className="h-8 w-full text-[10px]"
                      onClick={() => void cody.unfriendCodyUser(member.id)}
                    >
                      Unfriend
                    </Button>
                  ) : null}
                  <Button
                    variant="outline"
                    className="h-8 w-full text-[10px]"
                    onClick={() => void cody.ignoreCodyUser(member.id)}
                  >
                    Ignore
                  </Button>
                </>
              );
            })()}
          </div>
        ) : null}
        {member ? null : guestName ? (
          <p className="mt-4 rounded-md border border-dashed border-border px-3 py-2 text-[9px] leading-4 text-muted-foreground">
            Profile editing will be available once registered accounts are connected.
          </p>
        ) : (
          <Button onClick={onGuestLogin} className="accent-button mt-4 h-8 w-full text-[10px]">Continue as guest</Button>
        )}
        <div className="mt-5 grid w-full grid-cols-3 gap-1.5">
          {[
            ["ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â", "Posts"],
            ["ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â", "Friends"],
            [member?.level !== undefined ? String(member.level) : "ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â", "Level"],
          ].map(([value, label]) => (
            <div key={label} className="rounded-md border border-border bg-card py-2 text-center">
              <p className="text-sm font-extrabold text-foreground">{value}</p>
              <p className="text-[9px] text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}

type PanelControls = {
  onToggleNav: () => void;
  onToggleMembers: () => void;
  onOpenMyProfile: () => void;
  onOpenNotifications: () => void;
  onOpenDirectMessages: () => void;
  navOpen: boolean;
  membersOpen: boolean;
  profileOpen: boolean;
  memberCount: number;
  notificationsUnread: number;
  dmUnread: number;
  showNotifications: boolean;
  showDirectMessages: boolean;
};

type CodyRoom = {
  id: number;
  name: string;
  online: number;
  passwordRequired?: boolean;
};

type LiveMessage = CodyPublicMessage;

const CHAT_NEAR_BOTTOM_PX = 140;

const normalizeMessages = normalizePublicChatLogs;

function renderCodySystemLineContent(entry: CodyPublicMessage) {
  const name = entry.systemSubjectName?.trim();
  if (!name) return entry.content;
  const lower = entry.content.toLowerCase();
  const nameLower = name.toLowerCase();
  const index = lower.indexOf(nameLower);
  if (index < 0) return entry.content;
  return (
    <>
      {entry.content.slice(0, index)}
      <span className="font-semibold text-foreground/90">
        {entry.content.slice(index, index + name.length)}
      </span>
      {entry.content.slice(index + name.length)}
    </>
  );
}

type ProfileUsernameLookup = ReturnType<
  typeof useProfilesDirectory
>["resolveByUsername"];

function resolveSupabaseAvatarUrl(
  resolveProfileByUsername: ProfileUsernameLookup,
  username: string | undefined,
): string | undefined {
  if (!username?.trim()) return undefined;
  const url = resolveProfileByUsername(username)?.avatar_url;
  return url?.trim() ? url : undefined;
}

function resolveSystemChatAvatarUrl(
  entry: CodyPublicMessage,
  resolveProfileByUsername: ProfileUsernameLookup,
): string {
  const fromProfile = resolveSupabaseAvatarUrl(
    resolveProfileByUsername,
    entry.systemSubjectName,
  );
  if (fromProfile) return fromProfile;
  if (entry.systemAvatarUrl) return entry.systemAvatarUrl;
  return resolveCodyPublicUrl("default_system.png");
}

function ChatRowAvatar({ src, sizeClass = "size-5" }: { src?: string | undefined; sizeClass?: string }) {
  const [broken, setBroken] = useState(false);
  const showImage = Boolean(src) && !broken;
  if (!showImage) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center rounded-full border border-border bg-secondary text-muted-foreground ${sizeClass}`}
      >
        <Users className="size-3" />
      </div>
    );
  }
  return (
    <img
      src={src}
      alt=""
      referrerPolicy="no-referrer"
      className={`shrink-0 rounded-full border border-border object-cover ${sizeClass}`}
      onError={() => setBroken(true)}
    />
  );
}

function EmptyChat({
  active,
  controls,
  guestName,
  registeredUserId,
  profiles,
  pendingConversation,
  onClearPendingConversation,
  hasCodySession,
  selfCodyUserId,
  onGuestLogin,
  onMembersRefresh,
  onOpenFriendDm,
  onOpenConversation,
  onRoomNavSync,
  onReturnToLiveChatroom,
  resolveProfileByUsername,
  codyDmConversations,
  refreshCodyDmInbox,
}: {
  active: string;
  controls: PanelControls;
  guestName: string | undefined;
  registeredUserId?: string | undefined;
  profiles: Record<string, import("@/lib/profiles/use-profiles-directory").DirectoryProfile>;
  pendingConversation?: DirectConversation | null;
  onClearPendingConversation?: () => void;
  hasCodySession: boolean;
  selfCodyUserId?: string | undefined;
  codyDmConversations: CodyPrivateConversation[];
  refreshCodyDmInbox: () => Promise<void>;
  onGuestLogin: () => void;
  onMembersRefresh: () => void;
  onOpenFriendDm: (peerSupabaseId: string, peerLabel?: string) => void;
  onOpenConversation: (conversation: DirectConversation) => void;
  onRoomNavSync?: (state: {
    rooms: CodyRoom[];
    activeRoomId: number | undefined;
    joinRoom: (room: CodyRoom) => Promise<void>;
  }) => void;
  onReturnToLiveChatroom: () => void;
  resolveProfileByUsername: ProfileUsernameLookup;
}) {
  const isChat = active === "Chatrooms" || active === "Home";
  const isDirectMessages = active === "Direct Messages";
  const isNotifications = active === "Notifications";
  const isFindFriends = active === "Find Friends";
  const [dmActiveConversation, setDmActiveConversation] = useState<DirectConversation | null>(null);
  const [dismissedStripKeys, setDismissedStripKeys] = useState<Set<string>>(() => new Set());
  const [activeMessageActionsId, setActiveMessageActionsId] = useState<string | null>(null);
  const [mediaFlags, setMediaFlags] = useState(mergeMediaConfig(null));
  const media = mergeMediaConfig(mediaFlags);

  useEffect(() => {
    void fetch("/api/media/config")
      .then((r) => r.json())
      .then((json) => setMediaFlags({ youtube: json.youtube, giphy: json.giphy }))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!guestName || !isChat) return;
    void fetch("/api/chat/capabilities", { cache: "no-store" })
      .then((r) => r.json())
      .then((json: CodyChatCapabilities) => setCapabilities(json))
      .catch(() => setCapabilities(null));
  }, [guestName, isChat]);

  const recentDmStripItems = useMemo(
    () => buildRecentDmStripItems(codyDmConversations, profiles),
    [codyDmConversations, profiles],
  );

  const visibleDmStripItems = useMemo(
    () => recentDmStripItems.filter((item) => !dismissedStripKeys.has(item.key)),
    [recentDmStripItems, dismissedStripKeys],
  );

  const restoreStripConversation = useCallback((conversation: DirectConversation) => {
    const key = conversationKey(conversation);
    setDismissedStripKeys((prev) => {
      if (!prev.has(key)) return prev;
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  }, []);

  const selectedDmStripKey = dmActiveConversation
    ? conversationKey(dmActiveConversation)
    : undefined;

  useEffect(() => {
    if (!pendingConversation) return;
    restoreStripConversation(pendingConversation);
    setDmActiveConversation(pendingConversation);
    onClearPendingConversation?.();
  }, [pendingConversation, onClearPendingConversation, restoreStripConversation]);

  const handleStripConversation = (conversation: DirectConversation) => {
    restoreStripConversation(conversation);
    if (isDirectMessages) {
      setDmActiveConversation(conversation);
      return;
    }
    onOpenConversation(conversation);
  };

  const handleCloseStripConversation = useCallback(
    (item: RecentDmStripItem) => {
      setDismissedStripKeys((prev) => {
        if (prev.has(item.key)) return prev;
        const next = new Set(prev);
        next.add(item.key);
        return next;
      });

      const closingActive =
        isDirectMessages &&
        dmActiveConversation &&
        conversationKey(dmActiveConversation) === item.key;

      if (closingActive) {
        setDmActiveConversation(null);
        onReturnToLiveChatroom();
      }
    },
    [isDirectMessages, dmActiveConversation, onReturnToLiveChatroom],
  );

  useEffect(() => {
    if (!activeMessageActionsId) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest(`[data-message-actions="${activeMessageActionsId}"]`)) return;
      setActiveMessageActionsId(null);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [activeMessageActionsId]);

  const iconBtn =
    "size-8 text-muted-foreground data-[on=true]:bg-secondary data-[on=true]:text-primary";

  const [rooms, setRooms] = useState<CodyRoom[]>([]);
  const [roomId, setRoomId] = useState<number>();
  const [passwordRoom, setPasswordRoom] = useState<CodyRoom | null>(null);
  const [roomPassword, setRoomPassword] = useState("");
  const [roomPasswordError, setRoomPasswordError] = useState("");
  const [joiningPasswordRoom, setJoiningPasswordRoom] = useState(false);
  const [messages, setMessages] = useState<LiveMessage[]>([]);
  const [replyTo, setReplyTo] = useState<LiveMessage | null>(null);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [capabilities, setCapabilities] = useState<CodyChatCapabilities | null>(null);
  const [reportTarget, setReportTarget] = useState<{
    postId: string;
    author: string;
  } | null>(null);
  const chatScrollRef = useRef<HTMLElement>(null);
  const lastPublicLogRef = useRef(0);
  const cActionRef = useRef(0);
  const stickToBottomRef = useRef(true);
  const pendingScrollRef = useRef<ScrollBehavior | null>(null);

  const scheduleScrollToBottom = (behavior: ScrollBehavior = "auto") => {
    stickToBottomRef.current = true;
    pendingScrollRef.current = behavior;
  };

  useEffect(() => {
    stickToBottomRef.current = true;
    pendingScrollRef.current = "auto";
  }, [roomId]);

  useEffect(() => {
    const container = chatScrollRef.current;
    if (!container || !isChat) return;

    const onScroll = () => {
      const distance =
        container.scrollHeight -
        container.scrollTop -
        container.clientHeight;
      stickToBottomRef.current = distance <= CHAT_NEAR_BOTTOM_PX;
    };

    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, [isChat, roomId]);

  useLayoutEffect(() => {
    const container = chatScrollRef.current;
    if (!container || !isChat) return;

    if (pendingScrollRef.current) {
      const behavior = pendingScrollRef.current;
      pendingScrollRef.current = null;
      container.scrollTo({ top: container.scrollHeight, behavior });
      return;
    }

    if (stickToBottomRef.current) {
      container.scrollTo({ top: container.scrollHeight, behavior: "auto" });
    }
  }, [messages, isChat, roomId]);

  const loadRooms = useCallback(async () => {
    if (!guestName) return;

    const response = await fetch("/api/chat/rooms", {
      cache: "no-store",
    });

    if (!response.ok) return;

    const result = (await response.json()) as {
      rooms?: CodyRoom[];
    };

    if (Array.isArray(result.rooms)) {
      setRooms(result.rooms);

      if (!roomId && result.rooms[0]) {
        setRoomId(result.rooms[0].id);
      }
    }
  }, [guestName, roomId]);

  const joinRoom = useCallback(
    async (room: CodyRoom, password?: string) => {
      if (room.passwordRequired && password === undefined) {
        setPasswordRoom(room);
        setRoomPassword("");
        setRoomPasswordError("");
        setError("");
        return;
      }

      setError("");
      setRoomPasswordError("");
      if (room.passwordRequired) setJoiningPasswordRoom(true);

      try {
        const response = await fetch("/api/chat/rooms", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            room: room.id,
            ...(password !== undefined ? { password } : {}),
          }),
        });

        const result = (await response.json()) as {
          joined?: boolean;
          code?: number;
          reason?: "wrong_password" | "access_requirement" | "rejected" | "invalid_response";
          data?: {
            room_logs?: unknown;
          };
          error?: string;
        };

        if (!response.ok || !result.joined) {
          const message = result.error ?? "Could not join this room.";
          if (result.reason === "wrong_password" || result.code === 5) {
            setRoomPasswordError(message);
          } else if (result.reason === "access_requirement") {
            setRoomPasswordError(message);
          } else if (room.passwordRequired) {
            setRoomPasswordError(message);
          } else {
            setError(message);
          }
          return;
        }

        setPasswordRoom(null);
        setRoomPassword("");
        setRoomPasswordError("");
        setRoomId(room.id);
        setReplyTo(null);
        lastPublicLogRef.current = 0;
        cActionRef.current = 0;

        const roomData = result.data as
          | {
              room_logs?: unknown;
              room_action?: number;
            }
          | undefined;

        if (typeof roomData?.room_action === "number") {
          cActionRef.current = roomData.room_action;
        }

        let initial = normalizeMessages(roomData?.room_logs);
        if (!initial.length) {
          const bootstrap = await fetch(
            `/api/chat/messages?room=${room.id}&fload=1&last=0&caction=${cActionRef.current}`,
            { cache: "no-store" },
          );
          if (bootstrap.ok) {
            const bootJson = (await bootstrap.json()) as Record<string, unknown>;
            const bootAction = readChatPollRoomAction(bootJson);
            if (typeof bootAction === "number") cActionRef.current = bootAction;
            initial = normalizeMessages(extractChatPollLogs(bootJson));
          }
        }

        setMessages(initial);
        lastPublicLogRef.current = maxNumericPublicLogId(initial);
        onMembersRefresh();
        scheduleScrollToBottom("auto");
      } catch {
        if (room.passwordRequired) {
          setRoomPasswordError("CodyChat is unavailable. Please try again.");
        } else {
          setError("CodyChat is unavailable. Please try again.");
        }
      } finally {
        setJoiningPasswordRoom(false);
      }
    },
    [onMembersRefresh],
  );

  useEffect(() => {
    onRoomNavSync?.({ rooms, activeRoomId: roomId, joinRoom });
  }, [rooms, roomId, joinRoom, onRoomNavSync]);

  const pollMessages = useCallback(async () => {
    if (!guestName || !roomId || !isChat) return;

    try {
      const params = new URLSearchParams({
        room: String(roomId),
        last: String(lastPublicLogRef.current),
        fload: "0",
        caction: String(cActionRef.current),
        priv: "0",
        lastp: "0",
        pcount: "0",
        notify: "0",
        curset: "0",
      });

      const response = await fetch(
        `/api/chat/messages?${params}`,
        {
          cache: "no-store",
        },
      );

      if (!response.ok) return;

      const result = (await response.json()) as Record<string, unknown>;

      const nextAction = readChatPollRoomAction(result);
      if (nextAction !== undefined) {
        cActionRef.current = nextAction;
      }

      const nextLast = readChatPollLastLogId(result);
      if (nextLast !== undefined && nextLast > lastPublicLogRef.current) {
        lastPublicLogRef.current = nextLast;
      }

      const incoming = normalizeMessages(extractChatPollLogs(result));

      if (incoming.length) {
        setMessages((current) => {
          const merged = mergePublicMessageLists(current, incoming);
          lastPublicLogRef.current = Math.max(
            lastPublicLogRef.current,
            maxNumericPublicLogId(incoming),
            maxNumericPublicLogId(merged),
          );
          return merged;
        });
      }
    } catch {
      // Keep existing messages visible during transient polling failures.
    }
  }, [guestName, isChat, roomId]);

  useEffect(() => {
    void loadRooms();
  }, [loadRooms]);

  useEffect(() => {
    if (!guestName || !roomId || !isChat) return;

    const selected = rooms.find(
      (room) => room.id === roomId,
    );

    if (selected) {
      void joinRoom(selected);
    }

    // Initial room join only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [guestName, isChat, rooms.length]);

  useEffect(() => {
    if (!guestName || !roomId || !isChat) return;

    void pollMessages();

    const interval = window.setInterval(
      () => void pollMessages(),
      1000,
    );

    return () => {
      window.clearInterval(interval);
    };
  }, [guestName, isChat, pollMessages, roomId]);

  const sendMessage = async (
    event?: FormEvent<HTMLFormElement>,
    overrideContent?: string,
  ) => {
    event?.preventDefault();

    const content = (overrideContent ?? "").trim();

    if (!content || sending || !guestName || !isChat) return false;

    const replySnapshot = replyTo;
    const quoteId =
      replySnapshot?.id && isCodyLogId(replySnapshot.id)
        ? replySnapshot.id
        : "0";

    setSending(true);
    setError("");

    try {
      const response = await fetch("/api/chat/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          quote: quoteId,
        }),
      });

      const result = (await response.json()) as {
        sent?: boolean;
        log?: unknown;
        error?: string;
      };

      if (!response.ok || !result.sent) {
        setError(
          result.error ?? "Message could not be sent.",
        );
        return false;
      }

      setReplyTo(null);

      let sent = normalizeMessages(result.log);

      if (
        sent[0] &&
        replySnapshot &&
        quoteId !== "0" &&
        !sent[0].quote?.content
      ) {
        sent = [
          {
            ...sent[0],
            quote: {
              id: replySnapshot.id,
              author: replySnapshot.author,
              content: replySnapshot.content,
            },
          },
        ];
      }

      if (sent.length) {
        setMessages((current) => mergePublicMessageLists(current, sent));
      }

      await pollMessages();

      scheduleScrollToBottom("smooth");
      return true;
    } catch {
      setError("CodyChat is unavailable. Please try again.");
      return false;
    } finally {
      setSending(false);
    }
  };

  const uploadChatFile = async (file: File) => {
    if (uploading || !guestName || !isChat) return false;
    setUploading(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const response = await fetch("/api/chat/upload", {
        method: "POST",
        body: form,
      });
      const result = (await response.json()) as {
        uploaded?: boolean;
        log?: unknown;
        error?: string;
      };
      if (!response.ok || !result.uploaded) {
        setError(result.error ?? "Upload failed.");
        return false;
      }
      const sent = normalizeMessages(result.log);
      if (sent.length) {
        setMessages((current) => mergePublicMessageLists(current, sent));
      }
      await pollMessages();
      scheduleScrollToBottom("smooth");
      return true;
    } catch {
      setError("CodyChat is unavailable. Please try again.");
      return false;
    } finally {
      setUploading(false);
    }
  };

  const selectedRoom = rooms.find(
    (room) => room.id === roomId,
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="premium-panel grid h-[60px] shrink-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 border-b border-border bg-card/80 px-2.5 lg:h-[68px] lg:px-3.5">
        <Button
          variant="ghost"
          size="icon"
          onClick={controls.onToggleNav}
          data-on={controls.navOpen}
          aria-label="Toggle navigation"
          title="Toggle navigation"
          className={iconBtn}
        >
          <PanelLeft />
        </Button>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span
              className={`size-2 shrink-0 rounded-full ${
                guestName
                  ? "bg-success shadow-brand"
                  : "bg-muted-foreground"
              }`}
            />

            <h1 className="truncate text-[13px] font-extrabold text-foreground">
              {isChat
                ? selectedRoom?.name ?? "Community Chat"
                : active}
            </h1>
          </div>

          <p className="mt-1 truncate text-[11px] text-muted-foreground lg:text-xs">
            {!isChat
              ? "Yaarzo social space"
              : guestName
                ? selectedRoom
                  ? `${selectedRoom.online} online in room`
                  : "Connected to CodyChat"
                : "Sign in or continue as guest to join"}
          </p>
        </div>

        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Search conversation"
            title="Search conversation"
            className="hidden size-8 text-muted-foreground md:inline-flex"
          >
            <Search />
          </Button>

          {controls.showNotifications ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={controls.onOpenNotifications}
              aria-label="Notifications"
              title="Notifications"
              className={`relative ${iconBtn}`}
            >
              <Bell />
              {controls.notificationsUnread > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-alert px-1 text-[8px] font-bold leading-4 text-alert-foreground">
                  {controls.notificationsUnread}
                </span>
              ) : null}
            </Button>
          ) : null}

          {controls.showDirectMessages ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={controls.onOpenDirectMessages}
              aria-label="Direct messages"
              title="Direct messages"
              className={`relative ${iconBtn}`}
            >
              <Send />
              {controls.dmUnread > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-alert px-1 text-[8px] font-bold leading-4 text-alert-foreground">
                  {controls.dmUnread}
                </span>
              ) : null}
            </Button>
          ) : null}

          <Button
            variant="ghost"
            size="icon"
            onClick={controls.onToggleMembers}
            data-on={controls.membersOpen}
            aria-label="Members"
            title="Members"
            className={iconBtn}
          >
            <Users />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={controls.onOpenMyProfile}
            data-on={controls.profileOpen}
            aria-label="My profile"
            title="My profile"
            className={iconBtn}
          >
            <CircleUser />
          </Button>
        </div>
      </header>

      {(isChat || isDirectMessages) && hasCodySession ? (
        <ConversationNavStrip
          currentRoomName={selectedRoom?.name ?? (roomId != null ? "Community Chat" : undefined)}
          roomActive={isChat}
          onSelectCurrentRoom={onReturnToLiveChatroom}
          items={visibleDmStripItems}
          selectedDmKey={isDirectMessages ? selectedDmStripKey : undefined}
          onOpenConversation={handleStripConversation}
          onCloseConversation={handleCloseStripConversation}
        />
      ) : null}

      <main
        ref={isChat ? chatScrollRef : undefined}
        className={`chat-canvas flex min-h-0 flex-1 ${
          isDirectMessages ? "flex-col overflow-hidden p-0" : "overflow-y-auto px-3 py-5 sm:px-6"
        }`}
      >
        {isDirectMessages ? (
          <DirectMessagesWorkspace
            registeredUserId={registeredUserId}
            guestName={guestName}
            hasCodySession={hasCodySession}
            profiles={profiles}
            activeConversation={dmActiveConversation}
            onPmSent={refreshCodyDmInbox}
          />
        ) : isNotifications && registeredUserId ? (
          <NotificationsPanel profiles={profiles} />
        ) : isFindFriends && registeredUserId ? (
          <FindFriendsPanel
            profiles={profiles}
            meId={registeredUserId}
            onMessage={(peerId, label) => onOpenFriendDm(peerId, label)}
          />
        ) : !isChat ? (
          <div className="m-auto max-w-xs text-center">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-xl border border-primary/45 bg-primary/10 text-primary shadow-brand">
              <HeartHandshake className="size-6" />
            </div>

            <h2 className="text-base font-extrabold text-foreground">
              {registeredUserId ? `Sign in to use ${active}` : `${active} is coming to Yaarzo`}
            </h2>
          </div>
        ) : !guestName ? (
          <div className="empty-state m-auto max-w-xs text-center">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-xl border border-primary/45 bg-primary/10 text-primary shadow-brand">
              <MessageCircle className="size-6" />
            </div>

            <h2 className="text-base font-extrabold text-foreground">
              Join the live conversation
            </h2>

            <p className="mt-2 text-[11px] leading-5 text-muted-foreground">
              Sign in with your Yaarzo account or use CodyChat guest
              access to join public rooms.
            </p>

            <Button
              className="mt-4"
              onClick={onGuestLogin}
            >
              Continue as Guest
            </Button>
          </div>
        ) : messages.length ? (
          <div className="yaarzo-chat-rail w-full space-y-3">
            {messages.map((entry) => {
              if (entry.system) {
                return (
                  <div
                    key={entry.id}
                    id={isCodyLogId(entry.id) ? `chat-msg-${entry.id}` : undefined}
                    className="flex scroll-mt-4 justify-start px-1 py-0.5"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <ChatRowAvatar
                        src={resolveSystemChatAvatarUrl(entry, resolveProfileByUsername)}
                      />
                      <p className="text-[11px] leading-snug text-muted-foreground">
                        {renderCodySystemLineContent(entry)}
                      </p>
                    </div>
                  </div>
                );
              }

              const isOwnMessage =
                (selfCodyUserId &&
                  entry.authorUserId &&
                  entry.authorUserId === selfCodyUserId) ||
                (!!guestName &&
                  entry.author.trim().toLowerCase() ===
                    guestName.trim().toLowerCase());
              const canReportMessage =
                !isOwnMessage &&
                isCodyLogId(entry.id) &&
                (capabilities?.canReport ?? true);

              const messageSelected = activeMessageActionsId === entry.id;

              const messageAvatarUrl = resolveSupabaseAvatarUrl(
                resolveProfileByUsername,
                entry.author,
              );

              return (
                <div
                  key={entry.id}
                  id={isCodyLogId(entry.id) ? `chat-msg-${entry.id}` : undefined}
                  className={`flex scroll-mt-4 gap-2 ${
                    isOwnMessage ? "justify-end" : "justify-start"
                  }`}
                >
                  {!isOwnMessage ? (
                    <ChatRowAvatar src={messageAvatarUrl} sizeClass="size-6" />
                  ) : null}
                  <div
                    data-message-actions={entry.id}
                    role="button"
                    tabIndex={0}
                    onClick={(event) => {
                      const target = event.target as HTMLElement;
                      if (target.closest("a")) return;
                      setActiveMessageActionsId((current) =>
                        current === entry.id ? null : entry.id,
                      );
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        setActiveMessageActionsId((current) =>
                          current === entry.id ? null : entry.id,
                        );
                      }
                    }}
                    className={`group relative max-w-[84%] cursor-pointer rounded-xl border px-3 py-2.5 shadow-sm transition sm:max-w-[70%] ${
                      messageSelected
                        ? "border-primary/60 bg-card ring-2 ring-primary/35"
                        : "border-border bg-card"
                    } ${isOwnMessage ? "text-right" : "text-left"}`}
                  >
                    <div
                      className={`mb-1 flex items-center gap-2 ${
                        isOwnMessage ? "justify-end" : "justify-start"
                      }`}
                    >
                      <p className="text-[10px] font-extrabold text-primary">
                        {entry.author}
                      </p>
                    </div>

                    {messageSelected ? (
                      <div
                        className={`mb-2 flex flex-wrap gap-1 ${
                          isOwnMessage ? "justify-end" : "justify-start"
                        }`}
                      >
                        <Button
                          type="button"
                          size="sm"
                          variant="secondary"
                          className="h-7 gap-1 text-[10px]"
                          onClick={(event) => {
                            event.stopPropagation();
                            setReplyTo(entry);
                            setActiveMessageActionsId(null);
                          }}
                        >
                          <CornerDownRight className="size-3" />
                          Reply
                        </Button>
                        {canReportMessage ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 gap-1 text-[10px] text-destructive"
                            onClick={(event) => {
                              event.stopPropagation();
                              setReportTarget({
                                postId: entry.id,
                                author: entry.author,
                              });
                              setActiveMessageActionsId(null);
                            }}
                          >
                            <Flag className="size-3" />
                            Report
                          </Button>
                        ) : null}
                      </div>
                    ) : null}

                    {entry.quote &&
                    (entry.quote.author || entry.quote.content) ? (
                      <PublicChatQuotedReply
                        quote={entry.quote}
                        alignEnd={isOwnMessage}
                      />
                    ) : null}

                    <MessageMediaContent
                      text={entry.content}
                      parts={entry.parts}
                      media={media}
                    />
                  </div>
                  {isOwnMessage ? (
                    <ChatRowAvatar src={messageAvatarUrl} sizeClass="size-6" />
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="m-auto text-center text-[11px] text-muted-foreground">
            Connected. Waiting for live messagesÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦
          </div>
        )}
      </main>

      {error ? (
        <p
          role="alert"
          className="border-t border-border px-4 py-2 text-xs text-destructive"
        >
          {error}
        </p>
      ) : null}

      {isChat ? (
        <footer className="premium-panel shrink-0 border-t border-border bg-card/90 p-2.5">
          <ChatComposer
            disabled={!guestName && !registeredUserId}
            sending={sending}
            uploading={uploading}
            canUpload={capabilities?.canUploadChat ?? false}
            media={{
              youtube: { enabled: media.youtube.enabled },
              giphy: { enabled: media.giphy.enabled },
            }}
            replyPreview={
              replyTo
                ? {
                    author: replyTo.author,
                    excerpt: quoteExcerpt(replyTo.content, 160),
                    onClear: () => setReplyTo(null),
                  }
                : undefined
            }
            placeholder={
              guestName ? "Write a messageÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦" : "Sign in or continue as guest to send"
            }
            onSend={(content) => sendMessage(undefined, content)}
            onUploadFile={uploadChatFile}
          />
        </footer>
      ) : null}

      <Dialog
        open={passwordRoom !== null}
        onOpenChange={(open) => {
          if (!open && !joiningPasswordRoom) {
            setPasswordRoom(null);
            setRoomPassword("");
            setRoomPasswordError("");
          }
        }}
      >
        <DialogContent className="max-w-sm border-border bg-card">
          <DialogHeader>
            <DialogTitle>Password-protected room</DialogTitle>
            <DialogDescription>
              Enter the password to join #{passwordRoom?.name ?? "this room"}.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (passwordRoom) void joinRoom(passwordRoom, roomPassword);
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="cody-room-password">Room password</Label>
              <Input
                id="cody-room-password"
                type="password"
                autoComplete="current-password"
                maxLength={128}
                required
                value={roomPassword}
                onChange={(event) => setRoomPassword(event.target.value)}
                disabled={joiningPasswordRoom}
              />
              {roomPasswordError ? (
                <p role="alert" className="text-xs text-destructive">
                  {roomPasswordError}
                </p>
              ) : null}
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setPasswordRoom(null)}
                disabled={joiningPasswordRoom}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={joiningPasswordRoom || !roomPassword}>
                {joiningPasswordRoom ? "Joining…" : "Join room"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <ChatReportDialog
        open={!!reportTarget}
        onOpenChange={(open) => {
          if (!open) setReportTarget(null);
        }}
        postId={reportTarget?.postId ?? ""}
        authorName={reportTarget?.author ?? ""}
      />
    </div>
  );
}
export function YaarzoChat() {
  const { session, user, ready } = useAuth();
  const notifications = useNotifications();
  const directory = useProfilesDirectory(true);
  const [serverProfiles, setServerProfiles] = useState<Record<string, import("@/lib/profiles/use-profiles-directory").DirectoryProfile>>({});
  const memberProfiles = { ...directory.profiles, ...serverProfiles };
  const [pendingConversation, setPendingConversation] = useState<DirectConversation | null>(null);
  const [selfCodyUserId, setSelfCodyUserId] = useState<string>();
  const [active, setActive] = useState("Chatrooms");
  const [leftOpen, setLeftOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [navDesktop, setNavDesktop] = useState(true);
  const [membersDesktop, setMembersDesktop] = useState(true);
  const [profile, setProfile] = useState<ProfileTarget | null>(null);
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const desktopQuery = window.matchMedia("(min-width: 768px)");
    const sync = () => {
      setIsDesktop(desktopQuery.matches);
      if (!desktopQuery.matches) {
        setLeftOpen(false);
        setMembersOpen(false);
      }
    };
    sync();
    desktopQuery.addEventListener("change", sync);
    return () => {
      desktopQuery.removeEventListener("change", sync);
    };
  }, []);
  const [guestName, setGuestName] = useState<string>();
  const [guestDialogOpen, setGuestDialogOpen] = useState(false);
  const [registeredDialogOpen, setRegisteredDialogOpen] = useState(false);
  const [members, setMembers] = useState<CodyMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [theme, setTheme] = useState<YaarzoTheme>("glass");
  const hasCodySession = !!guestName;
  const {
    conversations: codyDmConversations,
    totalUnread: codyDmUnread,
    refreshInbox: refreshCodyDmInbox,
  } = useCodyDmInbox(hasCodySession);
  const {
    appearancePreference,
    resolvedAppearance,
    setAppearancePreference,
  } = useChatroomAppearance(theme);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("yaarzo-theme");
    if (savedTheme === "glass" || savedTheme === "cyber" || savedTheme === "neon" || savedTheme === "black") {
      setTheme(savedTheme);
    }
  }, []);

  const changeTheme = (nextTheme: YaarzoTheme) => {
    setTheme(nextTheme);
    window.localStorage.setItem("yaarzo-theme", nextTheme);
  };

  const loadRegisteredDirectory = useCallback(async () => {
    try {
      const response = await fetch("/api/chat/registered-members", { cache: "no-store" });
      if (!response.ok) return;
      const result = (await response.json()) as {
        profiles?: import("@/lib/profiles/use-profiles-directory").DirectoryProfile[];
      };
      if (Array.isArray(result.profiles)) {
        setServerProfiles(
          Object.fromEntries(result.profiles.map((profile) => [profile.id, profile])),
        );
      }
    } catch {
      /* directory is optional fallback via client Supabase */
    }
  }, []);

  const loadMembers = useCallback(async () => {
    if (!guestName) {
      setMembers([]);
      return;
    }
    setMembersLoading(true);
    try {
      const response = await fetch("/api/chat/members", { cache: "no-store" });
      if (response.status === 401) {
        setGuestName(undefined);
        setMembers([]);
        return;
      }
      const result = (await response.json()) as {
        members?: CodyMember[];
        self?: { codyUserId?: string };
      };
      if (response.ok && Array.isArray(result.members)) {
        setMembers(result.members);
        rememberCodyMembersFromRoster(result.members);
      }
      if (response.ok && result.self?.codyUserId) setSelfCodyUserId(result.self.codyUserId);
    } finally {
      setMembersLoading(false);
    }
  }, [guestName]);

  useEffect(() => {
    void loadRegisteredDirectory();
    const interval = window.setInterval(() => void loadRegisteredDirectory(), 60_000);
    return () => window.clearInterval(interval);
  }, [loadRegisteredDirectory]);

  useEffect(() => {
    let activeRequest = true;
    void fetch("/api/chat/session", { cache: "no-store" })
      .then((response) => response.json())
      .then((result: {
        authenticated?: boolean;
        guest?: { nickname?: string };
        cody?: { userId?: string; nickname?: string };
      }) => {
        if (!activeRequest || !result.authenticated) return;
        const nick = result.guest?.nickname ?? result.cody?.nickname;
        if (nick) setGuestName(nick);
        if (result.cody?.userId) setSelfCodyUserId(result.cody.userId);
      })
      .catch(() => undefined);
    return () => { activeRequest = false; };
  }, []);

  // Registered Supabase users get their CodyChat session through the Yaarzo Bridge.
  useEffect(() => {
    if (!ready || !user || !session?.access_token) return;

    let activeRequest = true;

    void fetch("/api/chat/registered-login", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    })
      .then(async (response) => {
        const result = (await response.json()) as {
          authenticated?: boolean;
          registered?: { nickname?: string };
        };

        if (
          activeRequest &&
          response.ok &&
          result.authenticated &&
          result.registered?.nickname
        ) {
          setGuestName(result.registered.nickname);
        }
      })
      .catch(() => undefined);

    return () => {
      activeRequest = false;
    };
  }, [ready, session?.access_token, user?.id]);
  useEffect(() => {
    if (!guestName) return;
    void loadMembers();
    const interval = window.setInterval(() => void loadMembers(), 30000);
    return () => window.clearInterval(interval);
  }, [guestName, loadMembers]);

  const logout = async () => {
    await fetch("/api/chat/logout", { method: "POST" }).catch(() => undefined);

    if (user) {
      await supabase.auth.signOut().catch(() => undefined);
    }

    setGuestName(undefined);
    setMembers([]);
    setProfile(null);
  };

  const closeDrawers = () => {
    setLeftOpen(false);
    setMembersOpen(false);
    setProfile(null);
  };

  const selectNavigation = (label: string) => {
    setActive(label);
    if (!isDesktop) setLeftOpen(false);
  };

  const [chatRoomNav, setChatRoomNav] = useState<{
    rooms: CodyRoom[];
    activeRoomId: number | undefined;
    joinRoom: (room: CodyRoom) => Promise<void>;
  }>({
    rooms: [],
    activeRoomId: undefined,
    joinRoom: async () => {},
  });

  const openConversation = (conversation: DirectConversation) => {
    setPendingConversation(conversation);
    setActive("Direct Messages");
    if (!isDesktop) {
      setLeftOpen(false);
      setMembersOpen(false);
      setProfile(null);
    }
  };

  const openDmFromMember = (member: CodyMember) => {
    const route = resolveDmRoute({ supabaseUserId: user?.id }, member);
    if (!route) return;
    openConversation(route);
  };

  const openCodyDmFromProfile = async (
    profile: import("@/lib/profiles/use-profiles-directory").DirectoryProfile,
  ) => {
    const rosterMember = await resolveCodyMemberForDm(profile, members);
    if (!rosterMember) return;
    const route = resolveDmRoute({ supabaseUserId: user?.id }, rosterMember);
    if (route) openConversation(route);
  };

  const openCodyDmFromFriend = (peerSupabaseId: string, _peerLabel?: string) => {
    const profile = memberProfiles[peerSupabaseId];
    if (!profile) return;
    void openCodyDmFromProfile(profile);
  };

  const totalDmUnread = codyDmUnread;

  const toggleNav = () => {
    if (isDesktop) return setNavDesktop((v) => !v);
    const next = !leftOpen;
    closeDrawers();
    setLeftOpen(next);
  };
  const toggleMembers = () => {
    if (isDesktop) {
      setMembersDesktop((open) => {
        if (!open) setProfile(null);
        return !open;
      });
      return;
    }
    const next = !membersOpen;
    closeDrawers();
    setMembersOpen(next);
  };
  const openProfile = (target: ProfileTarget) => {
    if (!isDesktop) {
      setLeftOpen(false);
      setMembersOpen(false);
    }
    setProfile(target);
  };
  const toggleMyProfile = () => {
    if (profile?.kind === "self") return setProfile(null);
    openProfile({ kind: "self" });
  };

  // Desktop right column shows either members or profile, never both.
  const showNavInline = isDesktop && navDesktop;
  const showMembersInline = isDesktop && membersDesktop && !profile;
  const showProfileInline = isDesktop && !!profile;
  const drawerOpen = !isDesktop && (leftOpen || membersOpen || !!profile);

  const shellLeftCol = showNavInline ? "var(--yaarzo-nav-width)" : "0px";
  const shellRightCol = showMembersInline
    ? "var(--yaarzo-members-width)"
    : showProfileInline
      ? "var(--yaarzo-profile-width)"
      : "0px";

  useEffect(() => {
    if (!drawerOpen && !(isDesktop && profile)) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (isDesktop) setProfile(null);
        else closeDrawers();
      }
    };
    window.addEventListener("keydown", onKey);
    if (drawerOpen) document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [drawerOpen, isDesktop, profile]);

  const controls: PanelControls = {
    onToggleNav: toggleNav,
    onToggleMembers: toggleMembers,
    onOpenMyProfile: toggleMyProfile,
    onOpenNotifications: () => selectNavigation("Notifications"),
    onOpenDirectMessages: () => selectNavigation("Direct Messages"),
    navOpen: isDesktop ? navDesktop : leftOpen,
    membersOpen: isDesktop ? showMembersInline : membersOpen,
    profileOpen: profile?.kind === "self",
    memberCount: members.length,
    notificationsUnread: user ? notifications.unread : 0,
    dmUnread: totalDmUnread,
    showNotifications: !!user,
    showDirectMessages: hasCodySession || !!user,
  };

  const sidebarProps = {
    active,
    onSelect: selectNavigation,
    chatrooms: {
      rooms: chatRoomNav.rooms,
      activeRoomId: chatRoomNav.activeRoomId,
      onJoinRoom: (room: CodyRoom) => void chatRoomNav.joinRoom(room),
      canLoad: hasCodySession,
    },
    guestName,
    registered: !!user,
    registeredLabel: user?.email ?? "Yaarzo Member",
    onRegisteredAuth: () => setRegisteredDialogOpen(true),
    onGuestLogin: () => setGuestDialogOpen(true),
    onLogout: logout,
    theme,
    onThemeChange: changeTheme,
    appearancePreference,
    resolvedAppearance,
    onAppearancePreferenceChange: setAppearancePreference,
  };

  return (
    <CodyChatRelationshipsProvider chatSessionActive={hasCodySession} yaarzoUserId={user?.id}>
    <div className={`${resolvedAppearance} theme-${theme} h-dvh overflow-hidden bg-background text-foreground transition-colors duration-200`}>
      <div
        className={`yaarzo-app-shell h-full min-h-0 overflow-hidden ${
          isDesktop ? "grid" : "flex"
        }`}
        style={
          isDesktop
            ? {
                gridTemplateColumns: `${shellLeftCol} minmax(0, 1fr) ${shellRightCol}`,
              }
            : undefined
        }
      >
        {isDesktop ? (
          <div className="col-start-1 row-start-1 min-h-0 min-w-0 overflow-hidden">
            {showNavInline ? (
              <LeftSidebar {...sidebarProps} presentation="inline" />
            ) : null}
          </div>
        ) : null}

        <section
          className={`flex min-w-0 flex-col bg-background ${
            isDesktop ? "col-start-2 row-start-1 min-h-0" : "min-h-0 flex-1"
          }`}
        >
          <EmptyChat
            active={active}
            controls={controls}
            guestName={guestName}
            registeredUserId={user?.id}
            profiles={memberProfiles}
            pendingConversation={pendingConversation}
            onClearPendingConversation={() => setPendingConversation(null)}
            hasCodySession={hasCodySession}
            selfCodyUserId={selfCodyUserId}
            onGuestLogin={() => setGuestDialogOpen(true)}
            onMembersRefresh={() => {
              void loadMembers();
              void loadRegisteredDirectory();
            }}
            codyDmConversations={codyDmConversations}
            refreshCodyDmInbox={refreshCodyDmInbox}
            onOpenFriendDm={openCodyDmFromFriend}
            onOpenConversation={openConversation}
            onRoomNavSync={setChatRoomNav}
            onReturnToLiveChatroom={() => setActive("Chatrooms")}
            resolveProfileByUsername={directory.resolveByUsername}
          />
        </section>

        {isDesktop ? (
          <div className="col-start-3 row-start-1 min-h-0 min-w-0 overflow-hidden">
            {showMembersInline ? (
              <MembersPanel
                members={members}
                loading={membersLoading}
                profiles={memberProfiles}
                viewerSupabaseId={user?.id}
                selfCodyUserId={selfCodyUserId}
                onClose={() => setMembersDesktop(false)}
                onSelectMember={(member) => openProfile({ kind: "member", member })}
                onSelectRegisteredProfile={(profile) =>
                  openProfile({ kind: "member", member: directoryProfileToCodyMember(profile) })
                }
                onMessageMember={openDmFromMember}
                onMessageProfile={(profile) => void openCodyDmFromProfile(profile)}
              />
            ) : showProfileInline && profile ? (
              <ProfilePanel
                target={profile}
                guestName={guestName}
                registeredUserId={user?.id}
                resolveProfileByUsername={directory.resolveByUsername}
                onClose={() => setProfile(null)}
                onGuestLogin={() => setGuestDialogOpen(true)}
                onMessageMember={openDmFromMember}
                onMessageProfile={(profile) => void openCodyDmFromProfile(profile)}
                selfCodyUserId={selfCodyUserId}
              />
            ) : null}
          </div>
        ) : null}
      </div>

      {drawerOpen ? (
        <div className={`fixed inset-0 z-50 flex ${leftOpen ? "justify-start" : "justify-end"}`}>
          <div className="drawer-backdrop absolute inset-0 bg-overlay" onClick={closeDrawers} aria-hidden="true" />
          <div className={`relative h-full max-w-[88vw] shadow-2xl ${leftOpen ? "drawer-left" : "drawer-right"}`} role="dialog" aria-modal="true">
            {leftOpen ? (
              <LeftSidebar {...sidebarProps} presentation="drawer" onClose={closeDrawers} />
            ) : membersOpen ? (
              <MembersPanel
                members={members}
                loading={membersLoading}
                profiles={memberProfiles}
                viewerSupabaseId={user?.id}
                selfCodyUserId={selfCodyUserId}
                onClose={closeDrawers}
                onSelectMember={(member) => openProfile({ kind: "member", member })}
                onSelectRegisteredProfile={(profile) =>
                  openProfile({ kind: "member", member: directoryProfileToCodyMember(profile) })
                }
                onMessageMember={openDmFromMember}
                onMessageProfile={(profile) => void openCodyDmFromProfile(profile)}
              />
            ) : profile ? (
              <ProfilePanel
                target={profile}
                guestName={guestName}
                registeredUserId={user?.id}
                resolveProfileByUsername={directory.resolveByUsername}
                onClose={closeDrawers}
                onGuestLogin={() => setGuestDialogOpen(true)}
                onMessageMember={openDmFromMember}
                onMessageProfile={(profile) => void openCodyDmFromProfile(profile)}
                selfCodyUserId={selfCodyUserId}
              />
            ) : null}
          </div>
        </div>
      ) : null}
      <RegisteredAuthDialog open={registeredDialogOpen} onOpenChange={setRegisteredDialogOpen} />
      <GuestLoginDialog open={guestDialogOpen} onOpenChange={setGuestDialogOpen} onAuthenticated={setGuestName} />
    </div>
    </CodyChatRelationshipsProvider>
  );
}
