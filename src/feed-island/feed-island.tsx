/* eslint-disable react-refresh/only-export-components -- library entry intentionally exports its mount API */
import { createRoot, type Root } from "react-dom/client";

import { FeedWorkspace } from "@/components/feed/FeedWorkspace";
import { useProfilesDirectory } from "@/lib/profiles/use-profiles-directory";

import { configureFeedBridge, supabase } from "@/lib/feed/feed-bridge";

import islandStyles from "./styles.css?inline";

export type FeedIslandOptions = {
  darkMode?: boolean;
  sessionEndpoint?: string;
};

type MountedFeed = {
  root: Root;
  wrapper: HTMLDivElement;
};

const mountedFeeds = new WeakMap<HTMLElement, MountedFeed>();

function FeedIsland() {
  const { profiles } = useProfilesDirectory(true, supabase);
  return <FeedWorkspace profiles={profiles} />;
}

function applyTheme(wrapper: HTMLElement, darkMode: boolean) {
  wrapper.classList.toggle("dark", darkMode);
  wrapper.dataset["theme"] = darkMode ? "dark" : "light";
}

export function mountFeed(container: HTMLElement, options: FeedIslandOptions = {}) {
  unmountFeed(container);
  configureFeedBridge(options.sessionEndpoint);

  const shadow = container.shadowRoot ?? container.attachShadow({ mode: "open" });
  shadow.replaceChildren();

  const style = document.createElement("style");
  style.textContent = islandStyles;

  const wrapper = document.createElement("div");
  wrapper.className = "yaarzo-feed-island";
  applyTheme(wrapper, options.darkMode === true);

  shadow.append(style, wrapper);
  const root = createRoot(wrapper);
  root.render(<FeedIsland />);
  mountedFeeds.set(container, { root, wrapper });

  return () => unmountFeed(container);
}

export function setFeedTheme(container: HTMLElement, darkMode: boolean) {
  const mounted = mountedFeeds.get(container);
  if (mounted) applyTheme(mounted.wrapper, darkMode);
}

export function unmountFeed(container: HTMLElement) {
  const mounted = mountedFeeds.get(container);
  if (!mounted) return;
  mounted.root.unmount();
  configureFeedBridge();
  mountedFeeds.delete(container);
  container.shadowRoot?.replaceChildren();
}
