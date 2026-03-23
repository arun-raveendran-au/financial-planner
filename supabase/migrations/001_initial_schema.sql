-- ─────────────────────────────────────────────────────────────────────────────
-- Financial Planner — Initial Schema
-- ─────────────────────────────────────────────────────────────────────────────
-- Security model:
--   - Every table has a user_id column referencing auth.users(id)
--   - Row Level Security (RLS) enforced on every table:
--     Users can ONLY read/write their own rows, enforced at the DB level.
--   - Profiles are the top-level owned entity; all child tables reference profiles
-- ─────────────────────────────────────────────────────────────────────────────

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────────────────────────────────────
-- global_settings
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS global_settings (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  timeline_years  INTEGER NOT NULL DEFAULT 30 CHECK (timeline_years BETWEEN 1 AND 100),
  start_year      INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM NOW())::INTEGER,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id) -- one settings row per user
);

ALTER TABLE global_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_settings" ON global_settings
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- profiles
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 100),
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_profiles" ON profiles
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_profiles_user_id ON profiles(user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- investments
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TYPE return_type AS ENUM ('basic', 'advanced');

CREATE TABLE IF NOT EXISTS investments (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 200),
  asset_class     TEXT NOT NULL DEFAULT 'Equity',
  annual_return   NUMERIC(8,4) NOT NULL DEFAULT 12 CHECK (annual_return >= 0),
  return_type     return_type NOT NULL DEFAULT 'basic',
  variable_returns JSONB NOT NULL DEFAULT '[]',
  -- variable_returns: [{from: int, to: int, rate: float}]
  sort_order      INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE investments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_investments" ON investments
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_investments_profile_id ON investments(profile_id);
CREATE INDEX idx_investments_user_id    ON investments(user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- transactions (SIPs, SWPs, lumpsums, one-time withdrawals)
-- Using a single table with a type discriminator for simpler queries
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TYPE transaction_type AS ENUM ('sip', 'lumpsum', 'swp', 'one_time_withdrawal');
CREATE TYPE frequency_type   AS ENUM ('Monthly', 'Yearly');

CREATE TABLE IF NOT EXISTS transactions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id      UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  investment_id   UUID NOT NULL REFERENCES investments(id) ON DELETE CASCADE,
  tx_type         transaction_type NOT NULL,
  amount          NUMERIC(18,2) NOT NULL CHECK (amount >= 0),

  -- Recurring only (SIP / SWP)
  start_date      DATE,
  duration_years  INTEGER CHECK (duration_years IS NULL OR duration_years > 0),
  frequency       frequency_type,
  step_up_percent NUMERIC(6,4) DEFAULT 0 CHECK (step_up_percent IS NULL OR step_up_percent >= 0),

  -- One-time only (lumpsum / one_time_withdrawal)
  tx_date         DATE,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure recurring fields are set for SIP/SWP, date field for one-time
  CONSTRAINT chk_recurring_fields CHECK (
    (tx_type IN ('sip', 'swp') AND start_date IS NOT NULL AND duration_years IS NOT NULL AND frequency IS NOT NULL)
    OR
    (tx_type IN ('lumpsum', 'one_time_withdrawal') AND tx_date IS NOT NULL)
  )
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_transactions" ON transactions
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_transactions_profile_id    ON transactions(profile_id);
CREATE INDEX idx_transactions_investment_id ON transactions(investment_id);
CREATE INDEX idx_transactions_user_id       ON transactions(user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- goals
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS goals (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id  UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL CHECK (length(name) BETWEEN 1 AND 200),
  target_year INTEGER NOT NULL CHECK (target_year > 1900 AND target_year < 2200),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_goals" ON goals
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_goals_profile_id ON goals(profile_id);
CREATE INDEX idx_goals_user_id    ON goals(user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- goal_withdrawals
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS goal_withdrawals (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id         UUID NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  investment_id   UUID NOT NULL REFERENCES investments(id) ON DELETE CASCADE,
  amount          NUMERIC(18,2) NOT NULL CHECK (amount >= 0),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE goal_withdrawals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_goal_withdrawals" ON goal_withdrawals
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_goal_withdrawals_goal_id ON goal_withdrawals(goal_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- rebalancing_events
-- ─────────────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rebalancing_events (
  id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  profile_id          UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_date          DATE NOT NULL,
  amount              NUMERIC(18,2) NOT NULL CHECK (amount > 0),
  from_investment_id  UUID NOT NULL REFERENCES investments(id) ON DELETE CASCADE,
  to_investment_id    UUID NOT NULL REFERENCES investments(id) ON DELETE CASCADE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT chk_different_investments CHECK (from_investment_id != to_investment_id)
);

ALTER TABLE rebalancing_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_own_rebalancing_events" ON rebalancing_events
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_rebalancing_profile_id ON rebalancing_events(profile_id);
CREATE INDEX idx_rebalancing_user_id    ON rebalancing_events(user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- Auto-update updated_at trigger
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_global_settings_updated_at   BEFORE UPDATE ON global_settings   FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at          BEFORE UPDATE ON profiles          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_investments_updated_at       BEFORE UPDATE ON investments       FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at      BEFORE UPDATE ON transactions      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_goals_updated_at             BEFORE UPDATE ON goals             FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_rebalancing_events_updated_at BEFORE UPDATE ON rebalancing_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
