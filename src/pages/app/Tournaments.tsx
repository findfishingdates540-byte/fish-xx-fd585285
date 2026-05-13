import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Trophy,
  Plus,
  Users,
  DollarSign,
  Swords,
  ChevronRight,
  CalendarDays,
  Search,
  Users2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { format } from "date-fns";

type TabValue = "open" | "active" | "completed";

const Tournaments = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<TabValue>("open");
  const [search, setSearch] = useState("");
  const [registerForId, setRegisterForId] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");

  const { data: tournaments = [], isLoading } = useQuery({
    queryKey: ["tournaments", tab],
    queryFn: async () => {
      let query = supabase
        .from("tournaments")
        .select("*")
        .order("start_date", { ascending: tab !== "completed" });

      if (tab === "open") {
        query = query.in("status", ["draft", "registration", "seeding"]);
      } else if (tab === "active") {
        query = query.eq("status", "in_progress");
      } else {
        query = query.in("status", ["completed", "cancelled"]);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  const { data: participantCounts = {} } = useQuery({
    queryKey: ["tournament-participant-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tournament_participants")
        .select("tournament_id");
      if (error) throw error;
      const counts: Record<string, number> = {};
      data.forEach((p: any) => {
        counts[p.tournament_id] = (counts[p.tournament_id] || 0) + 1;
      });
      return counts;
    },
  });

  // Teams the current user captains — required to register
  const { data: myCaptainedTeams = [] } = useQuery({
    queryKey: ["my-captained-teams", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("fishing_teams")
        .select("id, name, logo_url")
        .eq("captain_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Tournaments where one of the user's captained teams is already registered
  const { data: myParticipations = [] } = useQuery({
    queryKey: ["my-tournament-participations", user?.id, myCaptainedTeams.map((t: any) => t.id).join(",")],
    queryFn: async () => {
      if (!user || myCaptainedTeams.length === 0) return [];
      const { data, error } = await supabase
        .from("tournament_participants")
        .select("tournament_id, team_id")
        .in("team_id", myCaptainedTeams.map((t: any) => t.id));
      if (error) throw error;
      return (data || []).map((p: any) => p.tournament_id);
    },
    enabled: !!user,
  });

  const joinMutation = useMutation({
    mutationFn: async ({ tournamentId, teamId }: { tournamentId: string; teamId: string }) => {
      if (!user) throw new Error("Login required");
      if (!teamId) throw new Error("Select a team");
      const { error } = await supabase
        .from("tournament_participants")
        .insert({ tournament_id: tournamentId, user_id: user.id, team_id: teamId, has_paid: true } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Your team is registered!");
      setRegisterForId(null);
      setSelectedTeamId("");
      queryClient.invalidateQueries({ queryKey: ["my-tournament-participations"] });
      queryClient.invalidateQueries({ queryKey: ["tournament-participant-counts"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleRegisterClick = (tournamentId: string) => {
    if (myCaptainedTeams.length === 0) {
      toast.error("Only team captains can register. Create a team first.");
      navigate("/app/teams");
      return;
    }
    if (myCaptainedTeams.length === 1) {
      joinMutation.mutate({ tournamentId, teamId: myCaptainedTeams[0].id });
      return;
    }
    setSelectedTeamId(myCaptainedTeams[0].id);
    setRegisterForId(tournamentId);
  };

  const filtered = tournaments.filter((t: any) =>
    t.title.toLowerCase().includes(search.toLowerCase())
  );

  const formatLabel = (f: string) =>
    f === "single_elimination" ? "Single Elim" : "Double Elim";

  const scoringLabel = (s: string) => {
    switch (s) {
      case "biggest_catch": return "Biggest Catch";
      case "total_weight": return "Total Weight";
      case "most_catches": return "Most Catches";
      default: return s;
    }
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "registration": return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "in_progress": return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      case "completed": return "bg-muted text-muted-foreground";
      case "cancelled": return "bg-destructive/10 text-destructive";
      default: return "bg-primary/10 text-primary";
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 pb-32">
      {/* Header */}
      <div className="flex items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <Swords className="h-6 w-6 text-primary" />
          <h1 className="text-xl font-bold">Tournaments</h1>
        </div>
        <Button size="sm" onClick={() => navigate("/app/tournaments/new")} className="gap-1.5">
          <Plus className="h-4 w-4" /> Create
        </Button>
      </div>

      {/* Teams-only notice */}
      <div className="mb-3 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-muted-foreground flex items-start gap-2">
        <Users2 className="h-3.5 w-3.5 mt-0.5 text-primary shrink-0" />
        <p>Tournaments are <span className="font-medium text-foreground">team-based</span>. Only team captains can register a team to compete.</p>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search tournaments..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-3 rounded-lg overflow-hidden border border-border mb-5">
        {(["open", "active", "completed"] as TabValue[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`py-2 text-xs font-medium text-center capitalize transition-colors ${
              tab === t
                ? "bg-primary text-primary-foreground"
                : "bg-background text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "open" ? "Registration" : t}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-36 rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Swords className="h-12 w-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No tournaments found</p>
          <p className="text-sm mt-1">
            {tab === "open" ? "Create one to get started!" : "Check back later."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((t: any) => {
            const count = participantCounts[t.id] || 0;
            const isJoined = myParticipations.includes(t.id);
            const canJoin = t.status === "registration" && !isJoined;

            return (
              <div
                key={t.id}
                className="rounded-xl border bg-card p-4 space-y-3 cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => navigate(`/app/tournaments/${t.id}`)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm truncate">{t.title}</h3>
                    {t.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {t.description}
                      </p>
                    )}
                  </div>
                  <Badge variant="outline" className={`shrink-0 text-[10px] ${statusColor(t.status)}`}>
                    {t.status.replace("_", " ")}
                  </Badge>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="text-[10px] gap-1">
                    <Swords className="h-3 w-3" />
                    {formatLabel(t.format)}
                  </Badge>
                  <Badge variant="secondary" className="text-[10px] gap-1">
                    <Trophy className="h-3 w-3" />
                    {scoringLabel(t.scoring_method)}
                  </Badge>
                  <Badge variant="secondary" className="text-[10px] gap-1">
                    <Users className="h-3 w-3" />
                    {count}/{t.max_participants}
                  </Badge>
                  {t.entry_fee > 0 && (
                    <Badge variant="secondary" className="text-[10px] gap-1">
                      <DollarSign className="h-3 w-3" />${t.entry_fee}
                    </Badge>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" />
                    {format(new Date(t.start_date), "MMM d, yyyy")}
                  </span>
                  <div className="flex items-center gap-2">
                    {isJoined && (
                      <Badge className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                        Joined
                      </Badge>
                    )}
                    {canJoin && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRegisterClick(t.id);
                        }}
                        disabled={joinMutation.isPending}
                      >
                        Register Team
                      </Button>
                    )}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Team picker dialog (when user captains 2+ teams) */}
      <Dialog open={!!registerForId} onOpenChange={(o) => { if (!o) { setRegisterForId(null); setSelectedTeamId(""); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Register a team</DialogTitle>
            <DialogDescription>Pick which of your teams will compete in this tournament.</DialogDescription>
          </DialogHeader>
          <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
            <SelectTrigger><SelectValue placeholder="Choose a team" /></SelectTrigger>
            <SelectContent>
              {myCaptainedTeams.map((t: any) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button
              onClick={() => registerForId && joinMutation.mutate({ tournamentId: registerForId, teamId: selectedTeamId })}
              disabled={!selectedTeamId || joinMutation.isPending}
            >
              {joinMutation.isPending ? "Registering…" : "Confirm Registration"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Tournaments;
