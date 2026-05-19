import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, ArrowRight, HelpCircle, LogOut } from "lucide-react";
import { Progress } from "@/components/ui/progress";

import { StepBasicInfoNew } from "@/components/onboarding/StepBasicInfoNew";
import { StepPhotoUpload } from "@/components/onboarding/StepPhotoUpload";
import { StepLocation } from "@/components/onboarding/StepLocation";
import { StepExperienceLevel } from "@/components/onboarding/StepExperienceLevel";
import { StepInterests } from "@/components/onboarding/StepInterests";
import { StepTargetSpecies } from "@/components/onboarding/StepTargetSpecies";
import { StepFishingGear } from "@/components/onboarding/StepFishingGear";
import { StepDatingPreference } from "@/components/onboarding/StepDatingPreference";
import { StepPreferenceSync } from "@/components/onboarding/StepPreferenceSync";
import { StepLifestyle } from "@/components/onboarding/StepLifestyle";
import { OnboardingDebugOverlay } from "@/components/onboarding/OnboardingDebugOverlay";

import fishingRodImage from "@/assets/fishing-photo-2.jpg";
import datingImage from "@/assets/fishing-photo-3.jpg";
import comboImage from "@/assets/fishing-photo-1.jpg";
import logoImage from "@/assets/fishx-logo.png";

// Animation variants - fade only, no sliding
const stepVariants = {
  enter: {
    opacity: 0,
  },
  center: {
    opacity: 1,
  },
  exit: {
    opacity: 0,
  },
};

const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

type AccountMode = 'dating' | 'fishing' | 'both';
type Gender = 'male' | 'female';
type LookingFor = 'relationship' | 'casual' | 'friends' | 'fishing_buddy';
type FishingExperience = 'beginner' | 'intermediate' | 'advanced' | 'expert';

// Step configurations per account mode
const stepConfigs: Record<AccountMode, string[]> = {
  dating: ['basic_info', 'photo', 'location', 'lifestyle', 'interests', 'success'],
  fishing: ['basic_info', 'photo', 'location', 'lifestyle', 'experience', 'target_species', 'gear', 'interests', 'success'],
  both: ['basic_info', 'photo', 'location', 'lifestyle', 'experience', 'target_species', 'gear', 'interests', 'success'],
};

// Mode-specific step titles and subtitles
const stepTitlesConfig: Record<AccountMode, Record<string, { title: string; subtitle: string }>> = {
  dating: {
    basic_info: { title: "Let's get to know you", subtitle: 'We need a few basics to help you find your perfect match.' },
    photo: { title: 'Show your best self!', subtitle: 'Upload at least one clear photo of yourself. A good photo helps build trust!' },
    location: { title: 'Where are you located?', subtitle: 'Set your location to find matches nearby.' },
    lifestyle: { title: 'Tell us about yourself', subtitle: 'Optional — share your bio and details to help others know you better.' },
    interests: { title: 'What are you into?', subtitle: 'Optional — select interests to help us find compatible matches.' },
    dating_preference: { title: 'Who are you looking for?', subtitle: 'Help us find your ideal match by setting your preferences.' },
  },
  fishing: {
    basic_info: { title: "Who's casting the line?", subtitle: 'We need a few basics to connect you with fellow anglers.' },
    photo: { title: 'Show us your best catch!', subtitle: 'Upload at least one clear photo of yourself so others can recognize you.' },
    location: { title: 'Where are you casting from?', subtitle: 'Set your location to find local anglers and fishing spots.' },
    lifestyle: { title: 'Tell us about yourself', subtitle: 'Optional — share your bio and lifestyle details to connect better with buddies.' },
    experience: { title: 'How experienced are you?', subtitle: 'Optional — helps us match you with the right fishing buddies.' },
    target_species: { title: 'What fish do you target?', subtitle: 'Optional — select the species you love to catch.' },
    gear: { title: 'What gear do you use?', subtitle: 'Optional — select the fishing equipment you own or prefer.' },
    interests: { title: 'What gets you hooked?', subtitle: 'Optional — select fishing styles and activities you enjoy.' },
  },
  both: {
    basic_info: { title: "Who's casting the line?", subtitle: 'We need a few basics to find your perfect catch or fishing buddy.' },
    photo: { title: 'Show us your best catch!', subtitle: 'Upload at least one clear photo of yourself. A good photo builds trust!' },
    location: { title: 'Where are you casting from?', subtitle: 'Set your location to find local anglers and matches.' },
    lifestyle: { title: 'Tell us about yourself', subtitle: 'Optional — share your bio and lifestyle details to make meaningful connections.' },
    experience: { title: 'How much experience do you have on the water?', subtitle: 'Optional — helps us match you with the right fishing buddies or dates.' },
    target_species: { title: 'What fish do you target?', subtitle: 'Optional — select the species you love to catch.' },
    gear: { title: 'What gear do you use?', subtitle: 'Optional — select the fishing equipment you own or prefer.' },
    interests: { title: 'What gets you hooked?', subtitle: 'Optional — select interests to help us find your perfect catch or spot.' },
    dating_preference: { title: 'Who are you looking for?', subtitle: 'Help us find your ideal match by setting your preferences.' },
    preference_sync: { title: "Let's Sync Your Worlds", subtitle: "We'll use this to find matches who love the water just as much as you do." },
  },
};

