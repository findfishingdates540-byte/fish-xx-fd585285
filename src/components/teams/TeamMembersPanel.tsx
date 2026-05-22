import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Crown, Shield, ShieldOff, UserPlus, Users, X } from "lucide-react";
import { toast } from "sonner";

interface MemberProfile {
  id: string;
  display_name: string | null;
  photos: string[] | null;
  fishing_experience: string | null;
}

interface Props {
  team: any;
  members: any[];
  pendingRequests?: any[];
  profiles: Record<string, MemberProfile>;
  isCaptain: boolean;
}

export function TeamMembersPanel({ team, members, pendingRequests = [], profiles, isCaptain }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const teamId = team.id as string;

  const approveMutation = useMutation({
    mutationFn: async (userId: string) => {
      if (!isCaptain) throw new Error("Captain only");
      const { error } = await supabase
        .from("team_members")
        .update({ status: "approved" })
        .eq("team_id", teamId)
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members", teamId] });
      queryClient.invalidateQueries({ queryKey: ["all-teams"] });
      toast.success("Request approved");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const rejectMutation = useMutation({
    mutationFn: async (userId: string) => {
      if (!isCaptain) throw new Error("Captain only");
      const { error } = await supabase
        .from("team_members")
        .delete()
        .eq("team_id", teamId)
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members", teamId] });
      toast.success("Request rejected");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const promoteMutation = useMutation({
    mutationFn: async (p: { userId: string; toRole: "officer" | "member" }) => {
      if (!isCaptain) throw new Error("Captain only");
      const { error } = await supabase
        .from("team_members")
        .update({ role: p.toRole })
        .eq("team_id", teamId)
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

  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      if (!isCaptain) throw new Error("Only captain can remove members");
      const { error } = await supabase.from("team_members").delete().eq("team_id", teamId).eq("user_id", memberId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-members", teamId] });
      toast.success("Member removed");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const allMembers = [
    { userId: team.captain_id, role: "captain" },
    ...members.filter((m: any) => m.user_id !== team.captain_id).map((m: any) => ({ userId: m.user_id, role: m.role })),
  ];

  return (
    <div className="space-y-4">
      {isCaptain && pendingRequests.length > 0 && (
        <section className="rounded-xl border bg-card overflow-hidden">
          <div className="px-5 py-3 border-b flex items-center justify-between">
            <h2 className="font-bold text-sm flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-primary" />
              Pending requests
            </h2>
            <span className="text-xs text-muted-foreground">{pendingRequests.length}</span>
          </div>
          <div className="divide-y divide-border">
            {pendingRequests.map((req: any) => {
              const profile = profiles[req.user_id];
              return (
                <div key={req.user_id} className="flex items-center gap-3 px-5 py-3">
                  <button onClick={() => navigate(`/app/u/${req.user_id}`)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={profile?.photos?.[0] || ""} />
                      <AvatarFallback className="text-xs">{(profile?.display_name || "?")[0]}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">{profile?.display_name || "Angler"}</p>
                      <p className="text-xs text-muted-foreground">Wants to join</p>
                    </div>
                  </button>
                  <div className="flex items-center gap-1.5">
                    <Button size="sm" className="gap-1 h-8" onClick={() => approveMutation.mutate(req.user_id)} disabled={approveMutation.isPending}>
                      <Check className="h-3.5 w-3.5" /> Approve
                    </Button>
                    <Button size="sm" variant="ghost" className="gap-1 h-8 text-destructive hover:text-destructive" onClick={() => rejectMutation.mutate(req.user_id)} disabled={rejectMutation.isPending}>
                      <X className="h-3.5 w-3.5" /> Reject
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

    <section className="rounded-xl border bg-card overflow-hidden">
      <div className="px-5 py-3 border-b flex items-center justify-between">
        <h2 className="font-bold text-sm flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />Team Members
        </h2>
        <span className="text-xs text-muted-foreground">{allMembers.length} total</span>
      </div>
      <div className="divide-y divide-border">
        {allMembers.map(({ userId, role: memberRole }) => {
          const profile = profiles[userId];
          const memberIsCaptain = memberRole === "captain";
          const memberIsOfficer = memberRole === "officer";
          return (
            <div key={userId} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/30 transition-colors">
              <button onClick={() => navigate(`/app/u/${userId}`)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={profile?.photos?.[0] || ""} />
                  <AvatarFallback className="text-xs">{(profile?.display_name || "?")[0]}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-sm truncate">{profile?.display_name || "Angler"}</p>
                    {memberIsCaptain && <Badge variant="secondary" className="h-4 text-[10px] gap-0.5"><Crown className="h-2.5 w-2.5" />Captain</Badge>}
                    {memberIsOfficer && <Badge variant="secondary" className="h-4 text-[10px] gap-0.5"><Shield className="h-2.5 w-2.5" />Officer</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground capitalize">{memberRole}</p>
                </div>
              </button>
              {isCaptain && !memberIsCaptain && userId !== user?.id && (
                <div className="flex items-center gap-1">
                  {memberIsOfficer ? (
                    <Button variant="ghost" size="sm" className="text-xs gap-1"
                      onClick={() => promoteMutation.mutate({ userId, toRole: "member" })}>
                      <ShieldOff className="h-3 w-3" />Demote
                    </Button>
                  ) : (
                    <Button variant="ghost" size="sm" className="text-xs gap-1"
                      onClick={() => promoteMutation.mutate({ userId, toRole: "officer" })}>
                      <Shield className="h-3 w-3" />Make officer
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive text-xs"
                    onClick={() => removeMemberMutation.mutate(userId)}
                  >
                    Remove
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
    </div>
  );
}