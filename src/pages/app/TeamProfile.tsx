import { useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Crown,
  Users,
  Trophy,
  Fish,
  Calendar,
  LogOut,
  UserPlus,
  BarChart3,
  Target,
} from "lucide-react";
import { toast } from "sonner";

interface MemberProfile {
  id: string;
  display_name: string | null;
  photos: string[] | null;
  fishing_experience: string | null;
}

export default function TeamProfile() {
  const { teamId } = useParams<{ teamId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: team, isLoading: teamLoading } = useQuery({
    queryKey: ["team-detail", teamId],
    queryFn: async () => {
      const { data, error } = await supabase.from("fishing_teams").select("*").eq("id", teamId!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!teamId,
  });

  const { data: members = [] } = useQuery({
    queryKey: ["team-members", teamId],
    queryFn: async () => {
      const { data } = await supabase.from("team_members").select("*").eq("team_id", teamId!);
      return data || [];
    },
    enabled: !!teamId,
  });

  const memberUserIds = useMemo(() => [
    ...(team ? [team.captain_id] : []),
    ...members.map((m) => m.user_id),
  ], [team, members]);

  const { data: profiles = {} } = useQuery({
    queryKey: ["team-member-profiles", memberUserIds.join(",")],
    queryFn: async () => {
      if (memberUserIds.length === 0) return {};
      const { data } = await supabase.from("profiles").select("id, display_name, photos, fishing_experience").in("id", memberUserIds);
      const map: Record<string, MemberProfile> = {};
      (data || []).forEach((p) => { map[p.id] = p as MemberProfile; });
      return map;
    },
    enabled: memberUserIds.length > 0,
  });

  // Team catch stats
  const { data: teamStats = { totalCatches: 0, totalWeight: 0, topSpecies: null } } = useQuery({
    queryKey: ["team-stats", teamId, memberUserIds.join(",")],
    queryFn: async () => {
      if (memberUserIds.length === 0) return { totalCatches: 0, totalWeight: 0, topSpecies: null };
      const { data } = await supabase
        .from("catches")
        .select("id, weight_lbs, species_name")
        .in("user_id", memberUserIds);
      const catches = data || [];
      const totalWeight = catches.reduce((sum, c) => sum + (Number(c.weight_lbs) || 0), 0);
      const speciesCounts: Record<string, number> = {};
      catches.forEach((c) => { if (c.species_name) speciesCounts[c.species_name] = (speciesCounts[c.species_name] || 0) + 1; });
      const topSpecies = Object.entries(speciesCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
      return { totalCatches: catches.length, totalWeight: Math.round(totalWeight * 10) / 10, topSpecies };
    },
    enabled: memberUserIds.length > 0,
  });

  const isCaptain = !!user && team?.captain_id === user.id;
  const isMember = !!user && (isCaptain || members.some((m) => m.user_id === user.id));

  const joinMutation = useMutation({
    mutationFn: async () => {
      if (!user || !teamId) throw new Error("Must be logged in");

      // Fetch user profile for eligibility checks
      const { data: profile } = await supabase
        .from("profiles")
        .select("gender, date_of_birth")
        .eq("id", user.id)
        .single();

      const teamCategory = (team as any)?.category || "teams";

      // Lady Angler: women 18+ only
      if (teamCategory === "lady_angler") {
        if (profile?.gender !== "female") {
          throw new Error("Lady Angler teams are for women only");
        }
        if (!profile?.date_of_birth) {
          throw new Error("Your date of birth is required to join a Lady Angler team");
        }
        const dob = new Date(profile.date_of_birth);
        const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        if (age < 18) {
          throw new Error("Lady Angler teams are for members 18 and older");
        }
      }

      // Junior Angler: 17 and under only
      if (teamCategory === "jr_anglers") {
        if (!profile?.date_of_birth) {
          throw new Error("Your date of birth is required to join a Junior Angler team");
        }
        const dob = new Date(profile.date_of_birth);
        const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
        if (age >= 18) {
          throw new Error("Junior Angler teams are for members 17 and under");
        }
      }

      const { error } = await supabase.from("team_members").insert({
        team_id: teamId,
        user_id: user.id,
        role: "member",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members", teamId] });
      queryClient.invalidateQueries({ queryKey: ["all-teams"] });
      toast.success("You joined the team! 🎉");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const leaveMutation = useMutation({
    mutationFn: async () => {
      if (!user || !teamId) throw new Error("Must be logged in");
      const { error } = await supabase.from("team_members").delete().eq("team_id", teamId).eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members", teamId] });
      queryClient.invalidateQueries({ queryKey: ["all-teams"] });
      toast.success("You left the team");
    },
    onError: (err) => toast.error(err.message),
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      if (!isCaptain) throw new Error("Only captain can remove members");
      const { error } = await supabase.from("team_members").delete().eq("team_id", teamId!).eq("user_id", memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members", teamId] });
      toast.success("Member removed");
    },
    onError: (err) => toast.error(err.message),
  });

  const skillLabel = (s: string) => s === "advanced" ? "Pro" : s === "intermediate" ? "Intermediate" : "Beginner";
  const skillColor = (s: string) => s === "advanced" ? "bg-destructive/10 text-destructive" : s === "intermediate" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground";

  if (teamLoading) {
    return (
      <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="max-w-3xl mx-auto p-6 text-center py-20">
        <Users className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
        <p className="text-muted-foreground font-medium">Team not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/app/teams")}>Browse Teams</Button>
      </div>
    );
  }

  const captainProfile = profiles[team.captain_id];
  const allMembers = [
    { userId: team.captain_id, role: "captain" },
    ...members.filter((m) => m.user_id !== team.captain_id).map((m) => ({ userId: m.user_id, role: m.role })),
  ];

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-6 pb-24">
      {/* Back */}
      <Button variant="ghost" size="sm" onClick={() => navigate("/app/teams")} className="mb-4 gap-1.5 -ml-2">
        <ArrowLeft className="h-4 w-4" /> Teams
      </Button>

      {/* Team Header */}
      <div className="rounded-xl border bg-card overflow-hidden mb-6">
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6">
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary/20 flex items-center justify-center text-lg font-bold text-primary shrink-0 overflow-hidden border-2 border-primary/30">
              {team.logo_url ? (
                <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover" />
              ) : (
                team.name.slice(0, 2).toUpperCase()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl md:text-2xl font-bold">{team.name}</h1>
                <Badge className={`text-xs border-0 ${skillColor(team.skill_level)}`}>{skillLabel(team.skill_level)}</Badge>
              </div>
              {team.description && <p className="text-sm text-muted-foreground mt-1">{team.description}</p>}
              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Users className="h-3.5 w-3.5" />{allMembers.length} members</span>
                <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />Est. {new Date(team.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-3 border-t flex items-center gap-2">
          {!isMember ? (
            <Button onClick={() => joinMutation.mutate()} disabled={joinMutation.isPending} className="gap-1.5">
              <UserPlus className="h-4 w-4" />
              {joinMutation.isPending ? "Joining..." : "Join Team"}
            </Button>
          ) : isCaptain ? (
            <Badge className="bg-primary/10 text-primary border-0 gap-1"><Crown className="h-3 w-3" />You're the Captain</Badge>
          ) : (
            <Button variant="outline" size="sm" onClick={() => leaveMutation.mutate()} disabled={leaveMutation.isPending} className="gap-1.5 text-destructive hover:text-destructive">
              <LogOut className="h-4 w-4" />
              {leaveMutation.isPending ? "Leaving..." : "Leave Team"}
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="rounded-xl border bg-card p-4 text-center">
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
            <Fish className="h-4 w-4 text-primary" />
          </div>
          <p className="text-lg font-bold">{teamStats.totalCatches}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Catches</p>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center">
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
            <BarChart3 className="h-4 w-4 text-primary" />
          </div>
          <p className="text-lg font-bold">{teamStats.totalWeight} lbs</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Weight</p>
        </div>
        <div className="rounded-xl border bg-card p-4 text-center">
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
            <Target className="h-4 w-4 text-primary" />
          </div>
          <p className="text-lg font-bold truncate text-sm">{teamStats.topSpecies || "—"}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Top Species</p>
        </div>
      </div>

      {/* Members List */}
      <section className="rounded-xl border bg-card overflow-hidden">
        <div className="px-5 py-3 border-b flex items-center justify-between">
          <h2 className="font-bold text-sm flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" />Team Members</h2>
          <span className="text-xs text-muted-foreground">{allMembers.length} total</span>
        </div>
        <div className="divide-y divide-border">
          {allMembers.map(({ userId, role }) => {
            const profile = profiles[userId];
            const memberIsCaptain = role === "captain";
            return (
              <div key={userId} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors">
                <button onClick={() => navigate(`/app/u/${userId}`)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={profile?.photos?.[0] || ""} />
                    <AvatarFallback className="text-xs">{(profile?.display_name || "?")[0]}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{profile?.display_name || "Angler"}</p>
                      {memberIsCaptain && <Crown className="h-3.5 w-3.5 text-primary shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground capitalize">{role}</p>
                  </div>
                </button>
                {isCaptain && !memberIsCaptain && userId !== user?.id && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive text-xs"
                    onClick={() => removeMemberMutation.mutate(userId)}
                  >
                    Remove
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Leaderboard Link */}
      <div className="mt-6 rounded-xl border bg-primary/5 p-5 text-center">
        <Trophy className="h-6 w-6 text-primary mx-auto mb-2" />
        <h3 className="font-bold text-sm mb-1">Team Rankings</h3>
        <p className="text-xs text-muted-foreground mb-3">See how your team stacks up against the competition</p>
        <Button variant="default" size="sm" onClick={() => navigate("/app/leaderboard")}>View Scoreboard</Button>
      </div>
    </div>
  );
}
