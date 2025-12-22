import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
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
  ArrowLeft,
} from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type AccountMode = Database["public"]["Enums"]["account_mode"];

const SUPABASE_URL = "https://zjmnlelqoiclkbrqefyv.supabase.co";

const settingsNav = [
  { id: "account", label: "Account", icon: User },
  { id: "app-mode", label: "App Mode", icon: Smartphone },
  { id: "discovery", label: "Discovery", icon: Compass },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "privacy", label: "Privacy", icon: Shield },
  { id: "subscription", label: "Subscription", icon: CreditCard },
];

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
  const [photos, setPhotos] = useState<string[]>([]);
  const [isVerified, setIsVerified] = useState(false);
  const [isPremium, setIsPremium] = useState(false);

  // Discovery settings
  const [maxDistance, setMaxDistance] = useState(50);
  const [ageRange, setAgeRange] = useState<[number, number]>([18, 50]);
  const [showOnlineStatus, setShowOnlineStatus] = useState(true);

  // Notification settings
  const [newMatches, setNewMatches] = useState(true);
  const [messages, setMessages] = useState(true);
  const [likes, setLikes] = useState(true);
  const [marketing, setMarketing] = useState(false);

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
      toast.error("Failed to load settings");
      return;
    }

    if (data) {
      setDisplayName(data.display_name || "");
      setEmail(data.email || user.email || "");
      setBio(data.bio || "");
      setAccountMode(data.account_mode || "both");
      setPhotos(data.photos || []);
      setIsVerified(data.is_verified || false);
      setIsPremium(data.is_premium || false);
      setMaxDistance(data.max_distance_miles || 50);
      setAgeRange([data.min_age_preference || 18, data.max_age_preference || 50]);
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

    const { error } = await supabase
      .from("profiles")
      .update({
        display_name: displayName,
        bio: bio,
        account_mode: accountMode,
        max_distance_miles: maxDistance,
        min_age_preference: ageRange[0],
        max_age_preference: ageRange[1],
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    setSaving(false);

    if (error) {
      toast.error("Failed to save changes");
      return;
    }

    toast.success("Settings saved successfully");
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully");
    navigate("/auth");
  };

  const getAccountModeLabel = () => {
    switch (accountMode) {
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
        {/* Back Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/app/dashboard")}
          className="mb-4 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
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
            <div>
              <h1 className="text-2xl font-bold">Account Settings</h1>
              <p className="text-muted-foreground">
                Manage your profile details and preferences.
              </p>
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

                {/* Current Mode */}
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-1">Current Mode</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Choose how you want to use Find Fishing Dates. This affects your home feed and discovery settings.
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        onClick={() => setAccountMode("dating")}
                        className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-medium transition-colors ${
                          accountMode === "dating"
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border hover:bg-muted"
                        }`}
                      >
                        <Heart className="h-4 w-4" />
                        Dating Only
                      </button>
                      <button
                        onClick={() => setAccountMode("fishing")}
                        className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-medium transition-colors ${
                          accountMode === "fishing"
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border hover:bg-muted"
                        }`}
                      >
                        <Fish className="h-4 w-4" />
                        Fishing Spots
                      </button>
                      <button
                        onClick={() => setAccountMode("both")}
                        className={`flex items-center justify-center gap-2 p-3 rounded-lg border text-sm font-medium transition-colors ${
                          accountMode === "both"
                            ? "border-primary bg-primary/5 text-primary"
                            : "border-border hover:bg-muted"
                        }`}
                      >
                        <Layers className="h-4 w-4" />
                        Combo Mode
                      </button>
                    </div>
                  </CardContent>
                </Card>

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
                          <h3 className="font-semibold text-lg">Find Fishing Dates Gold</h3>
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

            {/* App Mode Tab */}
            {activeTab === "app-mode" && (
              <Card>
                <CardContent className="p-6 space-y-6">
                  <div>
                    <h3 className="font-semibold mb-1">App Mode Settings</h3>
                    <p className="text-sm text-muted-foreground">
                      Customize how you use the app based on your current mode.
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setAccountMode("dating")}
                      className={`flex flex-col items-center gap-2 p-4 rounded-lg border text-sm font-medium transition-colors ${
                        accountMode === "dating"
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      <Heart className="h-6 w-6" />
                      Dating Only
                      <span className="text-xs text-muted-foreground font-normal">Find your catch</span>
                    </button>
                    <button
                      onClick={() => setAccountMode("fishing")}
                      className={`flex flex-col items-center gap-2 p-4 rounded-lg border text-sm font-medium transition-colors ${
                        accountMode === "fishing"
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      <Fish className="h-6 w-6" />
                      Fishing Only
                      <span className="text-xs text-muted-foreground font-normal">Just here for fish</span>
                    </button>
                    <button
                      onClick={() => setAccountMode("both")}
                      className={`flex flex-col items-center gap-2 p-4 rounded-lg border text-sm font-medium transition-colors ${
                        accountMode === "both"
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border hover:bg-muted"
                      }`}
                    >
                      <Layers className="h-6 w-6" />
                      Combo Mode
                      <span className="text-xs text-muted-foreground font-normal">Best of both</span>
                    </button>
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
                        <span className="text-sm text-muted-foreground">{maxDistance} km</span>
                      </div>
                      <Slider
                        value={[maxDistance]}
                        onValueChange={(v) => setMaxDistance(v[0])}
                        min={5}
                        max={200}
                        step={5}
                      />
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
              <Card>
                <CardContent className="p-6 space-y-6">
                  <div>
                    <h3 className="font-semibold mb-1">Notification Preferences</h3>
                    <p className="text-sm text-muted-foreground">
                      Choose what notifications you want to receive.
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
                    <Button variant="outline" className="w-full justify-start">
                      <Shield className="h-4 w-4 mr-2" />
                      Manage Blocked Users
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <User className="h-4 w-4 mr-2" />
                      Download My Data
                    </Button>
                    <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Account
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Subscription Tab */}
            {activeTab === "subscription" && (
              <Card>
                <CardContent className="p-6 space-y-6">
                  <div>
                    <h3 className="font-semibold mb-1">Subscription</h3>
                    <p className="text-sm text-muted-foreground">
                      Manage your subscription and billing.
                    </p>
                  </div>

                  {isPremium ? (
                    <div className="p-4 bg-primary/10 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Star className="h-5 w-5 text-primary" />
                        <span className="font-semibold">Gold Member</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        You have access to all premium features.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-sm">
                        You're currently on the free plan. Upgrade to Gold to unlock all features.
                      </p>
                      <Button>Upgrade to Gold</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-4 pt-4 border-t">
              <Button
                variant="ghost"
                className="text-destructive hover:text-destructive hover:bg-destructive/10 w-full sm:w-auto"
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
    </div>
  );
}
