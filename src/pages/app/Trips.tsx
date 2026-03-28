import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Zap, SlidersHorizontal, Calendar } from "lucide-react";
import { TripInvitations } from "@/components/trips";
import { NextUpTrip } from "@/components/trips/NextUpTrip";
import { TripCard } from "@/components/trips/TripCard";
import { NewAdventureCard } from "@/components/trips/NewAdventureCard";

export default function Trips() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState("date");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data: trips, isLoading } = useQuery({
    queryKey: ["my-trips", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("fishing_trips")
        .select("*")
        .eq("user_id", user.id)
        .order("trip_date", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingTrips = trips?.filter(
    (trip) => new Date(trip.trip_date) >= today && trip.status !== "completed" && trip.status !== "cancelled"
  ) || [];
  
  const nextTrip = upcomingTrips[0];
  const plannedTrips = upcomingTrips.slice(1);

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-6xl py-6 px-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-1">Your Trips</h1>
            <p className="text-muted-foreground">
              Plan and manage your upcoming fishing adventures
            </p>
          </div>
          <Button 
            onClick={() => navigate("/app/trips/new")}
          >
            <Plus className="h-4 w-4 mr-2" />
            Plan New Trip
          </Button>
        </div>

        {/* Trip Invitations */}
        <TripInvitations />

        {isLoading ? (
          <div className="space-y-6">
            <Skeleton className="h-80 w-full rounded-xl" />
            <div className="grid gap-4 md:grid-cols-3">
              <Skeleton className="h-64 rounded-xl" />
              <Skeleton className="h-64 rounded-xl" />
              <Skeleton className="h-64 rounded-xl" />
            </div>
          </div>
        ) : (
          <>
            {/* Next Up Section */}
            {nextTrip && (
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="h-5 w-5 text-amber-500" />
                  <h2 className="text-lg font-semibold">Next Up</h2>
                </div>
                <NextUpTrip trip={nextTrip} />
              </div>
            )}

            {/* Planned Adventures Section */}
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                <h2 className="text-lg font-semibold">Planned Adventures</h2>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-sm"
                  >
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Sort by: Date
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-sm"
                  >
                    <SlidersHorizontal className="h-4 w-4 mr-2" />
                    Status: All
                  </Button>
                </div>
              </div>

              {plannedTrips.length === 0 && !nextTrip ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-semibold mb-2">No trips planned yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Start planning your next fishing adventure!
                    </p>
                    <Button 
                      onClick={() => navigate("/app/trips/new")}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Plan Your First Trip
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {plannedTrips.map((trip) => (
                    <TripCard key={trip.id} trip={trip} />
                  ))}
                  <NewAdventureCard />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
