-- Delete today's swipes for Jessica Jenny (user bc2243b6-81c4-4083-852d-79ddbd6907ff)
DELETE FROM matches 
WHERE id IN (
  '53061070-4d43-42a9-9c7a-dffa1f4cce84',
  '332d27f1-2d75-44e6-876c-0805986e9600',
  '4172ac5a-a6b8-4a28-a6b8-91f0c86c5cb1',
  'f1f0d84b-5fd5-4a57-9075-4531dd21073a'
);