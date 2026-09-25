import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Menu,
  MessageCircle,
  Moon,
  Rocket,
  Sun,
  Users,
  X,
} from "lucide-react";

import { RegisteredAuthDialog } from "@/components/auth/registered-auth-dialog";
import { HomeEntryCard } from "@/components/home/HomeEntryCard";
import { HomeFooter } from "@/components/home/HomeFooter";
import { HomeSeoCopy } from "@/components/home/HomeSeoCopy";
import {
  FeatureTile,
  PillAvatar,
  SectionTitle,
  StatHighlight,
  WelcomeCard,
} from "@/components/home/welcome-primitives";
import { WELCOME_THEME_CSS } from "@/components/home/welcome-theme-css";
import { useAuth } from "@/contexts/auth-context";
import { HOME_SEO_H1 } from "@/lib/seo/home-page";

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Chatroom", href: "/chatroom" },
] as const;

const FEATURES = [
  {
    title: "Live Chatrooms",
    description: "Public CodyChat rooms inside the premium Yaarzo UI.",
    href: "/chatroom",
    gradient: "linear-gradient(135deg,#8b5cf6,#6d28d9)",
  },
  {
    title: "Guest Access",
    description: "Nickname + gender — join in seconds, no account.",
    href: "/chatroom",
    gradient: "linear-gradient(135deg,#3b82f6,#1d4ed8)",
  },
  {
    title: "Registered DMs",
    description: "Member-to-member messages when you sign in.",
    href: "/chatroom",
    gradient: "linear-gradient(135deg,#10b981,#059669)",
  },
  {
    title: "Replies & Media",
    description: "Native quotes, GIFs, and YouTube in public chat.",
    href: "/chatroom",
    gradient: "linear-gradient(135deg,#f97316,#ea580c)",
  },
] as const;

export function HomePage() {
  const navigate = useNavigate();
  const { user, ready } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signup");
  const [checkingSession, setCheckingSession] = useState(true);

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
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="rounded-full px-3.5 py-2 text-sm font-medium opacity-70 transition-colors hover:bg-white/5 hover:opacity-100"
              >
                {link.label}
              </a>
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
              onClick={scrollToEntry}
              className="hidden rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-sm font-semibold opacity-90 hover:bg-white/[0.08] sm:inline-flex"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={scrollToEntry}
              className="rounded-full px-4 py-2 text-sm font-bold text-white shadow-lg transition-transform hover:scale-[1.03]"
              style={{
                background: "linear-gradient(135deg,#8b5cf6,#3b82f6)",
              }}
            >
              Join Free
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
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="rounded-xl px-3 py-2.5 text-sm font-medium opacity-80 hover:bg-white/5"
                >
                  {link.label}
                </a>
              ))}
            </nav>
          </div>
        ) : null}
      </header>

      <main>
        <section className="relative">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 pb-12 pt-8 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:gap-12 lg:px-8 lg:pt-14">
            <div>
              <p className="text-sm font-semibold tracking-wide text-purple-300">
                Yaarzo Community
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
                Premium live chat — guests welcome, members stay connected.
              </p>
              <p className="mt-3 max-w-xl text-sm opacity-65 sm:text-base">
                Start as a guest in seconds or sign in with your Yaarzo account.
                Everything runs inside our chatroom — never the raw CodyChat page.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                {["Free to join", "Live rooms", "Guest & member chat"].map((badge) => (
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
                <span className="text-xs opacity-65 sm:text-sm">
                  Real-time public chat for guests and registered members.
                </span>
              </div>
            </div>

            <div id="home-entry" className="scroll-mt-24">
              <HomeEntryCard
                onChatroomReady={goChatroom}
                onOpenSignUp={() => {
                  setAuthMode("signup");
                  setAuthOpen(true);
                }}
              />
            </div>
          </div>
        </section>

        <section
          className="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8"
          aria-label="Highlights"
        >
          <div className="grid gap-3 sm:grid-cols-3">
            <StatHighlight icon={MessageCircle} label="Product" value="Live" />
            <StatHighlight icon={Users} label="Access" value="Guest +" />
            <StatHighlight icon={Rocket} label="Entry" value="Instant" />
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8" aria-label="Features">
          <WelcomeCard className="p-5 sm:p-6">
            <SectionTitle icon="✨" title="What you can do on Yaarzo" />
            <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {FEATURES.map((feature) => (
                <FeatureTile key={feature.title} {...feature} />
              ))}
            </div>
          </WelcomeCard>
        </section>

        <HomeSeoCopy />
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
