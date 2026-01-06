import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface SupportTicket {
  id: string;
  ticket_number: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  category: string;
  status: string;
  priority: string;
  assigned_to: string | null;
  user_id: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

export interface TicketResponse {
  id: string;
  ticket_id: string;
  responder_id: string | null;
  message: string;
  is_internal: boolean;
  created_at: string;
  responder?: {
    display_name: string;
    photos: string[];
  };
}

export interface TicketFilters {
  status?: string;
  priority?: string;
  category?: string;
  search?: string;
}

export function useSupportTickets(filters: TicketFilters = {}) {
  return useQuery({
    queryKey: ['support-tickets', filters],
    queryFn: async () => {
      let query = supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters.priority && filters.priority !== 'all') {
        query = query.eq('priority', filters.priority);
      }
      if (filters.category && filters.category !== 'all') {
        query = query.eq('category', filters.category);
      }
      if (filters.search) {
        query = query.or(`ticket_number.ilike.%${filters.search}%,email.ilike.%${filters.search}%,subject.ilike.%${filters.search}%,name.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as SupportTicket[];
    },
  });
}

export function useSupportTicket(ticketId: string | null) {
  return useQuery({
    queryKey: ['support-ticket', ticketId],
    queryFn: async () => {
      if (!ticketId) return null;
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('id', ticketId)
        .single();
      if (error) throw error;
      return data as SupportTicket;
    },
    enabled: !!ticketId,
  });
}

export function useTicketResponses(ticketId: string | null) {
  return useQuery({
    queryKey: ['ticket-responses', ticketId],
    queryFn: async () => {
      if (!ticketId) return [];
      const { data, error } = await supabase
        .from('support_ticket_responses')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      
      // Fetch responder profiles
      const responderIds = [...new Set(data.filter(r => r.responder_id).map(r => r.responder_id))];
      let responders: Record<string, { display_name: string; photos: string[] }> = {};
      
      if (responderIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name, photos')
          .in('id', responderIds);
        
        if (profiles) {
          responders = Object.fromEntries(profiles.map(p => [p.id, { display_name: p.display_name, photos: p.photos }]));
        }
      }
      
      return data.map(r => ({
        ...r,
        responder: r.responder_id ? responders[r.responder_id] : undefined,
      })) as TicketResponse[];
    },
    enabled: !!ticketId,
  });
}

export function useOpenTicketCount() {
  return useQuery({
    queryKey: ['open-ticket-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('support_tickets')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'open');
      if (error) throw error;
      return count || 0;
    },
  });
}

export function useUpdateTicket() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ ticketId, updates, sendEmail }: { 
      ticketId: string; 
      updates: Partial<SupportTicket>; 
      sendEmail?: boolean;
    }) => {
      const { error } = await supabase
        .from('support_tickets')
        .update(updates)
        .eq('id', ticketId);
      if (error) throw error;

      // Send status update email if requested
      if (sendEmail && updates.status) {
        try {
          await supabase.functions.invoke('send-ticket-email', {
            body: {
              ticketId,
              type: 'status_update',
              newStatus: updates.status,
            },
          });
        } catch (emailError) {
          console.error('Failed to send status email:', emailError);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['support-ticket'] });
      queryClient.invalidateQueries({ queryKey: ['open-ticket-count'] });
      toast({ title: 'Ticket updated successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to update ticket', description: error.message, variant: 'destructive' });
    },
  });
}

export function useAddTicketResponse() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ 
      ticketId, 
      message, 
      isInternal, 
      sendEmail 
    }: { 
      ticketId: string; 
      message: string; 
      isInternal: boolean;
      sendEmail?: boolean;
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('support_ticket_responses')
        .insert({
          ticket_id: ticketId,
          responder_id: user?.id,
          message,
          is_internal: isInternal,
        });
      if (error) throw error;

      // Update ticket status to in_progress if it was open
      await supabase
        .from('support_tickets')
        .update({ 
          status: 'awaiting_response',
          updated_at: new Date().toISOString(),
        })
        .eq('id', ticketId)
        .eq('status', 'open');

      // Send email notification if not internal and requested
      if (!isInternal && sendEmail) {
        try {
          await supabase.functions.invoke('send-ticket-email', {
            body: {
              ticketId,
              type: 'admin_response',
              message,
            },
          });
        } catch (emailError) {
          console.error('Failed to send response email:', emailError);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ticket-responses'] });
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['support-ticket'] });
      queryClient.invalidateQueries({ queryKey: ['open-ticket-count'] });
      toast({ title: 'Response added successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to add response', description: error.message, variant: 'destructive' });
    },
  });
}
