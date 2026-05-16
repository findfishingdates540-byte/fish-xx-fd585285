import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { playNotificationSound } from "@/utils/notification-sound";

/**
 * Subscribes to live tournament_matchups updates for a single tournament,
 * plays an alert sound, shows a toast, and refreshes tournament queries.
 * Intended to be mounted inside TournamentDetail.
 */
export function useTournamentMatchAlerts(tournamentId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!tournamentId) return;

    const channel = supabase
      .channel(`tournament-matches-${tournamentId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "tournament_matchups",
          filter: `tournament_id=eq.${tournamentId}`,
        },
        (payload) => {
          const next = payload.new as {
            status?: string;
            team1_id?: string | null;
            team2_id?: string | null;
            winner_team_id?: string | null;
          };
          const prev = payload.old as { status?: string };
          const justCompleted =
            next?.status === "completed" && prev?.status !== "completed";
          if (justCompleted) {
            playNotificationSound();
            toast.info("A tournament match just finished", {
              description: "Bracket and standings updated.",
            });
          }
          queryClient.invalidateQueries({ queryKey: ["tournament-matchups", tournamentId] });
          queryClient.invalidateQueries({ queryKey: ["tournament-team-leaderboard", tournamentId] });
          queryClient.invalidateQueries({ queryKey: ["tournament-team-round-scores", tournamentId] });
          queryClient.invalidateQueries({ queryKey: ["tournament-matchup-mvps", tournamentId] });
          if (user?.id) {
            queryClient.invalidateQueries({ queryKey: ["notifications", user.id] });
            queryClient.invalidateQueries({ queryKey: ["unread-notifications-count", user.id] });
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tournamentId, queryClient, user?.id]);
}