-- Create function to update fishing_spots rating stats
CREATE OR REPLACE FUNCTION public.update_spot_rating_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_spot_id uuid;
  new_avg numeric;
  new_count integer;
BEGIN
  -- Determine which spot to update
  IF TG_OP = 'DELETE' THEN
    target_spot_id := OLD.spot_id;
  ELSE
    target_spot_id := NEW.spot_id;
  END IF;

  -- Calculate new average and count
  SELECT 
    COALESCE(AVG(rating)::numeric(3,2), 0),
    COUNT(*)::integer
  INTO new_avg, new_count
  FROM public.spot_ratings
  WHERE spot_id = target_spot_id;

  -- Update the fishing_spots table
  UPDATE public.fishing_spots
  SET 
    rating_avg = new_avg,
    rating_count = new_count,
    updated_at = now()
  WHERE id = target_spot_id;

  -- Return appropriate value based on operation
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Create trigger for INSERT
CREATE TRIGGER update_spot_rating_on_insert
AFTER INSERT ON public.spot_ratings
FOR EACH ROW
EXECUTE FUNCTION public.update_spot_rating_stats();

-- Create trigger for UPDATE
CREATE TRIGGER update_spot_rating_on_update
AFTER UPDATE ON public.spot_ratings
FOR EACH ROW
EXECUTE FUNCTION public.update_spot_rating_stats();

-- Create trigger for DELETE
CREATE TRIGGER update_spot_rating_on_delete
AFTER DELETE ON public.spot_ratings
FOR EACH ROW
EXECUTE FUNCTION public.update_spot_rating_stats();