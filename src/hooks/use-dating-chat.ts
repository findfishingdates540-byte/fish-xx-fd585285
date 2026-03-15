import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  is_read: boolean;
  read_at: string | null;
  delivered_at: string | null;
  image_url: string | null;
  audio_url?: string | null;
  reply_to_id: string | null;
  deleted_at: string | null;
  deleted_for_everyone: boolean;
}

interface MatchProfile {
  id: string;
  display_name: string | null;
  photos: string[] | null;
  bio: string | null;
  location_name: string | null;
  preferred_species: string[] | null;
  id_verified?: boolean;
  live_verified?: boolean;
}

export function useDatingChat(matchId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const presenceChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Single optimized query for all chat data with caching
  const { data: chatData, isLoading: loading } = useQuery({
    queryKey: ['dating-chat', matchId],
    queryFn: async () => {
      if (!user?.id || !matchId) return null;

      const { data, error } = await supabase
        .rpc('get_chat_data', { p_user_id: user.id, p_match_id: matchId });

      if (error) throw error;
      if (!data || data.length === 0) return null;

      const row = data[0];
      return {
        matchProfile: {
          id: row.other_user_id,
          display_name: row.display_name,
          photos: row.photos,
          bio: row.bio,
          location_name: row.location_name,
          preferred_species: row.preferred_species,
          id_verified: row.id_verified,
          live_verified: row.live_verified,
        } as MatchProfile,
        messages: (Array.isArray(row.messages) ? row.messages : []) as unknown as Message[],
      };
    },
    enabled: !!user?.id && !!matchId,
    staleTime: 30000, // Cache for 30 seconds
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });

  const messages = chatData?.messages || [];
  const matchProfile = chatData?.matchProfile || null;

  // Mark messages as read/delivered when chat opens
  useEffect(() => {
    if (user && matchId) {
      markMessagesAsDelivered();
      markMessagesAsRead();
    }
  }, [user?.id, matchId]);

  // Setup presence channel for typing indicators
  useEffect(() => {
    if (!matchId || !user || !matchProfile) return;

    const presenceChannel = supabase.channel(`dating-typing-${matchId}`, {
      config: { presence: { key: user.id } }
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const otherUserState = state[matchProfile.id];
        if (otherUserState && otherUserState.length > 0) {
          const latestState = otherUserState[0] as { isTyping?: boolean };
          setIsTyping(latestState.isTyping || false);
        } else {
          setIsTyping(false);
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({ isTyping: false });
        }
      });

    presenceChannelRef.current = presenceChannel;

    return () => {
      supabase.removeChannel(presenceChannel);
    };
  }, [matchId, user?.id, matchProfile?.id]);

  // Subscribe to real-time message updates with immediate subscription
  useEffect(() => {
    if (!matchId || !user) return;

    // Create a unique channel name per mount to avoid stale subscriptions
    const channelName = `dating-messages-${matchId}-${Date.now()}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${matchId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMsg = payload.new as Message;
            // Optimistically update cache, preventing duplicates
            queryClient.setQueryData(['dating-chat', matchId], (old: any) => {
              if (!old) return old;
              // Check if message already exists
              if (old.messages.some((m: Message) => m.id === newMsg.id)) return old;
              return {
                ...old,
                messages: [...old.messages, newMsg],
              };
            });
            if (newMsg.sender_id !== user.id) {
              markMessagesAsRead();
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedMsg = payload.new as Message;
            queryClient.setQueryData(['dating-chat', matchId], (old: any) => {
              if (!old) return old;
              return {
                ...old,
                messages: old.messages.map((msg: Message) =>
                  msg.id === updatedMsg.id ? updatedMsg : msg
                ),
              };
            });
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[DatingChat] Realtime subscription active');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId, user?.id, queryClient]);

  const markMessagesAsRead = async () => {
    if (!user || !matchId) return;
    const now = new Date().toISOString();
    await supabase
      .from('messages')
      .update({ is_read: true, read_at: now })
      .eq('match_id', matchId)
      .neq('sender_id', user.id)
      .eq('is_read', false);
  };

  const markMessagesAsDelivered = async () => {
    if (!user || !matchId) return;
    const now = new Date().toISOString();
    await supabase
      .from('messages')
      .update({ delivered_at: now })
      .eq('match_id', matchId)
      .neq('sender_id', user.id)
      .is('delivered_at', null);
  };

  const updateTypingStatus = useCallback(async (typing: boolean) => {
    if (presenceChannelRef.current) {
      await presenceChannelRef.current.track({ isTyping: typing });
    }
  }, []);

  const handleInputChange = useCallback(() => {
    updateTypingStatus(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => updateTypingStatus(false), 2000);
  }, [updateTypingStatus]);

  const sendMessage = useCallback(async (content: string, imageUrl?: string, audioUrl?: string, replyToId?: string) => {
    if (!user || !matchId || sending || !matchProfile) return;
    if (!content.trim() && !imageUrl && !audioUrl) return;

    updateTypingStatus(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    setSending(true);
    const currentReplyTo = replyingTo;
    setReplyingTo(null);

    const { error } = await supabase
      .from('messages')
      .insert({
        match_id: matchId,
        sender_id: user.id,
        content: content.trim(),
        image_url: imageUrl || null,
        audio_url: audioUrl || null,
        reply_to_id: replyToId || currentReplyTo?.id || null
      });

    if (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      setReplyingTo(currentReplyTo);
    } else {
      sendPushNotification(matchProfile.id, content);
    }
    setSending(false);
  }, [user, matchId, sending, matchProfile, updateTypingStatus, replyingTo]);

  const sendPushNotification = async (recipientId: string, messageContent: string) => {
    try {
      const { data: senderProfile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user?.id)
        .maybeSingle();

      const senderName = senderProfile?.display_name || 'Your match';
      
      let notificationBody = messageContent;
      if (notificationBody.length > 50) {
        notificationBody = notificationBody.substring(0, 47) + '...';
      }

      await supabase.functions.invoke('send-push-notification', {
        body: {
          userId: recipientId,
          title: `New message from ${senderName}`,
          body: notificationBody,
          url: `/app/messages/${matchId}`,
          tag: `dating-message-${matchId}`
        }
      });
    } catch (error) {
      console.log('Push notification failed (non-critical):', error);
    }
  };

  const deleteMessage = async (messageId: string, deleteForEveryone: boolean) => {
    if (!user || !deleteForEveryone) return;
    
    const { error } = await supabase
      .from('messages')
      .update({ 
        deleted_at: new Date().toISOString(),
        deleted_for_everyone: true 
      })
      .eq('id', messageId)
      .eq('sender_id', user.id);
    
    if (error) throw error;
  };

  // Format messages for display
  const formattedMessages = useMemo(() => {
    return messages.map(msg => ({
      id: msg.id,
      content: msg.content,
      senderId: msg.sender_id,
      timestamp: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: msg.is_read,
      readAt: msg.read_at,
      deliveredAt: msg.delivered_at,
      imageUrl: msg.image_url,
      audioUrl: msg.audio_url,
      createdAt: msg.created_at,
      replyToId: msg.reply_to_id,
      deletedAt: msg.deleted_at,
      deletedForEveryone: msg.deleted_for_everyone,
    }));
  }, [messages]);

  const getReplyMessage = useCallback((replyToId: string | null) => {
    if (!replyToId) return null;
    return messages.find(m => m.id === replyToId) || null;
  }, [messages]);

  return {
    messages: formattedMessages,
    rawMessages: messages,
    matchProfile,
    loading,
    sending,
    isTyping,
    replyingTo,
    setReplyingTo,
    getReplyMessage,
    sendMessage,
    deleteMessage,
    handleInputChange,
    refetch: () => queryClient.invalidateQueries({ queryKey: ['dating-chat', matchId] }),
  };
}
