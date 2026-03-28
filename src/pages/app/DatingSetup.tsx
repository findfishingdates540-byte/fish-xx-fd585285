import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Check, Heart } from 'lucide-react';
import { StepDatingPreference } from '@/components/onboarding/StepDatingPreference';
import { StepLifestyle } from '@/components/onboarding/StepLifestyle';
import { StepPhotos } from '@/components/onboarding/StepPhotos';
import { StepBio } from '@/components/onboarding/StepBio';
import { toast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

type Gender = 'male' | 'female';
type LookingFor = 'relationship' | 'casual' | 'friends' | 'fishing_buddy';

const STEPS = ['preferences', 'lifestyle', 'photos', 'bio'] as const;
type Step = typeof STEPS[number];

const stepLabels: Record<Step, string> = {
  preferences: 'Dating Preferences',
  lifestyle: 'Lifestyle',
  photos: 'Photos',
  bio: 'About You',
};

export default function DatingSetup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Preferences state
  const [interestedIn, setInterestedIn] = useState<Gender[]>([]);
  const [lookingFor, setLookingFor] = useState<LookingFor[]>([]);
  const [ageRange, setAgeRange] = useState<[number, number]>([18, 45]);
  const [maxDistance, setMaxDistance] = useState(50);

  // Lifestyle state
  const [bio, setBio] = useState('');
  const [occupation, setOccupation] = useState('');
  const [heightCm, setHeightCm] = useState<number | null>(null);
  const [smoking, setSmoking] = useState('');
  const [drinking, setDrinking] = useState('');
  const [zodiacSign, setZodiacSign] = useState('');

  // Photos state
  const [photos, setPhotos] = useState<string[]>([]);

  // Bio state
  const [datingBio, setDatingBio] = useState('');

  const step = STEPS[currentStep];
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const canProceed = () => {
    switch (step) {
      case 'preferences':
        return interestedIn.length > 0 && lookingFor.length > 0;
      case 'lifestyle':
        return bio.length > 0 && occupation.length > 0 && heightCm !== null && smoking !== '' && drinking !== '' && zodiacSign !== '';
      case 'photos':
        return photos.length >= 1;
      case 'bio':
        return datingBio.length > 0;
      default:
        return true;
    }
  };

  const handleComplete = async () => {
    if (!user?.id) return;
    setSaving(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          account_mode: 'both' as any,
          interested_in: interestedIn as any,
          looking_for: lookingFor as any,
          min_age_preference: ageRange[0],
          max_age_preference: ageRange[1],
          max_distance_miles: maxDistance,
          bio: datingBio || bio,
          occupation,
          height_cm: heightCm,
          smoking: smoking as any,
          drinking: drinking as any,
          zodiac_sign: zodiacSign,
          ...(photos.length > 0 ? { photos } : {}),
        })
        .eq('id', user.id);

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      await queryClient.invalidateQueries({ queryKey: ['profile-full'] });

      toast({
        title: 'Dating Profile Created! 🎉',
        description: 'You can now explore the dating features.',
      });

      navigate('/app/profile', { state: { showDating: true } });
    } catch (err) {
      console.error('Failed to create dating profile:', err);
      toast({
        title: 'Error',
        description: 'Failed to set up dating profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (currentStep > 0) {
                setCurrentStep(currentStep - 1);
              } else {
                navigate('/app/profile');
              }
            }}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-sm font-semibold flex items-center gap-2">
              <Heart className="h-4 w-4 text-pink-500" />
              Set Up Dating — {stepLabels[step]}
            </h1>
            <Progress value={progress} className="h-1.5 mt-2" />
          </div>
          <span className="text-xs text-muted-foreground">
            {currentStep + 1}/{STEPS.length}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 py-6">
        {step === 'preferences' && (
          <StepDatingPreference
            interestedIn={interestedIn}
            setInterestedIn={setInterestedIn}
            lookingFor={lookingFor}
            setLookingFor={setLookingFor}
            ageRange={ageRange}
            setAgeRange={setAgeRange}
            maxDistance={maxDistance}
            setMaxDistance={setMaxDistance}
            accountMode="both"
          />
        )}

        {step === 'lifestyle' && (
          <StepLifestyle
            bio={bio}
            setBio={setBio}
            occupation={occupation}
            setOccupation={setOccupation}
            heightCm={heightCm}
            setHeightCm={setHeightCm}
            smoking={smoking}
            setSmoking={setSmoking}
            drinking={drinking}
            setDrinking={setDrinking}
            zodiacSign={zodiacSign}
            setZodiacSign={setZodiacSign}
          />
        )}

        {step === 'photos' && user?.id && (
          <StepPhotos
            photos={photos}
            setPhotos={setPhotos}
            userId={user.id}
          />
        )}

        {step === 'bio' && (
          <StepBio
            bio={datingBio}
            setBio={setDatingBio}
            lookingFor={lookingFor}
            setLookingFor={setLookingFor}
            showLookingFor={false}
          />
        )}

        {/* Navigation */}
        <div className="mt-8 flex gap-3">
          {currentStep > 0 && (
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setCurrentStep(currentStep - 1)}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          {currentStep < STEPS.length - 1 ? (
            <Button
              className="flex-1"
              disabled={!canProceed()}
              onClick={() => setCurrentStep(currentStep + 1)}
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              className="flex-1"
              disabled={!canProceed() || saving}
              onClick={handleComplete}
            >
              {saving ? 'Creating...' : 'Complete Setup'}
              <Check className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
