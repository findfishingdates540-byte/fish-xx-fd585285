import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  useSupportTicket, 
  useTicketResponses, 
  useUpdateTicket, 
  useAddTicketResponse 
} from '@/hooks/use-support-tickets';
import { format } from 'date-fns';
import { Send, Clock, AlertCircle, CheckCircle2, MessageSquare, Mail, Lock, User } from 'lucide-react';

interface TicketDetailModalProps {
  ticketId: string | null;
  onClose: () => void;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  open: { label: 'Open', color: 'bg-amber-500/10 text-amber-500' },
  in_progress: { label: 'In Progress', color: 'bg-blue-500/10 text-blue-500' },
  awaiting_response: { label: 'Awaiting Response', color: 'bg-purple-500/10 text-purple-500' },
  resolved: { label: 'Resolved', color: 'bg-green-500/10 text-green-500' },
  closed: { label: 'Closed', color: 'bg-slate-500/10 text-slate-400' },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: 'Low', color: 'bg-slate-500/10 text-slate-400' },
  medium: { label: 'Medium', color: 'bg-blue-500/10 text-blue-400' },
  high: { label: 'High', color: 'bg-orange-500/10 text-orange-400' },
  urgent: { label: 'Urgent', color: 'bg-red-500/10 text-red-400' },
};

export function TicketDetailModal({ ticketId, onClose }: TicketDetailModalProps) {
  const { data: ticket, isLoading: ticketLoading } = useSupportTicket(ticketId);
  const { data: responses, isLoading: responsesLoading } = useTicketResponses(ticketId);
  const updateTicket = useUpdateTicket();
  const addResponse = useAddTicketResponse();

  const [replyMessage, setReplyMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [sendEmail, setSendEmail] = useState(true);
  const [newStatus, setNewStatus] = useState<string>('');
  const [newPriority, setNewPriority] = useState<string>('');

  const handleStatusChange = (status: string) => {
    setNewStatus(status);
    updateTicket.mutate({
      ticketId: ticketId!,
      updates: { 
        status,
        resolved_at: status === 'resolved' || status === 'closed' ? new Date().toISOString() : null,
      },
      sendEmail: true,
    });
  };

  const handlePriorityChange = (priority: string) => {
    setNewPriority(priority);
    updateTicket.mutate({
      ticketId: ticketId!,
      updates: { priority },
    });
  };

  const handleSubmitReply = () => {
    if (!replyMessage.trim() || !ticketId) return;

    addResponse.mutate({
      ticketId,
      message: replyMessage,
      isInternal,
      sendEmail: sendEmail && !isInternal,
    }, {
      onSuccess: () => {
        setReplyMessage('');
        setIsInternal(false);
      },
    });
  };

  const isLoading = ticketLoading || responsesLoading;

  return (
    <Dialog open={!!ticketId} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-slate-900 border-slate-700 text-white">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400">Loading ticket details...</div>
        ) : !ticket ? (
          <div className="p-8 text-center text-slate-400">Ticket not found</div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-white">
                <span className="text-cyan-400 font-mono">{ticket.ticket_number}</span>
                <Badge className={statusConfig[ticket.status]?.color}>
                  {statusConfig[ticket.status]?.label || ticket.status}
                </Badge>
                <Badge className={priorityConfig[ticket.priority]?.color}>
                  {priorityConfig[ticket.priority]?.label || ticket.priority}
                </Badge>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6">
              {/* Ticket Info */}
              <div className="bg-slate-800/50 rounded-lg p-4 space-y-3">
                <h3 className="font-semibold text-lg text-white">{ticket.subject}</h3>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-1">
                    <div className="text-slate-400">From</div>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-500" />
                      <span className="text-white">{ticket.name}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-slate-400">Email</div>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-slate-500" />
                      <span className="text-white">{ticket.email}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-slate-400">Category</div>
                    <div className="text-white capitalize">{ticket.category.replace('_', ' ')}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-slate-400">Submitted</div>
                    <div className="text-white">{format(new Date(ticket.created_at), 'PPp')}</div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-700">
                  <div className="text-slate-400 mb-2">Original Message</div>
                  <div className="text-white whitespace-pre-wrap">{ticket.message}</div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <Label className="text-slate-400 text-sm">Status:</Label>
                  <Select value={newStatus || ticket.status} onValueChange={handleStatusChange}>
                    <SelectTrigger className="w-[160px] bg-slate-800 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="awaiting_response">Awaiting Response</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Label className="text-slate-400 text-sm">Priority:</Label>
                  <Select value={newPriority || ticket.priority} onValueChange={handlePriorityChange}>
                    <SelectTrigger className="w-[120px] bg-slate-800 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Responses Thread */}
              {responses && responses.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-medium text-white flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Responses ({responses.length})
                  </h4>
                  <div className="space-y-3 max-h-60 overflow-y-auto">
                    {responses.map((response) => (
                      <div 
                        key={response.id} 
                        className={`p-3 rounded-lg ${
                          response.is_internal 
                            ? 'bg-amber-900/20 border border-amber-700/30' 
                            : 'bg-slate-800/50'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <Avatar className="w-6 h-6">
                            <AvatarImage src={response.responder?.photos?.[0]} />
                            <AvatarFallback className="text-xs bg-slate-700">
                              {response.responder?.display_name?.[0] || 'A'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium text-white">
                            {response.responder?.display_name || 'Support Agent'}
                          </span>
                          {response.is_internal && (
                            <Badge className="bg-amber-500/20 text-amber-400 text-xs">
                              <Lock className="w-3 h-3 mr-1" />
                              Internal
                            </Badge>
                          )}
                          <span className="text-xs text-slate-500 ml-auto">
                            {format(new Date(response.created_at), 'MMM d, h:mm a')}
                          </span>
                        </div>
                        <div className="text-slate-300 whitespace-pre-wrap text-sm">
                          {response.message}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reply Form */}
              <div className="space-y-3 pt-3 border-t border-slate-700">
                <h4 className="font-medium text-white">Add Response</h4>
                <Textarea
                  placeholder="Type your response..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white min-h-[100px]"
                />
                
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Checkbox 
                        id="internal" 
                        checked={isInternal} 
                        onCheckedChange={(checked) => setIsInternal(!!checked)}
                      />
                      <Label htmlFor="internal" className="text-sm text-slate-400 flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Internal note
                      </Label>
                    </div>
                    
                    {!isInternal && (
                      <div className="flex items-center gap-2">
                        <Checkbox 
                          id="sendEmail" 
                          checked={sendEmail} 
                          onCheckedChange={(checked) => setSendEmail(!!checked)}
                        />
                        <Label htmlFor="sendEmail" className="text-sm text-slate-400 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          Send email notification
                        </Label>
                      </div>
                    )}
                  </div>

                  <Button 
                    onClick={handleSubmitReply} 
                    disabled={!replyMessage.trim() || addResponse.isPending}
                    className="bg-cyan-600 hover:bg-cyan-700"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {addResponse.isPending ? 'Sending...' : 'Send Response'}
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
