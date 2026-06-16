-- Security hardening: close anon writes/reads on sensitive tables (P0 + P1)

-- S09: limit hirelings/dummies
ALTER TABLE houses DROP CONSTRAINT IF EXISTS houses_hirelings_count_max;
ALTER TABLE houses DROP CONSTRAINT IF EXISTS houses_dummies_count_max;
ALTER TABLE houses ADD CONSTRAINT houses_hirelings_count_max CHECK (hirelings_count >= 0 AND hirelings_count <= 20);
ALTER TABLE houses ADD CONSTRAINT houses_dummies_count_max CHECK (dummies_count >= 0 AND dummies_count <= 20);

-- Drop permissive RLS policies
DROP POLICY IF EXISTS "houses_insert" ON houses;
DROP POLICY IF EXISTS "houses_update" ON houses;

DROP POLICY IF EXISTS "house_votes_select" ON house_votes;
DROP POLICY IF EXISTS "house_votes_insert" ON house_votes;
DROP POLICY IF EXISTS "house_votes_update" ON house_votes;

DROP POLICY IF EXISTS "contest_users_select" ON contest_users;
DROP POLICY IF EXISTS "contest_users_insert" ON contest_users;
DROP POLICY IF EXISTS "contest_users_update" ON contest_users;

-- houses: public read only (detail, ranking, voting list)
-- writes via service role in edge functions only

-- house_votes: no anon/authenticated policies = deny all direct client access

-- contest_users: no public policies = deny all direct client access

-- Revoke direct table privileges from anon (belt and suspenders)
REVOKE INSERT, UPDATE, DELETE ON public.houses FROM anon, authenticated;
REVOKE ALL ON public.house_votes FROM anon, authenticated;
REVOKE ALL ON public.contest_users FROM anon, authenticated;

-- Keep public read on houses and contest_config for portal phase display
GRANT SELECT ON public.houses TO anon, authenticated;
GRANT SELECT ON public.contest_config TO anon, authenticated;
GRANT SELECT ON public.house_leaderboard TO anon, authenticated;
