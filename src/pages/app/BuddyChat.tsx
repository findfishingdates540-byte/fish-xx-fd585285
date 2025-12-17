import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowLeft, Send, Fish, Check, CheckCheck, MapPin, Image, Plus, Scale, Ruler } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOnlineStatus, formatLastSeen } from '@/hooks/use-online-presence';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  is_read: boolean;
  image_url: string | null;
}

interface BuddyProfile {
  id: string;
  display_name: string | null;
  photos: string[] | null;
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
  weight_kg: number | null;
  length_cm: number | null;
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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const presenceChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

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

  // Subscribe to messages
  useEffect(() => {
    if (!buddyId || !user) return;

    const channel = supabase
      .channel(`buddy-messages-${buddyId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'buddy_messages',
          filter: `buddy_id=eq.${buddyId}`
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages(prev => [...prev, newMsg]);
          fetchSharedContent([newMsg]);
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
          table: 'buddy_messages',
          filter: `buddy_id=eq.${buddyId}`
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
        .select('id, species_name, weight_kg, length_cm, photos, caught_at')
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
        .from('profiles')
        .select('id, display_name, photos')
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
      .select('id, species_name, weight_kg, length_cm, photos, caught_at')
      .eq('user_id', user.id)
      .order('caught_at', { ascending: false });
    setCatches(data || []);
  };

  const markMessagesAsRead = async () => {
    if (!user || !buddyId) return;
    await supabase
      .from('buddy_messages')
      .update({ is_read: true })
      .eq('buddy_id', buddyId)
      .neq('sender_id', user.id)
      .eq('is_read', false);
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

  const sendMessage = async (content?: string, imageUrl?: string) => {
    if (!user || !buddyId || sending || !buddyProfile) return;
    const msgContent = content || newMessage.trim();
    if (!msgContent && !imageUrl) return;

    updateTypingStatus(false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    setSending(true);
    setNewMessage('');

    const { error } = await supabase
      .from('buddy_messages')
      .insert({
        buddy_id: buddyId,
        sender_id: user.id,
        content: msgContent || '',
        image_url: imageUrl || null
      });

    if (error) {
      console.error('Error sending message:', error);
      if (!content) setNewMessage(msgContent);
    } else {
      // Send push notification to buddy (fire and forget)
      sendPushNotification(buddyProfile.id, msgContent);
    }
    setSending(false);
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
          {parsed.text && <p className="break-words">{parsed.text}</p>}
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
                {catchItem.weight_kg && (
                  <span className="flex items-center gap-1">
                    <Scale className="w-3 h-3" />
                    {catchItem.weight_kg}kg
                  </span>
                )}
                {catchItem.length_cm && (
                  <span className="flex items-center gap-1">
                    <Ruler className="w-3 h-3" />
                    {catchItem.length_cm}cm
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="p-2 bg-muted/50 rounded text-sm">Loading catch...</div>
          )}
          {parsed.text && <p className="break-words">{parsed.text}</p>}
        </div>
      );
    }

    return (
      <>
        {msg.image_url && (
          <img src={msg.image_url} alt="Shared" className="rounded-lg max-w-full mb-2" />
        )}
        <p className="break-words">{parsed.text}</p>
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

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b">
        <Button variant="ghost" size="icon" onClick={() => navigate('/app/buddy-messages')}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="relative">
          <Avatar className="h-10 w-10">
            <AvatarImage src={buddyProfile?.photos?.[0]} className="object-cover" />
            <AvatarFallback>{buddyProfile?.display_name?.charAt(0)?.toUpperCase() || '?'}</AvatarFallback>
          </Avatar>
          {/* Online indicator */}
          <span className={cn(
            "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background",
            isBuddyOnline ? "bg-green-500" : "bg-muted-foreground/30"
          )} />
        </div>
        <div className="flex-1">
          <h2 className="font-semibold">{buddyProfile?.display_name || 'Anonymous'}</h2>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            {isTyping ? (
              <span className="text-primary animate-pulse">typing...</span>
            ) : isBuddyOnline ? (
              <span className="text-green-500">Online</span>
            ) : buddyLastSeen ? (
              <span>{formatLastSeen(buddyLastSeen)}</span>
            ) : (
              <><Fish className="w-3 h-3" />Fishing Buddy</>
            )}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
              {group.messages.map((msg) => (
                <div key={msg.id} className={cn("flex", msg.sender_id === user?.id ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[75%] rounded-2xl px-4 py-2",
                    msg.sender_id === user?.id ? "bg-primary text-primary-foreground" : "bg-muted"
                  )}>
                    {renderMessageContent(msg)}
                    <div className={cn(
                      "flex items-center justify-end gap-1 mt-1",
                      msg.sender_id === user?.id ? "text-primary-foreground/70" : "text-muted-foreground"
                    )}>
                      <span className="text-xs">{formatTime(msg.created_at)}</span>
                      {msg.sender_id === user?.id && (
                        msg.is_read ? <CheckCheck className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
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
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowShareMenu(!showShareMenu)}
            className="shrink-0"
          >
            <Plus className="w-4 h-4" />
          </Button>
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            className="flex-1"
          />
          <Button onClick={() => sendMessage()} disabled={!newMessage.trim() || sending} size="icon">
            <Send className="w-4 h-4" />
          </Button>
        </div>
        
        {showShareMenu && (
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
              <Image className="w-4 h-4" />
              Share Catch
            </Button>
          </div>
        )}
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
                        {c.weight_kg && <span>{c.weight_kg}kg</span>}
                        {c.length_cm && <span>{c.length_cm}cm</span>}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
