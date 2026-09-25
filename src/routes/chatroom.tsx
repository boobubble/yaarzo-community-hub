import { createFileRoute } from "@tanstack/react-router";

import { YaarzoChat } from "@/components/chat/YaarzoChatApp";

export const Route = createFileRoute("/chatroom")({
  head: () => ({
    meta: [
      { title: "Yaarzo Chatroom — Live Community Chat" },
      { name: "description", content: "Join the live Yaarzo community chat as a CodyChat guest." },
      { property: "og:title", content: "Yaarzo Chatroom — Live Community Chat" },
      { property: "og:description", content: "Join the live Yaarzo community chat as a CodyChat guest." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: YaarzoChat,
});