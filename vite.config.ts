// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { loadEnv, type ConfigEnv, type UserConfig } from "vite";

import {
  DEFAULT_CODYCHAT_ORIGIN,
  validateCodyChatOrigin,
} from "./src/lib/chat/cody-chat-origin";

const configure = ({ mode }: ConfigEnv) => {
  const env = loadEnv(mode, process.cwd(), "");
  const codyChatOrigin = validateCodyChatOrigin(
    env["YAARZO_CODYCHAT_ORIGIN"]?.trim() || DEFAULT_CODYCHAT_ORIGIN,
  );

  return {
    // The origin is public routing data, not a credential. Inject only its
    // allowlisted value so shared client media helpers match server requests.
    vite: {
      define: {
        __YAARZO_CODYCHAT_ORIGIN__: JSON.stringify(codyChatOrigin),
      },
    },
    tanstackStart: {
      // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
      // nitro/vite builds from this
      server: { entry: "server" },
    },
  } as UserConfig;
};

export default defineConfig(configure);
