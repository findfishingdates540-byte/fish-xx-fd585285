import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useMapboxToken } from "@/hooks/use-mapbox-token";
import { useSavedSpots } from "@/hooks/use-saved-spots";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Star,
  MapPin,
  Heart,
  Share2,
  ChevronRight,
  Anchor,
  Accessibility,
  ParkingCircle,
  Bath,
  Sun,
  Wind,
  Gauge,
  Cloud,
  CloudRain,
  Sunrise,
  Sunset,
  Navigation,
  Play,
  Fish,
  Clock,
  Users,
  ArrowLeft,
  ExternalLink,
  Image as ImageIcon,
} from "lucide-react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

interface FishingSpot {
  id: string;
  name: string;
  description: string | null;
  location_name: string | null;
  location_lat: number;
  location_lng: number;
  species_available: string[] | null;
  is_public: boolean | null;
  is_verified: boolean | null;
  rating_avg: number | null;
  rating_count: number | null;
  photos: string[] | null;
  created_by: string | null;
}

// Mock weather data - in production this would come from a weather API
const mockWeather = {
  temp: 72,
  condition: "Sunny",
  high: 75,
  low: 60,
  wind: "5 mph NW",
  pressure: "1015 hPa",
  status: "Good Conditions",
  forecast: [
    { day: "Tue", temp: 74, icon: "sun" },
    { day: "Wed", temp: 70, icon: "cloud" },
    { day: "Thu", temp: 65, icon: "rain" },
    { day: "Fri", temp: 72, icon: "sun" },
  ],
};

// Mock fish species data
const mockSpecies = [
  { name: "Rainbow Trout", rarity: "Very Common", depth: "Top water", image: "🐟" },
  { name: "Kokanee Salmon", rarity: "Seasonal", depth: "Deep water", image: "🐠" },
  { name: "Mackinaw", rarity: "Rare", depth: "Deep water", image: "🎣" },
];

// Mock ratings distribution
const mockRatings = {
  5: 75,
  4: 15,
  3: 5,
  2: 3,
  1: 2,
};

const amenities = [
  { id: "boat", label: "Boat Launch", icon: Anchor },
  { id: "ada", label: "ADA Accessible", icon: Accessibility },
  { id: "restrooms", label: "Restrooms", icon: Bath },
  { id: "parking", label: "Parking", icon: ParkingCircle },
];

