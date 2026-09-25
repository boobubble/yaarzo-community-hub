import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, Moon, Rocket, Sun, X } from "lucide-react";

import { RegisteredAuthDialog } from "@/components/auth/registered-auth-dialog";
import { HomeEntryCard } from "@/components/home/HomeEntryCard";
import { HomeFooter } from "@/components/home/HomeFooter";
import { HomeSeoCopy } from "@/components/home/HomeSeoCopy";
import { HomeNavAnchor } from "@/components/home/home-shared";
import { HomeBlog } from "@/components/home/sections/HomeBlog";
import { HomeCommunities } from "@/components/home/sections/HomeCommunities";
import { HomeCompetitions } from "@/components/home/sections/HomeCompetitions";
import { HomeConfessions } from "@/components/home/sections/HomeConfessions";
import { HomeDiscussions } from "@/components/home/sections/HomeDiscussions";
import { HomeFeaturedMembers } from "@/components/home/sections/HomeFeaturedMembers";
import { HomeFeatureGrid, HomeProductStats } from "@/components/home/sections/HomeFeatureGrid";
import { HomeFinalCta } from "@/components/home/sections/HomeFinalCta";
import { HomeLatestMembers } from "@/components/home/sections/HomeLatestMembers";
import { HomeLiveCommunity } from "@/components/home/sections/HomeLiveCommunity";
import { HomePoetrySeo, HomePoetryTrending } from "@/components/home/sections/HomePoetry";
import { HomeRecentActivity } from "@/components/home/sections/HomeRecentActivity";
import { HomeTrendingPosts } from "@/components/home/sections/HomeTrendingPosts";
import { PillAvatar } from "@/components/home/welcome-primitives";
import { WELCOME_THEME_CSS } from "@/components/home/welcome-theme-css";
import { useAuth } from "@/contexts/auth-context";
import { HOME_LANDING_CONFIG } from "@/lib/home/landing-config";
import { HOME_NAV_LINKS } from "@/lib/home/home-routes";
import { HOME_SEO_H1 } from "@/lib/seo/home-page";

