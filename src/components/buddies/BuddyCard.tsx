import { useState } from 'react';
import { MapPin, Fish, Award, UserPlus, MessageCircle, Check, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { isRecentlyActive } from '@/hooks/use-online-presence';
import { useNavigate } from 'react-router-dom';
import { VerificationBadge } from '@/components/ui/verification-badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface BuddyCardProps {
  profile: {
    id: string;
    display_name: string | null;
    photos: string[] | null;
    location_name: string | null;
    fishing_experience: string | null;
    fishing_styles?: string[] | null;
    preferred_species: string[] | null;
    bio: string | null;
    id_verified?: boolean;
    live_verified?: boolean;
  };
  catchCount?: number;
  isRequested?: boolean;
  isOnline?: boolean;
  lastSeen?: string | null;
  onSendRequest: (userId: string) => void;
  onMessage?: (userId: string) => void;
  onHide?: (userId: string) => void;
}

export function BuddyCard({ 
  profile, 
  catchCount = 0, 
  isRequested = false,
  isOnline = false,
  lastSeen,
  onSendRequest,
  onMessage,
  onHide
}: BuddyCardProps) {
  const navigate = useNavigate();
  const [showHideDialog, setShowHideDialog] = useState(false);
  
  const experienceLabels: Record<string, string> = {
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
    expert: 'Expert'
  };

  const experienceColors: Record<string, string> = {
    beginner: 'bg-white dark:bg-background text-green-700 dark:text-green-400 border-green-500/30',
    intermediate: 'bg-white dark:bg-background text-blue-700 dark:text-blue-400 border-blue-500/30',
    advanced: 'bg-white dark:bg-background text-purple-700 dark:text-purple-400 border-purple-500/30',
    expert: 'bg-white dark:bg-background text-amber-700 dark:text-amber-400 border-amber-500/30'
  };

  const formatSpecies = (species: string) => {
    return species
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const handleCardClick = () => {
    navigate(`/app/profile/${profile.id}`);
  };

  const handleConfirmHide = () => {
    if (onHide) {
      onHide(profile.id);
    }
    setShowHideDialog(false);
  };

  return (
    <>
      <Card className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow" onClick={handleCardClick}>
        <div className="aspect-square relative">
          <img
            src={profile.photos?.[0] || '/placeholder.svg'}
            alt={profile.display_name || 'Angler'}
            className="w-full h-full object-cover"
          />
        {/* Status indicator */}
        {isOnline ? (
          <div className="absolute top-2 left-2">
            <span className="flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
          </div>
        ) : isRecentlyActive(lastSeen) ? (
          <div className="absolute top-2 left-2 bg-yellow-500/90 rounded px-1.5 py-0.5">
            <span className="text-xs text-yellow-950 font-medium">Active now</span>
          </div>
        ) : lastSeen ? (
          <div className="absolute top-2 left-2 bg-background/90 rounded px-1.5 py-0.5">
            <span className="text-xs text-muted-foreground">{lastSeen}</span>
          </div>
        ) : null}
        {profile.fishing_experience && (
          <Badge 
            variant="outline" 
            className={`absolute top-2 right-2 border ${experienceColors[profile.fishing_experience] || 'bg-background/90'}`}
          >
            <Award className="w-3 h-3 mr-1" />
            {experienceLabels[profile.fishing_experience] || profile.fishing_experience}
          </Badge>
        )}
      </div>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-lg flex items-center gap-1">
              {profile.display_name || 'Anonymous'}
              <VerificationBadge 
                idVerified={profile.id_verified} 
                liveVerified={profile.live_verified} 
                size="sm" 
              />
            </h3>
            {profile.location_name && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {profile.location_name}
              </p>
            )}
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Fish className="w-4 h-4" />
              <span className="text-sm font-medium">{catchCount}</span>
            </div>
            <span className="text-xs text-muted-foreground">catches</span>
          </div>
        </div>

        {profile.bio && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {profile.bio}
          </p>
        )}

        {/* Fishing Styles */}
        {profile.fishing_styles && profile.fishing_styles.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {profile.fishing_styles.slice(0, 2).map((style) => (
              <Badge key={style} variant="secondary" className="text-xs">
                {style}
              </Badge>
            ))}
            {profile.fishing_styles.length > 2 && (
              <Badge variant="secondary" className="text-xs">
                +{profile.fishing_styles.length - 2}
              </Badge>
            )}
          </div>
        )}

        {/* Preferred Species */}
        {profile.preferred_species && profile.preferred_species.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {profile.preferred_species.slice(0, 3).map((species) => (
              <Badge key={species} variant="outline" className="text-xs">
                {formatSpecies(species)}
              </Badge>
            ))}
            {profile.preferred_species.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{profile.preferred_species.length - 3}
              </Badge>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
          {isRequested ? (
            <Button variant="outline" className="flex-1" disabled>
              <Check className="w-4 h-4 mr-2" />
              Requested
            </Button>
          ) : (
            <Button 
              variant="default" 
              className="flex-1"
              onClick={() => onSendRequest(profile.id)}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Add Buddy
            </Button>
          )}
          {onMessage && (
            <Button 
              variant="outline" 
              size="icon"
              onClick={() => onMessage(profile.id)}
            >
              <MessageCircle className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>

    {/* Hide Confirmation Dialog */}
    <AlertDialog open={showHideDialog} onOpenChange={setShowHideDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hide this profile?</AlertDialogTitle>
          <AlertDialogDescription>
            {profile.display_name || 'This angler'} won't appear in your buddy discovery anymore. 
            You can unhide them later in Settings → Hidden Profiles.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirmHide}>
            Hide Profile
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </>
  );
}
