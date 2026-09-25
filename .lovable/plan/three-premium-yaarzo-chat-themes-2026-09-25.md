# Three Premium Yaarzo Chat Themes

## What will change
- Polish the existing chatroom to closely match the supplied neon Yaarzo references without changing its navigation, guest login, live roster, or logout behavior.
- Add three user-selectable themes based on the approved directions: Premium Glass, Cyberpunk, and Neon Glass.
- Add a compact theme switcher in the existing shell and remember the choice on that browser.
- Keep the center chat widest, members compact, and profile space visible on larger screens; retain current mobile drawers.

## Visual system
- Use Sora for headings and Manrope for body text.
- Combine royal blue, electric violet, magenta, cyan, and emerald accents over deep navy.
- Theme differences will come from surface depth, accent balance, border glow, and selected-state treatment—not different functionality or content.
- Keep effects restrained and readable: thin borders, small radii, fast hover transitions, and reduced-motion support.

## Technical details
- Define all three palettes through semantic CSS variables so existing UI components inherit each theme safely.
- Apply the selected theme at the Yaarzo shell level and store only the visual preference in browser storage after hydration.
- Use the existing Button controls and current responsive layout; no new backend, account, sample chat data, or CodyChat changes.
- Update the root font loading for Sora while preserving Manrope.

## Verification
- Check theme switching and persistence after refresh.
- Check the existing guest login, live CodyChat members, and logout controls remain wired as before.
- Inspect desktop and mobile screenshots for clipping, overlap, contrast, and chat-first proportions.
- Confirm the preview build is healthy.