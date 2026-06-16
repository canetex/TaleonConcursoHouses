-- Vincula o painel admin exclusivamente ao Discord ID do organizador (The Crusty).
INSERT INTO contest_config (key, value) VALUES
  ('admin_discord_ids', '434506189951205396')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();
