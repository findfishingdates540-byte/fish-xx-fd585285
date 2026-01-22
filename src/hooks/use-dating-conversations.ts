import { useMemo, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';

export interface DatingConversation {
  id: string; // match_id
  matchedUserId: string;
  name: string;
  photo: string;
  lastMessage: string | null;
  lastMessageTime: string | null;
  unreadCount: number;
  isOnline?: boolean;
}

function formatTimeAgo(dateStr: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function useDatingConversations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch all matches with their profiles and latest messages using optimized RPC
  const { data: conversations, isLoading, refetch } = useQuery({
    queryKey: ['dating-conversations', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .rpc('get_dating_conversations', { p_user_id: user.id });

      if (error) throw error;

      return (data || []).map(row => ({
        id: row.match_id,
        matchedUserId: row.matched_user_id,
        name: row.display_name || 'Anonymous',
        photo: row.photo || '',
        lastMessage: row.last_message || null,
        lastMessageTime: row.last_message_time || row.matched_at,
        unreadCount: Number(row.unread_count) || 0,
      })) as DatingConversation[];
    },
    enabled: !!user?.id,
    staleTime: 30000, // Cache for 30 seconds
  });

  // Debounced invalidation to prevent rapid re-fetches
  const debouncedInvalidate = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      queryClient.invalidateQueries({ queryKey: ['dating-conversations', user?.id] });
    }, 1000); // Wait 1 second before refetching
  };

  // Subscribe to new messages for real-time updates
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('dating-conversations-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const newMessage = payload.new as { sender_id?: string };
          // Only refresh if the message is from someone else (incoming message)
          if (newMessage.sender_id !== user.id) {
            debouncedInvalidate();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const updatedMessage = payload.new as { sender_id?: string };
          // Only refresh for read receipts on our sent messages
          if (updatedMessage.sender_id === user.id) {
            debouncedInvalidate();
          }
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

  // Format conversations for display
  const formattedConversations = useMemo(() => {
    return (conversations || []).map(conv => ({
      ...conv,
      time: formatTimeAgo(conv.lastMessageTime),
    }));
  }, [conversations]);

  // Total unread count
  const totalUnread = useMemo(() => {
    return (conversations || []).reduce((sum, c) => sum + c.unreadCount, 0);
  }, [conversations]);

  return {
    conversations: formattedConversations,
    isLoading,
    totalUnread,
    refetch,
  };
}
