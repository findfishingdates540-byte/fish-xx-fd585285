import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Users, Search, Plus, X, Check } from "lucide-react";

interface Buddy {
  id: string;
  display_name: string | null;
  photos: string[] | null;
  fishing_experience: string | null;
}

interface TripBuddyInviteProps {
  selectedBuddies: string[];
  onBuddiesChange: (buddyIds: string[]) => void;
  existingParticipants?: { user_id: string; status: string }[];
}

export function TripBuddyInvite({ 
  selectedBuddies, 
  onBuddiesChange,
  existingParticipants = []
}: TripBuddyInviteProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch accepted fishing buddies
  const { data: buddies, isLoading } = useQuery({
    queryKey: ["my-fishing-buddies", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get all accepted buddy relationships
      const { data: buddyRelations, error: buddyError } = await supabase
        .from("fishing_buddies")
        .select("requester_id, recipient_id")
        .eq("status", "accepted")
        .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`);

      if (buddyError) throw buddyError;
      if (!buddyRelations?.length) return [];

      // Get the other user's ID from each relationship
      const buddyIds = buddyRelations.map((rel) =>
        rel.requester_id === user.id ? rel.recipient_id : rel.requester_id
      );

      // Fetch buddy profiles
      const { data: profiles, error: profileError } = await supabase
        .from("profiles_safe")
        .select("id, display_name, photos, fishing_experience")
        .in("id", buddyIds);

      if (profileError) throw profileError;
      return profiles as Buddy[];
    },
    enabled: !!user?.id,
  });

  const filteredBuddies = buddies?.filter((buddy) =>
    buddy.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleBuddy = (buddyId: string) => {
    if (selectedBuddies.includes(buddyId)) {
      onBuddiesChange(selectedBuddies.filter((id) => id !== buddyId));
    } else {
      onBuddiesChange([...selectedBuddies, buddyId]);
    }
  };

  const getParticipantStatus = (buddyId: string) => {
    const participant = existingParticipants.find((p) => p.user_id === buddyId);
    return participant?.status;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <CardTitle className="text-base">Invite Buddies</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search buddies..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Selected buddies */}
        {selectedBuddies.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedBuddies.map((buddyId) => {
              const buddy = buddies?.find((b) => b.id === buddyId);
              const status = getParticipantStatus(buddyId);
              return (
                <Badge
                  key={buddyId}
                  variant={status === "accepted" ? "default" : "secondary"}
                  className="flex items-center gap-1 pr-1"
                >
                  {buddy?.display_name || "Unknown"}
                  {status === "accepted" && (
                    <Check className="h-3 w-3 ml-1" />
                  )}
                  {status === "declined" && (
                    <X className="h-3 w-3 ml-1 text-destructive" />
                  )}
                  <button
                    onClick={() => toggleBuddy(buddyId)}
                    className="ml-1 hover:bg-background/20 rounded p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              );
            })}
          </div>
        )}

        {/* Buddy list */}
        <ScrollArea className="h-48">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 p-2 animate-pulse">
                  <div className="h-10 w-10 rounded-full bg-muted" />
                  <div className="h-4 w-24 bg-muted rounded" />
                </div>
              ))}
            </div>
          ) : filteredBuddies?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">
                {buddies?.length === 0
                  ? "No fishing buddies yet"
                  : "No buddies match your search"}
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredBuddies?.map((buddy) => {
                const isSelected = selectedBuddies.includes(buddy.id);
                const status = getParticipantStatus(buddy.id);
                return (
                  <button
                    key={buddy.id}
                    onClick={() => toggleBuddy(buddy.id)}
                    className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                      isSelected
                        ? "bg-primary/10 border border-primary/20"
                        : "hover:bg-muted"
                    }`}
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={buddy.photos?.[0]} />
                      <AvatarFallback>
                        {buddy.display_name?.charAt(0)?.toUpperCase() || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <p className="font-medium text-sm">
                        {buddy.display_name || "Unknown"}
                      </p>
                      {buddy.fishing_experience && (
                        <p className="text-xs text-muted-foreground capitalize">
                          {buddy.fishing_experience}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {status && (
                        <Badge
                          variant={
                            status === "accepted"
                              ? "default"
                              : status === "declined"
                              ? "destructive"
                              : "secondary"
                          }
                          className="text-xs"
                        >
                          {status}
                        </Badge>
                      )}
                      {isSelected ? (
                        <Check className="h-4 w-4 text-primary" />
                      ) : (
                        <Plus className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {selectedBuddies.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {selectedBuddies.length} buddy{selectedBuddies.length !== 1 ? "ies" : ""} selected
          </p>
        )}
      </CardContent>
    </Card>
  );
}
