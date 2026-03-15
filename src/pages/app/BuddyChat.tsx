import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Lightbox } from '@/components/ui/lightbox';
import { ArrowLeft, Send, Fish, MapPin, Image as ImageIcon, Plus, Scale, Ruler, Reply, Trash2, Mic, Square, X, Loader2, Phone, Video } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOnlineStatus, formatLastSeen, isRecentlyActive } from '@/hooks/use-online-presence';
import { useBuddyMessageReactions } from '@/hooks/use-buddy-message-reactions';
import { useVoiceRecorder } from '@/hooks/use-voice-recorder';
import { MessageReactions, MessageStatusIndicator, QuotedMessage, ReplyPreview, SwipeableMessage, DeleteMessageDialog, DeletedMessagePlaceholder, VoiceMessagePlayer, WaveformVisualizer } from '@/components/chat';
import { useCall } from '@/components/call';
import { toast } from 'sonner';
import { VerificationBadge } from '@/components/ui/verification-badge';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  is_read: boolean;
  read_at: string | null;
  delivered_at: string | null;
  image_url: string | null;
  audio_url: string | null;
  reply_to_id: string | null;
  deleted_at: string | null;
  deleted_for_everyone: boolean;
}

interface BuddyProfile {
  id: string;
  display_name: string | null;
  photos: string[] | null;
  id_verified?: boolean;
  live_verified?: boolean;
}

interface FishingSpot {
  id: string;
  name: string;
  location_name: string | null;
  photos: string[] | null;
}

interface Catch {
  id: string;
  species_name: string | null;
  weight_lbs: number | null;
  length_in: number | null;
  photos: string[] | null;
  caught_at: string | null;
}

// Message content parsing
const parseMessageContent = (content: string) => {
  const spotMatch = content.match(/^\[SPOT:([a-f0-9-]+)\](.*)$/s);
  if (spotMatch) {
    return { type: 'spot' as const, spotId: spotMatch[1], text: spotMatch[2].trim() };
  }
  
  const catchMatch = content.match(/^\[CATCH:([a-f0-9-]+)\](.*)$/s);
  if (catchMatch) {
    return { type: 'catch' as const, catchId: catchMatch[1], text: catchMatch[2].trim() };
  }
  
  return { type: 'text' as const, text: content };
};

