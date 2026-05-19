import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Trophy, Clock, Crown, Fish, ShieldCheck, Swords } from "lucide-react";
import { format } from "date-fns";

function timeAgo(date: Date): string {
  const sec = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

export default function MatchupDetail() {
  const { tournamentId, matchupId } = useParams<{ tournamentId: string; matchupId: string }>();
  const navigate = useNavigate();

  const { data: matchup, isLoading } = useQuery({
    queryKey: ["matchup", matchupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tournament_matchups")
        .select("*")
        .eq("id", matchupId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!matchupId,
  });

  const { data: tournament } = useQuery({
    queryKey: ["tournament", tournamentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tournaments")
        .select("id,title,scoring_method")
        .eq("id", tournamentId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!tournamentId,
  });

  const { data: round } = useQuery({
    queryKey: ["round", matchup?.round_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tournament_rounds")
        .select("*")
        .eq("id", matchup!.round_id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!matchup?.round_id,
  });

  const teamIds = [matchup?.team1_id, matchup?.team2_id].filter(Boolean) as string[];
  const { data: teams = [] } = useQuery({
    queryKey: ["matchup-teams", teamIds.join(",")],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fishing_teams")
        .select("id,name,logo_url,captain_id")
        .in("id", teamIds);
      if (error) throw error;
      return data || [];
    },
    enabled: teamIds.length > 0,
  });

  const { data: mvps = [] } = useQuery({
    queryKey: ["matchup-mvps", matchupId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tournament_matchup_mvps" as any)
        .select("*")
        .eq("matchup_id", matchupId!)
        .order("score", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!matchupId,
    refetchInterval: 30000,
  });

  // Roster: captain + team_members for each team
  const { data: rosters = {} as Record<string, string[]> } = useQuery({
    queryKey: ["matchup-rosters", teamIds.join(",")],
    queryFn: async () => {
      if (teamIds.length === 0) return {};
      const { data, error } = await supabase
        .from("team_members")
        .select("team_id,user_id")
        .in("team_id", teamIds);
      if (error) throw error;
      const map: Record<string, string[]> = {};
      teamIds.forEach((id) => (map[id] = []));
      (data || []).forEach((r: any) => {
        if (!map[r.team_id]) map[r.team_id] = [];
        map[r.team_id].push(r.user_id);
      });
      teams.forEach((t: any) => {
        if (t.captain_id && map[t.id] && !map[t.id].includes(t.captain_id)) {
          map[t.id].push(t.captain_id);
        }
      });
      return map;
    },
    enabled: teamIds.length > 0 && teams.length > 0,
  });

  const allUserIds = Object.values(rosters).flat();

  const startISO = round?.start_date ? new Date(round.start_date).toISOString() : null;
  const endISO = round?.end_date
    ? new Date(new Date(round.end_date).getTime() + 24 * 60 * 60 * 1000 - 1).toISOString()
    : null;

  const { data: recentCatches = [] } = useQuery({
    queryKey: ["matchup-recent-catches", matchupId, allUserIds.join(","), startISO, endISO],
    queryFn: async () => {
      if (allUserIds.length === 0 || !startISO || !endISO) return [];
      const { data, error } = await supabase
        .from("catches")
        .select("id,user_id,species_name,weight_lbs,length_in,caught_at,cover_photo_url")
        .in("user_id", allUserIds)
        .eq("is_verified", true)
        .eq("is_private", false)
        .gte("caught_at", startISO)
        .lte("caught_at", endISO)
        .order("caught_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
    enabled: allUserIds.length > 0 && !!startISO && !!endISO,
    refetchInterval: 30000,
  });

  const { data: profilesMap = {} } = useQuery({
    queryKey: ["matchup-profiles", allUserIds.join(",")],
    queryFn: async () => {
      if (allUserIds.length === 0) return {};
      const { data } = await supabase
        .from("profiles_safe")
        .select("id,display_name,photos")
        .in("id", allUserIds);
      const m: Record<string, any> = {};
      (data || []).forEach((p: any) => (m[p.id] = p));
      return m;
    },
    enabled: allUserIds.length > 0,
  });

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!matchup) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center text-muted-foreground">
        Matchup not found.
      </div>
    );
  }

  const team1 = teams.find((t: any) => t.id === matchup.team1_id);
  const team2 = teams.find((t: any) => t.id === matchup.team2_id);
  const isComplete = matchup.status === "completed";
  const isLive = matchup.status === "in_progress" || matchup.status === "active";
  const score1 = Number(matchup.team1_score || 0);
  const score2 = Number(matchup.team2_score || 0);
  const team1Wins = isComplete && matchup.winner_team_id === matchup.team1_id;
  const team2Wins = isComplete && matchup.winner_team_id === matchup.team2_id;
  const unit = tournament?.scoring_method === "most_catches" ? "catches" : "lbs";

  const mvpsByTeam = (teamId: string | undefined | null) =>
    teamId ? mvps.filter((m: any) => m.winner_team_id === teamId || m.team_name === teams.find((t: any) => t.id === teamId)?.name).slice(0, 3) : [];

  return (
    <div className="max-w-2xl mx-auto px-4 pb-24">
      <div className="flex items-center gap-3 py-4">
        <button onClick={() => navigate(`/app/tournaments/${tournamentId}`)} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> {tournament?.title || "Tournament"}
        </button>
      </div>

      <div className="rounded-xl border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b bg-muted/30 flex items-center justify-between text-xs">
          <span className="font-semibold uppercase tracking-wide">
            {round?.round_name || "Matchup"} · #{matchup.matchup_number}
          </span>
          {isLive ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500 text-white font-bold">
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" /> LIVE
            </span>
          ) : isComplete ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
              <Trophy className="h-3 w-3" /> Final
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-muted-foreground border">
              <Clock className="h-3 w-3" /> Pending
            </span>
          )}
        </div>

        {/* Head-to-head */}
        <div className="p-5 grid grid-cols-[1fr_auto_1fr] gap-3 items-center">
          <TeamBlock team={team1} score={score1} unit={unit} isWinner={team1Wins} />
          <div className="flex flex-col items-center gap-1">
            <Swords className="h-5 w-5 text-muted-foreground" />
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">VS</span>
          </div>
          <TeamBlock team={team2} score={score2} unit={unit} isWinner={team2Wins} reverse />
        </div>

        {round?.start_date && (
          <div className="px-4 pb-3 text-center text-[11px] text-muted-foreground">
            {format(new Date(round.start_date), "MMM d, yyyy")}
            {round.end_date && ` – ${format(new Date(round.end_date), "MMM d, yyyy")}`}
          </div>
        )}
      </div>

      {/* Top contributors per team */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
        <TopContributors team={team1} mvps={mvpsByTeam(matchup.team1_id)} unit={unit} />
        <TopContributors team={team2} mvps={mvpsByTeam(matchup.team2_id)} unit={unit} />
      </div>

      {/* Recent catches */}
      <div className="mt-4 rounded-xl border bg-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Fish className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-bold">Recent catches</h2>
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold ml-1">Verified</span>
        </div>
        {recentCatches.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No verified catches in this round yet.</p>
        ) : (
          <div className="space-y-2">
            {recentCatches.map((rc: any) => {
              const prof = profilesMap[rc.user_id];
              const name = prof?.display_name || "Angler";
              const teamId = Object.keys(rosters).find((tid) => (rosters as any)[tid]?.includes(rc.user_id));
              const teamName = teams.find((t: any) => t.id === teamId)?.name;
              return (
                <Link
                  key={rc.id}
                  to={`/app/catches/${rc.id}`}
                  className="flex items-center gap-3 py-2 border-b last:border-0 hover:bg-muted/50 rounded transition-colors"
                >
                  {rc.cover_photo_url ? (
                    <img src={rc.cover_photo_url} alt="" className="h-10 w-10 rounded object-cover ring-1 ring-border" />
                  ) : (
                    <div className="h-10 w-10 rounded bg-muted flex items-center justify-center"><Fish className="h-4 w-4 text-muted-foreground" /></div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold truncate">
                      {name}
                      {teamName && <span className="text-muted-foreground font-normal"> · {teamName}</span>}
                    </p>
                    <p className="text-[11px] text-muted-foreground">
                      {rc.species_name || "Fish"}
                      {rc.weight_lbs ? ` · ${Number(rc.weight_lbs).toFixed(1)} lbs` : ""}
                      {rc.length_in ? ` · ${Number(rc.length_in).toFixed(1)} in` : ""}
                      {" · "}{timeAgo(new Date(rc.caught_at))}
                    </p>
                  </div>
                  <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function TeamBlock({ team, score, unit, isWinner, reverse }: { team: any; score: number; unit: string; isWinner: boolean; reverse?: boolean }) {
  return (
    <div className={`flex flex-col items-center text-center ${reverse ? "" : ""}`}>
      <Avatar className={`h-16 w-16 ring-2 ${isWinner ? "ring-emerald-500" : "ring-border"}`}>
        <AvatarImage src={team?.logo_url} />
        <AvatarFallback className="text-lg font-bold">{team?.name?.charAt(0) || "?"}</AvatarFallback>
      </Avatar>
      <p className={`mt-2 text-sm font-bold truncate w-full ${isWinner ? "text-emerald-600" : ""}`}>{team?.name || "TBD"}</p>
      <p className="text-3xl font-bold tabular-nums mt-1">{score.toFixed(unit === "lbs" ? 1 : 0)}</p>
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">{unit}</p>
      {isWinner && (
        <span className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 border border-emerald-500/30 text-[9px] uppercase tracking-widest font-bold">
          <Crown className="h-3 w-3" /> Winner
        </span>
      )}
    </div>
  );
}

function TopContributors({ team, mvps, unit }: { team: any; mvps: any[]; unit: string }) {
  if (!team) return null;
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <Avatar className="h-6 w-6"><AvatarImage src={team.logo_url} /><AvatarFallback className="text-[10px]">{team.name?.charAt(0)}</AvatarFallback></Avatar>
        <h3 className="text-sm font-bold truncate">{team.name}</h3>
        <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold ml-auto">Top MVPs</span>
      </div>
      {mvps.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-3">No MVPs yet.</p>
      ) : (
        <div className="space-y-1.5">
          {mvps.map((m: any, i: number) => (
            <div key={m.user_id || i} className="flex items-center gap-2 text-xs">
              <span className="w-4 text-center font-bold text-muted-foreground">{i + 1}</span>
              <Avatar className="h-6 w-6"><AvatarImage src={m.photos?.[0]} /><AvatarFallback className="text-[9px]">{m.display_name?.charAt(0)}</AvatarFallback></Avatar>
              <span className="flex-1 truncate">{m.display_name || "Angler"}</span>
              <span className="font-bold tabular-nums">
                {Number(m.score || 0).toFixed(unit === "lbs" ? 1 : 0)} <span className="text-[9px] uppercase text-muted-foreground">{unit}</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}