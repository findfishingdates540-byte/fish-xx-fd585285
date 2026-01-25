import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  const [messages, setMessages] = useState<Message[]>([]);
  const [matchProfile, setMatchProfile] = useState<MatchProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const presenceChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const previousMatchIdRef = useRef<string | undefined>(undefined);

  // Fetch chat data - only show loading skeleton on initial load, not when switching convos
  useEffect(() => {
    if (user && matchId) {
      const isInitialLoad = previousMatchIdRef.current === undefined;
      
      if (isInitialLoad) {
        setLoading(true);
      }
      
      previousMatchIdRef.current = matchId;
      fetchChatData(!isInitialLoad);
      markMessagesAsDelivered();
      markMessagesAsRead();
    }
  }, [user, matchId]);

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

  // Subscribe to messages
  useEffect(() => {
    if (!matchId || !user) return;

    const channel = supabase
      .channel(`dating-messages-${matchId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${matchId}`
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages(prev => [...prev, newMsg]);
          if (newMsg.sender_id !== user.id) {
            markMessagesAsRead();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${matchId}`
        },
        (payload) => {
          const updatedMsg = payload.new as Message;
          setMessages(prev => prev.map(msg => 
            msg.id === updatedMsg.id ? updatedMsg : msg
          ));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [matchId, user?.id]);

  const fetchChatData = async (skipLoadingState = false) => {
    if (!user || !matchId) return;
    if (!skipLoadingState) setLoading(true);

    try {
      // Get match record to find the other user
      const { data: match, error: matchError } = await supabase
        .from('matches')
        .select('user1_id, user2_id')
        .eq('id', matchId)
        .maybeSingle();

      if (matchError) throw matchError;
      if (!match) {
        setLoading(false);
        return;
      }

      const otherUserId = match.user1_id === user.id ? match.user2_id : match.user1_id;

      // Get the other user's profile using public_profiles view for privacy
      const { data: profile, error: profileError } = await supabase
        .from('public_profiles')
        .select('id, display_name, photos, bio, location_name, preferred_species, id_verified, live_verified')
        .eq('id', otherUserId)
        .maybeSingle();

      if (profileError) throw profileError;
      setMatchProfile(profile as MatchProfile);

      // Get messages
      const { data: msgs, error: msgsError } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true });

      if (msgsError) throw msgsError;
      setMessages(msgs || []);
    } catch (error) {
      console.error('Error fetching chat data:', error);
    } finally {
      setLoading(false);
    }
  };

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

  // Mark messages as delivered when the chat is opened
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
      // Send push notification (fire and forget)
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

  // Delete message for everyone
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

  // Format message for display
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
      audioUrl: (msg as any).audio_url,
      createdAt: msg.created_at,
      replyToId: msg.reply_to_id,
      deletedAt: msg.deleted_at,
      deletedForEveryone: msg.deleted_for_everyone,
    }));
  }, [messages]);

  // Get the replied message content for display
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
    refetch: fetchChatData,
  };
}
