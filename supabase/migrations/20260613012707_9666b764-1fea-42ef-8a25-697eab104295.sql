
-- Build mapping of duplicate species -> canonical species
CREATE TEMP TABLE species_dedup_map(delete_id uuid PRIMARY KEY, keep_id uuid NOT NULL);
INSERT INTO species_dedup_map(delete_id, keep_id) VALUES
  ('3d01bd3d-b7bb-4ce5-b750-a6eb4c7b7ba3','89f872e9-69d5-46d9-9180-8faeb4a6253e'),
  ('aeca13a4-786c-447e-ac1a-37692e15b27d','0f5f2d23-6f8a-408d-b45d-153073555239'),
  ('248060ef-ec28-4a87-857f-75f0f32d29a8','026a8b91-e58a-4ae0-9ae0-133329077d4c'),
  ('c59412f1-b88a-4489-84c1-ad15e35e8c9e','75f3408d-405d-44ae-bf33-a67bc9ffd0af'),
  ('55c10704-b9a7-48ee-a020-73bec7e34211','685f2925-1846-4074-ab61-f2c3aa009169'),
  ('c59e251c-fafb-4f30-bb88-4e431027a965','70dadb87-a707-4104-9c83-e6a7675fdda7'),
  ('cd130094-0de7-4884-93cb-9fac16c46bf1','03ca0901-fc78-4302-b739-0bc2c7562e06'),
  ('75fe3677-dcff-440e-a022-ab4f24712562','51da1b41-1503-497d-817f-239e2a69ca32'),
  ('ee966aa2-ea74-4d94-b579-d8c7aa7c4e4b','4cfbe015-e1e9-43f7-8c04-3dc012cfbdd0'),
  ('1454c955-4a5a-4d4b-9df2-438c5b2d1f16','8200e098-291c-4ed3-bd7c-381dabd6a899'),
  ('4b467a47-c63e-4338-8c2a-e572a9439fbd','b0ef8002-9911-464c-9409-4672a24e1d2d'),
  ('d4c092b2-7cbe-42be-8274-04b93c67ff9d','81c9c131-1235-4d05-929a-3a9fdfdbd026'),
  ('8b567a7f-0ece-44ab-acde-46b5f0a72d74','0d1a4fb4-7e57-42c3-988d-e7d058fb4504'),
  ('a5d66594-c5ba-4ee5-b6ec-d358a6683a8a','be64e3be-917a-4e56-8110-de29aef61c6d'),
  ('634bb739-f048-4f5a-bd30-64c7d385a883','579c88d0-924e-4e0d-aa9c-8c3c13e0e31d'),
  ('a71451b0-9975-4396-8c19-d2c318ba4ba7','4f752124-84a2-4e79-87a4-8364d8b10795'),
  ('33fcdc77-a4cc-4f02-bb20-542e66740d9b','bcc03861-b652-4bcc-8ff2-84c78d162c1f'),
  ('5bc2c24c-587d-465d-9853-e17d4933bfbf','602cddc8-a0d0-4f8b-aa57-baa490910dc3'),
  ('e0d87dcc-7e16-47cd-ad3b-f8c09b4809d6','b86ade5a-85c9-4163-9023-340c41084ecd'),
  ('d843f0e7-8023-442d-bcdf-d58e992714d5','4a7dc6ef-73ab-4476-b4e7-3f4f0077e20b'),
  ('680439fe-8172-4dd8-9440-f5a23ab2080b','2699d14c-4d7d-462f-971e-769d527974ec'),
  ('03b2c84a-4ff9-4792-b236-1ee8bf6abc93','5166b66a-4a82-4cf8-b8f5-0d699e50480e'),
  ('8bae1376-7848-4c1d-9c24-b268a5a21d44','96d9dd4e-6862-49bd-9af2-6d25e832b450'),
  ('b26c47a5-3675-4b24-9a2f-940fa8ce73d5','a8ee2ff4-4533-4285-869d-f5315d37a84b'),
  ('1245d9e9-7a24-4b58-a32d-fbc84c77022a','be6d74ea-66a8-4b18-90b4-976340129553'),
  ('cc9b0fd3-1728-4c83-b522-ddb079cb4e28','dae3c916-6b9f-40d2-94fd-3c674837762a'),
  ('61fd5275-fea9-4888-8add-c437e0893788','7beae79b-6c78-482c-ad12-ef3e703075a8'),
  ('0f268b7c-5d77-4bd0-afa9-f7d378cb72d3','478bbefd-d99c-403d-a7d5-134def0431e5'),
  ('ba46202f-157f-47b8-9b83-22be42ac06c5','5fd5e40c-aecd-45f2-9abc-1674150b8112'),
  ('79182ecd-b830-43f3-a68a-abb0bb0c0909','302d04d9-da19-49c6-8028-fdddf555fb07'),
  ('fccf8d9a-a07f-4217-a45c-f53074666047','04a9c08b-32ea-4545-8cfa-a72254c0b240'),
  ('91b322e6-facc-4027-9615-57a42d70190c','2b7a1f90-6dfc-4284-9911-f7dd901d4131'),
  ('e8a50c67-a824-4912-bd36-d5f7d3d5a68c','69e94713-47a7-451b-8d79-86845e3d36ef'),
  ('a6d0eb65-0bae-45f9-bc24-3a5675990efb','ac607107-1a30-44e4-9b66-79ec66291e5c'),
  ('c534e7f7-1e96-426d-ab0c-5013490f7672','23f1f60a-5d5d-40c6-92cf-7174c7721c79'),
  ('6093472b-1432-4686-9ee3-db264e278bab','a2e1ca6e-e383-4837-a029-2d989d2f292c'),
  ('3c18f178-a20a-41d3-8590-18edf094ff49','e5070eb1-d497-4f77-a02f-9b4eaba90ce5'),
  ('7cbd0ba4-5df4-4a6a-aa36-4640eab30af0','4530ec2f-ebf5-4b3d-b752-46af1f21a811'),
  ('465a64db-0ebf-419d-b36b-0f5a484304d5','fc2b3d5d-d9cd-40dd-9e8b-58cfc2801528'),
  ('b7226590-9f2a-4951-8831-643906cdc8f3','4228ebf1-8c3d-4f9b-b022-e261e92c80fa'),
  ('8fc02324-18dc-4e7c-8a7f-a3569e47254e','1ff7ef13-fd12-47d8-9444-cf696c407491'),
  ('80a9aed7-e5a1-4cf1-b200-52eaf8f2b6d3','91a09ac5-52a6-4561-b661-73dbc5e62bed'),
  ('0c99c9ba-e7d0-4d73-aff6-52278abac790','bfa80316-7b5b-498e-b49e-72a977f5219e'),
  ('68a3d2f1-b4cc-479e-a094-f749afc977e4','d477ea66-6d94-44ad-9b15-0a27a71795ec'),
  ('8e5b53fd-fee1-48d9-9b43-6d081a4f130a','d3836b11-7fb7-4e2e-b8d7-3e5917cf32f7'),
  ('6040e691-c5ae-4624-b162-f51953bfb723','c483fadb-4330-440f-aba7-8e639e8aee36'),
  ('96e86f16-a39c-46c5-983f-cad65e4e2aaa','7168e3f5-2240-49de-954f-34077e5619d0'),
  ('69e8b861-b96d-40d5-9f81-547317720d88','4585e402-90b8-43cf-a618-7bcbc8b8faa8'),
  ('08fd2ab0-f8b3-481c-9a26-da3f47e89f26','fa8956c8-1842-4ea1-a120-6f52748580d7'),
  ('4ff987fa-09d6-4c15-92f2-65d081f69297','a743566c-2c51-49ef-819a-9fac76e99572'),
  ('18c29501-9d73-4c9d-af89-39dc485642cc','38d3ebde-eb44-4669-832c-a9de3030ceb0'),
  ('dd355bc6-66ad-4460-b0fb-d435b3cc9a98','51abf128-41c0-4c7d-bf64-6de81991818f'),
  ('d57784f5-a041-4ac8-aa0b-5c804db51483','09ac9d5b-907d-4eeb-964a-f16bb43de2a6'),
  ('47e48b82-f893-4167-be2b-4682e09673eb','a99ab422-e04d-49bd-a50f-24bab06c95b5'),
  ('1cdac0a1-4c4b-402e-910d-e0c77755ea34','a99ab422-e04d-49bd-a50f-24bab06c95b5'),
  ('50b2939e-3a27-4614-b179-49d52e3f8e8a','72ab7cf6-941f-4ad7-8fe2-2f2495b3826a');

