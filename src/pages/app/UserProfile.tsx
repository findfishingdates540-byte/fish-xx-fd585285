import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  ArrowLeft, MapPin, Fish, Award, UserPlus, MessageCircle, Check, 
  Calendar, Share2, Heart, Anchor, Target, Clock, Star
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { VerificationBadge } from '@/components/ui/verification-badge';

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['user-profile', userId],
    queryFn: async () => {
      // Use public_profiles view for privacy when viewing other users
      const { data, error } = await supabase
        .from('public_profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const { data: catches = [] } = useQuery({
    queryKey: ['user-catches', userId],
    queryFn: async () => {
      const { data } = await supabase
        .from('catches')
        .select('*')
        .eq('user_id', userId)
        .order('caught_at', { ascending: false })
        .limit(6);
      return data || [];
    },
    enabled: !!userId,
  });

  const { data: buddyStatus, refetch: refetchBuddyStatus } = useQuery({
    queryKey: ['buddy-status', userId, user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data } = await supabase
        .from('fishing_buddies')
        .select('*')
        .or(`and(requester_id.eq.${user.id},recipient_id.eq.${userId}),and(requester_id.eq.${userId},recipient_id.eq.${user.id})`)
        .maybeSingle();
      
      return data;
    },
    enabled: !!userId && !!user,
  });

  const experienceLabels: Record<string, string> = {
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
    expert: 'Expert'
  };

  const handleSendRequest = async () => {
    if (!user || !userId) return;
    
    try {
      const { error } = await supabase
        .from('fishing_buddies')
        .insert({
          requester_id: user.id,
          recipient_id: userId,
          status: 'pending'
        });
      
      if (error) throw error;
      toast.success('Buddy request sent!');
      refetchBuddyStatus();
    } catch (error) {
      toast.error('Failed to send request');
    }
  };

  const handleMessage = () => {
    if (buddyStatus?.status === 'accepted') {
      navigate(`/app/buddy-chat/${buddyStatus.id}`);
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Profile link copied!');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-4 text-center">
        <p className="text-muted-foreground">Profile not found</p>
        <Button variant="outline" onClick={() => navigate(-1)} className="mt-4">
          Go Back
        </Button>
      </div>
    );
  }

  const photos = profile.photos || [];
  const isBuddy = buddyStatus?.status === 'accepted';
  const isPending = buddyStatus?.status === 'pending';

  return (
    <div className="pb-20 bg-background min-h-screen">
      {/* Breadcrumb Header */}
      <div className="border-b bg-background/95 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <button onClick={() => navigate('/app/buddies')} className="hover:text-foreground">
              Buddies
            </button>
            <span>/</span>
            <span className="text-foreground">{profile.display_name || 'Profile'}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Title Section */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              {profile.display_name || 'Anonymous Angler'}
              <VerificationBadge 
                idVerified={profile.id_verified} 
                liveVerified={profile.live_verified} 
                size="lg" 
              />
            </h1>
            <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground flex-wrap">
              <div className="flex items-center gap-1">
                <Fish className="w-4 h-4 text-primary" />
                <span className="font-medium text-foreground">{catches.length}</span>
                <span>catches</span>
              </div>
              {profile.location_name && (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <MapPin className="w-4 h-4" />
                    <span>{profile.location_name}</span>
                  </div>
                </>
              )}
              {profile.fishing_experience && (
                <>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Award className="w-4 h-4" />
                    <span>{experienceLabels[profile.fishing_experience]}</span>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            {isBuddy ? (
              <Button variant="default" size="sm" className="bg-primary">
                <Heart className="w-4 h-4 mr-2 fill-current" />
                Buddies
              </Button>
            ) : isPending ? (
              <Button variant="outline" size="sm" disabled>
                <Check className="w-4 h-4 mr-2" />
                Requested
              </Button>
            ) : (
              <Button variant="default" size="sm" className="bg-primary" onClick={handleSendRequest}>
                <UserPlus className="w-4 h-4 mr-2" />
                Add Buddy
              </Button>
            )}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cover Photo */}
            {profile.cover_photo && (
              <div className="relative aspect-[21/9] rounded-xl overflow-hidden bg-muted">
                <img
                  src={profile.cover_photo}
                  alt="Cover"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Photo Gallery */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <div className="md:col-span-3 relative aspect-[4/3] rounded-xl overflow-hidden bg-muted">
                {photos.length > 0 ? (
                  <img
                    src={photos[currentPhotoIndex]}
                    alt={profile.display_name || 'User'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Avatar className="h-32 w-32">
                      <AvatarFallback className="text-4xl">
                        {profile.display_name?.charAt(0)?.toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                )}
                {photos.length > 1 && (
                  <button className="absolute bottom-3 left-3 bg-foreground/80 text-background text-xs px-3 py-1.5 rounded-md font-medium">
                    View all photos
                  </button>
                )}
              </div>
              {photos.length > 1 && (
                <div className="hidden md:flex flex-col gap-2">
                  {photos.slice(1, 4).map((photo, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentPhotoIndex(idx + 1)}
                      className={cn(
                        "aspect-square rounded-lg overflow-hidden bg-muted",
                        currentPhotoIndex === idx + 1 && "ring-2 ring-primary"
                      )}
                    >
                      <img src={photo} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* About Section */}
            {profile.bio && (
              <div>
                <h2 className="text-lg font-semibold mb-3">About</h2>
                <p className="text-muted-foreground leading-relaxed">{profile.bio}</p>
              </div>
            )}

            {/* Fishing Info Badges */}
            <div className="flex flex-wrap gap-3">
              {profile.fishing_experience && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Award className="w-4 h-4" />
                  <span>{experienceLabels[profile.fishing_experience]} Angler</span>
                </div>
              )}
              {profile.fishing_gear && profile.fishing_gear.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Anchor className="w-4 h-4" />
                  <span>{profile.fishing_gear.length} gear types</span>
                </div>
              )}
            </div>

            {/* Preferred Species */}
            {profile.preferred_species && profile.preferred_species.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3">Target Species</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {profile.preferred_species.map((species: string) => (
                    <Card key={species} className="overflow-hidden">
                      <CardContent className="p-3 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Fish className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {species.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                          </p>
                          <p className="text-xs text-muted-foreground">Target species</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Fishing Styles */}
            {profile.fishing_styles && profile.fishing_styles.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3">Fishing Styles</h2>
                <div className="flex flex-wrap gap-2">
                  {profile.fishing_styles.map((style: string) => (
                    <Badge key={style} variant="secondary" className="px-3 py-1.5">
                      {style}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Fishing Gear */}
            {profile.fishing_gear && profile.fishing_gear.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3">Fishing Gear</h2>
                <div className="flex flex-wrap gap-2">
                  {profile.fishing_gear.map((gear: string) => (
                    <Badge key={gear} variant="outline" className="px-3 py-1.5">
                      {gear.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Catches */}
            {catches.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-3">Recent Catches</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {catches.slice(0, 6).map((catchItem: any) => (
                    <Card key={catchItem.id} className="overflow-hidden">
                      <div className="aspect-square bg-muted">
                        {catchItem.photos?.[0] ? (
                          <img 
                            src={catchItem.photos[0]} 
                            alt={catchItem.species_name || 'Catch'} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Fish className="w-8 h-8 text-muted-foreground/50" />
                          </div>
                        )}
                      </div>
                      <CardContent className="p-2">
                        <p className="font-medium text-sm truncate">{catchItem.species_name || 'Unknown'}</p>
                        {catchItem.weight_kg && (
                          <p className="text-xs text-muted-foreground">{catchItem.weight_kg} lbs</p>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Sidebar Widgets */}
          <div className="space-y-4">
            {/* Stats Card */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">Fishing Stats</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Catches</span>
                    <span className="font-semibold">{catches.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Experience</span>
                    <Badge variant="secondary">
                      {experienceLabels[profile.fishing_experience || 'beginner']}
                    </Badge>
                  </div>
                  {profile.preferred_species && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Target Species</span>
                      <span className="font-semibold">{profile.preferred_species.length}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Member Info */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold">Member Info</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Joined</span>
                    <span className="text-sm">
                      {new Date(profile.created_at).toLocaleDateString('en-US', { 
                        month: 'short', 
                        year: 'numeric' 
                      })}
                    </span>
                  </div>
                  {profile.last_active_at && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-muted-foreground">Last Active</span>
                      <span className="text-sm">
                        {new Date(profile.last_active_at).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Action Card */}
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <p className="text-sm font-medium mb-3">Connect with {profile.display_name?.split(' ')[0] || 'this angler'}</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Add as a buddy to plan trips together and share fishing spots.
                </p>
                {isBuddy ? (
                  <Button className="w-full" onClick={handleMessage}>
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Send Message
                  </Button>
                ) : isPending ? (
                  <Button className="w-full" disabled variant="outline">
                    <Check className="w-4 h-4 mr-2" />
                    Request Pending
                  </Button>
                ) : (
                  <Button className="w-full" onClick={handleSendRequest}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Buddy
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
