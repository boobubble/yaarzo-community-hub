# Yaarzo Phase 1 UI

## Source report
- **Framework and entry:** CodyChat is a PHP/MySQL and jQuery application. The readable page shell flows through `head_load.php`, `chat.php`, and `body_end.php`; `config.php` opens MySQL. The supplied root `index.php` is only a deny stub, so the original deployed entry/bootstrap is not fully present.
- **Current behavior locations:** `head_load.php` selects the login screen and loads logged-in assets. `chat.php` contains the room header, main chat, private-message panel, left room/menu panel, and right user panel. `function_login.js` and `function_logged.js` drive login/guest UI calls; `function_main.js` drives room/chat/user refreshes and responsive panels. Server actions such as `action_chat.php`, `action_room.php`, `action_users.php`, `login.php`, and `registration.php` are ionCube-encrypted.
- **Data:** The source expects CodyChat's MySQL database and PHP session/rank helpers. No SQL schema or existing record export was uploaded.
- **Phase 1 limitation:** The original PHP endpoints, authentication, real rooms, messages, online state, and calls cannot run inside this TanStack preview. Phase 1 can faithfully recreate the requested UI shell and responsive interactions, but it must show honest unavailable/empty states rather than fake persisted data. No backend or database work will be done.

## Implementation
1. Replace the blank home screen with a dark Yaarzo chat workspace: branded social navigation on the left, CodyChat-shaped room/chat area in the center, and members/profile space on the right.
2. Add mobile navigation, room-list and member-panel drawers, while keeping the chat composer and user actions touch-friendly.
3. Make unavailable social destinations selectable UI placeholders, with no fake persistence or invented backend behavior.
4. Use the existing design controls and semantic colors, plus a small set of suitable bundled CodyChat visual assets where they strengthen the interface.
5. Add page metadata and verify the main screen at desktop and mobile sizes.

## Files to change
- `src/routes/index.tsx` — Phase 1 Yaarzo screen and interactions.
- `src/styles.css` — Yaarzo dark navy, blue and purple design tokens and page styling.
- Selected asset pointers under `src/assets/` only if suitable CodyChat imagery is used.

## Preserved scope
- No admin panel.
- No database, authentication replacement, storage, realtime, migrations, or Cloud integration.
- No claim that PHP/MySQL behavior is running in this preview.
