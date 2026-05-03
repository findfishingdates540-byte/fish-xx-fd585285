import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

interface TripInvitationPayload {
  id: string;
  trip_id: string;
  user_id: string;
  status: string;
}

export function useTripInvitationNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.id) return;

    console.log("Setting up trip invitation realtime subscription for user:", user.id);

    // Subscribe to new invitations for the current user (INSERT)
    const invitationChannel = supabase
      .channel("trip-invitation-new")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "trip_participants",
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          console.log("New trip invitation received:", payload);
          
          const newData = payload.new as TripInvitationPayload;

          // Only notify for invited status
          if (newData.status === "invited") {
            // Fetch the trip details
            const { data: trip } = await supabase
              .from("fishing_trips")
              .select("id, title, trip_date, location_name, user_id")
              .eq("id", newData.trip_id)
              .single();

            if (trip) {
              // Fetch the trip owner's profile
              const { data: ownerProfile } = await supabase
                .from("profiles_safe")
                .select("display_name")
                .eq("id", trip.user_id)
                .single();

              const ownerName = ownerProfile?.display_name || "A buddy";

              // Show in-app toast notification
              toast({
                title: "New Trip Invitation! 🎣",
                description: `${ownerName} invited you to "${trip.title}" at ${trip.location_name || "a fishing spot"}`,
              });

              // Invalidate queries to refresh the UI
              queryClient.invalidateQueries({ queryKey: ["trip-invitations"] });
              queryClient.invalidateQueries({ queryKey: ["my-trips"] });
            }
          }
        }
      )
      .subscribe((status) => {
        console.log("Trip invitation (new) subscription status:", status);
      });

    // Subscribe to changes on trips the user owns (for responses)
    const responseChannel = supabase
      .channel("trip-invitation-updates")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "trip_participants",
        },
        async (payload) => {
          console.log("Trip participant update received:", payload);
          
          const newData = payload.new as TripInvitationPayload;
          const oldData = payload.old as TripInvitationPayload;

          // Only notify if status changed from "invited" to something else
          if (oldData.status === "invited" && newData.status !== "invited") {
            // Fetch the trip to check if current user is the owner
            const { data: trip } = await supabase
              .from("fishing_trips")
              .select("id, title, user_id")
              .eq("id", newData.trip_id)
              .single();

            if (trip && trip.user_id === user.id) {
              // Fetch the buddy's profile
              const { data: buddyProfile } = await supabase
                .from("profiles_safe")
                .select("display_name")
                .eq("id", newData.user_id)
                .single();

              const buddyName = buddyProfile?.display_name || "A buddy";
              const isAccepted = newData.status === "accepted";

              // Show in-app toast notification
              toast({
                title: isAccepted ? "Trip Invitation Accepted! 🎉" : "Trip Invitation Declined",
                description: `${buddyName} has ${isAccepted ? "joined" : "declined"} your trip "${trip.title}"`,
                variant: isAccepted ? "default" : "destructive",
              });

              // Invalidate queries to refresh the UI
              queryClient.invalidateQueries({ queryKey: ["trip-participants-detail", trip.id] });
              queryClient.invalidateQueries({ queryKey: ["trip-participants", trip.id] });
              queryClient.invalidateQueries({ queryKey: ["my-trips"] });
            }
          }
        }
      )
      .subscribe((status) => {
        console.log("Trip invitation (updates) subscription status:", status);
      });

    return () => {
      console.log("Cleaning up trip invitation subscriptions");
      supabase.removeChannel(invitationChannel);
      supabase.removeChannel(responseChannel);
    };
  }, [user?.id, queryClient]);
}

// Function to send push notification when responding to invitation
export async function sendTripResponseNotification(
  tripOwnerId: string,
  responderName: string,
  tripTitle: string,
  accepted: boolean
) {
  try {
    console.log("Sending push notification for trip response:", {
      tripOwnerId,
      responderName,
      tripTitle,
      accepted,
    });

    const { data, error } = await supabase.functions.invoke("send-push-notification", {
      body: {
        userId: tripOwnerId,
        title: accepted ? "Trip Invitation Accepted!" : "Trip Invitation Declined",
        body: `${responderName} has ${accepted ? "joined" : "declined"} your trip "${tripTitle}"`,
        url: "/app/trips",
        tag: `trip-response-${tripOwnerId}`,
      },
    });

    if (error) {
      console.error("Error sending push notification:", error);
    } else {
      console.log("Push notification sent:", data);
    }
  } catch (error) {
    console.error("Error invoking push notification function:", error);
  }
}

// Function to send push notification when inviting someone to a trip
export async function sendTripInvitationNotification(
  inviteeId: string,
  inviterName: string,
  tripTitle: string,
  tripLocation: string | null
) {
  try {
    console.log("Sending push notification for trip invitation:", {
      inviteeId,
      inviterName,
      tripTitle,
    });

    const { data, error } = await supabase.functions.invoke("send-push-notification", {
      body: {
        userId: inviteeId,
        title: "New Trip Invitation! 🎣",
        body: `${inviterName} invited you to "${tripTitle}" at ${tripLocation || "a fishing spot"}`,
        url: "/app/trips",
        tag: `trip-invite-${inviteeId}`,
      },
    });

    if (error) {
      console.error("Error sending push notification:", error);
    } else {
      console.log("Push notification sent:", data);
    }
  } catch (error) {
    console.error("Error invoking push notification function:", error);
  }
}
