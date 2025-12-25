import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar as CalendarIcon } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { TripBuddyInvite, TripSpotSelector } from "@/components/trips";
import {
  Save,
  Clock,
  MapPin,
  FileText,
  Package,
  Fish,
  Bell,
  Sun,
  Plus,
  X,
  Users,
  User as UserIcon,
  Info,
  Send,
} from "lucide-react";

interface GearItem {
  id: string;
  name: string;
  checked: boolean;
}

const defaultGear: GearItem[] = [
  { id: "1", name: "Rod & Reel", checked: true },
  { id: "2", name: "Tackle Box", checked: false },
  { id: "3", name: "Life Jacket", checked: false },
];

export default function TripPlanner() {
  const { id } = useParams();
  const isEditing = id && id !== "new";
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [tripType, setTripType] = useState<"solo" | "buddies">("solo");
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [startTime, setStartTime] = useState("06:00");
  const [endTime, setEndTime] = useState("11:30");
  const [locationName, setLocationName] = useState("");
  const [gearChecklist, setGearChecklist] = useState<GearItem[]>(defaultGear);
  const [newGearItem, setNewGearItem] = useState("");
  const [targetSpecies, setTargetSpecies] = useState<string[]>([]);
  const [newSpecies, setNewSpecies] = useState("");
  const [baitDetails, setBaitDetails] = useState("");
  const [weatherNotes, setWeatherNotes] = useState("");
  const [coordinatesNotes, setCoordinatesNotes] = useState("");
  const [departureReminder, setDepartureReminder] = useState(true);
  const [weatherAlert, setWeatherAlert] = useState(false);
  const [showBaitDetails, setShowBaitDetails] = useState(false);
  const [showWeatherNotes, setShowWeatherNotes] = useState(false);
  const [showCoordinates, setShowCoordinates] = useState(false);
  const [invitedBuddies, setInvitedBuddies] = useState<string[]>([]);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [selectedSpot, setSelectedSpot] = useState<{
    id: string;
    name: string;
    location_lat: number;
    location_lng: number;
    location_name: string | null;
  } | null>(null);

  // Fetch current user profile for invitation preview
  const { data: userProfile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("profiles")
        .select("display_name, photos")
        .eq("id", user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch existing trip if editing
  const { data: existingTrip } = useQuery({
    queryKey: ["trip", id],
    queryFn: async () => {
      if (!isEditing) return null;
      const { data, error } = await supabase
        .from("fishing_trips")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!isEditing,
  });

  // Fetch existing participants if editing
  const { data: existingParticipants } = useQuery({
    queryKey: ["trip-participants", id],
    queryFn: async () => {
      if (!isEditing) return [];
      const { data, error } = await supabase
        .from("trip_participants")
        .select("user_id, status")
        .eq("trip_id", id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!isEditing,
  });

  // Fetch invited buddy profiles for display
  const { data: invitedBuddyProfiles } = useQuery({
    queryKey: ["invited-buddy-profiles", invitedBuddies],
    queryFn: async () => {
      if (invitedBuddies.length === 0) return [];
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, photos")
        .in("id", invitedBuddies);
      if (error) throw error;
      return data || [];
    },
    enabled: invitedBuddies.length > 0,
  });

  // Fetch fish species for dropdown
  const { data: fishSpecies } = useQuery({
    queryKey: ["fish-species"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fish_species")
        .select("id, name")
        .order("name");
      if (error) throw error;
      return data || [];
    },
  });

  // Populate form with existing data
  useEffect(() => {
    if (existingTrip) {
      setTripType(existingTrip.trip_type as "solo" | "buddies");
      setTitle(existingTrip.title);
      setNotes(existingTrip.notes || "");
      setSelectedDate(new Date(existingTrip.trip_date));
      setStartTime(existingTrip.start_time?.slice(0, 5) || "06:00");
      setEndTime(existingTrip.end_time?.slice(0, 5) || "11:30");
      setLocationName(existingTrip.location_name || "");
      if (existingTrip.gear_checklist && Array.isArray(existingTrip.gear_checklist)) {
        setGearChecklist(existingTrip.gear_checklist as unknown as GearItem[]);
      }
      setTargetSpecies(existingTrip.target_species || []);
      setBaitDetails(existingTrip.bait_details || "");
      setWeatherNotes(existingTrip.weather_notes || "");
      setCoordinatesNotes(existingTrip.coordinates_notes || "");
      setDepartureReminder(existingTrip.departure_reminder ?? true);
      setWeatherAlert(existingTrip.weather_alert ?? false);
      if (existingTrip.bait_details) setShowBaitDetails(true);
      if (existingTrip.weather_notes) setShowWeatherNotes(true);
      if (existingTrip.coordinates_notes) setShowCoordinates(true);
      // Populate selected spot if available
      if (existingTrip.fishing_spot_id && existingTrip.location_lat && existingTrip.location_lng) {
        setSelectedSpot({
          id: existingTrip.fishing_spot_id,
          name: existingTrip.location_name || "",
          location_lat: Number(existingTrip.location_lat),
          location_lng: Number(existingTrip.location_lng),
          location_name: existingTrip.location_name,
        });
      }
    }
  }, [existingTrip]);

  // Populate invited buddies from existing participants
  useEffect(() => {
    if (existingParticipants?.length) {
      setInvitedBuddies(existingParticipants.map((p) => p.user_id));
    }
  }, [existingParticipants]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !selectedDate || !title.trim()) {
        throw new Error("Missing required fields");
      }

      const tripData = {
        user_id: user.id,
        trip_type: tripType,
        title: title.trim(),
        notes: notes.trim() || null,
        trip_date: format(selectedDate, "yyyy-MM-dd"),
        start_time: startTime,
        end_time: endTime,
        location_name: locationName.trim() || null,
        location_lat: selectedSpot?.location_lat || null,
        location_lng: selectedSpot?.location_lng || null,
        fishing_spot_id: selectedSpot?.id || null,
        gear_checklist: JSON.parse(JSON.stringify(gearChecklist)),
        target_species: targetSpecies,
        bait_details: baitDetails.trim() || null,
        weather_notes: weatherNotes.trim() || null,
        coordinates_notes: coordinatesNotes.trim() || null,
        departure_reminder: departureReminder,
        weather_alert: weatherAlert,
      };

      let tripId = id;

      if (isEditing) {
        const { error } = await supabase
          .from("fishing_trips")
          .update(tripData)
          .eq("id", id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("fishing_trips")
          .insert(tripData)
          .select("id")
          .single();
        if (error) throw error;
        tripId = data.id;
      }

      // Handle buddy invitations for buddies trips
      if (tripType === "buddies" && tripId) {
        const existingBuddyIds = existingParticipants?.map((p) => p.user_id) || [];
        
        // Find new buddies to invite
        const newBuddies = invitedBuddies.filter((id) => !existingBuddyIds.includes(id));
        
        // Find buddies to remove
        const removedBuddies = existingBuddyIds.filter((id) => !invitedBuddies.includes(id));

        // Insert new invitations
        if (newBuddies.length > 0) {
          const { error: inviteError } = await supabase
            .from("trip_participants")
            .insert(
              newBuddies.map((userId) => ({
                trip_id: tripId,
                user_id: userId,
                status: "invited",
              }))
            );
          if (inviteError) throw inviteError;
        }

        // Remove uninvited buddies
        if (removedBuddies.length > 0) {
          const { error: removeError } = await supabase
            .from("trip_participants")
            .delete()
            .eq("trip_id", tripId)
            .in("user_id", removedBuddies);
          if (removeError) throw removeError;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-trips"] });
      queryClient.invalidateQueries({ queryKey: ["trip-participants"] });
      queryClient.invalidateQueries({ queryKey: ["trip-invitations"] });
      toast({
        title: isEditing ? "Trip updated!" : "Trip saved!",
        description: tripType === "buddies" && invitedBuddies.length > 0
          ? `Trip saved and ${invitedBuddies.length} buddy${invitedBuddies.length !== 1 ? "ies" : ""} invited!`
          : "Your fishing trip has been saved successfully.",
      });
      navigate("/app/trips");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addGearItem = () => {
    if (newGearItem.trim()) {
      setGearChecklist([
        ...gearChecklist,
        { id: Date.now().toString(), name: newGearItem.trim(), checked: false },
      ]);
      setNewGearItem("");
    }
  };

  const toggleGearItem = (id: string) => {
    setGearChecklist(
      gearChecklist.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const removeGearItem = (id: string) => {
    setGearChecklist(gearChecklist.filter((item) => item.id !== id));
  };

  const addSpecies = () => {
    if (newSpecies.trim() && !targetSpecies.includes(newSpecies.trim())) {
      setTargetSpecies([...targetSpecies, newSpecies.trim()]);
      setNewSpecies("");
    }
  };

  const removeSpecies = (species: string) => {
    setTargetSpecies(targetSpecies.filter((s) => s !== species));
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="container max-w-6xl py-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Link to="/app" className="hover:text-foreground">
            Home
          </Link>
          <span>/</span>
          <Link to="/app/trips" className="hover:text-foreground">
            My Trips
          </Link>
          <span>/</span>
          <span className="text-foreground">
            {tripType === "solo" ? "Solo Trip Planner" : "Buddies Trip Planner"}
          </span>
        </div>

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold mb-1">
              {tripType === "solo" ? "Solo Trip Planner" : "Buddies Trip Planner"}
            </h1>
            <p className="text-muted-foreground">
              Plan your next adventure, track your gear, and set reminders.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/app/trips")}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                // Show confirmation dialog if it's a buddies trip with invites
                if (tripType === "buddies" && invitedBuddies.length > 0) {
                  setShowConfirmDialog(true);
                } else {
                  saveMutation.mutate();
                }
              }}
              disabled={!title.trim() || !selectedDate || saveMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Trip
            </Button>
          </div>
        </div>

        {/* Trip Type Selection */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <Tabs value={tripType} onValueChange={(v) => setTripType(v as "solo" | "buddies")}>
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="solo" className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4" />
                  Solo Trip
                </TabsTrigger>
                <TabsTrigger value="buddies" className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Buddies Trip
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Date Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Select Date</CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  className="rounded-md border w-full pointer-events-auto"
                  disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                />
              </CardContent>
            </Card>

            {/* Time Schedule */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Time Schedule</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">START TIME</Label>
                    <div className="relative">
                      <Input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="pr-10"
                      />
                      <Clock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">END TIME</Label>
                    <div className="relative">
                      <Input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="pr-10"
                      />
                      <Clock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg text-sm">
                  <Sun className="h-4 w-4 text-amber-600" />
                  <span>Sunrise is at <strong>6:15 AM</strong> on this day.</span>
                </div>
              </CardContent>
            </Card>

            {/* Location */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Location</CardTitle>
                {selectedSpot && (
                  <Button
                    variant="link"
                    className="text-primary p-0 h-auto"
                    onClick={() => {
                      setSelectedSpot(null);
                      setLocationName("");
                    }}
                  >
                    Clear
                  </Button>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Enter location name..."
                    value={locationName}
                    onChange={(e) => setLocationName(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <TripSpotSelector
                  selectedSpotId={selectedSpot?.id || null}
                  onSpotSelect={setSelectedSpot}
                  locationName={locationName}
                  onLocationNameChange={setLocationName}
                />
                {locationName && (
                  <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg text-sm">
                    <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                    <span>
                      Remember to check local regulations for {locationName} before heading out.{" "}
                      <a href="#" className="text-primary hover:underline">
                        View Regulations
                      </a>
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Buddy Invitations - only for buddies trips */}
            {tripType === "buddies" && (
              <TripBuddyInvite
                selectedBuddies={invitedBuddies}
                onBuddiesChange={setInvitedBuddies}
                existingParticipants={existingParticipants}
              />
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Trip Title */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Trip Title</CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  placeholder="e.g. Early Morning Trout Hunt"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </CardContent>
            </Card>

            {/* Trip Notes */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  <CardTitle className="text-base">Trip Notes</CardTitle>
                </div>
                <span className="text-xs text-muted-foreground">Autosaved</span>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Log your plan details here: specific spots to hit, bait combinations to try, weather backup plans..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                />
                <div className="flex flex-wrap gap-2">
                  {!showBaitDetails && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowBaitDetails(true)}
                    >
                      + Add Bait details
                    </Button>
                  )}
                  {!showWeatherNotes && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowWeatherNotes(true)}
                    >
                      + Add Weather notes
                    </Button>
                  )}
                  {!showCoordinates && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCoordinates(true)}
                    >
                      + Add Coordinates
                    </Button>
                  )}
                </div>
                {showBaitDetails && (
                  <div>
                    <Label className="text-sm mb-1.5 block">Bait Details</Label>
                    <Textarea
                      placeholder="Describe bait and lures you plan to use..."
                      value={baitDetails}
                      onChange={(e) => setBaitDetails(e.target.value)}
                      rows={2}
                    />
                  </div>
                )}
                {showWeatherNotes && (
                  <div>
                    <Label className="text-sm mb-1.5 block">Weather Notes</Label>
                    <Textarea
                      placeholder="Weather considerations and backup plans..."
                      value={weatherNotes}
                      onChange={(e) => setWeatherNotes(e.target.value)}
                      rows={2}
                    />
                  </div>
                )}
                {showCoordinates && (
                  <div>
                    <Label className="text-sm mb-1.5 block">Coordinates Notes</Label>
                    <Textarea
                      placeholder="GPS coordinates or specific location details..."
                      value={coordinatesNotes}
                      onChange={(e) => setCoordinatesNotes(e.target.value)}
                      rows={2}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Gear and Species */}
            <div className="grid sm:grid-cols-2 gap-6">
              {/* Gear Checklist */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-primary" />
                    <CardTitle className="text-base">Gear Checklist</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {gearChecklist.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={item.checked}
                          onCheckedChange={() => toggleGearItem(item.id)}
                        />
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
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100"
                        onClick={() => removeGearItem(item.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  <div className="flex gap-2 mt-3">
                    <Input
                      placeholder="Add item"
                      value={newGearItem}
                      onChange={(e) => setNewGearItem(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addGearItem()}
                      className="flex-1"
                    />
                    <Button variant="outline" size="icon" onClick={addGearItem}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Target Species */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Fish className="h-4 w-4 text-primary" />
                    <CardTitle className="text-base">Target Species</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {targetSpecies.map((species) => (
                    <div
                      key={species}
                      className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Fish className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{species}</p>
                          <p className="text-xs text-green-600">High Activity</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeSpecies(species)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="w-full">
                        <Plus className="h-4 w-4 mr-2" />
                        Select Species
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 max-h-64 overflow-y-auto">
                      {fishSpecies?.filter(s => !targetSpecies.includes(s.name)).map((species) => (
                        <DropdownMenuItem
                          key={species.id}
                          onClick={() => setTargetSpecies([...targetSpecies, species.name])}
                        >
                          <Fish className="h-4 w-4 mr-2 text-muted-foreground" />
                          {species.name}
                        </DropdownMenuItem>
                      ))}
                      {fishSpecies?.filter(s => !targetSpecies.includes(s.name)).length === 0 && (
                        <DropdownMenuItem disabled>
                          All species selected
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardContent>
              </Card>
            </div>

            {/* Notifications & Reminders */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notifications & Reminders</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center">
                      <Bell className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">Departure Reminder</p>
                      <p className="text-sm text-muted-foreground">
                        Get notified 1 hour before start time
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={departureReminder}
                    onCheckedChange={setDepartureReminder}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950 flex items-center justify-center">
                      <Sun className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-medium">Weather Alert</p>
                      <p className="text-sm text-muted-foreground">
                        Notify if rain probability {">"} 40%
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={weatherAlert}
                    onCheckedChange={setWeatherAlert}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Buddy Invitation Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              Send Buddy Invitations?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                {/* Invited Buddies List */}
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Sending invitations to:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {invitedBuddyProfiles?.map((buddy) => (
                      <div
                        key={buddy.id}
                        className="flex items-center gap-2 bg-muted rounded-full pl-1 pr-3 py-1"
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={buddy.photos?.[0]} />
                          <AvatarFallback className="text-xs">
                            {buddy.display_name?.charAt(0)?.toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium text-foreground">
                          {buddy.display_name || "Unknown"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Invitation Preview */}
                <div className="rounded-lg border bg-card p-4 space-y-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    What they'll see
                  </p>
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={userProfile?.photos?.[0]} />
                      <AvatarFallback>
                        {userProfile?.display_name?.charAt(0)?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">
                          {userProfile?.display_name || "You"}
                        </span>{" "}
                        invited you to join:
                      </p>
                      <p className="font-semibold truncate text-foreground">
                        {title || "Untitled Trip"}
                      </p>
                      <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="h-3 w-3" />
                          {selectedDate ? format(selectedDate, "MMM d, yyyy") : "No date"}
                        </span>
                        {(selectedSpot?.location_name || locationName) && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {selectedSpot?.location_name || locationName}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">
                  They will receive a notification and can accept or decline.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowConfirmDialog(false);
                saveMutation.mutate();
              }}
            >
              <Send className="h-4 w-4 mr-2" />
              Save & Send Invites
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
