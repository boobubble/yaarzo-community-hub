# Yaarzo Community Hub

Project: Yaarzo — CodyChat-based community chat

Is project ko scratch se shuru karo. CodyChat ki ZIP file ko source of truth maan kar uska existing code, folder structure, database requirements, login flow, chatrooms, messages, online users aur assets inspect karo. ZIP ke actual code ko samjhe bina replacement app ya naya chat backend mat banao.

PHASE 1 — CodyChat UI modification only

Abhi sirf CodyChat ko modify karke Yaarzo-style interface banao. Attached screenshot ko visual reference ke roop mein use karo:

- Desktop par left sidebar mein Yaarzo branding, search aur social navigation ho: Home, Feed, Trending, Find Friends, Chatrooms, Poetry/Shayari, Competitions, Confessions, Live Arena, Leaderboard, Friend Requests, Notifications aur Direct Messages.

- Beech mein CodyChat ka existing room/chat experience rahe.

- Right side par room members/online users aur profile/highlights ke liye space ho, jahan CodyChat ke existing data ko reuse kiya ja sake.

- Mobile par responsive layout ho: navigation drawer/menu, room list, chat view aur user actions mobile-friendly hon.

- Yaarzo ka dark navy, blue aur purple visual style screenshot se inspire ho. Existing CodyChat functionality ko bina zarurat na todo.

- Jo social screens CodyChat ZIP mein available nahi hain, unhe abhi sirf UI navigation/placeholders ke roop mein dikhana. Unke liye fake backend, fake data persistence ya Supabase integration mat banana.

- CodyChat ke existing login aur guest flows ko pehle inspect karo. Unhe tabhi modify karo jab UI ke liye zaroori ho; existing auth behavior ko bina wajah replace mat karo.

- Koi admin panel is phase mein nahi banana.

STRICT SCOPE:

- Supabase ko bilkul avoid karo: package, SDK, URL/key, auth, database, storage, realtime, Edge Functions, migrations ya Supabase-related configuration add mat karo.

- Phase 1 mein CodyChat ZIP ke existing backend aur data model ke saath kaam karo. Agar kisi change ke liye backend/database modification zaroori lage, pehle usse clearly report karo; Supabase ya alternate backend introduce mat karo.

- Phase 2 mein hum apna Supabase denge aur uski requirements alag se denge.

- Phase 3 mein admin panel banega; abhi uska kaam mat karo.

Pehle ZIP ko inspect karke short report do:

1. Kaunsa framework/language aur app entry point hai?

2. CodyChat ka current UI, auth, rooms aur chat data kahan handle hote hain?

3. Phase 1 mein kaunse files modify karoge?

4. Kya koi requested UI feature existing CodyChat code se possible nahi hai?

Uske baad Phase 1 UI changes implement karo. ZIP ke original files ka backup rakho ya changes ko clearly identifiable rakho. End mein changed files, CodyChat ke preserved behavior, Supabase exclusion, aur basic verification/build result report karo.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/33b808bf-bbce-4988-a506-0113090edacd).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
