import { useState, useEffect, useCallback } from 'react';
import { Bell, Download, Calendar, Users, Heart, MapPin, DollarSign, UserPlus, ShieldAlert, Flag, CheckCircle, AlertTriangle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatsCard } from '@/components/admin';
import { useAdminStats, useEngagementTrends, useRecentPremiumSubscriptions, usePopularSpots } from '@/hooks/use-admin-stats';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format, formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuditLogs, type AuditLog } from '@/hooks/use-audit-logs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

const COLORS = ['#06b6d4', '#a855f7', '#22c55e'];
const LAST_VIEWED_KEY = 'admin_notifications_last_viewed';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('30');
  const [lastViewedAt, setLastViewedAt] = useState<string | null>(() => 
    localStorage.getItem(LAST_VIEWED_KEY)
  );
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: trends, isLoading: trendsLoading } = useEngagementTrends(parseInt(dateRange));
  const { data: premiumUsers, isLoading: premiumLoading } = useRecentPremiumSubscriptions();
  const { data: popularSpots, isLoading: spotsLoading } = usePopularSpots();
  const { data: recentActivity, isLoading: activityLoading } = useAuditLogs({ limit: 10 });

  // Calculate unread count based on last viewed timestamp
  const unreadCount = recentActivity?.filter(activity => 
    !lastViewedAt || new Date(activity.created_at) > new Date(lastViewedAt)
  ).length || 0;

  // Real-time subscription for audit logs
  useEffect(() => {
    const channel = supabase
      .channel('admin-audit-logs')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'audit_logs' },
        () => {
          // Invalidate and refetch audit logs when new activity is added
          queryClient.invalidateQueries({ queryKey: ['audit-logs'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Mark all as read handler
  const handleClearAll = useCallback(() => {
    const now = new Date().toISOString();
    localStorage.setItem(LAST_VIEWED_KEY, now);
    setLastViewedAt(now);
    toast.success('All notifications marked as read');
  }, []);

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'user_banned':
      case 'user_unbanned':
        return <ShieldAlert className="w-4 h-4 text-red-400" />;
      case 'report_resolved':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'report_created':
        return <Flag className="w-4 h-4 text-orange-400" />;
      case 'verification_approved':
        return <CheckCircle className="w-4 h-4 text-cyan-400" />;
      case 'verification_rejected':
        return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      case 'role_changed':
        return <Users className="w-4 h-4 text-purple-400" />;
      default:
        return <UserPlus className="w-4 h-4 text-slate-400" />;
    }
  };

  const getActivityLabel = (action: string) => {
    switch (action) {
      case 'user_banned': return 'User Banned';
      case 'user_unbanned': return 'User Unbanned';
      case 'report_resolved': return 'Report Resolved';
      case 'report_created': return 'New Report';
      case 'verification_approved': return 'Verification Approved';
      case 'verification_rejected': return 'Verification Rejected';
      case 'role_changed': return 'Role Changed';
      case 'settings_changed': return 'Settings Updated';
      case 'spot_created': return 'Spot Created';
      case 'spot_deleted': return 'Spot Deleted';
      case 'ad_created': return 'Ad Created';
      case 'ad_deleted': return 'Ad Deleted';
      default: return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const modeData = stats ? [
    { name: 'Dating Mode', value: stats.modeDistribution.dating, color: '#06b6d4' },
    { name: 'Combo Mode', value: stats.modeDistribution.both, color: '#a855f7' },
    { name: 'Fishing Mode', value: stats.modeDistribution.fishing, color: '#22c55e' },
  ] : [];

  const totalModeUsers = modeData.reduce((acc, item) => acc + item.value, 0);

  const handleExportReport = () => {
    if (!stats && !trends) {
      toast.error("No data available to export");
      return;
    }

    const reportDate = format(new Date(), 'yyyy-MM-dd');
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Header
    csvContent += "Find Fishing Dates - Admin Report\n";
    csvContent += `Generated: ${format(new Date(), 'PPpp')}\n`;
    csvContent += `Date Range: Last ${dateRange} Days\n\n`;
    
    // Summary Stats
    csvContent += "SUMMARY STATISTICS\n";
    csvContent += "Metric,Value\n";
    csvContent += `Active Users,${stats?.activeUsers || 0}\n`;
    csvContent += `Total Matches,${stats?.totalMatches || 0}\n`;
    csvContent += `Total Spots,${stats?.totalSpots || 0}\n`;
    csvContent += `Dating Mode Users,${stats?.modeDistribution?.dating || 0}\n`;
    csvContent += `Fishing Mode Users,${stats?.modeDistribution?.fishing || 0}\n`;
    csvContent += `Combo Mode Users,${stats?.modeDistribution?.both || 0}\n\n`;
    
    // Engagement Trends
    if (trends && trends.length > 0) {
      csvContent += "ENGAGEMENT TRENDS\n";
      csvContent += "Date,Active Users,New Signups\n";
      trends.forEach((day: any) => {
        csvContent += `${day.date},${day.activeUsers},${day.newSignups}\n`;
      });
      csvContent += "\n";
    }
    
    // Popular Spots
    if (popularSpots && popularSpots.length > 0) {
      csvContent += "POPULAR FISHING SPOTS\n";
      csvContent += "Spot Name,Visits,Rating\n";
      popularSpots.forEach((spot: any) => {
        csvContent += `"${spot.name}",${spot.visits || 0},${spot.rating || 'N/A'}\n`;
      });
    }

    // Create and trigger download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `admin-report-${reportDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success("Report exported successfully");
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics & Reporting</h1>
          <p className="text-slate-400 mt-1">Real-time insights across Dating, Fishing, and Combo modes</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
            onClick={handleExportReport}
            disabled={statsLoading || trendsLoading}
          >
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative bg-slate-800 text-white hover:bg-slate-700">
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-cyan-500 rounded-full flex items-center justify-center text-[10px] font-bold text-white px-1">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 bg-slate-800 border-slate-700 z-50">
              <DropdownMenuLabel className="flex items-center justify-between text-white">
                <span>Recent Activity</span>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-slate-400 hover:text-white h-auto p-1 text-xs"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleClearAll();
                      }}
                    >
                      <X className="w-3 h-3 mr-1" />
                      Clear All
                    </Button>
                  )}
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="text-cyan-400 hover:text-cyan-300 h-auto p-0"
                    onClick={() => navigate('/admin/audit-logs')}
                  >
                    View All
                  </Button>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-slate-700" />
              <ScrollArea className="h-[300px]">
                {activityLoading ? (
                  <div className="p-4 space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 bg-slate-700" />
                    ))}
                  </div>
                ) : recentActivity && recentActivity.length > 0 ? (
                  recentActivity.map((activity) => {
                    const isUnread = !lastViewedAt || new Date(activity.created_at) > new Date(lastViewedAt);
                    return (
                      <DropdownMenuItem 
                        key={activity.id} 
                        className={`flex items-start gap-3 p-3 cursor-pointer focus:bg-slate-700 ${isUnread ? 'bg-slate-700/50' : ''}`}
                      >
                        <div className="mt-0.5 relative">
                          {getActivityIcon(activity.action)}
                          {isUnread && (
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-cyan-500 rounded-full" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {getActivityLabel(activity.action)}
                          </p>
                          <p className="text-xs text-slate-400 truncate">
                            by {activity.user?.display_name || activity.user?.email || 'System'}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </DropdownMenuItem>
                    );
                  })
                ) : (
                  <div className="p-4 text-center text-slate-400 text-sm">
                    No recent activity
                  </div>
                )}
              </ScrollArea>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tabs and Filters */}
      <div className="flex items-center justify-between mb-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-slate-800 border border-slate-700">
            <TabsTrigger value="overview" className="data-[state=active]:bg-slate-700">Overview</TabsTrigger>
            <TabsTrigger value="dating" className="data-[state=active]:bg-slate-700">Dating Mode</TabsTrigger>
            <TabsTrigger value="fishing" className="data-[state=active]:bg-slate-700">Fishing Spots</TabsTrigger>
            <TabsTrigger value="combo" className="data-[state=active]:bg-slate-700">Combo Mode</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="flex items-center gap-3">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[160px] bg-slate-800 border-slate-700 text-white">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="7">Last 7 Days</SelectItem>
              <SelectItem value="30">Last 30 Days</SelectItem>
              <SelectItem value="90">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
          
          <Select defaultValue="all">
            <SelectTrigger className="w-[140px] bg-slate-800 border-slate-700 text-white">
              <Users className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
              <SelectItem value="free">Free</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {statsLoading ? (
          <>
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 bg-slate-800" />
            ))}
          </>
        ) : (
          <>
            <StatsCard
              title="Total Revenue"
              value="$124,500"
              change={12}
              icon={DollarSign}
              iconBgColor="bg-cyan-500/20"
              iconColor="text-cyan-400"
            />
            <StatsCard
              title="Active Users"
              value={stats?.activeUsers || 0}
              change={5}
              icon={Users}
              iconBgColor="bg-violet-500/20"
              iconColor="text-violet-400"
            />
            <StatsCard
              title="Matches Made"
              value={stats?.totalMatches || 0}
              change={-2}
              icon={Heart}
              iconBgColor="bg-rose-500/20"
              iconColor="text-rose-400"
            />
            <StatsCard
              title="Spots Logged"
              value={stats?.totalSpots || 0}
              change={8}
              icon={MapPin}
              iconBgColor="bg-emerald-500/20"
              iconColor="text-emerald-400"
            />
          </>
        )}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        {/* Engagement Chart */}
        <div className="col-span-2 bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-semibold text-white">User Engagement Trends</h2>
              <p className="text-sm text-slate-400">Active Sessions vs. New Signups</p>
            </div>
            <Button variant="link" className="text-cyan-400 hover:text-cyan-300">
              View Details
            </Button>
          </div>
          
          {trendsLoading ? (
            <Skeleton className="h-[300px] bg-slate-700" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={trends}>
                <defs>
                  <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b" 
                  tickFormatter={(val) => format(new Date(val), 'EEE')}
                />
                <YAxis stroke="#64748b" tickFormatter={(val) => `${val / 1000}k`} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #334155',
                    borderRadius: '8px'
                  }}
                  labelFormatter={(val) => format(new Date(val), 'MMM d, yyyy')}
                />
                <Area
                  type="monotone"
                  dataKey="activeUsers"
                  stroke="#06b6d4"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorActive)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Mode Distribution */}
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
          <h2 className="text-lg font-semibold text-white mb-4">User Mode Preference</h2>
          
          {statsLoading ? (
            <Skeleton className="h-[200px] bg-slate-700 rounded-full mx-auto" style={{ width: 200 }} />
          ) : (
            <div className="relative">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={modeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {modeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex items-center justify-center flex-col">
                <span className="text-2xl font-bold text-white">{totalModeUsers.toLocaleString()}</span>
                <span className="text-xs text-slate-400">Total Users</span>
              </div>
            </div>
          )}
          
          <div className="space-y-3 mt-4">
            {modeData.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index] }} />
                  <span className="text-sm text-slate-300">{item.name}</span>
                </div>
                <span className="text-sm font-medium text-white">
                  {totalModeUsers > 0 ? Math.round((item.value / totalModeUsers) * 100) : 0}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-2 gap-6">
        {/* Popular Spots */}
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-white">Fishing Hotspots</h2>
            <p className="text-sm text-slate-400">Most active locations this week</p>
          </div>
          
          {spotsLoading ? (
            <Skeleton className="h-[200px] bg-slate-700" />
          ) : (
            <div className="space-y-3">
              {popularSpots?.map((spot, index) => (
                <div key={spot.id} className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg">
                  <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 text-xs flex items-center justify-center font-medium">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{spot.name}</p>
                    <p className="text-xs text-slate-400 truncate">{spot.location_name || 'Unknown location'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-white">★ {spot.rating_avg?.toFixed(1) || 'N/A'}</p>
                    <p className="text-xs text-slate-400">{spot.rating_count} reviews</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Premium */}
        <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Recent Premium Subscriptions</h2>
              <p className="text-sm text-slate-400">Latest pro upgrades across platform</p>
            </div>
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
              •••
            </Button>
          </div>
          
          {premiumLoading ? (
            <Skeleton className="h-[200px] bg-slate-700" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs text-slate-400 uppercase">
                    <th className="pb-3">User</th>
                    <th className="pb-3">Plan Type</th>
                    <th className="pb-3">Date</th>
                    <th className="pb-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {premiumUsers?.slice(0, 5).map((user) => (
                    <tr key={user.id} className="text-sm">
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={user.photos?.[0]} />
                            <AvatarFallback className="bg-slate-700 text-white text-xs">
                              {user.display_name?.[0]?.toUpperCase() || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <span className="text-white">{user.display_name || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="py-3 text-slate-300">Premium</td>
                      <td className="py-3 text-slate-400">
                        {user.updated_at ? format(new Date(user.updated_at), 'MMM d') : 'N/A'}
                      </td>
                      <td className="py-3">
                        <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-400 border-0">
                          Active
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
