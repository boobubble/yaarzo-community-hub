import { X } from "lucide-react";

import { PillAvatar } from "@/components/home/welcome-primitives";

/** Decorative hero art — not live data. */
export function HomeHeroPreview({
  variant = "desktop",
}: {
  variant?: "desktop" | "compact";
}) {
  if (variant === "compact") {
    return (
      <div className="relative mt-8 lg:hidden" aria-hidden>
        <div
          className="hero-dark-preview mx-auto max-w-md rotate-[-1deg] rounded-2xl border border-white/15 bg-[#0e0e22]/90 p-3 shadow-[0_20px_50px_-20px_rgba(139,92,246,0.45)]"
        >
          <div className="flex items-center gap-2 border-b border-white/10 pb-2">
            <span
              className="grid h-5 w-5 place-items-center rounded-md text-[9px] font-black text-white"
              style={{ background: "linear-gradient(135deg,#8b5cf6,#3b82f6)" }}
            >
              💬
            </span>
            <span className="text-[10px] font-bold text-white/85">Yaarzo Chat preview</span>
          </div>
          <div className="mt-2 space-y-2">
            {["Guest", "Member"].map((n, i) => (
              <div key={n} className="flex items-start gap-2">
                <PillAvatar name={n} size={20} />
                <div className="min-w-0 flex-1 text-[10px] leading-snug text-white/70">
                  <span className="font-bold text-white/90">{n}</span>
                  {i === 0 ? " — Hello everyone! 👋" : " — Live public chat preview"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-[480px]">
      <div className="hero-dark-preview absolute right-0 top-4 w-[480px] max-w-full rotate-[-2deg] rounded-2xl border border-white/15 bg-[#0e0e22]/90 shadow-[0_30px_80px_-20px_rgba(139,92,246,0.55)]">
        <div className="flex items-center gap-2 border-b border-white/10 px-4 py-2.5">
          <span
            className="grid h-6 w-6 place-items-center rounded-md text-[11px] font-black text-white"
            style={{ background: "linear-gradient(135deg,#8b5cf6,#3b82f6)" }}
          >
            💬
          </span>
          <span className="text-[11px] font-bold text-white/85">Yaarzo Chat</span>
          <span className="ml-auto flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <span className="h-2.5 w-2.5 rounded-full bg-white/15" />
            <X className="h-3 w-3 text-white/40" />
          </span>
        </div>
        <div className="grid grid-cols-[1fr_120px] gap-0">
          <div className="border-r border-white/10 p-3">
            <div className="space-y-2">
              {["Guest", "Member", "Friend", "You"].map((n, i) => (
                <div key={n} className="flex items-start gap-2">
                  <PillAvatar name={n} size={22} />
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold text-white/90">{n}</span>
                    <div className="text-[10px] leading-snug text-white/70">
                      {i === 0 ? "Hello everyone! 👋" : "Live public chat preview"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="p-2.5">
            <div className="mb-2 text-[9px] font-bold uppercase tracking-wider text-white/50">
              Members
            </div>
            <div className="space-y-1.5">
              {["Guest", "Member", "Live"].map((n) => (
                <div key={n} className="flex items-center gap-1.5">
                  <PillAvatar name={n} size={16} />
                  <span className="truncate text-[9px] text-white/70">{n}</span>
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-emerald-400" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="hero-dark-preview absolute bottom-8 right-4 rounded-2xl border border-white/15 bg-[#0e0e22]/90 px-3 py-2 shadow-xl">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
          <span className="text-[10px] font-bold text-white">Live chatroom</span>
        </div>
      </div>
    </div>
  );
}
