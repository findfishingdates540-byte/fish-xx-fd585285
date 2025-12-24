import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, MessageCircle, Calendar, Loader2 } from "lucide-react";
import { format, differenceInSeconds } from "date-fns";
import { useMapboxToken } from "@/hooks/use-mapbox-token";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

interface NextUpTripProps {
  trip: {
    id: string;
    title: string;
    trip_date: string;
    start_time?: string;
    location_name?: string;
    status: string;
    location_lat?: number;
    location_lng?: number;
  };
}

export function NextUpTrip({ trip }: NextUpTripProps) {
  const navigate = useNavigate();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const { token, isLoading: tokenLoading, error: tokenError } = useMapboxToken();
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, mins: 0, secs: 0 });

  useEffect(() => {
    const calculateCountdown = () => {
      const tripDateTime = new Date(`${trip.trip_date}T${trip.start_time || '00:00:00'}`);
      const now = new Date();
      const diff = differenceInSeconds(tripDateTime, now);
      
      if (diff <= 0) {
        setCountdown({ days: 0, hours: 0, mins: 0, secs: 0 });
        return;
      }

      const days = Math.floor(diff / (24 * 60 * 60));
      const hours = Math.floor((diff % (24 * 60 * 60)) / (60 * 60));
      const mins = Math.floor((diff % (60 * 60)) / 60);
      const secs = diff % 60;

      setCountdown({ days, hours, mins, secs });
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 1000);
    return () => clearInterval(interval);
  }, [trip.trip_date, trip.start_time]);

  // Initialize map
  useEffect(() => {
    if (!token || !mapContainer.current || map.current) return;

    mapboxgl.accessToken = token;

    const lat = trip.location_lat || 39.0968;
    const lng = trip.location_lng || -120.0324;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/outdoors-v12",
      center: [lng, lat],
      zoom: 11,
      interactive: true,
    });

    map.current.addControl(new mapboxgl.NavigationControl(), "top-right");

    // Add marker
    const markerEl = document.createElement("div");
    markerEl.className = "custom-marker";
    markerEl.innerHTML = `
      <div style="
        background: linear-gradient(135deg, #0ea5e9, #0284c7);
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
      </div>
    `;

    new mapboxgl.Marker({ element: markerEl })
      .setLngLat([lng, lat])
      .addTo(map.current);

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [token, trip.location_lat, trip.location_lng]);

  const statusColors: Record<string, string> = {
    planned: "bg-sky-100 text-sky-700",
    confirmed: "bg-sky-100 text-sky-700",
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };

  return (
    <div className="bg-card rounded-xl overflow-hidden border shadow-sm">
      <div className="grid md:grid-cols-2 gap-0">
        {/* Map */}
        <div className="relative h-64 md:h-80">
          {tokenLoading ? (
            <div className="absolute inset-0 bg-muted flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-sky-500" />
            </div>
          ) : tokenError ? (
            <div className="absolute inset-0 bg-gradient-to-br from-sky-100 to-blue-200 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <MapPin className="h-12 w-12 mx-auto mb-2 text-sky-500" />
                <p className="text-sm font-medium">{trip.location_name || "Location TBD"}</p>
              </div>
            </div>
          ) : (
            <div ref={mapContainer} className="absolute inset-0" />
          )}
          
          {trip.location_name && (
            <div className="absolute top-4 left-4 z-10">
              <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm text-foreground shadow-sm">
                <MapPin className="h-3 w-3 mr-1 text-sky-500" />
                {trip.location_name}
              </Badge>
            </div>
          )}
        </div>

        {/* Details */}
        <div className="p-6 flex flex-col">
          <div className="flex items-start justify-between mb-2">
            <Badge className={statusColors[trip.status] || statusColors.planned}>
              {trip.status.toUpperCase()}
            </Badge>
            <Avatar className="h-12 w-12 border-2 border-white shadow-md">
              <AvatarImage src="/placeholder.svg" />
              <AvatarFallback>FB</AvatarFallback>
            </Avatar>
          </div>

          <h2 className="text-2xl font-bold mb-1">{trip.title}</h2>
          <p className="text-muted-foreground mb-4">
            {format(new Date(trip.trip_date), "EEEE")} at {trip.start_time || "TBD"} • Clear skies expected
          </p>

          {/* Countdown */}
          <div className="bg-muted/50 rounded-lg p-4 mb-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">
              Time until departure
            </p>
            <div className="flex gap-4">
              {[
                { value: countdown.days, label: "DAYS" },
                { value: countdown.hours, label: "HOURS" },
                { value: countdown.mins, label: "MINS" },
                { value: countdown.secs, label: "SECS" },
              ].map((item, i) => (
                <div key={i} className="text-center">
                  <div className="text-2xl font-bold text-sky-500">
                    {String(item.value).padStart(2, "0")}
                  </div>
                  <div className="text-xs text-muted-foreground">{item.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 mt-auto">
            <Button 
              className="flex-1 bg-sky-500 hover:bg-sky-600"
              onClick={() => navigate(`/app/trips/${trip.id}`)}
            >
              <Calendar className="h-4 w-4 mr-2" />
              View Itinerary
            </Button>
            <Button variant="outline" className="flex-1">
              <MessageCircle className="h-4 w-4 mr-2" />
              Message
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