const getStepTitles = (mode: AccountMode, stepKey: string) => {
  return stepTitlesConfig[mode][stepKey] || { title: '', subtitle: '' };
};

const stepLabels: Record<string, string> = {
  basic_info: 'Basic Info',
  photo: 'Profile Photo',
  location: 'Location Setup',
  lifestyle: 'About You',
  experience: 'Experience Level',
  target_species: 'Target Species',
  gear: 'Fishing Gear',
  interests: 'Interest Selection',
  dating_preference: 'Dating Preference',
  preference_sync: 'Preference Sync',
};

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [accountMode, setAccountMode] = useState<AccountMode>('fishing');
  
  // Basic Info
  const [firstName, setFirstName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState<Gender | null>(null);
  
  // Photos
  const [photos, setPhotos] = useState<string[]>([]);
  
  // Location
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [locationLat, setLocationLat] = useState<number | null>(null);
  const [locationLng, setLocationLng] = useState<number | null>(null);
  
  // Fishing
  const [fishingExperience, setFishingExperience] = useState<FishingExperience>('beginner');
  const [targetSpecies, setTargetSpecies] = useState<string[]>([]);
  const [fishingGear, setFishingGear] = useState<string[]>([]);
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  
  // Dating Preferences
  const [interestedIn, setInterestedIn] = useState<Gender[]>([]);
  const [lookingFor, setLookingFor] = useState<LookingFor[]>([]);
  const [ageRange, setAgeRange] = useState<[number, number]>([18, 50]);
  const [maxDistance, setMaxDistance] = useState(50);
  
  // Preference Sync (Combo mode)
  const [fishingImportance, setFishingImportance] = useState(50);
  const [myStyle, setMyStyle] = useState('weekend_warrior');
  const [theirStyle, setTheirStyle] = useState('any');
  const [myPace, setMyPace] = useState<'relaxed' | 'intense'>('relaxed');
  const [theirPace, setTheirPace] = useState<'relaxed' | 'intense'>('relaxed');
  const [comboActivities, setComboActivities] = useState<string[]>([]);
  
  // Lifestyle fields
  const [bio, setBio] = useState('');
  const [occupation, setOccupation] = useState('');
  const [heightCm, setHeightCm] = useState<number | null>(null);
  const [smoking, setSmoking] = useState('');
  const [drinking, setDrinking] = useState('');
  const [zodiacSign, setZodiacSign] = useState('');

  const steps = stepConfigs[accountMode].filter(s => s !== 'success');
  const totalSteps = steps.length;
  const currentStepKey = steps[currentStep];
  const progress = ((currentStep + 1) / totalSteps) * 100;

  useEffect(() => {
    if (authLoading) return;
    
    if (!user) {
      navigate('/auth');
      return;
    }

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
        if (data.onboarding_completed) {
          navigate('/');
          return;
        }

        setAccountMode(data.account_mode || 'fishing');
        if (data.display_name) setFirstName(data.display_name);
        if (data.date_of_birth) setDateOfBirth(data.date_of_birth);
        if (data.gender && (data.gender === 'male' || data.gender === 'female')) {
          setGender(data.gender);
        }
        if (data.photos) setPhotos(data.photos);
        if (data.location_name) {
          const parts = data.location_name.split(', ');
          if (parts[0]) setCity(parts[0]);
          if (parts[1]) setState(parts[1]);
        }
        if (data.fishing_experience) setFishingExperience(data.fishing_experience);
        if (data.preferred_species) setTargetSpecies(data.preferred_species);
        if (data.fishing_gear) setFishingGear(data.fishing_gear);
        if (data.interested_in) {
          const filteredInterests = data.interested_in.filter(
            (g): g is Gender => g === 'male' || g === 'female'
          );
          setInterestedIn(filteredInterests);
        }
        if (data.looking_for) setLookingFor(data.looking_for);
        if (data.min_age_preference && data.max_age_preference) {
          setAgeRange([data.min_age_preference, data.max_age_preference]);
        }
        if (data.max_distance_miles) setMaxDistance(data.max_distance_miles);
        // Load lifestyle fields
        if (data.bio) setBio(data.bio);
        if (data.occupation) setOccupation(data.occupation);
        if (data.height_cm) setHeightCm(data.height_cm);
        if (data.smoking) setSmoking(data.smoking);
        if (data.drinking) setDrinking(data.drinking);
        if (data.zodiac_sign) setZodiacSign(data.zodiac_sign);
      }

      setLoading(false);
    };

    fetchProfile();
  }, [user, authLoading, navigate]);

  const validateStep = (): boolean => {
    switch (currentStepKey) {
      case 'basic_info':
        if (!firstName.trim()) {
          toast({ title: "Please enter your first name", variant: "destructive" });
          return false;
        }
        if (!dateOfBirth) {
          toast({ title: "Please enter your date of birth", variant: "destructive" });
          return false;
        }
        if ((accountMode === 'dating' || accountMode === 'both') && !gender) {
          toast({ title: "Please select your gender", variant: "destructive" });
          return false;
        }
        return true;
      case 'photo':
        if (photos.length === 0) {
          toast({ title: "Please upload at least one photo", variant: "destructive" });
          return false;
        }
        return true;
      case 'location':
        // Location is optional — users can complete later
        return true;
      case 'lifestyle':
        // All lifestyle fields are optional — users can complete later
        return true;
      case 'experience':
        return true;
      case 'interests':
        // Interests are optional — users can add them later
        return true;
      case 'dating_preference':
        if (interestedIn.length === 0) {
          toast({ title: "Please select who you're interested in", variant: "destructive" });
          return false;
        }
        return true;
      case 'preference_sync':
        return true;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!validateStep()) return;
    
    setDirection(1);
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setDirection(-1);
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    if (currentStep < totalSteps - 1) {
      setDirection(1);
      setCurrentStep(currentStep + 1);
    }
  };

  const handleComplete = async () => {
    if (!user) return;
    
    setSaving(true);

    try {
      const locationName = [city, state].filter(Boolean).join(', ');
      
      // Calculate 30-day free trial expiration
      const trialExpiresAt = new Date();
      trialExpiresAt.setDate(trialExpiresAt.getDate() + 30);

      // If we have GPS coords, use them. Otherwise, try to geocode the address.
      let finalLat = locationLat;
      let finalLng = locationLng;
      
      if (!finalLat && !finalLng && (city || state || zipCode)) {
        // Geocode the manually entered address
        try {
          const response = await supabase.functions.invoke('geocode-address', {
            body: { city, state, zipCode }
          });
          if (response.data?.lat && response.data?.lng) {
            finalLat = response.data.lat;
            finalLng = response.data.lng;
          }
        } catch (geocodeError) {
          console.warn('Geocoding failed, continuing without coordinates:', geocodeError);
        }
      }

      const updateData: Record<string, any> = {
        display_name: firstName,
        date_of_birth: dateOfBirth,
        photos,
        location_name: locationName || null,
        city: city || null,
        state: state || null,
        zip_code: zipCode || null,
        location_lat: finalLat,
        location_lng: finalLng,
        max_distance_miles: maxDistance,
        onboarding_completed: true,
        // Grant 30-day free trial to all users
        is_premium: true,
        premium_expires_at: trialExpiresAt.toISOString(),
        // Lifestyle fields (coerce empty strings to null so DB enums don't reject "")
        bio: bio || null,
        occupation: occupation || null,
        height_cm: heightCm || null,
        smoking: smoking || null,
        drinking: drinking || null,
        zodiac_sign: zodiacSign || null,
      };

      if (accountMode === 'dating' || accountMode === 'both') {
        updateData.gender = gender;
        updateData.interested_in = interestedIn;
        updateData.min_age_preference = ageRange[0];
        updateData.max_age_preference = ageRange[1];
        updateData.looking_for = lookingFor;
      }

      if (accountMode === 'fishing' || accountMode === 'both') {
        updateData.fishing_experience = fishingExperience;
        updateData.preferred_species = targetSpecies;
        updateData.fishing_gear = fishingGear;
      }

      // Map interest IDs to labels so they match ProfileEdit's InterestSelector
      const interestIdToLabel: Record<string, string> = {
        // Fishing styles
        fly_fishing: 'Fly Fishing', deep_sea: 'Deep Sea', kayak_fishing: 'Kayak Fishing',
        catch_and_cook: 'Catch & Release', ice_fishing: 'Ice Fishing', bass_fishing: 'Bass Fishing',
        // General interests
        music: 'Music', movies: 'Movies', fitness: 'Gym', art: 'Art',
        gaming: 'Gaming', reading: 'Reading',
        // Activities
        camping: 'Camping', boating: 'Swimming', travel: 'Travel',
        photography: 'Photography', conservation: 'Birdwatching', early_mornings: 'Running',
        seafood_cooking: 'Cooking', hiking: 'Hiking',
        wine: 'Wine Tasting', coffee: 'Coffee', dancing: 'Dancing',
        pets: 'Birdwatching', foodie: 'Cooking', concerts: 'Music', nature: 'Mountains',
      };

      // Map fishing style IDs to ProfileEdit fishing_styles labels
      const fishingStyleIdToLabel: Record<string, string> = {
        fly_fishing: 'Fly Fishing', deep_sea: 'Deep Sea Fishing', kayak_fishing: 'Kayak Fishing',
        catch_and_cook: 'Catch & Release', ice_fishing: 'Ice Fishing', bass_fishing: 'Bass Fishing',
      };

      const mapToLabels = (ids: string[], map: Record<string, string>) =>
        ids.map(id => map[id] || id.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));

      // Save interests using labels (matching ProfileEdit's InterestSelector)
      updateData.interests = mapToLabels([...selectedStyles, ...selectedActivities], interestIdToLabel);
      // Also save fishing_styles separately using ProfileEdit-compatible labels
      if (accountMode === 'fishing' || accountMode === 'both') {
        updateData.fishing_styles = mapToLabels(selectedStyles.filter(s => s in fishingStyleIdToLabel), fishingStyleIdToLabel);
      }

      // Debug mode: Log all form values before submission
      console.group('🔍 [ONBOARDING DEBUG] Form Submission Data');
      console.log('User ID:', user.id);
      console.log('Account Mode:', accountMode);
      console.log('Current Step:', currentStepKey);
      console.log('------- Raw Form Values -------');
      console.log('First Name:', firstName);
      console.log('Date of Birth:', dateOfBirth);
      console.log('Gender:', gender);
      console.log('Photos:', photos);
      console.log('Location:', { city, state, zipCode, combined: locationName, lat: finalLat, lng: finalLng });
      console.log('Max Distance (miles):', maxDistance);
      console.log('Age Range:', ageRange);
      console.log('Interested In:', interestedIn);
      console.log('Looking For:', lookingFor);
      console.log('Fishing Experience:', fishingExperience);
      console.log('Target Species:', targetSpecies);
      console.log('Fishing Gear:', fishingGear);
      console.log('Selected Styles (interests):', selectedStyles);
      console.log('Selected Activities (interests):', selectedActivities);
      console.log('------- Update Payload -------');
      console.log('updateData:', JSON.stringify(updateData, null, 2));
      console.groupEnd();

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id);

      if (error) {
        console.error('🔴 [ONBOARDING DEBUG] Supabase Error:', error);
        throw error;
      }

      console.log('✅ [ONBOARDING DEBUG] Profile saved successfully');
      navigate('/onboarding/success');
    } catch (error: any) {
      console.error('🔴 [ONBOARDING DEBUG] Catch block error:', error);
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
    switch (currentStepKey) {
      case 'basic_info':
        return (
          <StepBasicInfoNew
            firstName={firstName}
            setFirstName={setFirstName}
            dateOfBirth={dateOfBirth}
            setDateOfBirth={setDateOfBirth}
            gender={gender}
            setGender={setGender}
            showGender={accountMode === 'dating' || accountMode === 'both'}
          />
        );
      case 'photo':
        return (
          <StepPhotoUpload
            photos={photos}
            setPhotos={setPhotos}
            userId={user?.id || ''}
          />
        );
      case 'location':
        return (
          <StepLocation
            city={city}
            setCity={setCity}
            state={state}
            setState={setState}
            zipCode={zipCode}
            setZipCode={setZipCode}
            locationLat={locationLat}
            setLocationLat={setLocationLat}
            locationLng={locationLng}
            setLocationLng={setLocationLng}
          />
        );
      case 'lifestyle':
        return (
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
        );
      case 'experience':
        return (
          <StepExperienceLevel
            experience={fishingExperience}
            setExperience={setFishingExperience}
          />
        );
      case 'target_species':
        return (
          <StepTargetSpecies
            selectedSpecies={targetSpecies}
            setSelectedSpecies={setTargetSpecies}
          />
        );
      case 'gear':
        return (
          <StepFishingGear
            selectedGear={fishingGear}
            setSelectedGear={setFishingGear}
          />
        );
      case 'interests':
        return (
          <StepInterests
            selectedStyles={selectedStyles}
            setSelectedStyles={setSelectedStyles}
            selectedActivities={selectedActivities}
            setSelectedActivities={setSelectedActivities}
            accountMode={accountMode}
          />
        );
      case 'dating_preference':
        return (
          <StepDatingPreference
            interestedIn={interestedIn}
            setInterestedIn={setInterestedIn}
            lookingFor={lookingFor}
            setLookingFor={setLookingFor}
            ageRange={ageRange}
            setAgeRange={setAgeRange}
            maxDistance={maxDistance}
            setMaxDistance={setMaxDistance}
            accountMode={accountMode}
          />
        );
      case 'preference_sync':
        return (
          <StepPreferenceSync
            fishingImportance={fishingImportance}
            setFishingImportance={setFishingImportance}
            myStyle={myStyle}
            setMyStyle={setMyStyle}
            theirStyle={theirStyle}
            setTheirStyle={setTheirStyle}
            myPace={myPace}
            setMyPace={setMyPace}
            theirPace={theirPace}
            setTheirPace={setTheirPace}
            comboActivities={comboActivities}
            setComboActivities={setComboActivities}
          />
        );
      default:
        return null;
    }
  };

  // Steps that are optional and can be skipped
  const optionalSteps = ['location', 'lifestyle', 'experience', 'target_species', 'gear', 'interests'];
  const isOptionalStep = optionalSteps.includes(currentStepKey);
  const isLastStep = currentStep === totalSteps - 1;

  return (
    <div className="min-h-screen bg-muted flex flex-col">
      {/* Header */}
      <header className="bg-background border-b border-border px-6 py-4 flex-shrink-0">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={logoImage} alt="FishX" className="h-8 w-auto" />
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={async () => {
                await signOut();
                navigate('/auth');
              }}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
            <button
              type="button"
              onClick={() => window.open('/help', '_blank', 'noopener,noreferrer')}
              aria-label="Help"
              title="Help"
              className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors"
            >
              <HelpCircle className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-8 flex-1 flex flex-col min-h-0 w-full">
        <div className="bg-background rounded-3xl border border-border overflow-hidden flex-1 flex flex-col">
          <div className="flex flex-col lg:flex-row min-h-0 lg:min-h-[600px] flex-1">
            {/* Left Side - Image/Info (Desktop) */}
            <div className="hidden lg:flex lg:w-2/5 bg-muted p-8 flex-col justify-between">
              <div>
                <h2 className="text-2xl font-bold text-primary mb-2">
                  {accountMode === 'dating' && 'Find Your Match'}
                  {accountMode === 'fishing' && 'Join the Community'}
                  {accountMode === 'both' && 'Find Love on the Water'}
                </h2>
                <p className="text-muted-foreground">
                  {accountMode === 'dating' && 'Connect with singles who share your interests and values.'}
                  {accountMode === 'fishing' && 'Connect with thousands of fishing enthusiasts in your area.'}
                  {accountMode === 'both' && 'Meet singles who love fishing as much as you do.'}
                </p>
              </div>
              <div className="flex-1 flex items-center">
                <img
                  src={accountMode === 'dating' ? datingImage : accountMode === 'fishing' ? fishingRodImage : comboImage}
                  alt={accountMode === 'dating' ? 'Dating' : accountMode === 'fishing' ? 'Fishing' : 'Couple Fishing'}
                  className="w-full max-w-sm mx-auto rounded-2xl object-cover"
                />
              </div>
            </div>

            {/* Right Side - Form */}
            <div className="flex-1 p-4 sm:p-6 lg:p-10 flex flex-col min-h-0">
              {/* Step Progress */}
              <motion.div 
                className="mb-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-primary">
                      STEP {currentStep + 1} OF {totalSteps}
                    </span>
                  </div>
                  <motion.span 
                    key={stepLabels[currentStepKey]}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-sm text-muted-foreground"
                  >
                    {stepLabels[currentStepKey]}
                  </motion.span>
                </div>
                <div className="relative h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
              </motion.div>

              {/* Step Title */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={`title-${currentStepKey}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mb-8"
                >
                  <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-2">
                    {getStepTitles(accountMode, currentStepKey).title}
                  </h1>
                  <p className="text-muted-foreground">
                    {getStepTitles(accountMode, currentStepKey).subtitle}
                  </p>
                </motion.div>
              </AnimatePresence>

              {/* Step Content */}
              <div className="flex-1 relative">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStepKey}
                    variants={stepVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.2 }}
                    className="h-full"
                  >
                    {renderStepContent()}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Navigation */}
              <div className="sticky bottom-0 bg-background border-t border-border pt-4 sm:pt-6 mt-4 sm:mt-6 flex-shrink-0">
                {/* Back and Continue on same line */}
                <div className="flex items-center justify-between">
                  <div>
                    <AnimatePresence mode="wait">
                      {currentStep > 0 && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          <Button
                            variant="ghost"
                            onClick={handleBack}
                            className="text-primary hover:text-primary/80"
                          >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                          </Button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button
                      onClick={handleNext}
                      disabled={saving}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 px-6"
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : null}
                      {isLastStep
                        ? (accountMode === 'dating' ? 'Finalize & Find Matches' : 'Finish Setup')
                        : 'Continue'}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </motion.div>
                </div>

                {/* Skip button for optional steps */}
                {isOptionalStep && (
                  <div className="flex justify-center mt-3 pb-1">
                    <button
                      onClick={handleSkip}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
                    >
                      Skip for now — you can complete this later
                    </button>
                  </div>
                )}

                {/* Skip all & complete profile after photo step */}
                {currentStep >= 1 && !isLastStep && (
                  <div className="flex justify-center mt-2 pb-1">
                    <button
                      onClick={handleComplete}
                      disabled={saving}
                      className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                    >
                      {saving ? 'Saving...' : 'Skip all & complete profile →'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          © {new Date().getFullYear()} FishX. All rights reserved.
        </p>
      </div>

      {/* Debug Overlay - activate with ?debug=1 */}
      <OnboardingDebugOverlay
        currentStep={currentStep}
        currentStepKey={currentStepKey}
        accountMode={accountMode}
        formValues={{
          firstName,
          dateOfBirth,
          gender,
          photos,
          city,
          state,
          maxDistance,
          ageRange,
          interestedIn,
          lookingFor,
          fishingExperience,
          selectedStyles,
          selectedActivities,
        }}
      />
    </div>
  );
}
