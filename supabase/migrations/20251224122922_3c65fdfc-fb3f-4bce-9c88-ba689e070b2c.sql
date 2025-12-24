-- Update some profiles to female gender for testing purposes
-- Only updating profiles that have completed onboarding and have photos

UPDATE profiles
SET gender = 'female', interested_in = ARRAY['male']::gender_type[]
WHERE id IN (
  'c14d7c61-7b4e-49c2-9fe7-51e73fb4a5de',  -- Joshua Campbell
  'a2a380bc-2044-4231-84bb-35eaf515fdc3',  -- Lucas Combo
  'e47c1857-cc27-43bc-8c0c-c1e9f66d55bf',  -- Stark
  '66c24d0c-58a2-4148-a661-631f7d2fecec',  -- Lucas Combo
  '8dab7c23-9210-47cb-bbf2-670dc159cb01',  -- Ayomide
  '6d964e79-18e9-4961-8858-efbcc72cd1ab'   -- Lucas Combo (fishing)
);

-- Also clear any existing match records for Lucas Jeffery so profiles appear again
DELETE FROM matches 
WHERE user1_id = 'ec041d75-bf24-411a-b8a3-61e78bbf931b' 
   OR user2_id = 'ec041d75-bf24-411a-b8a3-61e78bbf931b';