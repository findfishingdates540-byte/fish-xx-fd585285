import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  Map,
  MessageSquare,
  Calendar,
  Settings,
  Fish,
  Heart,
  X,
  Bookmark,
  MapPin,
  Sun,
  Cloud,
  Wind,
  Droplets,
  Star,
  SlidersHorizontal,
  Anchor,
} from "lucide-react";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.png";

type ViewMode = "unified" | "dating" | "fishing";

interface UserProfileData {
  id: string;
  display_name: string | null;
  photos: string[] | null;
  location_name: string | null;
}

interface ProfileData {
  id: string;
  display_name: string | null;
  photos: string[] | null;
  date_of_birth: string | null;
  fishing_experience: string | null;
  preferred_species: string[] | null;
  fishing_gear: string[] | null;
  location_name: string | null;
}

interface FishingSpot {
  id: string;
  name: string;
  photos: string[] | null;
  species_available: string[] | null;
  rating_avg: number | null;
  is_public: boolean | null;
}

interface RecentCatch {
  id: string;
  photos: string[] | null;
  species_name: string | null;
  created_at: string;
  user_id: string;
  profile?: {
    display_name: string | null;
    photos: string[] | null;
  };
}

function calculateAge(dateOfBirth: string | null): number | null {
  if (!dateOfBirth) return null;
  const today = new Date();
  const birth = new Date(dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

const sidebarItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/app", active: true },
  { label: "Matches", icon: Users, href: "/app/matches", badge: null },
  { label: "Map Spots", icon: Map, href: "/app/spots" },
  { label: "Messages", icon: MessageSquare, href: "/app/messages" },
  { label: "Planned Trips", icon: Calendar, href: "/app/trips" },
];

export default function ComboDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>("unified");
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<UserProfileData | null>(null);
  const [nearbyAnglers, setNearbyAnglers] = useState<ProfileData[]>([]);
  const [hotSpots, setHotSpots] = useState<FishingSpot[]>([]);
  const [recentCatches, setRecentCatches] = useState<RecentCatch[]>([]);
  const [matchCount, setMatchCount] = useState(0);
  const [featuredSpot, setFeaturedSpot] = useState<FishingSpot | null>(null);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Fetch user profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, display_name, photos, location_name")
        .eq("id", user.id)
        .single();
      
      setUserProfile(profile);

      // Fetch match count
      const { count } = await supabase
        .from("matches")
        .select("id", { count: "exact", head: true })
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .eq("is_match", true);
      
      setMatchCount(count || 0);

      // Fetch nearby anglers (profiles)
      const { data: anglers } = await supabase
        .from("profiles")
        .select("id, display_name, photos, date_of_birth, fishing_experience, preferred_species, fishing_gear, location_name")
        .eq("is_active", true)
        .neq("id", user.id)
        .not("photos", "is", null)
        .limit(5);
      
      setNearbyAnglers(anglers || []);

      // Fetch hot spots
      const { data: spots } = await supabase
        .from("fishing_spots")
        .select("id, name, photos, species_available, rating_avg, is_public")
        .eq("is_public", true)
        .order("rating_avg", { ascending: false })
        .limit(3);
      
      setHotSpots(spots || []);
      if (spots && spots.length > 0) {
        setFeaturedSpot(spots[0]);
      }

      // Fetch recent catches with profile info
      const { data: catches } = await supabase
        .from("catches")
        .select(`
          id, photos, species_name, created_at, user_id
        `)
        .order("created_at", { ascending: false })
        .limit(3);

      if (catches && catches.length > 0) {
        // Fetch profiles for catch owners
        const userIds = [...new Set(catches.map(c => c.user_id))];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, display_name, photos")
          .in("id", userIds);

        const catchesWithProfiles = catches.map(c => ({
          ...c,
          profile: profiles?.find(p => p.id === c.user_id)
        }));
        setRecentCatches(catchesWithProfiles);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) return "Just now";
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <div className="w-60 border-r bg-card p-4">
          <Skeleton className="h-12 w-full mb-8" />
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full mb-2" />
          ))}
        </div>
        <div className="flex-1 p-6">
          <Skeleton className="h-8 w-64 mb-6" />
          <Skeleton className="h-64 w-full mb-6" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Sidebar */}
      <aside className="w-60 border-r bg-card flex flex-col">
        {/* Logo */}
        <div className="p-4 border-b">
          <Link to="/app" className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={logo} alt="FindFish" />
              <AvatarFallback>FF</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-sm">Find Fishing Dates</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Combo Mode</p>
            </div>
          </Link>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 p-3">
          {sidebarItems.map((item) => (
            <Link
              key={item.label}
              to={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-1",
                item.active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
              {item.label === "Matches" && matchCount > 0 && (
                <Badge variant="secondary" className="ml-auto bg-primary text-primary-foreground text-xs">
                  {matchCount}
                </Badge>
              )}
            </Link>
          ))}
        </nav>

        {/* Bottom Actions */}
        <div className="p-3 border-t">
          <Button
            className="w-full mb-3 gap-2"
            onClick={() => navigate("/app/catches")}
          >
            <Fish className="h-4 w-4" />
            Log Catch
          </Button>
          <Link
            to="/app/settings"
            className="flex items-center gap-3 px-3 py-2.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <Settings className="h-5 w-5" />
            <span>Settings</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto flex flex-col">
        {/* Full-width Header Section */}
        <div className="p-6 pb-0">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">
                {getGreeting()}, {userProfile?.display_name?.split(' ')[0] || 'Angler'}!
              </h1>
              <p className="text-muted-foreground">
                Conditions look perfect for fishing today.
              </p>
            </div>

            {/* View Mode Toggle */}
            <div className="flex bg-muted rounded-full p-1">
              {[
                { value: "unified", label: "Unified View", icon: LayoutDashboard },
                { value: "dating", label: "Dating Only", icon: Heart },
                { value: "fishing", label: "Fishing Spots", icon: Anchor },
              ].map((mode) => (
                <button
                  key={mode.value}
                  onClick={() => setViewMode(mode.value as ViewMode)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors",
                    viewMode === mode.value
                      ? "bg-background text-primary shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <mode.icon className="h-4 w-4" />
                  {mode.label}
                </button>
              ))}
            </div>
          </div>

          {/* Suggestion of the Day */}
          {featuredSpot && (
            <Card className="mb-6 overflow-hidden">
              <div className="flex flex-col md:flex-row">
                <div className="md:w-1/2 aspect-video md:aspect-auto relative">
                  <img
                    src={featuredSpot.photos?.[0] || "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=800"}
                    alt={featuredSpot.name}
                    className="w-full h-full object-cover"
                  />
                  <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground">
                    Suggestion of the Day
                  </Badge>
                </div>
                <div className="md:w-1/2 p-6 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-primary border-primary">
                      {featuredSpot.rating_avg ? `${Math.round(featuredSpot.rating_avg * 10)}% Match` : "Top Rated"}
                    </Badge>
                    <span className="text-sm text-muted-foreground">• 12 miles away</span>
                  </div>
                  <h2 className="text-xl font-bold mb-2">
                    Perfect Catch & Match: {featuredSpot.name}
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    A top-rated spot for quiet conversation and excellent {featuredSpot.species_available?.[0] || "Bass"} fishing. Based on your shared interest in fly...
                  </p>
                  <div className="flex items-center gap-3">
                    <Button onClick={() => navigate(`/app/spots/${featuredSpot.id}`)}>
                      View Details
                    </Button>
                    <Button variant="outline" size="icon">
                      <Bookmark className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Two-column layout for remaining content */}
        <div className="flex flex-1 px-6 pb-6 gap-6">
          <main className="flex-1">
            <AnimatePresence mode="wait">
              {/* New Anglers Near You - Show in unified and dating modes */}
              {(viewMode === "unified" || viewMode === "dating") && (
                <motion.div
                  key="anglers"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                  className="mb-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <Heart className="h-5 w-5 text-destructive" />
                      New Anglers Near You
                    </h2>
                    <Button variant="link" className="text-primary" onClick={() => navigate("/app/discover")}>
                      View All
                    </Button>
                  </div>

                  <div className="space-y-4">
                    {nearbyAnglers.slice(0, 3).map((angler, index) => (
                      <motion.div
                        key={angler.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <Card className="overflow-hidden">
                          <CardContent className="p-4">
                            <div className="flex items-center gap-4">
                              <Avatar className="h-20 w-20 rounded-lg">
                                <AvatarImage src={angler.photos?.[0]} className="object-cover" />
                                <AvatarFallback className="rounded-lg">
                                  {angler.display_name?.[0] || "?"}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h3 className="font-semibold">
                                      {angler.display_name || "Anonymous"}{calculateAge(angler.date_of_birth) ? `, ${calculateAge(angler.date_of_birth)}` : ""}
                                    </h3>
                                    <p className="text-sm text-muted-foreground capitalize">
                                      {angler.fishing_experience || "Fishing Enthusiast"}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Button variant="outline" size="icon" className="rounded-full h-10 w-10">
                                      <X className="h-5 w-5" />
                                    </Button>
                                    <Button size="icon" className="rounded-full h-10 w-10 bg-destructive hover:bg-destructive/90">
                                      <Heart className="h-5 w-5" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {angler.preferred_species?.slice(0, 2).map((species, i) => (
                                    <Badge key={i} variant="secondary" className="text-xs">
                                      {species}
                                    </Badge>
                                  ))}
                                  {angler.fishing_gear?.slice(0, 1).map((gear, i) => (
                                    <Badge key={i} variant="outline" className="text-xs text-primary border-primary/30 bg-primary/5">
                                      <Fish className="h-3 w-3 mr-1" />
                                      {gear}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Fishing Spots Grid - Show in unified and fishing modes */}
              {(viewMode === "unified" || viewMode === "fishing") && hotSpots.length > 0 && (
                <motion.div
                  key="spots"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, ease: "easeOut", delay: viewMode === "unified" ? 0.1 : 0 }}
                  className="mb-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" />
                      Popular Fishing Spots
                    </h2>
                    <Button variant="link" className="text-primary" onClick={() => navigate("/app/spots")}>
                      View All
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {hotSpots.map((spot, index) => (
                      <motion.div
                        key={spot.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.1 }}
                      >
                        <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={() => navigate(`/app/spots/${spot.id}`)}>
                          <div className="relative h-32">
                            <img
                              src={spot.photos?.[0] || "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=400"}
                              alt={spot.name}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 text-white px-2 py-1 rounded-full text-xs">
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                              {spot.rating_avg?.toFixed(1) || "4.5"}
                            </div>
                          </div>
                          <CardContent className="p-3">
                            <h3 className="font-semibold text-sm mb-1">{spot.name}</h3>
                            <div className="flex flex-wrap gap-1">
                              {spot.species_available?.slice(0, 2).map((species, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {species}
                                </Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Recent Catch Activity - Show in unified and fishing modes */}
              {(viewMode === "unified" || viewMode === "fishing") && recentCatches.length > 0 && (
                <motion.div
                  key="catches"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, ease: "easeOut", delay: viewMode === "unified" ? 0.2 : 0.1 }}
                  className="mb-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <Fish className="h-5 w-5 text-primary" />
                      Recent Catch Activity
                    </h2>
                    <Button variant="link" className="text-primary" onClick={() => navigate("/app/catches")}>
                      View All
                    </Button>
                  </div>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={recentCatches[0].profile?.photos?.[0]} />
                          <AvatarFallback>
                            {recentCatches[0].profile?.display_name?.[0] || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-medium">
                            {recentCatches[0].profile?.display_name || "Someone"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Just logged a catch • {formatTimeAgo(recentCatches[0].created_at)}
                          </p>
                        </div>
                      </div>
                      {recentCatches[0].photos?.[0] && (
                        <img
                          src={recentCatches[0].photos[0]}
                          alt="Recent catch"
                          className="w-full h-48 object-cover rounded-lg mt-3"
                        />
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </main>

          {/* Right Sidebar - Now inside the two-column layout */}
          <aside className="w-80 hidden lg:block space-y-4">
            {/* Weather Widget */}
            <Card className="bg-gradient-to-br from-cyan-500 to-blue-600 text-white border-0">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs opacity-80">Current Location</p>
                    <p className="font-semibold flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {userProfile?.location_name || "Lake Tahoe, CA"}
                    </p>
                  </div>
                  <Sun className="h-10 w-10 text-yellow-300" />
                </div>
                <div className="mb-3">
                  <span className="text-5xl font-bold">72°</span>
                </div>
                <p className="text-sm opacity-90 flex items-center gap-2">
                  <Cloud className="h-4 w-4" />
                  Clear Sky • <Wind className="h-4 w-4" /> 4mph NW
                </p>
                <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-white/20">
                  <div className="text-center">
                    <p className="text-xs opacity-70">Bite Rating</p>
                    <p className="font-semibold text-green-300">High</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs opacity-70">Pressure</p>
                    <p className="font-semibold">30.1in</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs opacity-70">Water Temp</p>
                    <p className="font-semibold">65°F</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Local Hot Spots */}
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    Local Hot Spots
                  </CardTitle>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <SlidersHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {hotSpots.map((spot) => (
                  <Link
                    key={spot.id}
                    to={`/app/spots/${spot.id}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted transition-colors"
                  >
                    <img
                      src={spot.photos?.[0] || "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?w=100"}
                      alt={spot.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{spot.name}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        Known for: {spot.species_available?.slice(0, 2).join(", ") || "Various fish"}
                      </p>
                      <Badge variant="secondary" className="text-xs mt-1">
                        Active Now
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-amber-500">
                        <span className="text-sm font-medium">{spot.rating_avg?.toFixed(1) || "4.5"}</span>
                        <Star className="h-3 w-3 fill-current" />
                      </div>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </aside>
        </div>
      </div>
    </div>
  );
}
