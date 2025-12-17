import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Calendar, MapPin, Check, X, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface TripInvitation {
  id: string;
  trip_id: string;
  status: string;
  created_at: string;
  trip: {
    id: string;
    title: string;
    trip_date: string;
    location_name: string | null;
    user_id: string;
    owner: {
      display_name: string | null;
      photos: string[] | null;
    } | null;
  };
}

export function TripInvitations() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: invitations, isLoading } = useQuery({
    queryKey: ["trip-invitations", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("trip_participants")
        .select(`
          id,
          trip_id,
          status,
          created_at,
          trip:fishing_trips!inner(
            id,
            title,
            trip_date,
            location_name,
            user_id
          )
        `)
        .eq("user_id", user.id)
        .eq("status", "invited")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch owner profiles separately
      const tripUserIds = [...new Set((data || []).map((d: any) => d.trip.user_id))];
      
      if (tripUserIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, photos")
        .in("id", tripUserIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p]));

      return (data || []).map((inv: any) => ({
        ...inv,
        trip: {
          ...inv.trip,
          owner: profileMap.get(inv.trip.user_id) || null,
        },
      })) as TripInvitation[];
    },
    enabled: !!user?.id,
  });

  const respondMutation = useMutation({
    mutationFn: async ({ invitationId, status }: { invitationId: string; status: "accepted" | "declined" }) => {
      const { error } = await supabase
        .from("trip_participants")
        .update({ status })
        .eq("id", invitationId);

      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ["trip-invitations"] });
      queryClient.invalidateQueries({ queryKey: ["my-trips"] });
      toast({
        title: status === "accepted" ? "Invitation accepted!" : "Invitation declined",
        description: status === "accepted" 
          ? "You've joined the trip." 
          : "You've declined the invitation.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to respond to invitation",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="animate-pulse flex gap-4">
                <div className="h-10 w-10 rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-32 bg-muted rounded" />
                  <div className="h-3 w-24 bg-muted rounded" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!invitations?.length) {
    return null;
  }

  return (
    <div className="space-y-4 mb-6">
      <div className="flex items-center gap-2">
        <Users className="h-5 w-5 text-primary" />
        <h2 className="font-semibold">Trip Invitations</h2>
        <Badge variant="secondary">{invitations.length}</Badge>
      </div>
      
      <div className="space-y-3">
        {invitations.map((invitation) => (
          <Card key={invitation.id} className="overflow-hidden">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={invitation.trip.owner?.photos?.[0]} />
                  <AvatarFallback>
                    {invitation.trip.owner?.display_name?.charAt(0)?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {invitation.trip.owner?.display_name || "Someone"}
                    </span>{" "}
                    invited you to join:
                  </p>
                  <h3 
                    className="font-semibold truncate cursor-pointer hover:text-primary"
                    onClick={() => navigate(`/app/trips/${invitation.trip.id}`)}
                  >
                    {invitation.trip.title}
                  </h3>
                  <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(invitation.trip.trip_date), "MMM d, yyyy")}
                    </span>
                    {invitation.trip.location_name && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {invitation.trip.location_name}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => respondMutation.mutate({ 
                      invitationId: invitation.id, 
                      status: "declined" 
                    })}
                    disabled={respondMutation.isPending}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => respondMutation.mutate({ 
                      invitationId: invitation.id, 
                      status: "accepted" 
                    })}
                    disabled={respondMutation.isPending}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Join
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
