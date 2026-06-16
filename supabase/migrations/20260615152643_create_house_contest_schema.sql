-- Contest users (Discord OAuth)
CREATE TABLE IF NOT EXISTS contest_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discord_id TEXT NOT NULL UNIQUE,
  discord_username TEXT,
  discord_avatar TEXT,
  validated_character TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$ BEGIN
  CREATE TYPE house_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE vote_type AS ENUM ('match', 'dislike');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS houses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discord_user_id TEXT NOT NULL REFERENCES contest_users(discord_id) ON DELETE CASCADE,
  character_name TEXT NOT NULL,
  location TEXT NOT NULL,
  floor TEXT NOT NULL,
  custom_name TEXT NOT NULL,
  theme TEXT NOT NULL,
  dummies_count INTEGER NOT NULL DEFAULT 0 CHECK (dummies_count >= 0),
  hirelings_count INTEGER NOT NULL DEFAULT 0 CHECK (hirelings_count >= 0),
  screenshot_urls TEXT[] NOT NULL DEFAULT '{}',
  status house_status NOT NULL DEFAULT 'pending',
  organizer_votes INTEGER NOT NULL DEFAULT 0 CHECK (organizer_votes >= 0),
  honorable_mention BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (discord_user_id),
  UNIQUE (character_name)
);

CREATE TABLE IF NOT EXISTS house_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discord_user_id TEXT NOT NULL,
  voter_character TEXT NOT NULL,
  house_id UUID NOT NULL REFERENCES houses(id) ON DELETE CASCADE,
  vote_type vote_type NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (discord_user_id, house_id)
);

CREATE TABLE IF NOT EXISTS contest_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO contest_config (key, value) VALUES
  ('registration_start', '2026-06-15T00:00:00Z'),
  ('registration_end', '2026-06-30T00:00:00Z'),
  ('validation_end', '2026-07-02T00:00:00Z'),
  ('voting_end', '2026-07-17T00:00:00Z'),
  ('admin_discord_ids', '1516151956291190884')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

CREATE OR REPLACE VIEW house_leaderboard AS
WITH match_counts AS (
  SELECT house_id, COUNT(*) FILTER (WHERE vote_type = 'match') AS total_matches
  FROM house_votes
  GROUP BY house_id
),
utility_ranked AS (
  SELECT id,
    ROW_NUMBER() OVER (ORDER BY (dummies_count + hirelings_count) DESC) AS utility_rank
  FROM houses WHERE status = 'approved'
),
scored AS (
  SELECT
    h.id,
    h.custom_name,
    h.theme,
    h.location,
    h.character_name,
    h.dummies_count,
    h.hirelings_count,
    h.organizer_votes,
    h.honorable_mention,
    h.screenshot_urls,
    COALESCE(mc.total_matches, 0) AS total_matches,
    FLOOR(COALESCE(mc.total_matches, 0)::numeric / 5) AS popular_points,
    (h.organizer_votes * 2) AS organizer_points,
    CASE
      WHEN ur.utility_rank = 1 THEN 2
      WHEN ur.utility_rank = 2 THEN 1
      ELSE 0
    END AS utility_bonus,
    FLOOR(COALESCE(mc.total_matches, 0)::numeric / 5)
      + (h.organizer_votes * 2)
      + CASE WHEN ur.utility_rank = 1 THEN 2 WHEN ur.utility_rank = 2 THEN 1 ELSE 0 END
      AS total_points
  FROM houses h
  LEFT JOIN match_counts mc ON mc.house_id = h.id
  LEFT JOIN utility_ranked ur ON ur.id = h.id
  WHERE h.status = 'approved'
)
SELECT * FROM scored ORDER BY total_points DESC, total_matches DESC;

ALTER TABLE contest_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE houses ENABLE ROW LEVEL SECURITY;
ALTER TABLE house_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE contest_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "contest_users_select" ON contest_users;
DROP POLICY IF EXISTS "contest_users_insert" ON contest_users;
DROP POLICY IF EXISTS "contest_users_update" ON contest_users;
DROP POLICY IF EXISTS "houses_select" ON houses;
DROP POLICY IF EXISTS "houses_insert" ON houses;
DROP POLICY IF EXISTS "houses_update" ON houses;
DROP POLICY IF EXISTS "house_votes_select" ON house_votes;
DROP POLICY IF EXISTS "house_votes_insert" ON house_votes;
DROP POLICY IF EXISTS "house_votes_update" ON house_votes;
DROP POLICY IF EXISTS "contest_config_select" ON contest_config;

CREATE POLICY "contest_users_select" ON contest_users FOR SELECT USING (true);
CREATE POLICY "contest_users_insert" ON contest_users FOR INSERT WITH CHECK (true);
CREATE POLICY "contest_users_update" ON contest_users FOR UPDATE USING (true);
CREATE POLICY "houses_select" ON houses FOR SELECT USING (true);
CREATE POLICY "houses_insert" ON houses FOR INSERT WITH CHECK (true);
CREATE POLICY "houses_update" ON houses FOR UPDATE USING (true);
CREATE POLICY "house_votes_select" ON house_votes FOR SELECT USING (true);
CREATE POLICY "house_votes_insert" ON house_votes FOR INSERT WITH CHECK (true);
CREATE POLICY "house_votes_update" ON house_votes FOR UPDATE USING (true);
CREATE POLICY "contest_config_select" ON contest_config FOR SELECT USING (true);
