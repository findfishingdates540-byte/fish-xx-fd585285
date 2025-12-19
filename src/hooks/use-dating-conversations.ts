import { useState, useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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

  // Fetch all matches with their profiles and latest messages
  const { data: conversations, isLoading, refetch } = useQuery({
    queryKey: ['dating-conversations', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get all mutual matches
      const { data: matches, error: matchError } = await supabase
        .from('matches')
        .select('id, user1_id, user2_id, matched_at')
        .eq('is_match', true)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('matched_at', { ascending: false });

      if (matchError) throw matchError;
      if (!matches || matches.length === 0) return [];

      // Get other user IDs
      const otherUserIds = matches.map(m => 
        m.user1_id === user.id ? m.user2_id : m.user1_id
      );

      // Fetch profiles
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, display_name, photos')
        .in('id', otherUserIds);

      if (profileError) throw profileError;

      // Fetch latest message for each match
      const conversationPromises = matches.map(async (match) => {
        const otherUserId = match.user1_id === user.id ? match.user2_id : match.user1_id;
        const profile = profiles?.find(p => p.id === otherUserId);

        // Get latest message
        const { data: latestMsg } = await supabase
          .from('messages')
          .select('content, created_at, sender_id, is_read')
          .eq('match_id', match.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        // Get unread count
        const { count } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('match_id', match.id)
          .eq('is_read', false)
          .neq('sender_id', user.id);

        return {
          id: match.id,
          matchedUserId: otherUserId,
          name: profile?.display_name || 'Anonymous',
          photo: profile?.photos?.[0] || '',
          lastMessage: latestMsg?.content || null,
          lastMessageTime: latestMsg?.created_at || match.matched_at,
          unreadCount: count || 0,
        } as DatingConversation;
      });

      const results = await Promise.all(conversationPromises);
      
      // Sort by last message time
      return results.sort((a, b) => {
        const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
        const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
        return timeB - timeA;
      });
    },
    enabled: !!user?.id,
  });

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
        () => {
          // Refetch conversations when a new message arrives
          queryClient.invalidateQueries({ queryKey: ['dating-conversations', user.id] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
        },
        () => {
          // Refetch when messages are marked as read
          queryClient.invalidateQueries({ queryKey: ['dating-conversations', user.id] });
        }
      )
      .subscribe();

    return () => {
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
