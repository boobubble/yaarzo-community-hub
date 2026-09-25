const linkClass =
  "font-semibold text-purple-300 underline-offset-4 hover:underline";

const cardClass =
  "rounded-2xl border border-white/[0.07] bg-[#10101f]/80 p-5 backdrop-blur-xl sm:p-6";

/** Crawlable homepage body copy (SSR-safe). */
export function HomeSeoCopy() {
  return (
    <section
      data-seo-copy
      className="mx-auto max-w-7xl space-y-4 px-4 pb-12 sm:px-6 lg:px-8"
    >
      <div className={cardClass}>
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
          Meet New People Through Online Chatrooms
        </h2>
        <p className="mt-3 text-sm leading-relaxed opacity-70 sm:text-base">
          Yaarzo{" "}
          <a href="/chatroom" className={linkClass}>live chatrooms</a>{" "}
          bring together guests and registered members in real-time public
          conversations. Browse rooms by topic or region, listen first, and join
          when you are ready — no download and no redirect to a separate chat
          engine UI.
        </p>
      </div>

      <div className={cardClass}>
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
          More Than Just a Chat Window
        </h2>
        <p className="mt-3 text-sm leading-relaxed opacity-70 sm:text-base">
          The premium Yaarzo chatroom includes direct messages when you are
          signed in, member profiles, GIF and YouTube sharing, and reply threads
          powered by CodyChat&apos;s native quote system. Registered members can
          build lasting friendships with Supabase-backed direct messages while
          guests can still participate in public rooms instantly.
        </p>
      </div>

      <div className={cardClass}>
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">
          Start Exploring Yaarzo
        </h2>
        <p className="mt-3 text-sm leading-relaxed opacity-70 sm:text-base">
          Continue as a guest with a nickname, sign in with your Yaarzo account,
          or create a new profile — then head straight into the{" "}
          <a href="/chatroom" className={linkClass}>chatroom</a>. Yaarzo is
          free to join, and your first conversation is only a click away.
        </p>
      </div>
    </section>
  );
}
