import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { EyeOff, Undo2, Loader2, UserX } from 'lucide-react';

interface HiddenProfile {
  id: string;
  recipientId: string;
  displayName: string | null;
  photo: string | null;
  locationName: string | null;
}

export function HiddenProfilesSection() {
  const { user } = useAuth();
  const [hiddenProfiles, setHiddenProfiles] = useState<HiddenProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [unhidingId, setUnhidingId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchHiddenProfiles();
    }
  }, [user]);

  const fetchHiddenProfiles = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Fetch dismissed buddy relationships
      const { data: dismissedData, error: dismissedError } = await supabase
        .from('fishing_buddies')
        .select('id, recipient_id')
        .eq('requester_id', user.id)
        .eq('status', 'dismissed');

      if (dismissedError) throw dismissedError;

      if (!dismissedData || dismissedData.length === 0) {
        setHiddenProfiles([]);
        setLoading(false);
        return;
      }

      // Fetch profile info for hidden users
      const recipientIds = dismissedData.map(d => d.recipient_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('public_profiles')
        .select('id, display_name, photos, location_name')
        .in('id', recipientIds);

      if (profilesError) throw profilesError;

      const profileMap = new Map(profiles?.map(p => [p.id, p]));
      const hidden: HiddenProfile[] = dismissedData
        .map(d => {
          const profile = profileMap.get(d.recipient_id);
          return {
            id: d.id,
            recipientId: d.recipient_id,
            displayName: profile?.display_name || null,
            photo: profile?.photos?.[0] || null,
            locationName: profile?.location_name || null,
          };
        })
        .filter(h => h.displayName !== null);

      setHiddenProfiles(hidden);
    } catch (error) {
      console.error('Error fetching hidden profiles:', error);
      toast.error('Failed to load hidden profiles');
    } finally {
      setLoading(false);
    }
  };

  const unhideProfile = async (buddyRelationId: string) => {
    if (!user) return;
    setUnhidingId(buddyRelationId);

    try {
      const { error } = await supabase
        .from('fishing_buddies')
        .delete()
        .eq('id', buddyRelationId)
        .eq('requester_id', user.id);

      if (error) throw error;

      setHiddenProfiles(prev => prev.filter(p => p.id !== buddyRelationId));
      toast.success('Profile unhidden - they will appear in discovery again');
    } catch (error) {
      console.error('Error unhiding profile:', error);
      toast.error('Failed to unhide profile');
    } finally {
      setUnhidingId(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <EyeOff className="h-5 w-5 text-muted-foreground" />
            <h3 className="font-semibold">Hidden Profiles</h3>
          </div>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <EyeOff className="h-5 w-5 text-muted-foreground" />
          <div>
            <h3 className="font-semibold">Hidden Profiles</h3>
            <p className="text-sm text-muted-foreground">
              Profiles you've hidden from buddy discovery
            </p>
          </div>
        </div>

        {hiddenProfiles.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <UserX className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No hidden profiles</p>
            <p className="text-xs">Profiles you hide in Buddies discovery will appear here</p>
          </div>
        ) : (
          <div className="space-y-3">
            {hiddenProfiles.map((profile) => {
              const initials = profile.displayName
                ?.split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2) || '?';

              return (
                <div
                  key={profile.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={profile.photo || undefined} alt={profile.displayName || 'User'} />
                    <AvatarFallback>{initials}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{profile.displayName}</p>
                    {profile.locationName && (
                      <p className="text-xs text-muted-foreground truncate">
                        {profile.locationName}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => unhideProfile(profile.id)}
                    disabled={unhidingId === profile.id}
                  >
                    {unhidingId === profile.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Undo2 className="h-4 w-4 mr-1" />
                        Unhide
                      </>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
