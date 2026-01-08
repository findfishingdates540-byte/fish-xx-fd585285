import { useState, useEffect, useRef } from "react";
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
import { ImageCropModal } from "@/components/ui/image-crop-modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProfilePromptEditor, type ProfilePrompt } from "@/components/profile";
import { InterestSelector } from "@/components/profile";
import { toast } from "sonner";
import { 
  User, 
  MapPin,
  Navigation,
  Camera,
  Pencil, 
  Heart, 
  Shield, 
  ChevronRight,
  Sparkles,
  Plus,
  X,
  Loader2,
  ImageIcon,
  Ruler,
  Wine,
  Cigarette,
  GraduationCap,
  Briefcase,
  Star,
  Brain,
  MessageCircle,
  Fish,
  Anchor,
  Box,
  Radar,
  Ship,
  Footprints,
  Bug,
  Snowflake,
  Target,
  Wind,
  Waves,
  Check
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type AccountMode = Database["public"]["Enums"]["account_mode"];
type GenderType = Database["public"]["Enums"]["gender_type"];
type LookingForType = Database["public"]["Enums"]["looking_for_type"];
type DrinkingHabit = Database["public"]["Enums"]["drinking_habit"];
type SmokingHabit = Database["public"]["Enums"]["smoking_habit"];
type PersonalityType = Database["public"]["Enums"]["personality_type"];

const SUPABASE_URL = "https://zjmnlelqoiclkbrqefyv.supabase.co";

const ZODIAC_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"
];

