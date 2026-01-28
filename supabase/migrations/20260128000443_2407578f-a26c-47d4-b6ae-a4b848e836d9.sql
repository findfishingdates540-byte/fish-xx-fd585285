-- Delete all matches where Jessica (bc2243b6-81c4-4083-852d-79ddbd6907ff) is involved
DELETE FROM matches 
WHERE user1_id = 'bc2243b6-81c4-4083-852d-79ddbd6907ff' 
   OR user2_id = 'bc2243b6-81c4-4083-852d-79ddbd6907ff';