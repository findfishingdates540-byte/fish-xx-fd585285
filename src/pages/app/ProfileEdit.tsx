import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { StepPhotos } from '@/components/onboarding/StepPhotos';
import { StepBio, fishingLookingForOptions } from '@/components/onboarding/StepBio';
import { StepFishingProfile } from '@/components/onboarding/StepFishingProfile';
import { StepPreferences } from '@/components/onboarding/StepPreferences';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Gender = 'male' | 'female' | 'non_binary' | 'other' | 'prefer_not_to_say';
type LookingFor = 'relationship' | 'casual' | 'friends' | 'fishing_buddy';
type FishingExperience = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export default function ProfileEdit() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Basic info
  const [displayName, setDisplayName] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [bio, setBio] = useState('');
  const [lookingFor, setLookingFor] = useState<LookingFor[]>([]);

  // Fishing preferences
  const [experience, setExperience] = useState<FishingExperience>('beginner');
  const [preferredSpecies, setPreferredSpecies] = useState<string[]>([]);
  const [fishingGear, setFishingGear] = useState<string[]>([]);

  // Dating preferences
  const [interestedIn, setInterestedIn] = useState<Gender[]>([]);
  const [ageRange, setAgeRange] = useState<[number, number]>([18, 50]);
  const [maxDistance, setMaxDistance] = useState(50);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile-edit', user?.id],
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

  // Populate form when profile loads
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setPhotos(profile.photos || []);
      setBio(profile.bio || '');
      setLookingFor((profile.looking_for as LookingFor[]) || []);
      setExperience((profile.fishing_experience as FishingExperience) || 'beginner');
      setPreferredSpecies(profile.preferred_species || []);
      setFishingGear(profile.fishing_gear || []);
      setInterestedIn((profile.interested_in as Gender[]) || []);
      setAgeRange([profile.min_age_preference || 18, profile.max_age_preference || 50]);
      setMaxDistance(profile.max_distance_km || 50);
    }
  }, [profile]);

  const updateProfile = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName,
          photos,
          bio,
          looking_for: lookingFor,
          fishing_experience: experience,
          preferred_species: preferredSpecies,
          fishing_gear: fishingGear,
          interested_in: interestedIn,
          min_age_preference: ageRange[0],
          max_age_preference: ageRange[1],
          max_distance_km: maxDistance,
        })
        .eq('id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast({
        title: 'Profile updated',
        description: 'Your changes have been saved',
      });
      navigate('/app/profile');
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const accountMode = profile?.account_mode || 'both';
  const showDating = accountMode === 'dating' || accountMode === 'both';
  const showFishing = accountMode === 'fishing' || accountMode === 'both';

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => navigate('/app/profile')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-semibold">Edit Profile</h1>
        <Button
          size="sm"
          onClick={() => updateProfile.mutate()}
          disabled={updateProfile.isPending}
        >
          {updateProfile.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Save'
          )}
        </Button>
      </div>

      <div className="p-4 pb-24">
        <Tabs defaultValue="photos" className="w-full">
          <TabsList className="w-full grid grid-cols-4 mb-6">
            <TabsTrigger value="photos">Photos</TabsTrigger>
            <TabsTrigger value="bio">Bio</TabsTrigger>
            {showFishing && <TabsTrigger value="fishing">Fishing</TabsTrigger>}
            {showDating && <TabsTrigger value="dating">Dating</TabsTrigger>}
          </TabsList>

          <TabsContent value="photos" className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  className="mt-1"
                />
              </div>
              <StepPhotos
                photos={photos}
                setPhotos={setPhotos}
                userId={user?.id || ''}
              />
            </div>
          </TabsContent>

          <TabsContent value="bio" className="space-y-6">
            <StepBio
              bio={bio}
              setBio={setBio}
              lookingFor={lookingFor}
              setLookingFor={setLookingFor}
              showLookingFor={true}
              lookingForOptions={showFishing && !showDating ? fishingLookingForOptions : undefined}
            />
          </TabsContent>

          {showFishing && (
            <TabsContent value="fishing" className="space-y-6">
              <StepFishingProfile
                experience={experience}
                setExperience={setExperience}
                preferredSpecies={preferredSpecies}
                setPreferredSpecies={setPreferredSpecies}
                fishingGear={fishingGear}
                setFishingGear={setFishingGear}
              />
            </TabsContent>
          )}

          {showDating && (
            <TabsContent value="dating" className="space-y-6">
              <StepPreferences
                interestedIn={interestedIn}
                setInterestedIn={setInterestedIn}
                ageRange={ageRange}
                setAgeRange={setAgeRange}
                maxDistance={maxDistance}
                setMaxDistance={setMaxDistance}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
