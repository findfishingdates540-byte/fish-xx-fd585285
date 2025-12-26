import { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Smile, Image as ImageIcon, MoreVertical, Phone, Video, ArrowLeft, User, X, Loader2, Mic, Square, MapPin, Reply, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Lightbox } from '@/components/ui/lightbox';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { MessageReactions } from './MessageReactions';
import { MessageStatusIndicator } from './MessageStatusIndicator';
import { QuotedMessage } from './QuotedMessage';
import { ReplyPreview } from './ReplyPreview';
import { SwipeableMessage } from './SwipeableMessage';
import { DeleteMessageDialog } from './DeleteMessageDialog';
import { DeletedMessagePlaceholder } from './DeletedMessagePlaceholder';
import { VoiceMessagePlayer } from './VoiceMessagePlayer';
import { WaveformVisualizer } from './WaveformVisualizer';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useVoiceRecorder } from '@/hooks/use-voice-recorder';
import { format, isToday, isYesterday, parseISO } from 'date-fns';

interface Message {
  id: string;
  content: string;
  senderId: string;
  timestamp: string;
  isRead?: boolean;
  imageUrl?: string | null;
  audioUrl?: string | null;
  createdAt?: string;
  replyToId?: string | null;
  deletedAt?: string | null;
  deletedForEveryone?: boolean;
}

interface ReactionSummary {
  emoji: string;
  count: number;
  hasReacted: boolean;
}

interface ChatAreaProps {
  matchName: string;
  matchPhoto: string;
  matchId?: string;
  isOnline?: boolean;
  messages: Message[];
  currentUserId: string;
  onSendMessage: (content: string, imageUrl?: string, audioUrl?: string, replyToId?: string) => void;
  onShowProfile?: () => void;
  isTyping?: boolean;
  onInputChange?: () => void;
  getReactionSummary?: (messageId: string) => ReactionSummary[];
  onToggleReaction?: (messageId: string, emoji: string) => void;
  chatType?: 'date' | 'buddy';
  distance?: string;
  replyingTo?: Message | null;
  onSetReplyingTo?: (message: Message | null) => void;
  getReplyMessage?: (replyToId: string | null) => { sender_id: string; content: string } | null;
  onDeleteMessage?: (messageId: string, deleteForEveryone: boolean) => Promise<void>;
  showBackButton?: boolean;
  onBack?: () => void;
}

const quickReplies = [
  { emoji: '💕', text: 'Coffee date?' },
  { emoji: '🎣', text: 'Go fishing?' },
  { emoji: '📍', text: 'Favorite spot?' },
];

// Helper to group messages by date
function getDateLabel(dateStr: string): string {
  try {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Today';
    if (isYesterday(date)) return 'Yesterday';
    return format(date, 'MMMM d, yyyy');
  } catch {
    return '';
  }
}

