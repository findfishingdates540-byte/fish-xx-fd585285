import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { VerificationBadge } from '@/components/ui/verification-badge';
import { FollowButton } from './FollowButton';
import { useFollowers, useFollowing } from '@/hooks/use-follow';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Loader2, User } from 'lucide-react';

interface FollowersListModalProps {
  userId: string;
  type: 'followers' | 'following';
  isOpen: boolean;
  onClose: () => void;
}

export function FollowersListModal({ userId, type, isOpen, onClose }: FollowersListModalProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const { data: followers, isLoading: loadingFollowers } = useFollowers(type === 'followers' ? userId : undefined);
  const { data: following, isLoading: loadingFollowing } = useFollowing(type === 'following' ? userId : undefined);
  
  const isLoading = type === 'followers' ? loadingFollowers : loadingFollowing;
  const items = type === 'followers' ? followers : following;
  
  const handleProfileClick = (profileId: string) => {
    onClose();
    navigate(`/app/u/${profileId}`);
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{type === 'followers' ? 'Followers' : 'Following'}</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh]">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : !items?.length ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <User className="h-12 w-12 mb-2" />
              <p>{type === 'followers' ? 'No followers yet' : 'Not following anyone yet'}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => {
                const profile = type === 'followers' ? (item as any).follower : (item as any).following;
                if (!profile) return null;
                
                return (
                  <div key={item.id} className="flex items-center justify-between gap-3 py-2">
                    <button
                      onClick={() => handleProfileClick(profile.id)}
                      className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-70 transition-opacity"
                    >
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={profile.photos?.[0]} />
                        <AvatarFallback>
                          {profile.display_name?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="flex items-center gap-1">
                          <span className="font-medium truncate">{profile.display_name || 'User'}</span>
                          {(profile.id_verified || profile.live_verified) && (
                            <VerificationBadge 
                              idVerified={profile.id_verified}
                              liveVerified={profile.live_verified}
                              size="sm"
                            />
                          )}
                        </div>
                      </div>
                    </button>
                    
                    {user?.id !== profile.id && (
                      <FollowButton userId={profile.id} size="sm" showIcon={false} />
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
