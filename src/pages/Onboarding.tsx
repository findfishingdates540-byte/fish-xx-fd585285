import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, ArrowRight, Check } from "lucide-react";

import { StepProgress } from "@/components/onboarding/StepProgress";
import { StepBasicInfo } from "@/components/onboarding/StepBasicInfo";
import { StepPhotos } from "@/components/onboarding/StepPhotos";
import { StepBio, fishingLookingForOptions } from "@/components/onboarding/StepBio";
import { StepPreferences } from "@/components/onboarding/StepPreferences";
import { StepFishingProfile } from "@/components/onboarding/StepFishingProfile";

import onboardingStep1 from "@/assets/onboarding-step1.jpg";
import onboardingStep2 from "@/assets/onboarding-step2.jpg";
import onboardingStep3 from "@/assets/onboarding-step3.jpg";
import onboardingStep4 from "@/assets/onboarding-step4.jpg";

type AccountMode = 'dating' | 'fishing' | 'both';
type Gender = 'male' | 'female' | 'non_binary' | 'other' | 'prefer_not_to_say';
type LookingFor = 'relationship' | 'casual' | 'friends' | 'fishing_buddy';
type FishingExperience = 'beginner' | 'intermediate' | 'advanced' | 'expert';

const stepImages = [onboardingStep1, onboardingStep2, onboardingStep3, onboardingStep4];

const stepTitles: Record<AccountMode, string[]> = {
  dating: ['About You', 'Your Photos', 'Your Story', 'Preferences'],
  fishing: ['About You', 'Your Photos', 'Fishing Profile', 'Preferences'],
  both: ['About You', 'Your Photos', 'Your Story', 'Preferences'],
};

