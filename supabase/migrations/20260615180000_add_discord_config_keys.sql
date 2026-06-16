INSERT INTO contest_config (key, value) VALUES
  ('discord_client_id', '1516151956291190884')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

DROP POLICY IF EXISTS "contest_config_select" ON contest_config;
CREATE POLICY "contest_config_select" ON contest_config FOR SELECT
  USING (key NOT IN ('discord_client_secret'));
