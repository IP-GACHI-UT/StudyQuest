-- Prismaのtimestamp(3)はUTCとして保存される。入力日付はtimestamptzで受け取る。
WITH bounds AS (
  SELECT
    $2::timestamptz AT TIME ZONE 'UTC' AS cohort_start,
    $3::timestamptz AT TIME ZONE 'UTC' AS cohort_end,
    $4::timestamptz AT TIME ZONE 'UTC' AS observed_at
), cohort AS (
  SELECT u.id, u."createdAt" AS registered_at,
    (SELECT min(q."acceptedAt") FROM user_quests q
      WHERE q."userId" = u.id AND q."acceptedAt" < b.observed_at) AS first_accepted_at,
    (SELECT min(l."createdAt") FROM study_logs l
      WHERE l."userId" = u.id AND l."createdAt" < b.observed_at) AS first_saved_at
  FROM users u CROSS JOIN bounds b
  WHERE u.id = ANY($1::text[])
    AND u."createdAt" >= b.cohort_start AND u."createdAt" < b.cohort_end
), windows AS (
  SELECT c.*,
    (date_trunc('day', first_saved_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo')
      + interval '7 days') AT TIME ZONE 'Asia/Tokyo' AT TIME ZONE 'UTC' AS d7_start,
    (date_trunc('day', first_saved_at AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Tokyo')
      + interval '8 days') AT TIME ZONE 'Asia/Tokyo' AT TIME ZONE 'UTC' AS d7_end
  FROM cohort c
)
SELECT
  count(*)::int AS registered,
  (count(*) FILTER (WHERE first_accepted_at IS NOT NULL))::int AS "firstAccepted",
  (count(*) FILTER (WHERE first_saved_at IS NOT NULL))::int AS "firstSaved",
  (count(*) FILTER (WHERE first_accepted_at IS NOT NULL AND first_saved_at IS NOT NULL))::int AS "acceptedAndSaved",
  (count(*) FILTER (WHERE first_accepted_at IS NULL))::int AS "registeredWithoutAccept",
  (count(*) FILTER (WHERE first_accepted_at IS NOT NULL AND first_saved_at IS NULL))::int AS "acceptedWithoutSave",
  (count(*) FILTER (WHERE registered_at + interval '48 hours' <= b.observed_at))::int AS "eligibleForFirstSave48h",
  (count(*) FILTER (WHERE registered_at + interval '48 hours' > b.observed_at))::int AS "pendingFirstSave48h",
  (count(*) FILTER (WHERE registered_at + interval '48 hours' <= b.observed_at
    AND first_saved_at < registered_at + interval '48 hours'))::int AS "savedWithin48h",
  (count(*) FILTER (WHERE first_saved_at IS NOT NULL AND d7_end <= b.observed_at))::int AS "eligibleForD7",
  (count(*) FILTER (WHERE first_saved_at IS NOT NULL AND d7_end > b.observed_at))::int AS "pendingD7",
  (count(*) FILTER (WHERE d7_end <= b.observed_at AND EXISTS (
    SELECT 1 FROM study_logs l WHERE l."userId" = w.id
      AND l."createdAt" >= w.d7_start AND l."createdAt" < w.d7_end
  )))::int AS "reusedOnD7"
FROM windows w CROSS JOIN bounds b;
