import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveMode } from '@/contexts/ActiveModeContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  MapPin, Share2, Pencil, Heart, Fish, Layers, 
  Instagram, Globe, Camera, Star, Ruler, Wine, Cigarette, 
  GraduationCap, Briefcase, Brain, MessageCircle, Sparkles, Users,
  ArrowLeft, Settings, Grid3X3, AtSign, FileText, User, Bookmark, Repeat2,
  ShieldCheck
} from 'lucide-react';
import { VerificationBadge } from '@/components/ui/verification-badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProfilePromptDisplay, InterestDisplay, ProfileCompletionCard, type ProfilePrompt } from '@/components/profile';
import { InviteFriendsCard } from '@/components/feed';
import { ProfileStatsBar } from '@/components/social/ProfileStatsBar';
import { PostViewerOverlay } from '@/components/social/PostViewerOverlay';
import { ProfilePostsGrid } from '@/components/social/ProfilePostsGrid';
import { useUserPosts, useMentionedPosts, useUserPostsCount } from '@/hooks/use-user-posts';
import { useBookmarkedPosts } from '@/hooks/use-bookmarks';
import { useRepostedPosts } from '@/hooks/use-reposts';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';

const accountModes = [{
  id: 'dating',
  label: 'Dating',
  icon: Heart,
  color: 'text-pink-500'
}, {
  id: 'fishing',
  label: 'Fishing',
  icon: Fish,
  color: 'text-blue-500'
}, {
  id: 'both',
  label: 'Combo',
  icon: Layers,
  color: 'text-primary'
}] as const;

const experienceLevelMap: Record<string, number> = {
  beginner: 25,
  intermediate: 50,
  advanced: 75,
  expert: 100
};

