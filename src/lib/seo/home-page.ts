export const HOME_SEO_TITLE =
  "Yaarzo – Free Online Chatrooms, Make Friends & Communities";

export const HOME_SEO_DESCRIPTION =
  "Join Yaarzo for free online chatrooms, make new friends, and discover live community conversations. Start as a guest or sign in to chat.";

export const HOME_SEO_CANONICAL = "https://yaarzo.com/";

export const HOME_SEO_H1 =
  "Free Online Chatrooms, Make Friends & Join Communities";

export function homeRouteHead() {
  return {
    meta: [
      { title: HOME_SEO_TITLE },
      { name: "description", content: HOME_SEO_DESCRIPTION },
      { property: "og:title", content: HOME_SEO_TITLE },
      { property: "og:description", content: HOME_SEO_DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: HOME_SEO_TITLE },
      { name: "twitter:description", content: HOME_SEO_DESCRIPTION },
    ],
    links: [{ rel: "canonical", href: HOME_SEO_CANONICAL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(buildHomeJsonLd()),
      },
    ],
  };
}

export function buildHomeJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        name: "Yaarzo",
        url: HOME_SEO_CANONICAL,
        description: HOME_SEO_DESCRIPTION,
      },
      {
        "@type": "Organization",
        name: "Yaarzo",
        url: HOME_SEO_CANONICAL,
      },
    ],
  };
}
