import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { playMentionSound } from '@/utils/notification-sound';

export function useMentionNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('mention-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const notification = payload.new as {
            type: string;
            title: string;
            body: string;
            data: { post_id?: string; comment_id?: string; commenter_id?: string };
          };

          // Only handle mention notifications
          if (notification.type === 'comment_mention') {
            // Play mention sound
            playMentionSound();

            // Show toast notification
            toast.info(notification.title, {
              description: notification.body,
              action: {
                label: 'View',
                onClick: () => {
                  window.location.href = `/app/feed?post=${notification.data.post_id}&comment=${notification.data.comment_id}`;
                },
              },
            });

            // Invalidate queries to refresh data
            queryClient.invalidateQueries({ queryKey: ['notifications'] });
            queryClient.invalidateQueries({ queryKey: ['unread-notifications-count'] });
            queryClient.invalidateQueries({ queryKey: ['unread-mentions-count'] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);
}
