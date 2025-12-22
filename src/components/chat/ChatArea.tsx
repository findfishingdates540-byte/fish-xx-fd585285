import { useState, useRef, useEffect } from 'react';
import { Send, Smile, Image, MoreVertical, Phone, Video, ArrowLeft, User, Check, CheckCheck } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

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
  onShowProfile?: () => void;
  isTyping?: boolean;
  onInputChange?: () => void;
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
  onShowProfile,
  isTyping,
  onInputChange,
}: ChatAreaProps) {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    onInputChange?.();
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-background min-w-0">
      {/* Chat Header */}
      <header className="h-14 md:h-16 px-3 md:px-6 border-b border-border flex items-center justify-between bg-background flex-shrink-0">
        <div className="flex items-center gap-2 md:gap-3">
          {/* Back button - mobile only */}
          <Button variant="ghost" size="icon" className="md:hidden" asChild>
            <Link to="/app/messages">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <Avatar className="h-9 w-9 md:h-10 md:w-10" onClick={onShowProfile}>
            <AvatarImage src={matchPhoto} alt={matchName} />
            <AvatarFallback>{matchName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="cursor-pointer" onClick={onShowProfile}>
            <h2 className="font-semibold text-sm md:text-base">{matchName} 💕</h2>
            <p className={cn('text-xs', isOnline ? 'text-green-500' : 'text-muted-foreground')}>
              {isTyping ? 'Typing...' : isOnline ? 'Active now' : 'Offline'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 md:gap-2">
          <Button variant="ghost" size="icon" className="hidden sm:flex">
            <Phone className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="hidden sm:flex">
            <Video className="h-5 w-5" />
          </Button>
          {/* Profile button - mobile only */}
          <Button variant="ghost" size="icon" className="xl:hidden" onClick={onShowProfile}>
            <User className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Match Banner */}
      <div className="px-4 md:px-6 py-2 md:py-3 bg-accent/50 border-b border-border flex-shrink-0">
        <p className="text-xs md:text-sm text-center text-muted-foreground">
          <span className="text-primary">💕</span> You matched with {matchName}!
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {messages.map((message, index) => {
          const isMine = message.senderId === currentUserId;
          const isLastInGroup = index === messages.length - 1 || 
            messages[index + 1]?.senderId !== message.senderId;
          
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
              <div className={cn(
                'flex items-center gap-1 mt-1',
                isMine ? 'px-2' : 'px-10'
              )}>
                <span className="text-xs text-muted-foreground">
                  {message.timestamp}
                </span>
                {isMine && (
                  <span className={cn(
                    'flex items-center',
                    message.isRead ? 'text-primary' : 'text-muted-foreground'
                  )}>
                    {message.isRead ? (
                      <CheckCheck className="h-3.5 w-3.5" />
                    ) : (
                      <Check className="h-3.5 w-3.5" />
                    )}
                  </span>
                )}
              </div>
            </div>
          );
        })}
        
        {/* Typing indicator */}
        {isTyping && (
          <div className="flex items-start">
            <div className="flex items-end gap-2">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarImage src={matchPhoto} alt={matchName} />
                <AvatarFallback>{matchName.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="px-4 py-3 rounded-2xl bg-accent rounded-bl-sm">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-3 md:p-4 border-t border-border bg-background flex-shrink-0">
        <div className="flex items-center gap-2 mb-3">
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <Image className="h-5 w-5" />
          </Button>
          <div className="flex-1 relative">
            <Input
              value={newMessage}
              onChange={handleInputChange}
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

        {/* Quick Replies - hidden on very small screens */}
        <div className="hidden sm:flex gap-2 flex-wrap">
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
