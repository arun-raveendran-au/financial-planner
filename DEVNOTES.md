# Developer Checklist — Financial Planner

A step-by-step guide for getting everything running when you're back at the laptop.
Work through each section top-to-bottom; tick off items as you go.

---

## 1. Get the latest code onto your machine

> Do this first every time you sit down to work.

```bash
# If you haven't cloned the repo yet:
git clone https://github.com/arun-raveendran-au/financial-planner.git
cd financial-planner

# If you already have it cloned, just pull the latest:
git fetch origin
git checkout claude/explain-codebase-mqzQT
git pull origin claude/explain-codebase-mqzQT
```

Then install all dependencies (this reads `pnpm-lock.yaml` and installs everything):

```bash
pnpm install
```

> **What is pnpm?** It's like npm but faster and smarter about sharing packages between
> the web and mobile apps. If the command isn't found, install it first:
> `npm install -g pnpm`

---

## 2. Set up Supabase (backend + auth)

Supabase is the free backend-as-a-service that handles user accounts.

### 2a. Create a Supabase project
1. Go to [supabase.com](https://supabase.com) and sign in (free account)
2. Click **New project**
3. Pick a name (e.g. `financial-planner`) and a strong database password — save the password somewhere
4. Choose a region close to you
5. Wait ~2 minutes for it to provision

### 2b. Run the database migration
1. In your Supabase project dashboard, click **SQL Editor** in the left sidebar
2. Click **New query**
3. Paste and run this SQL:

```sql
-- Stores all portfolio data (investments, SIPs, goals, etc.) per user
create table public.app_data (
  id uuid references auth.users(id) on delete cascade primary key,
  data jsonb not null default '{}',
  updated_at timestamptz default now()
);

-- Row Level Security: each user can only see their own data
alter table public.app_data enable row level security;

create policy "Users can manage their own app data"
  on public.app_data for all using (auth.uid() = id);
```

4. Click **Run** — you should see "Success. No rows returned"

### 2c. Get your API keys
1. In the left sidebar go to **Settings → API**
2. Copy:
   - **Project URL** — looks like `https://abcdefghijk.supabase.co`
   - **anon public** key — a long string starting with `eyJ...`

---

## 3. Set up environment variables

These are secret config values the apps need to connect to Supabase.
Never commit `.env` files to git (they're already in `.gitignore`).

### Web app
Create a file at `apps/web/.env.local` with this content (replace with your actual values):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJyour-long-anon-key-here
```

### Mobile app
Create a file at `apps/mobile/.env` with the same values:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJyour-long-anon-key-here
```

---

## 4. Run the web app locally

```bash
# From the repo root — starts both the web app and any packages it depends on
pnpm dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

You should see a login page. Create an account via "Sign up" and explore the dashboard.

> **Troubleshooting:** If you see "Invalid Supabase URL" or auth errors, double-check
> your `.env.local` values in step 3.

---

## 5. Run the mobile app locally

You'll use **Expo Go** on your phone — no need to compile a native app just for development.

### 5a. Install Expo Go on your phone
- iPhone: [App Store — Expo Go](https://apps.apple.com/app/expo-go/id982107779)
- Android: [Play Store — Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent)

### 5b. Start the Metro bundler

```bash
cd apps/mobile
pnpm dev
```

A QR code will appear in your terminal. Scan it:
- **iPhone**: open Camera app, point at QR, tap the banner
- **Android**: open Expo Go app, tap "Scan QR code"

> **Same Wi-Fi required:** your phone and laptop must be on the same Wi-Fi network,
> otherwise the QR code won't connect.

### 5c. Keyboard shortcuts (in the terminal where Metro is running)
- `a` — open in Android emulator (requires Android Studio installed)
- `i` — open in iOS simulator (macOS + Xcode only)
- `r` — reload the app
- `m` — toggle the developer menu

---

## 6. Run the test suite

Verify everything passes after pulling:

```bash
# Run all tests across all packages at once
pnpm test

# Or run per-package:
cd packages/core  && pnpm test   # calculation engine tests (~20 tests)
cd packages/store && pnpm test   # Zustand store tests (~35 tests)
cd apps/web       && pnpm test   # web component + integration tests (~17 suites)
cd apps/mobile    && pnpm test   # React Native tests (~20 tests)
```

All tests should pass (green). If any fail, check the error message — it usually
points to the exact file and line number.

---

## 7. Deploy the web app to Vercel

> Do this once. After that, every push to your branch auto-deploys.

### 7a. Connect the repo
1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **Add New → Project**
3. Import your GitHub repo `arun-raveendran-au/financial-planner`
4. Vercel will auto-detect it as a Turbo monorepo — accept the defaults

### 7b. Add environment variables in Vercel
1. In the project settings, go to **Settings → Environment Variables**
2. Add these two (for all environments: Production, Preview, Development):
   - `NEXT_PUBLIC_SUPABASE_URL` → your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` → your Supabase anon key
3. Click **Save**

### 7c. Trigger a deploy
1. Go to the **Deployments** tab
2. Click the three-dot menu on the latest deployment → **Redeploy**
3. Watch the build logs — should complete in ~2 minutes
4. Click the live URL to verify it works

---

## 8. Build and install the mobile app (standalone APK for Android)

> Do this when you want a real app on your phone, not just Expo Go.

### 8a. One-time EAS setup

```bash
# Install the EAS command-line tool globally
npm install -g eas-cli

# Log in to your Expo account (create one free at expo.dev if needed)
eas login

# From the apps/mobile directory, link the project
cd apps/mobile
eas build:configure     # follow prompts, accept defaults

# Store Supabase credentials as build-time secrets
# (replaces the .env file for production builds)
eas secret:create --name EXPO_PUBLIC_SUPABASE_URL    --value "https://your-project.supabase.co"
eas secret:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "eyJyour-key"
```

### 8b. Build an Android APK (free, no Play Store account needed)

```bash
cd apps/mobile
eas build --platform android --profile preview
```

- This runs in Expo's cloud — you don't need Android Studio
- Takes ~5–10 minutes
- When done, you'll get a download link and a QR code

### 8c. Install the APK on your Android phone
1. Open the download link on your phone (or scan the QR)
2. Before installing: go to **Settings → Apps → Special app access → Install unknown apps**
   → tap your browser → enable "Allow from this source"
3. Open the downloaded `.apk` file and tap **Install**

> **iPhone?** iOS requires an Apple Developer account ($99/year) to install outside
> the App Store. For now, stick with Expo Go on iOS.

---

## 9. Supabase auth settings (important for production)

### 9a. Add your web URL to the allow-list
1. In Supabase dashboard → **Authentication → URL Configuration**
2. **Site URL**: set to your Vercel URL, e.g. `https://financial-planner.vercel.app`
3. **Redirect URLs**: add `https://financial-planner.vercel.app/auth/callback`
4. Also add `http://localhost:3000/auth/callback` for local development
5. Click **Save**

### 9b. Enable Email auth
1. **Authentication → Providers → Email** — should already be enabled
2. Turn off "Confirm email" if you want instant sign-in during development
   (turn it back on for production)

---

## 10. Remaining project work (future tasks)

These are features that exist in the UI but the backend sync is not yet wired up:

- [ ] **Save/load data to Supabase** — right now portfolio data lives only in memory
  (Zustand store). If you refresh the page or reinstall the app, data is lost.
  Need to add: save to `app_data` table on every store change, load from it on login.

- [ ] **Multi-device sync** — once data is persisted to Supabase, users can log in
  from any device and see the same portfolios.

- [ ] **Export to PDF / CSV** — the yearly projection table would be useful exported.

- [ ] **Push notifications for goals** — alert users when a goal year approaches.

- [ ] **iOS standalone build** — requires enrolling in Apple Developer Program ($99/year).
  Currently iOS users can only use Expo Go.

- [ ] **Dark mode** — the UI is light-only right now.

- [ ] **Onboarding flow** — a guided first-run experience explaining SIPs, goals, etc.
  would help new users who aren't finance-savvy.

---

## Quick reference — most-used commands

```bash
pnpm install          # install / update dependencies
pnpm dev              # start web (localhost:3000) + watch packages
pnpm test             # run all tests
pnpm type-check       # TypeScript type check across all packages
pnpm build            # production build (same as Vercel runs)

cd apps/mobile
pnpm dev              # start Expo Metro bundler (scan QR with Expo Go)

cd apps/mobile
eas build --platform android --profile preview   # build Android APK
```

---

## Glossary (for novice reference)

| Term | What it means |
|---|---|
| **pnpm** | Package manager (like npm). Installs JavaScript libraries. |
| **monorepo** | One git repo containing multiple apps/packages |
| **Turbo** | Build tool that runs tasks (build, test) across the monorepo efficiently |
| **Supabase** | Hosted Postgres database + authentication service (free tier available) |
| **Expo Go** | Phone app that lets you run your React Native app without compiling |
| **EAS** | Expo Application Services — builds a real iOS/Android app in the cloud |
| **Vitest** | Fast test runner for the web app and packages |
| **Jest** | Test runner for the mobile app |
| **Vercel** | Hosting platform for the web app (free tier, auto-deploy from GitHub) |
| **env vars** | Secret config values stored in `.env` files, never committed to git |
| **lockfile** | `pnpm-lock.yaml` — records exact package versions so installs are reproducible |
