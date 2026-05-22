import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface MemberProfile {
  id: string;
  display_name: string | null;
  photos: string[] | null;
  fishing_experience: string | null;
}

export function useTeamContext(teamId: string | undefined) {
  const { user } = useAuth();

  const { data: team, isLoading: teamLoading } = useQuery({
    queryKey: ["team-detail", teamId],
    queryFn: async () => {
      const { data, error } = await supabase.from("fishing_teams").select("*").eq("id", teamId!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!teamId,
  });

  const { data: allRows = [] } = useQuery({
    queryKey: ["team-members", teamId],
    queryFn: async () => {
      const { data } = await supabase.from("team_members").select("*").eq("team_id", teamId!);
      return data || [];
    },
    enabled: !!teamId,
  });

  const members = useMemo(() => allRows.filter((m: any) => m.status === "approved" || !m.status), [allRows]);
  const pendingRequests = useMemo(() => allRows.filter((m: any) => m.status === "pending"), [allRows]);

  const memberUserIds = useMemo(
    () => [...(team ? [team.captain_id] : []), ...members.map((m: any) => m.user_id)],
    [team, members],
  );

  const { data: profiles = {} } = useQuery({
    queryKey: ["team-member-profiles", memberUserIds.join(",")],
    queryFn: async () => {
      if (memberUserIds.length === 0) return {} as Record<string, MemberProfile>;
      const { data } = await supabase
        .from("profiles_safe")
        .select("id, display_name, photos, fishing_experience")
        .in("id", memberUserIds);
      const map: Record<string, MemberProfile> = {};
      (data || []).forEach((p: any) => { map[p.id] = p as MemberProfile; });
      return map;
    },
    enabled: memberUserIds.length > 0,
  });

  const isCaptain = !!user && team?.captain_id === user.id;
  const isMember = !!user && (isCaptain || members.some((m: any) => m.user_id === user.id));
  const myPending = !!user && pendingRequests.some((m: any) => m.user_id === user.id);
  const memberCount = (team ? 1 : 0) + members.filter((m: any) => m.user_id !== team?.captain_id).length;

  return { team, teamLoading, members, pendingRequests, memberUserIds, profiles, isCaptain, isMember, myPending, memberCount };
}
