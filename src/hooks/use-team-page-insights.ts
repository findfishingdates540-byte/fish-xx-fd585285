import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TeamPageInsights {
  views_30d: number;
  unique_viewers_30d: number;
  views_7d: number;
  followers_total: number;
  followers_new_30d: number;
  followers_new_7d: number;
  top_post: {
    id: string;
    content: string | null;
    media: any;
    likes_count: number;
    comments_count: number;
    created_at: string;
    engagement: number;
  } | null;
}

export function useTeamPageInsights(teamId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ["team-page-insights", teamId],
    enabled: !!teamId && enabled,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_team_page_insights", { p_team_id: teamId! });
      if (error) throw error;
      return data as unknown as TeamPageInsights;
    },
  });
}

export async function logTeamPageView(teamId: string, viewerId: string | null) {
  try {
    await supabase.from("team_page_views").insert({ team_id: teamId, viewer_id: viewerId });
  } catch {
    /* fire-and-forget */
  }
}