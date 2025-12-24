import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, MessageCircle, Calendar } from "lucide-react";
import { format, differenceInSeconds } from "date-fns";

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

  const statusColors: Record<string, string> = {
    planned: "bg-sky-100 text-sky-700",
    confirmed: "bg-sky-100 text-sky-700",
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };

  return (
    <div className="bg-card rounded-xl overflow-hidden border shadow-sm">
      <div className="grid md:grid-cols-2 gap-0">
        {/* Map placeholder */}
        <div className="relative h-64 md:h-80 bg-muted">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-100 to-blue-200 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-2 text-sky-500" />
              <p className="text-sm font-medium">{trip.location_name || "Location TBD"}</p>
            </div>
          </div>
          {trip.location_name && (
            <div className="absolute top-4 left-4">
              <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm text-foreground">
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
