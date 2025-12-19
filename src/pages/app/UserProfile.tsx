import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ArrowLeft, MapPin, Fish, Award, UserPlus, MessageCircle, Check, Calendar } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['user-profile', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  const { data: catchCount = 0 } = useQuery({
    queryKey: ['user-catches-count', userId],
    queryFn: async () => {
      const { count } = await supabase
        .from('catches')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      return count || 0;
    },
    enabled: !!userId,
  });

  const { data: buddyStatus } = useQuery({
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
    } catch (error) {
      toast.error('Failed to send request');
    }
  };

  const handleMessage = () => {
    if (buddyStatus?.status === 'accepted') {
      navigate(`/app/buddy-chat/${buddyStatus.id}`);
    }
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
    <div className="pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="font-semibold text-lg">{profile.display_name || 'Profile'}</h1>
        </div>
      </div>

      {/* Photo Gallery */}
      <div className="relative aspect-square bg-muted">
        {photos.length > 0 ? (
          <>
            <img
              src={photos[currentPhotoIndex]}
              alt={profile.display_name || 'User'}
              className="w-full h-full object-cover"
            />
            {photos.length > 1 && (
              <div className="absolute top-3 left-0 right-0 flex justify-center gap-1">
                {photos.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentPhotoIndex(idx)}
                    className={`h-1 rounded-full transition-all ${
                      idx === currentPhotoIndex
                        ? 'w-6 bg-background'
                        : 'w-1 bg-background/50'
                    }`}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Avatar className="h-32 w-32">
              <AvatarFallback className="text-4xl">
                {profile.display_name?.charAt(0)?.toUpperCase() || '?'}
              </AvatarFallback>
            </Avatar>
          </div>
        )}
      </div>

      {/* Profile Info */}
      <div className="p-4 space-y-4">
        {/* Name and Location */}
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold">{profile.display_name || 'Anonymous'}</h2>
            {profile.location_name && (
              <p className="text-muted-foreground flex items-center gap-1 mt-1">
                <MapPin className="w-4 h-4" />
                {profile.location_name}
              </p>
            )}
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Fish className="w-5 h-5" />
              <span className="text-lg font-semibold">{catchCount}</span>
            </div>
            <span className="text-xs text-muted-foreground">catches</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2">
          {isBuddy ? (
            <>
              <Button variant="outline" className="flex-1" disabled>
                <Check className="w-4 h-4 mr-2" />
                Buddies
              </Button>
              <Button variant="default" className="flex-1" onClick={handleMessage}>
                <MessageCircle className="w-4 h-4 mr-2" />
                Message
              </Button>
            </>
          ) : isPending ? (
            <Button variant="outline" className="flex-1" disabled>
              <Check className="w-4 h-4 mr-2" />
              Request Sent
            </Button>
          ) : (
            <Button variant="default" className="flex-1" onClick={handleSendRequest}>
              <UserPlus className="w-4 h-4 mr-2" />
              Add Buddy
            </Button>
          )}
        </div>

        {/* Bio */}
        {profile.bio && (
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">About</h3>
              <p className="text-muted-foreground">{profile.bio}</p>
            </CardContent>
          </Card>
        )}

        {/* Fishing Info */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <h3 className="font-semibold">Fishing Profile</h3>
            
            {profile.fishing_experience && (
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                <span className="font-medium">
                  {experienceLabels[profile.fishing_experience] || profile.fishing_experience}
                </span>
                <span className="text-muted-foreground">Experience</span>
              </div>
            )}

            {profile.preferred_species && profile.preferred_species.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Target Species</p>
                <div className="flex flex-wrap gap-2">
                  {profile.preferred_species.map((species: string) => (
                    <Badge key={species} variant="secondary">
                      {species}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {profile.fishing_gear && profile.fishing_gear.length > 0 && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Fishing Gear</p>
                <div className="flex flex-wrap gap-2">
                  {profile.fishing_gear.map((gear: string) => (
                    <Badge key={gear} variant="outline">
                      {gear}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Member Since */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>Member since {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
        </div>
      </div>
    </div>
  );
}
