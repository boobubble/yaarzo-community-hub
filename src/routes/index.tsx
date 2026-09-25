import { createFileRoute } from "@tanstack/react-router";
import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import {
  Bell,
  Compass,
  Crown,
  Flame,
  HeartHandshake,
  Home,
  Image,
  CircleUser,
  PanelLeft,
  MessageCircle,
  Moon,
  MoreHorizontal,
  Palette,
  Paperclip,
  PenLine,
  Radio,
  Search,
  Send,
  ShieldCheck,
  Sun,
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
import type { CodyMember } from "@/lib/codychat-adapter";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/auth-context";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Yaarzo â€” Community Chat" },
      {
        name: "description",
        content: "Yaarzo community chat, rooms, conversations and social spaces.",
      },
      { property: "og:title", content: "Yaarzo â€” Community Chat" },
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
  tone?: "violet" | "pink" | "cyan" | "amber" | "green";
};

type YaarzoTheme = "glass" | "cyber" | "neon" | "black";
type Appearance = "light" | "dark";

const themeLabels: Record<YaarzoTheme, string> = {
  glass: "Premium Glass",
  cyber: "Cyberpunk",
  neon: "Neon Glass",
  black: "Black",
};

function AppearanceToggle({ value, onChange }: { value: Appearance; onChange: (appearance: Appearance) => void }) {
  const next = value === "dark" ? "light" : "dark";
  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={() => onChange(next)}
      className="appearance-toggle size-8 shrink-0 border-border bg-secondary/70"
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
    >
      {value === "dark" ? <Sun className="text-amber" /> : <Moon className="text-primary" />}
    </Button>
  );
}

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

const personalNavigation: NavItem[] = [
  { label: "Friend Requests", icon: Users, tone: "cyan" },
  { label: "Notifications", icon: Bell, tone: "pink" },
  { label: "Direct Messages", icon: Send, tone: "violet" },
];

function Brand() {
  return (
    <div className="flex h-[68px] items-center gap-2.5 border-b border-sidebar-border px-3.5">
      <div className="brand-mark flex size-9 items-center justify-center rounded-lg text-highlight-foreground">
        <HeartHandshake className="size-[18px]" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <div className="font-display text-[19px] font-extrabold italic leading-none text-foreground">Yaarzo</div>
        <div className="mt-1 truncate text-[8px] font-bold uppercase text-muted-foreground">Chat Â· Connect Â· Belong</div>
      </div>
      <MoreHorizontal className="ml-auto size-4 text-muted-foreground" aria-hidden="true" />
    </div>
  );
}

function Navigation({ active, onSelect }: { active: string; onSelect: (label: string) => void }) {
  const renderItem = ({ label, icon: Icon, badge, tone = "violet" }: NavItem) => {
    const selected = active === label;
    return (
      <Button
        key={label}
        variant="ghost"
        onClick={() => onSelect(label)}
        className={`nav-row h-8 w-full justify-start gap-2.5 rounded-md px-2.5 text-[11px] font-semibold ${selected ? "active-glow bg-sidebar-accent text-sidebar-primary" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"}`}
      >
        <Icon className={`nav-icon nav-icon-${tone} size-4 ${selected ? "is-selected" : ""}`} aria-hidden="true" />
        <span className="truncate">{label}</span>
        {badge ? <span className="ml-auto rounded-full bg-alert px-2 py-0.5 text-[10px] text-alert-foreground shadow-alert">{badge}</span> : null}
      </Button>
    );
  };

  return (
    <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto px-2.5 py-2.5 scrollbar-none" aria-label="Yaarzo navigation">
      <div className="space-y-0.5">{primaryNavigation.slice(0, 4).map(renderItem)}</div>
      <p className="mb-1 mt-2.5 px-2.5 text-[8px] font-extrabold uppercase text-muted-foreground">Community</p>
      <div className="space-y-0.5">{primaryNavigation.slice(4).map(renderItem)}</div>
      <p className="mb-1 mt-2.5 px-2.5 text-[8px] font-extrabold uppercase text-muted-foreground">Social</p>
      <div className="space-y-0.5">{personalNavigation.map(renderItem)}</div>
    </nav>
  );
}