-- 1) catches: simple repoint (no unique constraint)
UPDATE public.catches c
SET species_id = m.keep_id
FROM species_dedup_map m
WHERE c.species_id = m.delete_id;

-- 2) angler_badges: simple repoint
UPDATE public.angler_badges b
SET species_id = m.keep_id
FROM species_dedup_map m
WHERE b.species_id = m.delete_id;

-- 3) fishing_challenges: simple repoint
UPDATE public.fishing_challenges fc
SET species_id = m.keep_id
FROM species_dedup_map m
WHERE fc.species_id = m.delete_id;

-- 4) leaderboard_entries: merge totals where (user_id, keep_id) already exists, then delete duplicate rows
WITH conflicts AS (
  SELECT le_dup.id AS dup_id, le_keep.id AS keep_id,
         le_dup.total_caught AS d_caught, le_dup.total_released AS d_released, le_dup.total_harvested AS d_harvested,
         le_dup.largest_weight_lbs AS d_w, le_dup.largest_length_in AS d_l, le_dup.largest_catch_id AS d_cid
  FROM public.leaderboard_entries le_dup
  JOIN species_dedup_map m ON le_dup.species_id = m.delete_id
  JOIN public.leaderboard_entries le_keep
    ON le_keep.user_id = le_dup.user_id AND le_keep.species_id = m.keep_id
)
UPDATE public.leaderboard_entries le
SET total_caught   = COALESCE(le.total_caught,0)   + COALESCE(c.d_caught,0),
    total_released = COALESCE(le.total_released,0) + COALESCE(c.d_released,0),
    total_harvested= COALESCE(le.total_harvested,0)+ COALESCE(c.d_harvested,0),
    largest_weight_lbs = GREATEST(COALESCE(le.largest_weight_lbs,0), COALESCE(c.d_w,0)),
    largest_length_in  = GREATEST(COALESCE(le.largest_length_in,0),  COALESCE(c.d_l,0)),
    largest_catch_id   = CASE WHEN COALESCE(c.d_w,0) > COALESCE(le.largest_weight_lbs,0) THEN c.d_cid ELSE le.largest_catch_id END,
    updated_at = now()
FROM conflicts c
WHERE le.id = c.keep_id;

-- Delete leaderboard duplicates that now conflict
DELETE FROM public.leaderboard_entries le
USING species_dedup_map m, public.leaderboard_entries le_keep
WHERE le.species_id = m.delete_id
  AND le_keep.user_id = le.user_id
  AND le_keep.species_id = m.keep_id;

-- Repoint remaining (non-conflicting) leaderboard rows
UPDATE public.leaderboard_entries le
SET species_id = m.keep_id
FROM species_dedup_map m
WHERE le.species_id = m.delete_id;

-- 5) championship_species_tiers: delete duplicate rows where the championship already has the canonical, then repoint the rest
DELETE FROM public.championship_species_tiers t
USING species_dedup_map m, public.championship_species_tiers t2
WHERE t.species_id = m.delete_id
  AND t2.championship_id = t.championship_id
  AND t2.species_id = m.keep_id;

UPDATE public.championship_species_tiers t
SET species_id = m.keep_id
FROM species_dedup_map m
WHERE t.species_id = m.delete_id;

-- 6) Finally, delete the duplicate species rows
DELETE FROM public.fish_species s
USING species_dedup_map m
WHERE s.id = m.delete_id;
