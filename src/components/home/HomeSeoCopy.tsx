import { WelcomeCard } from "@/components/home/welcome-primitives";
import { homeSeoLink } from "@/components/home/home-shared";

/** Crawlable homepage body copy (SSR-safe). Links only to live routes. */
export function HomeSeoCopy() {
  return (
    <section
      data-seo-copy
      className="mx-auto max-w-7xl space-y-4 px-4 pb-12 sm:px-6 lg:px-8"
    >
      <WelcomeCard className="p-5 sm:p-6">
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
          Meet New People Through Online Chatrooms
        </h2>
        <p className="mt-3 text-sm leading-relaxed opacity-70 sm:text-base">
          Yaarzo is a free place to meet people in live{" "}
          <a href="/chatroom" className={homeSeoLink}>online chatrooms</a>{" "}
          and keep conversations going with friends around the world. Browse public CodyChat
          rooms inside the premium Yaarzo interface — no redirect to a separate chat engine.
          Listen first, then join when you are ready.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href="/chatroom"
            className="rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs font-semibold opacity-80 hover:bg-white/[0.08]"
          >
            💬 Live chatrooms
          </a>
        </div>
      </WelcomeCard>

      <WelcomeCard className="p-5 sm:p-6">
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
          More Than Just a Chat Room
        </h2>
        <p className="mt-3 text-sm leading-relaxed opacity-70 sm:text-base">
          Yaarzo is built as a full social platform: social feed, communities, competitions,
          poetry and shayari, confessions, games, leaderboards, and creator tools are
          represented on this homepage and will connect to live data as each module ships.
          Today, the{" "}
          <a href="/chatroom" className={homeSeoLink}>premium chatroom</a> is live for
          guests and registered members, including direct messages when you sign in.
        </p>
      </WelcomeCard>

      <WelcomeCard className="p-5 sm:p-6">
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
          Find Communities That Match Your Interests
        </h2>
        <p className="mt-3 text-sm leading-relaxed opacity-70 sm:text-base">
          Interest-based discovery — music, sport, study, humour, and late-night conversation —
          will surface through communities and rooms as those features go live. Start in the
          chatroom now; expand into feed, poetry, and competitions without leaving the same
          Yaarzo home.
        </p>
      </WelcomeCard>
    </section>
  );
}
