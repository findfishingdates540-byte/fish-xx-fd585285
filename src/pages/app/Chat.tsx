import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Send, Check, CheckCheck } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  is_read: boolean;
}

export default function Chat() {
  const { matchId } = useParams<{ matchId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState('');
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Fetch match and other user info
  const { data: matchData, isLoading: matchLoading } = useQuery({
    queryKey: ['match', matchId],
    queryFn: async () => {
      if (!matchId || !user?.id) return null;

      const { data: match, error } = await supabase
        .from('matches')
        .select('id, user1_id, user2_id, is_match')
        .eq('id', matchId)
        .single();

      if (error || !match || !match.is_match) return null;

      const otherUserId = match.user1_id === user.id ? match.user2_id : match.user1_id;

      const { data: profile } = await supabase
        .from('profiles')
        .select('id, display_name, photos')
        .eq('id', otherUserId)
        .single();

      return { match, otherUser: profile };
    },
    enabled: !!matchId && !!user?.id,
  });

  // Fetch messages
  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['messages', matchId],
    queryFn: async () => {
      if (!matchId) return [];

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true });

      if (error) return [];
      return data as Message[];
    },
    enabled: !!matchId,
  });

  // Mark messages as read
  const markAsRead = useMutation({
    mutationFn: async () => {
      if (!matchId || !user?.id) return;

      await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('match_id', matchId)
        .neq('sender_id', user.id)
        .eq('is_read', false);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', matchId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: async (content: string) => {
      if (!matchId || !user?.id) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('messages')
        .insert({
          match_id: matchId,
          sender_id: user.id,
          content: content.trim(),
        });

      if (error) throw error;
    },
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['messages', matchId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  // Broadcast typing status
  const broadcastTyping = useCallback(() => {
    if (channelRef.current && user?.id) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId: user.id },
      });
    }
  }, [user?.id]);

  // Handle input change with typing indicator
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    broadcastTyping();
  };

  // Subscribe to realtime messages and typing
  useEffect(() => {
    if (!matchId || !user?.id) return;

    const channel = supabase.channel(`chat:${matchId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          console.log('Message event:', payload);
          queryClient.invalidateQueries({ queryKey: ['messages', matchId] });
          queryClient.invalidateQueries({ queryKey: ['conversations'] });
          
          // Mark new incoming messages as read
          if (payload.eventType === 'INSERT' && payload.new.sender_id !== user.id) {
            markAsRead.mutate();
          }
        }
      )
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.userId !== user.id) {
          setIsOtherTyping(true);
          
          // Clear existing timeout
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
          
          // Hide typing indicator after 2 seconds of no typing
          typingTimeoutRef.current = setTimeout(() => {
            setIsOtherTyping(false);
          }, 2000);
        }
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [matchId, user?.id, queryClient, markAsRead]);

  // Mark messages as read when chat opens
  useEffect(() => {
    if (messages && messages.length > 0 && user?.id) {
      const hasUnread = messages.some(m => !m.is_read && m.sender_id !== user.id);
      if (hasUnread) {
        markAsRead.mutate();
      }
    }
  }, [messages, user?.id]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOtherTyping]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    sendMessage.mutate(newMessage);
  };

  const formatMessageTime = (dateStr: string) => {
    const date = new Date(dateStr);
    if (isToday(date)) {
      return format(date, 'h:mm a');
    }
    if (isYesterday(date)) {
      return 'Yesterday ' + format(date, 'h:mm a');
    }
    return format(date, 'MMM d, h:mm a');
  };

  if (matchLoading) {
    return (
      <div className="flex flex-col h-[calc(100vh-4rem)]">
        <div className="border-b border-border p-3 flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-5 w-32" />
        </div>
      </div>
    );
  }

  if (!matchData) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] p-4">
        <p className="text-muted-foreground">Conversation not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/app/messages')}>
          Back to Messages
        </Button>
      </div>
    );
  }

  const { otherUser } = matchData;
  const avatarUrl = otherUser?.photos?.[0] || '';
  const initials = otherUser?.display_name?.charAt(0)?.toUpperCase() || 'U';

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="border-b border-border p-3 flex items-center gap-3 bg-background sticky top-0 z-10">
        <Button variant="ghost" size="icon" onClick={() => navigate('/app/messages')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Avatar className="h-10 w-10 border border-border">
          <AvatarImage src={avatarUrl} alt={otherUser?.display_name || ''} />
          <AvatarFallback className="bg-muted">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h1 className="font-semibold">{otherUser?.display_name || 'User'}</h1>
          {isOtherTyping && (
            <p className="text-xs text-muted-foreground animate-pulse">typing...</p>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messagesLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className={`h-12 w-48 rounded-2xl ${i % 2 === 0 ? 'ml-auto' : ''}`} />
            ))}
          </div>
        ) : messages && messages.length > 0 ? (
          <>
            {messages.map((msg, index) => {
              const isOwn = msg.sender_id === user?.id;
              const isLastOwnMessage = isOwn && 
                messages.slice(index + 1).every(m => m.sender_id !== user?.id);
              
              return (
                <div
                  key={msg.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[75%] px-4 py-2 rounded-2xl ${
                      isOwn
                        ? 'bg-foreground text-background rounded-br-md'
                        : 'bg-secondary text-foreground rounded-bl-md'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                    <div className={`flex items-center gap-1 mt-1 ${isOwn ? 'justify-end' : ''}`}>
                      <span className={`text-xs ${isOwn ? 'text-background/60' : 'text-muted-foreground'}`}>
                        {formatMessageTime(msg.created_at)}
                      </span>
                      {isOwn && (
                        <span className={`${isOwn ? 'text-background/60' : 'text-muted-foreground'}`}>
                          {msg.is_read ? (
                            <CheckCheck className="h-3.5 w-3.5" />
                          ) : (
                            <Check className="h-3.5 w-3.5" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </>
        ) : (
          <div className="text-center text-muted-foreground py-8">
            <p>No messages yet</p>
            <p className="text-sm">Say hello to start the conversation!</p>
          </div>
        )}
        
        {/* Typing indicator bubble */}
        {isOtherTyping && (
          <div className="flex justify-start">
            <div className="bg-secondary text-foreground rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="border-t border-border p-3 flex gap-2 bg-background">
        <Input
          ref={inputRef}
          value={newMessage}
          onChange={handleInputChange}
          placeholder="Type a message..."
          className="flex-1"
          autoComplete="off"
        />
        <Button 
          type="submit" 
          size="icon"
          disabled={!newMessage.trim() || sendMessage.isPending}
        >
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}