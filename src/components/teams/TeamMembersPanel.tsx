import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowUpCircle, Check, Crown, Shield, ShieldOff, Star, UserPlus, Users, X } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

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
  const [transferTarget, setTransferTarget] = useState<{ userId: string; name: string } | null>(null);

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
    mutationFn: async (p: { userId: string; toRole: "officer" | "vice_captain" | "member" }) => {
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

  const transferCaptainMutation = useMutation({
    mutationFn: async (newCaptainId: string) => {
      if (!isCaptain || !user) throw new Error("Captain only");
      // 1. Demote current captain to vice_captain row in team_members (insert or update)
      const { error: meErr } = await supabase
        .from("team_members")
        .upsert(
          { team_id: teamId, user_id: user.id, role: "vice_captain", status: "approved" },
          { onConflict: "team_id,user_id" },
        );
      if (meErr) throw meErr;
      // 2. Promote new user's row to captain
      const { error: newErr } = await supabase
        .from("team_members")
        .update({ role: "captain", status: "approved" })
        .eq("team_id", teamId)
        .eq("user_id", newCaptainId);
      if (newErr) throw newErr;
      // 3. Update fishing_teams.captain_id
      const { error: teamErr } = await supabase
        .from("fishing_teams")
        .update({ captain_id: newCaptainId })
        .eq("id", teamId);
      if (teamErr) throw teamErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team-detail", teamId] });
      queryClient.invalidateQueries({ queryKey: ["team-members", teamId] });
      queryClient.invalidateQueries({ queryKey: ["team-role", teamId] });
      toast.success("Captain transferred");
      setTransferTarget(null);
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
          const memberIsViceCaptain = memberRole === "vice_captain";
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
                    {memberIsViceCaptain && <Badge variant="secondary" className="h-4 text-[10px] gap-0.5"><Star className="h-2.5 w-2.5" />Vice Captain</Badge>}
                    {memberIsOfficer && <Badge variant="secondary" className="h-4 text-[10px] gap-0.5"><Shield className="h-2.5 w-2.5" />Officer</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground capitalize">{String(memberRole).replace("_", " ")}</p>
                </div>
              </button>
              {isCaptain && !memberIsCaptain && userId !== user?.id && (
                <div className="flex items-center gap-1 flex-wrap justify-end">
                  {memberIsViceCaptain ? (
                    <Button variant="ghost" size="sm" className="text-xs gap-1"
                      onClick={() => promoteMutation.mutate({ userId, toRole: "member" })}>
                      <ShieldOff className="h-3 w-3" />Remove vice
                    </Button>
                  ) : (
                    <Button variant="ghost" size="sm" className="text-xs gap-1"
                      onClick={() => promoteMutation.mutate({ userId, toRole: "vice_captain" })}>
                      <Star className="h-3 w-3" />Make vice
                    </Button>
                  )}
                  {memberIsOfficer ? (
                    <Button variant="ghost" size="sm" className="text-xs gap-1"
                      onClick={() => promoteMutation.mutate({ userId, toRole: "member" })}>
                      <ShieldOff className="h-3 w-3" />Demote
                    </Button>
                  ) : !memberIsViceCaptain && (
                    <Button variant="ghost" size="sm" className="text-xs gap-1"
                      onClick={() => promoteMutation.mutate({ userId, toRole: "officer" })}>
                      <Shield className="h-3 w-3" />Make officer
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" className="text-xs gap-1 text-primary hover:text-primary"
                    onClick={() => setTransferTarget({ userId, name: profile?.display_name || "this member" })}>
                    <ArrowUpCircle className="h-3 w-3" />Transfer captain
                  </Button>
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

    <AlertDialog open={!!transferTarget} onOpenChange={(o) => !o && setTransferTarget(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Transfer captain role?</AlertDialogTitle>
          <AlertDialogDescription>
            {transferTarget?.name} will become the new captain. You'll be moved to vice captain and lose
            captain-only permissions. This can only be undone by the new captain.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => transferTarget && transferCaptainMutation.mutate(transferTarget.userId)}
            disabled={transferCaptainMutation.isPending}
          >
            {transferCaptainMutation.isPending ? "Transferring..." : "Yes, transfer"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </div>
  );
}