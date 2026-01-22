import { Link } from 'react-router-dom';
import { Gift, Search, MoreHorizontal } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { parseISO, formatDistanceToNow } from 'date-fns';
export function FeedRightSidebar() {
  const {
    user
  } = useAuth();
  const queryClient = useQueryClient();

  // Fetch pending buddy requests with mutual buddies count
  const {
    data: pendingRequests = []
  } = useQuery({
    queryKey: ['pending-requests-sidebar', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const {
        data: requests
      } = await supabase.from('fishing_buddies').select('id, requester_id, created_at').eq('recipient_id', user.id).eq('status', 'pending').order('created_at', {
        ascending: false
      }).limit(3);
      if (!requests || requests.length === 0) return [];
      const requesterIds = requests.map(r => r.requester_id);
      const {
        data: profiles
      } = await supabase.from('profiles').select('id, display_name, photos').in('id', requesterIds);

      // Get mutual buddies count for each requester
      const {
        data: myBuddies
      } = await supabase.from('fishing_buddies').select('requester_id, recipient_id').or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`).eq('status', 'accepted');
      const myBuddyIds = new Set(myBuddies?.map(b => b.requester_id === user.id ? b.recipient_id : b.requester_id) || []);

      // For each requester, count mutual buddies
      const mutualCounts: Record<string, number> = {};
      for (const requesterId of requesterIds) {
        const {
          data: theirBuddies
        } = await supabase.from('fishing_buddies').select('requester_id, recipient_id').or(`requester_id.eq.${requesterId},recipient_id.eq.${requesterId}`).eq('status', 'accepted');
        const theirBuddyIds = new Set(theirBuddies?.map(b => b.requester_id === requesterId ? b.recipient_id : b.requester_id) || []);
        let mutual = 0;
        theirBuddyIds.forEach(id => {
          if (myBuddyIds.has(id)) mutual++;
        });
        mutualCounts[requesterId] = mutual;
      }
      return requests.map(r => ({
        ...r,
        profile: profiles?.find(p => p.id === r.requester_id),
        mutualCount: mutualCounts[r.requester_id] || 0
      }));
    },
    enabled: !!user?.id
  });

  // Fetch birthdays today
  const {
    data: birthdays = []
  } = useQuery({
    queryKey: ['birthdays-today', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const {
        data: relationships
      } = await supabase.from('fishing_buddies').select('requester_id, recipient_id').or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`).eq('status', 'accepted');
      if (!relationships || relationships.length === 0) return [];
      const buddyIds = relationships.map(r => r.requester_id === user.id ? r.recipient_id : r.requester_id);
      const {
        data: profiles
      } = await supabase.from('profiles').select('id, display_name, photos, date_of_birth').in('id', buddyIds).not('date_of_birth', 'is', null);
      if (!profiles) return [];
      const today = new Date();
      return profiles.filter(p => {
        if (!p.date_of_birth) return false;
        const dob = parseISO(p.date_of_birth);
        return dob.getMonth() === today.getMonth() && dob.getDate() === today.getDate();
      });
    },
    enabled: !!user?.id
  });

  // Fetch contacts (all buddies, with online status)
  const {
    data: contacts = []
  } = useQuery({
    queryKey: ['contacts-sidebar', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const {
        data: relationships
      } = await supabase.from('fishing_buddies').select('requester_id, recipient_id').or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`).eq('status', 'accepted');
      if (!relationships || relationships.length === 0) return [];
      const buddyIds = relationships.map(r => r.requester_id === user.id ? r.recipient_id : r.requester_id);
      const {
        data: profiles
      } = await supabase.from('profiles').select('id, display_name, photos, last_active_at').in('id', buddyIds).order('last_active_at', {
        ascending: false
      }).limit(15);
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      return (profiles || []).map(p => ({
        ...p,
        isOnline: p.last_active_at && p.last_active_at >= fiveMinutesAgo
      }));
    },
    enabled: !!user?.id,
    refetchInterval: 30000
  });
  const handleAcceptRequest = async (requestId: string) => {
    await supabase.from('fishing_buddies').update({
      status: 'accepted',
      accepted_at: new Date().toISOString()
    }).eq('id', requestId);
    queryClient.invalidateQueries({
      queryKey: ['pending-requests-sidebar']
    });
    queryClient.invalidateQueries({
      queryKey: ['contacts-sidebar']
    });
  };
  const handleDeclineRequest = async (requestId: string) => {
    await supabase.from('fishing_buddies').update({
      status: 'declined'
    }).eq('id', requestId);
    queryClient.invalidateQueries({
      queryKey: ['pending-requests-sidebar']
    });
  };
  const formatRequestTime = (createdAt: string) => {
    return formatDistanceToNow(new Date(createdAt), {
      addSuffix: false
    }).replace(' days', 'd').replace(' day', 'd').replace(' hours', 'h').replace(' hour', 'h').replace(' minutes', 'm').replace(' minute', 'm').replace('about ', '').replace('less than a minute', '1m');
  };
  return <div className="sticky top-20 space-y-4">
      {/* Buddy Requests - Facebook Style */}
      <div className="pb-3 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-muted-foreground text-[17px]">Buddy requests</h3>
          <Link to="/app/buddies" className="text-sm text-primary hover:underline font-medium">
            See all
          </Link>
        </div>
        
        {pendingRequests.length > 0 ? <div className="space-y-3">
            {pendingRequests.map(request => <div key={request.id} className="flex gap-3">
                <Link to={`/app/profile/${request.requester_id}`}>
                  <Avatar className="h-[60px] w-[60px] rounded-lg">
                    <AvatarImage src={request.profile?.photos?.[0]} className="object-cover" />
                    <AvatarFallback className="rounded-lg text-lg">
                      {request.profile?.display_name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <Link to={`/app/profile/${request.requester_id}`} className="font-semibold text-[15px] hover:underline truncate block">
                      {request.profile?.display_name || 'Someone'}
                    </Link>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {formatRequestTime(request.created_at)}
                    </span>
                  </div>
                  {request.mutualCount > 0 && <p className="text-xs text-muted-foreground mt-0.5">
                      {request.mutualCount} mutual friend{request.mutualCount !== 1 ? 's' : ''}
                    </p>}
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" className="h-9 flex-1 text-sm font-semibold bg-primary hover:bg-primary/90" onClick={() => handleAcceptRequest(request.id)}>
                      Confirm
                    </Button>
                    <Button size="sm" variant="secondary" className="h-9 flex-1 text-sm font-semibold" onClick={() => handleDeclineRequest(request.id)}>
                      Delete
                    </Button>
                  </div>
                </div>
              </div>)}
          </div> : <p className="text-sm text-muted-foreground">No pending requests</p>}
      </div>

      {/* Birthdays - Facebook Style */}
      <div className="pb-3 border-b border-border">
        <div className="flex items-center gap-2 mb-2">
          <Gift className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-muted-foreground text-[17px]">Birthdays</h3>
        </div>
        
        {birthdays.length > 0 ? <div className="space-y-2">
            {birthdays.map(buddy => <Link key={buddy.id} to={`/app/u/${buddy.id}`} className="flex items-center gap-2 py-1 hover:bg-muted/50 rounded-md px-1 -mx-1 transition-colors">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={buddy.photos?.[0]} />
                  <AvatarFallback className="text-xs">
                    {buddy.display_name?.charAt(0) || '?'}
                  </AvatarFallback>
                </Avatar>
                <p className="text-sm">
                  <span className="font-semibold">{buddy.display_name}</span>
                  <span className="text-muted-foreground">'s birthday is today.</span>
                </p>
              </Link>)}
          </div> : <p className="text-sm text-muted-foreground">No birthdays today</p>}
      </div>

      {/* Contacts - Facebook Style */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-muted-foreground text-[17px]">Buddies</h3>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <Search className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {contacts.length > 0 ? <div className="space-y-0.5">
            {contacts.map(contact => <Link key={contact.id} to={`/app/buddy-messages`} className="flex items-center gap-3 py-2 px-2 -mx-2 rounded-lg hover:bg-muted/50 transition-colors">
                <div className="relative">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={contact.photos?.[0]} />
                    <AvatarFallback className="text-xs">
                      {contact.display_name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  {contact.isOnline && <span className="absolute bottom-0 right-0 h-3 w-3 bg-emerald-500 rounded-full border-2 border-background" />}
                </div>
                <span className="text-[15px] font-medium truncate">{contact.display_name}</span>
              </Link>)}
          </div> : <p className="text-sm text-muted-foreground">No contacts yet</p>}
      </div>

      {/* Footer Links - Facebook Style */}
      <div className="pt-4 text-[13px] text-muted-foreground/70">
        <div className="flex flex-wrap gap-x-1.5 gap-y-0.5 mb-1">
          <Link to="/about" className="hover:underline">About</Link>
          <span>·</span>
          <Link to="/safety" className="hover:underline">Safety</Link>
          <span>·</span>
          <Link to="/help" className="hover:underline">Help</Link>
          <span>·</span>
          <Link to="/privacy" className="hover:underline">Privacy</Link>
          <span>·</span>
          <Link to="/terms" className="hover:underline">Terms</Link>
        </div>
        <p>© 2025 Find Fishing Date LLC</p>
      </div>
    </div>;
}