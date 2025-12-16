import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

interface ConversationPreview {
  matchId: string;
  otherUser: {
    id: string;
    display_name: string;
    photos: string[];
  };
  lastMessage?: {
    content: string;
    created_at: string;
    sender_id: string;
    is_read: boolean;
  };
}

export default function Messages() {
  const { user } = useAuth();

  const { data: conversations, isLoading } = useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: async (): Promise<ConversationPreview[]> => {
      if (!user?.id) return [];

      // Get all matches where is_match = true
      const { data: matches, error: matchError } = await supabase
        .from('matches')
        .select('id, user1_id, user2_id, matched_at')
        .eq('is_match', true)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('matched_at', { ascending: false });

      if (matchError || !matches) return [];

      // Get other user IDs
      const otherUserIds = matches.map(m => 
        m.user1_id === user.id ? m.user2_id : m.user1_id
      );

      // Fetch profiles for other users
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, photos')
        .in('id', otherUserIds);

      // Fetch last message for each match
      const { data: lastMessages } = await supabase
        .from('messages')
        .select('match_id, content, created_at, sender_id, is_read')
        .in('match_id', matches.map(m => m.id))
        .order('created_at', { ascending: false });

      // Build conversation previews
      return matches.map(match => {
        const otherUserId = match.user1_id === user.id ? match.user2_id : match.user1_id;
        const profile = profiles?.find(p => p.id === otherUserId);
        const lastMessage = lastMessages?.find(m => m.match_id === match.id);

        return {
          matchId: match.id,
          otherUser: {
            id: otherUserId,
            display_name: profile?.display_name || 'User',
            photos: profile?.photos || [],
          },
          lastMessage: lastMessage ? {
            content: lastMessage.content,
            created_at: lastMessage.created_at,
            sender_id: lastMessage.sender_id,
            is_read: lastMessage.is_read ?? true,
          } : undefined,
        };
      }).sort((a, b) => {
        // Sort by last message time, or matched_at if no messages
        const aTime = a.lastMessage?.created_at || '';
        const bTime = b.lastMessage?.created_at || '';
        return bTime.localeCompare(aTime);
      });
    },
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="h-14 w-14 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-48" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!conversations || conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)] p-4">
        <MessageCircle className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">No messages yet</h2>
        <p className="text-muted-foreground text-center">
          Start swiping to match with others and begin chatting!
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border">
      {conversations.map(convo => {
        const avatarUrl = convo.otherUser.photos?.[0] || '';
        const initials = convo.otherUser.display_name?.charAt(0)?.toUpperCase() || 'U';
        const isUnread = convo.lastMessage && 
          !convo.lastMessage.is_read && 
          convo.lastMessage.sender_id !== user?.id;

        return (
          <Link
            key={convo.matchId}
            to={`/app/messages/${convo.matchId}`}
            className="flex items-center gap-3 p-4 hover:bg-secondary/50 transition-colors"
          >
            <Avatar className="h-14 w-14 border border-border">
              <AvatarImage src={avatarUrl} alt={convo.otherUser.display_name} />
              <AvatarFallback className="bg-muted text-muted-foreground">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <h3 className={`font-medium truncate ${isUnread ? 'text-foreground' : 'text-foreground'}`}>
                  {convo.otherUser.display_name}
                </h3>
                {convo.lastMessage && (
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(convo.lastMessage.created_at), { addSuffix: true })}
                  </span>
                )}
              </div>
              <p className={`text-sm truncate ${isUnread ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                {convo.lastMessage 
                  ? (convo.lastMessage.sender_id === user?.id ? 'You: ' : '') + convo.lastMessage.content
                  : 'Say hello! 👋'
                }
              </p>
            </div>

            {isUnread && (
              <div className="h-2.5 w-2.5 rounded-full bg-foreground" />
            )}
          </Link>
        );
      })}
    </div>
  );
}
