import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { ChevronRight } from "lucide-react";

export function WelcomeCard({
  className = "",
  children,
  style,
}: {
  className?: string;
  children: ReactNode;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`welcome-card rounded-2xl border border-white/[0.07] ${className}`}
      style={{
        background: "var(--home-card)",
        borderColor: "var(--home-border)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function PillAvatar({
  name,
  size = 32,
}: {
  name: string;
  size?: number;
}) {
  const letter = (name || "Y").trim().charAt(0).toUpperCase();
  return (
    <div
      className="grid shrink-0 place-items-center rounded-full font-bold text-white ring-2 ring-white/10"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.42,
        background: `linear-gradient(135deg, hsl(${Math.abs(name.charCodeAt(0) * 13) % 360} 70% 55%), hsl(${Math.abs(name.charCodeAt(0) * 29) % 360} 70% 45%))`,
      }}
    >
      {letter}
    </div>
  );
}

export function SectionTitle({
  icon,
  title,
  suffix,
  href,
}: {
  icon: string;
  title: string;
  suffix?: string | undefined;
  href?: string | undefined;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-lg">{icon}</span>
      <div className="flex-1">
        <h2 className="inline text-sm font-bold">{title}</h2>
        {suffix ? (
          <span className="ml-1.5 text-[11px] opacity-60">{suffix}</span>
        ) : null}
      </div>
      {href ? (
        <a
          href={href}
          className="inline-flex items-center gap-0.5 text-[11px] font-bold text-purple-300 hover:text-purple-200"
        >
          View all <ChevronRight className="h-3 w-3" />
        </a>
      ) : null}
    </div>
  );
}

export function FeatureTile({
  title,
  description,
  href,
  gradient,
}: {
  title: string;
  description: string;
  href: string;
  gradient: string;
}) {
  return (
    <a
      href={href}
      className="group flex flex-col rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:bg-white/[0.06]"
    >
      <span
        className="mb-3 grid h-10 w-10 place-items-center rounded-xl text-lg"
        style={{ background: gradient }}
      >
        💬
      </span>
      <h3 className="text-sm font-bold">{title}</h3>
      <p className="mt-1 text-[11px] leading-4 opacity-70">{description}</p>
    </a>
  );
}

export function StatHighlight({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-purple-500/20 text-purple-300">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-lg font-black">{value}</p>
        <p className="text-[10px] font-semibold uppercase tracking-wide opacity-60">
          {label}
        </p>
      </div>
    </div>
  );
}