export function HomePage() {
  const navigate = useNavigate();
  const { user, ready } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signup");
  const [checkingSession, setCheckingSession] = useState(true);
  const cfg = HOME_LANDING_CONFIG;

  const goChatroom = () => {
    void navigate({ to: "/chatroom" });
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem("yaarzo-welcome-theme");
      if (saved === "light" || saved === "dark") setTheme(saved);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (!ready) return;

    if (user) {
      void navigate({ to: "/chatroom", replace: true });
      return;
    }

    let active = true;
    void fetch("/api/chat/session", { cache: "no-store" })
      .then((response) => response.json())
      .then((result: { authenticated?: boolean }) => {
        if (!active) return;
        if (result.authenticated) {
          void navigate({ to: "/chatroom", replace: true });
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setCheckingSession(false);
      });

    return () => {
      active = false;
    };
  }, [ready, user, navigate]);

  if (ready && user) {
    return null;
  }

  if (checkingSession && ready) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#070713] text-white/70">
        <p className="text-sm">Loading…</p>
      </div>
    );
  }

  const scrollToEntry = () => {
    document.getElementById("home-entry")?.scrollIntoView({ behavior: "smooth" });
  };

  const openSignUp = () => {
    setAuthMode("signup");
    setAuthOpen(true);
  };

  return (
    <div
      className={`welcome-root ${theme === "light" ? "welcome-light" : ""} relative min-h-screen overflow-x-hidden antialiased`}
    >
      <style>{WELCOME_THEME_CSS}</style>

      <div
        className="pointer-events-none fixed inset-0 -z-10 select-none"
        aria-hidden
      >
        <div
          className="absolute -left-32 top-[-10%] h-[520px] w-[520px] opacity-50"
          style={{
            background: "radial-gradient(closest-side,#8b5cf6,transparent 70%)",
          }}
        />
        <div
          className="absolute right-[-15%] top-[20%] h-[600px] w-[600px] opacity-40"
          style={{
            background: "radial-gradient(closest-side,#3b82f6,transparent 70%)",
          }}
        />
        <div
          className="absolute bottom-[-10%] left-1/3 h-[500px] w-[500px] opacity-30"
          style={{
            background: "radial-gradient(closest-side,#ec4899,transparent 70%)",
          }}
        />
      </div>

      <header className="sticky top-0 z-40 border-b border-white/5">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <a href="/" className="flex shrink-0 items-center gap-2.5">
            <span
              className="grid h-9 w-9 place-items-center rounded-xl text-base font-black text-white shadow-lg"
              style={{
                background: "linear-gradient(135deg,#8b5cf6,#3b82f6)",
              }}
            >
              💬
            </span>
            <span className="text-lg font-extrabold tracking-tight">Yaarzo</span>
          </a>

          <nav aria-label="Homepage" className="ml-6 hidden items-center gap-1 lg:flex">
            {HOME_NAV_LINKS.map((link) => (
              <HomeNavAnchor
                key={link.href + link.label}
                href={link.href}
                className="rounded-full px-3.5 py-2 text-sm font-medium opacity-70 transition-colors hover:bg-white/5 hover:opacity-100"
              >
                {link.label}
              </HomeNavAnchor>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setTheme((current) => {
                  const next = current === "dark" ? "light" : "dark";
                  try {
                    localStorage.setItem("yaarzo-welcome-theme", next);
                  } catch {
                    /* ignore */
                  }
                  return next;
                });
              }}
              className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/[0.04] opacity-70 hover:opacity-100"
              aria-label="Toggle homepage theme"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/5 lg:hidden"
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
            >
              {menuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {menuOpen ? (
          <div className="welcome-mobile-nav border-t border-white/10 px-4 pb-4 pt-2 lg:hidden">
            <nav aria-label="Mobile" className="grid gap-1">
              {HOME_NAV_LINKS.map((link) => (
                <HomeNavAnchor
                  key={link.href + link.label}
                  href={link.href}
                  className="rounded-xl px-3 py-2.5 text-sm font-medium opacity-80 hover:bg-white/5"
                >
                  {link.label}
                </HomeNavAnchor>
              ))}
            </nav>
          </div>
        ) : null}
      </header>

      <main>
        <section className="relative">
          <div className="mx-auto flex max-w-7xl flex-col gap-8 px-4 pb-12 pt-6 sm:px-6 sm:pt-8 lg:grid lg:grid-cols-[1.1fr_1fr] lg:gap-12 lg:px-8 lg:pt-14">
            <div className="order-2 lg:order-1">
              <p className="text-sm font-semibold tracking-wide text-purple-300">
                {cfg.heroEyebrow}
              </p>
              <h1 className="mt-2 text-[32px] font-black leading-[1.08] tracking-tight sm:text-5xl lg:text-[52px]">
                {HOME_SEO_H1.replace("Join Communities", "").trim()}{" "}
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage:
                      "linear-gradient(120deg,#a78bfa 0%,#c084fc 40%,#60a5fa 100%)",
                  }}
                >
                  Join Communities
                </span>
              </h1>
              <p className="mt-4 text-base font-semibold opacity-80 sm:text-lg">
                Premium live chat — plus the full Yaarzo social platform, rolling out module by module.
              </p>
              <p className="mt-3 max-w-xl text-sm opacity-65 sm:text-base">{cfg.heroSubtitle}</p>

              <div className="mt-6 flex flex-wrap gap-2">
                {cfg.heroBadges.map((badge) => (
                  <span
                    key={badge}
                    className="rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs font-semibold opacity-80"
                  >
                    {badge}
                  </span>
                ))}
              </div>

              <div className="mt-7 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={scrollToEntry}
                  className="inline-flex items-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-bold text-white shadow-lg transition-transform hover:scale-[1.03]"
                  style={{
                    background: "linear-gradient(135deg,#8b5cf6,#3b82f6)",
                  }}
                >
                  <Rocket className="h-4 w-4" /> Start Chatting
                </button>
                <a
                  href="/chatroom"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/15 bg-white/[0.04] px-6 py-3.5 text-sm font-bold hover:bg-white/[0.08]"
                >
                  Open Chatroom
                </a>
              </div>

              <div className="mt-6 flex items-center gap-3">
                <div className="flex -space-x-2">
                  {["Guest", "Member", "Live", "You"].map((name) => (
                    <PillAvatar key={name} name={name} size={32} />
                  ))}
                </div>
                <span className="text-xs opacity-65 sm:text-sm">{cfg.heroSocialProof}</span>
              </div>
            </div>

            <div id="home-entry" className="order-1 scroll-mt-24 lg:order-2">
              <HomeEntryCard
                onChatroomReady={goChatroom}
                onOpenSignIn={() => {
                  setAuthMode("signin");
                  setAuthOpen(true);
                }}
                onOpenSignUp={openSignUp}
              />
            </div>
          </div>
        </section>

        <HomeProductStats />
        <HomeFeatureGrid />
        <HomeSeoCopy />
        <HomeLiveCommunity />
        <HomeTrendingPosts />
        <HomePoetryTrending />
        <HomePoetrySeo />
        <HomeDiscussions />
        <HomeCommunities />
        <HomeCompetitions />
        <HomeFeaturedMembers />
        <HomeLatestMembers />
        <HomeConfessions />
        <HomeRecentActivity />
        <HomeBlog />
        <HomeFinalCta onCreateAccount={openSignUp} />
      </main>

      <HomeFooter />

      <RegisteredAuthDialog
        open={authOpen}
        onOpenChange={setAuthOpen}
        initialMode={authMode}
        onChatroomReady={goChatroom}
      />
    </div>
  );
}