const stepSubtitles: Record<AccountMode, string[]> = {
  dating: [
    'Tell us a bit about yourself',
    'Show your best side',
    'What makes you unique?',
    'Who are you looking for?',
  ],
  fishing: [
    'Tell us a bit about yourself',
    'Show your fishing adventures',
    'Share your fishing experience',
    'Find your fishing companions',
  ],
  both: [
    'Tell us a bit about yourself',
    'Show your best side',
    'Share your story and fishing experience',
    'Set your preferences',
  ],
};

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [accountMode, setAccountMode] = useState<AccountMode>('both');
  
  // Step 1: Basic Info
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);
  const [locationName, setLocationName] = useState('');
  
  // Step 2: Photos
  const [photos, setPhotos] = useState<string[]>([]);
  
  // Step 3: Bio / Fishing Profile
  const [bio, setBio] = useState('');
  const [lookingFor, setLookingFor] = useState<LookingFor[]>([]);
  const [fishingExperience, setFishingExperience] = useState<FishingExperience>('beginner');
  const [preferredSpecies, setPreferredSpecies] = useState<string[]>([]);
  const [fishingGear, setFishingGear] = useState<string[]>([]);
  
  // Step 4: Preferences
  const [interestedIn, setInterestedIn] = useState<Gender[]>([]);
  const [ageRange, setAgeRange] = useState<[number, number]>([18, 50]);
  const [maxDistance, setMaxDistance] = useState(50);

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate('/auth');
      return;
    }

    // Fetch current profile data
    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        setLoading(false);
        return;
      }

      if (data) {
        // If onboarding is already completed, redirect to home
        if (data.onboarding_completed) {
          navigate('/');
          return;
        }

        setAccountMode(data.account_mode || 'both');
        if (data.date_of_birth) setDateOfBirth(data.date_of_birth);
        if (data.gender) setGender(data.gender);
        if (data.location_name) setLocationName(data.location_name);
        if (data.photos) setPhotos(data.photos);
        if (data.bio) setBio(data.bio);
        if (data.looking_for) setLookingFor(data.looking_for);
        if (data.fishing_experience) setFishingExperience(data.fishing_experience);
        if (data.preferred_species) setPreferredSpecies(data.preferred_species);
        if (data.fishing_gear) setFishingGear(data.fishing_gear);
        if (data.interested_in) setInterestedIn(data.interested_in);
        if (data.min_age_preference && data.max_age_preference) {
          setAgeRange([data.min_age_preference, data.max_age_preference]);
        }
        if (data.max_distance_km) setMaxDistance(data.max_distance_km);
      }

      setLoading(false);
    };

    fetchProfile();
  }, [user, authLoading, navigate]);

  const totalSteps = 4;

  const validateStep = (): boolean => {
    switch (currentStep) {
      case 1:
        if (!dateOfBirth) {
          toast({ title: "Please enter your date of birth", variant: "destructive" });
          return false;
        }
        if ((accountMode === 'dating' || accountMode === 'both') && !gender) {
          toast({ title: "Please select your gender", variant: "destructive" });
          return false;
        }
        return true;
      case 2:
        if (photos.length < 1) {
          toast({ title: "Please add at least one photo", variant: "destructive" });
          return false;
        }
        return true;
      case 3:
        return true; // Bio is optional
      case 4:
        if ((accountMode === 'dating' || accountMode === 'both') && interestedIn.length === 0) {
          toast({ title: "Please select who you're interested in", variant: "destructive" });
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!validateStep()) return;
    
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (!validateStep() || !user) return;
    
    setSaving(true);

    try {
      const updateData: Record<string, any> = {
        date_of_birth: dateOfBirth,
        photos,
        bio,
        max_distance_km: maxDistance,
        onboarding_completed: true,
      };

      if (accountMode === 'dating' || accountMode === 'both') {
        updateData.gender = gender;
        updateData.interested_in = interestedIn;
        updateData.min_age_preference = ageRange[0];
        updateData.max_age_preference = ageRange[1];
        updateData.looking_for = lookingFor;
      }

      if (accountMode === 'fishing' || accountMode === 'both') {
        updateData.location_name = locationName;
        updateData.fishing_experience = fishingExperience;
        updateData.preferred_species = preferredSpecies;
        updateData.fishing_gear = fishingGear;
        if (accountMode === 'fishing') {
          updateData.looking_for = lookingFor;
        }
      }

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: "Profile complete!",
        description: "Welcome to Find Fishing Dates",
      });

      navigate('/');
    } catch (error: any) {
      toast({
        title: "Error saving profile",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-foreground" />
      </div>
    );
  }

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <StepBasicInfo
            dateOfBirth={dateOfBirth}
            setDateOfBirth={setDateOfBirth}
            gender={gender}
            setGender={setGender}
            locationName={locationName}
            setLocationName={setLocationName}
            showGender={accountMode === 'dating' || accountMode === 'both'}
            showLocation={accountMode === 'fishing' || accountMode === 'both'}
          />
        );
      case 2:
        return (
          <StepPhotos
            photos={photos}
            setPhotos={setPhotos}
            userId={user?.id || ''}
            maxPhotos={accountMode === 'fishing' ? 4 : 6}
            minPhotos={1}
          />
        );
      case 3:
        if (accountMode === 'fishing') {
          return (
            <StepFishingProfile
              experience={fishingExperience}
              setExperience={setFishingExperience}
              preferredSpecies={preferredSpecies}
              setPreferredSpecies={setPreferredSpecies}
              fishingGear={fishingGear}
              setFishingGear={setFishingGear}
            />
          );
        }
        return (
          <div className="space-y-8">
            <StepBio
              bio={bio}
              setBio={setBio}
              lookingFor={lookingFor}
              setLookingFor={setLookingFor}
              showLookingFor={accountMode === 'dating'}
            />
            {accountMode === 'both' && (
              <StepFishingProfile
                experience={fishingExperience}
                setExperience={setFishingExperience}
                preferredSpecies={preferredSpecies}
                setPreferredSpecies={setPreferredSpecies}
                fishingGear={fishingGear}
                setFishingGear={setFishingGear}
              />
            )}
          </div>
        );
      case 4:
        if (accountMode === 'fishing') {
          return (
            <div className="space-y-6">
              <StepBio
                bio={bio}
                setBio={setBio}
                lookingFor={lookingFor}
                setLookingFor={setLookingFor}
                showLookingFor={true}
                lookingForOptions={fishingLookingForOptions}
              />
              <StepPreferences
                interestedIn={interestedIn}
                setInterestedIn={setInterestedIn}
                ageRange={ageRange}
                setAgeRange={setAgeRange}
                maxDistance={maxDistance}
                setMaxDistance={setMaxDistance}
                showGenderPreference={false}
                showAgeRange={false}
              />
            </div>
          );
        }
        return (
          <StepPreferences
            interestedIn={interestedIn}
            setInterestedIn={setInterestedIn}
            ageRange={ageRange}
            setAgeRange={setAgeRange}
            maxDistance={maxDistance}
            setMaxDistance={setMaxDistance}
            showGenderPreference={true}
            showAgeRange={true}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left side - Image */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        {stepImages.map((img, index) => (
          <img
            key={index}
            src={img}
            alt={`Onboarding step ${index + 1}`}
            className={`absolute inset-0 w-full h-full object-cover transition-all duration-700 ease-out ${
              currentStep === index + 1 
                ? 'opacity-100 scale-100' 
                : 'opacity-0 scale-105'
            }`}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex flex-col p-6 lg:p-12 max-w-xl mx-auto w-full">
        <div className="mb-8">
          <StepProgress currentStep={currentStep} totalSteps={totalSteps} />
        </div>

        <div className="flex-1 flex flex-col">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              {stepTitles[accountMode][currentStep - 1]}
            </h1>
            <p className="text-muted-foreground">
              {stepSubtitles[accountMode][currentStep - 1]}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto pb-8">
            {renderStepContent()}
          </div>

          <div className="flex gap-3 pt-4 border-t border-border">
            {currentStep > 1 && (
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex-1"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
            
            {currentStep < totalSteps ? (
              <Button
                onClick={handleNext}
                className="flex-1 bg-foreground text-background hover:bg-foreground/90"
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleComplete}
                disabled={saving}
                className="flex-1 bg-foreground text-background hover:bg-foreground/90"
              >
                {saving ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Check className="w-4 h-4 mr-2" />
                )}
                Complete Setup
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