export default function ProfileEdit() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Form state - Basic
  const [displayName, setDisplayName] = useState("");
  const [locationName, setLocationName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [locationLat, setLocationLat] = useState<number | null>(null);
  const [locationLng, setLocationLng] = useState<number | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [bio, setBio] = useState("");
  const [accountMode, setAccountMode] = useState<AccountMode>("both");
  const [interestedIn, setInterestedIn] = useState<GenderType[]>([]);
  const [lookingFor, setLookingFor] = useState<LookingForType[]>([]);
  const [ageRange, setAgeRange] = useState<[number, number]>([18, 50]);
  const [maxDistance, setMaxDistance] = useState(50);
  const [photos, setPhotos] = useState<string[]>([]);
  const [coverPhoto, setCoverPhoto] = useState<string | null>(null);
  
  // New profile fields
  const [heightCm, setHeightCm] = useState<number | null>(null);
  const [drinking, setDrinking] = useState<DrinkingHabit | null>(null);
  const [smoking, setSmoking] = useState<SmokingHabit | null>(null);
  const [education, setEducation] = useState("");
  const [occupation, setOccupation] = useState("");
  const [zodiacSign, setZodiacSign] = useState("");
  const [personalityType, setPersonalityType] = useState<PersonalityType | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  const [promptResponses, setPromptResponses] = useState<ProfilePrompt[]>([]);
  
  // Fishing profile state
  const [preferredSpecies, setPreferredSpecies] = useState<string[]>([]);
  const [fishingGear, setFishingGear] = useState<string[]>([]);
  const [fishingStyles, setFishingStyles] = useState<string[]>([]);
  const [fishingExperience, setFishingExperience] = useState<string>("");
  const [fishSpeciesList, setFishSpeciesList] = useState<{ id: string; name: string }[]>([]);
  
  // Crop modal state
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [cropType, setCropType] = useState<"profile" | "banner">("profile");

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchFishSpecies();
    }
  }, [user]);

  const fetchFishSpecies = async () => {
    const { data, error } = await supabase
      .from("fish_species")
      .select("id, name")
      .order("name");
    
    if (!error && data) {
      setFishSpeciesList(data);
    }
  };

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
      setCity((data as any).city || "");
      setState((data as any).state || "");
      setZipCode((data as any).zip_code || "");
      setLocationLat(data.location_lat || null);
      setLocationLng(data.location_lng || null);
      setDateOfBirth(data.date_of_birth || "");
      setBio(data.bio || "");
      setAccountMode(data.account_mode || "both");
      setInterestedIn((data.interested_in as GenderType[]) || []);
      setLookingFor((data.looking_for as LookingForType[]) || []);
      setAgeRange([data.min_age_preference || 18, data.max_age_preference || 50]);
      setMaxDistance(data.max_distance_miles || 50);
      setPhotos(data.photos || []);
      setCoverPhoto((data as any).cover_photo || null);
      
      // New fields
      setHeightCm((data as any).height_cm || null);
      setDrinking((data as any).drinking || null);
      setSmoking((data as any).smoking || null);
      setEducation((data as any).education || "");
      setOccupation((data as any).occupation || "");
      setZodiacSign((data as any).zodiac_sign || "");
      setPersonalityType((data as any).personality_type || null);
      setInterests((data as any).interests || []);
      setPromptResponses((data as any).prompt_responses || []);
      setPreferredSpecies((data as any).preferred_species || []);
      setFishingGear((data as any).fishing_gear || []);
      setFishingStyles((data as any).fishing_styles || []);
      setFishingExperience((data as any).fishing_experience || "");
    }
    setLoading(false);
  };

  // Handle file selection - opens crop modal
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, type: "profile" | "banner") => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    // Create object URL and open crop modal
    const imageUrl = URL.createObjectURL(file);
    setCropImageSrc(imageUrl);
    setCropType(type);
    setCropModalOpen(true);

    // Clear file input
    if (type === "profile" && fileInputRef.current) {
      fileInputRef.current.value = "";
    } else if (type === "banner" && bannerInputRef.current) {
      bannerInputRef.current.value = "";
    }
  };

  // Handle cropped image upload
  const handleCroppedImageUpload = async (croppedBlob: Blob) => {
    if (!user) return;

    if (cropType === "profile") {
      await uploadProfilePhoto(croppedBlob);
    } else {
      await uploadBannerPhoto(croppedBlob);
    }

    // Clean up
    if (cropImageSrc) {
      URL.revokeObjectURL(cropImageSrc);
      setCropImageSrc(null);
    }
  };

  const uploadProfilePhoto = async (blob: Blob) => {
    setUploadingPhoto(true);
    try {
      const fileName = `${user!.id}/${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("profile-photos")
        .upload(fileName, blob, { contentType: "image/jpeg" });

      if (uploadError) throw uploadError;

      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/profile-photos/${fileName}`;
      const newPhotos = [...photos, publicUrl];
      setPhotos(newPhotos);

      // Save to profile immediately
      await supabase
        .from("profiles")
        .update({ photos: newPhotos })
        .eq("id", user!.id);

      toast.success("Photo uploaded successfully");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload photo");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const uploadBannerPhoto = async (blob: Blob) => {
    setUploadingBanner(true);
    try {
      const fileName = `${user!.id}/banner_${Date.now()}.jpg`;

      // Remove old banner if exists
      if (coverPhoto) {
        const oldPath = coverPhoto.split("/profile-photos/")[1];
        if (oldPath) {
          await supabase.storage.from("profile-photos").remove([oldPath]);
        }
      }

      const { error: uploadError } = await supabase.storage
        .from("profile-photos")
        .upload(fileName, blob, { contentType: "image/jpeg" });

      if (uploadError) throw uploadError;

      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/profile-photos/${fileName}`;
      setCoverPhoto(publicUrl);

      await supabase
        .from("profiles")
        .update({ cover_photo: publicUrl } as any)
        .eq("id", user!.id);

      toast.success("Banner uploaded successfully");
    } catch (error) {
      console.error("Banner upload error:", error);
      toast.error("Failed to upload banner");
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleRemovePhoto = async (photoUrl: string) => {
    if (!user) return;

    try {
      // Extract file path from URL
      const urlParts = photoUrl.split("/profile-photos/");
      if (urlParts[1]) {
        await supabase.storage.from("profile-photos").remove([urlParts[1]]);
      }

      const newPhotos = photos.filter((p) => p !== photoUrl);
      setPhotos(newPhotos);

      // Save to profile immediately
      await supabase
        .from("profiles")
        .update({ photos: newPhotos })
        .eq("id", user.id);

      toast.success("Photo removed");
    } catch (error) {
      console.error("Remove error:", error);
      toast.error("Failed to remove photo");
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = async (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex || !user) return;

    const newPhotos = [...photos];
    const [draggedPhoto] = newPhotos.splice(draggedIndex, 1);
    newPhotos.splice(dropIndex, 0, draggedPhoto);

    setPhotos(newPhotos);
    setDraggedIndex(null);
    setDragOverIndex(null);

    // Save reordered photos
    await supabase
      .from("profiles")
      .update({ photos: newPhotos })
      .eq("id", user.id);

    toast.success("Photos reordered");
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // Handle GPS location update
  const handleGetCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setLocationLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocationLat(latitude);
        setLocationLng(longitude);

        // Reverse geocode to get city, state, and zip
        try {
          const tokenResponse = await fetch('https://zjmnlelqoiclkbrqefyv.supabase.co/functions/v1/get-mapbox-token');
          if (tokenResponse.ok) {
            const { token } = await tokenResponse.json();
            const geocodeResponse = await fetch(
              `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?types=postcode,place,region&access_token=${token}`
            );
            if (geocodeResponse.ok) {
              const data = await geocodeResponse.json();
              if (data.features && data.features.length > 0) {
                const placeFeature = data.features.find((f: any) => f.place_type?.includes('place'));
                const regionFeature = data.features.find((f: any) => f.place_type?.includes('region'));
                const postcodeFeature = data.features.find((f: any) => f.place_type?.includes('postcode'));
                
                const newCity = placeFeature?.text || '';
                const newState = regionFeature?.text || '';
                const newZip = postcodeFeature?.text || '';
                
                setCity(newCity);
                setState(newState);
                setZipCode(newZip);
                
                const newLocationName = [newCity, newState].filter(Boolean).join(', ');
                if (newLocationName) {
                  setLocationName(newLocationName);
                }
              }
            }
          }
        } catch (error) {
          console.error('Reverse geocoding error:', error);
        }

        setLocationLoading(false);
        toast.success("Location updated");
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLocationLoading(false);
        if (error.code === error.PERMISSION_DENIED) {
          toast.error("Location permission denied. Please enable it in your browser settings.");
        } else {
          toast.error("Failed to get your location");
        }
      }
    );
  };

  // Handle manual location field changes - clear coordinates, will geocode on save
  const handleLocationFieldChange = (field: 'city' | 'state' | 'zipCode', value: string) => {
    if (field === 'city') setCity(value);
    else if (field === 'state') setState(value);
    else if (field === 'zipCode') setZipCode(value);
    
    // Update the combined location name
    const newCity = field === 'city' ? value : city;
    const newState = field === 'state' ? value : state;
    setLocationName([newCity, newState].filter(Boolean).join(', '));
    
    // Clear coordinates when manually editing - will be geocoded on save
    setLocationLat(null);
    setLocationLng(null);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    // If no coordinates, geocode using city/state/zip for precision
    let finalLat = locationLat;
    let finalLng = locationLng;

    if (!finalLat && !finalLng && (city || state || zipCode)) {
      try {
        const response = await supabase.functions.invoke('geocode-address', {
          body: { city, state, zipCode }
        });
        
        if (response.data?.lat && response.data?.lng) {
          finalLat = response.data.lat;
          finalLng = response.data.lng;
        }
      } catch (geocodeError) {
        console.warn('Geocoding failed:', geocodeError);
      }
    }

    // Combine city and state for display name
    const combinedLocationName = [city, state].filter(Boolean).join(', ');

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName,
        location_name: combinedLocationName || locationName,
        city: city || null,
        state: state || null,
        zip_code: zipCode || null,
        location_lat: finalLat,
        location_lng: finalLng,
        date_of_birth: dateOfBirth || null,
        bio: bio,
        account_mode: accountMode,
        interested_in: interestedIn,
        looking_for: lookingFor,
        min_age_preference: ageRange[0],
        max_age_preference: ageRange[1],
        max_distance_miles: maxDistance,
        photos: photos,
        cover_photo: coverPhoto,
        height_cm: heightCm,
        drinking: drinking,
        smoking: smoking,
        education: education || null,
        occupation: occupation || null,
        zodiac_sign: zodiacSign || null,
        personality_type: personalityType,
        interests: interests,
        prompt_responses: promptResponses,
        preferred_species: preferredSpecies,
        fishing_gear: fishingGear,
        fishing_styles: fishingStyles,
        fishing_experience: fishingExperience || null,
        updated_at: new Date().toISOString(),
      } as any)
      .eq("id", user.id);

    setSaving(false);

    if (error) {
      toast.error("Failed to save changes");
      return;
    }

    toast.success("Profile updated successfully");
    navigate("/app/profile");
  };

  const selectGenderPreference = (gender: GenderType) => {
    // Single selection only - replace the current selection
    setInterestedIn([gender]);
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
        <div className="relative">
          {/* Banner Image */}
          <div className="h-48 md:h-56 rounded-2xl overflow-hidden bg-muted relative group">
            {coverPhoto ? (
              <img
                src={coverPhoto}
                alt="Cover"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-muted to-muted-foreground/20 flex items-center justify-center">
                <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
              </div>
            )}
            <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors" />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => bannerInputRef.current?.click()}
              disabled={uploadingBanner}
              className="absolute top-4 right-4 gap-2 z-10"
            >
              {uploadingBanner ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Pencil className="h-4 w-4" />
              )}
              {uploadingBanner ? "Uploading..." : "Edit Banner"}
            </Button>
          </div>

          {/* Hidden banner file input */}
          <input
            ref={bannerInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleFileSelect(e, "banner")}
            className="hidden"
          />

          {/* Profile Photo & Info - positioned to overlap banner */}
          <div className="flex flex-col md:flex-row md:items-end gap-4 -mt-16 ml-6 md:ml-8">
            {/* Profile Photo */}
            <div className="relative flex-shrink-0">
              <div className="h-32 w-32 rounded-full border-4 border-background overflow-hidden bg-muted">
                {profilePhoto !== "/placeholder.svg" ? (
                  <img
                    src={profilePhoto}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <ImageIcon className="h-10 w-10 text-muted-foreground" />
                  </div>
                )}
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="absolute bottom-2 right-2 h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {uploadingPhoto ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Camera className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Photo change section */}
            <div className="flex flex-col md:flex-row md:items-center gap-3 pb-2">
              <div>
                <h3 className="font-semibold">Change Profile Photo</h3>
                <p className="text-sm text-muted-foreground">
                  Max 5MB, JPG or PNG. Make sure your face is visible!
                </p>
              </div>
              <Button 
                variant="outline" 
                className="w-fit"
                onClick={() => photos[0] && handleRemovePhoto(photos[0])}
                disabled={!photos.length}
              >
                Remove Photo
              </Button>
            </div>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleFileSelect(e, "profile")}
            className="hidden"
          />
        </div>

        {/* Photo Gallery */}
        <Card className="mt-6">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ImageIcon className="h-5 w-5 text-primary" />
              My Photos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {photos.map((photo, index) => (
                <div
                  key={photo}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`relative aspect-square rounded-lg overflow-hidden bg-muted group cursor-grab active:cursor-grabbing transition-all duration-200 ${
                    draggedIndex === index ? "opacity-50 scale-95" : ""
                  } ${
                    dragOverIndex === index ? "ring-2 ring-primary ring-offset-2" : ""
                  }`}
                >
                  <img
                    src={photo}
                    alt={`Photo ${index + 1}`}
                    className="w-full h-full object-cover pointer-events-none"
                  />
                  <button
                    onClick={() => handleRemovePhoto(photo)}
                    className="absolute top-1 right-1 h-6 w-6 rounded-full bg-background/80 text-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  {index === 0 && (
                    <span className="absolute bottom-1 left-1 text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 rounded">
                      Main
                    </span>
                  )}
                  <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors pointer-events-none" />
                </div>
              ))}
              {photos.length < 6 && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingPhoto}
                  className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-1 hover:border-primary hover:bg-muted/50 transition-colors disabled:opacity-50"
                >
                  {uploadingPhoto ? (
                    <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
                  ) : (
                    <>
                      <Plus className="h-6 w-6 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">Add</span>
                    </>
                  )}
                </button>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Drag photos to reorder. Your first photo will be your main profile picture.
            </p>
          </CardContent>
        </Card>
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

                {/* Location Fields */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Location
                    </Label>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleGetCurrentLocation}
                      disabled={locationLoading}
                      className="h-8"
                    >
                      {locationLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Navigation className="h-4 w-4 mr-2" />
                      )}
                      {locationLoading ? 'Getting...' : 'Use GPS'}
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="col-span-2">
                      <Input
                        id="city"
                        value={city}
                        onChange={(e) => handleLocationFieldChange('city', e.target.value)}
                        placeholder="City"
                      />
                    </div>
                    <div>
                      <Input
                        id="state"
                        value={state}
                        onChange={(e) => handleLocationFieldChange('state', e.target.value)}
                        placeholder="State"
                      />
                    </div>
                    <div>
                      <Input
                        id="zipCode"
                        value={zipCode}
                        onChange={(e) => handleLocationFieldChange('zipCode', e.target.value)}
                        placeholder="Zip Code"
                        maxLength={10}
                      />
                    </div>
                  </div>
                  {locationLat && locationLng ? (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                      Precise coordinates saved
                    </p>
                  ) : (city || state || zipCode) ? (
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                      <span className="inline-block w-2 h-2 rounded-full bg-amber-500"></span>
                      Coordinates will be calculated when you save
                    </p>
                  ) : null}
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

                {/* Height, Education, Occupation */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="height" className="flex items-center gap-2">
                      <Ruler className="h-4 w-4" />
                      Height (cm)
                    </Label>
                    <Input
                      id="height"
                      type="number"
                      value={heightCm || ""}
                      onChange={(e) => setHeightCm(e.target.value ? parseInt(e.target.value) : null)}
                      placeholder="175"
                      className="mt-1.5"
                      min={100}
                      max={250}
                    />
                  </div>
                  <div>
                    <Label htmlFor="education" className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4" />
                      Education
                    </Label>
                    <Input
                      id="education"
                      value={education}
                      onChange={(e) => setEducation(e.target.value)}
                      placeholder="Bachelor's Degree"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="occupation" className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      Occupation
                    </Label>
                    <Input
                      id="occupation"
                      value={occupation}
                      onChange={(e) => setOccupation(e.target.value)}
                      placeholder="Software Engineer"
                      className="mt-1.5"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Lifestyle */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Wine className="h-5 w-5 text-primary" />
                  Lifestyle
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="flex items-center gap-2 mb-1.5">
                      <Wine className="h-4 w-4" />
                      Drinking
                    </Label>
                    <Select value={drinking || ""} onValueChange={(v) => setDrinking(v as DrinkingHabit)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="never">Never</SelectItem>
                        <SelectItem value="socially">Socially</SelectItem>
                        <SelectItem value="regularly">Regularly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="flex items-center gap-2 mb-1.5">
                      <Cigarette className="h-4 w-4" />
                      Smoking
                    </Label>
                    <Select value={smoking || ""} onValueChange={(v) => setSmoking(v as SmokingHabit)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="never">Never</SelectItem>
                        <SelectItem value="sometimes">Sometimes</SelectItem>
                        <SelectItem value="regularly">Regularly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="flex items-center gap-2 mb-1.5">
                      <Star className="h-4 w-4" />
                      Zodiac Sign
                    </Label>
                    <Select value={zodiacSign} onValueChange={setZodiacSign}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        {ZODIAC_SIGNS.map((sign) => (
                          <SelectItem key={sign} value={sign}>{sign}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="flex items-center gap-2 mb-1.5">
                      <Brain className="h-4 w-4" />
                      Personality Type
                    </Label>
                    <Select value={personalityType || ""} onValueChange={(v) => setPersonalityType(v as PersonalityType)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="introvert">Introvert</SelectItem>
                        <SelectItem value="extrovert">Extrovert</SelectItem>
                        <SelectItem value="ambivert">Ambivert</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Fishing Profile - Only show for fishing or both modes */}
            {(accountMode === "fishing" || accountMode === "both") && (
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Fish className="h-5 w-5 text-primary" />
                    Fishing Profile
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Experience Level */}
                  <div>
                    <Label className="text-sm font-medium mb-1 block">Experience Level</Label>
                    <p className="text-xs text-muted-foreground mb-3">How experienced are you at fishing?</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'beginner', label: 'Beginner', description: 'Just starting out' },
                        { id: 'intermediate', label: 'Intermediate', description: 'Know the basics' },
                        { id: 'advanced', label: 'Advanced', description: 'Years of experience' },
                        { id: 'expert', label: 'Expert', description: 'Pro-level skills' },
                      ].map((level) => (
                        <button
                          key={level.id}
                          type="button"
                          onClick={() => setFishingExperience(level.id)}
                          className={`p-3 rounded-xl border-2 transition-all duration-200 text-center ${
                            fishingExperience === level.id
                              ? "border-primary bg-primary/10"
                              : "border-border hover:border-primary/50 hover:bg-accent/50"
                          }`}
                        >
                          <span className={`text-sm font-medium block ${fishingExperience === level.id ? "text-primary" : "text-foreground"}`}>
                            {level.label}
                          </span>
                          <span className="text-xs text-muted-foreground">{level.description}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Fishing Styles */}
                  <div>
                    <Label className="text-sm font-medium mb-1 block">Fishing Styles</Label>
                    <p className="text-xs text-muted-foreground mb-3">What types of fishing do you enjoy?</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        'Fly Fishing',
                        'Bass Fishing',
                        'Deep Sea Fishing',
                        'Ice Fishing',
                        'Trolling',
                        'Jigging',
                        'Surf Fishing',
                        'Kayak Fishing',
                        'Shore Fishing',
                        'Lake Fishing',
                        'River Fishing',
                        'Saltwater Fishing',
                        'Freshwater Fishing',
                        'Catch & Release',
                        'Tournament Fishing',
                        'Night Fishing',
                      ].map((style) => {
                        const isSelected = fishingStyles.includes(style);
                        return (
                          <button
                            key={style}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setFishingStyles(fishingStyles.filter(s => s !== style));
                              } else {
                                setFishingStyles([...fishingStyles, style]);
                              }
                            }}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all ${
                              isSelected
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted hover:bg-muted/80 text-foreground"
                            }`}
                          >
                            {isSelected && <Check className="h-3 w-3" />}
                            {style}
                          </button>
                        );
                      })}
                    </div>
                    {fishingStyles.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {fishingStyles.length} style{fishingStyles.length !== 1 ? 's' : ''} selected
                      </p>
                    )}
                  </div>

                  {/* Target Species */}
                  <div>
                    <Label className="text-sm font-medium mb-1 block">Target Species</Label>
                    <p className="text-xs text-muted-foreground mb-3">What fish do you like to catch?</p>
                    <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto p-1">
                      {fishSpeciesList.map((species) => {
                        const isSelected = preferredSpecies.includes(species.name);
                        return (
                          <button
                            key={species.id}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setPreferredSpecies(preferredSpecies.filter(s => s !== species.name));
                              } else {
                                setPreferredSpecies([...preferredSpecies, species.name]);
                              }
                            }}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all ${
                              isSelected
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted hover:bg-muted/80 text-foreground"
                            }`}
                          >
                            {isSelected && <Check className="h-3 w-3" />}
                            {species.name}
                          </button>
                        );
                      })}
                    </div>
                    {preferredSpecies.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {preferredSpecies.length} species selected
                      </p>
                    )}
                  </div>

                  {/* Fishing Gear */}
                  <div>
                    <Label className="text-sm font-medium mb-1 block">Fishing Gear</Label>
                    <p className="text-xs text-muted-foreground mb-3">What equipment do you have?</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {[
                        { id: 'spinning_rod', label: 'Spinning Rod', icon: Target },
                        { id: 'baitcasting_rod', label: 'Baitcasting Rod', icon: Target },
                        { id: 'fly_rod', label: 'Fly Rod', icon: Wind },
                        { id: 'trolling_setup', label: 'Trolling Setup', icon: Anchor },
                        { id: 'ice_fishing_gear', label: 'Ice Fishing Gear', icon: Snowflake },
                        { id: 'tackle_box', label: 'Tackle Box', icon: Box },
                        { id: 'fish_finder', label: 'Fish Finder', icon: Radar },
                        { id: 'kayak', label: 'Kayak', icon: Waves },
                        { id: 'boat', label: 'Boat', icon: Ship },
                        { id: 'waders', label: 'Waders', icon: Footprints },
                        { id: 'live_bait', label: 'Live Bait', icon: Bug },
                        { id: 'lures', label: 'Lures', icon: Sparkles },
                      ].map((gear) => {
                        const isSelected = fishingGear.includes(gear.id);
                        const Icon = gear.icon;
                        return (
                          <button
                            key={gear.id}
                            type="button"
                            onClick={() => {
                              if (isSelected) {
                                setFishingGear(fishingGear.filter(g => g !== gear.id));
                              } else {
                                setFishingGear([...fishingGear, gear.id]);
                              }
                            }}
                            className={`relative p-3 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-1.5 text-center ${
                              isSelected
                                ? "border-primary bg-primary/10"
                                : "border-border hover:border-primary/50 hover:bg-accent/50"
                            }`}
                          >
                            {isSelected && (
                              <div className="absolute top-1.5 right-1.5">
                                <Check className="h-3 w-3 text-primary" />
                              </div>
                            )}
                            <Icon className={`h-5 w-5 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                            <span className={`text-xs font-medium ${isSelected ? "text-primary" : "text-foreground"}`}>
                              {gear.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {fishingGear.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {fishingGear.length} gear item{fishingGear.length !== 1 ? 's' : ''} selected
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Interests & Hobbies */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Interests & Hobbies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <InterestSelector
                  selected={interests}
                  onChange={setInterests}
                  maxSelections={10}
                />
              </CardContent>
            </Card>

            {/* Profile Prompts */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MessageCircle className="h-5 w-5 text-primary" />
                  Profile Prompts
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Answer prompts to help others get to know you better
                </p>
              </CardHeader>
              <CardContent>
                <ProfilePromptEditor
                  prompts={promptResponses}
                  onChange={setPromptResponses}
                  maxPrompts={3}
                />
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
                          onClick={() => selectGenderPreference(option.value)}
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
                        {maxDistance} miles
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

      {/* Image Crop Modal */}
      {cropImageSrc && (
        <ImageCropModal
          open={cropModalOpen}
          onClose={() => {
            setCropModalOpen(false);
            if (cropImageSrc) {
              URL.revokeObjectURL(cropImageSrc);
              setCropImageSrc(null);
            }
          }}
          imageSrc={cropImageSrc}
          onCropComplete={handleCroppedImageUpload}
          aspectRatio={cropType === "banner" ? 21 / 9 : 1}
          title={cropType === "banner" ? "Crop Cover Photo" : "Crop Profile Photo"}
          cropShape={cropType === "profile" ? "round" : "rect"}
        />
      )}
    </div>
  );
}
