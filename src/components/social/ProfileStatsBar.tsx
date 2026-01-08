import { cn } from '@/lib/utils';

interface ProfileStatsBarProps {
  postsCount: number;
  followersCount: number;
  followingCount: number;
  likesCount: number;
  onFollowersClick?: () => void;
  onFollowingClick?: () => void;
  className?: string;
}

function formatCount(count: number): string {
  if (count >= 1000000) {
    return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (count >= 1000) {
    return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
  }
  return count.toString();
}

export function ProfileStatsBar({
  postsCount,
  followersCount,
  followingCount,
  likesCount,
  onFollowersClick,
  onFollowingClick,
  className,
}: ProfileStatsBarProps) {
  return (
    <div className={cn('flex justify-around py-4 border-y border-border', className)}>
      <div className="text-center">
        <div className="text-xl font-bold text-foreground">{formatCount(postsCount)}</div>
        <div className="text-xs text-muted-foreground">Posts</div>
      </div>
      
      <button 
        onClick={onFollowersClick}
        className="text-center hover:opacity-70 transition-opacity"
      >
        <div className="text-xl font-bold text-foreground">{formatCount(followersCount)}</div>
        <div className="text-xs text-muted-foreground">Followers</div>
      </button>
      
      <button 
        onClick={onFollowingClick}
        className="text-center hover:opacity-70 transition-opacity"
      >
        <div className="text-xl font-bold text-foreground">{formatCount(followingCount)}</div>
        <div className="text-xs text-muted-foreground">Following</div>
      </button>
      
      <div className="text-center">
        <div className="text-xl font-bold text-foreground">{formatCount(likesCount)}</div>
        <div className="text-xs text-muted-foreground">Likes</div>
      </div>
    </div>
  );
}
