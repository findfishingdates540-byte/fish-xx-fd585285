import { useState, useRef, useEffect } from 'react';
import { Send, Smile, Image, MoreVertical, Phone, Video } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  content: string;
  senderId: string;
  timestamp: string;
  isRead?: boolean;
}

interface ChatAreaProps {
  matchName: string;
  matchPhoto: string;
  isOnline?: boolean;
  messages: Message[];
  currentUserId: string;
  onSendMessage: (content: string) => void;
}

const quickReplies = [
  { emoji: '💕', text: 'Coffee date?' },
  { emoji: '🎣', text: 'Go fishing?' },
  { emoji: '📍', text: 'Favorite spot?' },
];

export function ChatArea({
  matchName,
  matchPhoto,
  isOnline,
  messages,
  currentUserId,
  onSendMessage,
}: ChatAreaProps) {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (newMessage.trim()) {
      onSendMessage(newMessage.trim());
      setNewMessage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-background">
      {/* Chat Header */}
      <header className="h-16 px-6 border-b border-border flex items-center justify-between bg-background">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={matchPhoto} alt={matchName} />
            <AvatarFallback>{matchName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-semibold">{matchName} 💕</h2>
            <p className={cn('text-xs', isOnline ? 'text-green-500' : 'text-muted-foreground')}>
              {isOnline ? 'Active now' : 'Offline'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon">
            <Phone className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <Video className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Match Banner */}
      <div className="px-6 py-3 bg-accent/50 border-b border-border">
        <p className="text-sm text-center text-muted-foreground">
          <span className="text-primary">💕</span> You matched with {matchName}! Start the conversation.
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((message) => {
          const isMine = message.senderId === currentUserId;
          return (
            <div
              key={message.id}
              className={cn('flex flex-col', isMine ? 'items-end' : 'items-start')}
            >
              <div className="flex items-end gap-2 max-w-[70%]">
                {!isMine && (
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={matchPhoto} alt={matchName} />
                    <AvatarFallback>{matchName.charAt(0)}</AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={cn(
                    'px-4 py-2.5 rounded-2xl',
                    isMine
                      ? 'bg-foreground text-background rounded-br-sm'
                      : 'bg-accent rounded-bl-sm'
                  )}
                >
                  <p className="text-sm">{message.content}</p>
                </div>
              </div>
              <span className="text-xs text-muted-foreground mt-1 px-10">
                {message.timestamp}
              </span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 border-t border-border bg-background">
        <div className="flex items-center gap-2 mb-3">
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <Image className="h-5 w-5" />
          </Button>
          <div className="flex-1 relative">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="pr-10"
            />
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              <Smile className="h-5 w-5" />
            </Button>
          </div>
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim()}
            className="bg-foreground hover:bg-foreground/90 text-background"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {/* Quick Replies */}
        <div className="flex gap-2 flex-wrap">
          {quickReplies.map((reply) => (
            <Button
              key={reply.text}
              variant="outline"
              size="sm"
              onClick={() => setNewMessage(reply.text)}
              className="text-xs border-border hover:bg-accent"
            >
              {reply.emoji} {reply.text}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
