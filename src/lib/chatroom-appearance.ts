export type AppearancePreference = "light" | "dark" | "auto";

export type ResolvedAppearance = "light" | "dark";

export type YaarzoPaletteTheme = "glass" | "cyber" | "neon" | "black";

export const APPEARANCE_STORAGE_KEY = "yaarzo-appearance";

export const PALETTE_THEME_STORAGE_KEY = "yaarzo-theme";

/** 07:00–18:59 local = light; 19:00–06:59 = dark */
export function isLocalDaytime(date = new Date()) {
  const hour = date.getHours();
  return hour >= 7 && hour < 19;
}

export function resolveAppearance(
  preference: AppearancePreference,
): ResolvedAppearance {
  if (preference === "dark") return "dark";
  if (preference === "light") return "light";
  return isLocalDaytime() ? "light" : "dark";
}

export function readAppearancePreference(): AppearancePreference | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(APPEARANCE_STORAGE_KEY);
  if (raw === "light" || raw === "dark" || raw === "auto") return raw;
  return null;
}

export function readPaletteTheme(): YaarzoPaletteTheme | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(PALETTE_THEME_STORAGE_KEY);
  if (raw === "glass" || raw === "cyber" || raw === "neon" || raw === "black") {
    return raw;
  }
  return null;
}

export function persistAppearancePreference(preference: AppearancePreference) {
  window.localStorage.setItem(APPEARANCE_STORAGE_KEY, preference);
}

/** Inline bootstrap — keep in sync with resolveAppearance / defaults. */
export function appearanceBootstrapScript() {
  return `(function(){try{var k=${JSON.stringify(APPEARANCE_STORAGE_KEY)};var v=localStorage.getItem(k);var r='light';if(v==='dark')r='dark';else if(v==='light')r='light';else if(v==='auto'){var h=new Date().getHours();r=(h>=7&&h<19)?'light':'dark';}document.documentElement.classList.add(r);document.documentElement.style.colorScheme=r;}catch(e){document.documentElement.classList.add('light');document.documentElement.style.colorScheme='light';}})();`;
}

export function msUntilNextAppearanceBoundary(now = new Date()) {
  const next = new Date(now);
  const hour = now.getHours();
  if (hour >= 7 && hour < 19) {
    next.setHours(19, 0, 0, 0);
  } else if (hour < 7) {
    next.setHours(7, 0, 0, 0);
  } else {
    next.setDate(next.getDate() + 1);
    next.setHours(7, 0, 0, 0);
  }
  return Math.max(1000, next.getTime() - now.getTime());
}

export function applyChatroomDocumentTheme(
  resolved: ResolvedAppearance,
  palette: YaarzoPaletteTheme,
) {
  const root = document.documentElement;
  root.classList.remove(
    "light",
    "dark",
    "theme-glass",
    "theme-cyber",
    "theme-neon",
    "theme-black",
  );
  root.classList.add(resolved, `theme-${palette}`);
  root.style.colorScheme = resolved;
}
