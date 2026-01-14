import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VerificationBadge } from '@/components/ui/verification-badge';
import { ExperienceBadge } from '@/components/ui/experience-badge';
import { FollowButton, ProfileStatsBar, ProfilePostsGrid, PostViewerOverlay } from '@/components/social';
import { useUserPosts, useMentionedPosts, useUserPostsCount } from '@/hooks/use-user-posts';
import { ArrowLeft, MapPin, Grid3X3, AtSign, Share2, Settings, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

export default function SocialProfile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  
  const isOwnProfile = user?.id === userId;
  
  // Fetch profile data
  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['social-profile', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          display_name,
          bio,
          photos,
          cover_photo,
          city,
          state,
          location_name,
          fishing_experience,
          fishing_styles,
          id_verified,
          live_verified,
          is_premium,
          followers_count,
          following_count,
          total_likes_received,
          created_at
        `)
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });
  
  // Fetch user's posts
  const { data: posts = [], isLoading: postsLoading } = useUserPosts(userId);
  const { data: postsCount = 0 } = useUserPostsCount(userId);
  
  // Fetch mentioned posts
  const { data: mentionedPosts = [], isLoading: mentionsLoading } = useMentionedPosts(userId);
  
  const handleShare = async () => {
    const url = `${window.location.origin}/app/u/${userId}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Profile link copied!');
    } catch {
      toast.error('Failed to copy link');
    }
  };
  
  const handleMessage = () => {
    // Navigate to messages - would need to find/create conversation
    toast.info('Messaging coming soon');
  };
  
  if (profileLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-6">
            <Skeleton className="h-24 w-24 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <Skeleton className="h-16 w-full" />
        </div>
      </div>
    );
  }
  
  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Profile not found</h2>
          <Button variant="outline" onClick={() => navigate(-1)}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }
  
  const location = profile.location_name || [profile.city, profile.state].filter(Boolean).join(', ');
  
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
          <div className="flex items-center gap-4 px-4 py-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="font-semibold flex-1 truncate">{profile.display_name || 'User'}</h1>
            {isOwnProfile && (
              <Button variant="ghost" size="icon" onClick={() => navigate('/app/settings')}>
                <Settings className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Profile Info */}
        <div className="px-4 py-6">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <Avatar className="h-24 w-24 border-2 border-border">
              <AvatarImage src={profile.photos?.[0]} />
              <AvatarFallback className="text-2xl">
                {profile.display_name?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            
            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold truncate">{profile.display_name || 'User'}</h2>
                {(profile.id_verified || profile.live_verified) && (
                  <VerificationBadge 
                    idVerified={profile.id_verified || false}
                    liveVerified={profile.live_verified || false}
                  />
                )}
              </div>
              
              {location && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{location}</span>
                </div>
              )}
              
              {profile.fishing_experience && (
                <ExperienceBadge level={profile.fishing_experience} className="mb-3" />
              )}
              
              {/* Action Buttons */}
              <div className="flex items-center gap-2 mt-3">
                {isOwnProfile ? (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => navigate('/app/profile/edit')}
                    >
                      Edit Profile
                    </Button>
                    <Button variant="outline" size="icon" onClick={handleShare}>
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <FollowButton userId={userId!} size="sm" className="flex-1" />
                    <Button variant="outline" size="icon" onClick={handleMessage}>
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" onClick={handleShare}>
                      <Share2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
          
          {/* Bio */}
          {profile.bio && (
            <p className="text-sm mt-4 whitespace-pre-wrap">{profile.bio}</p>
          )}
          
          {/* Fishing styles */}
          {profile.fishing_styles && profile.fishing_styles.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {profile.fishing_styles.map((style) => (
                <span 
                  key={style}
                  className="text-xs px-2 py-1 bg-muted rounded-full text-muted-foreground"
                >
                  {style}
                </span>
              ))}
            </div>
          )}
        </div>
        
        {/* Stats Bar */}
        <ProfileStatsBar
          postsCount={postsCount}
          followersCount={profile.followers_count || 0}
          followingCount={profile.following_count || 0}
          likesCount={profile.total_likes_received || 0}
          onFollowersClick={() => navigate(`/app/u/${userId}/followers?tab=followers`)}
          onFollowingClick={() => navigate(`/app/u/${userId}/followers?tab=following`)}
        />
        
        {/* Content Tabs */}
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="w-full grid grid-cols-2 rounded-none h-12 bg-transparent border-b border-border">
            <TabsTrigger 
              value="posts" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none"
            >
              <Grid3X3 className="h-5 w-5" />
            </TabsTrigger>
            <TabsTrigger 
              value="mentioned" 
              className="data-[state=active]:border-b-2 data-[state=active]:border-foreground rounded-none"
            >
              <AtSign className="h-5 w-5" />
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="posts" className="mt-0">
            <ProfilePostsGrid 
              posts={posts}
              isLoading={postsLoading}
              emptyMessage="No posts yet"
              userId={userId}
              onPostClick={(postId) => setSelectedPostId(postId)}
            />
          </TabsContent>
          
          <TabsContent value="mentioned" className="mt-0">
            <ProfilePostsGrid 
              posts={mentionedPosts as any[]}
              isLoading={mentionsLoading}
              emptyMessage="No mentions yet"
              onPostClick={(postId) => setSelectedPostId(postId)}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Post Viewer Overlay */}
      {selectedPostId && userId && (
        <PostViewerOverlay
          postId={selectedPostId}
          userId={userId}
          onClose={() => setSelectedPostId(null)}
        />
      )}
    </div>
  );
}
