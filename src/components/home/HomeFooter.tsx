const EXPLORE = [
  { label: "Live Chatroom", href: "/chatroom" },
  { label: "Home", href: "/" },
] as const;

export function HomeFooter() {
  return (
    <footer className="welcome-footer border-t border-white/5">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-3">
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
            <p className="mt-3 max-w-xs text-sm opacity-55">
              Free online chatrooms and community conversations — premium UI,
              CodyChat-powered live rooms.
            </p>
          </div>
          <div>
            <div className="text-sm font-bold">Explore</div>
            <ul className="mt-3 space-y-2">
              {EXPLORE.map((link) => (
                <li key={link.href}>
                  <a href={link.href} className="text-sm opacity-55 hover:opacity-90">
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <div className="text-sm font-bold">Get started</div>
            <p className="mt-3 text-sm opacity-55">
              Guest access is the fastest path in. Registered accounts unlock
              direct messages and a permanent CodyChat bridge session.
            </p>
          </div>
        </div>
        <p className="mt-10 text-center text-[11px] opacity-40">
          © {new Date().getFullYear()} Yaarzo. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
