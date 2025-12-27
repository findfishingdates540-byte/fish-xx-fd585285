import { useEffect, useRef, useState } from 'react';
import { Heart, LayoutDashboard, Anchor, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { NotificationCenter, NotificationMode } from '@/components/notifications/NotificationCenter';
import { useAuth } from '@/contexts/AuthContext';
import { useActiveMode, ActiveMode } from '@/contexts/ActiveModeContext';
import { useAccountModeSwitcher } from '@/hooks/use-account-mode-switcher';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { Database } from '@/integrations/supabase/types';
// Request browser notification permission
const requestNotificationPermission = async () => {
  if ('Notification' in window && Notification.permission === 'default') {
    await Notification.requestPermission();
  }
};

// Show browser notification
const showBrowserNotification = (title: string, body: string, icon?: string) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, {
      body,
      icon: icon || '/favicon.png',
      badge: '/favicon.png',
    });
  }
};

// Play notification sound
const playNotificationSound = () => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = 800;
  oscillator.type = 'sine';
  
  gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
  
  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.3);
};

export function AppHeader() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const previousCountRef = useRef<number>(0);
  const [hasRequestedPermission, setHasRequestedPermission] = useState(false);
  
  // Get active mode context for combo users
  const { activeMode, setActiveMode, isComboUser, baseAccountMode, effectiveMode } = useActiveMode();
  
  // For combo users, this just switches their view preference (not account type)
  const handleModeSwitch = (mode: 'unified' | 'dating' | 'fishing') => {
    setActiveMode(mode);
  };
  
  // Map effectiveMode to NotificationMode
  const notificationMode: NotificationMode = effectiveMode;

  // Request notification permission on mount
  useEffect(() => {
    if (!hasRequestedPermission) {
      requestNotificationPermission();
      setHasRequestedPermission(true);
    }
  }, [hasRequestedPermission]);

  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('display_name, photos')
        .eq('id', user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch recent matches
  const { data: recentMatches } = useQuery({
    queryKey: ['recent-matches', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('matches')
        .select(`
          id,
          matched_at,
          user1_id,
          user2_id,
          user1:profiles!matches_user1_id_fkey(display_name, photos),
          user2:profiles!matches_user2_id_fkey(display_name, photos)
        `)
        .eq('is_match', true)
        .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
        .order('matched_at', { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch recent unread messages
  const { data: unreadMessages } = useQuery({
    queryKey: ['unread-messages', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('messages')
        .select(`
          id,
          content,
          created_at,
          sender_id,
          sender:profiles!messages_sender_id_fkey(display_name, photos)
        `)
        .eq('is_read', false)
        .neq('sender_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch trip invitations
  const { data: tripInvites } = useQuery({
    queryKey: ['trip-invites', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('trip_participants')
        .select(`
          id,
          created_at,
          status,
          trip_id,
          trip:fishing_trips(title, trip_date)
        `)
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) {
        console.error('Error fetching trip invites:', error);
        return [];
      }
      return data || [];
    },
    enabled: !!user?.id,
  });



  // Real-time subscriptions for notifications
  useEffect(() => {
    if (!user?.id) return;

    console.log('Setting up real-time notification subscriptions');

    const channel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'matches',
        },
        (payload) => {
          console.log('Match update received:', payload);
          const match = payload.new as any;
          if (match.is_match && (match.user1_id === user.id || match.user2_id === user.id)) {
            queryClient.invalidateQueries({ queryKey: ['recent-matches', user.id] });
            // Play sound and show notification
            playNotificationSound();
            showBrowserNotification('New Match!', 'You have a new match on Find Fishing Dates!');
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          console.log('New message received:', payload);
          const message = payload.new as any;
          if (message.sender_id !== user.id) {
            queryClient.invalidateQueries({ queryKey: ['unread-messages', user.id] });
            // Play sound and show notification
            playNotificationSound();
            showBrowserNotification('New Message', 'You have a new message!');
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'trip_participants',
        },
        (payload) => {
          console.log('Trip invitation received:', payload);
          const invite = payload.new as any;
          if (invite.user_id === user.id) {
            queryClient.invalidateQueries({ queryKey: ['trip-invites', user.id] });
            // Play sound and show notification
            playNotificationSound();
            showBrowserNotification('Trip Invitation', 'You have been invited to a fishing trip!');
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'buddy_messages',
        },
        (payload) => {
          console.log('New buddy message received:', payload);
          const message = payload.new as any;
          if (message.sender_id !== user.id) {
            // Play sound and show notification for buddy messages
            playNotificationSound();
            showBrowserNotification('New Buddy Message', 'You have a new message from a fishing buddy!');
          }
        }
      )
      .subscribe((status) => {
        console.log('Notification subscription status:', status);
      });

    return () => {
      console.log('Cleaning up notification subscriptions');
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  const avatarUrl = profile?.photos?.[0] || '';
  const initials = profile?.display_name?.charAt(0)?.toUpperCase() || 'U';

  const totalNotifications = 
    (recentMatches?.length || 0) + 
    (unreadMessages?.length || 0) + 
    (tripInvites?.length || 0);

  // Detect new notifications and trigger alerts
  useEffect(() => {
    if (totalNotifications > previousCountRef.current && previousCountRef.current > 0) {
      // New notification arrived
      playNotificationSound();
    }
    previousCountRef.current = totalNotifications;
  }, [totalNotifications]);

  const modeOptions: { value: ActiveMode; icon: React.ElementType; label: string }[] = [
    { value: 'unified', icon: LayoutDashboard, label: 'All' },
    { value: 'dating', icon: Heart, label: 'Dating' },
    { value: 'fishing', icon: Anchor, label: 'Fishing' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-background border-b border-border">
      <div className="flex items-center justify-between h-14 px-4">
        <Link to="/app" className="font-bold text-lg tracking-tight">
          Find Fishing Dates
        </Link>

        <div className="flex items-center gap-2">
          {/* Mode Switcher for Combo Users */}
          {isComboUser && (
            <div className="flex bg-muted rounded-full p-0.5 gap-0.5">
              {modeOptions.map((mode) => (
                <button
                  key={mode.value}
                  onClick={() => handleModeSwitch(mode.value)}
                  className={cn(
                    "flex items-center justify-center p-1.5 rounded-full transition-colors",
                    activeMode === mode.value
                      ? "bg-background text-primary shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title={mode.label}
                >
                  <mode.icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          )}

          <NotificationCenter mode={notificationMode} />

          <Link to="/app/profile">
            <Avatar className="h-8 w-8 border border-border">
              <AvatarImage src={avatarUrl} alt={profile?.display_name || 'Profile'} />
              <AvatarFallback className="bg-muted text-muted-foreground text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>
    </header>
  );
}
