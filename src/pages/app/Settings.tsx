import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { usePushNotificationsUnified } from "@/hooks/use-push-notifications-unified";
import { useStripePortal } from "@/hooks/use-stripe-portal";
import { ThemeSelector as AppearanceSelector } from "@/components/ui/theme-toggle";
import { VerificationSection } from "@/components/settings/VerificationSection";
import { HiddenProfilesSection } from "@/components/settings/HiddenProfilesSection";
import { useUnreadTicketCount } from "@/hooks/use-unread-ticket-count";
import { format } from "date-fns";
import {
  User,
  Smartphone,
  Compass,
  Bell,
  Shield,
  CreditCard,
  CheckCircle2,
  Heart,
  Fish,
  Layers,
  Camera,
  Loader2,
  Trash2,
  Star,
  LogOut,
  BellRing,
  ExternalLink,
  ArrowLeft,
  Palette,
  Clock,
  MapPin,
  Navigation,
  UserPlus,
  Copy,
  Check,
  Mail,
  MessageCircle,
  BadgeCheck,
  Ticket,
  EyeOff,
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { Eye, Lock, Key } from "lucide-react";

type AccountMode = Database["public"]["Enums"]["account_mode"];

const SUPABASE_URL = "https://zjmnlelqoiclkbrqefyv.supabase.co";

const settingsNav = [
  { id: "account", label: "Account", icon: User },
  { id: "security", label: "Security", icon: Key },
  { id: "verification", label: "Verification", icon: Shield },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "app-mode", label: "App Mode", icon: Smartphone },
  { id: "location", label: "Location", icon: MapPin },
  { id: "discovery", label: "Discovery", icon: Compass },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "privacy", label: "Privacy", icon: Shield },
  { id: "hidden-profiles", label: "Hidden Profiles", icon: EyeOff },
  { id: "subscription", label: "Subscription", icon: CreditCard },
  { id: "invite", label: "Invite Friends", icon: UserPlus },
];

// Component for ticket link with unread badge
function TicketLinkWithBadge() {
  const { data: unreadCount } = useUnreadTicketCount();
  
  return (
    <Button variant="outline" className="w-full justify-start relative" asChild>
      <Link to="/app/my-tickets">
        <Ticket className="h-4 w-4 mr-2" />
        My Support Tickets
        {unreadCount && unreadCount > 0 && (
          <Badge className="ml-auto bg-primary text-primary-foreground text-xs px-1.5 py-0.5 min-w-[20px] flex items-center justify-center">
            {unreadCount}
          </Badge>
        )}
      </Link>
    </Button>
  );
}

