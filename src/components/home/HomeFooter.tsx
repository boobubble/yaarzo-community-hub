import { Instagram, MessageCircle, Twitter, Youtube } from "lucide-react";

import { HomeExploreLink } from "@/components/home/home-shared";
import { HOME_EXPLORE_LINKS, HOME_FOOTER_COLUMNS } from "@/lib/home/home-routes";
import { HOME_LANDING_CONFIG } from "@/lib/home/landing-config";

const SOCIAL = [
  { Icon: MessageCircle, label: "Discord", color: "bg-indigo-500/20 text-indigo-300" },
  { Icon: Instagram, label: "Instagram", color: "bg-pink-500/20 text-pink-300" },
  { Icon: Twitter, label: "Twitter", color: "bg-sky-500/20 text-sky-300" },
  { Icon: Youtube, label: "YouTube", color: "bg-red-500/20 text-red-300" },
] as const;

export function HomeFooter() {
  const tagline = HOME_LANDING_CONFIG.brandTagline;
  return (
    <footer className="welcome-footer border-t border-white/5">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-[1.4fr_repeat(4,1fr)]">
          <div>
            <div className="flex items-center gap-2.5">
              <span
                className="grid h-9 w-9 place-items-center rounded-xl text-base"
                style={{ background: "linear-gradient(135deg,#8b5cf6,#3b82f6)" }}
              >
                💬
              </span>
              <span className="text-base font-extrabold">Yaarzo</span>
            </div>
            <p className="mt-3 max-w-xs text-sm opacity-55">{tagline}</p>
          </div>

          <div>
            <div className="text-sm font-bold">Explore</div>
            <ul className="mt-3 space-y-2">
              {HOME_EXPLORE_LINKS.map((link) => (
                <li key={link.href}>
                  <HomeExploreLink href={link.href} label={link.label} />
                </li>
              ))}
            </ul>
          </div>

          {HOME_FOOTER_COLUMNS.map((col) => (
            <div key={col.title}>
              <div className="text-sm font-bold">{col.title}</div>
              <ul className="mt-3 space-y-2">
                {col.links.map((link) => (
                  <li key={link.href + link.label}>
                    <HomeExploreLink href={link.href} label={link.label} />
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div>
            <div className="text-sm font-bold">Follow Us</div>
            <div className="mt-3 flex items-center gap-2">
              {SOCIAL.map(({ Icon, label, color }) => (
                <span
                  key={label}
                  aria-label={label}
                  title="Coming soon"
                  className={`grid h-9 w-9 place-items-center rounded-full ${color} opacity-60`}
                >
                  <Icon className="h-4 w-4" />
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-10 border-t border-white/5 pt-6 text-center text-xs opacity-40">
          © {new Date().getFullYear()} Yaarzo. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
