# Financial Planner

End-to-end personal financial planning suite with a **web dashboard** (Next.js) and a **mobile app** (Expo/React Native), sharing a single calculation engine and state store.

---

## Features

- **Multi-profile portfolios** — manage and compare multiple investment portfolios side-by-side
- **Month-by-month simulation** — compound interest calculated at monthly granularity
- **Contributions** — SIPs (recurring, with annual step-up) and lumpsum investments
- **Withdrawals** — SWPs (recurring, with annual step-up) and one-time withdrawals
- **Goals** — year-specific withdrawal targets linked to specific investments
- **Rebalancing** — schedule transfers between investments on any date
- **Advanced return modes** — variable rates per time period per investment
- **Asset allocation chart** — live pie chart of equity/debt/other split
- **Year-by-year projection table** — opening, invested, withdrawn, growth, closing
- **Supabase auth** — email/password, secure token storage on mobile (iOS Keychain / Android Keystore)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Monorepo | [Turbo](https://turbo.build) + [pnpm workspaces](https://pnpm.io/workspaces) |
| Web | Next.js 15, React 19, Tailwind CSS, Recharts |
| Mobile | Expo SDK 53, React Native 0.79, Expo Router 4 |
| State | Zustand 5 + Immer |
| Backend | Supabase (Auth + Postgres + Row Level Security) |
| Shared types | `@financial-planner/types` (TypeScript only) |
| Shared logic | `@financial-planner/core` (calculation engine) |
| Shared store | `@financial-planner/store` (Zustand store) |
| Tests (web/core/store) | Vitest 3 + React Testing Library |
| Tests (mobile) | Jest + jest-expo + React Native Testing Library |
| E2E (web) | Playwright |
| Deploy (web) | Vercel |
| Deploy (mobile) | EAS Build (Expo Application Services) |

---

## Project Structure

```
financial-planner/
├── apps/
│   ├── web/                   # Next.js 15 dashboard
│   │   ├── src/app/           # App Router pages & layouts
│   │   ├── src/components/    # UI components
│   │   ├── src/lib/supabase/  # Supabase client (browser + server)
│   │   └── src/__tests__/     # Vitest unit + Playwright E2E
│   └── mobile/                # Expo React Native app
│       ├── src/app/           # Expo Router screens
│       ├── src/components/    # React Native components
│       ├── src/context/       # AuthContext
│       ├── src/lib/           # Supabase client (mobile)
│       └── src/__tests__/     # Jest tests
├── packages/
│   ├── types/                 # Shared TypeScript types
│   ├── core/                  # Portfolio calculation engine
│   └── store/                 # Zustand state store
├── turbo.json
└── pnpm-workspace.yaml
```

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  apps/web                        │
│  Next.js 15 · Server Components · Tailwind CSS  │
└──────────────────────┬──────────────────────────┘
                       │ uses
┌─────────────────────────────────────────────────┐
│                 apps/mobile                      │
│   Expo SDK 53 · React Native · Expo Router      │
└──────────────────────┬──────────────────────────┘
                       │ uses
          ┌────────────┼────────────┐
          ▼            ▼            ▼
   ┌────────────┐ ┌──────────┐ ┌─────────┐
   │  @fp/core  │ │ @fp/store│ │@fp/types│
   │ calculator │ │ Zustand  │ │  types  │
   └────────────┘ └──────────┘ └─────────┘
                       │
                  ┌────▼────┐
                  │Supabase │
                  │Auth+DB  │
                  └─────────┘
```

The **calculation engine** (`packages/core`) is pure TypeScript with no runtime dependencies — it takes a `Profile` + `GlobalSettings` and returns a complete `PortfolioTimeline`. Both apps call it locally; no network request needed.

The **store** (`packages/store`) is a Zustand store with Immer middleware. It holds all profiles and settings in memory, and derives the portfolio timeline on demand via selectors.

---

## Prerequisites

- **Node.js** >= 18
- **pnpm** >= 8 — `npm install -g pnpm`
- **Supabase account** — [supabase.com](https://supabase.com) (free tier works)
- **Expo account** (mobile only) — [expo.dev](https://expo.dev) (free)
- **EAS CLI** (mobile builds only) — `npm install -g eas-cli`

---

## Getting Started

### 1. Clone and install

```bash
git clone <repo-url> financial-planner
cd financial-planner
pnpm install
```

### 2. Set up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Settings → API** and copy your **Project URL** and **anon key**
3. In the **SQL Editor**, run the following migration:

```sql
-- App data table (one row per user, stores all portfolio JSON)
create table public.app_data (
  id uuid references auth.users(id) on delete cascade primary key,
  data jsonb not null default '{}',
  updated_at timestamptz default now()
);

-- Row Level Security
alter table public.app_data enable row level security;

create policy "Users can manage their own app data"
  on public.app_data for all using (auth.uid() = id);

-- Enable Realtime so edits on one device appear instantly on other devices
alter publication supabase_realtime add table public.app_data;
```

### 3. Configure environment variables

**Web app** — create `apps/web/.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

**Mobile app** — create `apps/mobile/.env`:
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## Development

### Web

```bash
# From repo root
pnpm dev

# Or target just the web app
cd apps/web && pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Mobile

```bash
cd apps/mobile
pnpm dev          # starts Metro bundler + Expo DevTools
```

Then press:
- `a` — open Android emulator
- `i` — open iOS simulator
- `s` — scan QR with Expo Go on your phone

> **Note:** `expo-secure-store` is included in Expo Go. For a fully standalone APK/IPA, see [Build & Deploy](#build--deploy).

---

## Testing

### Run all tests

```bash
# From repo root (runs all packages via Turbo)
pnpm test
```

### Per-package

```bash
# Core calculation engine
cd packages/core && pnpm test

# Zustand store
cd packages/store && pnpm test

# Web app (unit tests)
cd apps/web && pnpm test

# Web app (watch mode)
cd apps/web && pnpm test:watch

# Web app (with coverage)
cd apps/web && pnpm test:coverage

# Mobile
cd apps/mobile && pnpm test
```

### E2E (web only, requires a running dev server)

```bash
cd apps/web
pnpm test:e2e         # headless
pnpm test:e2e:ui      # with Playwright UI
```

### Coverage summary

| Package | Tests | What's covered |
|---|---|---|
| `packages/core` | ~20 | Calculator (SIP, SWP, lumpsum, goals, rebalancing, compound growth, error handling), date utils |
| `packages/store` | ~35 | Full CRUD for all 8 entity types, selectors, `loadFromData` |
| `apps/web` | ~17 suites | All page clients, all UI components, auth callback |
| `apps/mobile` | ~20 | `AuthContext` lifecycle, Login screen validation/submission, `ProfilePicker` interactions |

---

## Build & Deploy

### Web — Vercel

Connect your git repo at [vercel.com](https://vercel.com), add the two `NEXT_PUBLIC_*` env vars in project settings, and Vercel auto-deploys on every push to `main`.

Manual deploy:
```bash
cd apps/web && npx vercel --prod
```

### Mobile — EAS Build

**One-time setup (do this from `apps/mobile/`):**
```bash
eas login
eas build:configure   # links project, writes projectId into app.json

eas secret:create --name EXPO_PUBLIC_SUPABASE_URL    --value "https://..."
eas secret:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value "eyJ..."
```

**Build commands:**

| Target | Command | Output |
|---|---|---|
| Android APK (sideload, fastest) | `eas build --platform android --profile preview` | `.apk` download |
| Android AAB (Play Store) | `eas build --platform android --profile production` | `.aab` |
| iOS internal (requires Apple Dev account) | `eas build --platform ios --profile preview` | `.ipa` via TestFlight |
| iOS App Store | `eas build --platform ios --profile production` | App Store submission |

**Sideload Android APK (no Play Store needed):**
1. Download the `.apk` from the EAS build page (QR or direct link)
2. On your phone: **Settings → Apps → Special app access → Install unknown apps** → allow your browser
3. Open the downloaded `.apk` and install

---

## Key Concepts

### Portfolio Timeline Calculation

`calculatePortfolioTimeline(profile, settings)` simulates month by month:

1. Apply compound growth to each investment every month
2. Process SIP contributions (step-up applied at each year boundary)
3. Process lumpsum contributions scheduled in that month
4. Process SWP withdrawals (step-up applied at each year boundary)
5. Process one-time withdrawals scheduled in that month
6. At year-end: apply goal withdrawals, then rebalancing events
7. Aggregate into yearly `YearData` snapshots

Balances are clamped to 0 — the engine never goes negative but records an error for the shortfall.

### Return Modes

- **Basic** — single `annualReturn` % for all years
- **Advanced** — `variableReturns: [{ from, to, rate }]` periods; falls back to `annualReturn` when no period matches

### Profiles

A `Profile` is a self-contained portfolio (investments + all transactions). Multiple profiles can be viewed individually or merged into an "All Profiles" combined view via `selectAllProfilesMerged`.

---

## Environment Variables Reference

| Variable | App | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | web | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | web | Supabase public anon key |
| `EXPO_PUBLIC_SUPABASE_URL` | mobile | Supabase project URL |
| `EXPO_PUBLIC_SUPABASE_ANON_KEY` | mobile | Supabase public anon key |

> Both keys are safe to expose in client bundles — they are the **anon key** (not the service role key) and are protected by Row Level Security policies.
