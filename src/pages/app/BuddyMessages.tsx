import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Search, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BuddyConversation {
  buddyId: string;
  buddyProfile: {
    id: string;
    display_name: string | null;
    photos: string[] | null;
  };
  lastMessage?: {
    content: string;
    created_at: string;
    sender_id: string;
  };
  unreadCount: number;
}

export default function BuddyMessages() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<BuddyConversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  const fetchConversations = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Get all accepted buddy relationships
      const { data: buddies } = await supabase
        .from('fishing_buddies')
        .select('id, requester_id, recipient_id')
        .eq('status', 'accepted')
        .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`);

      if (!buddies || buddies.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      // Get buddy profile IDs
      const buddyProfileIds = buddies.map(b => 
        b.requester_id === user.id ? b.recipient_id : b.requester_id
      );

      // Fetch profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, photos')
        .in('id', buddyProfileIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]));

      // Fetch last message and unread count for each buddy
      const conversationData: BuddyConversation[] = [];

      for (const buddy of buddies) {
        const otherUserId = buddy.requester_id === user.id ? buddy.recipient_id : buddy.requester_id;
        const profile = profileMap.get(otherUserId);

        if (!profile) continue;

        // Get last message
        const { data: lastMessages } = await supabase
          .from('buddy_messages')
          .select('content, created_at, sender_id')
          .eq('buddy_id', buddy.id)
          .order('created_at', { ascending: false })
          .limit(1);

        // Get unread count
        const { count: unreadCount } = await supabase
          .from('buddy_messages')
          .select('*', { count: 'exact', head: true })
          .eq('buddy_id', buddy.id)
          .eq('is_read', false)
          .neq('sender_id', user.id);

        conversationData.push({
          buddyId: buddy.id,
          buddyProfile: profile,
          lastMessage: lastMessages?.[0],
          unreadCount: unreadCount || 0
        });
      }

      // Sort by last message time
      conversationData.sort((a, b) => {
        const timeA = a.lastMessage?.created_at || '1970-01-01';
        const timeB = b.lastMessage?.created_at || '1970-01-01';
        return new Date(timeB).getTime() - new Date(timeA).getTime();
      });

      setConversations(conversationData);
    } catch (error) {
      console.error('Error fetching buddy conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.buddyProfile.display_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)] p-4">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto p-4 pb-24 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Buddy Messages</h1>
        <p className="text-muted-foreground">Chat with your fishing buddies</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          placeholder="Search conversations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredConversations.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No buddy conversations yet</p>
          <p className="text-sm">Start chatting with your fishing buddies!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filteredConversations.map((conv) => (
            <button
              key={conv.buddyId}
              onClick={() => navigate(`/app/buddy-chat/${conv.buddyId}`)}
              className={cn(
                "w-full p-4 rounded-lg border flex items-center gap-4 hover:bg-muted/50 transition-colors text-left",
                conv.unreadCount > 0 && "bg-muted/30"
              )}
            >
              <Avatar className="h-12 w-12">
                <AvatarImage src={conv.buddyProfile.photos?.[0]} className="object-cover" />
                <AvatarFallback>
                  {conv.buddyProfile.display_name?.charAt(0)?.toUpperCase() || '?'}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className={cn(
                    "font-medium",
                    conv.unreadCount > 0 && "font-semibold"
                  )}>
                    {conv.buddyProfile.display_name || 'Anonymous'}
                  </span>
                  {conv.lastMessage && (
                    <span className="text-xs text-muted-foreground">
                      {formatTime(conv.lastMessage.created_at)}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <p className={cn(
                    "text-sm truncate",
                    conv.unreadCount > 0 ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {conv.lastMessage?.content || 'No messages yet'}
                  </p>
                  {conv.unreadCount > 0 && (
                    <span className="bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center ml-2">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
