import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
  Shield,
  ShieldOff,
  Pencil,
  Globe,
  Lock,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import { useTeamFollow } from "@/hooks/use-team-follow";
import { FollowPageButton } from "@/components/teams/FollowPageButton";
import { TeamInsightsTab } from "@/components/teams/TeamInsightsTab";
import { logTeamPageView } from "@/hooks/use-team-page-insights";
import { TeamMediaTab } from "@/components/teams/TeamMediaTab";
import { EditTeamDialog } from "@/components/teams/EditTeamDialog";
import { TeamAboutPanel } from "@/components/teams/TeamAboutPanel";
import { TeamMembersPanel } from "@/components/teams/TeamMembersPanel";

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
      const { data } = await supabase.from("profiles_safe").select("id, display_name, photos, fishing_experience").in("id", memberUserIds);
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
  const { data: followInfo } = useTeamFollow(teamId);
  const [tab, setTab] = useState<string>("about");
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    if (!teamId) return;
    logTeamPageView(teamId, user?.id || null);
  }, [teamId, user?.id]);

  const promoteMutation = useMutation({
    mutationFn: async (p: { userId: string; toRole: "officer" | "member" }) => {
      if (!isCaptain) throw new Error("Captain only");
      const { error } = await supabase
        .from("team_members")
        .update({ role: p.toRole })
        .eq("team_id", teamId!)
        .eq("user_id", p.userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members", teamId] });
      queryClient.invalidateQueries({ queryKey: ["team-role", teamId] });
      toast.success("Role updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

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

  const allMembers = [
    { userId: team.captain_id, role: "captain" },
    ...members.filter((m) => m.user_id !== team.captain_id).map((m) => ({ userId: m.user_id, role: m.role })),
  ];

  const previewAvatars = allMembers.slice(0, 8);
  const followerCount = followInfo?.count ?? team.followers_count ?? 0;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6 pb-24">
      {/* Back */}
      <Button variant="ghost" size="sm" onClick={() => navigate("/app/teams")} className="mb-4 gap-1.5 -ml-2">
        <ArrowLeft className="h-4 w-4" /> Teams
      </Button>

      {/* Team Header — cover + identity */}
      <div className="rounded-xl border bg-card overflow-hidden mb-6">
        {/* Cover */}
        <div className="relative h-40 md:h-56 bg-gradient-to-br from-primary/40 via-primary/20 to-primary/5 overflow-hidden">
          {(team as any).cover_url ? (
            <img src={(team as any).cover_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary)/0.35),transparent_55%),radial-gradient(circle_at_80%_80%,hsl(var(--primary)/0.25),transparent_50%)]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent" />
          {isCaptain && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setEditOpen(true)}
              className="absolute top-3 right-3 gap-1.5 backdrop-blur bg-background/80 hover:bg-background"
            >
              <Pencil className="h-3.5 w-3.5" /> Edit page
            </Button>
          )}
        </div>

        {/* Identity row */}
        <div className="px-4 md:px-6 pb-4 -mt-12 md:-mt-14 relative">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-background ring-4 ring-card shadow-lg overflow-hidden grid place-items-center text-2xl font-bold text-primary">
              {team.logo_url ? (
                <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover" />
              ) : (
                <span>{team.name.slice(0, 2).toUpperCase()}</span>
              )}
            </div>
            <div className="flex-1 min-w-0 md:pb-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-bold leading-tight">{team.name}</h1>
                <Badge className={`text-xs border-0 ${skillColor(team.skill_level)}`}>{skillLabel(team.skill_level)}</Badge>
              </div>
              <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground flex-wrap">
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  <span className="font-medium text-foreground">{allMembers.length}</span> members
                </span>
                {followerCount > 0 && (
                  <>
                    <span>·</span>
                    <span><span className="font-medium text-foreground">{followerCount}</span> {followerCount === 1 ? "follower" : "followers"}</span>
                  </>
                )}
                <span>·</span>
                <span className="inline-flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" />
                  Est. {new Date(team.created_at).toLocaleDateString(undefined, { month: "short", year: "numeric" })}
                </span>
              </div>

              {/* Member avatar stack */}
              {previewAvatars.length > 0 && (
                <div className="flex items-center gap-2 mt-3">
                  <div className="flex -space-x-2">
                    {previewAvatars.map(({ userId }) => {
                      const p = profiles[userId];
                      return (
                        <Avatar key={userId} className="h-7 w-7 ring-2 ring-card">
                          <AvatarImage src={p?.photos?.[0] || ""} />
                          <AvatarFallback className="text-[10px]">{(p?.display_name || "?")[0]}</AvatarFallback>
                        </Avatar>
                      );
                    })}
                  </div>
                  {allMembers.length > previewAvatars.length && (
                    <button
                      onClick={() => setTab("members")}
                      className="text-xs text-muted-foreground hover:text-foreground hover:underline"
                    >
                      +{allMembers.length - previewAvatars.length} more
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 md:pb-1 flex-wrap">
              <Button size="sm" onClick={() => navigate(`/app/teams/${teamId}/page`)} className="gap-1.5 h-9">
                <Globe className="h-4 w-4" /> Page
              </Button>
              <Button size="sm" variant="outline" onClick={() => navigate(`/app/teams/${teamId}/group`)} className="gap-1.5 h-9">
                <Lock className="h-4 w-4" /> Group
              </Button>
              {!isMember ? (
                <Button onClick={() => joinMutation.mutate()} disabled={joinMutation.isPending} className="gap-1.5">
                  <UserPlus className="h-4 w-4" />
                  {joinMutation.isPending ? "Joining…" : "Join Team"}
                </Button>
              ) : isCaptain ? (
                <>
                  <Badge className="bg-primary/10 text-primary border-0 gap-1 h-8 px-3">
                    <Crown className="h-3 w-3" />Captain
                  </Badge>
                  <Button size="sm" variant="outline" onClick={() => setEditOpen(true)} className="gap-1.5 h-9">
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Button>
                </>
              ) : (
                <Button variant="outline" size="sm" onClick={() => leaveMutation.mutate()} disabled={leaveMutation.isPending} className="gap-1.5 text-destructive hover:text-destructive h-9">
                  <LogOut className="h-4 w-4" />
                  {leaveMutation.isPending ? "Leaving…" : "Leave"}
                </Button>
              )}
              <FollowPageButton teamId={teamId!} teamName={team.name} />
            </div>
          </div>
        </div>
      </div>

      {isCaptain && (
        <EditTeamDialog open={editOpen} onOpenChange={setEditOpen} team={team} />
      )}

      {/* Surface entry cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        <button
          onClick={() => navigate(`/app/teams/${teamId}/page`)}
          className="group text-left rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-primary/[0.02] hover:border-primary hover:from-primary/15 transition p-5 flex items-start gap-4"
        >
          <div className="h-11 w-11 rounded-full bg-primary text-primary-foreground grid place-items-center shrink-0 shadow">
            <Globe className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-bold">Open Page →</p>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Public-facing wall. Catches, highlights and announcements anyone can see.</p>
          </div>
        </button>
        <button
          onClick={() => navigate(`/app/teams/${teamId}/group`)}
          className="group text-left rounded-xl border-2 border-primary/30 bg-gradient-to-br from-primary/10 to-primary/[0.02] hover:border-primary hover:from-primary/15 transition p-5 flex items-start gap-4"
        >
          <div className="h-11 w-11 rounded-full bg-primary text-primary-foreground grid place-items-center shrink-0 shadow">
            <Lock className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-bold">Open Group →</p>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {isMember
                ? "Private members-only conversation, planning and trip talk."
                : "Members-only conversation. Join the team to enter the group."}
            </p>
          </div>
        </button>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <div className="sticky top-0 z-20 -mx-4 md:-mx-6 px-4 md:px-6 py-2 bg-background/85 backdrop-blur border-b mb-4">
          <TabsList className={`grid w-full ${isCaptain ? "grid-cols-4" : "grid-cols-3"}`}>
            <TabsTrigger value="media">Media</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="members">Members</TabsTrigger>
            {isCaptain && <TabsTrigger value="insights">Insights</TabsTrigger>}
          </TabsList>
        </div>

        <TabsContent value="media" className="mt-0">
          <TeamMediaTab teamId={teamId!} />
        </TabsContent>

        <TabsContent value="about" className="mt-4">
          <TeamAboutPanel team={team} memberUserIds={memberUserIds} memberCount={allMembers.length} />
        </TabsContent>

        <TabsContent value="members" className="mt-4">
          <TeamMembersPanel team={team} members={members} profiles={profiles} isCaptain={isCaptain} />
        </TabsContent>

        {isCaptain && (
          <TabsContent value="insights" className="mt-4">
            <TeamInsightsTab teamId={teamId!} isCaptain={isCaptain} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
