-- ─────────────────────────────────────────────────────────────────────────────
-- Auto-create global_settings row when a new user signs up
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.global_settings (user_id, timeline_years, start_year)
  VALUES (
    NEW.id,
    30,
    EXTRACT(YEAR FROM NOW())::INTEGER
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger fires when Supabase Auth creates a new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
