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
  image_url: string | null;
}

interface MatchProfile {
  id: string;
  display_name: string | null;
  photos: string[] | null;
  bio: string | null;
  location_name: string | null;
  preferred_species: string[] | null;
}

export function useDatingChat(matchId: string | undefined) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [matchProfile, setMatchProfile] = useState<MatchProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const presenceChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Fetch chat data
  useEffect(() => {
    if (user && matchId) {
      fetchChatData();
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

  const fetchChatData = async () => {
    if (!user || !matchId) return;
    setLoading(true);

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

      // Get the other user's profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, display_name, photos, bio, location_name, preferred_species')
        .eq('id', otherUserId)
        .maybeSingle();

      if (profileError) throw profileError;
      setMatchProfile(profile);

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
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('match_id', matchId)
      .neq('sender_id', user.id)
      .eq('is_read', false);
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

  const sendMessage = useCallback(async (content: string, imageUrl?: string, audioUrl?: string) => {
    if (!user || !matchId || sending || !matchProfile) return;
    if (!content.trim() && !imageUrl && !audioUrl) return;

    updateTypingStatus(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    setSending(true);

    const { error } = await supabase
      .from('messages')
      .insert({
        match_id: matchId,
        sender_id: user.id,
        content: content.trim(),
        image_url: imageUrl || null,
        audio_url: audioUrl || null
      });

    if (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } else {
      // Send push notification (fire and forget)
      sendPushNotification(matchProfile.id, content);
    }
    setSending(false);
  }, [user, matchId, sending, matchProfile, updateTypingStatus]);

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

  // Format message for display
  const formattedMessages = useMemo(() => {
    return messages.map(msg => ({
      id: msg.id,
      content: msg.content,
      senderId: msg.sender_id,
      timestamp: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isRead: msg.is_read,
      imageUrl: msg.image_url,
      audioUrl: (msg as any).audio_url,
    }));
  }, [messages]);

  return {
    messages: formattedMessages,
    rawMessages: messages,
    matchProfile,
    loading,
    sending,
    isTyping,
    sendMessage,
    handleInputChange,
    refetch: fetchChatData,
  };
}
