import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface CallHistoryItem {
  id: string;
  caller_id: string;
  callee_id: string;
  channel_name: string;
  call_type: 'voice' | 'video';
  status: 'ringing' | 'accepted' | 'declined' | 'ended' | 'missed' | 'busy';
  started_at: string;
  answered_at: string | null;
  ended_at: string | null;
  other_user: {
    id: string;
    display_name: string | null;
    photos: string[] | null;
  } | null;
  is_outgoing: boolean;
  duration_seconds: number | null;
}

export function useCallHistory() {
  const { user } = useAuth();
  const [calls, setCalls] = useState<CallHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCallHistory = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Fetch calls where user was caller or callee
      const { data, error } = await supabase
        .from('call_sessions')
        .select('*')
        .or(`caller_id.eq.${user.id},callee_id.eq.${user.id}`)
        .order('started_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching call history:', error);
        return;
      }

      if (!data || data.length === 0) {
        setCalls([]);
        setLoading(false);
        return;
      }

      // Get unique user IDs to fetch profiles
      const userIds = new Set<string>();
      data.forEach(call => {
        if (call.caller_id !== user.id) userIds.add(call.caller_id);
        if (call.callee_id !== user.id) userIds.add(call.callee_id);
      });

      // Fetch profiles
      const { data: profiles } = await supabase
        .from('profiles_safe')
        .select('id, display_name, photos')
        .in('id', Array.from(userIds));

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Transform data
      const callHistory: CallHistoryItem[] = data.map(call => {
        const isOutgoing = call.caller_id === user.id;
        const otherUserId = isOutgoing ? call.callee_id : call.caller_id;
        const otherUser = profileMap.get(otherUserId) || null;

        // Calculate duration
        let durationSeconds: number | null = null;
        if (call.answered_at && call.ended_at) {
          durationSeconds = Math.floor(
            (new Date(call.ended_at).getTime() - new Date(call.answered_at).getTime()) / 1000
          );
        }

        return {
          id: call.id,
          caller_id: call.caller_id,
          callee_id: call.callee_id,
          channel_name: call.channel_name,
          call_type: call.call_type as 'voice' | 'video',
          status: call.status as CallHistoryItem['status'],
          started_at: call.started_at,
          answered_at: call.answered_at,
          ended_at: call.ended_at,
          other_user: otherUser,
          is_outgoing: isOutgoing,
          duration_seconds: durationSeconds,
        };
      });

      setCalls(callHistory);
    } catch (err) {
      console.error('Failed to fetch call history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCallHistory();
  }, [user]);

  // Subscribe to real-time updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('call_history_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'call_sessions',
          filter: `caller_id=eq.${user.id}`,
        },
        () => fetchCallHistory()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'call_sessions',
          filter: `callee_id=eq.${user.id}`,
        },
        () => fetchCallHistory()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    calls,
    loading,
    refetch: fetchCallHistory,
  };
}
