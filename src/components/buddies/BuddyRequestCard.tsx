import { Check, X, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { VerificationBadge } from '@/components/ui/verification-badge';

interface BuddyRequestCardProps {
  request: {
    id: string;
    created_at: string;
    profile: {
      id: string;
      display_name: string | null;
      photos: string[] | null;
      location_name: string | null;
      fishing_experience: string | null;
      id_verified?: boolean;
      live_verified?: boolean;
    };
  };
  type: 'received' | 'sent';
  onAccept?: (requestId: string) => void;
  onDecline?: (requestId: string) => void;
  onCancel?: (requestId: string) => void;
}

export function BuddyRequestCard({
  request,
  type,
  onAccept,
  onDecline,
  onCancel,
}: BuddyRequestCardProps) {
  const { profile } = request;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14">
            <AvatarImage src={profile.photos?.[0]} />
            <AvatarFallback>
              {profile.display_name?.charAt(0)?.toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold truncate flex items-center gap-1">
              {profile.display_name || 'Anonymous'}
              <VerificationBadge 
                idVerified={profile.id_verified} 
                liveVerified={profile.live_verified} 
                size="sm" 
              />
            </h4>
            {profile.location_name && (
              <p className="text-sm text-muted-foreground truncate">
                {profile.location_name}
              </p>
            )}
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <Clock className="w-3 h-3" />
              {formatDistanceToNow(new Date(request.created_at), { addSuffix: true })}
            </p>
          </div>
          <div className="flex gap-2">
            {type === 'received' ? (
              <>
                <Button
                  size="sm"
                  variant="default"
                  onClick={() => onAccept?.(request.id)}
                >
                  <Check className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onDecline?.(request.id)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onCancel?.(request.id)}
              >
                Cancel
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
