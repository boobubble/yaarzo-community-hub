import { Link, Outlet, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  BadgeDollarSign,
  Bell,
  Bot,
  ChevronLeft,
  ChevronRight,
  CircleGauge,
  Coins,
  Command,
  FileText,
  Flag,
  Gamepad2,
  HeartHandshake,
  LayoutDashboard,
  Menu,
  MessageSquareText,
  Palette,
  Radio,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Sticker,
  Trophy,
  Users,
  WalletCards,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

type AdminAccess = "checking" | "allowed" | "denied";

const ADMIN_ROLES = new Set(["admin", "super_admin"]);

type NavItem = { label: string; slug?: string; icon: LucideIcon; accent: string };
type NavGroup = { label: string; items: NavItem[] };

const adminNavigation: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", icon: LayoutDashboard, accent: "text-primary" },
      { label: "Live Activity", slug: "live-activity", icon: Activity, accent: "text-cyan" },
    ],
  },
  {
    label: "Community",
    items: [
      { label: "Users", slug: "users", icon: Users, accent: "text-highlight" },
      { label: "Profiles", slug: "profiles", icon: HeartHandshake, accent: "text-cyan" },
      { label: "Reports", slug: "reports", icon: Flag, accent: "text-alert" },
      { label: "Moderation", slug: "moderation", icon: ShieldCheck, accent: "text-amber" },
      { label: "Staff & Roles", slug: "staff", icon: Command, accent: "text-success" },
    ],
  },
  {
    label: "Chat management",
    items: [
      { label: "Chatrooms", slug: "chatrooms", icon: MessageSquareText, accent: "text-cyan" },
      { label: "Room Moderators", slug: "room-moderators", icon: ShieldCheck, accent: "text-primary" },
      { label: "Chat Settings", slug: "chat-settings", icon: Settings, accent: "text-muted-foreground" },
      { label: "Word & URL Filters", slug: "filters", icon: Flag, accent: "text-alert" },
      { label: "Bots", slug: "bots", icon: Bot, accent: "text-success" },
      { label: "Stickers & Emoji", slug: "stickers", icon: Sticker, accent: "text-highlight" },
    ],
  },
  {
    label: "Content",
    items: [
      { label: "Feed", slug: "feed", icon: FileText, accent: "text-primary" },
      { label: "Competitions", slug: "competitions", icon: Trophy, accent: "text-amber" },
      { label: "Confessions", slug: "confessions", icon: HeartHandshake, accent: "text-highlight" },
      { label: "Poetry / Shayari", slug: "poetry", icon: Sparkles, accent: "text-primary" },
      { label: "Communities", slug: "communities", icon: Users, accent: "text-success" },
      { label: "Radio", slug: "radio", icon: Radio, accent: "text-cyan" },
    ],
  },
  {
    label: "Gamification",
    items: [
      { label: "Coins / Wallet", slug: "wallet", icon: Coins, accent: "text-amber" },
      { label: "XP & Levels", slug: "levels", icon: Activity, accent: "text-success" },
      { label: "Achievements", slug: "achievements", icon: Trophy, accent: "text-primary" },
      { label: "Badges", slug: "badges", icon: ShieldCheck, accent: "text-highlight" },
      { label: "Leaderboard", slug: "leaderboard", icon: Trophy, accent: "text-amber" },
      { label: "Rewards", slug: "rewards", icon: Sparkles, accent: "text-cyan" },
    ],
  },
  {
    label: "Monetization",
    items: [
      { label: "Plans", slug: "plans", icon: BadgeDollarSign, accent: "text-primary" },
      { label: "Subscriptions", slug: "subscriptions", icon: WalletCards, accent: "text-success" },
      { label: "Payments", slug: "payments", icon: Coins, accent: "text-amber" },
    ],
  },
  {
    label: "Content & SEO",
    items: [
      { label: "Landing Pages", slug: "landing-pages", icon: FileText, accent: "text-primary" },
      { label: "Blog", slug: "blog", icon: FileText, accent: "text-cyan" },
      { label: "Categories", slug: "categories", icon: Menu, accent: "text-success" },
      { label: "SEO", slug: "seo", icon: Search, accent: "text-highlight" },
      { label: "Sitemap", slug: "sitemap", icon: Activity, accent: "text-amber" },
    ],
  },
  {
    label: "Platform",
    items: [
      { label: "Notifications", slug: "notifications", icon: Bell, accent: "text-highlight" },
      { label: "Branding", slug: "branding", icon: Palette, accent: "text-primary" },
      { label: "Feature Controls", slug: "features", icon: CircleGauge, accent: "text-cyan" },
      { label: "Security", slug: "security", icon: ShieldCheck, accent: "text-success" },
      { label: "System Health", slug: "system", icon: Activity, accent: "text-amber" },
      { label: "Backup", slug: "backup", icon: FileText, accent: "text-muted-foreground" },
      { label: "Activity Logs", slug: "activity-logs", icon: Activity, accent: "text-cyan" },
      { label: "Settings", slug: "settings", icon: Settings, accent: "text-primary" },
    ],
  },
];

