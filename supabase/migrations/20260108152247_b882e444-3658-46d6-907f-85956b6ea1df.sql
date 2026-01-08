-- Clear invalid fishing_gear for affected user that contains lifestyle activities instead of actual gear
UPDATE profiles 
SET fishing_gear = '{}'::text[]
WHERE id = '41e1205d-2053-429e-b02e-eab75faf4964';

-- Also clean up any other users who might have lifestyle items incorrectly stored as fishing_gear
UPDATE profiles 
SET fishing_gear = '{}'::text[]
WHERE fishing_gear && ARRAY['camping', 'photography', 'hiking', 'travel', 'concerts', 'wine', 'coffee', 'dancing', 'pets', 'foodie', 'nature', 'fitness', 'music', 'movies', 'art', 'gaming', 'reading'];