function LeftSidebar({
  active,
  onSelect,
  guestName,
  registered,
  registeredLabel,
  onRegisteredAuth,
  onGuestLogin,
  onLogout,
  mobile,
  onClose,
  theme,
  onThemeChange,
  appearance,
  onAppearanceChange,
}: {
  active: string;
  onSelect: (label: string) => void;
  guestName: string | undefined;
  registered: boolean;
  registeredLabel: string;
  onRegisteredAuth: () => void;
  onGuestLogin: () => void;
  onLogout: () => void;
  mobile?: boolean;
  onClose?: () => void;
  theme: YaarzoTheme;
  onThemeChange: (theme: YaarzoTheme) => void;
  appearance: Appearance;
  onAppearanceChange: (appearance: Appearance) => void;
}) {
  return (
    <aside className={`${mobile ? "flex" : "hidden lg:flex"} premium-panel h-full w-[208px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar`}>
      <div className="relative">
        <Brand />
        {mobile ? (
          <Button variant="ghost" size="icon" onClick={onClose} className="absolute right-3 top-3 text-muted-foreground" aria-label="Close menu">
            <X />
          </Button>
        ) : null}
      </div>
      <div className="px-2.5 pt-2.5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <Input aria-label="Search Yaarzo" placeholder="Search rooms, users, postsâ€¦" className="h-8 border-sidebar-border bg-background/55 pl-8 text-[10px]" />
        </div>
      </div>
      <Navigation active={active} onSelect={onSelect} />
      <div className="space-y-2 border-t border-sidebar-border p-2.5">
        <div className="flex items-center gap-1.5">
          <ThemePicker value={theme} onChange={onThemeChange} />
          <AppearanceToggle value={appearance} onChange={onAppearanceChange} />
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

function MembersPanel({ members, loading, onClose, onSelectMember }: { members: CodyMember[]; loading: boolean; onClose: () => void; onSelectMember: (member: CodyMember) => void }) {
  return (
    <aside className="premium-panel flex h-full w-[202px] shrink-0 flex-col border-l border-border bg-card">
      <header className="flex h-[68px] items-center justify-between border-b border-border px-3.5">
        <div>
          <h2 className="text-[13px] font-extrabold text-foreground">Members</h2>
          <p className="mt-0.5 text-[9px] text-muted-foreground">{members.length ? `${members.length} online` : "Room roster"}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close members" title="Close members" className="text-muted-foreground">
          <X />
        </Button>
      </header>
      <div className="border-b border-border p-2.5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3 -translate-y-1/2 text-muted-foreground" />
          <Input disabled aria-label="Search room members" placeholder="Search membersâ€¦" className="h-8 bg-background/45 pl-7 text-[9px]" />
        </div>
      </div>
      {members.length ? (
        <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto p-2 scrollbar-none">
          {members.map((member) => (
            <button
              type="button"
              key={member.id}
              onClick={() => onSelectMember(member)}
              aria-label={`Open ${member.name}'s profile`}
              className="member-row group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <div className="relative size-8 shrink-0">
                {member.avatar ? (
                  <img src={member.avatar} alt="" className="size-8 rounded-full border border-border object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="flex size-8 items-center justify-center rounded-full border border-border bg-secondary text-muted-foreground"><Users className="size-3.5" /></div>
                )}
                <span className="absolute bottom-0 right-0 size-2.5 rounded-full border-2 border-card bg-success shadow-brand" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[10px] font-bold text-foreground">{member.name}</p>
                <p className="truncate text-[8px] text-muted-foreground">
                  {[member.gender, member.level !== undefined ? `Level ${member.level}` : undefined].filter(Boolean).join(" Â· ") || "Online"}
                </p>
              </div>
              <CircleUser className="size-3.5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" aria-hidden="true" />
            </button>
          ))}
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center px-7 text-center">
          <div className="mb-4 flex size-14 items-center justify-center rounded-full border border-border bg-secondary text-muted-foreground">
            <Users className="size-6" />
          </div>
          <h3 className="text-sm font-bold text-foreground">{loading ? "Loading room members" : "Continue as Guest"}</h3>
          <p className="mt-2 text-xs leading-5 text-muted-foreground">
            {loading ? "Checking CodyChatâ€™s live member list." : "Sign in to view CodyChatâ€™s real online users."}
          </p>
        </div>
      )}
      <div className="border-t border-border p-3">
        <p className="text-[8px] font-bold uppercase text-muted-foreground">Profile preview</p>
        <div className="mt-2 rounded-md border border-dashed border-border px-3 py-3 text-center text-[9px] leading-4 text-muted-foreground">
          Tap a member to open their profile.
        </div>
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
            {submitting ? "Connectingâ€¦" : "Continue as Guest"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

type ProfileTarget = { kind: "self" } | { kind: "member"; member: CodyMember };

function ProfilePanel({ target, guestName, onClose, onGuestLogin }: { target: ProfileTarget; guestName: string | undefined; onClose: () => void; onGuestLogin: () => void }) {
  const member = target.kind === "member" ? target.member : undefined;
  const title = member ? member.name : guestName ?? "My profile";
  const subtitle = member
    ? [member.gender, member.country].filter(Boolean).join(" Â· ") || "Online in this room"
    : guestName
      ? "Guest Â· CodyChat session"
      : "Not signed in";
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
        {member ? null : guestName ? (
          <p className="mt-4 rounded-md border border-dashed border-border px-3 py-2 text-[9px] leading-4 text-muted-foreground">
            Profile editing will be available once registered accounts are connected.
          </p>
        ) : (
          <Button onClick={onGuestLogin} className="accent-button mt-4 h-8 w-full text-[10px]">Continue as guest</Button>
        )}
        <div className="mt-5 grid w-full grid-cols-3 gap-1.5">
          {[
            ["â€”", "Posts"],
            ["â€”", "Friends"],
            [member?.level !== undefined ? String(member.level) : "â€”", "Level"],
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
  navOpen: boolean;
  membersOpen: boolean;
  profileOpen: boolean;
  memberCount: number;
};

function plainText(value: unknown) {
  if (typeof value !== "string") return "";
  return value
    .replace(/<br\s*\/?\s*>/giu, "\n")
    .replace(/<[^>]*>/gu, "")
    .replace(/&nbsp;/giu, " ")
    .replace(/&amp;/giu, "&")
    .replace(/&lt;/giu, "<")
    .replace(/&gt;/giu, ">")
    .replace(/&quot;/giu, '"')
    .trim();
}

type CodyRoom = {
  id: number;
  name: string;
  online: number;
  passwordRequired?: boolean;
};

type LiveMessage = {
  id: string;
  author: string;
  content: string;
};

function normalizeMessages(value: unknown): LiveMessage[] {
  if (typeof value === "string") {
    if (!value.trim() || typeof DOMParser === "undefined") return [];

    const document = new DOMParser().parseFromString(value, "text/html");
    const candidates = Array.from(
      document.querySelectorAll(
        "[data], .chat_message, .chat_log, .chat_line, .log, li",
      ),
    );
    const nodes = candidates.length
      ? candidates
      : Array.from(document.body.children);

    return nodes.flatMap((node, index) => {
      const element = node as HTMLElement;
      const contentNode = element.querySelector(
        ".chat_message, .chat_content, .message, .content, .chat_text, .log_content",
      );
      const authorNode = element.querySelector(
        ".user_name, .username, .chat_name, .name",
      );

      const content = plainText(
        contentNode?.innerHTML ?? element.innerHTML,
      );

      if (!content) return [];

      const author =
        plainText(authorNode?.textContent) || "Yaarzo";

      const id =
        element.dataset.log ??
        element.dataset.id ??
        (element.id ||
          `${author}-${index}-${content.slice(0, 24)}`);

      return [{ id, author, content }];
    });
  }

  const items = Array.isArray(value)
    ? value
    : value && typeof value === "object"
      ? [value]
      : [];

  return items.flatMap((item, index) => {
    if (!item || typeof item !== "object") return [];

    const log = item as Record<string, unknown>;

    const content = plainText(
      log.log_content ?? log.content ?? log.message,
    );

    if (!content) return [];

    const author =
      plainText(log.user_name ?? log.username ?? log.name) ||
      "Yaarzo";

    const id = String(
      log.log_id ??
        log.id ??
        `${author}-${index}-${content.slice(0, 24)}`,
    );

    return [{ id, author, content }];
  });
}
function EmptyChat({
  active,
  controls,
  guestName,
  onGuestLogin,
  onMembersRefresh,
}: {
  active: string;
  controls: PanelControls;
  guestName: string | undefined;
  onGuestLogin: () => void;
  onMembersRefresh: () => void;
}) {
  const isChat = active === "Chatrooms" || active === "Home";
  const iconBtn =
    "size-8 text-muted-foreground data-[on=true]:bg-secondary data-[on=true]:text-primary";

  const [rooms, setRooms] = useState<CodyRoom[]>([]);
  const [roomId, setRoomId] = useState<number>();
  const [messages, setMessages] = useState<LiveMessage[]>([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const chatScrollRef = useRef<HTMLElement>(null);

  const scrollChatToBottom = () => {
    const container = chatScrollRef.current;
    if (!container) return;

    container.scrollTo({
      top: container.scrollHeight,
      behavior: "smooth",
    });
  };

  const loadRooms = useCallback(async () => {
    if (!guestName || !isChat) return;

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
  }, [guestName, isChat, roomId]);

  const joinRoom = async (room: CodyRoom) => {
    if (room.passwordRequired) {
      setError(
        "This room is password protected. Password entry will be enabled separately.",
      );
      return;
    }

    setError("");

    try {
      const response = await fetch("/api/chat/rooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          room: room.id,
        }),
      });

      const result = (await response.json()) as {
        joined?: boolean;
        data?: {
          room_logs?: unknown;
        };
        error?: string;
      };

      if (!response.ok || !result.joined) {
        setError(result.error ?? "Could not join this room.");
        return;
      }

      setRoomId(room.id);
      setMessages(normalizeMessages(result.data?.room_logs));
      onMembersRefresh();

      requestAnimationFrame(() => {
        requestAnimationFrame(scrollChatToBottom);
      });
    } catch {
      setError("CodyChat is unavailable. Please try again.");
    }
  };

  const pollMessages = useCallback(async () => {
    if (!guestName || !roomId || !isChat) return;

    try {
      const params = new URLSearchParams({
        room: String(roomId),
      });

      const response = await fetch(
        `/api/chat/messages?${params}`,
        {
          cache: "no-store",
        },
      );

      if (!response.ok) return;

      const result = (await response.json()) as {
        mlogs?: unknown;
        rdata?: {
          room_logs?: unknown;
        };
      };

      const incoming = normalizeMessages(
        result.rdata?.room_logs ?? result.mlogs,
      );

      if (incoming.length) {
        setMessages((current) => {
          const map = new Map(
            current.map((entry) => [entry.id, entry]),
          );

          for (const entry of incoming) {
            map.set(entry.id, entry);
          }

          return [...map.values()].slice(-150);
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
      2500,
    );

    return () => {
      window.clearInterval(interval);
    };
  }, [guestName, isChat, pollMessages, roomId]);

  const sendMessage = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const content = message.trim();

    if (!content || sending || !guestName || !isChat) return;

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
          quote: 0,
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
        return;
      }

      setMessage("");

      const sent = normalizeMessages(result.log);

      if (sent.length) {
        setMessages((current) => {
          const map = new Map(
            current.map((entry) => [entry.id, entry]),
          );

          for (const entry of sent) {
            map.set(entry.id, entry);
          }

          return [...map.values()].slice(-150);
        });
      }

      await pollMessages();

      requestAnimationFrame(() => {
        requestAnimationFrame(scrollChatToBottom);
      });
    } catch {
      setError("CodyChat is unavailable. Please try again.");
    } finally {
      setSending(false);
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
                  ? `${selectedRoom.online} online`
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
            className="hidden size-8 text-muted-foreground sm:inline-flex"
          >
            <Search />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={controls.onToggleMembers}
            data-on={controls.membersOpen}
            aria-label="Members"
            title="Members"
            className={`relative ${iconBtn}`}
          >
            <Users />

            {controls.memberCount > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-success px-1 text-[8px] font-bold leading-4 text-primary-foreground">
                {controls.memberCount}
              </span>
            ) : null}
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

      {isChat && guestName && rooms.length ? (
        <div className="flex h-10 shrink-0 items-center gap-1.5 overflow-x-auto border-b border-border bg-card/70 px-3 scrollbar-none">
          <span className="flex shrink-0 items-center gap-1.5 text-xs font-bold text-highlight">
            <Flame className="size-3.5" />
            Rooms
          </span>

          {rooms.map((room) => (
            <Button
              key={room.id}
              variant={
                room.id === roomId ? "default" : "outline"
              }
              size="sm"
              onClick={() => void joinRoom(room)}
              className="topic-chip h-6 shrink-0 rounded-full px-2.5 text-[9px]"
            >
              {room.name} · {room.online}
            </Button>
          ))}
        </div>
      ) : (
        <div className="flex h-10 shrink-0 items-center gap-1.5 overflow-x-auto border-b border-border bg-card/70 px-3 scrollbar-none">
          <span className="flex shrink-0 items-center gap-1.5 text-xs font-bold text-highlight">
            <Flame className="size-3.5" />
            Trending
          </span>

          {[
            "Delhi",
            "Mumbai",
            "Cricket",
            "Bollywood",
            "Travel",
            "Food",
            "Music",
          ].map((topic) => (
            <Button
              key={topic}
              variant="outline"
              size="sm"
              className="topic-chip h-6 shrink-0 rounded-full border-border bg-secondary/55 px-2.5 text-[9px] text-muted-foreground hover:text-foreground"
            >
              {topic}
            </Button>
          ))}
        </div>
      )}

      <main
        ref={chatScrollRef}
        className="chat-canvas flex min-h-0 flex-1 overflow-y-auto px-3 py-5 sm:px-6"
      >
        {!isChat ? (
          <div className="m-auto max-w-xs text-center">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-xl border border-primary/45 bg-primary/10 text-primary shadow-brand">
              <HeartHandshake className="size-6" />
            </div>

            <h2 className="text-base font-extrabold text-foreground">
              {active} is coming to Yaarzo
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
          <div className="mx-auto w-full max-w-4xl space-y-3">
            {messages.map((entry) => {
              const isOwnMessage =
                entry.author.trim().toLowerCase() ===
                guestName.trim().toLowerCase();

              return (
                <div
                  key={entry.id}
                  className={`flex ${
                    isOwnMessage
                      ? "justify-end"
                      : "justify-start"
                  }`}
                >
                  <div className="max-w-[84%] rounded-xl border border-border bg-card px-3 py-2.5 shadow-sm sm:max-w-[70%]">
                    <p
                      className={`text-[10px] font-extrabold text-primary ${
                        isOwnMessage
                          ? "text-right"
                          : "text-left"
                      }`}
                    >
                      {entry.author}
                    </p>

                    <p className="mt-1 whitespace-pre-wrap break-words text-sm text-foreground">
                      {entry.content}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="m-auto text-center text-[11px] text-muted-foreground">
            Connected. Waiting for live messages…
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

      <footer className="premium-panel shrink-0 border-t border-border bg-card/90 p-2.5">
        <form
          onSubmit={sendMessage}
          className="mx-auto flex max-w-4xl items-end gap-1.5 rounded-lg border border-border bg-surface-raised p-1.5 shadow-brand focus-within:border-primary/60"
        >
          <Button
            variant="ghost"
            size="icon"
            disabled
            aria-label="Attach a file"
            className="shrink-0 text-muted-foreground"
          >
            <Paperclip />
          </Button>

          <textarea
            disabled={!guestName || !isChat}
            value={message}
            onChange={(event) =>
              setMessage(event.target.value)
            }
            onFocus={scrollChatToBottom}
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                !event.shiftKey
              ) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
            aria-label="Message"
            placeholder={
              guestName
                ? "Write a message…"
                : "Sign in or continue as guest to send"
            }
            rows={1}
            className="max-h-28 min-h-9 flex-1 resize-none bg-transparent px-1 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
          />

          <Button
            variant="ghost"
            size="icon"
            disabled
            aria-label="Add media"
            className="hidden shrink-0 text-muted-foreground sm:inline-flex"
          >
            <Image />
          </Button>

          <Button
            size="icon"
            type="submit"
            disabled={
              !guestName ||
              !isChat ||
              !message.trim() ||
              sending
            }
            aria-label="Send message"
            className="accent-button shrink-0"
          >
            <Send />
          </Button>
        </form>
      </footer>
    </div>
  );
}
export function YaarzoChat() {
  const { session, user, ready } = useAuth();
  const [active, setActive] = useState("Chatrooms");
  const [leftOpen, setLeftOpen] = useState(false);
  const [membersOpen, setMembersOpen] = useState(false);
  const [navDesktop, setNavDesktop] = useState(true);
  const [membersDesktop, setMembersDesktop] = useState(true);
  const [profile, setProfile] = useState<ProfileTarget | null>(null);
  const [isDesktop, setIsDesktop] = useState(true);
  const [wide, setWide] = useState(true);

  useEffect(() => {
    const desktopQuery = window.matchMedia("(min-width: 768px)");
    const wideQuery = window.matchMedia("(min-width: 1280px)");
    const sync = () => {
      setIsDesktop(desktopQuery.matches);
      setWide(wideQuery.matches);
      if (!desktopQuery.matches) {
        setLeftOpen(false);
        setMembersOpen(false);
      }
    };
    sync();
    desktopQuery.addEventListener("change", sync);
    wideQuery.addEventListener("change", sync);
    return () => {
      desktopQuery.removeEventListener("change", sync);
      wideQuery.removeEventListener("change", sync);
    };
  }, []);
  const [guestName, setGuestName] = useState<string>();
  const [guestDialogOpen, setGuestDialogOpen] = useState(false);
  const [registeredDialogOpen, setRegisteredDialogOpen] = useState(false);
  const [members, setMembers] = useState<CodyMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [theme, setTheme] = useState<YaarzoTheme>("glass");
  const [appearance, setAppearance] = useState<Appearance>("dark");

  useEffect(() => {
    const savedTheme = window.localStorage.getItem("yaarzo-theme");
    const savedAppearance = window.localStorage.getItem("yaarzo-appearance");
    if (savedTheme === "glass" || savedTheme === "cyber" || savedTheme === "neon" || savedTheme === "black") setTheme(savedTheme);
    if (savedAppearance === "light" || savedAppearance === "dark") setAppearance(savedAppearance);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("light", "dark", "theme-glass", "theme-cyber", "theme-neon", "theme-black");
    root.classList.add(appearance, `theme-${theme}`);
    root.style.colorScheme = appearance;
  }, [appearance, theme]);

  const changeTheme = (nextTheme: YaarzoTheme) => {
    setTheme(nextTheme);
    window.localStorage.setItem("yaarzo-theme", nextTheme);
  };

  const changeAppearance = (nextAppearance: Appearance) => {
    setAppearance(nextAppearance);
    window.localStorage.setItem("yaarzo-appearance", nextAppearance);
  };

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
      const result = (await response.json()) as { members?: CodyMember[] };
      if (response.ok && Array.isArray(result.members)) setMembers(result.members);
    } finally {
      setMembersLoading(false);
    }
  }, [guestName]);

  useEffect(() => {
    let activeRequest = true;
    void fetch("/api/chat/session", { cache: "no-store" })
      .then((response) => response.json())
      .then((result: { authenticated?: boolean; guest?: { nickname?: string } }) => {
        if (activeRequest && result.authenticated && result.guest?.nickname) setGuestName(result.guest.nickname);
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

  const toggleNav = () => {
    if (isDesktop) return setNavDesktop((v) => !v);
    const next = !leftOpen;
    closeDrawers();
    setLeftOpen(next);
  };
  const toggleMembers = () => {
    if (isDesktop) {
      setMembersDesktop((v) => !v);
      if (!wide) setProfile(null);
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

  // Desktop: on narrower desktops, profile temporarily replaces members to protect chat width.
  const showNavInline = isDesktop && navDesktop;
  const showMembersInline = isDesktop && membersDesktop && (wide || !profile);
  const showProfileInline = isDesktop && !!profile;
  const drawerOpen = !isDesktop && (leftOpen || membersOpen || !!profile);

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
    navOpen: isDesktop ? navDesktop : leftOpen,
    membersOpen: isDesktop ? showMembersInline : membersOpen,
    profileOpen: profile?.kind === "self",
    memberCount: members.length,
  };

  const sidebarProps = { active, onSelect: selectNavigation, guestName, registered: !!user, registeredLabel: user?.email ?? "Yaarzo Member", onRegisteredAuth: () => setRegisteredDialogOpen(true), onGuestLogin: () => setGuestDialogOpen(true), onLogout: logout, theme, onThemeChange: changeTheme, appearance, onAppearanceChange: changeAppearance };

  return (
    <div className={`${appearance} theme-${theme} h-dvh overflow-hidden bg-background text-foreground transition-colors duration-200`}>
      <div className="flex h-full">
        {showNavInline ? <LeftSidebar {...sidebarProps} mobile onClose={() => setNavDesktop(false)} /> : null}

        <section className="flex min-w-0 flex-1 flex-col bg-background">
          <EmptyChat
            active={active}
            controls={controls}
            guestName={guestName}
            onGuestLogin={() => setGuestDialogOpen(true)}
            onMembersRefresh={() => void loadMembers()}
          />
        </section>

        {showMembersInline ? <MembersPanel members={members} loading={membersLoading} onClose={() => setMembersDesktop(false)} onSelectMember={(member) => openProfile({ kind: "member", member })} /> : null}
        {showProfileInline && profile ? <ProfilePanel target={profile} guestName={guestName} onClose={() => setProfile(null)} onGuestLogin={() => setGuestDialogOpen(true)} /> : null}
      </div>

      {drawerOpen ? (
        <div className={`fixed inset-0 z-50 flex ${leftOpen ? "justify-start" : "justify-end"}`}>
          <div className="drawer-backdrop absolute inset-0 bg-overlay" onClick={closeDrawers} aria-hidden="true" />
          <div className={`relative h-full max-w-[88vw] shadow-2xl ${leftOpen ? "drawer-left" : "drawer-right"}`} role="dialog" aria-modal="true">
            {leftOpen ? (
              <LeftSidebar {...sidebarProps} mobile onClose={closeDrawers} />
            ) : membersOpen ? (
              <MembersPanel members={members} loading={membersLoading} onClose={closeDrawers} onSelectMember={(member) => openProfile({ kind: "member", member })} />
            ) : profile ? (
              <ProfilePanel target={profile} guestName={guestName} onClose={closeDrawers} onGuestLogin={() => setGuestDialogOpen(true)} />
            ) : null}
          </div>
        </div>
      ) : null}
      <RegisteredAuthDialog open={registeredDialogOpen} onOpenChange={setRegisteredDialogOpen} />
      <GuestLoginDialog open={guestDialogOpen} onOpenChange={setGuestDialogOpen} onAuthenticated={setGuestName} />
    </div>
  );
}



















