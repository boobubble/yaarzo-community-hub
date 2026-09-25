import { createFileRoute } from "@tanstack/react-router";

import { HomePage } from "@/components/home/HomePage";
import { homeRouteHead } from "@/lib/seo/home-page";

export const Route = createFileRoute("/")({
  head: () => homeRouteHead(),
  component: HomePage,
});