function SidebarContent({ collapsed, closeMobile }: { collapsed: boolean; closeMobile?: () => void }) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  return (
    <>
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
        <div className="brand-mark flex size-9 shrink-0 items-center justify-center rounded-md font-display text-sm font-bold text-primary-foreground">Y</div>
        {!collapsed && <div><div className="font-display text-sm font-bold text-sidebar-foreground">Yaarzo Admin</div><div className="text-[10px] font-semibold uppercase text-muted-foreground">Control center</div></div>}
      </div>
      <nav aria-label="Admin navigation" className="scrollbar-none flex-1 overflow-y-auto px-2 py-3">
        {adminNavigation.map((group) => (
          <div className="mb-4" key={group.label}>
            {!collapsed && <p className="px-2 pb-1.5 text-[10px] font-bold uppercase text-muted-foreground">{group.label}</p>}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const href = item.slug ? `/admin/${item.slug}` : "/admin";
                const active = pathname === href;
                const Icon = item.icon;
                return item.slug ? (
                  <Link key={item.label} to="/admin/$section" params={{ section: item.slug }} onClick={closeMobile} title={collapsed ? item.label : undefined} className={cn("flex h-9 items-center gap-3 rounded-md px-2.5 text-sm font-medium text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground", active && "active-glow bg-sidebar-accent text-sidebar-accent-foreground")}>
                    <Icon className={cn("size-4 shrink-0", item.accent)} />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                ) : (
                  <Link key={item.label} to="/admin" onClick={closeMobile} title={collapsed ? item.label : undefined} activeOptions={{ exact: true }} className={cn("flex h-9 items-center gap-3 rounded-md px-2.5 text-sm font-medium text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground", active && "active-glow bg-sidebar-accent text-sidebar-accent-foreground")}>
                    <Icon className={cn("size-4 shrink-0", item.accent)} />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      {!collapsed && <div className="m-3 rounded-md border border-sidebar-border bg-sidebar-accent/50 p-3"><p className="text-xs font-semibold text-sidebar-foreground">Phase 1 preview</p><p className="mt-1 text-[11px] leading-4 text-muted-foreground">Controls are visual only. No production services are connected.</p></div>}
    </>
  );
}

function AdminShellLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const currentLabel = adminNavigation.flatMap((group) => group.items).find((item) => (item.slug ? `/admin/${item.slug}` : "/admin") === pathname)?.label ?? "Admin";

  useEffect(() => setMobileOpen(false), [pathname]);
  useEffect(() => {
    if (!mobileOpen) return;
    const prior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prior; };
  }, [mobileOpen]);

  return (
    <div className="admin-root min-h-screen bg-background text-foreground">
      <aside className={cn("fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 lg:flex", collapsed ? "w-16" : "w-64")}>
        <SidebarContent collapsed={collapsed} />
        <Button variant="outline" size="icon" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} title={collapsed ? "Expand sidebar" : "Collapse sidebar"} onClick={() => setCollapsed((value) => !value)} className="absolute -right-4 top-20 size-8 rounded-full bg-card">
          {collapsed ? <ChevronRight /> : <ChevronLeft />}
        </Button>
      </aside>

      {mobileOpen && <div className="fixed inset-0 z-40 bg-overlay lg:hidden" role="presentation" onClick={() => setMobileOpen(false)} />}
      <aside className={cn("fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-sidebar-border bg-sidebar transition-transform duration-200 lg:hidden", mobileOpen ? "translate-x-0" : "-translate-x-full")} aria-hidden={!mobileOpen}>
        <SidebarContent collapsed={false} closeMobile={() => setMobileOpen(false)} />
        <Button variant="ghost" size="icon" aria-label="Close navigation" onClick={() => setMobileOpen(false)} className="absolute right-3 top-3"><X /></Button>
      </aside>

      <div className={cn("min-h-screen transition-[padding] duration-200", collapsed ? "lg:pl-16" : "lg:pl-64")}>
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur-xl md:px-6">
          <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><Menu /></Button>
          <div className="hidden items-center gap-2 text-sm md:flex"><span className="text-muted-foreground">Admin</span><ChevronRight className="size-3 text-muted-foreground" /><span className="font-semibold">{currentLabel}</span></div>
          <div className="relative ml-auto hidden w-full max-w-sm md:block"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input aria-label="Search admin" placeholder="Search admin…" className="bg-card pl-9" /></div>
          <Button variant="ghost" size="icon" aria-label="Notifications" title="Notifications" className="relative"><Bell /><span className="absolute right-2 top-2 size-1.5 rounded-full bg-alert" /></Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" className="h-10 gap-2 px-2"><span className="brand-mark flex size-7 items-center justify-center rounded-md text-xs font-bold text-primary-foreground">YA</span><span className="hidden text-left text-xs sm:block"><span className="block font-semibold">Admin preview</span><span className="block text-muted-foreground">UI only</span></span></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52"><DropdownMenuLabel>Admin preview</DropdownMenuLabel><DropdownMenuSeparator /><DropdownMenuItem disabled>Profile — Phase 2</DropdownMenuItem><DropdownMenuItem disabled>Sign out — Not connected</DropdownMenuItem></DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="mx-auto w-full max-w-[1600px] p-4 md:p-6 lg:p-8"><Outlet /></main>
      </div>
    </div>
  );
}

