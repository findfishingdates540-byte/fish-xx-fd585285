import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface MatchProfile {
  id: string;
  matchId: string;
  name: string;
  age: number | null;
  photo: string;
  bio: string;
  idVerified: boolean;
  liveVerified: boolean;
  isNew: boolean;
  matchedAt: string | null;
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

// Check if match is new (not yet viewed by user)
function isNewMatch(matchedAt: string | null, viewedAt: string | null): boolean {
  if (!matchedAt) return false;
  // If never viewed, it's new
  if (!viewedAt) return true;
  // If matched after last viewed, it's new
  return new Date(matchedAt) > new Date(viewedAt);
}

export function useMatches() {
  const { user } = useAuth();

  const { data: matches, isLoading, error, refetch } = useQuery({
    queryKey: ['dating-matches', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Fetch all mutual matches (is_match = true)
      const { data: matchData, error: matchError } = await supabase
        .from('matches')
        .select('id, user1_id, user2_id, matched_at, user1_viewed_at, user2_viewed_at')
        .eq('is_match', true)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('matched_at', { ascending: false });

      if (matchError) throw matchError;
      if (!matchData || matchData.length === 0) return [];

      // Get the other user's ID for each match
      const otherUserIds = matchData.map(m => 
        m.user1_id === user.id ? m.user2_id : m.user1_id
      );

      // Fetch profiles for all matched users
      const { data: profiles, error: profileError } = await supabase
        .from('profiles_safe')
        .select('id, display_name, age, bio, photos, id_verified, live_verified, is_active')
        .in('id', otherUserIds)
        .eq('is_active', true);

      if (profileError) throw profileError;

      // Map to MatchProfile format
      const matchProfiles: MatchProfile[] = matchData
        .map(match => {
          const otherUserId = match.user1_id === user.id ? match.user2_id : match.user1_id;
          const profile = profiles?.find(p => p.id === otherUserId);
          
          if (!profile) return null;

          // Determine the correct viewed_at timestamp for the current user
          const isUser1 = match.user1_id === user.id;
          const viewedAt = isUser1 ? match.user1_viewed_at : match.user2_viewed_at;

          return {
            id: otherUserId,
            matchId: match.id,
            name: profile.display_name || 'Anonymous',
            age: profile.age ?? null,
            photo: profile.photos?.[0] || '',
            bio: profile.bio || '',
            idVerified: profile.id_verified || false,
            liveVerified: profile.live_verified || false,
            isNew: isNewMatch(match.matched_at, viewedAt),
            matchedAt: match.matched_at,
          };
        })
        .filter((m): m is MatchProfile => m !== null);

      return matchProfiles;
    },
    enabled: !!user?.id,
  });

  return {
    matches: matches || [],
    isLoading,
    error,
    refetch,
  };
}
