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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Users, Search, ChevronRight, Award } from "lucide-react";
import { cn } from "@/lib/utils";

interface Buddy {
  id: string;
  display_name: string | null;
  photos: string[] | null;
  fishing_experience: string | null;
  location_name: string | null;
}

interface BuddySelectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectBuddy: (buddyId: string) => void;
  spotName: string;
}

export function BuddySelectionDialog({
  open,
  onOpenChange,
  onSelectBuddy,
  spotName,
}: BuddySelectionDialogProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch accepted buddies
  const { data: buddies, isLoading } = useQuery({
    queryKey: ["my-buddies-for-trip", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get accepted buddy relationships
      const { data: buddyData, error: buddyError } = await supabase
        .from("fishing_buddies")
        .select("id, requester_id, recipient_id")
        .eq("status", "accepted")
        .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`);

      if (buddyError) throw buddyError;

      // Get the other user's ID from each relationship
      const buddyUserIds = buddyData.map((b) =>
        b.requester_id === user.id ? b.recipient_id : b.requester_id
      );

      if (buddyUserIds.length === 0) return [];

      // Fetch buddy profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles_safe")
        .select("id, display_name, photos, fishing_experience, location_name")
        .in("id", buddyUserIds);

      if (profilesError) throw profilesError;

      return profiles as Buddy[];
    },
    enabled: open && !!user,
  });

  const experienceLabels: Record<string, string> = {
    beginner: "Beginner",
    intermediate: "Intermediate",
    advanced: "Advanced",
    expert: "Expert",
  };

  const filteredBuddies = buddies?.filter(
    (buddy) =>
      !searchQuery ||
      buddy.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      buddy.location_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite a Buddy</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Choose who to invite fishing at {spotName}
          </p>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search buddies..."
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
          ) : filteredBuddies?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="font-medium">No buddies found</p>
              <p className="text-sm">
                {buddies?.length === 0
                  ? "Add some fishing buddies first!"
                  : "Try a different search"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredBuddies?.map((buddy) => (
                <Button
                  key={buddy.id}
                  variant="ghost"
                  className="w-full justify-start h-auto py-3 px-3"
                  onClick={() => onSelectBuddy(buddy.id)}
                >
                  <div className="flex items-center gap-3 w-full">
                    <Avatar className="h-12 w-12">
                      <AvatarImage
                        src={buddy.photos?.[0]}
                        className="object-cover"
                      />
                      <AvatarFallback>
                        {buddy.display_name?.[0]?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left min-w-0">
                      <p className="font-medium truncate">
                        {buddy.display_name || "Anonymous"}
                      </p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {buddy.fishing_experience && (
                          <Badge variant="secondary" className="text-xs">
                            <Award className="h-3 w-3 mr-1" />
                            {experienceLabels[buddy.fishing_experience] ||
                              buddy.fishing_experience}
                          </Badge>
                        )}
                        {buddy.location_name && (
                          <span className="truncate text-xs">
                            {buddy.location_name}
                          </span>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  </div>
                </Button>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
