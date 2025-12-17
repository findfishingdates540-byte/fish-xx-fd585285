import { useNavigate, useParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  Calendar,
  Clock,
  MapPin,
  Edit,
  Trash2,
  Users,
  User as UserIcon,
  Package,
  Fish,
  Bell,
  Sun,
  FileText,
  CheckCircle,
  Check,
  X,
  HourglassIcon,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface GearItem {
  id: string;
  name: string;
  checked: boolean;
}

interface Participant {
  id: string;
  user_id: string;
  status: string;
  profile: {
    display_name: string | null;
    photos: string[] | null;
  } | null;
}

export default function TripDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: trip, isLoading } = useQuery({
    queryKey: ["trip", id],
    queryFn: async () => {
      if (!id) throw new Error("No trip ID");
      const { data, error } = await supabase
        .from("fishing_trips")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch participants for buddies trips
  const { data: participants } = useQuery({
    queryKey: ["trip-participants-detail", id],
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from("trip_participants")
        .select("id, user_id, status")
        .eq("trip_id", id);
      if (error) throw error;

      if (!data?.length) return [];

      // Fetch profiles for participants
      const userIds = data.map((p) => p.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, photos")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p]));

      return data.map((p) => ({
        ...p,
        profile: profileMap.get(p.user_id) || null,
      })) as Participant[];
    },
    enabled: !!id && trip?.trip_type === "buddies",
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error("No trip ID");
      const { error } = await supabase
        .from("fishing_trips")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-trips"] });
      toast({ title: "Trip deleted" });
      navigate("/app/trips");
    },
    onError: () => {
      toast({ title: "Error deleting trip", variant: "destructive" });
    },
  });

  const markCompleteMutation = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error("No trip ID");
      const { error } = await supabase
        .from("fishing_trips")
        .update({ status: "completed" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trip", id] });
      queryClient.invalidateQueries({ queryKey: ["my-trips"] });
      toast({ title: "Trip marked as completed!" });
    },
  });

  if (isLoading) {
    return (
      <div className="container max-w-4xl py-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-48" />
          <div className="h-4 bg-muted rounded w-32" />
          <Card>
            <CardContent className="p-6">
              <div className="h-32 bg-muted rounded" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="container max-w-4xl py-6 text-center">
        <h1 className="text-xl font-bold mb-2">Trip not found</h1>
        <Button onClick={() => navigate("/app/trips")}>Back to Trips</Button>
      </div>
    );
  }

  const gearChecklist = (trip.gear_checklist && Array.isArray(trip.gear_checklist) 
    ? trip.gear_checklist as unknown as GearItem[] 
    : []);
  const isPast = new Date(trip.trip_date) < new Date();

  return (
    <div className="container max-w-4xl py-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
        <Link to="/app" className="hover:text-foreground">Home</Link>
        <span>/</span>
        <Link to="/app/trips" className="hover:text-foreground">My Trips</Link>
        <span>/</span>
        <span className="text-foreground">{trip.title}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold">{trip.title}</h1>
            <Badge variant={trip.trip_type === "solo" ? "secondary" : "default"}>
              {trip.trip_type === "solo" ? (
                <><UserIcon className="h-3 w-3 mr-1" /> Solo</>
              ) : (
                <><Users className="h-3 w-3 mr-1" /> Buddies</>
              )}
            </Badge>
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
          <p className="text-muted-foreground">
            Created on {format(new Date(trip.created_at), "MMMM d, yyyy")}
          </p>
        </div>
        <div className="flex gap-2">
          {trip.status === "planned" && (
            <Button
              variant="outline"
              onClick={() => markCompleteMutation.mutate()}
              disabled={markCompleteMutation.isPending}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark Complete
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => navigate(`/app/trips/${id}/edit`)}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this trip?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your
                  trip plan.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => deleteMutation.mutate()}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Date & Time */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date & Time
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">
                  {format(new Date(trip.trip_date), "EEEE, MMMM d, yyyy")}
                </span>
              </div>
              {trip.start_time && (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {trip.start_time.slice(0, 5)}
                    {trip.end_time && ` - ${trip.end_time.slice(0, 5)}`}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Location */}
          {trip.location_name && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{trip.location_name}</p>
              </CardContent>
            </Card>
          )}

          {/* Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Reminders
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span>
                  Departure reminder:{" "}
                  <strong>{trip.departure_reminder ? "On" : "Off"}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Sun className="h-4 w-4 text-muted-foreground" />
                <span>
                  Weather alert:{" "}
                  <strong>{trip.weather_alert ? "On" : "Off"}</strong>
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Participants - only for buddies trips */}
          {trip.trip_type === "buddies" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Participants ({(participants?.length || 0) + 1})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Trip owner */}
                <div className="flex items-center gap-3 p-2 bg-primary/5 rounded-lg">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>You</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium text-sm">You</p>
                    <p className="text-xs text-muted-foreground">Trip organizer</p>
                  </div>
                  <Badge variant="secondary">Organizer</Badge>
                </div>

                {/* Invited participants */}
                {participants?.map((participant) => (
                  <div key={participant.id} className="flex items-center gap-3 p-2 rounded-lg border">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={participant.profile?.photos?.[0]} />
                      <AvatarFallback>
                        {participant.profile?.display_name?.charAt(0)?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {participant.profile?.display_name || "Unknown"}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {participant.status}
                      </p>
                    </div>
                    <Badge
                      variant={
                        participant.status === "accepted"
                          ? "default"
                          : participant.status === "declined"
                          ? "destructive"
                          : "secondary"
                      }
                      className="flex items-center gap-1"
                    >
                      {participant.status === "accepted" && <Check className="h-3 w-3" />}
                      {participant.status === "declined" && <X className="h-3 w-3" />}
                      {participant.status === "invited" && <HourglassIcon className="h-3 w-3" />}
                      {participant.status}
                    </Badge>
                  </div>
                ))}

                {(!participants || participants.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    No buddies invited yet
                  </p>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Notes */}
          {(trip.notes || trip.bait_details || trip.weather_notes) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Trip Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {trip.notes && (
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {trip.notes}
                  </p>
                )}
                {trip.bait_details && (
                  <div>
                    <p className="font-medium text-sm mb-1">Bait Details</p>
                    <p className="text-muted-foreground text-sm">
                      {trip.bait_details}
                    </p>
                  </div>
                )}
                {trip.weather_notes && (
                  <div>
                    <p className="font-medium text-sm mb-1">Weather Notes</p>
                    <p className="text-muted-foreground text-sm">
                      {trip.weather_notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Gear Checklist */}
          {gearChecklist.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Gear Checklist
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {gearChecklist.map((item) => (
                    <div key={item.id} className="flex items-center gap-2">
                      <Checkbox checked={item.checked} disabled />
                      <span
                        className={
                          item.checked
                            ? "line-through text-muted-foreground"
                            : ""
                        }
                      >
                        {item.name}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Target Species */}
          {trip.target_species && trip.target_species.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Fish className="h-4 w-4" />
                  Target Species
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {trip.target_species.map((species: string) => (
                    <Badge key={species} variant="secondary">
                      {species}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
