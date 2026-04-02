-- Fix Joshua's unpaid entry
UPDATE public.photo_challenge_entries
SET has_paid = true
WHERE id = '1dc8da28-7402-488a-96d4-78ebf471557f';