export default function Profile() {
  const { user } = useAuth();
  const { effectiveMode } = useActiveMode();
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Profile view: 'fishing' or 'dating'
  const [profileView, setProfileView] = useState<'fishing' | 'dating'>(
    (location.state as any)?.showDating ? 'dating' : 'fishing'
  );
  const [showDatingSheet, setShowDatingSheet] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  
  // Determine if social features should be shown (not in dating view)
  const showSocialFeatures = profileView !== 'dating';
  
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile-full', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id
  });

  // Fetch posts data for social view
  const { data: posts = [], isLoading: postsLoading } = useUserPosts(user?.id);
  const { data: postsCount = 0 } = useUserPostsCount(user?.id);
  const { data: mentionedPosts = [], isLoading: mentionsLoading } = useMentionedPosts(user?.id);
  const { data: bookmarkedPosts = [], isLoading: bookmarksLoading } = useBookmarkedPosts(user?.id);
  const { data: repostedPosts = [], isLoading: repostsLoading } = useRepostedPosts(user?.id);

  // Fetch dating stats
  const { data: datingStats } = useQuery({
    queryKey: ['dating-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return { matches: 0, likesReceived: 0, conversations: 0 };
      
      // Get total matches
      const { count: matchCount } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .eq('is_match', true);
      
      // Get likes received (where other user liked you)
      const { count: likesCount } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .or(`and(user1_id.eq.${user.id},user2_liked.eq.true),and(user2_id.eq.${user.id},user1_liked.eq.true)`);
      
      // Get conversations (matches with at least one message)
      const { data: matchesWithMessages } = await supabase
        .from('matches')
        .select('id, messages(id)')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .eq('is_match', true);
      
      const conversationsCount = matchesWithMessages?.filter(m => (m.messages as any[])?.length > 0).length || 0;

      return {
        matches: matchCount || 0,
        likesReceived: likesCount || 0,
        conversations: conversationsCount
      };
    },
    enabled: !!user?.id
  });

  const calculateAge = (dob: string | null) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const formatHeight = (cm: number | null) => {
    if (!cm) return null;
    const feet = Math.floor(cm / 30.48);
    const inches = Math.round((cm % 30.48) / 2.54);
    return `${feet}'${inches}"`;
  };

  const age = calculateAge(profile?.date_of_birth || null);
  const initials = profile?.display_name?.charAt(0)?.toUpperCase() || 'U';
  const avatarUrl = profile?.photos?.[0] || '';
  const coverPhoto = profile?.photos?.[1] || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200';
  
  // Type assertions for new fields
  const heightCm = (profile as any)?.height_cm as number | null;
  const gender = (profile as any)?.gender as string | null;
  const drinking = (profile as any)?.drinking as string | null;
  const smoking = (profile as any)?.smoking as string | null;
  const education = (profile as any)?.education as string | null;
  const occupation = (profile as any)?.occupation as string | null;
  const zodiacSign = (profile as any)?.zodiac_sign as string | null;
  const personalityType = (profile as any)?.personality_type as string | null;
  const interests = (profile as any)?.interests as string[] | null;
  const promptResponses = (profile as any)?.prompt_responses as ProfilePrompt[] | null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30">
        <Skeleton className="h-64 w-full" />
        <div className="max-w-6xl mx-auto px-4 -mt-16">
          <Skeleton className="h-32 w-32 rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 pb-8">
      {/* Back Button */}
      <div className="max-w-6xl mx-auto px-4 pt-4 pb-2">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => {
            const mode = profile?.account_mode;
            if (mode === 'fishing') {
              navigate('/app/spots');
            } else {
              navigate('/app/discover');
            }
          }}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>

      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4">
        <div className="relative h-56 md:h-72 overflow-hidden rounded-3xl">
          <img src={coverPhoto} alt="Cover" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          
          <div className="absolute inset-x-0 bottom-4 flex flex-col items-center md:flex-row md:items-end md:justify-between px-4 md:px-6 gap-3">
            <div className="flex flex-col items-center md:flex-row md:items-end gap-3 md:gap-4">
              <div className="relative">
                <Avatar className="h-24 w-24 md:h-28 md:w-28 border-4 border-white shadow-lg">
                  <AvatarImage src={avatarUrl} alt={profile?.display_name || 'Profile'} />
                  <AvatarFallback className="text-2xl md:text-3xl bg-muted">{initials}</AvatarFallback>
                </Avatar>
              </div>
              <div className="text-center md:text-left md:mb-2">
                <h1 className="text-xl md:text-2xl font-bold text-white drop-shadow-md flex items-center gap-2 justify-center md:justify-start">
                  {profile?.display_name || 'User'}{age ? `, ${age}` : ''}
                  <VerificationBadge 
                    idVerified={profile?.id_verified} 
                    liveVerified={profile?.live_verified} 
                    size="md" 
                  />
                </h1>
                {profile?.location_name && (
                  <div className="flex items-center justify-center md:justify-start gap-1 text-white/90 mt-0.5">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">{profile.location_name}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="bg-background/90 backdrop-blur-sm border-border"
                asChild
              >
                <Link to="/app/settings">
                  <Settings className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Settings</span>
                </Link>
              </Button>
              <Button variant="outline" size="sm" className="bg-background/90 backdrop-blur-sm border-border">
                <Share2 className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Share</span>
              </Button>
              <Button asChild size="sm">
                <Link to="/app/profile/edit">
                  <Pencil className="h-4 w-4 md:mr-2" />
                  <span className="hidden md:inline">Edit Profile</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Profile View Switcher: Fishing / Dating */}
      <div className="max-w-6xl mx-auto px-4 pt-5">
        <div className="flex justify-center">
          <div className="inline-flex bg-muted rounded-full p-1 gap-1">
            <button
              onClick={() => setProfileView('fishing')}
              className={cn(
                'flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all',
                profileView === 'fishing'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Fish className="h-4 w-4" />
              Fishing Profile
            </button>
            <button
              onClick={() => {
                const hasDating = profile?.account_mode === 'dating' || profile?.account_mode === 'both';
                if (hasDating) {
                  setProfileView('dating');
                } else {
                  setShowDatingSheet(true);
                }
              }}
              className={cn(
                'flex items-center gap-2 px-5 py-2 rounded-full text-sm font-medium transition-all',
                profileView === 'dating'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Heart className="h-4 w-4" />
              Dating Profile
            </button>
          </div>
        </div>
      </div>

      {/* View Type Tabs */}
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <Tabs defaultValue={showSocialFeatures ? "social" : "detailed"} className="w-full">
          {showSocialFeatures && (
            <div className="border-b border-border mb-6">
              <TabsList className="w-full max-w-md mx-auto grid grid-cols-2 bg-transparent h-12">
                <TabsTrigger value="social" className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                  <Grid3X3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Social</span>
                </TabsTrigger>
                <TabsTrigger value="detailed" className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                  <FileText className="h-4 w-4" />
                  <span className="hidden sm:inline">Detailed</span>
                </TabsTrigger>
              </TabsList>
            </div>
          )}
          
          {/* Social View - Only render when social features are available */}
          {showSocialFeatures && (
            <TabsContent value="social" className="mt-0">
              <div className="max-w-2xl mx-auto">
                {/* Stats Bar */}
                <ProfileStatsBar
                  postsCount={postsCount}
                  followersCount={profile?.followers_count || 0}
                  followingCount={profile?.following_count || 0}
                  likesCount={profile?.total_likes_received || 0}
                  onFollowersClick={() => navigate(`/app/u/${user?.id}/followers?tab=followers`)}
                  onFollowingClick={() => navigate(`/app/u/${user?.id}/followers?tab=following`)}
                />
                
                {/* Posts/Mentions/Reposts/Bookmarks Tabs */}
                <Tabs defaultValue="posts" className="w-full">
                  <TabsList className="w-full grid grid-cols-4 rounded-none border-b bg-transparent h-12">
                    <TabsTrigger 
                      value="posts" 
                      className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                    >
                      <Grid3X3 className="h-4 w-4" />
                      <span className="sr-only sm:not-sr-only">Posts</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="mentioned" 
                      className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                    >
                      <AtSign className="h-4 w-4" />
                      <span className="sr-only sm:not-sr-only">Mentioned</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="reposts" 
                      className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                    >
                      <Repeat2 className="h-4 w-4" />
                      <span className="sr-only sm:not-sr-only">Reposts</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="bookmarks" 
                      className="gap-2 data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                    >
                      <Bookmark className="h-4 w-4" />
                      <span className="sr-only sm:not-sr-only">Saved</span>
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="posts" className="mt-0">
                    <ProfilePostsGrid 
                      posts={posts} 
                      isLoading={postsLoading} 
                      emptyMessage="No posts yet. Share your first catch!"
                      userId={user?.id}
                      onPostClick={(postId) => setSelectedPostId(postId)}
                    />
                  </TabsContent>
                  <TabsContent value="mentioned" className="mt-0">
                    <ProfilePostsGrid 
                      posts={mentionedPosts} 
                      isLoading={mentionsLoading} 
                      emptyMessage="No mentions yet"
                      onPostClick={(postId) => setSelectedPostId(postId)}
                    />
                  </TabsContent>
                  <TabsContent value="reposts" className="mt-0">
                    <ProfilePostsGrid 
                      posts={repostedPosts} 
                      isLoading={repostsLoading} 
                      emptyMessage="No reposts yet"
                      onPostClick={(postId) => setSelectedPostId(postId)}
                    />
                  </TabsContent>
                  <TabsContent value="bookmarks" className="mt-0">
                    <ProfilePostsGrid 
                      posts={bookmarkedPosts} 
                      isLoading={bookmarksLoading} 
                      emptyMessage="No saved posts yet"
                      onPostClick={(postId) => setSelectedPostId(postId)}
                    />
                  </TabsContent>
                </Tabs>
              </div>
            </TabsContent>
          )}
          
          {/* Detailed View */}
          <TabsContent value="detailed" className={showSocialFeatures ? "mt-0" : "mt-6"}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column */}
              <div className="lg:col-span-3 space-y-6">
                {/* Profile Completion */}
                <ProfileCompletionCard 
                  profile={{
                    display_name: profile?.display_name,
                    bio: profile?.bio,
                    photos: profile?.photos,
                    location_name: profile?.location_name,
                    date_of_birth: profile?.date_of_birth,
                    height_cm: heightCm,
                    education: education,
                    occupation: occupation,
                    drinking: drinking,
                    smoking: smoking,
                    interests: interests,
                    prompt_responses: promptResponses,
                  }} 
                />

                {/* Invite Friends */}
                <InviteFriendsCard />

                {/* About Me */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                      About Me
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">
                      {profile?.bio || 'No bio added yet. Tell others about yourself!'}
                    </p>
                    {/* Preferred species hidden for now */}
                  </CardContent>
                </Card>

                {/* The Basics */}
                {(gender || heightCm || education || occupation) && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                        The Basics
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {gender && (
                        <div className="flex items-center gap-3">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{gender === 'male' ? 'Man' : gender === 'female' ? 'Woman' : gender}</span>
                        </div>
                      )}
                      {heightCm && (
                        <div className="flex items-center gap-3">
                          <Ruler className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{formatHeight(heightCm)}</span>
                        </div>
                      )}
                      {education && (
                        <div className="flex items-center gap-3">
                          <GraduationCap className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{education}</span>
                        </div>
                      )}
                      {occupation && (
                        <div className="flex items-center gap-3">
                          <Briefcase className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{occupation}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Lifestyle */}
                {(drinking || smoking || zodiacSign || personalityType) && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                        Lifestyle
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {drinking && (
                        <div className="flex items-center gap-3">
                          <Wine className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm capitalize">{drinking === 'never' ? 'Non-drinker' : `Drinks ${drinking}`}</span>
                        </div>
                      )}
                      {smoking && (
                        <div className="flex items-center gap-3">
                          <Cigarette className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm capitalize">{smoking === 'never' ? 'Non-smoker' : `Smokes ${smoking}`}</span>
                        </div>
                      )}
                      {zodiacSign && (
                        <div className="flex items-center gap-3">
                          <Star className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{zodiacSign}</span>
                        </div>
                      )}
                      {personalityType && (
                        <div className="flex items-center gap-3">
                          <Brain className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm capitalize">{personalityType}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Connected Accounts */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                      Connected Accounts
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Instagram className="h-5 w-5 text-pink-500" />
                        <span className="text-sm">Instagram</span>
                      </div>
                      <span className="text-xs text-muted-foreground">Not Connected</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Globe className="h-5 w-5 text-blue-500" />
                        <span className="text-sm">FishBrain</span>
                      </div>
                      <span className="text-xs text-muted-foreground">Not Connected</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Center Column */}
              <div className="lg:col-span-5 space-y-6">
                {/* Dating action buttons - only in dating view */}
                {profileView === 'dating' && (profile?.account_mode === 'dating' || profile?.account_mode === 'both') && (
                  <div className="flex gap-3">
                    <Button className="flex-1" asChild>
                      <Link to="/app/discover">
                        <Heart className="h-4 w-4 mr-2" />
                        View Dating App
                      </Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link to="/app/profile/edit">
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit Dating Profile
                      </Link>
                    </Button>
                  </div>
                )}

                {/* Dating Stats - Only show in dating view */}
                {profileView === 'dating' && (profile?.account_mode === 'dating' || profile?.account_mode === 'both') && (
                  <Card className="border-pink-200 dark:border-pink-900/30">
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                      <div className="flex items-center gap-2">
                        <Heart className="h-5 w-5 text-pink-500" />
                        <CardTitle className="text-lg font-semibold">Dating Stats</CardTitle>
                      </div>
                      <Button variant="link" size="sm" className="text-primary p-0 h-auto" asChild>
                        <Link to="/app/matches">View All</Link>
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-pink-50 dark:bg-pink-950/20 rounded-xl">
                          <Heart className="h-5 w-5 mx-auto mb-2 text-pink-500" />
                          <p className="text-2xl font-bold">{datingStats?.matches || 0}</p>
                          <p className="text-xs text-muted-foreground">Matches</p>
                        </div>
                        <div className="text-center p-4 bg-pink-50 dark:bg-pink-950/20 rounded-xl">
                          <Sparkles className="h-5 w-5 mx-auto mb-2 text-amber-500" />
                          <p className="text-2xl font-bold">{datingStats?.likesReceived || 0}</p>
                          <p className="text-xs text-muted-foreground">Likes Received</p>
                        </div>
                        <div className="text-center p-4 bg-pink-50 dark:bg-pink-950/20 rounded-xl">
                          <MessageCircle className="h-5 w-5 mx-auto mb-2 text-blue-500" />
                          <p className="text-2xl font-bold">{datingStats?.conversations || 0}</p>
                          <p className="text-xs text-muted-foreground">Conversations</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Activity Stats - Only show in fishing view */}
                {profileView === 'fishing' && (profile?.account_mode === 'fishing' || profile?.account_mode === 'both') && (
                  <Card className="border-blue-200 dark:border-blue-900/30">
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                      <div className="flex items-center gap-2">
                        <Fish className="h-5 w-5 text-blue-500" />
                        <CardTitle className="text-lg font-semibold">Fishing Stats</CardTitle>
                      </div>
                      <Button variant="link" size="sm" className="text-primary p-0 h-auto">
                        View All
                      </Button>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-xl">
                          <Fish className="h-5 w-5 mx-auto mb-2 text-blue-500" />
                          <p className="text-2xl font-bold">0</p>
                          <p className="text-xs text-muted-foreground">Catches</p>
                        </div>
                        <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-xl">
                          <MapPin className="h-5 w-5 mx-auto mb-2 text-emerald-500" />
                          <p className="text-2xl font-bold">0</p>
                          <p className="text-xs text-muted-foreground">Spots</p>
                        </div>
                        <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-xl">
                          <Users className="h-5 w-5 mx-auto mb-2 text-purple-500" />
                          <p className="text-2xl font-bold">0</p>
                          <p className="text-xs text-muted-foreground">Buddies</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Interests & Hobbies */}
                {interests && interests.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg font-semibold">Interests & Hobbies</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <InterestDisplay interests={interests} />
                    </CardContent>
                  </Card>
                )}

                {/* Profile Prompts */}
                {promptResponses && promptResponses.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg font-semibold flex items-center gap-2">
                        <MessageCircle className="h-5 w-5 text-primary" />
                        About Me
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ProfilePromptDisplay prompts={promptResponses} />
                    </CardContent>
                  </Card>
                )}

                {/* My Photos */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <CardTitle className="text-lg font-semibold">My Photos</CardTitle>
                    <Button variant="link" size="sm" className="text-primary p-0 h-auto" asChild>
                      <Link to="/app/profile/edit">
                        <Camera className="h-4 w-4 mr-1" />
                        Add Photo
                      </Link>
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-2">
                      {profile?.photos && profile.photos.length > 0 ? (
                        profile.photos.slice(0, 6).map((photo, index) => (
                          <div key={index} className="aspect-square rounded-lg overflow-hidden bg-muted">
                            <img src={photo} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                          </div>
                        ))
                      ) : (
                        <>
                          <div className="aspect-square rounded-lg bg-muted flex items-center justify-center">
                            <Camera className="h-6 w-6 text-muted-foreground/50" />
                          </div>
                          <div className="aspect-square rounded-lg bg-muted flex items-center justify-center">
                            <Camera className="h-6 w-6 text-muted-foreground/50" />
                          </div>
                          <div className="aspect-square rounded-lg bg-muted flex items-center justify-center">
                            <Camera className="h-6 w-6 text-muted-foreground/50" />
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Latest Activity */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg font-semibold">Latest Activity</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-start gap-4">
                      <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        <Star className="h-5 w-5 text-amber-500" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">No recent activity</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Start swiping to find your perfect fishing buddy or date!
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Right Column */}
              <div className="lg:col-span-4 space-y-6">
                {/* Dating Preferences - only in dating view */}
                {profileView === 'dating' && (
                  <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <div className="flex items-center gap-2">
                      <Heart className="h-5 w-5 text-pink-500" />
                      <CardTitle className="text-lg font-semibold text-pink-600 dark:text-pink-400">
                        Dating Preferences
                      </CardTitle>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link to="/app/profile/edit">Edit</Link>
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Looking For</p>
                      <p className="text-sm font-medium">
                        {profile?.looking_for?.map(l => {
                          const labels: Record<string, string> = {
                            relationship: 'Relationship',
                            casual: 'Something Casual',
                            friends: 'Friends',
                            fishing_buddy: 'Fishing Buddy',
                          };
                          return labels[l] || l;
                        }).join(', ') || 'Not specified'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Age Range</p>
                      <p className="text-sm font-medium">
                        {profile?.min_age_preference || 18} - {profile?.max_age_preference || 99}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Distance</p>
                      <p className="text-sm font-medium">
                        {(profile?.max_distance_miles || 50) >= 500 ? 'Unlimited' : `Within ${profile?.max_distance_miles || 50} miles`}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Interested In</p>
                      <p className="text-sm font-medium">
                        {profile?.interested_in?.map(g => g === 'male' ? 'Men' : g === 'female' ? 'Women' : g).join(', ') || 'Not specified'}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Current Mode */}
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-3">
                    <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                      Current Mode
                    </CardTitle>
                    <Button variant="ghost" size="sm" asChild>
                      <Link to="/app/profile/edit">Edit</Link>
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {accountModes.map(mode => {
                      const Icon = mode.icon;
                      const isActive = profile?.account_mode === mode.id;
                      return (
                        <div 
                          key={mode.id} 
                          className={cn(
                            'flex items-center justify-between p-3 rounded-lg border transition-colors', 
                            isActive ? 'bg-primary/5 border-primary' : 'border-transparent'
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn('p-2 rounded-lg bg-muted', isActive && 'bg-primary/10')}>
                              <Icon className={cn('h-4 w-4', mode.color)} />
                            </div>
                            <span className="font-medium">{mode.label}</span>
                          </div>
                          <div className={cn(
                            'h-4 w-4 rounded-full border-2', 
                            isActive ? 'bg-primary border-primary' : 'border-muted-foreground/30'
                          )} />
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                {/* Fishing Style */}
                {(profile?.account_mode === 'fishing' || profile?.account_mode === 'both') && (
                  <Card className="border-blue-200 dark:border-blue-900/30">
                    <CardHeader className="flex flex-row items-center justify-between pb-3">
                      <div className="flex items-center gap-2">
                        <Fish className="h-5 w-5 text-blue-500" />
                        <CardTitle className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                          Fishing Style
                        </CardTitle>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to="/app/profile/edit">Edit</Link>
                      </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Favorite species hidden for now */}
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Skill Level</p>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="capitalize">{profile?.fishing_experience || 'Beginner'}</span>
                          </div>
                          <Progress value={experienceLevelMap[profile?.fishing_experience || 'beginner']} className="h-2" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Go Premium CTA - Only show for fishing/both accounts */}
                {!profile?.is_premium && profile?.account_mode !== 'dating' && (
                  <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-bold mb-2">Go Premium</h3>
                          <p className="text-sm opacity-90 mb-4">
                            Access premium fishing spots and advanced features.
                          </p>
                          <Button variant="secondary" size="sm">
                            Upgrade Now
                          </Button>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                          <Star className="h-5 w-5" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Post Viewer Overlay */}
      {selectedPostId && user?.id && (
        <PostViewerOverlay
          postId={selectedPostId}
          userId={user.id}
          onClose={() => setSelectedPostId(null)}
        />
      )}
    </div>
  );
}
