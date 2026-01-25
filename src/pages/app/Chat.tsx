import { useState, useMemo } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatArea } from '@/components/chat/ChatArea';
import { ProfileSidebar } from '@/components/chat/ProfileSidebar';
import { useOnlineStatus, formatLastSeen } from '@/hooks/use-online-presence';
import { useDatingConversations } from '@/hooks/use-dating-conversations';
import { useDatingChat } from '@/hooks/use-dating-chat';
import { useMessageReactions } from '@/hooks/use-message-reactions';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageCircle } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

interface OutletContext {
  isInline?: boolean;
}

export default function Chat() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  
  // Get context from parent (Messages page) - if inline, hide sidebar
  const outletContext = useOutletContext<OutletContext | null>();
  const isInline = outletContext?.isInline ?? false;

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch real conversations for sidebar
  const { conversations } = useDatingConversations();

  // Fetch real chat data
  const { 
    messages, 
    matchProfile, 
    loading, 
    isTyping, 
    sendMessage, 
    handleInputChange,
    replyingTo,
    setReplyingTo,
    getReplyMessage,
    deleteMessage,
  } = useDatingChat(matchId);

  // Message reactions
  const { getReactionSummary, toggleReaction } = useMessageReactions(matchId);

  // Get all user IDs for online status tracking
  const allUserIds = useMemo(() => {
    const ids = conversations.map(c => c.matchedUserId);
    if (matchProfile?.id) ids.push(matchProfile.id);
    return [...new Set(ids)];
  }, [conversations, matchProfile?.id]);
  
  const { isOnline, getLastSeen } = useOnlineStatus(allUserIds);

  // Format conversations for sidebar
  const conversationsWithStatus = useMemo(() => 
    conversations.map(convo => ({
      id: convo.id,
      name: convo.name,
      photo: convo.photo,
      lastMessage: convo.lastMessage || 'No messages yet',
      time: convo.time,
      isOnline: isOnline(convo.matchedUserId),
      lastSeen: !isOnline(convo.matchedUserId) ? formatLastSeen(getLastSeen(convo.matchedUserId)) : undefined,
      type: 'date' as const,
    })), [conversations, isOnline, getLastSeen]);

  // Check if current match is online
  const isMatchOnline = matchProfile ? isOnline(matchProfile.id) : false;

  const handleSelectConversation = (id: string) => {
    navigate(`/app/messages/${id}`);
  };

  const handleSendMessage = (content: string, imageUrl?: string, audioUrl?: string, replyToId?: string) => {
    sendMessage(content, imageUrl, audioUrl, replyToId);
  };

  // Loading state for chat area
  const renderChatLoading = () => (
    <div className="flex-1 flex flex-col h-full bg-background">
      <header className="h-16 px-6 border-b border-border flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div>
          <Skeleton className="h-4 w-24 mb-1" />
          <Skeleton className="h-3 w-16" />
        </div>
      </header>
      <div className="flex-1 p-6 space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
            <Skeleton className={`h-12 ${i % 2 === 0 ? 'w-48' : 'w-56'} rounded-2xl`} />
          </div>
        ))}
      </div>
    </div>
  );

  // Empty state when no match selected or match not found
  const renderEmptyChat = () => (
    <div className="flex-1 flex flex-col items-center justify-center bg-background">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <MessageCircle className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold mb-1">Select a conversation</h3>
      <p className="text-muted-foreground text-sm">Choose a match to start chatting</p>
    </div>
  );

  return (
    <div 
      className={`flex ${isInline ? 'h-full flex-1' : 'h-[100dvh]'} bg-background overflow-hidden`}
    >
      {/* Left Sidebar - Only show when not inline */}
      {!isInline && (
        <ChatSidebar
          conversations={conversationsWithStatus}
          selectedId={matchId}
          onSelect={handleSelectConversation}
          unreadCount={conversations.reduce((sum, c) => sum + c.unreadCount, 0)}
          accountMode={profile?.account_mode || 'dating'}
        />
      )}

      {/* Chat Area */}
      {!matchId ? (
        renderEmptyChat()
      ) : loading ? (
        renderChatLoading()
      ) : !matchProfile ? (
        renderEmptyChat()
      ) : (
        <div className="flex-1 flex flex-col">
          <ChatArea
            matchName={matchProfile.display_name || 'Anonymous'}
            matchPhoto={matchProfile.photos?.[0] || ''}
            matchId={matchId}
            matchUserId={matchProfile.id}
            isOnline={isMatchOnline}
            messages={messages}
            currentUserId={user?.id || ''}
            onSendMessage={handleSendMessage}
            onShowProfile={() => setShowProfile(true)}
            isTyping={isTyping}
            onInputChange={handleInputChange}
            getReactionSummary={getReactionSummary}
            onToggleReaction={toggleReaction}
            chatType="date"
            replyingTo={replyingTo ? messages.find(m => m.id === replyingTo.id) : null}
            onSetReplyingTo={(msg) => setReplyingTo(msg ? { id: msg.id, content: msg.content, sender_id: msg.senderId, created_at: '', is_read: false, read_at: null, delivered_at: null, image_url: null, reply_to_id: null, deleted_at: null, deleted_for_everyone: false } : null)}
            getReplyMessage={getReplyMessage}
            onDeleteMessage={deleteMessage}
            showBackButton={isInline}
            onBack={() => navigate('/app/messages')}
            matchIdVerified={matchProfile.id_verified}
            matchLiveVerified={matchProfile.live_verified}
          />
        </div>
      )}

      {/* Right Profile Sidebar - Desktop */}
      {matchProfile && (
        <div className="hidden xl:block w-80 h-full border-l border-border flex-shrink-0">
          <ProfileSidebar
            userId={matchProfile.id}
            name={matchProfile.display_name || 'Anonymous'}
            age={25}
            photo={matchProfile.photos?.[0] || ''}
            isOnline={isMatchOnline}
            location={matchProfile.location_name || ''}
            bio={matchProfile.bio || ''}
            interests={matchProfile.preferred_species || []}
            photos={matchProfile.photos || []}
            className="h-full"
            chatType="date"
            idVerified={matchProfile.id_verified}
            liveVerified={matchProfile.live_verified}
          />
        </div>
      )}

      {/* Mobile Profile Sheet */}
      {matchProfile && (
        <Sheet open={showProfile} onOpenChange={setShowProfile}>
          <SheetContent side="right" className="w-full sm:max-w-md p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Profile</SheetTitle>
            </SheetHeader>
            <ProfileSidebar
              userId={matchProfile.id}
              name={matchProfile.display_name || 'Anonymous'}
              age={25}
              photo={matchProfile.photos?.[0] || ''}
              isOnline={isMatchOnline}
              location={matchProfile.location_name || ''}
              bio={matchProfile.bio || ''}
              interests={matchProfile.preferred_species || []}
              photos={matchProfile.photos || []}
              className="h-full"
              chatType="date"
              idVerified={matchProfile.id_verified}
              liveVerified={matchProfile.live_verified}
            />
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
