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
import { VerificationBadge } from '@/components/ui/verification-badge';

interface MyBuddyCardProps {
  buddyId: string;
  profile: {
    id: string;
    display_name: string | null;
    photos: string[] | null;
    location_name: string | null;
    fishing_experience: string | null;
    preferred_species: string[] | null;
    id_verified?: boolean;
    live_verified?: boolean;
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
    navigate(`/app/u/${profile.id}`);
  };

  return (
    <>
      <Card>
        <CardContent className="p-4">
          <div className="flex items-start gap-3 sm:gap-4">
            <div 
              className="relative cursor-pointer group shrink-0"
              onClick={handleViewProfile}
            >
              <Avatar className="h-12 w-12 sm:h-16 sm:w-16 ring-2 ring-transparent group-hover:ring-primary/50 transition-all">
                <AvatarImage src={profile.photos?.[0]} className="object-cover" />
                <AvatarFallback className="text-sm sm:text-lg">
                  {profile.display_name?.charAt(0)?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              {/* Online indicator */}
              <span className={cn(
                "absolute bottom-0 right-0 h-3 w-3 sm:h-4 sm:w-4 rounded-full border-2 border-background",
                isOnline ? "bg-green-500" : 
                isRecentlyActive(lastSeen) ? "bg-yellow-500" : 
                "bg-muted-foreground/30"
              )} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h4 
                    className="font-semibold cursor-pointer hover:text-primary transition-colors truncate flex items-center gap-1"
                    onClick={handleViewProfile}
                  >
                    {profile.display_name || 'Anonymous'}
                    <VerificationBadge 
                      idVerified={profile.id_verified} 
                      liveVerified={profile.live_verified} 
                      size="sm" 
                    />
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
                    <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 shrink-0" />
                      <span className="truncate">{profile.location_name}</span>
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 text-muted-foreground shrink-0">
                  <Fish className="w-4 h-4" />
                  <span className="text-sm font-medium">{catchCount}</span>
                </div>
              </div>
              
              <div className="flex items-center gap-1.5 sm:gap-2 mt-2 flex-wrap">
                {profile.fishing_experience && (
                  <Badge variant="secondary" className="text-xs">
                    <Award className="w-3 h-3 mr-1 shrink-0" />
                    <span className="truncate">{experienceLabels[profile.fishing_experience]}</span>
                  </Badge>
                )}
                {/* Preferred species hidden for now */}
              </div>

              <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleViewProfile}
                  className="text-xs sm:text-sm h-8 px-2 sm:px-3"
                >
                  <span className="hidden sm:inline">View Profile</span>
                  <span className="sm:hidden">Profile</span>
                </Button>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => onMessage(buddyId)}
                  className="text-xs sm:text-sm h-8 px-2 sm:px-3"
                >
                  <MessageCircle className="w-4 h-4 sm:mr-1.5" />
                  <span className="hidden sm:inline">Message</span>
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setSpotDialogOpen(true)}
                  className="text-xs sm:text-sm h-8 px-2 sm:px-3"
                >
                  <CalendarPlus className="w-4 h-4 sm:mr-1.5" />
                  <span className="hidden sm:inline">Plan Trip</span>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onRemove(profile.id)}
                  className="h-8 px-2"
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
