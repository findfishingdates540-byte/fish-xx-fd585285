import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export function useTeamFollow(teamId: string | undefined) {
  const qc = useQueryClient();
  const { user } = useAuth();
  const key = ["team-follow", teamId, user?.id] as const;

  const q = useQuery({
    queryKey: key,
    enabled: !!teamId,
    queryFn: async () => {
      const [{ count }, mine] = await Promise.all([
        supabase.from("team_followers").select("*", { count: "exact", head: true }).eq("team_id", teamId!),
        user
          ? supabase.from("team_followers").select("id").eq("team_id", teamId!).eq("user_id", user.id).maybeSingle()
          : Promise.resolve({ data: null } as any),
      ]);
      return { count: count || 0, isFollowing: !!(mine as any).data };
    },
  });

  const toggle = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Login to follow");
      if (!teamId) throw new Error("Missing team");
      if (q.data?.isFollowing) {
        const { error } = await supabase.from("team_followers").delete().eq("team_id", teamId).eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("team_followers").insert({ team_id: teamId, user_id: user.id });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: key, exact: true });
      toast.success(q.data?.isFollowing ? "Unfollowed team" : "Following team — you'll see their Page posts");
    },
    onError: (e: any) => toast.error(e.message || "Could not update follow"),
  });

  return { ...q, toggle };
}
