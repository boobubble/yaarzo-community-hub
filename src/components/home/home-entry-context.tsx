import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from "react";

export type HomeJoinView = "choice" | "guest" | "signin" | "signup";

type HomeEntryContextValue = {
  openJoin: (view: HomeJoinView) => void;
  tryEnterChatroom: (view?: HomeJoinView) => void | Promise<void>;
};

const HomeEntryContext = createContext<HomeEntryContextValue | null>(null);

export function HomeEntryProvider({
  children,
  openJoin,
  tryEnterChatroom,
}: {
  children: ReactNode;
  openJoin: (view: HomeJoinView) => void;
  tryEnterChatroom: (view?: HomeJoinView) => void | Promise<void>;
}) {
  const value = useMemo(
    () => ({ openJoin, tryEnterChatroom }),
    [openJoin, tryEnterChatroom],
  );
  return (
    <HomeEntryContext.Provider value={value}>{children}</HomeEntryContext.Provider>
  );
}

export function useHomeEntry() {
  const ctx = useContext(HomeEntryContext);
  if (!ctx) {
    throw new Error("useHomeEntry must be used within HomeEntryProvider");
  }
  return ctx;
}

export function useHomeEntryOptional() {
  return useContext(HomeEntryContext);
}

/** Join-intent control styled like a link or button. */
export function HomeChatroomCta({
  children,
  className = "",
  view = "choice",
}: {
  children: ReactNode;
  className?: string;
  view?: HomeJoinView;
}) {
  const ctx = useHomeEntryOptional();
  const onClick = useCallback(() => {
    if (ctx) {
      void Promise.resolve(ctx.tryEnterChatroom(view));
      return;
    }
    window.location.href = "/chatroom";
  }, [ctx, view]);

  return (
    <button type="button" className={className} onClick={onClick}>
      {children}
    </button>
  );
}
