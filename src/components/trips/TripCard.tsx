import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, MapPin, MessageCircle, MoreVertical, Calendar } from "lucide-react";
import { format } from "date-fns";

interface TripCardProps {
  trip: {
    id: string;
    title: string;
    trip_date: string;
    start_time?: string;
    end_time?: string;
    location_name?: string;
    status: string;
  };
}

const tripImages = [
  "https://images.unsplash.com/photo-1504851149312-7a075b496cc7?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=600&fit=crop",
];

export function TripCard({ trip }: TripCardProps) {
  const navigate = useNavigate();

  const statusColors: Record<string, { bg: string; text: string }> = {
    planned: { bg: "bg-muted", text: "text-muted-foreground" },
    pending: { bg: "bg-muted", text: "text-muted-foreground" },
    confirmed: { bg: "bg-foreground", text: "text-background" },
    completed: { bg: "bg-green-100", text: "text-green-700" },
    cancelled: { bg: "bg-red-100", text: "text-red-700" },
    rescheduled: { bg: "bg-muted", text: "text-muted-foreground" },
  };

  const status = statusColors[trip.status] || statusColors.planned;
  const randomImage = tripImages[Math.floor(Math.random() * tripImages.length)];

  const formatTime = (time?: string) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    const h = parseInt(hours);
    const suffix = h >= 12 ? "PM" : "AM";
    const hour12 = h % 12 || 12;
    return `${hour12}:${minutes} ${suffix}`;
  };

  return (
    <div className="bg-card rounded-xl overflow-hidden border shadow-sm hover:shadow-md transition-shadow">
      {/* Image with date badge */}
      <div className="relative h-40">
        <img
          src={randomImage}
          alt={trip.title}
          className="w-full h-full object-cover"
        />
        <Badge className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm text-foreground">
          <Calendar className="h-3 w-3 mr-1" />
          {format(new Date(trip.trip_date), "MMM d")}
        </Badge>
        <Avatar className="absolute bottom-3 left-3 h-10 w-10 border-2 border-white shadow-md">
          <AvatarImage src="/placeholder.svg" />
          <AvatarFallback>FB</AvatarFallback>
        </Avatar>
        <Badge className={`absolute bottom-3 right-3 ${status.bg} ${status.text}`}>
          {trip.status.toUpperCase()}
        </Badge>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-lg mb-2 truncate">{trip.title}</h3>
        
        <div className="space-y-1 text-sm text-muted-foreground mb-4">
          {trip.start_time && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>
                {formatTime(trip.start_time)}
                {trip.end_time && ` - ${formatTime(trip.end_time)}`}
              </span>
            </div>
          )}
          {trip.location_name && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="truncate">{trip.location_name}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
          >
            <MessageCircle className="h-4 w-4 mr-1" />
            Chat
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={() => navigate(`/app/trips/${trip.id}`)}
          >
            Details
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
