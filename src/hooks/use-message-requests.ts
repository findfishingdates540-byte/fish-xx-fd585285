import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface MessageRequest {
  buddyId: string;
  requesterId: string;
  requesterName: string;
  requesterPhoto: string;
  lastMessage: string | null;
  lastMessageTime: string | null;
  messageCount: number;
  createdAt: string;
}

export function useMessageRequests() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['message-requests', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get pending buddy requests where the current user is the recipient
      // and there are messages from the requester
      const { data: pendingBuddies, error } = await supabase
        .from('fishing_buddies')
        .select('id, requester_id, created_at')
        .eq('recipient_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!pendingBuddies || pendingBuddies.length === 0) return [];

      // Fetch requester profiles via the public-readable view (RLS on `profiles` blocks direct reads of other users)
      const requesterIds = Array.from(new Set(pendingBuddies.map((b) => b.requester_id)));
      const { data: profilesData } = await supabase
        .from('profiles_safe')
        .select('id, display_name, photos')
        .in('id', requesterIds);
      const profileMap = new Map(
        (profilesData || []).map((p) => [p.id, p as { id: string; display_name: string | null; photos: string[] | null }])
      );

      // Get message counts and last messages for each pending buddy
      const requests: MessageRequest[] = [];
      
      for (const buddy of pendingBuddies) {
        const { data: messages } = await supabase
          .from('buddy_messages')
          .select('content, created_at')
          .eq('buddy_id', buddy.id)
          .order('created_at', { ascending: false })
          .limit(1);

        const { count } = await supabase
          .from('buddy_messages')
          .select('*', { count: 'exact', head: true })
          .eq('buddy_id', buddy.id);

        // Only include if there are messages
        if (count && count > 0) {
          const requesterProfile = profileMap.get(buddy.requester_id);
          requests.push({
            buddyId: buddy.id,
            requesterId: buddy.requester_id,
            requesterName: requesterProfile?.display_name || 'Anonymous',
            requesterPhoto: requesterProfile?.photos?.[0] || '',
            lastMessage: messages?.[0]?.content || null,
            lastMessageTime: messages?.[0]?.created_at || null,
            messageCount: count,
            createdAt: buddy.created_at,
          });
        }
      }

      return requests;
    },
    enabled: !!user?.id,
  });
}

export function useAcceptMessageRequest() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (buddyId: string) => {
      if (!user?.id) throw new Error('Must be logged in');

      const { error } = await supabase
        .from('fishing_buddies')
        .update({ 
          status: 'accepted',
          accepted_at: new Date().toISOString()
        })
        .eq('id', buddyId)
        .eq('recipient_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-requests', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['buddy-conversations', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['pending-buddy-requests', user?.id] });
      toast.success('Message request accepted!');
    },
    onError: () => {
      toast.error('Failed to accept request');
    },
  });
}

export function useDeclineMessageRequest() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (buddyId: string) => {
      if (!user?.id) throw new Error('Must be logged in');

      // Delete the buddy connection and associated messages
      const { error: msgError } = await supabase
        .from('buddy_messages')
        .delete()
        .eq('buddy_id', buddyId);

      if (msgError) throw msgError;

      const { error } = await supabase
        .from('fishing_buddies')
        .delete()
        .eq('id', buddyId)
        .eq('recipient_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-requests', user?.id] });
      toast.success('Message request declined');
    },
    onError: () => {
      toast.error('Failed to decline request');
    },
  });
}
