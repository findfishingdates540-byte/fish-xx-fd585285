import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Ticket, Clock, CheckCircle2, AlertCircle, MessageSquare, Filter, RefreshCw } from 'lucide-react';
import { useSupportTickets, useOpenTicketCount, type SupportTicket, type TicketFilters } from '@/hooks/use-support-tickets';
import { TicketDetailModal } from '@/components/admin/TicketDetailModal';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
const statusConfig: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  open: { label: 'Open', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20', icon: AlertCircle },
  in_progress: { label: 'In Progress', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: Clock },
  awaiting_response: { label: 'Awaiting Response', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20', icon: MessageSquare },
  resolved: { label: 'Resolved', color: 'bg-green-500/10 text-green-500 border-green-500/20', icon: CheckCircle2 },
  closed: { label: 'Closed', color: 'bg-slate-500/10 text-slate-400 border-slate-500/20', icon: CheckCircle2 },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  low: { label: 'Low', color: 'bg-slate-500/10 text-slate-400' },
  medium: { label: 'Medium', color: 'bg-blue-500/10 text-blue-400' },
  high: { label: 'High', color: 'bg-orange-500/10 text-orange-400' },
  urgent: { label: 'Urgent', color: 'bg-red-500/10 text-red-400' },
};

const categoryLabels: Record<string, string> = {
  general: 'General',
  technical: 'Technical Support',
  billing: 'Billing',
  safety: 'Safety',
  partnership: 'Partnership',
};

export default function AdminSupportTickets() {
  const [filters, setFilters] = useState<TicketFilters>({});
  const [searchInput, setSearchInput] = useState('');
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  
  const { data: tickets, isLoading, refetch } = useSupportTickets(filters);
  const { data: openCount, refetch: refetchOpenCount } = useOpenTicketCount();

  // Real-time subscription for auto-updates
  useEffect(() => {
    const channel = supabase
      .channel('support-tickets-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'support_tickets'
        },
        () => {
          refetch();
          refetchOpenCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch, refetchOpenCount]);

  const handleSearch = () => {
    setFilters(prev => ({ ...prev, search: searchInput }));
  };

  const clearFilters = () => {
    setFilters({});
    setSearchInput('');
  };

  const stats = {
    total: tickets?.length || 0,
    open: tickets?.filter(t => t.status === 'open').length || 0,
    inProgress: tickets?.filter(t => t.status === 'in_progress' || t.status === 'awaiting_response').length || 0,
    resolved: tickets?.filter(t => t.status === 'resolved' || t.status === 'closed').length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Ticket className="w-6 h-6" />
            Support Tickets
            {openCount !== undefined && openCount > 0 && (
              <Badge className="bg-amber-500/20 text-amber-400 ml-2">{openCount} open</Badge>
            )}
          </h1>
          <p className="text-slate-400 mt-1">Manage customer support requests</p>
        </div>
        <Button variant="outline" onClick={() => refetch()} className="border-slate-700 text-slate-300 hover:bg-slate-800">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <div className="text-sm text-slate-400">Total Tickets</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-amber-400">{stats.open}</div>
            <div className="text-sm text-slate-400">Open</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-400">{stats.inProgress}</div>
            <div className="text-sm text-slate-400">In Progress</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-400">{stats.resolved}</div>
            <div className="text-sm text-slate-400">Resolved</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Search by ticket #, email, or subject..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="bg-slate-900 border-slate-700 text-white"
              />
              <Button onClick={handleSearch} className="bg-cyan-600 hover:bg-cyan-700">
                <Search className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <Select value={filters.status || 'all'} onValueChange={(v) => setFilters(prev => ({ ...prev, status: v }))}>
                <SelectTrigger className="w-[140px] bg-slate-900 border-slate-700 text-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="awaiting_response">Awaiting Response</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.priority || 'all'} onValueChange={(v) => setFilters(prev => ({ ...prev, priority: v }))}>
                <SelectTrigger className="w-[130px] bg-slate-900 border-slate-700 text-white">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.category || 'all'} onValueChange={(v) => setFilters(prev => ({ ...prev, category: v }))}>
                <SelectTrigger className="w-[150px] bg-slate-900 border-slate-700 text-white">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="billing">Billing</SelectItem>
                  <SelectItem value="safety">Safety</SelectItem>
                  <SelectItem value="partnership">Partnership</SelectItem>
                </SelectContent>
              </Select>

              {(filters.status || filters.priority || filters.category || filters.search) && (
                <Button variant="ghost" onClick={clearFilters} className="text-slate-400 hover:text-white">
                  <Filter className="w-4 h-4 mr-1" />
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="border-b border-slate-700">
          <CardTitle className="text-white">
            Tickets ({tickets?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-slate-400">Loading tickets...</div>
          ) : !tickets?.length ? (
            <div className="p-8 text-center text-slate-400">
              No tickets found. Adjust your filters or check back later.
            </div>
          ) : (
            <div className="divide-y divide-slate-700">
              {tickets.map((ticket) => {
                const status = statusConfig[ticket.status] || statusConfig.open;
                const StatusIcon = status.icon;
                const priority = priorityConfig[ticket.priority] || priorityConfig.medium;

                return (
                  <div
                    key={ticket.id}
                    onClick={() => setSelectedTicketId(ticket.id)}
                    className="p-4 hover:bg-slate-700/50 cursor-pointer transition-colors"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-cyan-400 font-mono text-sm">{ticket.ticket_number}</span>
                          <Badge className={status.color}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {status.label}
                          </Badge>
                          <Badge className={priority.color}>{priority.label}</Badge>
                        </div>
                        <h3 className="text-white font-medium truncate">{ticket.subject}</h3>
                        <div className="flex items-center gap-3 mt-1 text-sm text-slate-400">
                          <span>{ticket.name}</span>
                          <span>•</span>
                          <span>{ticket.email}</span>
                          <span>•</span>
                          <span>{categoryLabels[ticket.category] || ticket.category}</span>
                        </div>
                      </div>
                      <div className="text-sm text-slate-400 whitespace-nowrap">
                        {format(new Date(ticket.created_at), 'MMM d, yyyy h:mm a')}
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
      <TicketDetailModal
        ticketId={selectedTicketId}
        onClose={() => setSelectedTicketId(null)}
      />
    </div>
  );
}
