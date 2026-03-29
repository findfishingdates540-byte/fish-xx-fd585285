import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { format, addDays } from "date-fns";
import { useWeather, getWindDirection, getFishingConditions } from "@/hooks/use-weather";
import { sendTripInvitationNotification } from "@/hooks/use-trip-notifications";
import { TripInviteSuccessModal } from "@/components/trips";
import {
  MapPin,
  MessageSquare,
  Star,
  Fish,
  Droplets,
  Sun,
  Cloud,
  Wind,
  AlertTriangle,
  Bookmark,
  Calendar,
  CheckCircle2,
  Circle,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BuddyProfile {
  id: string;
  display_name: string | null;
  photos: string[] | null;
  date_of_birth: string | null;
  fishing_experience: string | null;
  preferred_species: string[] | null;
  location_name: string | null;
  bio: string | null;
}

interface FishingSpot {
  id: string;
  name: string;
  photos: string[] | null;
  rating_avg: number | null;
  species_available: string[] | null;
  location_lat: number;
  location_lng: number;
  location_name: string | null;
  description: string | null;
}

const timeSlots = [
  { id: "morning", label: "06:00 AM - 10:00 AM" },
  { id: "late-morning", label: "09:00 AM - 01:00 PM" },
  { id: "afternoon", label: "02:00 PM - 06:00 PM" },
  { id: "evening", label: "05:00 PM - 09:00 PM" },
];

const defaultActivities = [
  { id: "fishing", label: "Fishing (4hrs)", checked: true },
  { id: "picnic", label: "Picnic Lunch", checked: true },
  { id: "hiking", label: "Hiking Trail", checked: false },
];

function calculateAge(dob: string | null): number | null {
  if (!dob) return null;
  const birth = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  if (today < new Date(birth.setFullYear(today.getFullYear()))) age--;
  return age;
}

export default function BuddyTripInvite() {
  const { buddyId, spotId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedDate, setSelectedDate] = useState<Date>(addDays(new Date(), 1));
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("late-morning");
  const [activities, setActivities] = useState(defaultActivities);
  const [note, setNote] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Generate next 4 days for date picker
  const dateOptions = Array.from({ length: 4 }, (_, i) => addDays(new Date(), i));

  // Fetch buddy profile
  const { data: buddy, isLoading: buddyLoading } = useQuery({
    queryKey: ["buddy-profile", buddyId],
    queryFn: async () => {
      if (!buddyId) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, photos, date_of_birth, fishing_experience, preferred_species, location_name, bio")
        .eq("id", buddyId)
        .maybeSingle();
      if (error) throw error;
      return data as BuddyProfile | null;
    },
    enabled: !!buddyId,
  });

  // Fetch fishing spot
  const { data: spot, isLoading: spotLoading } = useQuery({
    queryKey: ["fishing-spot", spotId],
    queryFn: async () => {
      if (!spotId) return null;
      const { data, error } = await supabase
        .from("fishing_spots")
        .select("*")
        .eq("id", spotId)
        .maybeSingle();
      if (error) throw error;
      return data as FishingSpot | null;
    },
    enabled: !!spotId,
  });

  // Fetch weather for spot
  const { data: weatherData, isLoading: weatherLoading } = useWeather(
    spot?.location_lat || null,
    spot?.location_lng || null
  );

  // Toggle activity
  const toggleActivity = (id: string) => {
    setActivities(activities.map(a => 
      a.id === id ? { ...a, checked: !a.checked } : a
    ));
  };

  // Send invitation mutation
  const inviteMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !buddyId || !spot) {
        throw new Error("Missing required data");
      }

      const selectedTime = timeSlots.find(t => t.id === selectedTimeSlot);
      const startTime = selectedTime?.label.split(" - ")[0] || "09:00 AM";
      const tripTitle = `Trip to ${spot.name} with ${buddy?.display_name || "Buddy"}`;

      // Create the trip
      const { data: trip, error: tripError } = await supabase
        .from("fishing_trips")
        .insert({
          user_id: user.id,
          trip_type: "buddies",
          title: tripTitle,
          trip_date: format(selectedDate, "yyyy-MM-dd"),
          start_time: startTime,
          location_name: spot.name,
          location_lat: spot.location_lat,
          location_lng: spot.location_lng,
          fishing_spot_id: spot.id,
          notes: note || null,
          status: "planned",
        })
        .select("id")
        .single();

      if (tripError) throw tripError;

      // Invite the buddy with "invited" status
      const { error: inviteError } = await supabase
        .from("trip_participants")
        .insert({
          trip_id: trip.id,
          user_id: buddyId,
          status: "invited",
        });

      if (inviteError) throw inviteError;

      // Fetch current user's display name for the notification
      const { data: currentUserProfile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", user.id)
        .single();

      // Send push notification to the buddy
      await sendTripInvitationNotification(
        buddyId,
        currentUserProfile?.display_name || "A buddy",
        tripTitle,
        spot.name
      );

      return trip;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-trips"] });
      queryClient.invalidateQueries({ queryKey: ["trip-invitations"] });
      setShowSuccessModal(true);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const selectedTimeLabel = timeSlots.find(t => t.id === selectedTimeSlot)?.label.split(" - ")[0] || "";

  if (buddyLoading || spotLoading) {
    return (
      <div className="min-h-screen bg-muted/30 p-6">
        <div className="container max-w-7xl">
          <Skeleton className="h-8 w-64 mb-6" />
          <div className="grid lg:grid-cols-3 gap-6">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
        </div>
      </div>
    );
  }

  if (!buddy || !spot) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-muted-foreground mb-4">Buddy or spot not found</p>
          <Button onClick={() => navigate("/app/buddies")}>Go Back</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 pb-24">
      {/* Breadcrumb */}
      <div className="border-b bg-background">
        <div className="container max-w-7xl py-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/app" className="hover:text-foreground">Home</Link>
            <span>/</span>
            <Link to="/app/feed" className="hover:text-foreground">Home</Link>
            <span>/</span>
            <span className="text-foreground">Planner</span>
          </div>
        </div>
      </div>

      <div className="container max-w-7xl py-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1">
              Plan your trip with {buddy.display_name?.split(" ")[0] || "Buddy"}
            </h1>
            <p className="text-muted-foreground">
              Coordinate the perfect fishing date.
            </p>
          </div>
          
          {/* Weather Alert */}
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-full text-orange-600 text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span>High surf advisory in effect for {spot.name} until 6 PM.</span>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-[280px_1fr_300px] gap-6">
          {/* Left Column - Buddy Profile */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="relative inline-block mb-3">
                  <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                    <AvatarImage src={buddy.photos?.[0]} />
                    <AvatarFallback className="text-2xl">
                      {buddy.display_name?.[0] || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-2 border-background rounded-full" />
                </div>
                
                <h3 className="font-semibold text-lg">{buddy.display_name}</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  {buddy.fishing_experience ? `${buddy.fishing_experience.charAt(0).toUpperCase() + buddy.fishing_experience.slice(1)} Angler` : "Fishing Enthusiast"}
                  {calculateAge(buddy.date_of_birth) && ` • ${calculateAge(buddy.date_of_birth)}`}
                </p>

                {/* Tags */}
                <div className="flex justify-center gap-2 mb-4">
                  {buddy.preferred_species?.slice(0, 2).map((species) => (
                    <Badge key={species} variant="secondary" className="text-xs">
                      {species}
                    </Badge>
                  )) || (
                    <>
                      <Badge variant="secondary" className="text-xs">
                        <Fish className="h-3 w-3 mr-1" />
                        Bass
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        <Droplets className="h-3 w-3 mr-1" />
                        Lake
                      </Badge>
                    </>
                  )}
                </div>

                {/* Availability */}
                <div className="bg-cyan-50 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-800 rounded-lg p-3 mb-4">
                  <p className="text-xs text-cyan-600 dark:text-cyan-400 font-medium uppercase tracking-wide">Availability</p>
                  <p className="text-cyan-700 dark:text-cyan-300 font-medium">Free this Weekend</p>
                </div>

                <Button variant="outline" className="w-full" onClick={() => navigate(`/app/buddy-chat/${buddyId}`)}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send Message
                </Button>
              </CardContent>
            </Card>

            {/* Last Message */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Last Message</p>
                  <span className="text-xs text-muted-foreground">2h ago</span>
                </div>
                <p className="text-sm italic text-muted-foreground">
                  "{buddy.bio?.slice(0, 100) || "I'd love to try out that new spot near the dam! Saturday morning works best for me."}"
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Center Column - Spot Details */}
          <div className="space-y-4">
            {/* Spot Hero */}
            <Card className="overflow-hidden">
              <div className="relative h-48">
                <img
                  src={spot.photos?.[0] || "https://images.unsplash.com/photo-1500463959177-e0869687df26?w=800"}
                  alt={spot.name}
                  className="w-full h-full object-cover"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "absolute top-3 right-3 bg-white/80 hover:bg-white",
                    isSaved && "text-primary"
                  )}
                  onClick={() => setIsSaved(!isSaved)}
                >
                  <Bookmark className={cn("h-5 w-5", isSaved && "fill-current")} />
                </Button>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                  <h2 className="text-xl font-bold text-white">{spot.name}</h2>
                  <p className="text-white/80 text-sm flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {spot.location_name || "12 miles away"}
                  </p>
                </div>
              </div>

              {/* Spot Stats */}
              <CardContent className="p-4">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="flex items-center justify-center gap-1 text-amber-500 mb-1">
                      <Star className="h-4 w-4 fill-current" />
                      <span className="font-semibold">{spot.rating_avg?.toFixed(1) || "4.8"}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Rating</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 text-primary mb-1">
                      <Fish className="h-4 w-4" />
                      <span className="font-semibold">{spot.species_available?.[0] || "Trout"}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Dominant</p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 text-cyan-500 mb-1">
                      <Droplets className="h-4 w-4" />
                      <span className="font-semibold">Clear</span>
                    </div>
                    <p className="text-xs text-muted-foreground">Water</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Weather Forecast */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Cloud className="h-4 w-4 text-primary" />
                    Forecast
                  </CardTitle>
                  <Badge variant="outline" className="text-primary">
                    {format(selectedDate, "EEEE")}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {weatherLoading ? (
                  <Skeleton className="h-20 w-full" />
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {weatherData?.condition?.toLowerCase().includes('clear') ? (
                        <Sun className="h-12 w-12 text-yellow-500" />
                      ) : weatherData?.condition?.toLowerCase().includes('cloud') ? (
                        <Cloud className="h-12 w-12 text-gray-400" />
                      ) : (
                        <Sun className="h-12 w-12 text-yellow-500" />
                      )}
                      <div>
                        <p className="text-3xl font-bold">{weatherData?.temperature ?? 72}°F</p>
                        <p className="text-sm text-muted-foreground">
                          {weatherData?.condition || "Sunny"}, {weatherData?.description || "Clear Skies"}
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <p className="flex items-center justify-end gap-1">
                        <Wind className="h-4 w-4" />
                        Wind: {weatherData?.wind?.speed ?? 5}mph {weatherData?.wind?.direction ? getWindDirection(weatherData.wind.direction) : "NW"}
                      </p>
                      <p>Humidity: {weatherData?.humidity ?? 45}%</p>
                    </div>
                  </div>
                )}

                {/* Hourly Forecast */}
                <div className="flex justify-between pt-4 border-t">
                  {["8 AM", "10 AM", "12 PM", "2 PM", "4 PM"].map((time, i) => {
                    const temps = [65, 68, 72, 74, 70];
                    const isNoon = time === "12 PM";
                    return (
                      <div key={time} className={cn("text-center", isNoon && "text-primary")}>
                        <p className="text-xs text-muted-foreground">{time}</p>
                        {i % 2 === 0 ? (
                          <Sun className={cn("h-5 w-5 mx-auto my-1", isNoon ? "text-primary" : "text-yellow-500")} />
                        ) : (
                          <Sun className="h-5 w-5 mx-auto my-1 text-yellow-500" />
                        )}
                        <p className={cn("text-sm font-medium", isNoon && "text-primary")}>{temps[i]}°</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Map Preview */}
            <Card className="overflow-hidden">
              <div className="relative h-32 bg-gradient-to-br from-cyan-100 to-blue-200">
                <img
                  src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=200&fit=crop"
                  alt="Map preview"
                  className="w-full h-full object-cover opacity-50"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Button variant="secondary" className="shadow-lg">
                    <MapPin className="h-4 w-4 mr-2" />
                    View Full Map
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column - Date & Time Selection */}
          <div className="space-y-4">
            {/* Date Picker */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Select Date & Time
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Date Pills */}
                <div className="grid grid-cols-4 gap-2">
                  {dateOptions.map((date) => {
                    const isSelected = format(date, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd");
                    return (
                      <button
                        key={date.toISOString()}
                        onClick={() => setSelectedDate(date)}
                        className={cn(
                          "p-3 rounded-lg border text-center transition-all",
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary"
                            : "hover:border-primary/50"
                        )}
                      >
                        <p className="text-xs uppercase">
                          {format(date, "EEE")}
                        </p>
                        <p className="text-lg font-bold">
                          {format(date, "d")}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* Time Slots */}
                <div>
                  <p className="text-sm font-medium mb-2">Available Times</p>
                  <div className="grid grid-cols-2 gap-2">
                    {timeSlots.map((slot) => {
                      const isSelected = slot.id === selectedTimeSlot;
                      return (
                        <button
                          key={slot.id}
                          onClick={() => setSelectedTimeSlot(slot.id)}
                          className={cn(
                            "relative p-3 rounded-lg border text-sm text-center transition-all",
                            isSelected
                              ? "border-primary bg-primary/5 text-primary"
                              : "hover:border-primary/50"
                          )}
                        >
                          {slot.label}
                          {isSelected && (
                            <CheckCircle2 className="absolute top-1 right-1 h-4 w-4 text-primary fill-primary/20" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Planned Activities */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Planned Activities</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {activities.map((activity) => (
                  <button
                    key={activity.id}
                    onClick={() => toggleActivity(activity.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border hover:border-primary/50 transition-all"
                  >
                    {activity.checked ? (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                    <span className={cn(activity.checked && "text-foreground", !activity.checked && "text-muted-foreground")}>
                      {activity.label}
                    </span>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t shadow-lg z-50">
        <div className="container max-w-7xl py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <ChevronRight className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm">
                Inviting <strong>{buddy.display_name?.split(" ")[0]}</strong> to <strong>{spot.name}</strong>
              </p>
              <p className="text-sm text-muted-foreground">
                {format(selectedDate, "EEEE, MMMM d")} • {selectedTimeLabel}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <Input
              placeholder="Add a note (optional)..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="flex-1"
            />
            <Button 
              onClick={() => inviteMutation.mutate()}
              disabled={inviteMutation.isPending}
              className="bg-primary hover:bg-primary/90 px-6"
            >
              Cast Invite
            </Button>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <TripInviteSuccessModal
        open={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
        buddyName={buddy?.display_name || "Your buddy"}
        buddyPhoto={buddy?.photos?.[0]}
        spotName={spot?.name || "Fishing spot"}
        spotLat={spot?.location_lat}
        spotLng={spot?.location_lng}
        tripDate={selectedDate}
        tripTime={selectedTimeLabel}
      />
    </div>
  );
}
