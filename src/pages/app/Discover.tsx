import { useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Heart, X, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SwipeCard } from '@/components/discovery';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { toast } from 'sonner';

export default function Discover() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentIndex, setCurrentIndex] = useState(0);

  // Fetch potential matches
  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ['discover-profiles', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get user's preferences
      const { data: myProfile } = await supabase
        .from('profiles')
        .select('gender, interested_in, account_mode, looking_for')
        .eq('id', user.id)
        .maybeSingle();

      // Get already interacted profiles (liked or passed)
      const { data: existingMatches } = await supabase
        .from('matches')
        .select('user1_id, user2_id')
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

      const interactedIds = new Set<string>();
      existingMatches?.forEach((match) => {
        if (match.user1_id === user.id) {
          interactedIds.add(match.user2_id);
        } else {
          interactedIds.add(match.user1_id);
        }
      });

      // Get blocked users
      const { data: blockedUsers } = await supabase
        .from('blocked_users')
        .select('blocked_id')
        .eq('blocker_id', user.id);

      const blockedIds = new Set(blockedUsers?.map((b) => b.blocked_id) || []);

      // Fetch potential profiles
      let query = supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id)
        .eq('is_active', true)
        .eq('onboarding_completed', true)
        .not('photos', 'is', null)
        .limit(20);

      // Filter by interested_in preferences if set
      if (myProfile?.interested_in && myProfile.interested_in.length > 0) {
        query = query.in('gender', myProfile.interested_in);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Filter out already interacted and blocked profiles
      return (data || []).filter(
        (p) => !interactedIds.has(p.id) && !blockedIds.has(p.id)
      );
    },
    enabled: !!user?.id,
  });

  // Like mutation
  const likeMutation = useMutation({
    mutationFn: async (targetId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Check if match record exists
      const { data: existingMatch } = await supabase
        .from('matches')
        .select('*')
        .or(
          `and(user1_id.eq.${user.id},user2_id.eq.${targetId}),and(user1_id.eq.${targetId},user2_id.eq.${user.id})`
        )
        .maybeSingle();

      if (existingMatch) {
        // Update existing match
        const isUser1 = existingMatch.user1_id === user.id;
        const updateData = isUser1
          ? { user1_liked: true }
          : { user2_liked: true };

        // Check if it's a match
        const willBeMatch = isUser1
          ? existingMatch.user2_liked
          : existingMatch.user1_liked;

        const { error } = await supabase
          .from('matches')
          .update({
            ...updateData,
            is_match: willBeMatch,
            matched_at: willBeMatch ? new Date().toISOString() : null,
          })
          .eq('id', existingMatch.id);

        if (error) throw error;
        return { isMatch: willBeMatch };
      } else {
        // Create new match record
        const { error } = await supabase.from('matches').insert({
          user1_id: user.id,
          user2_id: targetId,
          user1_liked: true,
        });

        if (error) throw error;
        return { isMatch: false };
      }
    },
    onSuccess: (result) => {
      if (result.isMatch) {
        toast.success("It's a match! 🎉");
      }
    },
  });

  // Pass mutation (create match record with liked=false to track)
  const passMutation = useMutation({
    mutationFn: async (targetId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Check if match record exists
      const { data: existingMatch } = await supabase
        .from('matches')
        .select('*')
        .or(
          `and(user1_id.eq.${user.id},user2_id.eq.${targetId}),and(user1_id.eq.${targetId},user2_id.eq.${user.id})`
        )
        .maybeSingle();

      if (!existingMatch) {
        // Create new match record with liked=false
        const { error } = await supabase.from('matches').insert({
          user1_id: user.id,
          user2_id: targetId,
          user1_liked: false,
        });

        if (error) throw error;
      }
    },
  });

  const handleSwipe = useCallback(
    (direction: 'left' | 'right') => {
      const profile = profiles[currentIndex];
      if (!profile) return;

      if (direction === 'right') {
        likeMutation.mutate(profile.id);
      } else {
        passMutation.mutate(profile.id);
      }

      setCurrentIndex((prev) => prev + 1);
    },
    [profiles, currentIndex, likeMutation, passMutation]
  );

  const handleLike = () => handleSwipe('right');
  const handlePass = () => handleSwipe('left');

  const currentProfile = profiles[currentIndex];
  const nextProfile = profiles[currentIndex + 1];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] p-4">
        <div className="w-full max-w-sm aspect-[3/4] bg-muted rounded-2xl animate-pulse" />
      </div>
    );
  }

  if (!currentProfile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] p-4">
        <div className="w-full max-w-sm aspect-[3/4] bg-muted rounded-2xl flex flex-col items-center justify-center border border-border p-6 text-center">
          <Heart className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">No more profiles</h2>
          <p className="text-muted-foreground mb-6">
            Check back later for new people in your area!
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setCurrentIndex(0);
              queryClient.invalidateQueries({ queryKey: ['discover-profiles'] });
            }}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] p-4">
      {/* Card stack */}
      <div className="relative w-full max-w-sm aspect-[3/4]">
        <AnimatePresence>
          {nextProfile && (
            <SwipeCard
              key={nextProfile.id}
              profile={nextProfile}
              onSwipe={() => {}}
              isTop={false}
            />
          )}
          {currentProfile && (
            <SwipeCard
              key={currentProfile.id}
              profile={currentProfile}
              onSwipe={handleSwipe}
              isTop={true}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-6 mt-6">
        <Button
          size="lg"
          variant="outline"
          className="h-16 w-16 rounded-full border-2 hover:border-red-500 hover:bg-red-500/10 transition-colors"
          onClick={handlePass}
          disabled={!currentProfile}
        >
          <X className="h-8 w-8" />
        </Button>
        <Button
          size="lg"
          className="h-16 w-16 rounded-full bg-foreground text-background hover:bg-foreground/90"
          onClick={handleLike}
          disabled={!currentProfile}
        >
          <Heart className="h-8 w-8" />
        </Button>
      </div>
    </div>
  );
}
