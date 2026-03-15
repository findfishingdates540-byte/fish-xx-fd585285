import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const PRESENCE_CHANNEL = 'online-users';
const IDLE_TIMEOUT = 5 * 60 * 1000; // 5 minutes
const HEARTBEAT_INTERVAL = 30 * 1000; // 30 seconds
const DB_UPDATE_INTERVAL = 60 * 1000; // 1 minute

interface PresenceState {
  online_at: string;
  user_id: string;
}

export function useOnlinePresence() {
  const { user } = useAuth();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const idleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dbUpdateRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Update last_active_at in database
  const updateLastActiveInDb = useCallback(async () => {
    if (!user?.id) return;
    await supabase
      .from('profiles')
      .update({ last_active_at: new Date().toISOString() })
      .eq('id', user.id);
  }, [user?.id]);

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
        // Update database immediately on connect
        updateLastActiveInDb();
      }
    });

    channelRef.current = channel;

    // Heartbeat to keep presence alive
    heartbeatRef.current = setInterval(updatePresence, HEARTBEAT_INTERVAL);

    // Periodic database update for last_active_at
    dbUpdateRef.current = setInterval(updateLastActiveInDb, DB_UPDATE_INTERVAL);

    // Track user activity
    const activityEvents = ['mousedown', 'keydown', 'touchstart', 'scroll'];
    activityEvents.forEach(event => {
      window.addEventListener(event, resetIdleTimer, { passive: true });
    });

    // Handle visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updatePresence();
        updateLastActiveInDb();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Handle beforeunload
    const handleBeforeUnload = () => {
      channel.untrack();
      // Try to update last active before leaving
      navigator.sendBeacon && updateLastActiveInDb();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      if (idleRef.current) clearTimeout(idleRef.current);
      if (dbUpdateRef.current) clearInterval(dbUpdateRef.current);
      activityEvents.forEach(event => {
        window.removeEventListener(event, resetIdleTimer);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      channel.untrack();
      supabase.removeChannel(channel);
    };
  }, [user?.id, updatePresence, resetIdleTimer, updateLastActiveInDb]);
}

export function useOnlineStatus(userIds: string[]) {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [lastSeenMap, setLastSeenMap] = useState<Map<string, string>>(new Map());
  const [recentlyActiveUsers, setRecentlyActiveUsers] = useState<Set<string>>(new Set());
  const userIdsRef = useRef<string[]>(userIds);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Keep ref updated
  useEffect(() => {
    userIdsRef.current = userIds;
  }, [userIds]);

  // Fetch last_active_at for all users and check if recently active
  useEffect(() => {
    if (userIds.length === 0) return;

    const fetchLastSeen = async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, last_active_at')
        .in('id', userIds);
      
      if (data) {
        const map = new Map<string, string>();
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        const recentlyActive = new Set<string>();
        
        data.forEach(profile => {
          if (profile.last_active_at) {
            map.set(profile.id, profile.last_active_at);
            // Check if user was active within last 5 minutes (same as Discover sidebar)
            const lastActive = new Date(profile.last_active_at);
            if (lastActive > fiveMinutesAgo) {
              recentlyActive.add(profile.id);
            }
          }
        });
        setLastSeenMap(map);
        setRecentlyActiveUsers(recentlyActive);
      }
    };

    fetchLastSeen();
    
    // Refresh every 30 seconds to keep online status updated
    const interval = setInterval(fetchLastSeen, 30000);
    return () => clearInterval(interval);
  }, [userIds.join(',')]);

  // Process presence state and update online users (merge with recently active)
  const processPresenceState = useCallback((state: Record<string, unknown[]>) => {
    const presenceOnline = new Set<string>();
    const currentUserIds = userIdsRef.current;
    
    Object.keys(state).forEach(presenceKey => {
      // Check if this key matches any user we're tracking
      if (currentUserIds.includes(presenceKey)) {
        presenceOnline.add(presenceKey);
      } else {
        // Also check presence payload for user_id field
        const presences = state[presenceKey] as unknown as PresenceState[];
        presences?.forEach(presence => {
          if (presence.user_id && currentUserIds.includes(presence.user_id)) {
            presenceOnline.add(presence.user_id);
          }
        });
      }
    });
    
    // Merge presence-based online with recently active users from DB
    setOnlineUsers(prev => {
      const merged = new Set(presenceOnline);
      recentlyActiveUsers.forEach(id => merged.add(id));
      return merged;
    });
  }, [recentlyActiveUsers]);

  // Sync onlineUsers when recentlyActiveUsers changes
  useEffect(() => {
    if (recentlyActiveUsers.size > 0) {
      setOnlineUsers(prev => {
        const merged = new Set(prev);
        recentlyActiveUsers.forEach(id => merged.add(id));
        return merged;
      });
    }
  }, [recentlyActiveUsers]);

  useEffect(() => {
    // Create a unique listener key to avoid conflicts
    const listenerKey = `listener-${Math.random().toString(36).slice(2)}`;
    const channel = supabase.channel(PRESENCE_CHANNEL, {
      config: { presence: { key: listenerKey } }
    });

    channelRef.current = channel;

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        processPresenceState(state);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ listening: true });
          // Immediately check presence state after subscribing
          const state = channel.presenceState();
          processPresenceState(state);
        }
      });

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [processPresenceState]);

  const isOnline = useCallback((userId: string) => {
    return onlineUsers.has(userId);
  }, [onlineUsers]);

  const getLastSeen = useCallback((userId: string): string | null => {
    if (onlineUsers.has(userId)) return null; // Online, no need for last seen
    return lastSeenMap.get(userId) || null;
  }, [onlineUsers, lastSeenMap]);

  return { onlineUsers, isOnline, getLastSeen };
}

// Helper function to format last seen timestamp
export function formatLastSeen(timestamp: string | null): string {
  if (!timestamp) return '';
  
  const lastSeen = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - lastSeen.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 5) return 'Active now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return lastSeen.toLocaleDateString();
}

// Check if user was recently active (within 5 minutes)
export function isRecentlyActive(timestamp: string | null): boolean {
  if (!timestamp) return false;
  const lastSeen = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - lastSeen.getTime();
  return diffMs < 5 * 60 * 1000; // 5 minutes
}