export default function Settings() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [activeTab, setActiveTab] = useState("account");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile state
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [accountMode, setAccountMode] = useState<AccountMode>("both");
  const [originalAccountMode, setOriginalAccountMode] = useState<AccountMode>("both");
  const [accountModeChanged, setAccountModeChanged] = useState(false);
  const [photos, setPhotos] = useState<string[]>([]);
  const [isVerified, setIsVerified] = useState(false);
  const [idVerified, setIdVerified] = useState(false);
  const [liveVerified, setLiveVerified] = useState(false);
  const [isPremium, setIsPremium] = useState(false);
  const [premiumExpiresAt, setPremiumExpiresAt] = useState<string | null>(null);

  // Stripe Portal
  const { openPortal, isLoading: portalLoading } = useStripePortal();

  // Discovery settings
  const [maxDistance, setMaxDistance] = useState(50);
  const [ageRange, setAgeRange] = useState<[number, number]>([18, 50]);
  
  // Location settings
  const [locationName, setLocationName] = useState("");
  const [locationLat, setLocationLat] = useState<number | null>(null);
  const [locationLng, setLocationLng] = useState<number | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationPermission, setLocationPermission] = useState<PermissionState | null>(null);
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);

  // Notification settings
  const [newMatches, setNewMatches] = useState(true);
  const [messages, setMessages] = useState(true);
  const [likes, setLikes] = useState(true);
  const [marketing, setMarketing] = useState(false);

  // Change password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Delete account state
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchProfile();
      checkLocationPermission();
    }
  }, [user]);

  // Check current location permission status
  const checkLocationPermission = async () => {
    if ('permissions' in navigator) {
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' });
        setLocationPermission(result.state);
        result.onchange = () => setLocationPermission(result.state);
      } catch (e) {
        // Some browsers don't support querying geolocation permission
        console.log('Permission query not supported');
      }
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
      toast.error("Failed to load settings");
      return;
    }

    if (data) {
      setDisplayName(data.display_name || "");
      setEmail(data.email || user.email || "");
      setBio(data.bio || "");
      setAccountMode(data.account_mode || "both");
      setOriginalAccountMode(data.account_mode || "both");
      setPhotos(data.photos || []);
      setIsVerified(data.is_verified || false);
      setIdVerified(data.id_verified || false);
      setLiveVerified(data.live_verified || false);
      setIsPremium(data.is_premium || false);
      setPremiumExpiresAt(data.premium_expires_at || null);
      setMaxDistance(data.max_distance_miles || 50);
      setAgeRange([data.min_age_preference || 18, data.max_age_preference || 50]);
      setLocationName(data.location_name || "");
      setLocationLat(data.location_lat || null);
      setLocationLng(data.location_lng || null);
    }
    setLoading(false);
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setUploadingPhoto(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("profile-photos")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/profile-photos/${fileName}`;
      const newPhotos = [publicUrl, ...photos.slice(1)];
      setPhotos(newPhotos);

      await supabase
        .from("profiles")
        .update({ photos: newPhotos })
        .eq("id", user.id);

      toast.success("Photo updated");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload photo");
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);

    const updateData: Record<string, unknown> = {
      display_name: displayName,
      bio: bio,
      max_distance_miles: maxDistance,
      min_age_preference: ageRange[0],
      max_age_preference: ageRange[1],
      updated_at: new Date().toISOString(),
    };

    // Only update account_mode if user explicitly changed it on this page
    if (accountModeChanged) {
      updateData.account_mode = accountMode;
    }

    const { error } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", user.id);

    setSaving(false);

    if (error) {
      toast.error("Failed to save changes");
      return;
    }

    // Reset the flag and update original mode if it was changed
    if (accountModeChanged) {
      setOriginalAccountMode(accountMode);
      setAccountModeChanged(false);
    }

    toast.success("Settings saved successfully");
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully");
    navigate("/auth");
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error("Passwords do not match");
      return;
    }
    setPasswordLoading(true);
    try {
      // Re-authenticate with current password first
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user?.email || "",
        password: currentPassword,
      });
      if (signInError) {
        toast.error("Current password is incorrect");
        return;
      }
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Password updated successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
      }
    } catch {
      toast.error("Failed to update password");
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") return;
    setDeleteLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/delete-account`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Failed to delete account");
      }
      toast.success("Account deleted successfully");
      await signOut();
      navigate("/");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete account");
    } finally {
      setDeleteLoading(false);
      setShowDeleteDialog(false);
    }
  };


  const getMapboxToken = async (): Promise<string | null> => {
    try {
      const { data, error } = await supabase.functions.invoke('get-mapbox-token');
      if (error) throw error;
      return data?.token || null;
    } catch (e) {
      console.error('Failed to get Mapbox token:', e);
      return null;
    }
  };

  // Handle enabling GPS location
  const handleEnableLocation = async () => {
    if (!user) return;
    setLocationLoading(true);

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const { latitude, longitude } = position.coords;
      
      // Reverse geocode to get location name
      const token = await getMapboxToken();
      let newLocationName = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
      
      if (token) {
        try {
          const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${longitude},${latitude}.json?access_token=${token}&types=place,locality`
          );
          const data = await response.json();
          if (data.features?.[0]?.place_name) {
            newLocationName = data.features[0].place_name;
          }
        } catch (e) {
          console.error('Reverse geocoding failed:', e);
        }
      }

      // Save to database
      const { error } = await supabase
        .from('profiles')
        .update({
          location_lat: latitude,
          location_lng: longitude,
          location_name: newLocationName,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      setLocationLat(latitude);
      setLocationLng(longitude);
      setLocationName(newLocationName);
      setLocationPermission('granted');
      toast.success('Location updated successfully!');
    } catch (error: unknown) {
      if (error instanceof GeolocationPositionError) {
        if (error.code === error.PERMISSION_DENIED) {
          setLocationPermission('denied');
          toast.error('Location access denied. Please enable it in your browser settings.');
        } else if (error.code === error.TIMEOUT) {
          toast.error('Location request timed out. Please try again.');
        } else {
          toast.error('Unable to get your location. Please try again.');
        }
      } else {
        toast.error('Failed to update location');
      }
    } finally {
      setLocationLoading(false);
    }
  };

  const getAccountModeLabel = () => {
    // Use originalAccountMode to reflect actual database value
    switch (originalAccountMode) {
      case "dating":
        return "Dating Mode User";
      case "fishing":
        return "Fishing Mode User";
      default:
        return "Combo Mode User";
    }
  };

  const avatarUrl = photos?.[0] || "/placeholder.svg";
  const initials = displayName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar */}
          <aside className="w-full lg:w-64 flex-shrink-0">
            <Card>
              <CardContent className="p-4">
                {/* User Mini Profile */}
                <div className="flex items-center gap-3 pb-4 border-b mb-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={avatarUrl} alt={displayName} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="overflow-hidden">
                    <p className="font-semibold truncate">{displayName || "User"}</p>
                    <p className="text-xs text-muted-foreground">{getAccountModeLabel()}</p>
                  </div>
                </div>

                {/* Navigation */}
                <nav className="space-y-1">
                  {settingsNav.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        activeTab === item.id
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </button>
                    ))}
                  </nav>

                  {/* Sign Out Button */}
                  <div className="mt-4 pt-4 border-t">
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
              </CardContent>
            </Card>
          </aside>

          {/* Main Content */}
          <main className="flex-1 space-y-6">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Account Settings</h1>
                <p className="text-muted-foreground">
                  Manage your profile details and preferences.
                </p>
              </div>
            </div>

            {/* Account Tab */}
            {activeTab === "account" && (
              <div className="space-y-6">
                {/* Profile Card */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div className="relative">
                        <Avatar className="h-20 w-20">
                          <AvatarImage src={avatarUrl} alt={displayName} />
                          <AvatarFallback className="text-xl">{initials}</AvatarFallback>
                        </Avatar>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingPhoto}
                          className="absolute bottom-0 right-0 h-7 w-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-md"
                        >
                          {uploadingPhoto ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Camera className="h-3.5 w-3.5" />
                          )}
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoUpload}
                          className="hidden"
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{displayName || "User"}</h3>
                        <p className="text-sm text-muted-foreground">{email}</p>
                        {isVerified && (
                          <div className="flex items-center gap-1 text-primary text-sm mt-1">
                            <CheckCircle2 className="h-4 w-4" />
                            <span>Verified</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <Button
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingPhoto}
                        >
                          Change Photo
                        </Button>
                        <Button variant="outline" asChild>
                          <Link to="/app/profile">View Public Profile</Link>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Current Mode - Only show switcher for Combo users */}
                {originalAccountMode === 'both' ? (
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="font-semibold mb-1">Current View</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Choose which features to focus on. Your Combo subscription includes everything!
                      </p>
                      <div className="grid grid-cols-3 gap-3">
                        <button
                          onClick={() => { setAccountMode("dating"); setAccountModeChanged(true); }}
                          className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-medium transition-colors ${
                            accountMode === "dating"
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-border hover:bg-muted"
                          }`}
                        >
                          <Heart className="h-4 w-4" />
                          Dating View
                        </button>
                        <button
                          onClick={() => { setAccountMode("fishing"); setAccountModeChanged(true); }}
                          className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-medium transition-colors ${
                            accountMode === "fishing"
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-border hover:bg-muted"
                          }`}
                        >
                          <Fish className="h-4 w-4" />
                          Fishing View
                        </button>
                        <button
                          onClick={() => { setAccountMode("both"); setAccountModeChanged(true); }}
                          className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-medium transition-colors ${
                            accountMode === "both"
                              ? "border-primary bg-primary/5 text-primary"
                              : "border-border hover:bg-muted"
                          }`}
                        >
                          <Layers className="h-4 w-4" />
                          Combo View
                        </button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="font-semibold mb-1">Account Type</h3>
                      <div className="flex items-center gap-3 mb-4">
                        {originalAccountMode === 'dating' ? <Heart className="h-5 w-5 text-primary" /> : <Fish className="h-5 w-5 text-primary" />}
                        <span className="font-medium">
                          {originalAccountMode === 'dating' ? 'Dating Account' : 'Fishing Account (Angler)'}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        {originalAccountMode === 'dating' 
                          ? 'Upgrade to access fishing spots and maps, or get everything with Combo!'
                          : 'Upgrade to Combo to unlock dating features alongside your fishing tools!'}
                      </p>
                      <Button asChild className="w-full">
                        <Link to="/pricing">View Upgrade Options</Link>
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Personal Information */}
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <h3 className="font-semibold mb-1">Personal Information</h3>
                      <p className="text-sm text-muted-foreground">
                        Update your personal details here.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <div>
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          disabled
                          className="mt-1.5 bg-muted"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="bio">Bio</Label>
                      <Textarea
                        id="bio"
                        value={bio}
                        onChange={(e) => setBio(e.target.value.slice(0, 150))}
                        placeholder="Tell others about yourself..."
                        className="mt-1.5 min-h-[80px] resize-none"
                      />
                      <p className="text-xs text-muted-foreground text-right mt-1">
                        {bio.length}/150 characters
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Premium CTA */}
                {!isPremium && (
                  <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
                    <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <Star className="h-6 w-6 flex-shrink-0 mt-0.5" />
                        <div>
                          <h3 className="font-semibold text-lg">FishX Gold</h3>
                          <p className="text-sm opacity-90">
                            Unlock unlimited swipes, see who liked your catches, and get advanced map filters for top fishing spots.
                          </p>
                        </div>
                      </div>
                      <Button variant="secondary" className="flex-shrink-0">
                        Upgrade Plan
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Security Tab - Change Password */}
            {activeTab === "security" && (
              <div className="space-y-6">
                <Card>
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <h3 className="font-semibold mb-1 flex items-center gap-2">
                        <Lock className="h-5 w-5" />
                        Change Password
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Update your account password. You'll need your current password.
                      </p>
                    </div>

                    <div className="space-y-4 max-w-md">
                      <div>
                        <Label htmlFor="currentPassword">Current Password</Label>
                        <div className="relative mt-1.5">
                          <Input
                            id="currentPassword"
                            type={showCurrentPassword ? "text" : "password"}
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Enter current password"
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="newPassword">New Password</Label>
                        <div className="relative mt-1.5">
                          <Input
                            id="newPassword"
                            type={showNewPassword ? "text" : "password"}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="At least 6 characters"
                            className="pr-10"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="confirmNewPassword">Confirm New Password</Label>
                        <Input
                          id="confirmNewPassword"
                          type="password"
                          value={confirmNewPassword}
                          onChange={(e) => setConfirmNewPassword(e.target.value)}
                          placeholder="Confirm new password"
                          className="mt-1.5"
                        />
                      </div>

                      <Button
                        onClick={handleChangePassword}
                        disabled={passwordLoading || !currentPassword || !newPassword || !confirmNewPassword}
                      >
                        {passwordLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Updating...
                          </>
                        ) : (
                          "Update Password"
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Danger Zone */}
                <Card className="border-destructive/50">
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <h3 className="font-semibold mb-1 text-destructive">Danger Zone</h3>
                      <p className="text-sm text-muted-foreground">
                        Permanently delete your account and all associated data. This action cannot be undone.
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete My Account
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Verification Tab */}
            {activeTab === "verification" && (
              <VerificationSection idVerified={idVerified} liveVerified={liveVerified} />
            )}

            {/* App Mode Tab - Only for Combo users */}
            {activeTab === "app-mode" && (
              originalAccountMode === 'both' ? (
                <Card>
                  <CardContent className="p-6 space-y-6">
                    <div>
                      <h3 className="font-semibold mb-1">View Preference</h3>
                      <p className="text-sm text-muted-foreground">
                        Switch between Dating and Fishing views. Your Combo subscription includes everything!
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <button
                        onClick={() => {
                          setAccountMode("dating");
                          navigate('/app/discover');
                        }}
                        className={`flex flex-col items-center gap-2 p-4 rounded-lg border text-sm font-medium transition-colors ${
                          accountMode === "dating"
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border hover:bg-muted"
                        }`}
                      >
                        <Heart className="h-6 w-6" />
                        Dating View
                        <span className="text-xs text-muted-foreground font-normal">Find your catch</span>
                      </button>
                      <button
                        onClick={() => {
                          setAccountMode("fishing");
                          navigate('/app/spots');
                        }}
                        className={`flex flex-col items-center gap-2 p-4 rounded-lg border text-sm font-medium transition-colors ${
                          accountMode === "fishing"
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border hover:bg-muted"
                        }`}
                      >
                        <Fish className="h-6 w-6" />
                        Fishing View
                        <span className="text-xs text-muted-foreground font-normal">Focus on spots</span>
                      </button>
                      <button
                        onClick={() => {
                          setAccountMode("both");
                          navigate('/app/dashboard');
                        }}
                        className={`flex flex-col items-center gap-2 p-4 rounded-lg border text-sm font-medium transition-colors ${
                          accountMode === "both"
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border hover:bg-muted"
                        }`}
                      >
                        <Layers className="h-6 w-6" />
                        Combo View
                        <span className="text-xs text-muted-foreground font-normal">Best of both</span>
                      </button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-6 space-y-6">
                    <div>
                      <h3 className="font-semibold mb-1">Account Type</h3>
                      <p className="text-sm text-muted-foreground">
                        {originalAccountMode === 'dating' 
                          ? "You're on a free Dating account. Upgrade to unlock more features!"
                          : "You're on an Angler subscription. Upgrade to Combo to unlock dating!"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                      {originalAccountMode === 'dating' ? <Heart className="h-6 w-6 text-primary" /> : <Fish className="h-6 w-6 text-primary" />}
                      <div>
                        <p className="font-medium">{originalAccountMode === 'dating' ? 'Dating Account' : 'Angler Subscription'}</p>
                        <p className="text-sm text-muted-foreground">
                          {originalAccountMode === 'dating' ? 'Free tier - dating features only' : 'Fishing spots, buddies & trips'}
                        </p>
                      </div>
                    </div>
                    <Button asChild className="w-full">
                      <Link to="/pricing">
                        {originalAccountMode === 'dating' ? 'Upgrade to Angler or Combo' : 'Upgrade to Combo'}
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )
            )}

            {/* Appearance Tab */}
            {activeTab === "appearance" && (
              <Card>
                <CardContent className="p-6 space-y-6">
                  <div>
                    <h3 className="font-semibold mb-1">Appearance</h3>
                    <p className="text-sm text-muted-foreground">
                      Customize how the app looks and feels.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <Label>Theme</Label>
                    <AppearanceSelector />
                    <p className="text-xs text-muted-foreground">
                      Choose between light, dark, or system theme. System will automatically match your device settings.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Location Tab */}
            {activeTab === "location" && (
              <Card>
                <CardContent className="p-6 space-y-6">
                  <div>
                    <h3 className="font-semibold mb-1">Location Settings</h3>
                    <p className="text-sm text-muted-foreground">
                      Manage your location for finding nearby spots and matches.
                    </p>
                  </div>

                  {/* Current Location Status */}
                  <div className="p-4 bg-muted rounded-lg space-y-3">
                    <div className="flex items-center gap-3">
                      <MapPin className="h-5 w-5 text-primary" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">Your Saved Location</p>
                        <p className="text-sm text-muted-foreground">
                          {locationName || 'No location set'}
                        </p>
                      </div>
                      {locationLat && locationLng && (
                        <div className="text-xs text-muted-foreground">
                          {locationLat.toFixed(4)}, {locationLng.toFixed(4)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Permission Status */}
                  {locationPermission && (
                    <div className={`p-3 rounded-lg text-sm flex items-center gap-2 ${
                      locationPermission === 'granted' 
                        ? 'bg-green-500/10 text-green-700 dark:text-green-400' 
                        : locationPermission === 'denied'
                        ? 'bg-destructive/10 text-destructive'
                        : 'bg-muted text-muted-foreground'
                    }`}>
                      {locationPermission === 'granted' ? (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          Location access granted
                        </>
                      ) : locationPermission === 'denied' ? (
                        <>
                          <Shield className="h-4 w-4" />
                          Location access denied. Enable it in your browser settings.
                        </>
                      ) : (
                        <>
                          <MapPin className="h-4 w-4" />
                          Location permission not yet requested
                        </>
                      )}
                    </div>
                  )}

                  {/* Enable Location Button */}
                  <div className="space-y-3">
                    <Button
                      onClick={handleEnableLocation}
                      disabled={locationLoading}
                      className="w-full"
                    >
                      {locationLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Getting your location...
                        </>
                      ) : (
                        <>
                          <Navigation className="h-4 w-4 mr-2" />
                          {locationName ? 'Update to Current Location' : 'Enable Location Services'}
                        </>
                      )}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      Uses your device's GPS to find nearby fishing spots and matches.
                    </p>
                  </div>

                  {/* Benefits */}
                  <div className="border-t pt-4 space-y-3">
                    <h4 className="font-medium text-sm">Why enable location?</h4>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4 mt-0.5 text-primary" />
                        <span>Find fishing spots near you, even when traveling</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Heart className="h-4 w-4 mt-0.5 text-primary" />
                        <span>Get matched with people in your area</span>
                      </div>
                      <div className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Compass className="h-4 w-4 mt-0.5 text-primary" />
                        <span>See accurate distances to spots and buddies</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Discovery Tab */}
            {activeTab === "discovery" && (
              <Card>
                <CardContent className="p-6 space-y-6">
                  <div>
                    <h3 className="font-semibold mb-1">Discovery Settings</h3>
                    <p className="text-sm text-muted-foreground">
                      Control who can find you and how you appear in discovery.
                    </p>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <Label>Maximum Distance</Label>
                        <span className="text-sm text-muted-foreground">
                          {maxDistance >= 500 ? 'Unlimited' : `${maxDistance} miles`}
                        </span>
                      </div>
                      <Slider
                        value={[maxDistance]}
                        onValueChange={(v) => setMaxDistance(v[0])}
                        min={5}
                        max={500}
                        step={5}
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Slide to max for unlimited distance
                      </p>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <Label>Age Range</Label>
                        <span className="text-sm text-muted-foreground">
                          {ageRange[0]} - {ageRange[1]} years
                        </span>
                      </div>
                      <Slider
                        value={ageRange}
                        onValueChange={(v) => setAgeRange(v as [number, number])}
                        min={18}
                        max={80}
                        step={1}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">Show Online Status</p>
                        <p className="text-xs text-muted-foreground">Let others see when you're online</p>
                      </div>
                      <Switch checked={showOnlineStatus} onCheckedChange={setShowOnlineStatus} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notifications Tab */}
            {activeTab === "notifications" && (
              <NotificationsTab
                newMatches={newMatches}
                setNewMatches={setNewMatches}
                messages={messages}
                setMessages={setMessages}
                likes={likes}
                setLikes={setLikes}
                marketing={marketing}
                setMarketing={setMarketing}
              />
            )}

            {/* Privacy Tab */}
            {activeTab === "privacy" && (
              <Card>
                <CardContent className="p-6 space-y-6">
                  <div>
                    <h3 className="font-semibold mb-1">Privacy Settings</h3>
                    <p className="text-sm text-muted-foreground">
                      Control your privacy and data settings.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <TicketLinkWithBadge />
                    <Button variant="outline" className="w-full justify-start">
                      <Shield className="h-4 w-4 mr-2" />
                      Manage Blocked Users
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <User className="h-4 w-4 mr-2" />
                      Download My Data
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-destructive hover:text-destructive"
                      onClick={() => setShowDeleteDialog(true)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Subscription Tab */}
            {activeTab === "subscription" && (
              <div className="space-y-6">
                {/* Current Plan Card */}
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold">Current Plan</h3>
                      {isPremium && (
                        <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-primary/10 text-primary">
                          ACTIVE
                        </span>
                      )}
                    </div>
                    
                    {originalAccountMode === 'dating' ? (
                      <div className="p-4 rounded-xl bg-muted/50">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 rounded-lg bg-pink-100">
                            <Heart className="h-5 w-5 text-pink-500" />
                          </div>
                          <div>
                            <h4 className="font-semibold">Free Dating Account</h4>
                            <p className="text-sm text-muted-foreground">Unlimited matches and messaging</p>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4">
                          Enjoy free dating features! Upgrade to access fishing spots, maps, and more.
                        </p>
                        <Button asChild className="w-full">
                          <Link to="/pricing">Upgrade to Premium</Link>
                        </Button>
                      </div>
                    ) : isPremium ? (
                      <div className="space-y-4">
                        {/* Check if user is on free trial */}
                        {(() => {
                          const isFreeTrial = premiumExpiresAt && (() => {
                            const expiresDate = new Date(premiumExpiresAt);
                            const now = new Date();
                            const daysRemaining = Math.ceil((expiresDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                            // Consider it a trial if expires within 30 days and they haven't paid via Stripe
                            return daysRemaining > 0 && daysRemaining <= 30;
                          })();
                          
                          const daysRemaining = premiumExpiresAt 
                            ? Math.ceil((new Date(premiumExpiresAt).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                            : 0;

                          if (isFreeTrial && daysRemaining > 0) {
                            return (
                              <div className="p-4 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/30">
                                <div className="flex items-center gap-3 mb-3">
                                  <div className="p-2 rounded-lg bg-amber-500/20">
                                    <Clock className="h-5 w-5 text-amber-600" />
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-semibold">Free Trial</h4>
                                      <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-500/20 text-amber-700">
                                        {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining
                                      </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                      Enjoying full access to {originalAccountMode === 'both' ? 'fishing + dating' : 'fishing'} features
                                    </p>
                                  </div>
                                </div>
                                
                                {/* Trial Progress Bar */}
                                <div className="mt-3 mb-4">
                                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-300"
                                      style={{ width: `${Math.max(0, (daysRemaining / 30) * 100)}%` }}
                                    />
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    Trial expires on {format(new Date(premiumExpiresAt), "MMMM d, yyyy")}
                                  </p>
                                </div>
                                
                                <Button asChild className="w-full">
                                  <Link to="/pricing">
                                    <Star className="h-4 w-4 mr-2" />
                                    Upgrade Now to Keep Access
                                  </Link>
                                </Button>
                              </div>
                            );
                          }
                          
                          // Regular premium (paid) member
                          return (
                            <div className="p-4 rounded-xl bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20">
                              <div className="flex items-center gap-3 mb-3">
                                <div className="p-2 rounded-lg bg-primary/20">
                                  <Star className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                  <h4 className="font-semibold">
                                    {originalAccountMode === 'both' ? 'Trophy Member' : 'Angler Member'}
                                  </h4>
                                  <p className="text-sm text-muted-foreground">
                                    {originalAccountMode === 'both' 
                                      ? 'Full access to fishing + dating features' 
                                      : 'Access to all fishing features'}
                                  </p>
                                </div>
                              </div>
                              
                              {/* Billing Info */}
                              {premiumExpiresAt && (
                                <div className="mt-4 pt-4 border-t border-border/50 space-y-2">
                                  <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Next billing date</span>
                                    <span className="font-medium">{format(new Date(premiumExpiresAt), "MMMM d, yyyy")}</span>
                                  </div>
                                  <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Plan type</span>
                                    <span className="font-medium capitalize">{originalAccountMode === 'both' ? 'Combo' : 'Fishing Only'}</span>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                        
                        {/* Upgrade Option for Angler users */}
                        {originalAccountMode === 'fishing' && (
                          <div className="p-4 rounded-xl border border-dashed border-primary/50 bg-primary/5">
                            <div className="flex items-start gap-3">
                              <Layers className="h-5 w-5 text-primary mt-0.5" />
                              <div className="flex-1">
                                <h4 className="font-semibold text-sm">Upgrade to Trophy</h4>
                                <p className="text-xs text-muted-foreground mb-3">
                                  Add dating features to your fishing subscription
                                </p>
                                <Button asChild size="sm" variant="outline">
                                  <Link to="/pricing">View Upgrade Options</Link>
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 rounded-xl bg-muted/50">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2 rounded-lg bg-muted">
                            <Fish className="h-5 w-5 text-muted-foreground" />
                          </div>
                          <div>
                            <h4 className="font-semibold">No Active Subscription</h4>
                            <p className="text-sm text-muted-foreground">Your premium access has expired</p>
                          </div>
                        </div>
                        <Button asChild className="w-full">
                          <Link to="/pricing">Renew Subscription</Link>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                {/* Manage Subscription Card */}
                {isPremium && (
                  <Card>
                    <CardContent className="p-6">
                      <h3 className="font-semibold mb-4">Manage Subscription</h3>
                      <div className="space-y-3">
                        <Button
                          onClick={() => openPortal()}
                          disabled={portalLoading}
                          variant="outline"
                          className="w-full justify-start"
                        >
                          {portalLoading ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <CreditCard className="h-4 w-4 mr-2" />
                          )}
                          Update Payment Method
                        </Button>
                        <Button
                          onClick={() => openPortal()}
                          disabled={portalLoading}
                          variant="outline"
                          className="w-full justify-start"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          View Billing History
                        </Button>
                        <Button
                          onClick={() => openPortal()}
                          disabled={portalLoading}
                          variant="outline"
                          className="w-full justify-start text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Cancel Subscription
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-4">
                        Manage your subscription through our secure billing portal powered by Stripe.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Hidden Profiles Tab */}
            {activeTab === "hidden-profiles" && (
              <HiddenProfilesSection />
            )}

            {/* Invite Tab */}
            {activeTab === "invite" && (
              <InviteTab userId={user?.id} />
            )}

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 pt-4 border-t">
              <Button
                variant="ghost"
                className="text-destructive hover:text-destructive hover:bg-destructive/10 w-full sm:w-auto"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Account
              </Button>
              <div className="flex gap-3 w-full sm:w-auto">
                <Button variant="outline" className="flex-1 sm:flex-none">
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={saving} className="flex-1 sm:flex-none">
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </main>
        </div>
      </div>

      {/* Delete Account Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Delete Your Account</AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>This will permanently delete your account and all your data including:</p>
              <ul className="list-disc list-inside text-sm space-y-1">
                <li>Your profile, photos, and bio</li>
                <li>All matches and conversations</li>
                <li>Fishing spots, catches, and trips</li>
                <li>Buddy connections and messages</li>
              </ul>
              <p className="font-medium">Type <span className="font-mono bg-muted px-1.5 py-0.5 rounded">DELETE</span> to confirm:</p>
              <Input
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="Type DELETE"
                className="mt-2"
              />
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteConfirmText("")}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={deleteConfirmText !== "DELETE" || deleteLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Forever"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Notifications Tab Component with Push Notifications
interface NotificationsTabProps {
  newMatches: boolean;
  setNewMatches: (v: boolean) => void;
  messages: boolean;
  setMessages: (v: boolean) => void;
  likes: boolean;
  setLikes: (v: boolean) => void;
  marketing: boolean;
  setMarketing: (v: boolean) => void;
}

function NotificationsTab({
  newMatches,
  setNewMatches,
  messages,
  setMessages,
  likes,
  setLikes,
  marketing,
  setMarketing,
}: NotificationsTabProps) {
  const {
    isSupported,
    isSubscribed,
    isLoading,
    permission,
    subscribe,
    unsubscribe,
    platform,
    debugInfo,
  } = usePushNotificationsUnified();
  
  const [showDebug, setShowDebug] = useState(false);
  
  // For unified hook, we consider it "loaded" when not loading
  const vapidKeyLoaded = !isLoading;

  const handlePushToggle = async (enabled: boolean) => {
    if (enabled) {
      await subscribe();
    } else {
      await unsubscribe();
    }
  };

  return (
    <div className="space-y-6">
      {/* Push Notifications Card */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <div>
            <h3 className="font-semibold mb-1 flex items-center gap-2">
              <BellRing className="h-5 w-5" />
              Push Notifications
            </h3>
            <p className="text-sm text-muted-foreground">
              Receive alerts even when the app is closed or in the background.
            </p>
          </div>

          {!isSupported && platform !== 'native' ? (
            <div className="p-4 bg-muted rounded-lg text-sm text-muted-foreground">
              Push notifications are not supported in this browser. Try using Chrome, Firefox, or Edge.
            </div>
          ) : !vapidKeyLoaded ? (
            <div className="p-4 bg-muted rounded-lg text-sm text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading notification settings...
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-medium text-sm">Enable Push Notifications</p>
                  <p className="text-xs text-muted-foreground">
                    {isSubscribed
                      ? "You'll receive alerts for matches, messages & trips"
                      : permission === 'denied'
                      ? "Notifications blocked. Enable in browser settings."
                      : "Get notified instantly on your device"}
                  </p>
                </div>
                <Switch
                  checked={isSubscribed}
                  onCheckedChange={handlePushToggle}
                  disabled={isLoading || permission === 'denied'}
                />
              </div>
              
              {/* Debug info for troubleshooting */}
              <div className="text-xs text-muted-foreground border-t pt-3">
                <div className="flex items-center justify-between">
                  <span>Platform: <span className="font-mono">{platform || 'detecting...'}</span></span>
                  <span>Supported: {isSupported ? 'Yes' : 'No'}</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 px-2 text-xs"
                    onClick={() => setShowDebug(!showDebug)}
                  >
                    {showDebug ? 'Hide Debug' : 'Show Debug'}
                  </Button>
                </div>
                
                {showDebug && debugInfo && (
                  <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-32 font-mono">
                    {debugInfo}
                  </pre>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* In-App Notifications Card */}
      <Card>
        <CardContent className="p-6 space-y-6">
          <div>
            <h3 className="font-semibold mb-1">In-App Notifications</h3>
            <p className="text-sm text-muted-foreground">
              Choose what notifications you want to receive while using the app.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-sm">New Matches</p>
                <p className="text-xs text-muted-foreground">Get notified when you have a new match</p>
              </div>
              <Switch checked={newMatches} onCheckedChange={setNewMatches} />
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-sm">Messages</p>
                <p className="text-xs text-muted-foreground">Get notified when you receive a message</p>
              </div>
              <Switch checked={messages} onCheckedChange={setMessages} />
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium text-sm">Likes</p>
                <p className="text-xs text-muted-foreground">Get notified when someone likes you</p>
              </div>
              <Switch checked={likes} onCheckedChange={setLikes} />
            </div>
            <div className="flex items-center justify-between py-2 border-t pt-4">
              <div>
                <p className="font-medium text-sm">Marketing</p>
                <p className="text-xs text-muted-foreground">Receive tips, offers, and updates</p>
              </div>
              <Switch checked={marketing} onCheckedChange={setMarketing} />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Invite Tab Component
interface InviteTabProps {
  userId?: string;
}

function InviteTab({ userId }: InviteTabProps) {
  const [copied, setCopied] = useState(false);
  
  const PRODUCTION_URL = 'https://findfishingdates.net';
  const referralCode = userId?.slice(0, 8) || 'invite';
  const inviteUrl = `${PRODUCTION_URL}?ref=${referralCode}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      toast.success('Invite link copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: 'Join me on Find Fishing Dates!',
      text: 'Find fishing buddies and dates who share your passion for fishing.',
      url: inviteUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        handleCopyLink();
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        handleCopyLink();
      }
    }
  };

  const handleEmailShare = () => {
    const subject = encodeURIComponent('Join me on Find Fishing Dates!');
    const body = encodeURIComponent(`Hey!\n\nI've been using Find Fishing Dates to connect with fishing buddies and dates who share my passion. You should check it out!\n\nJoin here: ${inviteUrl}`);
    window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
  };

  const handleSMSShare = () => {
    const message = encodeURIComponent(`Check out Find Fishing Dates! Find fishing buddies and dates who share your passion: ${inviteUrl}`);
    window.open(`sms:?body=${message}`, '_blank');
  };

  const handleFacebookShare = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(inviteUrl)}`, '_blank', 'width=600,height=400');
  };

  const handleTwitterShare = () => {
    const text = encodeURIComponent('Find fishing buddies and dates who share your passion for fishing!');
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(inviteUrl)}`, '_blank', 'width=600,height=400');
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(`Check out Find Fishing Dates! Find fishing buddies and dates who share your passion: ${inviteUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Invite Header Card */}
      <Card>
        <CardContent className="p-6 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus className="h-8 w-8 text-primary" />
          </div>
          <h3 className="font-semibold text-xl mb-2">Invite Your Fishing Crew</h3>
          <p className="text-muted-foreground max-w-md mx-auto">
            Share Find Fishing Dates with friends and help them find their perfect fishing buddies and dates!
          </p>
        </CardContent>
      </Card>

      {/* Copy Link Card */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h4 className="font-semibold">Your Personal Invite Link</h4>
          <div className="flex gap-2">
            <div className="flex-1 bg-muted rounded-lg px-4 py-3 text-sm font-mono truncate">
              {inviteUrl}
            </div>
            <Button onClick={handleCopyLink} variant="outline" className="flex-shrink-0">
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </>
              )}
            </Button>
          </div>
          <Button onClick={handleShare} className="w-full">
            <UserPlus className="h-4 w-4 mr-2" />
            Share Invite Link
          </Button>
        </CardContent>
      </Card>

      {/* Share Options Card */}
      <Card>
        <CardContent className="p-6 space-y-4">
          <h4 className="font-semibold">Share via</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Button
              variant="outline"
              onClick={handleEmailShare}
              className="flex items-center justify-center gap-2 h-12"
            >
              <Mail className="h-5 w-5" />
              Email
            </Button>
            <Button
              variant="outline"
              onClick={handleSMSShare}
              className="flex items-center justify-center gap-2 h-12"
            >
              <MessageCircle className="h-5 w-5" />
              SMS
            </Button>
            <Button
              variant="outline"
              onClick={handleWhatsAppShare}
              className="flex items-center justify-center gap-2 h-12"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp
            </Button>
            <Button
              variant="outline"
              onClick={handleFacebookShare}
              className="flex items-center justify-center gap-2 h-12"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              Facebook
            </Button>
            <Button
              variant="outline"
              onClick={handleTwitterShare}
              className="flex items-center justify-center gap-2 h-12"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              X (Twitter)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
