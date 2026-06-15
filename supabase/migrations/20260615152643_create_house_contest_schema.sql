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

CREATE TYPE house_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE vote_type AS ENUM ('match', 'dislike');

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
