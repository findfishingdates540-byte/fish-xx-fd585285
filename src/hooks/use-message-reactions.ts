import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Reaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

interface ReactionSummary {
  emoji: string;
  count: number;
  hasReacted: boolean;
}

export function useMessageReactions(matchId: string | undefined) {
  const { user } = useAuth();
  const [reactions, setReactions] = useState<Map<string, Reaction[]>>(new Map());
  const [loading, setLoading] = useState(false);

  // Fetch all reactions for messages in this match
  const fetchReactions = useCallback(async () => {
    if (!matchId || !user) return;

    const { data: messages } = await supabase
      .from('messages')
      .select('id')
      .eq('match_id', matchId);

    if (!messages || messages.length === 0) return;

    const messageIds = messages.map(m => m.id);

    const { data: reactionData, error } = await supabase
      .from('message_reactions')
      .select('*')
      .in('message_id', messageIds);

    if (error) {
      console.error('Error fetching reactions:', error);
      return;
    }

    // Group reactions by message_id
    const reactionsMap = new Map<string, Reaction[]>();
    (reactionData || []).forEach((reaction: Reaction) => {
      const existing = reactionsMap.get(reaction.message_id) || [];
      existing.push(reaction);
      reactionsMap.set(reaction.message_id, existing);
    });

    setReactions(reactionsMap);
  }, [matchId, user]);

  // Initial fetch
  useEffect(() => {
    fetchReactions();
  }, [fetchReactions]);

  // Real-time subscription for reactions
  useEffect(() => {
    if (!matchId) return;

    const channel = supabase
      .channel(`reactions-${matchId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_reactions',
        },
        () => {
          // Refetch all reactions when any change happens
          fetchReactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId, fetchReactions]);

  // Add a reaction
  const addReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('message_reactions')
      .insert({
        message_id: messageId,
        user_id: user.id,
        emoji,
      });

    if (error) {
      // If already exists, try to remove it (toggle behavior)
      if (error.code === '23505') {
        await removeReaction(messageId, emoji);
      } else {
        console.error('Error adding reaction:', error);
      }
    }
  }, [user]);

  // Remove a reaction
  const removeReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('message_reactions')
      .delete()
      .eq('message_id', messageId)
      .eq('user_id', user.id)
      .eq('emoji', emoji);

    if (error) {
      console.error('Error removing reaction:', error);
    }
  }, [user]);

  // Toggle a reaction (add if not exists, remove if exists)
  const toggleReaction = useCallback(async (messageId: string, emoji: string) => {
    if (!user) return;

    const messageReactions = reactions.get(messageId) || [];
    const existingReaction = messageReactions.find(
      r => r.emoji === emoji && r.user_id === user.id
    );

    if (existingReaction) {
      await removeReaction(messageId, emoji);
    } else {
      await addReaction(messageId, emoji);
    }
  }, [user, reactions, addReaction, removeReaction]);

  // Get reaction summary for a message
  const getReactionSummary = useCallback((messageId: string): ReactionSummary[] => {
    const messageReactions = reactions.get(messageId) || [];
    const emojiMap = new Map<string, { count: number; hasReacted: boolean }>();

    messageReactions.forEach(reaction => {
      const existing = emojiMap.get(reaction.emoji) || { count: 0, hasReacted: false };
      existing.count++;
      if (reaction.user_id === user?.id) {
        existing.hasReacted = true;
      }
      emojiMap.set(reaction.emoji, existing);
    });

    return Array.from(emojiMap.entries()).map(([emoji, data]) => ({
      emoji,
      count: data.count,
      hasReacted: data.hasReacted,
    }));
  }, [reactions, user?.id]);

  return {
    reactions,
    loading,
    addReaction,
    removeReaction,
    toggleReaction,
    getReactionSummary,
    refetch: fetchReactions,
  };
}
