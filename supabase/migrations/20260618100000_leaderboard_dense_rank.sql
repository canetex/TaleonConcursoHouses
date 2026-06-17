-- Fase 3: bónus de utilidade com DENSE_RANK para empates em dummies + hirelings
CREATE OR REPLACE VIEW house_leaderboard AS
WITH match_counts AS (
  SELECT house_id, COUNT(*) FILTER (WHERE vote_type = 'match') AS total_matches
  FROM house_votes
  GROUP BY house_id
),
utility_ranked AS (
  SELECT id,
    DENSE_RANK() OVER (ORDER BY (dummies_count + hirelings_count) DESC) AS utility_rank
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
