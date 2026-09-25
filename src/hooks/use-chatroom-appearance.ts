import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";

import {
  applyChatroomDocumentTheme,
  msUntilNextAppearanceBoundary,
  readAppearancePreference,
  resolveAppearance,
  persistAppearancePreference,
  type AppearancePreference,
  type ResolvedAppearance,
  type YaarzoPaletteTheme,
} from "@/lib/chatroom-appearance";

export function useChatroomAppearance(paletteTheme: YaarzoPaletteTheme) {
  const [preference, setPreferenceState] = useState<AppearancePreference>("light");
  const [hydrated, setHydrated] = useState(false);
  const [autoTick, setAutoTick] = useState(0);

  useLayoutEffect(() => {
    const stored = readAppearancePreference();
    if (stored) setPreferenceState(stored);
    setHydrated(true);
  }, []);

  const resolvedAppearance: ResolvedAppearance = useMemo(
    () => resolveAppearance(preference),
    [preference, autoTick],
  );

  useLayoutEffect(() => {
    if (!hydrated) return;
    applyChatroomDocumentTheme(resolvedAppearance, paletteTheme);
  }, [hydrated, resolvedAppearance, paletteTheme]);

  useEffect(() => {
    if (preference !== "auto") return;

    const bump = () => setAutoTick((value) => value + 1);

    let timeoutId = window.setTimeout(function schedule() {
      bump();
      timeoutId = window.setTimeout(schedule, msUntilNextAppearanceBoundary());
    }, msUntilNextAppearanceBoundary());

    const intervalId = window.setInterval(bump, 60_000);

    return () => {
      window.clearTimeout(timeoutId);
      window.clearInterval(intervalId);
    };
  }, [preference]);

  const setAppearancePreference = useCallback(
    (next: AppearancePreference) => {
      setPreferenceState(next);
      persistAppearancePreference(next);
    },
    [],
  );

  return {
    appearancePreference: preference,
    resolvedAppearance,
    setAppearancePreference,
    hydrated,
  };
}
