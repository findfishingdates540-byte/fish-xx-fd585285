import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, MessageCircle, UserMinus, Fish, Award, CalendarPlus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { formatLastSeen, isRecentlyActive } from '@/hooks/use-online-presence';
import { SpotSelectionDialog } from './SpotSelectionDialog';

interface MyBuddyCardProps {
  buddyId: string;
  profile: {
    id: string;
    display_name: string | null;
    photos: string[] | null;
    location_name: string | null;
    fishing_experience: string | null;
    preferred_species: string[] | null;
  };
  catchCount?: number;
  isOnline?: boolean;
  lastSeen?: string | null;
  onMessage: (buddyId: string) => void;
  onRemove: (userId: string) => void;
}

export function MyBuddyCard({ 
  buddyId,
  profile, 
  catchCount = 0,
  isOnline = false,
  lastSeen,
  onMessage,
  onRemove 
}: MyBuddyCardProps) {
  const navigate = useNavigate();
  const [spotDialogOpen, setSpotDialogOpen] = useState(false);

  const experienceLabels: Record<string, string> = {
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    expert: 'Expert'
  };

  const handleSelectSpot = (spotId: string) => {
    setSpotDialogOpen(false);
    navigate(`/app/buddy-trip/${profile.id}/${spotId}`);
  };

  const handleViewProfile = () => {
    navigate(`/app/profile/${profile.id}`);
  };

  return (
    <>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div 
              className="relative cursor-pointer group"
              onClick={handleViewProfile}
            >
              <Avatar className="h-16 w-16 ring-2 ring-transparent group-hover:ring-primary/50 transition-all">
                <AvatarImage src={profile.photos?.[0]} className="object-cover" />
                <AvatarFallback className="text-lg">
                  {profile.display_name?.charAt(0)?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              {/* Online indicator */}
              <span className={cn(
                "absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-background",
                isOnline ? "bg-green-500" : 
                isRecentlyActive(lastSeen) ? "bg-yellow-500" : 
                "bg-muted-foreground/30"
              )} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div>
                  <h4 
                    className="font-semibold cursor-pointer hover:text-primary transition-colors"
                    onClick={handleViewProfile}
                  >
                    {profile.display_name || 'Anonymous'}
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    {isOnline ? (
                      <span className="text-green-600">Online</span>
                    ) : isRecentlyActive(lastSeen) ? (
                      <span className="text-yellow-600">Active now</span>
                    ) : lastSeen ? (
                      formatLastSeen(lastSeen)
                    ) : null}
                  </p>
                  {profile.location_name && (
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {profile.location_name}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-3 text-muted-foreground">
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <Fish className="w-4 h-4" />
                      <span className="text-sm font-medium">{catchCount}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 mt-2">
                {profile.fishing_experience && (
                  <Badge variant="secondary" className="text-xs">
                    <Award className="w-3 h-3 mr-1" />
                    {experienceLabels[profile.fishing_experience]}
                  </Badge>
                )}
                {profile.preferred_species?.slice(0, 2).map((species) => (
                  <Badge key={species} variant="outline" className="text-xs">
                    {species}
                  </Badge>
                ))}
              </div>

              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleViewProfile}
                >
                  View Profile
                </Button>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => onMessage(buddyId)}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Message
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setSpotDialogOpen(true)}
                >
                  <CalendarPlus className="w-4 h-4 mr-2" />
                  Plan Trip
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onRemove(profile.id)}
                >
                  <UserMinus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <SpotSelectionDialog
        open={spotDialogOpen}
        onOpenChange={setSpotDialogOpen}
        onSelectSpot={handleSelectSpot}
        buddyName={profile.display_name || 'your buddy'}
      />
    </>
  );
}
