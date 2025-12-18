import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { playNotificationSound, playBuddyRequestSound } from '@/utils/notification-sound';

export function useMessageNotifications() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.id) return;

    // Listen for new dating messages
    const messagesChannel = supabase
      .channel("new-messages-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        async (payload) => {
          const newMessage = payload.new as {
            id: string;
            sender_id: string;
            match_id: string;
            content: string;
          };

          // Don't notify for own messages
          if (newMessage.sender_id === user.id) return;

          // Check if user is part of this match
          const { data: match } = await supabase
            .from("matches")
            .select("user1_id, user2_id")
            .eq("id", newMessage.match_id)
            .single();

          if (!match) return;
          if (match.user1_id !== user.id && match.user2_id !== user.id) return;

          // Get sender's name
          const { data: sender } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("id", newMessage.sender_id)
            .single();

          const senderName = sender?.display_name || "Someone";
          const preview = newMessage.content.length > 50 
            ? newMessage.content.substring(0, 50) + "..." 
            : newMessage.content;

          // Play notification sound
          playNotificationSound();

          toast({
            title: `New message from ${senderName}`,
            description: preview,
          });

          // Invalidate unread count
          queryClient.invalidateQueries({ queryKey: ["unread-messages-count", user.id] });
        }
      )
      .subscribe();

    // Listen for new buddy messages
    const buddyMessagesChannel = supabase
      .channel("new-buddy-messages-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "buddy_messages",
        },
        async (payload) => {
          const newMessage = payload.new as {
            id: string;
            sender_id: string;
            buddy_id: string;
            content: string;
          };

          // Don't notify for own messages
          if (newMessage.sender_id === user.id) return;

          // Check if user is part of this buddy relationship
          const { data: buddy } = await supabase
            .from("fishing_buddies")
            .select("requester_id, recipient_id")
            .eq("id", newMessage.buddy_id)
            .single();

          if (!buddy) return;
          if (buddy.requester_id !== user.id && buddy.recipient_id !== user.id) return;

          // Get sender's name
          const { data: sender } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("id", newMessage.sender_id)
            .single();

          const senderName = sender?.display_name || "A buddy";
          const preview = newMessage.content.length > 50 
            ? newMessage.content.substring(0, 50) + "..." 
            : newMessage.content;

          // Play notification sound
          playNotificationSound();

          toast({
            title: `New message from ${senderName}`,
            description: preview,
          });
        }
      )
      .subscribe();

    // Listen for new buddy requests
    const buddyRequestsChannel = supabase
      .channel("new-buddy-requests-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "fishing_buddies",
          filter: `recipient_id=eq.${user.id}`,
        },
        async (payload) => {
          const newRequest = payload.new as {
            id: string;
            requester_id: string;
            status: string;
          };

          if (newRequest.status !== "pending") return;

          // Get requester's name
          const { data: requester } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("id", newRequest.requester_id)
            .single();

          const requesterName = requester?.display_name || "Someone";

          // Play buddy request sound
          playBuddyRequestSound();

          toast({
            title: "New buddy request!",
            description: `${requesterName} wants to be your fishing buddy`,
          });

          // Invalidate pending requests count
          queryClient.invalidateQueries({ queryKey: ["pending-buddy-requests", user.id] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(buddyMessagesChannel);
      supabase.removeChannel(buddyRequestsChannel);
    };
  }, [user?.id, toast, queryClient]);
}
