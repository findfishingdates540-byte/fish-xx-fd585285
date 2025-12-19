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
  isVerified: boolean;
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

// Check if match is new (within last 24 hours)
function isNewMatch(matchedAt: string | null): boolean {
  if (!matchedAt) return false;
  const matchDate = new Date(matchedAt);
  const now = new Date();
  const hoursDiff = (now.getTime() - matchDate.getTime()) / (1000 * 60 * 60);
  return hoursDiff < 24;
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
        .select('id, user1_id, user2_id, matched_at')
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
        .from('profiles')
        .select('id, display_name, date_of_birth, bio, photos, is_verified, is_active')
        .in('id', otherUserIds)
        .eq('is_active', true);

      if (profileError) throw profileError;

      // Map to MatchProfile format
      const matchProfiles: MatchProfile[] = matchData
        .map(match => {
          const otherUserId = match.user1_id === user.id ? match.user2_id : match.user1_id;
          const profile = profiles?.find(p => p.id === otherUserId);
          
          if (!profile) return null;

          return {
            id: otherUserId,
            matchId: match.id,
            name: profile.display_name || 'Anonymous',
            age: calculateAge(profile.date_of_birth),
            photo: profile.photos?.[0] || '',
            bio: profile.bio || '',
            isVerified: profile.is_verified || false,
            isNew: isNewMatch(match.matched_at),
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
