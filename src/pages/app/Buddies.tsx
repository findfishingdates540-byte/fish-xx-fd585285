import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BuddyCard, BuddyFilters, BuddyRequestCard, MyBuddyCard } from '@/components/buddies';
import { useToast } from '@/hooks/use-toast';
import { useOnlineStatus, formatLastSeen } from '@/hooks/use-online-presence';
import { useBuddyData } from '@/hooks/use-buddy-data';
import { useQueryClient } from '@tanstack/react-query';
import { Users, UserPlus, Inbox, MessageCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Profile {
  id: string;
  display_name: string | null;
  photos: string[] | null;
  location_name: string | null;
  fishing_experience: string | null;
  preferred_species: string[] | null;
  bio: string | null;
  id_verified?: boolean;
  live_verified?: boolean;
}

interface BuddyRequest {
  id: string;
  requester_id: string;
  recipient_id: string;
  status: string;
  created_at: string;
}

interface MyBuddy extends Profile {
  buddyId: string;
}

export default function Buddies() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('discover');
  const [searchQuery, setSearchQuery] = useState('');
  const [experienceFilter, setExperienceFilter] = useState('all');
  
  // Use the optimized RPC-based hook
  const { data: buddyData, isLoading: loading, refetch: fetchData } = useBuddyData();
  
  // Local state for optimistic updates
  const [localDiscoverProfiles, setLocalDiscoverProfiles] = useState<Profile[]>([]);
  const [localSentRequests, setLocalSentRequests] = useState<(BuddyRequest & { profile: Profile })[]>([]);
  const [localRequestedIds, setLocalRequestedIds] = useState<Set<string>>(new Set());
  
  // Sync local state with fetched data
  useEffect(() => {
    if (buddyData) {
      setLocalDiscoverProfiles(buddyData.discover_profiles);
      setLocalSentRequests(buddyData.sent_requests);
      setLocalRequestedIds(new Set(buddyData.requested_ids));
    }
  }, [buddyData]);
  
  const discoverProfiles = localDiscoverProfiles;
  const receivedRequests = buddyData?.received_requests || [];
  const sentRequests = localSentRequests;
  const myBuddies = buddyData?.my_buddies || [];
  const catchCounts = buddyData?.catch_counts || {};
  const requestedIds = localRequestedIds;

  // Get all user IDs to track online status
  const allUserIds = useMemo(() => {
    const ids = new Set<string>();
    discoverProfiles.forEach(p => ids.add(p.id));
    myBuddies.forEach(b => ids.add(b.id));
    return Array.from(ids);
  }, [discoverProfiles, myBuddies]);

  const { isOnline, getLastSeen } = useOnlineStatus(allUserIds);

  // Debounce ref for real-time updates
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced refetch to prevent scroll position reset
  const debouncedRefetch = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      fetchData();
    }, 2000);
  }, [fetchData]);

  // Real-time subscription for buddy updates (only for incoming changes, not our own)
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('buddies-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'fishing_buddies',
          filter: `recipient_id=eq.${user.id}`,
        },
        () => {
          // Only refetch for incoming requests/changes (when we are the recipient)
          debouncedRefetch();
        }
      )
      .subscribe();

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      supabase.removeChannel(channel);
    };
  }, [user, debouncedRefetch]);

  const sendBuddyRequest = async (recipientId: string) => {
    if (!user) return;

    // Find the profile from discover list for optimistic update
    const targetProfile = discoverProfiles.find(p => p.id === recipientId);

    // Optimistically update UI immediately
    setLocalRequestedIds(prev => new Set([...prev, recipientId]));
    
    // Optimistically add to sent requests so it shows in Requests tab immediately
    if (targetProfile) {
      const optimisticRequest = {
        id: `temp-${Date.now()}`, // Temporary ID
        requester_id: user.id,
        recipient_id: recipientId,
        status: 'pending',
        created_at: new Date().toISOString(),
        profile: targetProfile
      };
      setLocalSentRequests(prev => [optimisticRequest, ...prev]);
      
      // Remove from discover profiles
      setLocalDiscoverProfiles(prev => prev.filter(p => p.id !== recipientId));
    }

    const { error } = await supabase
      .from('fishing_buddies')
      .insert({
        requester_id: user.id,
        recipient_id: recipientId,
        status: 'pending'
      });

    if (error) {
      // Revert optimistic updates on error
      setLocalRequestedIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(recipientId);
        return newSet;
      });
      setLocalSentRequests(prev => prev.filter(r => r.recipient_id !== recipientId));
      if (targetProfile) {
        setLocalDiscoverProfiles(prev => [targetProfile, ...prev]);
      }
      toast({
        title: 'Error',
        description: 'Failed to send buddy request',
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Request Sent',
        description: 'Buddy request sent successfully!'
      });
    }
  };

  const acceptRequest = async (requestId: string) => {
    const { error } = await supabase
      .from('fishing_buddies')
      .update({ status: 'accepted', accepted_at: new Date().toISOString() })
      .eq('id', requestId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to accept request',
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Buddy Added',
        description: 'You are now fishing buddies!'
      });
      fetchData();
    }
  };

  const declineRequest = async (requestId: string) => {
    const { error } = await supabase
      .from('fishing_buddies')
      .update({ status: 'declined' })
      .eq('id', requestId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to decline request',
        variant: 'destructive'
      });
    } else {
      fetchData();
    }
  };

  const cancelRequest = async (requestId: string) => {
    const { error } = await supabase
      .from('fishing_buddies')
      .delete()
      .eq('id', requestId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to cancel request',
        variant: 'destructive'
      });
    } else {
      fetchData();
    }
  };

  const removeBuddy = async (buddyId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('fishing_buddies')
      .delete()
      .or(`and(requester_id.eq.${user.id},recipient_id.eq.${buddyId}),and(requester_id.eq.${buddyId},recipient_id.eq.${user.id})`);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove buddy',
        variant: 'destructive'
      });
    } else {
      toast({
        title: 'Buddy Removed',
        description: 'Buddy has been removed'
      });
      fetchData();
    }
  };

  const handleMessage = (buddyId: string) => {
    navigate(`/app/buddy-chat/${buddyId}`);
  };

  const handleViewAllMessages = () => {
    navigate('/app/buddy-messages');
  };

  const dismissProfile = async (profileId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('fishing_buddies')
      .insert({
        requester_id: user.id,
        recipient_id: profileId,
        status: 'dismissed'
      });

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to hide profile',
        variant: 'destructive'
      });
    } else {
      // Optimistically remove from local state
      setLocalDiscoverProfiles(prev => prev.filter(p => p.id !== profileId));
      toast({
        title: 'Profile Hidden',
        description: "This angler won't appear in your discovery"
      });
    }
  };

  // Filter discover profiles
  const filteredProfiles = discoverProfiles.filter(profile => {
    const matchesSearch = !searchQuery || 
      profile.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      profile.location_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesExperience = experienceFilter === 'all' || 
      profile.fishing_experience === experienceFilter;
    return matchesSearch && matchesExperience;
  });

  const pendingCount = receivedRequests.length;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)] p-4">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto p-4 pb-24 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Fishing Buddies</h1>
        <p className="text-muted-foreground">Connect with fellow anglers</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex w-full h-auto p-1 overflow-hidden">
          <TabsTrigger value="discover" className="flex-1 min-w-0 flex items-center justify-center gap-1.5 px-2 py-2.5 text-xs sm:text-sm">
            <UserPlus className="w-4 h-4 shrink-0" />
            <span className="truncate">Discover</span>
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex-1 min-w-0 flex items-center justify-center gap-1.5 px-2 py-2.5 text-xs sm:text-sm relative">
            <Inbox className="w-4 h-4 shrink-0" />
            <span className="truncate">Requests</span>
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="buddies" className="flex-1 min-w-0 flex items-center justify-center gap-1.5 px-2 py-2.5 text-xs sm:text-sm">
            <Users className="w-4 h-4 shrink-0" />
            <span className="truncate">Buddies</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="discover" className="space-y-4 mt-4">
          <BuddyFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            experienceFilter={experienceFilter}
            onExperienceChange={setExperienceFilter}
          />
          
          {filteredProfiles.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <UserPlus className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No anglers found</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProfiles.map(profile => (
                <BuddyCard
                  key={profile.id}
                  profile={profile}
                  catchCount={catchCounts[profile.id] || 0}
                  isRequested={requestedIds.has(profile.id)}
                  isOnline={isOnline(profile.id)}
                  lastSeen={formatLastSeen(getLastSeen(profile.id))}
                  onSendRequest={sendBuddyRequest}
                  onHide={dismissProfile}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="requests" className="space-y-6 mt-4">
          <div className="space-y-4">
            <h3 className="font-semibold">Received ({receivedRequests.length})</h3>
            {receivedRequests.length === 0 ? (
              <p className="text-muted-foreground text-sm">No pending requests</p>
            ) : (
              <div className="space-y-3">
                {receivedRequests.map(request => (
                  <BuddyRequestCard
                    key={request.id}
                    request={request}
                    type="received"
                    onAccept={acceptRequest}
                    onDecline={declineRequest}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold">Sent ({sentRequests.length})</h3>
            {sentRequests.length === 0 ? (
              <p className="text-muted-foreground text-sm">No sent requests</p>
            ) : (
              <div className="space-y-3">
                {sentRequests.map(request => (
                  <BuddyRequestCard
                    key={request.id}
                    request={request}
                    type="sent"
                    onCancel={cancelRequest}
                  />
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="buddies" className="space-y-4 mt-4">
          {myBuddies.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No fishing buddies yet</p>
              <p className="text-sm">Start connecting with anglers in Discover!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {myBuddies.map(buddy => (
                <MyBuddyCard
                  key={buddy.id}
                  buddyId={buddy.buddyId}
                  profile={buddy}
                  catchCount={catchCounts[buddy.id] || 0}
                  isOnline={isOnline(buddy.id)}
                  lastSeen={getLastSeen(buddy.id)}
                  onMessage={handleMessage}
                  onRemove={removeBuddy}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
