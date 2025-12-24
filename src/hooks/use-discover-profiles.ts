import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { ProfileData, ProfileDetailData } from '@/components/discover';

export interface MatchedProfile {
  id: string;
  matchId: string;
  name: string;
  age: number | null;
  photo: string;
  distance?: string;
  fishingType?: string;
  bio?: string;
}

interface UserPreferences {
  interested_in: string[] | null;
  min_age_preference: number;
  max_age_preference: number;
  max_distance_miles: number;
  location_lat: number | null;
  location_lng: number | null;
  gender: string | null;
}

interface DiscoverProfile {
  id: string;
  display_name: string | null;
  date_of_birth: string | null;
  location_name: string | null;
  location_lat: number | null;
  location_lng: number | null;
  bio: string | null;
  photos: string[] | null;
  gender: string | null;
  fishing_experience: string | null;
  preferred_species: string[] | null;
  fishing_gear: string[] | null;
  is_verified: boolean | null;
  is_active: boolean | null;
  height_cm: number | null;
  smoking: string | null;
  drinking: string | null;
  education: string | null;
  occupation: string | null;
  zodiac_sign: string | null;
  personality_type: string | null;
  interests: string[] | null;
  prompt_responses: { question: string; answer: string }[] | null;
}

// Calculate age from date of birth
function calculateAge(dateOfBirth: string | null): number | null {
  if (!dateOfBirth) return null;
  const today = new Date();
  const birth = new Date(dateOfBirth);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

// Calculate distance between two coordinates in km
function calculateDistance(
  lat1: number | null,
  lng1: number | null,
  lat2: number | null,
  lng2: number | null
): number | null {
  if (!lat1 || !lng1 || !lat2 || !lng2) return null;
  
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Convert km to miles
function kmToMiles(km: number): number {
  return Math.round(km * 0.621371);
}

// Map database profile to ProfileData format
function mapToProfileData(
  profile: DiscoverProfile,
  userLat: number | null,
  userLng: number | null
): ProfileData {
  const age = calculateAge(profile.date_of_birth);
  const distanceKm = calculateDistance(
    userLat,
    userLng,
    profile.location_lat,
    profile.location_lng
  );
  const distanceMiles = distanceKm ? kmToMiles(distanceKm) : null;

  // Create tags from fishing data
  const tags: { icon: string; label: string }[] = [];
  if (profile.fishing_experience) {
    tags.push({ icon: '🎣', label: profile.fishing_experience.charAt(0).toUpperCase() + profile.fishing_experience.slice(1) });
  }
  if (profile.preferred_species?.[0]) {
    tags.push({ icon: '🐟', label: profile.preferred_species[0] });
  }
  if (profile.fishing_gear?.[0]) {
    tags.push({ icon: '🎯', label: profile.fishing_gear[0] });
  }

  return {
    id: profile.id,
    name: profile.display_name || 'Anonymous',
    age: age || undefined,
    location: profile.location_name || 'Unknown location',
    distance: distanceMiles ? `${distanceMiles} miles away` : 'Distance unknown',
    bio: profile.bio || '',
    photos: profile.photos || [],
    fishingType: profile.fishing_experience || undefined,
    tags: tags.length > 0 ? tags : undefined,
  };
}

// Map database profile to ProfileDetailData format
function mapToProfileDetailData(
  profile: DiscoverProfile,
  userLat: number | null,
  userLng: number | null
): ProfileDetailData {
  const basicData = mapToProfileData(profile, userLat, userLng);
  
  // Parse prompt_responses if it exists
  const promptResponses = profile.prompt_responses 
    ? (Array.isArray(profile.prompt_responses) 
        ? profile.prompt_responses 
        : [])
    : [];
  
  return {
    ...basicData,
    isVerified: profile.is_verified || false,
    isActive: profile.is_active || false,
    heightCm: profile.height_cm || undefined,
    smoker: profile.smoking || undefined,
    drinker: profile.drinking || undefined,
    education: profile.education || undefined,
    occupation: profile.occupation || undefined,
    zodiacSign: profile.zodiac_sign || undefined,
    personalityType: profile.personality_type || undefined,
    targetSpecies: profile.preferred_species?.join(', ') || undefined,
    interests: profile.interests || profile.preferred_species || [],
    promptResponses: promptResponses.filter(p => p.question && p.answer),
  };
}

export function useDiscoverProfiles() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [swipedIds, setSwipedIds] = useState<Set<string>>(new Set());
  const [matchedProfile, setMatchedProfile] = useState<MatchedProfile | null>(null);

  // Fetch current user's preferences
  const { data: userPreferences } = useQuery({
    queryKey: ['user-preferences', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('interested_in, min_age_preference, max_age_preference, max_distance_miles, location_lat, location_lng, gender')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data as UserPreferences;
    },
    enabled: !!user?.id,
  });

  // Fetch profiles the user has already swiped on
  const { data: swipedProfiles } = useQuery({
    queryKey: ['swiped-profiles', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('matches')
        .select('user1_id, user2_id')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);
      
      if (error) throw error;
      
      // Return IDs of profiles the user has already interacted with
      return data.map(m => m.user1_id === user.id ? m.user2_id : m.user1_id);
    },
    enabled: !!user?.id,
  });

  // Fetch discoverable profiles
  const { data: profiles, isLoading, refetch } = useQuery({
    queryKey: ['discover-profiles', user?.id, userPreferences, swipedProfiles],
    queryFn: async () => {
      if (!user?.id || !userPreferences) return [];

      // Build the query
      let query = supabase
        .from('profiles')
        .select('id, display_name, date_of_birth, location_name, location_lat, location_lng, bio, photos, gender, fishing_experience, preferred_species, fishing_gear, is_verified, is_active, height_cm, smoking, drinking, education, occupation, zodiac_sign, personality_type, interests, prompt_responses')
        .eq('is_active', true)
        .neq('id', user.id)
        .not('photos', 'is', null);

      // Filter by gender preference
      if (userPreferences.interested_in && userPreferences.interested_in.length > 0) {
        query = query.in('gender', userPreferences.interested_in as ('male' | 'female' | 'non_binary' | 'other' | 'prefer_not_to_say')[]);
      }

      // Exclude already swiped profiles
      const excludeIds = [...(swipedProfiles || []), ...Array.from(swipedIds)];
      if (excludeIds.length > 0) {
        query = query.not('id', 'in', `(${excludeIds.join(',')})`);
      }

      const { data, error } = await query.limit(20);
      
      if (error) throw error;

      // Filter by age in memory (since we need to calculate from DOB)
      const filtered = (data as DiscoverProfile[]).filter(profile => {
        const age = calculateAge(profile.date_of_birth);
        if (!age) return true; // Include if no DOB set
        return age >= userPreferences.min_age_preference && 
               age <= userPreferences.max_age_preference;
      });

      // Filter by distance in memory (user preference is in miles, convert to km for comparison)
      const withDistance = filtered.filter(profile => {
        const distanceKm = calculateDistance(
          userPreferences.location_lat,
          userPreferences.location_lng,
          profile.location_lat,
          profile.location_lng
        );
        if (!distanceKm) return true; // Include if no location set
        // Convert user's max distance from miles to km for comparison
        const maxDistanceKm = userPreferences.max_distance_miles * 1.60934;
        return distanceKm <= maxDistanceKm;
      });

      return withDistance;
    },
    enabled: !!user?.id && !!userPreferences,
  });

  // Create or update match record
  const swipeMutation = useMutation({
    mutationFn: async ({ targetUserId, liked, isSuperLike = false }: { targetUserId: string; liked: boolean; isSuperLike?: boolean }) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Get the target profile first for match celebration
      const { data: targetProfile } = await supabase
        .from('profiles')
        .select('id, display_name, date_of_birth, photos, bio, fishing_experience, location_name, location_lat, location_lng')
        .eq('id', targetUserId)
        .maybeSingle();

      // Check if a match record already exists
      const { data: existing } = await supabase
        .from('matches')
        .select('*')
        .or(`and(user1_id.eq.${user.id},user2_id.eq.${targetUserId}),and(user1_id.eq.${targetUserId},user2_id.eq.${user.id})`)
        .maybeSingle();

      let matchId: string;
      let isMatch = false;

      if (existing) {
        // Update existing record
        const isUser1 = existing.user1_id === user.id;
        const updateField = isUser1 ? 'user1_liked' : 'user2_liked';
        const otherLiked = isUser1 ? existing.user2_liked : existing.user1_liked;
        isMatch = liked && otherLiked;
        matchId = existing.id;

        const { error } = await supabase
          .from('matches')
          .update({
            [updateField]: liked,
            is_match: isMatch,
            matched_at: isMatch ? new Date().toISOString() : null,
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Create new record (current user is always user1 for new records)
        const { data: newMatch, error } = await supabase
          .from('matches')
          .insert({
            user1_id: user.id,
            user2_id: targetUserId,
            user1_liked: liked,
            user2_liked: false,
            is_match: false,
          })
          .select('id')
          .single();

        if (error) throw error;
        matchId = newMatch.id;
      }

      // Calculate distance for matched profile
      const distanceKm = userPreferences ? calculateDistance(
        userPreferences.location_lat,
        userPreferences.location_lng,
        targetProfile?.location_lat || null,
        targetProfile?.location_lng || null
      ) : null;
      const distanceMiles = distanceKm ? kmToMiles(distanceKm) : null;

      return { 
        isMatch, 
        targetUserId, 
        matchId,
        matchProfile: targetProfile ? {
          id: targetProfile.id,
          matchId,
          name: targetProfile.display_name || 'Anonymous',
          age: calculateAge(targetProfile.date_of_birth),
          photo: targetProfile.photos?.[0] || '',
          distance: distanceMiles ? `${distanceMiles} miles away` : undefined,
          fishingType: targetProfile.fishing_experience || undefined,
          bio: targetProfile.bio || undefined,
        } : null
      };
    },
    onSuccess: (result) => {
      // Add to local swiped set to immediately exclude
      setSwipedIds(prev => new Set([...prev, result.targetUserId]));
      
      if (result.isMatch && result.matchProfile) {
        setMatchedProfile(result.matchProfile);
      }
    },
    onError: (error) => {
      console.error('Swipe error:', error);
    },
  });

  // Get current profile
  const currentProfile = profiles?.[currentIndex];
  const mappedProfile = currentProfile && userPreferences
    ? mapToProfileData(currentProfile, userPreferences.location_lat, userPreferences.location_lng)
    : null;
  const mappedDetailProfile = currentProfile && userPreferences
    ? mapToProfileDetailData(currentProfile, userPreferences.location_lat, userPreferences.location_lng)
    : null;

  // Swipe handlers
  const handleLike = useCallback(async () => {
    if (!currentProfile) return;
    await swipeMutation.mutateAsync({ targetUserId: currentProfile.id, liked: true });
    setCurrentIndex(prev => prev + 1);
  }, [currentProfile, swipeMutation]);

  const handlePass = useCallback(async () => {
    if (!currentProfile) return;
    await swipeMutation.mutateAsync({ targetUserId: currentProfile.id, liked: false });
    setCurrentIndex(prev => prev + 1);
  }, [currentProfile, swipeMutation]);

  const handleSuperLike = useCallback(async () => {
    if (!currentProfile) return;
    await swipeMutation.mutateAsync({ targetUserId: currentProfile.id, liked: true, isSuperLike: true });
    setCurrentIndex(prev => prev + 1);
  }, [currentProfile, swipeMutation]);

  // Check if we have more profiles
  const hasMoreProfiles = profiles && currentIndex < profiles.length;
  const noMoreProfiles = profiles && currentIndex >= profiles.length;

  // Refetch when we run out - invalidate cache to get fresh data
  const loadMoreProfiles = useCallback(async () => {
    setCurrentIndex(0);
    // Invalidate swiped profiles cache to get fresh data from server
    await queryClient.invalidateQueries({ queryKey: ['swiped-profiles', user?.id] });
    await queryClient.invalidateQueries({ queryKey: ['discover-profiles', user?.id] });
    refetch();
  }, [refetch, queryClient, user?.id]);

  // Clear matched profile (close modal)
  const clearMatchedProfile = useCallback(() => {
    setMatchedProfile(null);
  }, []);

  return {
    currentProfile: mappedProfile,
    currentDetailProfile: mappedDetailProfile,
    isLoading,
    isSwiping: swipeMutation.isPending,
    hasMoreProfiles,
    noMoreProfiles,
    handleLike,
    handlePass,
    handleSuperLike,
    loadMoreProfiles,
    matchedProfile,
    clearMatchedProfile,
  };
}
