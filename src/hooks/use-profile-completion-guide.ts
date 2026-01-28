import { useState, useEffect, useMemo, useCallback } from 'react';

const GUIDE_SHOWN_KEY = 'profile_completion_guide_shown';
const BANNER_DISMISSED_KEY = 'profile_completion_banner_dismissed';

export interface MissingField {
  key: string;
  label: string;
  selector: string;
  description: string;
}

export interface ProfileData {
  bio?: string | null;
  occupation?: string | null;
  height_cm?: number | null;
  smoking?: string | null;
  drinking?: string | null;
  zodiac_sign?: string | null;
  photos?: string[] | null;
  city?: string | null;
  state?: string | null;
}

const FIELD_DEFINITIONS: MissingField[] = [
  {
    key: 'photos',
    label: 'Add a Photo',
    selector: '[data-profile-field="photos"]',
    description: 'Upload at least one photo so others can see you. Your first photo will be your main profile picture.',
  },
  {
    key: 'bio',
    label: 'Write a Bio',
    selector: '#bio',
    description: 'Tell others about yourself in a few sentences. What makes you unique?',
  },
  {
    key: 'occupation',
    label: 'Add Your Occupation',
    selector: '#occupation',
    description: 'Let people know what you do. It helps start conversations!',
  },
  {
    key: 'height',
    label: 'Add Your Height',
    selector: '#height',
    description: 'Height is a common preference for many users.',
  },
  {
    key: 'smoking',
    label: 'Smoking Preference',
    selector: '[data-profile-field="smoking"]',
    description: 'Let others know your smoking habits.',
  },
  {
    key: 'drinking',
    label: 'Drinking Preference',
    selector: '[data-profile-field="drinking"]',
    description: 'Share your drinking habits with potential matches.',
  },
  {
    key: 'zodiac',
    label: 'Zodiac Sign',
    selector: '[data-profile-field="zodiac"]',
    description: 'Many people find zodiac compatibility interesting!',
  },
  {
    key: 'location',
    label: 'Add Your Location',
    selector: '#city',
    description: 'Your location helps us find matches near you.',
  },
];

export function useProfileCompletionGuide(profile: ProfileData | null | undefined) {
  const [isGuideRunning, setIsGuideRunning] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Check localStorage on mount
  useEffect(() => {
    const dismissed = sessionStorage.getItem(BANNER_DISMISSED_KEY);
    if (dismissed === 'true') {
      setBannerDismissed(true);
    }
  }, []);

  // Calculate missing fields
  const missingFields = useMemo(() => {
    if (!profile) return [];

    const missing: MissingField[] = [];
    
    const bio = profile.bio?.trim();
    const occupation = profile.occupation?.trim();
    const city = profile.city?.trim();
    const state = profile.state?.trim();

    if (!profile.photos || profile.photos.length === 0) {
      missing.push(FIELD_DEFINITIONS.find(f => f.key === 'photos')!);
    }
    if (!bio || bio.length === 0) {
      missing.push(FIELD_DEFINITIONS.find(f => f.key === 'bio')!);
    }
    if (!occupation || occupation.length === 0) {
      missing.push(FIELD_DEFINITIONS.find(f => f.key === 'occupation')!);
    }
    if (profile.height_cm === null || profile.height_cm === undefined) {
      missing.push(FIELD_DEFINITIONS.find(f => f.key === 'height')!);
    }
    if (!profile.smoking) {
      missing.push(FIELD_DEFINITIONS.find(f => f.key === 'smoking')!);
    }
    if (!profile.drinking) {
      missing.push(FIELD_DEFINITIONS.find(f => f.key === 'drinking')!);
    }
    if (!profile.zodiac_sign) {
      missing.push(FIELD_DEFINITIONS.find(f => f.key === 'zodiac')!);
    }
    if (!city && !state) {
      missing.push(FIELD_DEFINITIONS.find(f => f.key === 'location')!);
    }

    return missing;
  }, [profile]);

  const completionPercent = useMemo(() => {
    const totalFields = FIELD_DEFINITIONS.length;
    const completedFields = totalFields - missingFields.length;
    return Math.round((completedFields / totalFields) * 100);
  }, [missingFields]);

  const isProfileComplete = missingFields.length === 0;

  // Check if auto-navigation should happen (first time seeing incomplete profile)
  const shouldAutoNavigate = useMemo(() => {
    if (isProfileComplete) return false;
    const guideShown = localStorage.getItem(GUIDE_SHOWN_KEY);
    return guideShown !== 'true';
  }, [isProfileComplete]);

  const markGuideShown = useCallback(() => {
    localStorage.setItem(GUIDE_SHOWN_KEY, 'true');
  }, []);

  const startGuide = useCallback(() => {
    setIsGuideRunning(true);
  }, []);

  const stopGuide = useCallback(() => {
    setIsGuideRunning(false);
  }, []);

  const dismissBanner = useCallback(() => {
    sessionStorage.setItem(BANNER_DISMISSED_KEY, 'true');
    setBannerDismissed(true);
  }, []);

  const showBanner = !isProfileComplete && !bannerDismissed;

  return {
    missingFields,
    completionPercent,
    isProfileComplete,
    shouldAutoNavigate,
    markGuideShown,
    isGuideRunning,
    startGuide,
    stopGuide,
    bannerDismissed,
    dismissBanner,
    showBanner,
  };
}
