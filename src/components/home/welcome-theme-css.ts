/** Homepage theme tokens (adapted from emergent-v2 welcome page). */
export const WELCOME_THEME_CSS = `
.welcome-root {
  --home-bg: #070713;
  --home-card: rgba(16, 16, 31, 0.92);
  --home-text: #ffffff;
  --home-text-muted: rgba(255, 255, 255, 0.70);
  --home-border: rgba(255, 255, 255, 0.07);
  --home-accent: #c4b5fd;
  background: var(--home-bg);
  color: var(--home-text);
}
.welcome-light {
  --home-bg: #f5f6fb;
  --home-card: #ffffff;
  --home-text: #0b0b1a;
  --home-text-muted: rgba(11, 11, 26, 0.72);
  --home-border: rgba(11, 11, 26, 0.10);
  --home-accent: #6d28d9;
  background: var(--home-bg) !important;
  color: var(--home-text) !important;
}
.welcome-card {
  background: var(--home-card);
  border-color: var(--home-border);
}
`;
