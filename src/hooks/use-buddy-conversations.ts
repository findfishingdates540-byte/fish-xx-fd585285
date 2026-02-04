import { useMemo, useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { playNotificationSound } from '@/utils/notification-sound';

export interface BuddyConversation {
  buddyId: string;
  buddyUserId: string;
  displayName: string;
  photo: string;
  lastMessage: string | null;
  lastMessageTime: string | null;
  lastMessageSenderId: string | null;
  unreadCount: number;
}

export function useBuddyConversations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch all buddy conversations using optimized RPC
  const { data: conversations, isLoading, refetch } = useQuery({
    queryKey: ['buddy-conversations', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .rpc('get_buddy_conversations', { p_user_id: user.id });

      if (error) throw error;

      return (data || []).map(row => ({
        buddyId: row.buddy_id,
        buddyUserId: row.buddy_user_id,
        displayName: row.display_name || 'Anonymous',
        photo: row.photo || '',
        lastMessage: row.last_message || null,
        lastMessageTime: row.last_message_time || null,
        lastMessageSenderId: row.last_message_sender_id || null,
        unreadCount: Number(row.unread_count) || 0,
      })) as BuddyConversation[];
    },
    enabled: !!user?.id,
    staleTime: 30000, // Cache for 30 seconds
  });

  // Debounced invalidation to prevent rapid re-fetches
  const debouncedInvalidate = (immediate = false) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (immediate) {
      queryClient.invalidateQueries({ queryKey: ['buddy-conversations', user?.id] });
    } else {
      debounceTimerRef.current = setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['buddy-conversations', user?.id] });
      }, 300); // Reduced to 300ms for faster updates
    }
  };

  // Real-time subscription for new messages
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('buddy-conversations-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'buddy_messages',
        },
        (payload) => {
          // Play notification sound if message is from someone else
          if (payload.new && payload.new.sender_id !== user.id) {
            playNotificationSound();
          }
          // Always invalidate on new messages (including own sent messages)
          debouncedInvalidate(true);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'buddy_messages',
        },
        () => {
          // Refresh on any update (read receipts, deletions, etc.)
          debouncedInvalidate();
        }
      )
      .subscribe();

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  // Total unread count
  const totalUnread = useMemo(() => {
    return (conversations || []).reduce((sum, c) => sum + c.unreadCount, 0);
  }, [conversations]);

  return {
    conversations: conversations || [],
    isLoading,
    totalUnread,
    refetch,
  };
}
