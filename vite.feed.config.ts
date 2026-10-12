import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],

  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },

  resolve: { tsconfigPaths: true },
  build: {
    emptyOutDir: true,
    lib: {
      entry: "src/feed-island/feed-island.tsx",
      formats: ["es"],
      fileName: () => "feed.js",
    },
    outDir: "dist-feed-island",
    target: "es2022",
  },
});