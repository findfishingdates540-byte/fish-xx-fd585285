import { useState, useRef, useEffect } from 'react';
import { Send, Smile, Image as ImageIcon, MoreVertical, Phone, Video, ArrowLeft, User, Check, CheckCheck, X, Loader2, Mic, Square } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { MessageReactions } from './MessageReactions';
import { VoiceMessagePlayer } from './VoiceMessagePlayer';
import { WaveformVisualizer } from './WaveformVisualizer';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useVoiceRecorder } from '@/hooks/use-voice-recorder';

interface Message {
  id: string;
  content: string;
  senderId: string;
  timestamp: string;
  isRead?: boolean;
  imageUrl?: string | null;
  audioUrl?: string | null;
}

interface ReactionSummary {
  emoji: string;
  count: number;
  hasReacted: boolean;
}

interface ChatAreaProps {
  matchName: string;
  matchPhoto: string;
  isOnline?: boolean;
  messages: Message[];
  currentUserId: string;
  onSendMessage: (content: string, imageUrl?: string, audioUrl?: string) => void;
  onShowProfile?: () => void;
  isTyping?: boolean;
  onInputChange?: () => void;
  getReactionSummary?: (messageId: string) => ReactionSummary[];
  onToggleReaction?: (messageId: string, emoji: string) => void;
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
  getReactionSummary,
  onToggleReaction,
}: ChatAreaProps) {
  const [newMessage, setNewMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { isRecording, recordingDuration, audioLevels, startRecording, stopRecording, cancelRecording } = useVoiceRecorder();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

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
    const fileName = `${currentUserId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('profile-photos')
      .upload(fileName, file);

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return null;
    }

    const { data } = supabase.storage
      .from('profile-photos')
      .getPublicUrl(fileName);

    return data.publicUrl;
  };

  const uploadAudio = async (blob: Blob): Promise<string | null> => {
    const fileName = `${currentUserId}/voice_${Date.now()}.webm`;

    const { error: uploadError } = await supabase.storage
      .from('profile-photos')
      .upload(fileName, blob, { contentType: blob.type });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return null;
    }

    const { data } = supabase.storage
      .from('profile-photos')
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

    onSendMessage(newMessage.trim() || '📷 Photo', imageUrl);
    setNewMessage('');
  };

  const handleVoiceRecord = async () => {
    if (isRecording) {
      setUploading(true);
      const audioBlob = await stopRecording();
      
      if (audioBlob) {
        const audioUrl = await uploadAudio(audioBlob);
        if (audioUrl) {
          onSendMessage('🎤 Voice message', undefined, audioUrl);
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
              className={cn('flex flex-col group', isMine ? 'items-end' : 'items-start')}
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
                    'rounded-2xl overflow-hidden',
                    message.imageUrl ? '' : 'px-4 py-2.5',
                    isMine
                      ? 'bg-foreground text-background rounded-br-sm'
                      : 'bg-accent rounded-bl-sm'
                  )}
                >
                  {message.audioUrl && (
                    <div className="px-4 py-2.5">
                      <VoiceMessagePlayer audioUrl={message.audioUrl} isMine={isMine} />
                    </div>
                  )}
                  {message.imageUrl && (
                    <img 
                      src={message.imageUrl} 
                      alt="Shared image" 
                      className="max-w-full max-h-64 object-cover cursor-pointer"
                      onClick={() => window.open(message.imageUrl!, '_blank')}
                    />
                  )}
                  {message.content && message.content !== '📷 Photo' && message.content !== '🎤 Voice message' && !message.audioUrl && (
                    <p className={cn('text-sm', message.imageUrl && 'px-4 py-2.5')}>{message.content}</p>
                  )}
                  {message.imageUrl && message.content === '📷 Photo' && (
                    <p className="text-xs px-3 py-1.5 text-center opacity-70">📷 Photo</p>
                  )}
                </div>
              </div>
              
              {/* Reactions */}
              {getReactionSummary && onToggleReaction && (
                <div className={cn('mt-1', isMine ? 'pr-2' : 'pl-10')}>
                  <MessageReactions
                    messageId={message.id}
                    reactions={getReactionSummary(message.id)}
                    onToggleReaction={onToggleReaction}
                    isMine={isMine}
                  />
                </div>
              )}
              
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
        {/* Image Preview */}
        {imagePreview && (
          <div className="relative inline-block mb-3">
            <img 
              src={imagePreview} 
              alt="Selected" 
              className="max-h-32 rounded-lg object-cover"
            />
            <Button
              variant="secondary"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
              onClick={clearSelectedImage}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
        
        {/* Recording indicator with waveform */}
        {isRecording && (
          <div className="flex items-center gap-3 mb-3 p-3 bg-destructive/10 rounded-lg">
            <div className="w-3 h-3 bg-destructive rounded-full animate-pulse flex-shrink-0" />
            <div className="flex-1 flex items-center gap-3">
              <WaveformVisualizer
                levels={audioLevels.length > 0 ? audioLevels : Array(20).fill(0.15)}
                className="flex-1 h-8"
                barClassName="bg-destructive/40"
                activeBarClassName="bg-destructive"
              />
              <span className="text-sm font-medium tabular-nums flex-shrink-0">{formatDuration(recordingDuration)}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={cancelRecording}
              className="text-destructive flex-shrink-0"
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
          </div>
        )}
        
        <div className="flex items-center gap-2 mb-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageSelect}
            accept="image/*"
            className="hidden"
          />
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-muted-foreground"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading || isRecording}
          >
            <ImageIcon className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            className={cn(
              "text-muted-foreground",
              isRecording && "text-destructive bg-destructive/10"
            )}
            onClick={handleVoiceRecord}
            disabled={uploading}
          >
            {isRecording ? <Square className="h-4 w-4" /> : <Mic className="h-5 w-5" />}
          </Button>
          <div className="flex-1 relative">
            <Input
              value={newMessage}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              className="pr-10"
              disabled={uploading || isRecording}
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
            disabled={(!newMessage.trim() && !selectedImage) || uploading || isRecording}
            className="bg-foreground hover:bg-foreground/90 text-background"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
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
