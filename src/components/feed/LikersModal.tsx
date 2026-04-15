import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FollowButton } from '@/components/social/FollowButton';
import { VerificationBadge } from '@/components/ui/verification-badge';
import { User, Loader2 } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

interface LikersModalProps {
  postId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function LikersModal({ postId, isOpen, onClose }: LikersModalProps) {
  const navigate = useNavigate();

  const { data: likers, isLoading } = useQuery({
    queryKey: ['post-likers', postId],
    queryFn: async () => {
      const { data: likes, error: likesError } = await supabase
        .from('feed_likes')
        .select('user_id, created_at')
        .eq('post_id', postId)
        .order('created_at', { ascending: false });

      if (likesError) throw likesError;
      if (!likes || likes.length === 0) return [];

      const userIds = likes.map(l => l.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, display_name, photos, is_verified, id_verified, live_verified')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      const profileMap = new Map((profiles || []).map(p => [p.id, p]));
      return likes.map(l => ({
        user_id: l.user_id,
        profile: profileMap.get(l.user_id) || null,
      })).filter(l => l.profile);
    },
    enabled: isOpen,
  });

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl px-0">
        <SheetHeader className="px-4 pb-3 border-b">
          <SheetTitle className="text-center">Likes</SheetTitle>
        </SheetHeader>

        <div className="overflow-y-auto h-full pb-20">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : likers && likers.length > 0 ? (
            <div className="divide-y">
              {likers.map((liker) => {
                const profile = liker.profile as any;
                if (!profile) return null;
                return (
                  <div key={liker.user_id} className="flex items-center justify-between px-4 py-3">
                    <button
                      className="flex items-center gap-3 min-w-0 flex-1"
                      onClick={() => {
                        onClose();
                        navigate(`/app/u/${profile.id}`);
                      }}
                    >
                      <Avatar className="h-10 w-10 flex-shrink-0">
                        <AvatarImage src={profile.photos?.[0]} alt={profile.display_name} />
                        <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                      </Avatar>
                      <div className="text-left min-w-0">
                        <p className="font-semibold text-sm truncate flex items-center gap-1">
                          {profile.display_name || 'Anonymous'}
                          <VerificationBadge
                            idVerified={profile.id_verified}
                            liveVerified={profile.live_verified}
                            size="sm"
                          />
                        </p>
                      </div>
                    </button>
                    <FollowButton userId={profile.id} size="sm" showIcon={false} className="h-8 text-xs" />
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No likes yet</p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Hook to get a following user who liked a post (for "Liked by X and others")
export function useLikedByFollowing(postId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['liked-by-following', postId, user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // Get users the current user follows
      const { data: following } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', user.id);

      if (!following || following.length === 0) return null;

      const followingIds = following.map(f => f.following_id);

      // Find a followed user who liked this post
      const { data: likes } = await supabase
        .from('feed_likes')
        .select('user_id')
        .eq('post_id', postId)
        .in('user_id', followingIds)
        .limit(1)
        .maybeSingle();

      if (!likes) return null;

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, display_name, photos')
        .eq('id', likes.user_id)
        .single();

      return profile as { id: string; display_name: string; photos: string[] } | null;
    },
    enabled: !!user?.id,
  });
}