export function AdminShell() {
  const { user, ready } = useAuth();
  const [access, setAccess] = useState<AdminAccess>("checking");

  useEffect(() => {
    if (!ready) {
      return;
    }

    if (!user) {
      setAccess("denied");
      return;
    }

    let cancelled = false;
    setAccess("checking");

    void (async () => {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      if (cancelled) {
        return;
      }

      if (error) {
        setAccess("denied");
        return;
      }

      const allowed = (data ?? []).some((row) => ADMIN_ROLES.has(row.role));
      setAccess(allowed ? "allowed" : "denied");
    })();

    return () => {
      cancelled = true;
    };
  }, [ready, user?.id]);

  if (!ready || access === "checking") {
    return (
      <div className="admin-root flex min-h-screen items-center justify-center bg-background text-foreground">
        <p className="text-sm text-muted-foreground">Checking admin access…</p>
      </div>
    );
  }

  if (access === "denied") {
    return (
      <div className="admin-root flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center text-foreground">
        <div>
          <h1 className="font-display text-xl font-bold">Admin access required</h1>
          <p className="mt-2 max-w-md text-sm text-muted-foreground">
            This account does not have permission to access the Yaarzo admin console.
          </p>
        </div>
        <Link to="/" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
          Back to home
        </Link>
      </div>
    );
  }

  return <AdminShellLayout />;
}