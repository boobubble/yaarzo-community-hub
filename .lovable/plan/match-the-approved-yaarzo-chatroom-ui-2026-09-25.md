# Match the approved Yaarzo chatroom UI

## Goal
Correct the current chatroom so it closely matches the approved references, without changing CodyChat guest login, sessions, real members, polling, or logout.

## Visual corrections
- Rebuild the desktop composition as the approved dense four-part shell: compact branded navigation, chat-first center, always-visible member roster on normal desktop widths, and profile space on wide desktop.
- Match the reference styling more closely: luminous Yaarzo mark, sharper navy panels, violet/pink active states, cyan/green status accents, thin glowing dividers, compact controls, and restrained glass depth.
- Replace the oversized patterned empty area with a cleaner premium chat surface while continuing to show no fake rooms, messages, members, profile details, counts, or radio data.
- Tighten typography, spacing, navigation groups, headers, member rows, and composer proportions to the approved density.
- Improve the current 770px preview and mobile layouts so chat stays primary, with navigation and real members available through drawers.
- Keep all three approved themes, but make each theme alter the complete shell treatment rather than only swapping colors.

## Preserved behavior
- Real CodyChat guest authentication and encrypted server-side session envelope.
- Real `user_list.php` member data and 30-second presence polling.
- Existing logout behavior and theme preference storage.
- No Supabase, Firebase, fake content, rooms/messages implementation, registered login, or CodyChat changes.

## Verification
- Compare fresh desktop and mobile screenshots against the supplied references.
- Verify all three themes, theme persistence, guest dialog, layout fit, and no browser errors.
- Confirm the preview build is healthy.
