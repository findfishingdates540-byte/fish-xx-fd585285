-- Update all Google Drive URLs to use lh3.googleusercontent.com format
UPDATE public.fishing_spots
SET photos = (
  SELECT array_agg(
    CASE 
      WHEN photo LIKE '%drive.google.com/uc?export=view&id=%' THEN
        'https://lh3.googleusercontent.com/d/' || 
        regexp_replace(photo, '.*id=([^&]+).*', '\1') || 
        '=w1000'
      ELSE photo
    END
  )
  FROM unnest(photos) AS photo
)
WHERE photos IS NOT NULL 
AND EXISTS (
  SELECT 1 FROM unnest(photos) AS p WHERE p LIKE '%drive.google.com%'
);