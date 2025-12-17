import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { Plus, Calendar, MapPin, Clock, Users, User as UserIcon } from "lucide-react";

export default function Trips() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("upcoming");

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
    (trip) => new Date(trip.trip_date) >= today && trip.status === "planned"
  );
  const pastTrips = trips?.filter(
    (trip) => new Date(trip.trip_date) < today || trip.status === "completed"
  );

  const TripCard = ({ trip }: { trip: any }) => (
    <Card
      className="cursor-pointer hover:shadow-md transition-shadow"
      onClick={() => navigate(`/app/trips/${trip.id}`)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            {trip.trip_type === "solo" ? (
              <UserIcon className="h-4 w-4 text-muted-foreground" />
            ) : (
              <Users className="h-4 w-4 text-muted-foreground" />
            )}
            <Badge variant={trip.trip_type === "solo" ? "secondary" : "default"}>
              {trip.trip_type === "solo" ? "Solo Trip" : "Buddies Trip"}
            </Badge>
          </div>
          <Badge
            variant={
              trip.status === "planned"
                ? "outline"
                : trip.status === "completed"
                ? "secondary"
                : "destructive"
            }
          >
            {trip.status}
          </Badge>
        </div>

        <h3 className="font-semibold text-lg mb-2">{trip.title}</h3>

        <div className="space-y-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{format(new Date(trip.trip_date), "EEEE, MMMM d, yyyy")}</span>
          </div>
          {trip.start_time && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>
                {trip.start_time}
                {trip.end_time && ` - ${trip.end_time}`}
              </span>
            </div>
          )}
          {trip.location_name && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              <span>{trip.location_name}</span>
            </div>
          )}
        </div>

        {trip.target_species && trip.target_species.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {trip.target_species.slice(0, 3).map((species: string) => (
              <Badge key={species} variant="outline" className="text-xs">
                {species}
              </Badge>
            ))}
            {trip.target_species.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{trip.target_species.length - 3} more
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="container max-w-4xl py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">My Trips</h1>
          <p className="text-muted-foreground">
            Plan and manage your fishing adventures
          </p>
        </div>
        <Button onClick={() => navigate("/app/trips/new")}>
          <Plus className="h-4 w-4 mr-2" />
          Plan Trip
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="upcoming">
            Upcoming ({upcomingTrips?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="past">
            Past ({pastTrips?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          {isLoading ? (
            <div className="grid gap-4 md:grid-cols-2">
              {[1, 2].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="animate-pulse space-y-3">
                      <div className="h-4 bg-muted rounded w-24" />
                      <div className="h-6 bg-muted rounded w-48" />
                      <div className="h-4 bg-muted rounded w-36" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : upcomingTrips?.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No upcoming trips</h3>
                <p className="text-muted-foreground mb-4">
                  Start planning your next fishing adventure!
                </p>
                <Button onClick={() => navigate("/app/trips/new")}>
                  <Plus className="h-4 w-4 mr-2" />
                  Plan Your First Trip
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {upcomingTrips?.map((trip) => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="past">
          {pastTrips?.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="font-semibold mb-2">No past trips</h3>
                <p className="text-muted-foreground">
                  Your completed trips will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {pastTrips?.map((trip) => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
