import { Button } from '@/components/ui/button';
import { UserPlus, UserMinus, Loader2 } from 'lucide-react';
import { useFollowStatus, useFollowUser, useUnfollowUser } from '@/hooks/use-follow';
import { useAuth } from '@/contexts/AuthContext';

interface FollowButtonProps {
  userId: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showIcon?: boolean;
  className?: string;
}

export function FollowButton({ 
  userId, 
  variant = 'default', 
  size = 'default',
  showIcon = true,
  className 
}: FollowButtonProps) {
  const { user } = useAuth();
  const { data: followStatus, isLoading: statusLoading } = useFollowStatus(userId);
  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();
  
  // Don't show for own profile
  if (!user || user.id === userId) return null;
  
  const isFollowing = followStatus?.isFollowing;
  const isLoading = statusLoading || followMutation.isPending || unfollowMutation.isPending;
  
  const handleClick = () => {
    if (isFollowing) {
      unfollowMutation.mutate(userId);
    } else {
      followMutation.mutate(userId);
    }
  };
  
  return (
    <Button
      variant={isFollowing ? 'outline' : variant}
      size={size}
      onClick={handleClick}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          {showIcon && (isFollowing ? <UserMinus className="h-4 w-4 mr-2" /> : <UserPlus className="h-4 w-4 mr-2" />)}
          {isFollowing ? 'Following' : 'Follow'}
        </>
      )}
    </Button>
  );
}
