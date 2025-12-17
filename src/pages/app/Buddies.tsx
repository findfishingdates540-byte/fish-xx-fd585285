import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BuddyCard, BuddyFilters, BuddyRequestCard, MyBuddyCard } from '@/components/buddies';
import { useToast } from '@/hooks/use-toast';
import { Users, UserPlus, Inbox } from 'lucide-react';

interface Profile {
  id: string;
  display_name: string | null;
  photos: string[] | null;
  location_name: string | null;
  fishing_experience: string | null;
  preferred_species: string[] | null;
  bio: string | null;
}

interface BuddyRequest {
  id: string;
  requester_id: string;
  recipient_id: string;
  status: string;
  created_at: string;
}

export default function Buddies() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('discover');
  const [searchQuery, setSearchQuery] = useState('');
  const [experienceFilter, setExperienceFilter] = useState('all');
  
  const [discoverProfiles, setDiscoverProfiles] = useState<Profile[]>([]);
  const [receivedRequests, setReceivedRequests] = useState<(BuddyRequest & { profile: Profile })[]>([]);
  const [sentRequests, setSentRequests] = useState<(BuddyRequest & { profile: Profile })[]>([]);
  const [myBuddies, setMyBuddies] = useState<Profile[]>([]);
  const [requestedIds, setRequestedIds] = useState<Set<string>>(new Set());
  const [catchCounts, setCatchCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    
    try {
      // Fetch all buddy relationships for current user
      const { data: buddyData } = await supabase
        .from('fishing_buddies')
        .select('*')
        .or(`requester_id.eq.${user.id},recipient_id.eq.${user.id}`);

      const existingBuddyIds = new Set<string>();
      const pendingRequestedIds = new Set<string>();
      const acceptedBuddyIds: string[] = [];
      const receivedPending: BuddyRequest[] = [];
      const sentPending: BuddyRequest[] = [];

      buddyData?.forEach((buddy) => {
        const otherId = buddy.requester_id === user.id ? buddy.recipient_id : buddy.requester_id;
        existingBuddyIds.add(otherId);
        
        if (buddy.status === 'accepted') {
          acceptedBuddyIds.push(otherId);
        } else if (buddy.status === 'pending') {
          if (buddy.recipient_id === user.id) {
            receivedPending.push(buddy);
          } else {
            sentPending.push(buddy);
            pendingRequestedIds.add(buddy.recipient_id);
          }
        }
      });

      setRequestedIds(pendingRequestedIds);

      // Fetch profiles for discover (fishing or both mode, excluding existing buddies)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, photos, location_name, fishing_experience, preferred_species, bio')
        .in('account_mode', ['fishing', 'both'])
        .neq('id', user.id)
        .eq('is_active', true)
        .eq('onboarding_completed', true);

      // Filter out existing buddy relationships
      const availableProfiles = profiles?.filter(p => !existingBuddyIds.has(p.id)) || [];
      setDiscoverProfiles(availableProfiles);

      // Fetch profiles for received requests
      if (receivedPending.length > 0) {
        const { data: receivedProfiles } = await supabase
          .from('profiles')
          .select('id, display_name, photos, location_name, fishing_experience')
          .in('id', receivedPending.map(r => r.requester_id));

        const profileMap = new Map(receivedProfiles?.map(p => [p.id, p]));
        setReceivedRequests(receivedPending.map(r => ({
          ...r,
          profile: profileMap.get(r.requester_id) as Profile
        })).filter(r => r.profile));
      } else {
        setReceivedRequests([]);
      }

      // Fetch profiles for sent requests
      if (sentPending.length > 0) {
        const { data: sentProfiles } = await supabase
          .from('profiles')
          .select('id, display_name, photos, location_name, fishing_experience')
          .in('id', sentPending.map(r => r.recipient_id));

        const profileMap = new Map(sentProfiles?.map(p => [p.id, p]));
        setSentRequests(sentPending.map(r => ({
          ...r,
          profile: profileMap.get(r.recipient_id) as Profile
        })).filter(r => r.profile));
      } else {
        setSentRequests([]);
      }

      // Fetch my buddies profiles
      if (acceptedBuddyIds.length > 0) {
        const { data: buddyProfiles } = await supabase
          .from('profiles')
          .select('id, display_name, photos, location_name, fishing_experience, preferred_species, bio')
          .in('id', acceptedBuddyIds);
        setMyBuddies(buddyProfiles || []);
      } else {
        setMyBuddies([]);
      }

      // Fetch catch counts for all relevant profiles
      const allProfileIds = [
        ...availableProfiles.map(p => p.id),
        ...acceptedBuddyIds
      ];
      
      if (allProfileIds.length > 0) {
        const { data: catches } = await supabase
          .from('catches')
          .select('user_id')
          .in('user_id', allProfileIds);

        const counts: Record<string, number> = {};
        catches?.forEach(c => {
          counts[c.user_id] = (counts[c.user_id] || 0) + 1;
        });
        setCatchCounts(counts);
      }

    } catch (error) {
      console.error('Error fetching buddy data:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendBuddyRequest = async (recipientId: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('fishing_buddies')
      .insert({
        requester_id: user.id,
        recipient_id: recipientId,
        status: 'pending'
      });

    if (error) {
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
      setRequestedIds(prev => new Set([...prev, recipientId]));
      fetchData();
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

  const handleMessage = (userId: string) => {
    // TODO: Navigate to messages or create conversation
    toast({
      title: 'Coming Soon',
      description: 'Direct messaging between buddies is coming soon!'
    });
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

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="discover" className="flex items-center gap-2">
            <UserPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Discover</span>
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center gap-2 relative">
            <Inbox className="w-4 h-4" />
            <span className="hidden sm:inline">Requests</span>
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="buddies" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">My Buddies</span>
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
                  onSendRequest={sendBuddyRequest}
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
                  profile={buddy}
                  catchCount={catchCounts[buddy.id] || 0}
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