export default function BuddyChat() {
  const { buddyId } = useParams<{ buddyId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [buddyProfile, setBuddyProfile] = useState<BuddyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showSpotPicker, setShowSpotPicker] = useState(false);
  const [showCatchPicker, setShowCatchPicker] = useState(false);
  const [spots, setSpots] = useState<FishingSpot[]>([]);
  const [catches, setCatches] = useState<Catch[]>([]);
  const [sharedSpots, setSharedSpots] = useState<Record<string, FishingSpot>>({});
  const [sharedCatches, setSharedCatches] = useState<Record<string, Catch>>({});
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [messageToDelete, setMessageToDelete] = useState<Message | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  // Track deleted messages for "delete for me" (local only)
  const [locallyDeletedIds, setLocallyDeletedIds] = useState<Set<string>>(new Set());
  // Image upload state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const presenceChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Voice recorder hook
  const { isRecording, recordingDuration, audioLevels, startRecording, stopRecording, cancelRecording } = useVoiceRecorder();

  // Message reactions hook
  const { getReactionSummary, toggleReaction } = useBuddyMessageReactions(buddyId);
  
  // Call functionality
  const { startCall } = useCall();
  const callChannelName = buddyId ? `buddy_${buddyId}` : '';
  
  const handleVoiceCall = () => {
    if (buddyProfile) {
      startCall(buddyProfile.id, buddyProfile.display_name || 'Buddy', buddyProfile.photos?.[0], callChannelName, 'voice');
    }
  };
  
  const handleVideoCall = () => {
    if (buddyProfile) {
      startCall(buddyProfile.id, buddyProfile.display_name || 'Buddy', buddyProfile.photos?.[0], callChannelName, 'video');
    }
  };

  // Track buddy's online status
  const buddyUserIds = useMemo(() => 
    buddyProfile ? [buddyProfile.id] : [], 
    [buddyProfile?.id]
  );
  const { isOnline, getLastSeen } = useOnlineStatus(buddyUserIds);
  const isBuddyOnline = buddyProfile ? isOnline(buddyProfile.id) : false;
  const buddyLastSeen = buddyProfile ? getLastSeen(buddyProfile.id) : null;

  useEffect(() => {
    if (user && buddyId) {
      fetchChatData();
      markMessagesAsDelivered();
      markMessagesAsRead();
    }
  }, [user, buddyId]);

  // Setup presence channel for typing indicators
  useEffect(() => {
    if (!buddyId || !user || !buddyProfile) return;

    const presenceChannel = supabase.channel(`buddy-typing-${buddyId}`, {
      config: { presence: { key: user.id } }
    });

    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const buddyState = state[buddyProfile.id];
        if (buddyState && buddyState.length > 0) {
          const latestState = buddyState[0] as { isTyping?: boolean };
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
  }, [buddyId, user?.id, buddyProfile?.id]);

  // Subscribe to messages with immediate subscription
  useEffect(() => {
    if (!buddyId || !user) return;

    // Create a unique channel name per mount to avoid stale subscriptions
    const channelName = `buddy-messages-${buddyId}-${Date.now()}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'buddy_messages',
          filter: `buddy_id=eq.${buddyId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMsg = payload.new as Message;
            setMessages(prev => {
              // Prevent duplicates
              if (prev.some(m => m.id === newMsg.id)) return prev;
              return [...prev, newMsg];
            });
            fetchSharedContent([newMsg]);
            if (newMsg.sender_id !== user.id) {
              markMessagesAsDelivered();
              markMessagesAsRead();
            }
          } else if (payload.eventType === 'UPDATE') {
            const updatedMsg = payload.new as Message;
            setMessages(prev => prev.map(msg => 
              msg.id === updatedMsg.id ? updatedMsg : msg
            ));
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[BuddyChat] Realtime subscription active');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [buddyId, user?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchSharedContent = async (msgs: Message[]) => {
    const spotIds: string[] = [];
    const catchIds: string[] = [];

    msgs.forEach(msg => {
      const parsed = parseMessageContent(msg.content);
      if (parsed.type === 'spot' && !sharedSpots[parsed.spotId]) {
        spotIds.push(parsed.spotId);
      }
      if (parsed.type === 'catch' && !sharedCatches[parsed.catchId]) {
        catchIds.push(parsed.catchId);
      }
    });

    if (spotIds.length > 0) {
      const { data } = await supabase
        .from('fishing_spots')
        .select('id, name, location_name, photos')
        .in('id', spotIds);
      
      if (data) {
        const spotsMap: Record<string, FishingSpot> = {};
        data.forEach(s => { spotsMap[s.id] = s; });
        setSharedSpots(prev => ({ ...prev, ...spotsMap }));
      }
    }

    if (catchIds.length > 0) {
      const { data } = await supabase
        .from('catches')
        .select('id, species_name, weight_lbs, length_in, photos, caught_at')
        .in('id', catchIds);
      
      if (data) {
        const catchesMap: Record<string, Catch> = {};
        data.forEach(c => { catchesMap[c.id] = c; });
        setSharedCatches(prev => ({ ...prev, ...catchesMap }));
      }
    }
  };

  const fetchChatData = async () => {
    if (!user || !buddyId) return;
    setLoading(true);

    try {
      const { data: buddy } = await supabase
        .from('fishing_buddies')
        .select('requester_id, recipient_id')
        .eq('id', buddyId)
        .single();

      if (!buddy) {
        navigate('/app/buddy-messages');
        return;
      }

      const otherUserId = buddy.requester_id === user.id ? buddy.recipient_id : buddy.requester_id;

      const { data: profile } = await supabase
        .from('public_profiles')
        .select('id, display_name, photos, id_verified, live_verified')
        .eq('id', otherUserId)
        .single();

      setBuddyProfile(profile);

      const { data: msgs } = await supabase
        .from('buddy_messages')
        .select('*')
        .eq('buddy_id', buddyId)
        .order('created_at', { ascending: true });

      setMessages(msgs || []);
      if (msgs) {
        fetchSharedContent(msgs);
      }
    } catch (error) {
      console.error('Error fetching chat data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserSpots = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('fishing_spots')
      .select('id, name, location_name, photos')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false });
    setSpots(data || []);
  };

  const fetchUserCatches = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('catches')
      .select('id, species_name, weight_lbs, length_in, photos, caught_at')
      .eq('user_id', user.id)
      .order('caught_at', { ascending: false });
    setCatches(data || []);
  };

  const markMessagesAsRead = async () => {
    if (!user || !buddyId) return;
    const now = new Date().toISOString();
    await supabase
      .from('buddy_messages')
      .update({ is_read: true, read_at: now })
      .eq('buddy_id', buddyId)
      .neq('sender_id', user.id)
      .eq('is_read', false);
  };

  // Mark messages as delivered when the chat is opened
  const markMessagesAsDelivered = async () => {
    if (!user || !buddyId) return;
    const now = new Date().toISOString();
    await supabase
      .from('buddy_messages')
      .update({ delivered_at: now })
      .eq('buddy_id', buddyId)
      .neq('sender_id', user.id)
      .is('delivered_at', null);
  };

  const handleDeleteMessage = async (deleteForEveryone: boolean) => {
    if (!messageToDelete || !user) return;
    
    setIsDeleting(true);
    try {
      if (deleteForEveryone) {
        // Soft delete for everyone - update the database
        const { error } = await supabase
          .from('buddy_messages')
          .update({ 
            deleted_at: new Date().toISOString(),
            deleted_for_everyone: true 
          })
          .eq('id', messageToDelete.id)
          .eq('sender_id', user.id);
        
        if (error) throw error;
        toast.success('Message deleted for everyone');
      } else {
        // Delete for me only - just hide locally
        setLocallyDeletedIds(prev => new Set([...prev, messageToDelete.id]));
        toast.success('Message deleted');
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      toast.error('Failed to delete message');
    } finally {
      setIsDeleting(false);
      setMessageToDelete(null);
    }
  };

  const updateTypingStatus = useCallback(async (typing: boolean) => {
    if (presenceChannelRef.current) {
      await presenceChannelRef.current.track({ isTyping: typing });
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    updateTypingStatus(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => updateTypingStatus(false), 2000);
  };

  const sendMessage = async (content?: string, imageUrl?: string, audioUrl?: string) => {
    if (!user || !buddyId || sending || !buddyProfile) return;
    const msgContent = content || newMessage.trim();
    if (!msgContent && !imageUrl && !audioUrl) return;

    updateTypingStatus(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    setSending(true);
    setNewMessage('');
    const currentReplyTo = replyingTo;
    setReplyingTo(null);

    const { error } = await supabase
      .from('buddy_messages')
      .insert({
        buddy_id: buddyId,
        sender_id: user.id,
        content: msgContent || (audioUrl ? '🎤 Voice message' : '📷 Photo'),
        image_url: imageUrl || null,
        audio_url: audioUrl || null,
        reply_to_id: currentReplyTo?.id || null
      });

    if (error) {
      console.error('Error sending message:', error);
      if (!content) setNewMessage(msgContent);
      setReplyingTo(currentReplyTo);
    } else {
      // Send push notification to buddy (fire and forget)
      sendPushNotification(buddyProfile.id, msgContent || (audioUrl ? '🎤 Voice message' : '📷 Photo'));
    }
    setSending(false);
  };

  // Image handling functions
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const clearSelectedImage = () => {
    setSelectedImage(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
      setImagePreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${user?.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('buddy-chat-media')
      .upload(fileName, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return null;
    }

    const { data } = supabase.storage
      .from('buddy-chat-media')
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const uploadAudio = async (blob: Blob): Promise<string | null> => {
    const fileName = `${user?.id}/voice_${Date.now()}.webm`;

    const { error: uploadError } = await supabase.storage
      .from('buddy-chat-media')
      .upload(fileName, blob, { contentType: blob.type });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return null;
    }

    const { data } = supabase.storage
      .from('buddy-chat-media')
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const handleSend = async () => {
    if (!newMessage.trim() && !selectedImage) return;

    let imageUrl: string | undefined;

    if (selectedImage) {
      setUploading(true);
      const uploadedUrl = await uploadImage(selectedImage);
      if (!uploadedUrl) {
        toast.error('Failed to upload image');
        setUploading(false);
        return;
      }
      imageUrl = uploadedUrl;
      clearSelectedImage();
      setUploading(false);
    }

    sendMessage(newMessage.trim() || undefined, imageUrl);
    setNewMessage('');
  };

  const handleVoiceRecord = async () => {
    if (isRecording) {
      setUploading(true);
      const audioBlob = await stopRecording();
      
      if (audioBlob) {
        const audioUrl = await uploadAudio(audioBlob);
        if (audioUrl) {
          sendMessage(undefined, undefined, audioUrl);
        } else {
          toast.error('Failed to upload voice message');
        }
      }
      setUploading(false);
    } else {
      try {
        await startRecording();
      } catch (error) {
        toast.error('Could not access microphone');
      }
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const sendPushNotification = async (recipientId: string, messageContent: string) => {
    try {
      // Get sender's display name
      const { data: senderProfile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', user?.id)
        .single();

      const senderName = senderProfile?.display_name || 'Your fishing buddy';
      
      // Parse message to create appropriate notification body
      const parsed = parseMessageContent(messageContent);
      let notificationBody = parsed.text || messageContent;
      if (parsed.type === 'spot') {
        notificationBody = '📍 Shared a fishing spot with you';
      } else if (parsed.type === 'catch') {
        notificationBody = '🐟 Shared a catch with you';
      }
      if (notificationBody.length > 50) {
        notificationBody = notificationBody.substring(0, 47) + '...';
      }

      await supabase.functions.invoke('send-push-notification', {
        body: {
          userId: recipientId,
          title: `New message from ${senderName}`,
          body: notificationBody,
          url: `/app/buddy-chat/${buddyId}`,
          tag: `buddy-message-${buddyId}`
        }
      });
    } catch (error) {
      console.log('Push notification failed (non-critical):', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const shareSpot = (spot: FishingSpot) => {
    setSharedSpots(prev => ({ ...prev, [spot.id]: spot }));
    sendMessage(`[SPOT:${spot.id}]Check out this fishing spot!`);
    setShowSpotPicker(false);
  };

  const shareCatch = (catchItem: Catch) => {
    setSharedCatches(prev => ({ ...prev, [catchItem.id]: catchItem }));
    sendMessage(`[CATCH:${catchItem.id}]Check out my catch!`, catchItem.photos?.[0] || undefined);
    setShowCatchPicker(false);
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const groupMessagesByDate = (msgs: Message[]) => {
    const groups: { date: string; messages: Message[] }[] = [];
    let currentDate = '';
    msgs.forEach(msg => {
      const msgDate = formatDate(msg.created_at);
      if (msgDate !== currentDate) {
        currentDate = msgDate;
        groups.push({ date: msgDate, messages: [msg] });
      } else {
        groups[groups.length - 1].messages.push(msg);
      }
    });
    return groups;
  };

  const renderMessageContent = (msg: Message) => {
    const parsed = parseMessageContent(msg.content);
    const isOwn = msg.sender_id === user?.id;

    if (parsed.type === 'spot') {
      const spot = sharedSpots[parsed.spotId];
      return (
        <div className="space-y-2">
          {spot ? (
            <button
              onClick={() => navigate(`/app/spots/${spot.id}`)}
              className={cn(
                "block w-full text-left rounded-lg overflow-hidden border",
                isOwn ? "border-primary-foreground/20" : "border-border"
              )}
            >
              {spot.photos?.[0] && (
                <img src={spot.photos[0]} alt={spot.name} className="w-full h-24 object-cover" />
              )}
              <div className="p-2">
                <p className="font-medium text-sm">{spot.name}</p>
                {spot.location_name && (
                  <p className={cn("text-xs flex items-center gap-1", isOwn ? "text-primary-foreground/70" : "text-muted-foreground")}>
                    <MapPin className="w-3 h-3" />
                    {spot.location_name}
                  </p>
                )}
              </div>
            </button>
          ) : (
            <div className="p-2 bg-muted/50 rounded text-sm">Loading spot...</div>
          )}
          {parsed.text && <span className="break-words block mt-1">{parsed.text}</span>}
        </div>
      );
    }

    if (parsed.type === 'catch') {
      const catchItem = sharedCatches[parsed.catchId];
      return (
        <div className="space-y-2">
          {msg.image_url && (
            <img src={msg.image_url} alt="Catch" className="rounded-lg max-w-full" />
          )}
          {catchItem ? (
            <div className={cn("rounded-lg p-2", isOwn ? "bg-primary-foreground/10" : "bg-muted/50")}>
              <p className="font-medium text-sm flex items-center gap-1">
                <Fish className="w-4 h-4" />
                {catchItem.species_name || 'Unknown species'}
              </p>
              <div className={cn("flex gap-3 text-xs mt-1", isOwn ? "text-primary-foreground/70" : "text-muted-foreground")}>
                {catchItem.weight_lbs && (
                  <span className="flex items-center gap-1">
                    <Scale className="w-3 h-3" />
                    {catchItem.weight_lbs} lbs
                  </span>
                )}
                {catchItem.length_in && (
                  <span className="flex items-center gap-1">
                    <Ruler className="w-3 h-3" />
                    {catchItem.length_in} in
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="p-2 bg-muted/50 rounded text-sm">Loading catch...</div>
          )}
          {parsed.text && <span className="break-words block mt-1">{parsed.text}</span>}
        </div>
      );
    }

    // Voice message
    if (msg.audio_url) {
      return (
        <VoiceMessagePlayer audioUrl={msg.audio_url} isMine={isOwn} />
      );
    }

    return (
      <>
        {msg.image_url && (
          <img 
            src={msg.image_url} 
            alt="Shared" 
            className="rounded-lg max-w-[200px] max-h-[200px] object-cover mb-2 cursor-pointer hover:opacity-90 transition-opacity"
            onClick={() => {
              setLightboxImage(msg.image_url!);
              setLightboxOpen(true);
            }}
          />
        )}
        {parsed.text && <span className="break-words">{parsed.text}</span>}
      </>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const messageGroups = groupMessagesByDate(messages);

  // Detect if we're in the inline/nested context (desktop split view)
  const isInline = window.location.pathname.includes('/buddy-messages/');

  return (
    <motion.div 
      className={cn(
        "flex flex-col bg-background",
        isInline ? "h-full flex-1" : "h-[100dvh]"
      )}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
    >
      {/* Header */}
      <motion.div 
        className="flex items-center gap-3 p-4 border-b border-border"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.05 }}
      >
        {!isInline && (
          <Button variant="ghost" size="icon" onClick={() => navigate('/app/buddy-messages')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
        )}
        <Link to={`/app/profile/${buddyProfile?.id}`} className="relative">
          <Avatar className="h-10 w-10">
            <AvatarImage src={buddyProfile?.photos?.[0]} className="object-cover" />
            <AvatarFallback>{buddyProfile?.display_name?.charAt(0)?.toUpperCase() || '?'}</AvatarFallback>
          </Avatar>
          {/* Status indicator */}
          <span className={cn(
            "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background",
            isBuddyOnline ? "bg-green-500" : 
            isRecentlyActive(buddyLastSeen) ? "bg-yellow-500" :
            "bg-muted-foreground/30"
          )} />
        </Link>
        <Link to={`/app/profile/${buddyProfile?.id}`} className="flex-1">
          <h2 className="font-semibold flex items-center gap-1">
            {buddyProfile?.display_name || 'Anonymous'}
            <VerificationBadge 
              idVerified={buddyProfile?.id_verified} 
              liveVerified={buddyProfile?.live_verified} 
              size="sm" 
            />
          </h2>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            {isTyping ? (
              <span className="text-primary animate-pulse">typing...</span>
            ) : isBuddyOnline ? (
              <span className="text-green-500">Online</span>
            ) : isRecentlyActive(buddyLastSeen) ? (
              <span className="text-yellow-600">Active now</span>
            ) : buddyLastSeen ? (
              <span>{formatLastSeen(buddyLastSeen)}</span>
            ) : (
              <><Fish className="w-3 h-3" />Fishing Buddy</>
            )}
          </p>
        </Link>
        
        {/* Call buttons */}
        <div className="flex items-center gap-1">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={handleVoiceCall}
            disabled={!buddyProfile}
          >
            <Phone className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={handleVideoCall}
            disabled={!buddyProfile}
          >
            <Video className="h-4 w-4" />
          </Button>
        </div>
      </motion.div>

      {/* Messages */}
      <motion.div 
        className="flex-1 overflow-y-auto p-4 space-y-4"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {messages.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Fish className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No messages yet</p>
            <p className="text-sm">Start planning your next fishing trip!</p>
          </div>
        ) : (
          messageGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="space-y-2">
              <div className="flex justify-center">
                <span className="text-xs text-muted-foreground bg-muted px-3 py-1 rounded-full">{group.date}</span>
              </div>
              <AnimatePresence mode="popLayout">
                {group.messages.map((msg, msgIndex) => {
                  const isMine = msg.sender_id === user?.id;
                  const repliedMessage = msg.reply_to_id ? messages.find(m => m.id === msg.reply_to_id) : null;
                  const repliedSenderName = repliedMessage?.sender_id === user?.id 
                    ? 'You' 
                    : buddyProfile?.display_name || 'Buddy';
                  
                  // Skip locally deleted messages
                  if (locallyDeletedIds.has(msg.id)) return null;
                  
                  // Check if message was deleted for everyone
                  const isDeletedForEveryone = msg.deleted_for_everyone && msg.deleted_at;

                  return (
                    <SwipeableMessage
                      key={msg.id}
                      onReply={() => !isDeletedForEveryone && setReplyingTo(msg)}
                      isMine={isMine}
                    >
                      <motion.div 
                        className={cn("flex group w-full", isMine ? "justify-end" : "justify-start")}
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ 
                          duration: 0.2, 
                          ease: [0.25, 0.1, 0.25, 1],
                          delay: msgIndex * 0.02 
                        }}
                        layout
                      >
                        {/* Action buttons on left for received messages - desktop only */}
                        {!isMine && !isDeletedForEveryone && (
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => setReplyingTo(msg)}
                              className="p-1.5 rounded-full hover:bg-muted hidden md:block"
                            >
                              <Reply className="w-4 h-4 text-muted-foreground" />
                            </button>
                            <button
                              onClick={() => setMessageToDelete(msg)}
                              className="p-1.5 rounded-full hover:bg-muted hidden md:block"
                            >
                              <Trash2 className="w-4 h-4 text-muted-foreground" />
                            </button>
                          </div>
                        )}
                        
                        {isDeletedForEveryone ? (
                          <DeletedMessagePlaceholder isMine={isMine} timestamp={formatTime(msg.created_at)} />
                        ) : (
                          <div 
                            className={cn(
                              "max-w-[70%] rounded-2xl px-3 py-1.5 relative",
                              isMine ? "bg-primary text-primary-foreground" : "bg-muted"
                            )}
                            onContextMenu={(e) => {
                              e.preventDefault();
                              setMessageToDelete(msg);
                            }}
                          >
                            {/* Quoted message */}
                            {repliedMessage && !repliedMessage.deleted_for_everyone && (
                              <QuotedMessage
                                senderName={repliedSenderName}
                                content={repliedMessage.content}
                                isMine={isMine}
                                isOwnQuote={repliedMessage.sender_id === user?.id}
                              />
                            )}
                            
                            <div className="inline">
                              {renderMessageContent(msg)}
                              {/* Invisible spacer to reserve space for timestamp */}
                              <span className="invisible text-xs ml-2 inline-flex items-center gap-1">
                                {formatTime(msg.created_at)}
                                {isMine && <span>✓✓</span>}
                              </span>
                            </div>
                            
                            {/* Actual timestamp positioned at bottom-right */}
                            <span className={cn(
                              "absolute bottom-1.5 right-3 text-xs flex items-center gap-1",
                              isMine ? "text-primary-foreground/70" : "text-muted-foreground"
                            )}>
                              {formatTime(msg.created_at)}
                              {isMine && (
                                <MessageStatusIndicator 
                                  status={msg.is_read ? 'read' : msg.delivered_at ? 'delivered' : 'sent'} 
                                  readAt={msg.read_at}
                                  className={isMine ? 'text-primary-foreground/70' : ''}
                                />
                              )}
                            </span>
                          </div>
                        )}
                        
                        {/* Action buttons on right for own messages - desktop only */}
                        {isMine && !isDeletedForEveryone && (
                          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => setMessageToDelete(msg)}
                              className="p-1.5 rounded-full hover:bg-muted hidden md:block"
                            >
                              <Trash2 className="w-4 h-4 text-muted-foreground" />
                            </button>
                            <button
                              onClick={() => setReplyingTo(msg)}
                              className="p-1.5 rounded-full hover:bg-muted hidden md:block"
                            >
                              <Reply className="w-4 h-4 text-muted-foreground" />
                            </button>
                          </div>
                        )}
                      </motion.div>
                    </SwipeableMessage>
                  );
                })}
              </AnimatePresence>
              
              {/* Reactions for the last message in group */}
              {group.messages.map((msg) => {
                const isMine = msg.sender_id === user?.id;
                const reactions = getReactionSummary(msg.id);
                if (reactions.length === 0) return null;
                return (
                  <div key={`reactions-${msg.id}`} className={cn("flex", isMine ? "justify-end pr-2" : "justify-start pl-2")}>
                    <MessageReactions
                      messageId={msg.id}
                      reactions={reactions}
                      onToggleReaction={toggleReaction}
                      isMine={isMine}
                    />
                  </div>
                );
              })}
            </div>
          ))
        )}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-2xl px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </motion.div>

      {/* Input */}
      <div className="border-t">
        {/* Reply Preview */}
        {replyingTo && (
          <ReplyPreview
            senderName={replyingTo.sender_id === user?.id ? 'You' : buddyProfile?.display_name || 'Buddy'}
            content={replyingTo.content}
            onCancel={() => setReplyingTo(null)}
          />
        )}
        
        {/* Image Preview */}
        {imagePreview && (
          <div className="px-4 pt-3">
            <div className="relative inline-block">
              <img 
                src={imagePreview} 
                alt="Preview" 
                className="max-h-32 rounded-lg object-cover"
              />
              <button
                onClick={clearSelectedImage}
                className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          </div>
        )}
        
        {/* Voice Recording UI */}
        {isRecording && (
          <div className="px-4 pt-3 flex items-center gap-3">
            <div className="flex items-center gap-2 text-destructive">
              <div className="w-3 h-3 bg-destructive rounded-full animate-pulse" />
              <span className="text-sm font-medium">{formatDuration(recordingDuration)}</span>
            </div>
            <WaveformVisualizer 
              levels={audioLevels} 
              isPlaying={isRecording}
              className="flex-1"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={cancelRecording}
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        
        <div className="p-4">
          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
            className="hidden"
          />
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowShareMenu(!showShareMenu)}
              className="shrink-0"
              disabled={isRecording || uploading}
            >
              <Plus className="w-4 h-4" />
            </Button>
            
            {!isRecording && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => fileInputRef.current?.click()}
                  className="shrink-0"
                  disabled={uploading}
                >
                  <ImageIcon className="w-5 h-5" />
                </Button>
                
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={handleInputChange}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  className="flex-1"
                  disabled={uploading}
                />
              </>
            )}
            
            {isRecording ? (
              <Button 
                onClick={handleVoiceRecord} 
                disabled={uploading}
                size="icon"
                className="bg-destructive hover:bg-destructive/90"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Square className="w-4 h-4" />}
              </Button>
            ) : (
              <>
                {(newMessage.trim() || selectedImage) ? (
                  <Button onClick={handleSend} disabled={uploading} size="icon">
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleVoiceRecord}
                    disabled={uploading}
                  >
                    <Mic className="w-5 h-5" />
                  </Button>
                )}
              </>
            )}
          </div>
        
        {showShareMenu && !isRecording && (
          <div className="flex gap-2 mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => { fetchUserSpots(); setShowSpotPicker(true); setShowShareMenu(false); }}
              className="flex items-center gap-2"
            >
              <MapPin className="w-4 h-4" />
              Share Spot
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { fetchUserCatches(); setShowCatchPicker(true); setShowShareMenu(false); }}
              className="flex items-center gap-2"
            >
              <Fish className="w-4 h-4" />
              Share Catch
            </Button>
          </div>
        )}
        </div>
      </div>

      {/* Spot Picker Dialog */}
      <Dialog open={showSpotPicker} onOpenChange={setShowSpotPicker}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share a Fishing Spot</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            {spots.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No spots to share yet</p>
            ) : (
              <div className="space-y-2">
                {spots.map(spot => (
                  <button
                    key={spot.id}
                    onClick={() => shareSpot(spot)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left"
                  >
                    {spot.photos?.[0] ? (
                      <img src={spot.photos[0]} alt={spot.name} className="w-16 h-16 rounded object-cover" />
                    ) : (
                      <div className="w-16 h-16 rounded bg-muted flex items-center justify-center">
                        <MapPin className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium">{spot.name}</p>
                      {spot.location_name && (
                        <p className="text-sm text-muted-foreground">{spot.location_name}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Catch Picker Dialog */}
      <Dialog open={showCatchPicker} onOpenChange={setShowCatchPicker}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share a Catch</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            {catches.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No catches to share yet</p>
            ) : (
              <div className="space-y-2">
                {catches.map(c => (
                  <button
                    key={c.id}
                    onClick={() => shareCatch(c)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors text-left"
                  >
                    {c.photos?.[0] ? (
                      <img src={c.photos[0]} alt={c.species_name || 'Catch'} className="w-16 h-16 rounded object-cover" />
                    ) : (
                      <div className="w-16 h-16 rounded bg-muted flex items-center justify-center">
                        <Fish className="w-6 h-6 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium flex items-center gap-1">
                        <Fish className="w-4 h-4" />
                        {c.species_name || 'Unknown species'}
                      </p>
                      <div className="flex gap-3 text-sm text-muted-foreground">
                        {c.weight_lbs && <span>{c.weight_lbs} lbs</span>}
                        {c.length_in && <span>{c.length_in} in</span>}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Delete Message Dialog */}
      <DeleteMessageDialog
        open={!!messageToDelete}
        onOpenChange={(open) => !open && setMessageToDelete(null)}
        onDelete={handleDeleteMessage}
        isMine={messageToDelete?.sender_id === user?.id}
        isDeleting={isDeleting}
      />

      {/* Lightbox for images */}
      <Lightbox
        images={lightboxImage ? [lightboxImage] : []}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
      />
    </motion.div>
  );
}
