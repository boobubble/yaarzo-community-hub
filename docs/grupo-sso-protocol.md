# Yaarzo to Grupo PHP SSO protocol (v1)

Status: Yaarzo issuer implementation scaffolded; Grupo receiver not implemented or deployed.
This protocol is for registered Yaarzo accounts. Guest login remains a separate flow.

## Trust model

- Yaarzo Supabase Auth is the identity provider.
- The immutable Supabase Auth UUID (sub) is the only account-linking key.
- Grupo must persist a unique mapping from sub to its native site_users.user_id.
- Do not auto-link accounts by email, display name, or username.
- The email claim is included only after Supabase confirms the email. It may be used to provision a new Grupo account, but never to claim or link an existing Grupo account automatically.
- The browser receives only a short-lived signed assertion. It never receives the shared signing key or Supabase service-role key.

## Browser launch

1. Browser calls same-origin POST /api/chat/grupo-sso with the current Supabase access token in Authorization: Bearer ...
2. Yaarzo verifies that token with Supabase Auth, requires a non-anonymous account with a confirmed email, and reads profiles.username.
3. Yaarzo returns receiverUrl, ticket, and expiresIn.
4. Browser submits a form by POST to the returned receiver URL with one field: ticket.
5. Grupo verifies and consumes the ticket, establishes a native Grupo login session, then redirects to its chatroom.

The receiver URL is fixed to:
https://chatroom-origin.yaarzo.com/sso/consume.php

## JWT contract

Algorithm: HS256.

Required claims:
- iss: https://www.yaarzo.com
- aud: chatroom-origin.yaarzo.com (must match receiver config)
- sub: Supabase Auth UUID; immutable identity key
- preferred_username: current Yaarzo profile username; display only, not a linking key
- email: Supabase-confirmed email address; provisioning data only
- email_verified: true; Yaarzo emits this only when Supabase has confirmed the email
- iat: issued-at Unix seconds
- exp: expiry, exactly 60 seconds after issuance
- jti: cryptographically random UUID; one-time replay identifier

Yaarzo environment variables:
- GRUPO_SSO_SHARED_SECRET: random secret with at least 32 bytes; same value configured privately on Grupo
- GRUPO_SSO_AUDIENCE: defaults to chatroom-origin.yaarzo.com; Grupo must use the exact same audience
- GRUPO_SSO_CONSUME_URL: optional; if set, must still be the exact approved HTTPS receiver URL
- Existing VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY

## Mandatory Grupo receiver behavior

The PHP receiver must:
1. Accept POST only, enforce a small request-body limit, and require a single compact JWT ticket.
2. Verify HS256 using a constant-time signature comparison and the shared secret.
3. Require exact issuer and audience; reject missing/invalid claims, future iat, expired exp, and tickets older than 60 seconds.
4. Atomically insert/consume jti in a replay store with a unique constraint. A check-then-insert without a unique constraint is not sufficient.
5. Resolve the account using sub in a dedicated Yaarzo↔Grupo mapping. Never use email/username to silently claim an existing Grupo account.
6. For an existing mapping, verify that the mapped Grupo user is active and approved before login.
7. For a first-time identity, create the Grupo account through Grupo's native user-creation helper, using the verified email and a cryptographically random password that is never returned or stored by Yaarzo. If that email already belongs to an unmapped Grupo account, fail closed and require an explicit account-linking process; do not claim it automatically.
8. Persist the sub-to-user mapping transactionally. If safe native provisioning is not yet understood on the installed version, fail closed; do not guess at password hashes or insert arbitrary site_users rows.
9. Create the native Grupo login_sessions record through the supported native session lifecycle, then set the exact native cookies expected by Grupo.
10. Set cookies Secure, HttpOnly where compatible with Grupo's client, SameSite=Lax, and appropriate Path/Domain; do not expose session secrets in HTML or URLs.
11. Redirect only to a fixed local chatroom path (for example /chatroom/); never accept an arbitrary external redirect from the browser.
12. Return generic errors and log a correlation ID, not the JWT, secret, access token, or personal data.

## Deployment boundary

This protocol document and Yaarzo issuer code do not install or enable the PHP receiver. Until the receiver is implemented and configured, registered-user SSO is intentionally unavailable. No VPS, Grupo files, database, Supabase schema, secrets, or deployment are changed by this repository work.
