import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Ticket, Clock, CheckCircle2, AlertCircle, MessageSquare, Plus, RefreshCw, Send, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';

interface Ticket {
  id: string;
  ticket_number: string;
  subject: string;
  message: string;
  category: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
}

interface TicketResponse {
  id: string;
  message: string;
  is_internal: boolean;
  created_at: string;
  responder_id: string | null;
}

const statusConfig: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  open: { label: 'Open', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20', icon: AlertCircle },
  in_progress: { label: 'In Progress', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: Clock },
  awaiting_response: { label: 'Awaiting Response', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20', icon: MessageSquare },
  resolved: { label: 'Resolved', color: 'bg-green-500/10 text-green-500 border-green-500/20', icon: CheckCircle2 },
  closed: { label: 'Closed', color: 'bg-muted text-muted-foreground', icon: CheckCircle2 },
};

const categoryLabels: Record<string, string> = {
  general: 'General',
  technical: 'Technical Support',
  billing: 'Billing',
  safety: 'Safety',
  partnership: 'Partnership',
};

export default function MyTickets() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [showNewTicketForm, setShowNewTicketForm] = useState(false);
  const [newTicket, setNewTicket] = useState({
    subject: '',
    message: '',
    category: 'general',
  });
  const [submittingNewTicket, setSubmittingNewTicket] = useState(false);

  // Fetch user's tickets
  const { data: tickets, isLoading, refetch } = useQuery({
    queryKey: ['my-tickets', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Ticket[];
    },
    enabled: !!user?.id,
  });

  // Fetch selected ticket details and responses
  const { data: selectedTicket } = useQuery({
    queryKey: ['my-ticket', selectedTicketId],
    queryFn: async () => {
      if (!selectedTicketId) return null;
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('id', selectedTicketId)
        .single();
      if (error) throw error;
      return data as Ticket;
    },
    enabled: !!selectedTicketId,
  });

  const { data: responses } = useQuery({
    queryKey: ['my-ticket-responses', selectedTicketId],
    queryFn: async () => {
      if (!selectedTicketId) return [];
      const { data, error } = await supabase
        .from('support_ticket_responses')
        .select('*')
        .eq('ticket_id', selectedTicketId)
        .eq('is_internal', false) // Only show non-internal responses to users
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as TicketResponse[];
    },
    enabled: !!selectedTicketId,
  });

  // Real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('my-tickets-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_tickets',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          refetch();
          if (selectedTicketId) {
            queryClient.invalidateQueries({ queryKey: ['my-ticket', selectedTicketId] });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_ticket_responses'
        },
        () => {
          if (selectedTicketId) {
            queryClient.invalidateQueries({ queryKey: ['my-ticket-responses', selectedTicketId] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, selectedTicketId, refetch, queryClient]);

  // Submit reply mutation
  const submitReply = useMutation({
    mutationFn: async ({ ticketId, message }: { ticketId: string; message: string }) => {
      // Users can add responses to their own tickets
      const { error } = await supabase
        .from('support_ticket_responses')
        .insert({
          ticket_id: ticketId,
          responder_id: user?.id,
          message,
          is_internal: false,
        });
      if (error) throw error;

      // Update ticket status to indicate user replied
      await supabase
        .from('support_tickets')
        .update({ 
          status: 'open',
          updated_at: new Date().toISOString(),
        })
        .eq('id', ticketId);
    },
    onSuccess: () => {
      setReplyMessage('');
      queryClient.invalidateQueries({ queryKey: ['my-ticket-responses', selectedTicketId] });
      queryClient.invalidateQueries({ queryKey: ['my-tickets'] });
      toast({ title: 'Reply sent successfully' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to send reply', description: error.message, variant: 'destructive' });
    },
  });

  const handleSubmitReply = () => {
    if (!replyMessage.trim() || !selectedTicketId) return;
    submitReply.mutate({ ticketId: selectedTicketId, message: replyMessage });
  };

  // Submit new ticket handler
  const handleSubmitNewTicket = async () => {
    if (!newTicket.subject.trim() || !newTicket.message.trim() || !user) return;
    
    setSubmittingNewTicket(true);
    try {
      const { data, error } = await supabase.functions.invoke('submit-support-ticket', {
        body: {
          name: user.user_metadata?.display_name || user.email?.split('@')[0] || 'User',
          email: user.email,
          subject: newTicket.subject,
          message: newTicket.message,
          category: newTicket.category,
          userId: user.id,
        },
      });

      if (error) throw error;

      toast({ title: 'Ticket submitted successfully', description: `Ticket #${data.ticketNumber} created` });
      setNewTicket({ subject: '', message: '', category: 'general' });
      setShowNewTicketForm(false);
      refetch();
    } catch (error) {
      toast({ 
        title: 'Failed to submit ticket', 
        description: error instanceof Error ? error.message : 'Please try again', 
        variant: 'destructive' 
      });
    } finally {
      setSubmittingNewTicket(false);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <Ticket className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Sign in to view your tickets</h2>
        <p className="text-muted-foreground mb-4">You need to be logged in to view and track your support tickets.</p>
        <Link to="/auth">
          <Button>Sign In</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Ticket className="w-6 h-6" />
            My Support Tickets
          </h1>
          <p className="text-muted-foreground mt-1">Track your support requests</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowNewTicketForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            New Ticket
          </Button>
        </div>
      </div>

      {/* New Ticket Form */}
      {showNewTicketForm && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Submit New Ticket</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setShowNewTicketForm(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select 
                value={newTicket.category} 
                onValueChange={(value) => setNewTicket(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General Inquiry</SelectItem>
                  <SelectItem value="technical">Technical Support</SelectItem>
                  <SelectItem value="billing">Billing</SelectItem>
                  <SelectItem value="safety">Safety Concern</SelectItem>
                  <SelectItem value="partnership">Partnership</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                placeholder="Brief summary of your issue"
                value={newTicket.subject}
                onChange={(e) => setNewTicket(prev => ({ ...prev, subject: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                placeholder="Describe your issue in detail..."
                className="min-h-[120px]"
                value={newTicket.message}
                onChange={(e) => setNewTicket(prev => ({ ...prev, message: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNewTicketForm(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleSubmitNewTicket}
                disabled={!newTicket.subject.trim() || !newTicket.message.trim() || submittingNewTicket}
              >
                {submittingNewTicket ? 'Submitting...' : 'Submit Ticket'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tickets List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Tickets ({tickets?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading tickets...</div>
          ) : !tickets?.length ? (
            <div className="p-8 text-center">
              <Ticket className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">You haven't submitted any support tickets yet.</p>
              <Button onClick={() => setShowNewTicketForm(true)}>Submit a Ticket</Button>
            </div>
          ) : (
            <div className="divide-y">
              {tickets.map((ticket) => {
                const status = statusConfig[ticket.status] || statusConfig.open;
                const StatusIcon = status.icon;

                return (
                  <div
                    key={ticket.id}
                    onClick={() => setSelectedTicketId(ticket.id)}
                    className="p-4 hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-primary font-mono text-sm">{ticket.ticket_number}</span>
                          <Badge className={status.color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {status.label}
                          </Badge>
                        </div>
                        <h3 className="font-medium truncate">{ticket.subject}</h3>
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                          <span>{categoryLabels[ticket.category] || ticket.category}</span>
                        </div>
                      </div>
                      <div className="text-sm text-muted-foreground whitespace-nowrap">
                        {format(new Date(ticket.created_at), 'MMM d, yyyy')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ticket Detail Modal */}
      <Dialog open={!!selectedTicketId} onOpenChange={() => setSelectedTicketId(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedTicket && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 flex-wrap">
                  <span className="text-primary font-mono">{selectedTicket.ticket_number}</span>
                  <Badge className={statusConfig[selectedTicket.status]?.color}>
                    {statusConfig[selectedTicket.status]?.label || selectedTicket.status}
                  </Badge>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                {/* Ticket Info */}
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <h3 className="font-semibold text-lg">{selectedTicket.subject}</h3>
                  <div className="text-sm text-muted-foreground">
                    <span>{categoryLabels[selectedTicket.category] || selectedTicket.category}</span>
                    <span className="mx-2">•</span>
                    <span>Submitted {format(new Date(selectedTicket.created_at), 'PPp')}</span>
                  </div>
                  <div className="pt-3 border-t">
                    <div className="text-muted-foreground mb-2 text-sm">Your message:</div>
                    <div className="whitespace-pre-wrap">{selectedTicket.message}</div>
                  </div>
                </div>

                {/* Responses */}
                {responses && responses.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <MessageSquare className="w-4 h-4" />
                      Responses ({responses.length})
                    </h4>
                    <div className="space-y-3">
                      {responses.map((response) => (
                        <div key={response.id} className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium">
                              {response.responder_id === user?.id ? 'You' : 'Support Team'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(response.created_at), 'MMM d, h:mm a')}
                            </span>
                          </div>
                          <div className="whitespace-pre-wrap text-sm">{response.message}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Reply Form - Only show if ticket is not closed/resolved */}
                {selectedTicket.status !== 'closed' && selectedTicket.status !== 'resolved' && (
                  <div className="space-y-3 pt-3 border-t">
                    <h4 className="font-medium">Add a Reply</h4>
                    <Textarea
                      placeholder="Type your reply..."
                      value={replyMessage}
                      onChange={(e) => setReplyMessage(e.target.value)}
                      className="min-h-[100px]"
                    />
                    <div className="flex justify-end">
                      <Button 
                        onClick={handleSubmitReply} 
                        disabled={!replyMessage.trim() || submitReply.isPending}
                      >
                        <Send className="w-4 h-4 mr-2" />
                        {submitReply.isPending ? 'Sending...' : 'Send Reply'}
                      </Button>
                    </div>
                  </div>
                )}

                {(selectedTicket.status === 'closed' || selectedTicket.status === 'resolved') && (
                  <div className="text-center text-muted-foreground bg-muted/50 rounded-lg p-4">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-500" />
                    <p>This ticket has been {selectedTicket.status}.</p>
                    <p className="text-sm mt-1">Need more help? <button onClick={() => { setSelectedTicketId(null); setShowNewTicketForm(true); }} className="text-primary underline">Submit a new ticket</button></p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}