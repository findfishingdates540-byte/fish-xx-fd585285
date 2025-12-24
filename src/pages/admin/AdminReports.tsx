import { useState } from 'react';
import { AlertTriangle, CheckCircle, XCircle, Eye, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdminReports } from '@/hooks/use-admin-stats';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function AdminReports() {
  const [statusFilter, setStatusFilter] = useState('all');
  const { data: reports, isLoading } = useAdminReports();
  const queryClient = useQueryClient();

  const filteredReports = reports?.filter(report => {
    if (statusFilter === 'all') return true;
    return report.status === statusFilter;
  }) || [];

  const handleResolve = async (reportId: string) => {
    const { error } = await supabase
      .from('reports')
      .update({ status: 'resolved', resolved_at: new Date().toISOString() })
      .eq('id', reportId);

    if (error) {
      toast.error('Failed to resolve report');
    } else {
      toast.success('Report resolved');
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    }
  };

  const handleDismiss = async (reportId: string) => {
    const { error } = await supabase
      .from('reports')
      .update({ status: 'dismissed', resolved_at: new Date().toISOString() })
      .eq('id', reportId);

    if (error) {
      toast.error('Failed to dismiss report');
    } else {
      toast.success('Report dismissed');
      queryClient.invalidateQueries({ queryKey: ['admin-reports'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-amber-500/20 text-amber-400 border-0">Pending</Badge>;
      case 'resolved':
        return <Badge className="bg-emerald-500/20 text-emerald-400 border-0">Resolved</Badge>;
      case 'dismissed':
        return <Badge className="bg-slate-500/20 text-slate-400 border-0">Dismissed</Badge>;
      default:
        return <Badge className="bg-slate-500/20 text-slate-400 border-0">{status}</Badge>;
    }
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Reports Center</h1>
          <p className="text-slate-400 mt-1">Review and manage user reports</p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={statusFilter} onValueChange={setStatusFilter} className="mb-6">
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="all" className="data-[state=active]:bg-slate-700">
            All Reports
          </TabsTrigger>
          <TabsTrigger value="pending" className="data-[state=active]:bg-slate-700">
            <AlertTriangle className="w-4 h-4 mr-2" />
            Pending
          </TabsTrigger>
          <TabsTrigger value="resolved" className="data-[state=active]:bg-slate-700">
            <CheckCircle className="w-4 h-4 mr-2" />
            Resolved
          </TabsTrigger>
          <TabsTrigger value="dismissed" className="data-[state=active]:bg-slate-700">
            <XCircle className="w-4 h-4 mr-2" />
            Dismissed
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Reports List */}
      <div className="space-y-4">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-32 bg-slate-800" />
          ))
        ) : filteredReports.length === 0 ? (
          <div className="bg-slate-800/50 rounded-xl p-12 text-center border border-slate-700/50">
            <AlertTriangle className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No reports found</h3>
            <p className="text-slate-400">There are no reports matching your filter.</p>
          </div>
        ) : (
          filteredReports.map((report) => (
            <div
              key={report.id}
              className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-rose-500/20">
                    <AlertTriangle className="w-5 h-5 text-rose-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-white capitalize">{report.reason}</h3>
                      {getStatusBadge(report.status || 'pending')}
                    </div>
                    
                    {report.description && (
                      <p className="text-slate-400 text-sm mb-3">{report.description}</p>
                    )}
                    
                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">Reporter:</span>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-5 h-5">
                            <AvatarImage src={report.reporter?.photos?.[0]} />
                            <AvatarFallback className="bg-slate-700 text-white text-xs">
                              {report.reporter?.display_name?.[0]?.toUpperCase() || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-slate-300">{report.reporter?.display_name || 'Unknown'}</span>
                        </div>
                      </div>
                      
                      {report.reported_user && (
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500">Reported:</span>
                          <div className="flex items-center gap-2">
                            <Avatar className="w-5 h-5">
                              <AvatarImage src={report.reported_user?.photos?.[0]} />
                              <AvatarFallback className="bg-slate-700 text-white text-xs">
                                {report.reported_user?.display_name?.[0]?.toUpperCase() || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-slate-300">{report.reported_user?.display_name || 'Unknown'}</span>
                          </div>
                        </div>
                      )}
                      
                      <span className="text-slate-500">
                        {format(new Date(report.created_at), 'MMM d, yyyy h:mm a')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {report.status === 'pending' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-emerald-500/20 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/30"
                        onClick={() => handleResolve(report.id)}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Resolve
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600"
                        onClick={() => handleDismiss(report.id)}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Dismiss
                      </Button>
                    </>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                      <DropdownMenuItem className="text-slate-300 focus:text-white focus:bg-slate-700">
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
