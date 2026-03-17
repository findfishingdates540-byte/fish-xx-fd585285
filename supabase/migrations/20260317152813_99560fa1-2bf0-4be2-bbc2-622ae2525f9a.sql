
-- SEED DATA: Teams, Challenges, Photo Challenges

-- 1. Fishing Teams (3)
INSERT INTO fishing_teams (id, name, description, skill_level, captain_id, logo_url) VALUES
  ('a1000000-0000-0000-0000-000000000001', 'Bass Busters', 'Elite bass anglers dominating every tournament.', 'advanced', '0047f625-cd8e-4fcf-9bd3-1c132fb120d2', 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=200&h=200&fit=crop'),
  ('a1000000-0000-0000-0000-000000000002', 'Reel Legends', 'A crew of passionate weekend warriors.', 'intermediate', '052dc0c0-d21d-4fa7-b244-86d8975b1b1a', 'https://images.unsplash.com/photo-1516962126636-27ad087061cc?w=200&h=200&fit=crop'),
  ('a1000000-0000-0000-0000-000000000003', 'Cast & Conquer', 'Beginners learning together and having fun.', 'beginner', '0836cc79-8e32-48f4-9d75-d799a829445b', 'https://images.unsplash.com/photo-1504472478235-9bc48ba4d60f?w=200&h=200&fit=crop')
ON CONFLICT DO NOTHING;

-- Team members
INSERT INTO team_members (team_id, user_id, role) VALUES
  ('a1000000-0000-0000-0000-000000000001', '052dc0c0-d21d-4fa7-b244-86d8975b1b1a', 'member'),
  ('a1000000-0000-0000-0000-000000000001', '0e6a5350-20a9-453c-909d-315b9db41efe', 'member'),
  ('a1000000-0000-0000-0000-000000000002', '0836cc79-8e32-48f4-9d75-d799a829445b', 'member'),
  ('a1000000-0000-0000-0000-000000000002', '1a609870-cec0-4942-918e-7cb7b8bf5861', 'member'),
  ('a1000000-0000-0000-0000-000000000003', '0047f625-cd8e-4fcf-9bd3-1c132fb120d2', 'member'),
  ('a1000000-0000-0000-0000-000000000003', '0e6a5350-20a9-453c-909d-315b9db41efe', 'member')
ON CONFLICT DO NOTHING;

-- 2. Fishing Challenges (6) - using valid enum values: largest_fish, most_caught, species_specific, team
INSERT INTO fishing_challenges (id, title, description, challenge_type, start_date, end_date, status, created_by, species_id, is_official) VALUES
  ('b1000000-0000-0000-0000-000000000001', 'Spring Bass Bonanza', 'Catch the biggest bass this spring! Weekly weigh-ins and prizes for top 3.', 'largest_fish', '2026-03-01', '2026-04-01', 'active', '0047f625-cd8e-4fcf-9bd3-1c132fb120d2', '47799a22-909b-4282-8122-9196185226f0', true),
  ('b1000000-0000-0000-0000-000000000002', 'Species Safari', 'Log as many different species as possible in 3 weeks.', 'species_specific', '2026-03-10', '2026-03-31', 'active', '052dc0c0-d21d-4fa7-b244-86d8975b1b1a', NULL, false),
  ('b1000000-0000-0000-0000-000000000003', 'Summer Slam Tournament', 'The biggest tournament of the year — total weight wins!', 'team', '2026-04-15', '2026-05-15', 'upcoming', '0047f625-cd8e-4fcf-9bd3-1c132fb120d2', NULL, true),
  ('b1000000-0000-0000-0000-000000000004', 'Barracuda Blitz', 'Who can land the most barracuda in June?', 'most_caught', '2026-06-01', '2026-06-30', 'upcoming', '0836cc79-8e32-48f4-9d75-d799a829445b', '47799a22-909b-4282-8122-9196185226f0', false),
  ('b1000000-0000-0000-0000-000000000005', 'Winter Freeze Challenge', 'Brave the cold for the heaviest catch of winter.', 'largest_fish', '2026-01-01', '2026-02-28', 'completed', '052dc0c0-d21d-4fa7-b244-86d8975b1b1a', '5020e5ca-ff37-482c-b244-b84ae08b9677', true),
  ('b1000000-0000-0000-0000-000000000006', 'New Year Count-Off', 'Most catches logged in January wins bragging rights.', 'most_caught', '2026-01-01', '2026-01-31', 'completed', '0e6a5350-20a9-453c-909d-315b9db41efe', NULL, false)
ON CONFLICT DO NOTHING;

-- 3. Challenge Participants (10)
INSERT INTO challenge_participants (challenge_id, user_id, score, team_id) VALUES
  ('b1000000-0000-0000-0000-000000000001', '0047f625-cd8e-4fcf-9bd3-1c132fb120d2', 45, 'a1000000-0000-0000-0000-000000000001'),
  ('b1000000-0000-0000-0000-000000000001', '052dc0c0-d21d-4fa7-b244-86d8975b1b1a', 38, 'a1000000-0000-0000-0000-000000000001'),
  ('b1000000-0000-0000-0000-000000000001', '0836cc79-8e32-48f4-9d75-d799a829445b', 22, 'a1000000-0000-0000-0000-000000000002'),
  ('b1000000-0000-0000-0000-000000000002', '0e6a5350-20a9-453c-909d-315b9db41efe', 7, NULL),
  ('b1000000-0000-0000-0000-000000000002', '1a609870-cec0-4942-918e-7cb7b8bf5861', 5, NULL),
  ('b1000000-0000-0000-0000-000000000005', '0047f625-cd8e-4fcf-9bd3-1c132fb120d2', 62, 'a1000000-0000-0000-0000-000000000001'),
  ('b1000000-0000-0000-0000-000000000005', '0836cc79-8e32-48f4-9d75-d799a829445b', 55, NULL),
  ('b1000000-0000-0000-0000-000000000005', '1a609870-cec0-4942-918e-7cb7b8bf5861', 41, NULL),
  ('b1000000-0000-0000-0000-000000000006', '052dc0c0-d21d-4fa7-b244-86d8975b1b1a', 28, NULL),
  ('b1000000-0000-0000-0000-000000000006', '0e6a5350-20a9-453c-909d-315b9db41efe', 19, NULL)
ON CONFLICT DO NOTHING;

-- 4. Photo Challenges (6)
INSERT INTO photo_challenges (id, title, description, banner_url, entry_fee, prize_type, prize_description, start_date, end_date, voting_end_date, status, created_by, winner_id) VALUES
  ('c1000000-0000-0000-0000-000000000001', 'Best Sunset Catch', 'Show us your best fish photo with a stunning sunset backdrop.', 'https://images.unsplash.com/photo-1500463959177-e0869687df26?w=800&h=400&fit=crop', 5, 'cash', NULL, '2026-03-10', '2026-03-25', '2026-03-30', 'submissions_open', '0047f625-cd8e-4fcf-9bd3-1c132fb120d2', NULL),
  ('c1000000-0000-0000-0000-000000000002', 'Monster Fish March', 'Biggest fish photo wins! Entry fee goes to the pot.', 'https://images.unsplash.com/photo-1545816250-e12bedba42ba?w=800&h=400&fit=crop', 10, 'cash', NULL, '2026-03-05', '2026-03-28', '2026-04-02', 'submissions_open', '052dc0c0-d21d-4fa7-b244-86d8975b1b1a', NULL),
  ('c1000000-0000-0000-0000-000000000003', 'Winter Wonderland Fishing', 'The best cold-weather fishing photo. Voting now open!', 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&h=400&fit=crop', 5, 'gift_card', '$50 Bass Pro Gift Card', '2026-02-15', '2026-03-10', '2026-03-20', 'voting', '0836cc79-8e32-48f4-9d75-d799a829445b', NULL),
  ('c1000000-0000-0000-0000-000000000004', 'Kayak Fishing Shots', 'Best photo taken from a kayak. Community votes decide!', 'https://images.unsplash.com/photo-1440558382541-3focc2e9b8c2?w=800&h=400&fit=crop', 5, 'cash', NULL, '2026-02-20', '2026-03-12', '2026-03-22', 'voting', '0e6a5350-20a9-453c-909d-315b9db41efe', NULL),
  ('c1000000-0000-0000-0000-000000000005', 'April Fools Fish Frenzy', 'Funniest fishing photo wins. Get creative!', 'https://images.unsplash.com/photo-1534575890512-96ad2be982b4?w=800&h=400&fit=crop', 5, 'gift_card', '$25 Amazon Gift Card', '2026-04-01', '2026-04-15', '2026-04-20', 'upcoming', '1a609870-cec0-4942-918e-7cb7b8bf5861', NULL),
  ('c1000000-0000-0000-0000-000000000006', 'New Year First Catch', 'First catch of 2026 photo contest.', 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&h=400&fit=crop', 10, 'cash', NULL, '2026-01-01', '2026-01-15', '2026-01-25', 'completed', '0047f625-cd8e-4fcf-9bd3-1c132fb120d2', '0047f625-cd8e-4fcf-9bd3-1c132fb120d2')
ON CONFLICT DO NOTHING;

-- 5. Photo Challenge Entries (15)
INSERT INTO photo_challenge_entries (id, challenge_id, user_id, photo_url, caption, has_paid) VALUES
  ('d1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', '0047f625-cd8e-4fcf-9bd3-1c132fb120d2', 'https://images.unsplash.com/photo-1504472478235-9bc48ba4d60f?w=600&h=600&fit=crop', 'Golden hour bass!', true),
  ('d1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001', '052dc0c0-d21d-4fa7-b244-86d8975b1b1a', 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=600&h=600&fit=crop', 'Sunset vibes at the lake', true),
  ('d1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000001', '0836cc79-8e32-48f4-9d75-d799a829445b', 'https://images.unsplash.com/photo-1516962126636-27ad087061cc?w=600&h=600&fit=crop', 'My PB at dusk', false),
  ('d1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000002', '0e6a5350-20a9-453c-909d-315b9db41efe', 'https://images.unsplash.com/photo-1498654200943-1088dd4438ae?w=600&h=600&fit=crop', 'Absolute unit!', true),
  ('d1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000002', '1a609870-cec0-4942-918e-7cb7b8bf5861', 'https://images.unsplash.com/photo-1500463959177-e0869687df26?w=600&h=600&fit=crop', 'River monster', true),
  ('d1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000003', '0047f625-cd8e-4fcf-9bd3-1c132fb120d2', 'https://images.unsplash.com/photo-1519681393784-d120267933ba?w=600&h=600&fit=crop', 'Snowy lake trout session', true),
  ('d1000000-0000-0000-0000-000000000007', 'c1000000-0000-0000-0000-000000000003', '052dc0c0-d21d-4fa7-b244-86d8975b1b1a', 'https://images.unsplash.com/photo-1478827536114-da961b7f86d2?w=600&h=600&fit=crop', 'Ice fishing adventure', true),
  ('d1000000-0000-0000-0000-000000000008', 'c1000000-0000-0000-0000-000000000003', '0e6a5350-20a9-453c-909d-315b9db41efe', 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=600&h=600&fit=crop', 'Frozen beauty', true),
  ('d1000000-0000-0000-0000-000000000009', 'c1000000-0000-0000-0000-000000000004', '0836cc79-8e32-48f4-9d75-d799a829445b', 'https://images.unsplash.com/photo-1472396961693-142e6e269027?w=600&h=600&fit=crop', 'Kayak fishing serenity', true),
  ('d1000000-0000-0000-0000-000000000010', 'c1000000-0000-0000-0000-000000000004', '1a609870-cec0-4942-918e-7cb7b8bf5861', 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=600&h=600&fit=crop', 'Paddling with a catch', true),
  ('d1000000-0000-0000-0000-000000000011', 'c1000000-0000-0000-0000-000000000004', '0047f625-cd8e-4fcf-9bd3-1c132fb120d2', 'https://images.unsplash.com/photo-1534575890512-96ad2be982b4?w=600&h=600&fit=crop', 'Morning kayak haul', true),
  ('d1000000-0000-0000-0000-000000000012', 'c1000000-0000-0000-0000-000000000006', '0047f625-cd8e-4fcf-9bd3-1c132fb120d2', 'https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=600&h=600&fit=crop', 'First catch of 2026!', true),
  ('d1000000-0000-0000-0000-000000000013', 'c1000000-0000-0000-0000-000000000006', '052dc0c0-d21d-4fa7-b244-86d8975b1b1a', 'https://images.unsplash.com/photo-1504472478235-9bc48ba4d60f?w=600&h=600&fit=crop', 'New year, new PB', true),
  ('d1000000-0000-0000-0000-000000000014', 'c1000000-0000-0000-0000-000000000006', '0836cc79-8e32-48f4-9d75-d799a829445b', 'https://images.unsplash.com/photo-1498654200943-1088dd4438ae?w=600&h=600&fit=crop', 'Cold but worth it', true),
  ('d1000000-0000-0000-0000-000000000015', 'c1000000-0000-0000-0000-000000000002', '0047f625-cd8e-4fcf-9bd3-1c132fb120d2', 'https://images.unsplash.com/photo-1472396961693-142e6e269027?w=600&h=600&fit=crop', 'Look at this beast', true)
ON CONFLICT DO NOTHING;

-- 6. Photo Challenge Votes (20)
INSERT INTO photo_challenge_votes (challenge_id, entry_id, user_id) VALUES
  ('c1000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000006', '0836cc79-8e32-48f4-9d75-d799a829445b'),
  ('c1000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000006', '0e6a5350-20a9-453c-909d-315b9db41efe'),
  ('c1000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000006', '1a609870-cec0-4942-918e-7cb7b8bf5861'),
  ('c1000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000007', '0047f625-cd8e-4fcf-9bd3-1c132fb120d2'),
  ('c1000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000007', '1a609870-cec0-4942-918e-7cb7b8bf5861'),
  ('c1000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000008', '052dc0c0-d21d-4fa7-b244-86d8975b1b1a'),
  ('c1000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000008', '0047f625-cd8e-4fcf-9bd3-1c132fb120d2'),
  ('c1000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000008', '0836cc79-8e32-48f4-9d75-d799a829445b'),
  ('c1000000-0000-0000-0000-000000000003', 'd1000000-0000-0000-0000-000000000008', '1a609870-cec0-4942-918e-7cb7b8bf5861'),
  ('c1000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000009', '0047f625-cd8e-4fcf-9bd3-1c132fb120d2'),
  ('c1000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000009', '052dc0c0-d21d-4fa7-b244-86d8975b1b1a'),
  ('c1000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000009', '0e6a5350-20a9-453c-909d-315b9db41efe'),
  ('c1000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000010', '0047f625-cd8e-4fcf-9bd3-1c132fb120d2'),
  ('c1000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000010', '0836cc79-8e32-48f4-9d75-d799a829445b'),
  ('c1000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000011', '052dc0c0-d21d-4fa7-b244-86d8975b1b1a'),
  ('c1000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000011', '0e6a5350-20a9-453c-909d-315b9db41efe'),
  ('c1000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000011', '1a609870-cec0-4942-918e-7cb7b8bf5861'),
  ('c1000000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000011', '0836cc79-8e32-48f4-9d75-d799a829445b'),
  ('c1000000-0000-0000-0000-000000000006', 'd1000000-0000-0000-0000-000000000012', '052dc0c0-d21d-4fa7-b244-86d8975b1b1a'),
  ('c1000000-0000-0000-0000-000000000006', 'd1000000-0000-0000-0000-000000000012', '0836cc79-8e32-48f4-9d75-d799a829445b')
ON CONFLICT DO NOTHING;
