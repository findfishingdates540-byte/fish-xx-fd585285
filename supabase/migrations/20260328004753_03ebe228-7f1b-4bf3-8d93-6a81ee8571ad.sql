
-- Tournament format enum
CREATE TYPE public.tournament_format AS ENUM ('single_elimination', 'double_elimination');

-- Tournament seeding enum
CREATE TYPE public.tournament_seeding AS ENUM ('random', 'ranked', 'manual');

-- Tournament scoring enum
CREATE TYPE public.tournament_scoring AS ENUM ('biggest_catch', 'total_weight', 'most_catches');

-- Tournament status enum
CREATE TYPE public.tournament_status AS ENUM ('draft', 'registration', 'seeding', 'in_progress', 'completed', 'cancelled');

-- Main tournaments table
CREATE TABLE public.tournaments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  banner_url TEXT,
  format tournament_format NOT NULL DEFAULT 'single_elimination',
  seeding_method tournament_seeding NOT NULL DEFAULT 'random',
  scoring_method tournament_scoring NOT NULL DEFAULT 'biggest_catch',
  max_participants INTEGER NOT NULL DEFAULT 16,
  entry_fee NUMERIC NOT NULL DEFAULT 0,
  prize_description TEXT,
  registration_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  registration_end TIMESTAMP WITH TIME ZONE NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  status tournament_status NOT NULL DEFAULT 'draft',
  current_round INTEGER NOT NULL DEFAULT 0,
  total_rounds INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tournament participants
CREATE TABLE public.tournament_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  seed_number INTEGER,
  has_paid BOOLEAN NOT NULL DEFAULT false,
  eliminated BOOLEAN NOT NULL DEFAULT false,
  eliminated_in_round INTEGER,
  final_placement INTEGER,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tournament_id, user_id)
);

-- Tournament rounds
CREATE TABLE public.tournament_rounds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE NOT NULL,
  round_number INTEGER NOT NULL,
  round_name TEXT NOT NULL,
  bracket_type TEXT NOT NULL DEFAULT 'winners',
  status TEXT NOT NULL DEFAULT 'pending',
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(tournament_id, round_number, bracket_type)
);

-- Tournament matchups
CREATE TABLE public.tournament_matchups (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  round_id UUID REFERENCES public.tournament_rounds(id) ON DELETE CASCADE NOT NULL,
  tournament_id UUID REFERENCES public.tournaments(id) ON DELETE CASCADE NOT NULL,
  matchup_number INTEGER NOT NULL,
  player1_id UUID REFERENCES auth.users(id),
  player2_id UUID REFERENCES auth.users(id),
  winner_id UUID REFERENCES auth.users(id),
  player1_score NUMERIC DEFAULT 0,
  player2_score NUMERIC DEFAULT 0,
  player1_catch_id UUID REFERENCES public.catches(id),
  player2_catch_id UUID REFERENCES public.catches(id),
  status TEXT NOT NULL DEFAULT 'pending',
  next_matchup_id UUID REFERENCES public.tournament_matchups(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS policies
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tournament_matchups ENABLE ROW LEVEL SECURITY;

-- Anyone can view tournaments
CREATE POLICY "Anyone can view tournaments" ON public.tournaments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create tournaments" ON public.tournaments FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Creators can update own tournaments" ON public.tournaments FOR UPDATE TO authenticated USING (auth.uid() = created_by);
CREATE POLICY "Admins can manage tournaments" ON public.tournaments FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Participants
CREATE POLICY "Anyone can view participants" ON public.tournament_participants FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can join tournaments" ON public.tournament_participants FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own participation" ON public.tournament_participants FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage participants" ON public.tournament_participants FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Rounds
CREATE POLICY "Anyone can view rounds" ON public.tournament_rounds FOR SELECT TO authenticated USING (true);
CREATE POLICY "Creators can manage rounds" ON public.tournament_rounds FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.tournaments t WHERE t.id = tournament_id AND t.created_by = auth.uid()));
CREATE POLICY "Admins can manage rounds" ON public.tournament_rounds FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Matchups
CREATE POLICY "Anyone can view matchups" ON public.tournament_matchups FOR SELECT TO authenticated USING (true);
CREATE POLICY "Creators can manage matchups" ON public.tournament_matchups FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.tournaments t WHERE t.id = tournament_id AND t.created_by = auth.uid()));
CREATE POLICY "Admins can manage matchups" ON public.tournament_matchups FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Indexes
CREATE INDEX idx_tournament_participants_tournament ON public.tournament_participants(tournament_id);
CREATE INDEX idx_tournament_participants_user ON public.tournament_participants(user_id);
CREATE INDEX idx_tournament_rounds_tournament ON public.tournament_rounds(tournament_id);
CREATE INDEX idx_tournament_matchups_round ON public.tournament_matchups(round_id);
CREATE INDEX idx_tournament_matchups_tournament ON public.tournament_matchups(tournament_id);
CREATE INDEX idx_tournaments_status ON public.tournaments(status);
CREATE INDEX idx_tournaments_created_by ON public.tournaments(created_by);
