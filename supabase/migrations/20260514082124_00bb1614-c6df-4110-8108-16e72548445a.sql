
ALTER VIEW public.tournament_team_roster SET (security_invoker = true);
ALTER VIEW public.tournament_team_leaderboard SET (security_invoker = true);
ALTER VIEW public.tournament_member_contributions SET (security_invoker = true);
ALTER VIEW public.tournament_mvp_leaderboard SET (security_invoker = true);
