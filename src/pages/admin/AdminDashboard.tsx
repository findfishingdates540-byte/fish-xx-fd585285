import { useState } from 'react';
import { Bell, Download, Calendar, Users, Heart, MapPin, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatsCard } from '@/components/admin';
import { useAdminStats, useEngagementTrends, useRecentPremiumSubscriptions, usePopularSpots } from '@/hooks/use-admin-stats';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

const COLORS = ['#06b6d4', '#a855f7', '#22c55e'];

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('30');
  
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: trends, isLoading: trendsLoading } = useEngagementTrends(parseInt(dateRange));
  const { data: premiumUsers, isLoading: premiumLoading } = useRecentPremiumSubscriptions();
  const { data: popularSpots, isLoading: spotsLoading } = usePopularSpots();

  const modeData = stats ? [
    { name: 'Dating Mode', value: stats.modeDistribution.dating, color: '#06b6d4' },
    { name: 'Combo Mode', value: stats.modeDistribution.both, color: '#a855f7' },
    { name: 'Fishing Mode', value: stats.modeDistribution.fishing, color: '#22c55e' },
  ] : [];

  const totalModeUsers = modeData.reduce((acc, item) => acc + item.value, 0);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics & Reporting</h1>
          <p className="text-slate-400 mt-1">Real-time insights across Dating, Fishing, and Combo modes</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button variant="ghost" size="icon" className="relative bg-slate-800 text-white hover:bg-slate-700">
            <Bell className="w-5 h-5" />
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-500 rounded-full" />
          </Button>
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
