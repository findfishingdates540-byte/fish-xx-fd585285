import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface TeamRoleInfo {
  isCaptain: boolean;
  isOfficer: boolean;
  isViceCaptain: boolean;
  isMember: boolean;
  canPostPage: boolean;
  canPostGroup: boolean;
  role: "captain" | "vice_captain" | "officer" | "member" | null;
}

export function useTeamRole(teamId: string | undefined) {
  const { user } = useAuth();
  return useQuery<TeamRoleInfo>({
    queryKey: ["team-role", teamId, user?.id],
    enabled: !!teamId,
    queryFn: async () => {
      const base: TeamRoleInfo = {
        isCaptain: false,
        isOfficer: false,
        isViceCaptain: false,
        isMember: false,
        canPostPage: false,
        canPostGroup: false,
        role: null,
      };
      if (!teamId || !user) return base;
      const [{ data: team }, { data: member }] = await Promise.all([
        supabase.from("fishing_teams").select("captain_id").eq("id", teamId).maybeSingle(),
        supabase.from("team_members").select("role").eq("team_id", teamId).eq("user_id", user.id).maybeSingle(),
      ]);
      const isCaptain = team?.captain_id === user.id;
      const isViceCaptain = !isCaptain && member?.role === "vice_captain";
      const isOfficer = !isCaptain && !isViceCaptain && member?.role === "officer";
      const isMember = isCaptain || !!member;
      return {
        isCaptain,
        isOfficer,
        isViceCaptain,
        isMember,
        canPostPage: isCaptain || isViceCaptain || isOfficer,
        canPostGroup: isMember,
        role: isCaptain ? "captain" : isViceCaptain ? "vice_captain" : isOfficer ? "officer" : isMember ? "member" : null,
      };
    },
  });
}