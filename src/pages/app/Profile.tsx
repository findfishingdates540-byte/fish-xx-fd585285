import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  MapPin, Share2, Pencil, Heart, Fish, Layers, 
  CheckCircle2, Instagram, Globe, Camera, Star
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const accountModes = [
  { id: 'dating', label: 'Dating', icon: Heart, color: 'text-pink-500' },
  { id: 'fishing', label: 'Fishing', icon: Fish, color: 'text-blue-500' },
  { id: 'both', label: 'Combo', icon: Layers, color: 'text-primary' },
] as const;

const experienceLevelMap: Record<string, number> = {
  beginner: 25,
  intermediate: 50,
  advanced: 75,
  expert: 100,
};

export default function Profile() {
  const { user } = useAuth();

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
    enabled: !!user?.id,
  });

  // Calculate age from date_of_birth
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

  const age = calculateAge(profile?.date_of_birth || null);
  const initials = profile?.display_name?.charAt(0)?.toUpperCase() || 'U';
  const avatarUrl = profile?.photos?.[0] || '';
  const coverPhoto = profile?.photos?.[1] || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1200';

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
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 pt-4">
        <div className="relative h-56 md:h-72 rounded-2xl overflow-hidden">
          <img
            src={coverPhoto}
            alt="Cover"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          
          {/* Profile Info inside banner */}
          <div className="absolute bottom-4 left-4 md:left-6 flex items-end gap-4">
            <div className="relative">
              <Avatar className="h-24 w-24 md:h-28 md:w-28 border-4 border-white shadow-lg">
                <AvatarImage src={avatarUrl} alt={profile?.display_name || 'Profile'} />
                <AvatarFallback className="text-2xl md:text-3xl bg-muted">{initials}</AvatarFallback>
              </Avatar>
              {profile?.is_verified && (
                <div className="absolute bottom-1 right-1 h-6 w-6 bg-primary rounded-full flex items-center justify-center border-2 border-white">
                  <CheckCircle2 className="h-3.5 w-3.5 text-primary-foreground" />
                </div>
              )}
            </div>
            <div className="mb-2">
              <h1 className="text-xl md:text-2xl font-bold text-white drop-shadow-md">
                {profile?.display_name || 'User'}{age ? `, ${age}` : ''}
              </h1>
              {profile?.location_name && (
                <div className="flex items-center gap-1 text-white/90 mt-0.5">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">{profile.location_name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="absolute bottom-4 right-4 md:right-6 flex gap-2">
            <Button variant="outline" size="sm" className="bg-white/90 backdrop-blur-sm border-white/50 text-foreground hover:bg-white">
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button asChild size="sm">
              <Link to="/app/profile/edit">
                <Pencil className="h-4 w-4 mr-2" />
                Edit Profile
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="max-w-6xl mx-auto px-4 pt-6">

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-3 space-y-6">
            {/* Current Mode */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Current Mode
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {accountModes.map((mode) => {
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
                {profile?.preferred_species && profile.preferred_species.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {profile.preferred_species.slice(0, 4).map((interest) => (
                      <Badge key={interest} variant="secondary" className="text-xs">
                        #{interest}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

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
            {/* Activity Stats */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-lg font-semibold">Activity Stats</CardTitle>
                <Button variant="link" size="sm" className="text-primary p-0 h-auto">
                  View All
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-muted/50 rounded-xl">
                    <Fish className="h-5 w-5 mx-auto mb-2 text-blue-500" />
                    <p className="text-2xl font-bold">0</p>
                    <p className="text-xs text-muted-foreground">Catches</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-xl">
                    <MapPin className="h-5 w-5 mx-auto mb-2 text-emerald-500" />
                    <p className="text-2xl font-bold">0</p>
                    <p className="text-xs text-muted-foreground">Spots</p>
                  </div>
                  <div className="text-center p-4 bg-muted/50 rounded-xl">
                    <Heart className="h-5 w-5 mx-auto mb-2 text-pink-500" />
                    <p className="text-2xl font-bold">0</p>
                    <p className="text-xs text-muted-foreground">Matches</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* My Photos */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <CardTitle className="text-lg font-semibold">My Photos</CardTitle>
                <Button variant="link" size="sm" className="text-primary p-0 h-auto">
                  <Camera className="h-4 w-4 mr-1" />
                  Add Photo
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
            {/* Dating Preferences */}
            <Card className="border-pink-200 dark:border-pink-900/30">
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
                    {profile?.looking_for?.join(', ') || 'Not specified'}
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
                    Within {profile?.max_distance_km || 50} km
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Interested In</p>
                  <p className="text-sm font-medium capitalize">
                    {profile?.interested_in?.join(', ')?.replace(/_/g, ' ') || 'Not specified'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Fishing Style - Only show for fishing/combo modes */}
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
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Favorite Species</p>
                    <div className="flex flex-wrap gap-2">
                      {profile?.preferred_species?.slice(0, 3).map((species) => (
                        <Badge key={species} variant="secondary">{species}</Badge>
                      )) || <span className="text-sm text-muted-foreground">Not specified</span>}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Skill Level</p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="capitalize">{profile?.fishing_experience || 'Beginner'}</span>
                      </div>
                      <Progress 
                        value={experienceLevelMap[profile?.fishing_experience || 'beginner']} 
                        className="h-2"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Go Premium CTA */}
            {!profile?.is_premium && (
              <Card className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold mb-2">Go Premium</h3>
                      <p className="text-sm opacity-90 mb-4">
                        See who likes you and get unlimited swipes.
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
      </div>
    </div>
  );
}
