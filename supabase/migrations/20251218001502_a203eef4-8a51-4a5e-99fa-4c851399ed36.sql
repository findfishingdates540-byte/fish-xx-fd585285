-- Create security definer function to check if user is trip owner or participant
CREATE OR REPLACE FUNCTION public.is_trip_participant_or_owner(_user_id uuid, _trip_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.fishing_trips
    WHERE id = _trip_id
      AND user_id = _user_id
  )
  OR EXISTS (
    SELECT 1
    FROM public.trip_participants
    WHERE trip_id = _trip_id
      AND user_id = _user_id
  )
$$;

-- Create function to check if user is trip owner
CREATE OR REPLACE FUNCTION public.is_trip_owner(_user_id uuid, _trip_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.fishing_trips
    WHERE id = _trip_id
      AND user_id = _user_id
  )
$$;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view trip participants" ON public.trip_participants;
DROP POLICY IF EXISTS "Trip owners can manage participants" ON public.trip_participants;
DROP POLICY IF EXISTS "Trip owners can remove participants" ON public.trip_participants;
DROP POLICY IF EXISTS "Trip owners can update participants" ON public.trip_participants;

-- Recreate policies using security definer functions
CREATE POLICY "Users can view trip participants"
ON public.trip_participants
FOR SELECT
USING (
  public.is_trip_owner(auth.uid(), trip_id)
  OR user_id = auth.uid()
);

CREATE POLICY "Trip owners can manage participants"
ON public.trip_participants
FOR INSERT
WITH CHECK (
  public.is_trip_owner(auth.uid(), trip_id)
);

CREATE POLICY "Trip owners can remove participants"
ON public.trip_participants
FOR DELETE
USING (
  public.is_trip_owner(auth.uid(), trip_id)
);

CREATE POLICY "Trip owners and invitees can update"
ON public.trip_participants
FOR UPDATE
USING (
  public.is_trip_owner(auth.uid(), trip_id)
  OR user_id = auth.uid()
);