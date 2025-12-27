import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  History,
  User,
  Settings,
  MapPin,
  Fish,
  FileText,
  Calendar,
  Shield,
  AlertTriangle,
  Megaphone,
  Plus,
  Pencil,
  Trash2,
} from 'lucide-react';
import { useAuditLogs, type AuditAction, type EntityType } from '@/hooks/use-audit-logs';
import { format } from 'date-fns';

const actionLabels: Record<AuditAction, { label: string; color: string }> = {
  user_banned: { label: 'User Banned', color: 'bg-red-500/20 text-red-400' },
  user_unbanned: { label: 'User Unbanned', color: 'bg-green-500/20 text-green-400' },
  role_changed: { label: 'Role Changed', color: 'bg-purple-500/20 text-purple-400' },
  premium_granted: { label: 'Premium Granted', color: 'bg-amber-500/20 text-amber-400' },
  premium_revoked: { label: 'Premium Revoked', color: 'bg-orange-500/20 text-orange-400' },
  setting_updated: { label: 'Setting Updated', color: 'bg-blue-500/20 text-blue-400' },
  spot_verified: { label: 'Spot Verified', color: 'bg-green-500/20 text-green-400' },
  spot_unverified: { label: 'Spot Unverified', color: 'bg-yellow-500/20 text-yellow-400' },
  spot_deleted: { label: 'Spot Deleted', color: 'bg-red-500/20 text-red-400' },
  spot_visibility_changed: { label: 'Spot Visibility Changed', color: 'bg-cyan-500/20 text-cyan-400' },
  catch_deleted: { label: 'Catch Deleted', color: 'bg-red-500/20 text-red-400' },
  post_deleted: { label: 'Post Deleted', color: 'bg-red-500/20 text-red-400' },
  trip_deleted: { label: 'Trip Deleted', color: 'bg-red-500/20 text-red-400' },
  species_created: { label: 'Species Created', color: 'bg-green-500/20 text-green-400' },
  species_updated: { label: 'Species Updated', color: 'bg-blue-500/20 text-blue-400' },
  species_deleted: { label: 'Species Deleted', color: 'bg-red-500/20 text-red-400' },
  report_resolved: { label: 'Report Resolved', color: 'bg-teal-500/20 text-teal-400' },
  create: { label: 'Created', color: 'bg-green-500/20 text-green-400' },
  update: { label: 'Updated', color: 'bg-blue-500/20 text-blue-400' },
  delete: { label: 'Deleted', color: 'bg-red-500/20 text-red-400' },
};

const entityIcons: Record<EntityType, React.ReactNode> = {
  user: <User className="h-4 w-4" />,
  setting: <Settings className="h-4 w-4" />,
  spot: <MapPin className="h-4 w-4" />,
  catch: <Fish className="h-4 w-4" />,
  post: <FileText className="h-4 w-4" />,
  trip: <Calendar className="h-4 w-4" />,
  species: <Fish className="h-4 w-4" />,
  report: <AlertTriangle className="h-4 w-4" />,
  advertisement: <Megaphone className="h-4 w-4" />,
};

export default function AdminAuditLogs() {
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [entityFilter, setEntityFilter] = useState<string>('all');

  const { data: logs, isLoading } = useAuditLogs({
    action: actionFilter !== 'all' ? actionFilter : undefined,
    entityType: entityFilter !== 'all' ? entityFilter : undefined,
    limit: 200,
  });

  const filteredLogs = logs?.filter(log => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      log.user?.display_name?.toLowerCase().includes(searchLower) ||
      log.user?.email?.toLowerCase().includes(searchLower) ||
      log.action.toLowerCase().includes(searchLower) ||
      log.entity_type.toLowerCase().includes(searchLower) ||
      JSON.stringify(log.details).toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <History className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Audit Logs</h1>
          <p className="text-slate-400">Track all admin actions and changes</p>
        </div>
      </div>

        <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader className="pb-4">
            <CardTitle className="text-lg text-white mb-4">Activity Log</CardTitle>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search logs..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 bg-slate-900 border-slate-600"
                />
              </div>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="w-full sm:w-48 bg-slate-900 border-slate-600">
                  <SelectValue placeholder="Filter by action" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value="all">All Actions</SelectItem>
                  {Object.entries(actionLabels).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger className="w-full sm:w-40 bg-slate-900 border-slate-600">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="setting">Setting</SelectItem>
                  <SelectItem value="spot">Spot</SelectItem>
                  <SelectItem value="catch">Catch</SelectItem>
                  <SelectItem value="post">Post</SelectItem>
                  <SelectItem value="trip">Trip</SelectItem>
                  <SelectItem value="species">Species</SelectItem>
                  <SelectItem value="report">Report</SelectItem>
                  <SelectItem value="advertisement">Advertisement</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-20 bg-slate-700" />
                ))}
              </div>
            ) : filteredLogs?.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No audit logs found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredLogs?.map((log) => {
                  const actionInfo = actionLabels[log.action as AuditAction] || {
                    label: log.action,
                    color: 'bg-slate-500/20 text-slate-400',
                  };

                  return (
                    <div
                      key={log.id}
                      className="flex items-start gap-4 p-4 rounded-lg bg-slate-900/50 border border-slate-700/50"
                    >
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={undefined} />
                        <AvatarFallback className="bg-slate-700 text-white">
                          {log.user?.display_name?.[0]?.toUpperCase() || 'A'}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="font-medium text-white">
                            {log.user?.display_name || log.user?.email || 'Unknown Admin'}
                          </span>
                          <Badge className={actionInfo.color}>
                            {actionInfo.label}
                          </Badge>
                          <Badge variant="outline" className="border-slate-600 text-slate-400 gap-1">
                            {entityIcons[log.entity_type as EntityType]}
                            {log.entity_type}
                          </Badge>
                        </div>
                        
                        {Object.keys(log.details).length > 0 && (
                          <div className="text-sm text-slate-400 mt-1">
                            {Object.entries(log.details).map(([key, value]) => (
                              <span key={key} className="mr-3">
                                <span className="text-slate-500">{key}:</span>{' '}
                                <span className="text-slate-300">
                                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                </span>
                              </span>
                            ))}
                          </div>
                        )}
                        
                        {log.entity_id && (
                          <p className="text-xs text-slate-500 mt-1 font-mono">
                            ID: {log.entity_id}
                          </p>
                        )}
                      </div>
                      
                      <div className="text-right text-xs text-slate-500 whitespace-nowrap">
                        <p>{format(new Date(log.created_at), 'MMM d, yyyy')}</p>
                        <p>{format(new Date(log.created_at), 'HH:mm:ss')}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
  );
}
