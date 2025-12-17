import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Slider } from "@/components/ui/slider";
import { SelectableCard } from "@/components/ui/selectable-card";
import { toast } from "sonner";
import { 
  User, 
  MapPin, 
  Camera, 
  Pencil, 
  Heart, 
  Shield, 
  ChevronRight,
  Sparkles
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type AccountMode = Database["public"]["Enums"]["account_mode"];
type GenderType = Database["public"]["Enums"]["gender_type"];
type LookingForType = Database["public"]["Enums"]["looking_for_type"];

export default function ProfileEdit() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [displayName, setDisplayName] = useState("");
  const [locationName, setLocationName] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [bio, setBio] = useState("");
  const [accountMode, setAccountMode] = useState<AccountMode>("both");
  const [interestedIn, setInterestedIn] = useState<GenderType[]>([]);
  const [lookingFor, setLookingFor] = useState<LookingForType[]>([]);
  const [ageRange, setAgeRange] = useState<[number, number]>([18, 50]);
  const [maxDistance, setMaxDistance] = useState(50);
  const [photos, setPhotos] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      toast.error("Failed to load profile");
      return;
    }

    if (data) {
      setDisplayName(data.display_name || "");
      setLocationName(data.location_name || "");
      setDateOfBirth(data.date_of_birth || "");
      setBio(data.bio || "");
      setAccountMode(data.account_mode || "both");
      setInterestedIn((data.interested_in as GenderType[]) || []);
      setLookingFor((data.looking_for as LookingForType[]) || []);
      setAgeRange([data.min_age_preference || 18, data.max_age_preference || 50]);
      setMaxDistance(data.max_distance_km || 50);
      setPhotos(data.photos || []);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName,
        location_name: locationName,
        date_of_birth: dateOfBirth || null,
        bio: bio,
        account_mode: accountMode,
        interested_in: interestedIn,
        looking_for: lookingFor,
        min_age_preference: ageRange[0],
        max_age_preference: ageRange[1],
        max_distance_km: maxDistance,
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    setSaving(false);

    if (error) {
      toast.error("Failed to save changes");
      return;
    }

    toast.success("Profile updated successfully");
    navigate("/app/profile");
  };

  const toggleGenderPreference = (gender: GenderType) => {
    setInterestedIn((prev) => {
      if (prev.includes(gender)) {
        return prev.filter((g) => g !== gender);
      }
      return [...prev, gender];
    });
  };

  const toggleLookingFor = (option: LookingForType) => {
    setLookingFor((prev) => {
      if (prev.includes(option)) {
        return prev.filter((o) => o !== option);
      }
      return [...prev, option];
    });
  };

  const genderOptions: { value: GenderType; label: string }[] = [
    { value: "male", label: "Men" },
    { value: "female", label: "Women" },
    { value: "non_binary", label: "Non-binary" },
  ];

  const lookingForOptions: { value: LookingForType; label: string; description: string }[] = [
    { value: "relationship", label: "Relationship", description: "Something serious" },
    { value: "casual", label: "Casual", description: "Keep it light" },
    { value: "friends", label: "Friends", description: "Just friends" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const profilePhoto = photos?.[0] || "/placeholder.svg";

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="px-4 md:px-6 py-6">
        <h1 className="text-2xl md:text-3xl font-bold">Edit Profile</h1>
        <p className="text-muted-foreground mt-1">
          Update your personal details and dating preferences.
        </p>
      </div>

      {/* Hero Banner */}
      <div className="px-4 md:px-6">
        <div className="relative h-48 md:h-56 rounded-2xl overflow-hidden bg-muted">
          <img
            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&h=400&fit=crop"
            alt="Cover"
            className="w-full h-full object-cover"
          />
          <Button
            variant="secondary"
            size="sm"
            className="absolute top-4 right-4 gap-2"
          >
            <Pencil className="h-4 w-4" />
            Edit Banner
          </Button>

          {/* Profile Photo overlapping banner */}
          <div className="absolute -bottom-16 left-6 md:left-8">
            <div className="relative">
              <div className="h-32 w-32 rounded-full border-4 border-background overflow-hidden bg-muted">
                <img
                  src={profilePhoto}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              <button className="absolute bottom-2 right-2 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg">
                <Camera className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Photo change section */}
        <div className="mt-20 md:ml-44 flex flex-col md:flex-row md:items-center gap-3">
          <div>
            <h3 className="font-semibold">Change Profile Photo</h3>
            <p className="text-sm text-muted-foreground">
              Max 5MB, JPG or PNG. Make sure your face is visible!
            </p>
          </div>
          <Button variant="outline" className="w-fit">
            Remove Photo
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 md:px-6 mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* The Basics */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5 text-primary" />
                  The Basics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name"
                    className="mt-1.5"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="location">Location</Label>
                    <div className="relative mt-1.5">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="location"
                        value={locationName}
                        onChange={(e) => setLocationName(e.target.value)}
                        placeholder="City, State"
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="birthday">Birthday</Label>
                    <Input
                      id="birthday"
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="bio">Bio / Tagline</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value.slice(0, 300))}
                    placeholder="Tell others about yourself..."
                    className="mt-1.5 min-h-[100px] resize-none"
                  />
                  <p className="text-xs text-muted-foreground text-right mt-1">
                    {bio.length}/300
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Dating Preferences */}
            {(accountMode === "dating" || accountMode === "both") && (
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Heart className="h-5 w-5 text-primary" />
                    Dating Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Interested In */}
                  <div>
                    <Label className="text-sm font-medium">Interested In</Label>
                    <div className="grid grid-cols-3 gap-3 mt-2">
                      {genderOptions.map((option) => (
                        <SelectableCard
                          key={option.value}
                          selected={interestedIn.includes(option.value)}
                          onClick={() => toggleGenderPreference(option.value)}
                          className="py-3"
                        >
                          <span className="text-sm font-medium">{option.label}</span>
                        </SelectableCard>
                      ))}
                    </div>
                  </div>

                  {/* Looking For */}
                  <div>
                    <Label className="text-sm font-medium">Looking For</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                      {lookingForOptions.map((option) => (
                        <SelectableCard
                          key={option.value}
                          selected={lookingFor.includes(option.value)}
                          onClick={() => toggleLookingFor(option.value)}
                          className="py-3"
                        >
                          <div className="text-center">
                            <span className="text-sm font-medium">{option.label}</span>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {option.description}
                            </p>
                          </div>
                        </SelectableCard>
                      ))}
                    </div>
                  </div>

                  {/* Age Range */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <Label className="text-sm font-medium">Age Range</Label>
                      <span className="text-sm text-muted-foreground">
                        {ageRange[0]} - {ageRange[1]} years
                      </span>
                    </div>
                    <Slider
                      value={ageRange}
                      onValueChange={(value) => setAgeRange(value as [number, number])}
                      min={18}
                      max={80}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  {/* Distance */}
                  <div>
                    <div className="flex justify-between items-center mb-3">
                      <Label className="text-sm font-medium">Maximum Distance</Label>
                      <span className="text-sm text-muted-foreground">
                        {maxDistance} km
                      </span>
                    </div>
                    <Slider
                      value={[maxDistance]}
                      onValueChange={(value) => setMaxDistance(value[0])}
                      min={5}
                      max={200}
                      step={5}
                      className="w-full"
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* App Mode */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="h-5 w-5 text-primary" />
                  App Mode
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Choose how you want to use Find Fishing Dates. You can change this anytime.
                </p>
                <RadioGroup
                  value={accountMode}
                  onValueChange={(value) => setAccountMode(value as AccountMode)}
                  className="space-y-3"
                >
                  <label
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      accountMode === "both"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <RadioGroupItem value="both" />
                    <div>
                      <p className="font-medium text-sm">Combo Mode</p>
                      <p className="text-xs text-muted-foreground">Dating & Fishing Spots</p>
                    </div>
                  </label>
                  <label
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      accountMode === "dating"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <RadioGroupItem value="dating" />
                    <div>
                      <p className="font-medium text-sm">Dating Only</p>
                      <p className="text-xs text-muted-foreground">Find a catch</p>
                    </div>
                  </label>
                  <label
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      accountMode === "fishing"
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <RadioGroupItem value="fishing" />
                    <div>
                      <p className="font-medium text-sm">Fishing Only</p>
                      <p className="text-xs text-muted-foreground">Just here for the fish</p>
                    </div>
                  </label>
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Privacy Check */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg text-primary">
                  <Shield className="h-5 w-5" />
                  Privacy Check
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors text-left">
                  <span className="text-sm">Who can see my profile?</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
                <button className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors text-left">
                  <span className="text-sm">Manage blocked users</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full"
                size="lg"
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/app/profile")}
                className="w-full"
                size="lg"
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
