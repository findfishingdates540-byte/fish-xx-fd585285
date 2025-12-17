import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const PRESENCE_CHANNEL = 'online-users';
const IDLE_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const HEARTBEAT_INTERVAL = 30 * 1000; // 30 seconds

interface PresenceState {
  odline_at: string;
  user_id: string;
}

export function useOnlinePresence() {
  const { user } = useAuth();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const heartbeatRef = useRef<NodeJS.Timeout | null>(null);
  const idleRef = useRef<NodeJS.Timeout | null>(null);

  const updatePresence = useCallback(async () => {
    if (channelRef.current && user?.id) {
      await channelRef.current.track({
        online_at: new Date().toISOString(),
        user_id: user.id
      });
    }
  }, [user?.id]);

  const resetIdleTimer = useCallback(() => {
    if (idleRef.current) {
      clearTimeout(idleRef.current);
    }
    updatePresence();
    idleRef.current = setTimeout(() => {
      // User is idle - untrack presence
      if (channelRef.current) {
        channelRef.current.untrack();
      }
    }, IDLE_TIMEOUT);
  }, [updatePresence]);

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase.channel(PRESENCE_CHANNEL, {
      config: { presence: { key: user.id } }
    });

    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          online_at: new Date().toISOString(),
          user_id: user.id
        });
      }
    });

    channelRef.current = channel;

    // Heartbeat to keep presence alive
    heartbeatRef.current = setInterval(updatePresence, HEARTBEAT_INTERVAL);

    // Track user activity
    const activityEvents = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    activityEvents.forEach(event => {
      window.addEventListener(event, resetIdleTimer, { passive: true });
    });

    // Handle visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updatePresence();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Handle beforeunload
    const handleBeforeUnload = () => {
      channel.untrack();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      if (idleRef.current) clearTimeout(idleRef.current);
      activityEvents.forEach(event => {
        window.removeEventListener(event, resetIdleTimer);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      channel.untrack();
      supabase.removeChannel(channel);
    };
  }, [user?.id, updatePresence, resetIdleTimer]);
}

export function useOnlineStatus(userIds: string[]) {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (userIds.length === 0) return;

    const channel = supabase.channel(PRESENCE_CHANNEL);

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const online = new Set<string>();
        
        Object.keys(state).forEach(userId => {
          if (userIds.includes(userId)) {
            online.add(userId);
          }
        });
        
        setOnlineUsers(online);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userIds.join(',')]);

  const isOnline = useCallback((userId: string) => {
    return onlineUsers.has(userId);
  }, [onlineUsers]);

  return { onlineUsers, isOnline };
}
