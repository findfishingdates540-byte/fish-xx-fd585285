import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useFollowers, useFollowing } from '@/hooks/use-follow';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { VerificationBadge } from '@/components/ui/verification-badge';
import { FollowButton } from '@/components/social/FollowButton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, User } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function Followers() {
  const { userId } = useParams<{ userId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const initialTab = searchParams.get('tab') === 'following' ? 'following' : 'followers';
  
  // Fetch profile info for the header
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile-basic', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('display_name, photos')
        .eq('id', userId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
  
  const { data: followers, isLoading: loadingFollowers } = useFollowers(userId);
  const { data: following, isLoading: loadingFollowing } = useFollowing(userId);
  
  const handleProfileClick = (profileId: string) => {
    navigate(`/app/u/${profileId}`);
  };
  
  const renderUserList = (items: any[] | undefined, isLoading: boolean, type: 'followers' | 'following') => {
    if (isLoading) {
      return (
        <div className="space-y-3 p-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </div>
      );
    }
    
    if (!items?.length) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <User className="h-16 w-16 mb-4 opacity-50" />
          <p className="text-lg font-medium">
            {type === 'followers' ? 'No followers yet' : 'Not following anyone yet'}
          </p>
          <p className="text-sm mt-1">
            {type === 'followers' 
              ? 'When people follow this account, they\'ll appear here.' 
              : 'When this account follows people, they\'ll appear here.'}
          </p>
        </div>
      );
    }
    
    return (
      <div className="divide-y divide-border">
        {items.map((item) => {
          const profile = type === 'followers' ? (item as any).follower : (item as any).following;
          if (!profile) return null;
          
          return (
            <div key={item.id} className="flex items-center justify-between gap-3 p-4 hover:bg-muted/50 transition-colors">
              <button
                onClick={() => handleProfileClick(profile.id)}
                className="flex items-center gap-3 flex-1 min-w-0 text-left"
              >
                <Avatar className="h-12 w-12">
                  <AvatarImage src={profile.photos?.[0]} />
                  <AvatarFallback>
                    {profile.display_name?.charAt(0)?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
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
                  {profile.location_name && (
                    <p className="text-sm text-muted-foreground truncate">{profile.location_name}</p>
                  )}
                </div>
              </button>
              
              {user?.id !== profile.id && (
                <FollowButton userId={profile.id} size="sm" showIcon={false} />
              )}
            </div>
          );
        })}
      </div>
    );
  };
  
  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="flex items-center gap-3 p-4 border-b">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-6 w-32" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="flex items-center gap-3 p-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate(-1)}
            className="shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold truncate">{profile?.display_name || 'User'}</h1>
        </div>
        
        <Tabs defaultValue={initialTab} className="w-full">
          <TabsList className="w-full h-12 p-0 bg-transparent rounded-none border-b">
            <TabsTrigger 
              value="followers" 
              className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Followers {followers?.length ? `(${followers.length})` : ''}
            </TabsTrigger>
            <TabsTrigger 
              value="following"
              className="flex-1 h-full rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Following {following?.length ? `(${following.length})` : ''}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="followers" className="mt-0">
            {renderUserList(followers, loadingFollowers, 'followers')}
          </TabsContent>
          
          <TabsContent value="following" className="mt-0">
            {renderUserList(following, loadingFollowing, 'following')}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
