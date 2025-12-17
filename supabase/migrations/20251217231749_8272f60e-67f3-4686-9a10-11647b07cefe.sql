-- Create fishing_trips table
CREATE TABLE public.fishing_trips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  trip_type TEXT NOT NULL DEFAULT 'solo' CHECK (trip_type IN ('solo', 'buddies')),
  title TEXT NOT NULL,
  notes TEXT,
  trip_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  location_name TEXT,
  location_lat NUMERIC,
  location_lng NUMERIC,
  fishing_spot_id UUID REFERENCES public.fishing_spots(id) ON DELETE SET NULL,
  gear_checklist JSONB DEFAULT '[]'::jsonb,
  target_species TEXT[] DEFAULT '{}',
  bait_details TEXT,
  weather_notes TEXT,
  coordinates_notes TEXT,
  departure_reminder BOOLEAN DEFAULT true,
  weather_alert BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'planned' CHECK (status IN ('planned', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create trip_participants table for buddies trips
CREATE TABLE public.trip_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trip_id UUID NOT NULL REFERENCES public.fishing_trips(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'accepted', 'declined')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(trip_id, user_id)
);

-- Enable RLS
ALTER TABLE public.fishing_trips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trip_participants ENABLE ROW LEVEL SECURITY;

-- RLS policies for fishing_trips
CREATE POLICY "Users can view own trips"
  ON public.fishing_trips FOR SELECT
  USING (auth.uid() = user_id OR EXISTS (
    SELECT 1 FROM public.trip_participants
    WHERE trip_id = fishing_trips.id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can create own trips"
  ON public.fishing_trips FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trips"
  ON public.fishing_trips FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own trips"
  ON public.fishing_trips FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for trip_participants
CREATE POLICY "Users can view trip participants"
  ON public.trip_participants FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.fishing_trips
    WHERE id = trip_participants.trip_id
    AND (user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.trip_participants tp
      WHERE tp.trip_id = fishing_trips.id AND tp.user_id = auth.uid()
    ))
  ));

CREATE POLICY "Trip owners can manage participants"
  ON public.trip_participants FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.fishing_trips
    WHERE id = trip_participants.trip_id AND user_id = auth.uid()
  ));

CREATE POLICY "Trip owners can update participants"
  ON public.trip_participants FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.fishing_trips
    WHERE id = trip_participants.trip_id AND user_id = auth.uid()
  ) OR user_id = auth.uid());

CREATE POLICY "Trip owners can remove participants"
  ON public.trip_participants FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.fishing_trips
    WHERE id = trip_participants.trip_id AND user_id = auth.uid()
  ));

-- Trigger for updated_at
CREATE TRIGGER update_fishing_trips_updated_at
  BEFORE UPDATE ON public.fishing_trips
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();