export function ChatArea({
  matchName,
  matchPhoto,
  matchId,
  isOnline,
  messages,
  currentUserId,
  onSendMessage,
  onShowProfile,
  isTyping,
  onInputChange,
  getReactionSummary,
  onToggleReaction,
  chatType = 'date',
  distance,
  replyingTo,
  onSetReplyingTo,
  getReplyMessage,
  onDeleteMessage,
  showBackButton,
  onBack,
}: ChatAreaProps) {
  const [newMessage, setNewMessage] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState<Message | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [locallyDeletedIds, setLocallyDeletedIds] = useState<Set<string>>(new Set());
  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { isRecording, recordingDuration, audioLevels, startRecording, stopRecording, cancelRecording } = useVoiceRecorder();

  const handleDeleteMessage = async (deleteForEveryone: boolean) => {
    if (!messageToDelete) return;
    
    setIsDeleting(true);
    try {
      if (deleteForEveryone && onDeleteMessage) {
        await onDeleteMessage(messageToDelete.id, true);
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Group messages by date for day dividers
  const messagesWithDividers = useMemo(() => {
    const result: { type: 'divider' | 'message'; date?: string; message?: Message }[] = [];
    let lastDate = '';

    messages.forEach((msg) => {
      const msgDate = msg.createdAt || new Date().toISOString();
      const dateLabel = getDateLabel(msgDate);
      
      if (dateLabel && dateLabel !== lastDate) {
        result.push({ type: 'divider', date: dateLabel });
        lastDate = dateLabel;
      }
      result.push({ type: 'message', message: msg });
    });

    return result;
  }, [messages]);

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

    onSendMessage(newMessage.trim() || '📷 Photo', imageUrl, undefined, replyingTo?.id);
    setNewMessage('');
    onSetReplyingTo?.(null);
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

  // Check if a message contains shared location
  const isLocationMessage = (content: string) => {
    return content.startsWith('📍 Shared location:') || content.includes('Shared a fishing spot');
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-background min-w-0">
      {/* Chat Header */}
      <header className="h-14 md:h-16 px-3 md:px-6 border-b border-border flex items-center justify-between bg-background flex-shrink-0">
        <div className="flex items-center gap-2 md:gap-3">
          {/* Back button - mobile only or when showBackButton is true */}
          {(showBackButton || true) && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="md:hidden" 
              onClick={onBack}
              asChild={!onBack}
            >
              {onBack ? (
                <ArrowLeft className="h-5 w-5" />
              ) : (
                <Link to="/app/messages">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              )}
            </Button>
          )}
          <Avatar className="h-9 w-9 md:h-10 md:w-10 cursor-pointer" onClick={onShowProfile}>
            <AvatarImage src={matchPhoto} alt={matchName} />
            <AvatarFallback>{matchName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="cursor-pointer" onClick={onShowProfile}>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-sm md:text-base">{matchName}</h2>
              {chatType === 'date' ? (
                <Badge className="bg-pink-100 text-pink-700 border-pink-200 text-[10px] px-1.5 py-0 h-4">
                  💕 DATE
                </Badge>
              ) : (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-primary/50">
                  🎣 BUDDY
                </Badge>
              )}
            </div>
            <p className={cn('text-xs flex items-center gap-1', isOnline ? 'text-green-500' : 'text-muted-foreground')}>
              {isTyping ? 'Typing...' : isOnline ? 'Active now' : 'Offline'}
              {distance && (
                <>
                  <span className="text-muted-foreground">•</span>
                  <MapPin className="h-3 w-3" />
                  <span>{distance}</span>
                </>
              )}
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
          <span className="text-primary">{chatType === 'date' ? '💕' : '🎣'}</span> You {chatType === 'date' ? 'matched' : 'connected'} with {matchName}!
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {messagesWithDividers.map((item, index) => {
          if (item.type === 'divider') {
            return (
              <div key={`divider-${index}`} className="flex items-center justify-center my-4">
                <div className="bg-muted px-4 py-1.5 rounded-full">
                  <span className="text-xs font-medium text-muted-foreground">{item.date}</span>
                </div>
              </div>
            );
          }

          const message = item.message!;
          const isMine = message.senderId === currentUserId;
          const repliedMessage = message.replyToId && getReplyMessage ? getReplyMessage(message.replyToId) : null;
          const repliedSenderName = repliedMessage 
            ? (repliedMessage.sender_id === currentUserId ? 'You' : matchName)
            : '';
          
          // Skip locally deleted messages
          if (locallyDeletedIds.has(message.id)) return null;
          
          // Check if message was deleted for everyone
          const isDeletedForEveryone = message.deletedForEveryone && message.deletedAt;
          
          return (
            <SwipeableMessage
              key={message.id}
              onReply={() => !isDeletedForEveryone && onSetReplyingTo?.(message)}
              isMine={isMine}
            >
              <motion.div
                className={cn('flex flex-col group w-full', isMine ? 'items-end' : 'items-start')}
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ 
                  duration: 0.2, 
                  ease: [0.25, 0.1, 0.25, 1]
                }}
                layout
              >
                <div className={cn('flex items-end gap-2', isMine ? 'flex-row-reverse' : 'flex-row')}>
                  {/* Action buttons - desktop only */}
                  {!isDeletedForEveryone && (
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {onSetReplyingTo && (
                        <button
                          onClick={() => onSetReplyingTo(message)}
                          className="p-1.5 rounded-full hover:bg-muted hidden md:block"
                        >
                          <Reply className="w-4 h-4 text-muted-foreground" />
                        </button>
                      )}
                      <button
                        onClick={() => setMessageToDelete(message)}
                        className="p-1.5 rounded-full hover:bg-muted hidden md:block"
                      >
                        <Trash2 className="w-4 h-4 text-muted-foreground" />
                      </button>
                    </div>
                  )}
                  
                  <div className="flex items-end gap-2 max-w-[70%]">
                    {!isMine && (
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarImage src={matchPhoto} alt={matchName} />
                        <AvatarFallback>{matchName.charAt(0)}</AvatarFallback>
                      </Avatar>
                    )}
                    
                    {isDeletedForEveryone ? (
                      <DeletedMessagePlaceholder isMine={isMine} timestamp={message.timestamp} />
                    ) : (
                      <div
                        className={cn(
                          'rounded-2xl overflow-hidden relative',
                          message.imageUrl ? '' : 'px-3 py-1.5',
                          isMine
                            ? 'bg-foreground text-background rounded-br-sm'
                            : 'bg-accent rounded-bl-sm',
                          isLocationMessage(message.content) && 'p-0'
                        )}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          setMessageToDelete(message);
                        }}
                      >
                        {/* Quoted message */}
                        {repliedMessage && (
                          <div className={cn(message.imageUrl ? 'px-4 pt-2.5' : '')}>
                            <QuotedMessage
                              senderName={repliedSenderName}
                              content={repliedMessage.content}
                              isMine={isMine}
                              isOwnQuote={repliedMessage.sender_id === currentUserId}
                            />
                          </div>
                        )}
                        
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
                            onClick={() => {
                              setLightboxImage(message.imageUrl!);
                              setLightboxOpen(true);
                            }}
                          />
                        )}
                        {/* Location Card */}
                        {isLocationMessage(message.content) && !message.audioUrl && !message.imageUrl && (
                          <div className="bg-accent rounded-2xl overflow-hidden min-w-[200px]">
                            <div className="h-24 bg-muted flex items-center justify-center">
                              <MapPin className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <div className="p-3">
                              <p className="text-xs text-muted-foreground mb-1">Shared Location</p>
                              <p className="text-sm font-medium">{message.content.replace('📍 Shared location: ', '')}</p>
                            </div>
                          </div>
                        )}
                        {message.content && !isLocationMessage(message.content) && message.content !== '📷 Photo' && message.content !== '🎤 Voice message' && !message.audioUrl && (
                          <span className="inline">
                            <span className="text-sm">{message.content}</span>
                            {/* Invisible spacer to reserve space for timestamp */}
                            <span className="invisible text-xs ml-2 inline-flex items-center gap-1">
                              {message.timestamp}
                              {isMine && <span>✓✓</span>}
                            </span>
                          </span>
                        )}
                        {message.imageUrl && message.content === '📷 Photo' && (
                          <p className="text-xs px-3 py-1.5 text-center opacity-70">📷 Photo</p>
                        )}
                        
                        {/* Timestamp positioned at bottom-right */}
                        {!isLocationMessage(message.content) && (
                          <span className={cn(
                            "absolute bottom-1.5 right-3 text-xs flex items-center gap-1",
                            isMine ? "text-background/70" : "text-muted-foreground"
                          )}>
                            {message.timestamp}
                            {isMine && (
                              <MessageStatusIndicator 
                                status={message.isRead ? 'read' : 'sent'} 
                              />
                            )}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Reactions */}
                {!isDeletedForEveryone && getReactionSummary && onToggleReaction && (
                  <div className={cn('mt-1', isMine ? 'pr-2' : 'pl-10')}>
                    <MessageReactions
                      messageId={message.id}
                      reactions={getReactionSummary(message.id)}
                      onToggleReaction={onToggleReaction}
                      isMine={isMine}
                    />
                  </div>
                )}
              </motion.div>
            </SwipeableMessage>
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
      <div className="border-t border-border bg-background flex-shrink-0">
        {/* Reply Preview */}
        {replyingTo && onSetReplyingTo && (
          <ReplyPreview
            senderName={replyingTo.senderId === currentUserId ? 'You' : matchName}
            content={replyingTo.content}
            onCancel={() => onSetReplyingTo(null)}
          />
        )}
        
        <div className="p-3 md:p-4">
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

      {/* Delete Message Dialog */}
      <DeleteMessageDialog
        open={!!messageToDelete}
        onOpenChange={(open) => !open && setMessageToDelete(null)}
        onDelete={handleDeleteMessage}
        isMine={messageToDelete?.senderId === currentUserId}
        isDeleting={isDeleting}
      />

      {/* Lightbox for images */}
      <Lightbox
        images={lightboxImage ? [lightboxImage] : []}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
      />
    </div>
  );
}