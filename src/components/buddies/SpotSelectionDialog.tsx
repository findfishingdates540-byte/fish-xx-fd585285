import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Star, Search, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface FishingSpot {
  id: string;
  name: string;
  location_name: string | null;
  rating_avg: number | null;
  photos: string[] | null;
}

interface SpotSelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectSpot: (spotId: string) => void;
  buddyName: string;
}

export function SpotSelectionDialog({
  open,
  onOpenChange,
  onSelectSpot,
  buddyName,
}: SpotSelectionDialogProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch fishing spots
  const { data: spots, isLoading } = useQuery({
    queryKey: ["fishing-spots-for-trip"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("fishing_spots")
        .select("id, name, location_name, rating_avg, photos")
        .eq("is_public", true)
        .limit(50);

      if (error) throw error;
      return data as FishingSpot[];
    },
    enabled: open,
  });

  // Fetch user's saved spots
  const { data: savedSpotIds } = useQuery({
    queryKey: ["saved-spot-ids", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("user_saved_spots")
        .select("spot_id")
        .eq("user_id", user.id);

      if (error) throw error;
      return data.map((s) => s.spot_id);
    },
    enabled: open && !!user,
  });

  const filteredSpots = spots?.filter(
    (spot) =>
      !searchQuery ||
      spot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      spot.location_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort saved spots first
  const sortedSpots = filteredSpots?.sort((a, b) => {
    const aIsSaved = savedSpotIds?.includes(a.id) ? 1 : 0;
    const bIsSaved = savedSpotIds?.includes(b.id) ? 1 : 0;
    return bIsSaved - aIsSaved;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select a Fishing Spot</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Choose where you want to fish with {buddyName}
          </p>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search spots..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <ScrollArea className="h-[300px] -mx-6 px-6">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : sortedSpots?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No spots found</p>
            </div>
          ) : (
            <div className="space-y-2">
              {sortedSpots?.map((spot) => {
                const isSaved = savedSpotIds?.includes(spot.id);
                return (
                  <Button
                    key={spot.id}
                    variant="ghost"
                    className={cn(
                      "w-full justify-start h-auto py-3 px-3",
                      isSaved && "bg-primary/5 border border-primary/20"
                    )}
                    onClick={() => onSelectSpot(spot.id)}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {spot.photos?.[0] ? (
                          <img
                            src={spot.photos[0]}
                            alt={spot.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <MapPin className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{spot.name}</p>
                          {isSaved && (
                            <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                              Saved
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {spot.location_name && (
                            <span className="truncate">{spot.location_name}</span>
                          )}
                          {spot.rating_avg && (
                            <span className="flex items-center gap-0.5 flex-shrink-0">
                              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                              {spot.rating_avg.toFixed(1)}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    </div>
                  </Button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