export default function SpotDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { token: mapboxToken } = useMapboxToken();
  const { isSpotSaved, toggleSaveSpot } = useSavedSpots();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);

  const [spot, setSpot] = useState<FishingSpot | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(0);

  const isSaved = id ? isSpotSaved(id) : false;

  useEffect(() => {
    const fetchSpot = async () => {
      if (!id) return;

      try {
        const { data, error } = await supabase
          .from("fishing_spots")
          .select("*")
          .eq("id", id)
          .maybeSingle();

        if (error) throw error;
        setSpot(data);
      } catch (err) {
        console.error("Error fetching spot:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSpot();
  }, [id]);

  // Initialize mini map
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken || !spot || map.current) return;

    mapboxgl.accessToken = mapboxToken;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [spot.location_lng, spot.location_lat],
      zoom: 12,
      interactive: false,
    });

    // Add marker
    new mapboxgl.Marker({ color: "#000" })
      .setLngLat([spot.location_lng, spot.location_lat])
      .addTo(map.current);

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [mapboxToken, spot]);

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: spot?.name,
        text: `Check out this fishing spot: ${spot?.name}`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleGetDirections = () => {
    if (spot) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${spot.location_lat},${spot.location_lng}`;
      window.open(url, "_blank");
    }
  };

  const formatCoordinates = (lat: number, lng: number) => {
    const latDir = lat >= 0 ? "N" : "S";
    const lngDir = lng >= 0 ? "E" : "W";
    return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lng).toFixed(4)}° ${lngDir}`;
  };

  const getWeatherIcon = (type: string) => {
    switch (type) {
      case "sun": return <Sun className="h-5 w-5 text-amber-500" />;
      case "cloud": return <Cloud className="h-5 w-5 text-muted-foreground" />;
      case "rain": return <CloudRain className="h-5 w-5 text-blue-500" />;
      default: return <Sun className="h-5 w-5 text-amber-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-12 w-96" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-80 w-full rounded-xl" />
              <Skeleton className="h-40 w-full" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-64 w-full rounded-xl" />
              <Skeleton className="h-48 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!spot) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Fish className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Spot Not Found</h2>
          <p className="text-muted-foreground mb-4">This fishing spot doesn't exist or has been removed.</p>
          <Button onClick={() => navigate("/app/spots")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Spots
          </Button>
        </div>
      </div>
    );
  }

  const photos = spot.photos?.length ? spot.photos : ["/placeholder.svg"];

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Breadcrumb */}
      <div className="bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/app/discover" className="hover:text-foreground">Home</Link>
            <ChevronRight className="h-4 w-4" />
            <Link to="/app/spots" className="hover:text-foreground">Find Spots</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-foreground font-medium truncate max-w-[200px]">{spot.name}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">{spot.name}</h1>
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="font-semibold">{spot.rating_avg?.toFixed(1) || "N/A"}</span>
                <span className="text-muted-foreground">({spot.rating_count || 0} reviews)</span>
              </div>
              <span className="text-muted-foreground">•</span>
              <div className="flex items-center gap-1 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {spot.location_name || "Unknown Location"}
              </div>
              <span className="text-muted-foreground">•</span>
              <Badge variant="secondary">Freshwater</Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button
              size="sm"
              onClick={() => id && toggleSaveSpot(id)}
              className={isSaved ? "bg-red-500 hover:bg-red-600" : ""}
            >
              <Heart className={`h-4 w-4 mr-2 ${isSaved ? "fill-current" : ""}`} />
              {isSaved ? "Saved" : "Save Spot"}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Photo Gallery */}
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 relative rounded-xl overflow-hidden bg-muted aspect-[4/3]">
                {photos[selectedPhoto] !== "/placeholder.svg" ? (
                  <img
                    src={photos[selectedPhoto]}
                    alt={spot.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Fish className="h-20 w-20 text-muted-foreground" />
                  </div>
                )}
                <button className="absolute bottom-3 left-3 bg-background/90 backdrop-blur-sm text-xs font-medium px-3 py-1.5 rounded-full flex items-center gap-1.5">
                  <ImageIcon className="h-3 w-3" />
                  View all photos
                </button>
              </div>
              <div className="space-y-3">
                {photos.slice(1, 3).map((photo, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedPhoto(index + 1)}
                    className="relative rounded-xl overflow-hidden bg-muted aspect-[4/3] cursor-pointer hover:opacity-90 transition-opacity"
                  >
                    {photo !== "/placeholder.svg" ? (
                      <img src={photo} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Fish className="h-10 w-10 text-muted-foreground" />
                      </div>
                    )}
                    {index === 1 && (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
                          <Play className="h-5 w-5 text-foreground ml-0.5" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* About Section */}
            <div className="bg-background rounded-xl p-6 border">
              <h2 className="text-lg font-semibold mb-3">About this spot</h2>
              <p className="text-muted-foreground leading-relaxed mb-4">
                {spot.description || 
                  "This fishing spot offers great opportunities for anglers of all skill levels. The waters are home to various fish species and feature accessible shoreline fishing points. Check local regulations before fishing."}
              </p>
              <div className="flex flex-wrap gap-3">
                {amenities.map((amenity) => {
                  const Icon = amenity.icon;
                  return (
                    <div
                      key={amenity.id}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted text-sm"
                    >
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      {amenity.label}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Common Catches */}
            <div className="bg-background rounded-xl p-6 border">
              <h2 className="text-lg font-semibold mb-4">Common Catches</h2>
              <div className="flex flex-wrap gap-3">
                {(spot.species_available?.length ? spot.species_available : mockSpecies.map(s => s.name)).map((species, index) => {
                  const speciesData = mockSpecies[index] || mockSpecies[0];
                  return (
                    <div
                      key={species}
                      className="flex items-center gap-3 p-3 rounded-xl border bg-muted/30 min-w-[180px]"
                    >
                      <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-2xl">
                        {speciesData.image}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{species}</p>
                        <p className="text-xs text-muted-foreground">
                          {speciesData.rarity} • {speciesData.depth}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Location */}
            <div className="bg-background rounded-xl p-6 border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Location</h2>
                <button 
                  onClick={handleGetDirections}
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  View larger map
                  <ExternalLink className="h-3 w-3" />
                </button>
              </div>
              <div ref={mapContainer} className="w-full h-48 rounded-xl overflow-hidden mb-3 bg-muted" />
              <p className="text-sm text-muted-foreground">
                Coordinates: {formatCoordinates(spot.location_lat, spot.location_lng)}
              </p>
            </div>

            {/* Reviews & Ratings */}
            <div className="bg-background rounded-xl p-6 border">
              <h2 className="text-lg font-semibold mb-4">Reviews & Ratings</h2>
              <div className="flex gap-8">
                <div className="text-center">
                  <div className="text-5xl font-bold">{spot.rating_avg?.toFixed(1) || "N/A"}</div>
                  <div className="text-sm text-muted-foreground">/ 5</div>
                  <div className="flex items-center justify-center gap-0.5 mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= Math.round(spot.rating_avg || 0)
                            ? "fill-amber-400 text-amber-400"
                            : "text-muted-foreground"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Based on {spot.rating_count || 0} reviews
                  </p>
                </div>
                <div className="flex-1 space-y-2">
                  {[5, 4, 3, 2, 1].map((rating) => (
                    <div key={rating} className="flex items-center gap-2">
                      <span className="w-3 text-sm text-muted-foreground">{rating}</span>
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{ width: `${mockRatings[rating as keyof typeof mockRatings]}%` }}
                        />
                      </div>
                      <span className="w-10 text-xs text-muted-foreground text-right">
                        {mockRatings[rating as keyof typeof mockRatings]}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Weather Widget */}
            <div className="bg-background rounded-xl p-5 border">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Sun className="h-5 w-5 text-amber-500" />
                  <span className="font-medium">Weather</span>
                </div>
                <Badge className="bg-green-100 text-green-700 border-0 hover:bg-green-100">
                  {mockWeather.status}
                </Badge>
              </div>
              <div className="flex items-start gap-2 mb-4">
                <span className="text-5xl font-light">{mockWeather.temp}°</span>
                <div className="pt-2">
                  <p className="font-medium">{mockWeather.condition}</p>
                  <p className="text-xs text-muted-foreground">
                    H:{mockWeather.high}° L:{mockWeather.low}°
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Wind className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">WIND</p>
                    <p className="font-medium">{mockWeather.wind}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Gauge className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">PRESSURE</p>
                    <p className="font-medium">{mockWeather.pressure}</p>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-2">FORECAST</p>
                <div className="grid grid-cols-4 gap-2">
                  {mockWeather.forecast.map((day) => (
                    <div key={day.day} className="text-center">
                      <p className="text-xs text-muted-foreground">{day.day}</p>
                      {getWeatherIcon(day.icon)}
                      <p className="text-sm font-medium">{day.temp}°</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Best Fishing Times */}
            <div className="bg-background rounded-xl p-5 border">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="h-5 w-5 text-primary" />
                <span className="font-medium">Best Fishing Times</span>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                      <Sunrise className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Early Morning</p>
                      <p className="text-xs text-muted-foreground">5:00 AM - 8:00 AM</p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-700 border-0 hover:bg-green-100">Peak</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                      <Sunset className="h-4 w-4 text-orange-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Dusk / Evening</p>
                      <p className="text-xs text-muted-foreground">6:30 PM - 8:30 PM</p>
                    </div>
                  </div>
                  <Badge variant="secondary">Good</Badge>
                </div>
              </div>
            </div>

            {/* Combo Mode - Who's fishing */}
            <div className="bg-background rounded-xl p-5 border">
              <p className="text-xs font-medium text-muted-foreground mb-1">COMBO MODE</p>
              <p className="text-sm mb-3">See who else is planning to fish here this week!</p>
              <div className="flex items-center gap-2 mb-3">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map((i) => (
                    <Avatar key={i} className="h-8 w-8 border-2 border-background">
                      <AvatarFallback className="text-xs">U{i}</AvatarFallback>
                    </Avatar>
                  ))}
                </div>
                <span className="text-sm text-muted-foreground">+12</span>
                <button className="ml-auto text-sm text-primary hover:underline">View All</button>
              </div>
              <Button variant="outline" className="w-full">
                Check Availability
              </Button>
            </div>

            {/* Get Directions CTA */}
            <Button className="w-full" size="lg" onClick={handleGetDirections}>
              <Navigation className="h-5 w-5 mr-2" />
              Get Directions
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              2.4 miles away • Approx 15 mins
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
