import { useEffect, useState } from 'react';
import { Settings, ChevronDown, ChevronUp, UserPlus, Check } from 'lucide-react';
import { toast } from 'sonner';
import { NavLink, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useDatingConversations } from '@/hooks/use-dating-conversations';
import { SidebarMatchQueue } from './SidebarMatchQueue';
import { SidebarConversationItem } from './SidebarConversationItem';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import logoImage from '@/assets/logo.png';

interface DiscoverSidebarProps {
  userName: string;
  userPhoto?: string;
  isPremium?: boolean;
  pendingLikes?: { id: string; name: string; photo: string }[];
  newMatches?: { id: string; name: string; photo: string; isOnline?: boolean }[];
  onMatchClick?: (matchId: string) => void;
}

export function DiscoverSidebar({
  userName,
  userPhoto,
  isPremium,
  pendingLikes = [],
  newMatches = [],
  onMatchClick,
}: DiscoverSidebarProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [conversationsOpen, setConversationsOpen] = useState(true);
  
  // Fetch conversations using the optimized hook
  const { conversations, isLoading: conversationsLoading } = useDatingConversations();

  // Real-time subscription for updates
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel("bumble-sidebar-updates")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["dating-conversations", user.id] });
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "matches",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["dating-conversations", user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  const initials = userName?.charAt(0)?.toUpperCase() || 'U';

  // Invite button component
  const InviteButton = ({ userId }: { userId?: string }) => {
    const [copied, setCopied] = useState(false);
    
    const handleInvite = async () => {
      const PRODUCTION_URL = 'https://findfishingdates.net';
      const inviteUrl = `${PRODUCTION_URL}?ref=${userId?.slice(0, 8)}`;
      
      try {
        if (navigator.share) {
          await navigator.share({
            title: 'Join me on Find Fishing Dates!',
            text: 'Find fishing buddies and dates who share your passion.',
            url: inviteUrl,
          });
        } else {
          await navigator.clipboard.writeText(inviteUrl);
          setCopied(true);
          toast.success('Invite link copied!');
          setTimeout(() => setCopied(false), 2000);
        }
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          await navigator.clipboard.writeText(inviteUrl);
          setCopied(true);
          toast.success('Invite link copied!');
          setTimeout(() => setCopied(false), 2000);
        }
      }
    };

    return (
      <button 
        onClick={handleInvite}
        className="text-muted-foreground hover:text-foreground transition-colors"
        title="Invite Friends"
      >
        {copied ? <Check className="h-5 w-5 text-green-500" /> : <UserPlus className="h-5 w-5" />}
      </button>
    );
  };

  return (
    <aside className="hidden lg:flex flex-col w-80 h-screen border-r border-border bg-background fixed top-0 left-0 z-40">
      {/* Brand Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <img src={logoImage} alt="Find Fishing Dates" className="h-8 w-8 rounded-lg" />
          <span className="font-bold text-lg">Find Fishing Dates</span>
        </div>
      </div>

      {/* Match Queue */}
      <SidebarMatchQueue
        pendingLikes={pendingLikes}
        newMatches={newMatches}
        isPremium={isPremium}
        onMatchClick={onMatchClick}
      />

      {/* Conversations List */}
      <Collapsible
        open={conversationsOpen}
        onOpenChange={setConversationsOpen}
        className="flex-1 flex flex-col min-h-0"
      >
        <CollapsibleTrigger className="flex items-center justify-between px-4 py-3 hover:bg-accent/50 transition-colors">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Conversations
          </h3>
          {conversationsOpen ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </CollapsibleTrigger>

        <CollapsibleContent className="flex-1 overflow-y-auto scrollbar-hide">
          {conversationsLoading ? (
            <div className="px-4 py-8 text-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <p className="text-sm text-muted-foreground">No conversations yet</p>
              <p className="text-xs text-muted-foreground mt-1">
                Start swiping to find matches!
              </p>
            </div>
          ) : (
            <div className="px-2 pb-2">
              {conversations.map((conv) => (
                <SidebarConversationItem
                  key={conv.id}
                  id={conv.id}
                  name={conv.name}
                  photo={conv.photo}
                  lastMessage={conv.lastMessage}
                  time={conv.time}
                  unreadCount={conv.unreadCount}
                  isOnline={conv.isOnline}
                  isYourMove={conv.lastSenderId !== user?.id && conv.lastSenderId !== null}
                  matchedAt={conv.lastMessageTime || undefined}
                  onClick={() => navigate(`/app/messages/${conv.id}`)}
                />
              ))}
            </div>
          )}
        </CollapsibleContent>
      </Collapsible>

      {/* User Profile Footer */}
      <div className="flex items-center gap-3 p-4 border-t border-border mt-auto">
        <NavLink to="/app/profile" className="flex items-center gap-3 flex-1 min-w-0 hover:opacity-80 transition-opacity">
          <Avatar className="h-10 w-10">
            <AvatarImage src={userPhoto} alt={userName} />
            <AvatarFallback className="bg-muted text-muted-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{userName}</p>
            <p className="text-xs text-muted-foreground">
              {isPremium ? 'Pro Member' : 'Free Member'}
            </p>
          </div>
        </NavLink>
        <InviteButton userId={user?.id} />
        <NavLink to="/app/settings" className="text-muted-foreground hover:text-foreground">
          <Settings className="h-5 w-5" />
        </NavLink>
      </div>
    </aside>
  );
}
