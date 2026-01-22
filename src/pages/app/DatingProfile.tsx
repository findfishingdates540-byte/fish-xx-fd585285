import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { X, Heart, MapPin, Camera, ChevronLeft, ChevronRight, Shield, Flag, Fish, Trophy, Anchor, Ruler, Wine, Cigarette, GraduationCap, Briefcase, Star, Brain, MessageCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { VerificationBadge } from '@/components/ui/verification-badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Lightbox } from '@/components/ui/lightbox';

export default function DatingProfile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
  const [showLightbox, setShowLightbox] = useState(false);

  // Fetch profile data
  const { data: profile, isLoading, error } = useQuery({
    queryKey: ['dating-profile', userId],
    queryFn: async () => {
      if (!userId) return null;
      const { data, error } = await supabase
        .from('public_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  // Fetch user's location for distance calculation
  const { data: myProfile } = useQuery({
    queryKey: ['my-location', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('location_lat, location_lng')
        .eq('id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  const nextPhoto = () => {
    const photos = profile?.photos || [];
    if (currentPhotoIndex < photos.length - 1) {
      setCurrentPhotoIndex(currentPhotoIndex + 1);
    }
  };

  const prevPhoto = () => {
    if (currentPhotoIndex > 0) {
      setCurrentPhotoIndex(currentPhotoIndex - 1);
    }
  };

  const formatHeight = (cm?: number | null) => {
    if (!cm) return null;
    const feet = Math.floor(cm / 30.48);
    const inches = Math.round((cm % 30.48) / 2.54);
    return `${feet}'${inches}"`;
  };

  const calculateDistance = () => {
    if (!myProfile?.location_lat || !myProfile?.location_lng || 
        !profile?.location_lat || !profile?.location_lng) {
      return null;
    }
    
    const R = 3959; // Earth's radius in miles
    const dLat = (profile.location_lat - myProfile.location_lat) * Math.PI / 180;
    const dLon = (profile.location_lng - myProfile.location_lng) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(myProfile.location_lat * Math.PI / 180) * Math.cos(profile.location_lat * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return Math.round(distance);
  };

  const distance = calculateDistance();
  const photos = profile?.photos || [];
  const hasLifestyleInfo = profile?.drinking || profile?.smoking || profile?.zodiac_sign || profile?.personality_type;
  const hasBasicsInfo = profile?.height_cm || profile?.education || profile?.occupation;

  // Parse prompt responses
  const promptResponses = profile?.prompt_responses 
    ? (Array.isArray(profile.prompt_responses) ? profile.prompt_responses : [])
    : [];

  const formatLabel = (s: string) => s?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || '';

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Profile not found</p>
        <Button onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  const location = [profile.city, profile.state].filter(Boolean).join(', ') || profile.location_name || 'Unknown';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <span className="font-semibold">{profile.display_name}</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Top Section - Photo + Info Card */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Main Photo */}
          <div 
            className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-muted cursor-pointer"
            onClick={() => photos.length > 0 && setShowLightbox(true)}
          >
            {photos.length > 0 ? (
              <img
                src={photos[currentPhotoIndex]}
                alt={profile.display_name || 'User'}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                No photos
              </div>
            )}
            
            {/* Photo Navigation */}
            {photos.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prevPhoto(); }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 flex items-center justify-center hover:bg-background transition-colors"
                  disabled={currentPhotoIndex === 0}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-background/80 flex items-center justify-center hover:bg-background transition-colors"
                  disabled={currentPhotoIndex === photos.length - 1}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </>
            )}

            {/* Photo Count Badge */}
            {photos.length > 0 && (
              <div className="absolute bottom-3 left-3 bg-foreground/80 text-background px-3 py-1 rounded-full text-sm flex items-center gap-1.5">
                <Camera className="h-4 w-4" />
                {photos.length} Photos
              </div>
            )}
          </div>

          {/* Info Card */}
          <div className="space-y-4">
            <div className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold">
                      {profile.display_name}{profile.age ? `, ${profile.age}` : ''}
                    </h1>
                    <VerificationBadge 
                      idVerified={profile.id_verified || false} 
                      liveVerified={profile.live_verified || false} 
                      size="lg" 
                    />
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground text-sm mt-1">
                    <MapPin className="h-4 w-4" />
                    <span>{location}</span>
                    {distance && (
                      <>
                        <span className="mx-1">•</span>
                        <span>{distance} miles away</span>
                      </>
                    )}
                  </div>
                </div>
                {profile.is_active && (
                  <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5" />
                    Active
                  </Badge>
                )}
              </div>

              {/* Stats - Height, Smoker, Drinker */}
              <div className="grid grid-cols-3 gap-4 py-4 border-y border-border">
                <div className="text-center">
                  <p className="font-semibold">{formatHeight(profile.height_cm) || '—'}</p>
                  <p className="text-xs text-muted-foreground uppercase">Height</p>
                </div>
                <div className="text-center">
                  <p className="font-semibold capitalize">{profile.smoking || '—'}</p>
                  <p className="text-xs text-muted-foreground uppercase">Smoker</p>
                </div>
                <div className="text-center">
                  <p className="font-semibold capitalize">{profile.drinking || '—'}</p>
                  <p className="text-xs text-muted-foreground uppercase">Drinker</p>
                </div>
              </div>

              {/* Message Button for matched users */}
              <div className="pt-4">
                <Button 
                  className="w-full" 
                  onClick={() => navigate(-1)}
                >
                  Back to Chat
                </Button>
              </div>
            </div>

            {/* Verification Notice */}
            {(profile.id_verified || profile.live_verified) && (
              <div className="bg-primary/5 border border-primary/20 rounded-2xl p-4 flex items-start gap-3">
                <Shield className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="font-medium text-primary text-sm">
                    {profile.live_verified ? 'Live Verified' : 'ID Verified'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {profile.display_name}'s profile is verified. Remember to stay safe and meet in public places for your first date.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* About Section */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <h2 className="font-semibold mb-3 flex items-center gap-2">
            <span className="text-lg">👋</span> About {profile.display_name}
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            {profile.bio || 'No bio yet'}
          </p>
        </div>

        {/* The Basics & Lifestyle */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* The Basics */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="font-semibold mb-4">The Basics</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Ruler className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{formatHeight(profile.height_cm) || 'Not specified'}</span>
              </div>
              <div className="flex items-center gap-3">
                <GraduationCap className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{profile.education || 'Not specified'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Briefcase className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{profile.occupation || 'Not specified'}</span>
              </div>
            </div>
          </div>

          {/* Lifestyle */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="font-semibold mb-4">Lifestyle</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Wine className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm capitalize">
                  {profile.drinking 
                    ? (profile.drinking === 'never' ? 'Non-drinker' : `Drinks ${profile.drinking}`)
                    : 'Not specified'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Cigarette className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm capitalize">
                  {profile.smoking 
                    ? (profile.smoking === 'never' ? 'Non-smoker' : `Smokes ${profile.smoking}`)
                    : 'Not specified'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Star className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{profile.zodiac_sign || 'Not specified'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Brain className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm capitalize">{profile.personality_type || 'Not specified'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Prompts */}
        <div className="mb-6">
          <h2 className="font-semibold mb-4">Profile Prompts</h2>
          {promptResponses.length > 0 ? (
            <div className="space-y-4">
              {promptResponses.filter((p: any) => p.answer).map((prompt: any, index: number) => (
                <Card key={index}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <MessageCircle className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-sm text-primary">{prompt.question}</p>
                        <p className="text-sm text-muted-foreground mt-1">{prompt.answer}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No prompts answered yet</p>
          )}
        </div>

        {/* Fishing Stats */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Fish className="h-5 w-5 text-primary" />
            Target Species
          </h2>
          {profile.preferred_species && profile.preferred_species.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {profile.preferred_species.map((species: string) => (
                <Badge key={species} variant="secondary" className="px-3 py-1.5">
                  {formatLabel(species)}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No species specified</p>
          )}
        </div>

        {/* Interests */}
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <h2 className="font-semibold mb-4">Interests & Hobbies</h2>
          {profile.interests && profile.interests.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((interest: string, idx: number) => (
                <Badge key={idx} variant="secondary" className="px-4 py-2 font-medium">
                  {formatLabel(interest)}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No interests specified</p>
          )}
        </div>

        {/* More Photos Grid */}
        {photos.length > 1 && (
          <div className="mb-8">
            <h2 className="font-semibold mb-4">More Photos</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {photos.slice(1).map((photo: string, idx: number) => (
                <div 
                  key={idx} 
                  className="aspect-square rounded-2xl overflow-hidden bg-muted cursor-pointer"
                  onClick={() => {
                    setCurrentPhotoIndex(idx + 1);
                    setShowLightbox(true);
                  }}
                >
                  <img src={photo} alt={`Photo ${idx + 2}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Report Link */}
        <div className="text-center pb-8">
          <button className="text-muted-foreground text-sm flex items-center gap-2 mx-auto hover:text-foreground transition-colors">
            <Flag className="h-4 w-4" />
            Report {profile.display_name}'s Profile
          </button>
        </div>
      </main>

      {/* Photo Lightbox */}
      <Lightbox
        images={photos}
        initialIndex={currentPhotoIndex}
        open={showLightbox}
        onOpenChange={setShowLightbox}
      />
    </div>
  );
}
