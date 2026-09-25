import type { ReactNode } from "react";

import { SectionTitle, WelcomeCard } from "@/components/home/welcome-primitives";
import { isHomeLivePath } from "@/lib/home/home-routes";

export const homeSeoLink =
  "font-semibold text-purple-300 underline-offset-4 hover:underline";

export function ComingSoonBadge() {
  return (
    <span className="rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-200/90">
      Coming soon
    </span>
  );
}

export function HomeSectionShell({
  icon,
  title,
  suffix,
  href,
  children,
  className = "",
}: {
  icon: string;
  title: string;
  suffix?: string;
  href?: string;
  children: ReactNode;
  className?: string;
}) {
  const liveHref = href && isHomeLivePath(href) ? href : undefined;
  return (
    <section className={`mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8 ${className}`}>
      <WelcomeCard className="p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <SectionTitle icon={icon} title={title} suffix={suffix} href={liveHref} />
          {href && !liveHref ? <ComingSoonBadge /> : null}
        </div>
        <div className="mt-4">{children}</div>
      </WelcomeCard>
    </section>
  );
}

export function HomeModuleEmpty({
  message,
  liveCta,
  comingSoonLabel = "Coming soon",
}: {
  message: string;
  liveCta?: { href: string; label: string };
  comingSoonLabel?: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-6 text-center">
      <p className="text-sm opacity-65">{message}</p>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        {liveCta ? (
          <a
            href={liveCta.href}
            className="inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-bold text-purple-200 hover:bg-white/[0.08]"
          >
            {liveCta.label}
          </a>
        ) : (
          <span className="inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-bold opacity-70">
            {comingSoonLabel}
          </span>
        )}
      </div>
    </div>
  );
}

export function HomeNavAnchor({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  if (isHomeLivePath(href)) {
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  }
  return (
    <span
      className={`cursor-default opacity-50 ${className}`}
      title="Coming soon"
    >
      {children}
    </span>
  );
}

export function HomeExploreLink({
  href,
  label,
}: {
  href: string;
  label: string;
}) {
  if (isHomeLivePath(href)) {
    return (
      <a href={href} className="text-sm opacity-55 hover:opacity-90">
        {label}
      </a>
    );
  }
  return (
    <span className="text-sm opacity-45" title="Coming soon">
      {label} <span className="text-[10px] uppercase tracking-wide text-amber-200/80">· Soon</span>
    </span>
  );
}
