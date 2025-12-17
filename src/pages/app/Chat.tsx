import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ChatSidebar } from '@/components/chat/ChatSidebar';
import { ChatArea } from '@/components/chat/ChatArea';
import { ProfileSidebar } from '@/components/chat/ProfileSidebar';
import { useOnlineStatus } from '@/hooks/use-online-presence';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

// Mock data
const mockConversations = [
  {
    id: '1',
    name: 'Sarah',
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
    lastMessage: 'Do you like freshwater fishing?',
    time: '5m',
    isOnline: true,
  },
  {
    id: '2',
    name: 'Emily',
    photo: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400',
    lastMessage: 'Nice catch on the trout!',
    time: '2h',
    isOnline: false,
  },
  {
    id: '3',
    name: 'Jessica',
    photo: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
    lastMessage: "Let's go next Saturday.",
    time: '1d',
    isOnline: true,
  },
];

const mockMessages = [
  {
    id: '1',
    content: "Hey! I saw you're into hiking. That's my favorite weekend activity!",
    senderId: '2',
    timestamp: '10:42 AM',
  },
  {
    id: '2',
    content: "Yes! I'm there almost every weekend. Usually near the mountain trails.",
    senderId: 'me',
    timestamp: '10:45 AM',
  },
  {
    id: '3',
    content: 'Do you prefer sunrise or sunset hikes?',
    senderId: 'me',
    timestamp: '10:46 AM',
  },
  {
    id: '4',
    content: 'Sunrise mostly! 🌅 I love catching the golden hour.',
    senderId: '2',
    timestamp: 'Just now',
  },
  {
    id: '5',
    content: 'Nothing beats a good coffee afterwards.',
    senderId: '2',
    timestamp: 'Just now',
  },
];

const mockMatchProfile = {
  name: 'Sarah',
  age: 26,
  photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
  isOnline: true,
  location: 'Austin',
  bio: "Adventure seeker and coffee lover. Looking for someone to share spontaneous road trips and lazy Sunday mornings. 💕",
  interests: ['Hiking', 'Photography', 'Coffee', 'Travel'],
  photos: [
    'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
    'https://images.unsplash.com/photo-1551632811-561732d1e306?w=400',
    'https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?w=400',
    'https://images.unsplash.com/photo-1533577116850-9cc66cad8a9b?w=400',
  ],
};

export default function Chat() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [messages, setMessages] = useState(mockMessages);
  const [showProfile, setShowProfile] = useState(false);

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
  const allUserIds = useMemo(() => {
    const ids = mockConversations.map(c => c.id);
    // Add the current match profile ID if available
    if (matchId) ids.push(matchId);
    return ids;
  }, [matchId]);
  const { isOnline } = useOnlineStatus(allUserIds);

  // Update conversations with real online status
  const conversationsWithStatus = useMemo(() => 
    mockConversations.map(convo => ({
      ...convo,
      isOnline: isOnline(convo.id)
    })), [isOnline]);

  // Check if current match is online (using matchId or mock profile)
  const isMatchOnline = matchId ? isOnline(matchId) : mockMatchProfile.isOnline;

  const handleSelectConversation = (id: string) => {
    navigate(`/app/messages/${id}`);
  };

  const handleSendMessage = (content: string) => {
    const newMessage = {
      id: String(messages.length + 1),
      content,
      senderId: 'me',
      timestamp: 'Just now',
    };
    setMessages([...messages, newMessage]);
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Left Sidebar */}
      <ChatSidebar
        conversations={conversationsWithStatus}
        selectedId={matchId}
        onSelect={handleSelectConversation}
        unreadCount={3}
      />

      {/* Chat Area */}
      <ChatArea
        matchName={mockMatchProfile.name}
        matchPhoto={mockMatchProfile.photo}
        isOnline={isMatchOnline}
        messages={messages}
        currentUserId="me"
        onSendMessage={handleSendMessage}
        onShowProfile={() => setShowProfile(true)}
      />

      {/* Right Profile Sidebar - Desktop */}
      <div className="hidden xl:block w-80 h-screen border-l border-border flex-shrink-0">
        <ProfileSidebar
          name={mockMatchProfile.name}
          age={mockMatchProfile.age}
          photo={mockMatchProfile.photo}
          isOnline={isMatchOnline}
          location={mockMatchProfile.location}
          bio={mockMatchProfile.bio}
          interests={mockMatchProfile.interests}
          photos={mockMatchProfile.photos}
          className="h-full"
        />
      </div>

      {/* Mobile Profile Sheet */}
      <Sheet open={showProfile} onOpenChange={setShowProfile}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>Profile</SheetTitle>
          </SheetHeader>
          <ProfileSidebar
            name={mockMatchProfile.name}
            age={mockMatchProfile.age}
            photo={mockMatchProfile.photo}
            isOnline={isMatchOnline}
            location={mockMatchProfile.location}
            bio={mockMatchProfile.bio}
            interests={mockMatchProfile.interests}
            photos={mockMatchProfile.photos}
            className="h-full"
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
