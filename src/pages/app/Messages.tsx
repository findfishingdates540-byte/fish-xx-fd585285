import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { MessagesHeader } from '@/components/messages/MessagesHeader';
import { ConversationList } from '@/components/messages/ConversationList';
import { EmptyMessages } from '@/components/messages/EmptyMessages';
import { useOnlineStatus, formatLastSeen } from '@/hooks/use-online-presence';

// Mock conversations data
const mockConversations = [
  {
    id: '1',
    name: 'Sarah',
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    lastMessage: 'Did you catch anything at the lake?',
    time: '2m ago',
    unreadCount: 1,
    isOnline: true,
  },
  {
    id: '2',
    name: 'Mike',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400',
    lastMessage: 'The bass are biting near the dock...',
    time: '1h ago',
    unreadCount: 3,
    isOnline: true,
  },
  {
    id: '3',
    name: 'Jessica',
    photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
    lastMessage: "Let's meet up this weekend.",
    time: 'Yesterday',
    isRead: true,
  },
  {
    id: '4',
    name: 'David',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400',
    lastMessage: 'Sent a location pin',
    time: 'Tuesday',
    isRead: true,
  },
  {
    id: '5',
    name: 'Emily',
    photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
    lastMessage: 'Nice catch! What kind of bait?',
    time: 'Oct 24',
  },
];

export default function Messages() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedConversation, setSelectedConversation] = useState<string | undefined>();

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

  // Get all conversation user IDs for online status tracking
  const conversationUserIds = useMemo(() => mockConversations.map(c => c.id), []);
  const { isOnline, getLastSeen } = useOnlineStatus(conversationUserIds);

  // Update conversations with real online status and last seen
  const conversationsWithStatus = useMemo(() => 
    mockConversations.map(convo => ({
      ...convo,
      isOnline: isOnline(convo.id),
      lastSeen: !isOnline(convo.id) ? formatLastSeen(getLastSeen(convo.id)) : undefined
    })), [isOnline, getLastSeen]);

  const handleSelectConversation = (id: string) => {
    setSelectedConversation(id);
    navigate(`/app/messages/${id}`);
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Top Header (Desktop only) */}
      <div className="hidden lg:block">
        <MessagesHeader
          userName={profile?.display_name || 'User'}
          userPhoto={profile?.photos?.[0]}
          notificationCount={2}
        />
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Conversation Sidebar */}
        <ConversationList
          conversations={conversationsWithStatus}
          selectedId={selectedConversation}
          onSelect={handleSelectConversation}
        />

        {/* Empty State / Chat Area */}
        <EmptyMessages />
      </div>
    </div>
  );
}
