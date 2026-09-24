# Yaarzo Phase 1B.1 — Native CodyChat Guest Session

## Goal
Connect the existing Yaarzo interface to real CodyChat guest authentication and live room-member presence, without changing the current design or adding another database/auth system.

## Implementation
1. Add narrow same-origin server routes for guest login, session status, logout, and the current room member list. Each route will call only its fixed CodyChat endpoint; no caller-controlled upstream URL or generic proxy.
2. Bootstrap CodyChat's `PHPSESSID`, submit the exact form-encoded fields (`gusername`, `ggender`, `gbirth`, `recaptcha=disabled`), retain the returned `tc_userid`, `tc_utk`, and `tc_ssid`, and parse CodyChat's server-rendered session token only on the server.
3. Store the upstream cookie jar and request token inside one encrypted, authenticated, Secure, HttpOnly, SameSite=Lax, host-only Yaarzo cookie. Raw CodyChat credentials will never be returned to JavaScript or stored in browser-readable storage.
4. Add the existing-style guest dialog with nickname, gender, and required birth date. Show CodyChat's real success/error result in user-friendly wording and keep the user inside Yaarzo.
5. Restore guest state after refresh through the status route. Logout will call CodyChat's real `system/action/logout.php` with its request token, then clear the Yaarzo session cookie.
6. Poll the real `system/panel/user_list.php` using the preserved CodyChat session, parse only member fields CodyChat supplies, and render those users in the existing Room Members panel. No local or sample members.
7. Add `/chatroom` as the guest-chat path while preserving the current Yaarzo shell and `/` interface.

## Verified live requirements
- Birth date is required by the live guest form.
- reCAPTCHA is currently disabled (`recapt = 0`), so the required CodyChat value is `disabled`.
- Successful login returns `tc_userid`, `tc_utk`, and `tc_ssid` as Secure, HttpOnly, SameSite=None, path `/`, one-year cookies; the initial `PHPSESSID` is also Secure, HttpOnly, SameSite=None.
- Protected member-list and logout calls require the per-session `utk` value rendered after login.
- A real temporary guest was accepted, survived refresh, appeared in CodyChat's live member output when the token was supplied, and real logout cleared the session.

## Security and scope
- Generate and securely store one server-only encryption key for the Yaarzo session envelope.
- Validate and bound all browser input; forward only CodyChat's required form fields.
- Never log, expose, or place upstream cookies/tokens in React state, localStorage, URLs, or readable cookies.
- No permissive CORS, direct database access, CodyChat schema/encrypted-file changes, Supabase, registered login, rooms, or messages.

## Verification
- Run app checks and browser tests for logged-out state, validation failures, real guest login, refresh persistence, real member visibility, logout, and post-logout refresh.
- Use two isolated browser sessions to verify both real guests appear together without duplicates, then verify logout removal according to CodyChat polling behavior.
- Phase 1B.1 remains incomplete unless all real-server acceptance checks pass.
