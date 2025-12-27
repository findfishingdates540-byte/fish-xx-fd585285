import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  BarChart3, 
  Eye, 
  MousePointer, 
  TrendingUp,
  Users,
  Target,
  Sparkles,
} from 'lucide-react';
import { useAdminAds, adTypeLabels, type AdType } from '@/hooks/use-admin-ads';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const CHART_COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  '#10b981',
  '#f59e0b',
  '#ef4444',
];

export default function AdminAdAnalytics() {
  const { data: ads, isLoading } = useAdminAds();

  const analytics = useMemo(() => {
    if (!ads || ads.length === 0) return null;

    // Overall metrics
    const totalImpressions = ads.reduce((sum, ad) => sum + ad.impressions, 0);
    const totalClicks = ads.reduce((sum, ad) => sum + ad.clicks, 0);
    const overallCTR = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
    const activeAds = ads.filter(ad => ad.is_active).length;

    // Performance by ad type
    const byAdType = Object.entries(adTypeLabels).map(([type, label]) => {
      const typeAds = ads.filter(ad => ad.ad_type === type);
      const impressions = typeAds.reduce((sum, ad) => sum + ad.impressions, 0);
      const clicks = typeAds.reduce((sum, ad) => sum + ad.clicks, 0);
      const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
      return {
        type,
        label,
        impressions,
        clicks,
        ctr: parseFloat(ctr.toFixed(2)),
        count: typeAds.length,
      };
    }).filter(item => item.count > 0);

    // Performance by gender targeting
    const genderLabels: Record<string, string> = {
      male: 'Male',
      female: 'Female',
      non_binary: 'Non-binary',
      other: 'Other',
      all: 'All Genders',
    };
    
    const byGender: { gender: string; label: string; impressions: number; clicks: number; ctr: number }[] = [];
    const genderMap = new Map<string, { impressions: number; clicks: number }>();
    
    ads.forEach(ad => {
      const genders = ad.target_genders && ad.target_genders.length > 0 
        ? ad.target_genders 
        : ['all'];
      
      genders.forEach(gender => {
        const existing = genderMap.get(gender) || { impressions: 0, clicks: 0 };
        genderMap.set(gender, {
          impressions: existing.impressions + ad.impressions,
          clicks: existing.clicks + ad.clicks,
        });
      });
    });

    genderMap.forEach((data, gender) => {
      const ctr = data.impressions > 0 ? (data.clicks / data.impressions) * 100 : 0;
      byGender.push({
        gender,
        label: genderLabels[gender] || gender,
        impressions: data.impressions,
        clicks: data.clicks,
        ctr: parseFloat(ctr.toFixed(2)),
      });
    });

    // Performance by experience level targeting
    const experienceLabels: Record<string, string> = {
      beginner: 'Beginner',
      intermediate: 'Intermediate',
      advanced: 'Advanced',
      expert: 'Expert',
      all: 'All Levels',
    };

    const byExperience: { level: string; label: string; impressions: number; clicks: number; ctr: number }[] = [];
    const experienceMap = new Map<string, { impressions: number; clicks: number }>();
    
    ads.forEach(ad => {
      const levels = ad.target_experience_levels && ad.target_experience_levels.length > 0 
        ? ad.target_experience_levels 
        : ['all'];
      
      levels.forEach(level => {
        const existing = experienceMap.get(level) || { impressions: 0, clicks: 0 };
        experienceMap.set(level, {
          impressions: existing.impressions + ad.impressions,
          clicks: existing.clicks + ad.clicks,
        });
      });
    });

    experienceMap.forEach((data, level) => {
      const ctr = data.impressions > 0 ? (data.clicks / data.impressions) * 100 : 0;
      byExperience.push({
        level,
        label: experienceLabels[level] || level,
        impressions: data.impressions,
        clicks: data.clicks,
        ctr: parseFloat(ctr.toFixed(2)),
      });
    });

    // Top performing ads
    const topAds = [...ads]
      .map(ad => ({
        ...ad,
        ctr: ad.impressions > 0 ? (ad.clicks / ad.impressions) * 100 : 0,
      }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 5);

    // Impressions distribution by type for pie chart
    const impressionsByType = byAdType.map(item => ({
      name: item.label,
      value: item.impressions,
    })).filter(item => item.value > 0);

    return {
      totalImpressions,
      totalClicks,
      overallCTR,
      activeAds,
      totalAds: ads.length,
      byAdType,
      byGender,
      byExperience,
      topAds,
      impressionsByType,
    };
  }, [ads]);

  if (isLoading) {
    return (
      <div className="p-8 space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="p-8">
        <div className="text-center py-16">
          <BarChart3 className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h2 className="text-xl font-semibold mb-2">No Analytics Data</h2>
          <p className="text-muted-foreground">
            Create some advertisements to see performance analytics.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <BarChart3 className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Ad Analytics</h1>
          <p className="text-muted-foreground">Track performance across targeting segments</p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Eye className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Impressions</p>
                <p className="text-2xl font-bold">{analytics.totalImpressions.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <MousePointer className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Clicks</p>
                <p className="text-2xl font-bold">{analytics.totalClicks.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Overall CTR</p>
                <p className="text-2xl font-bold">{analytics.overallCTR.toFixed(2)}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 md:p-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active / Total</p>
                <p className="text-2xl font-bold">{analytics.activeAds} / {analytics.totalAds}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance by Ad Type */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Performance by Ad Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.byAdType.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.byAdType} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis dataKey="label" type="category" width={100} className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number, name: string) => [
                      value.toLocaleString(),
                      name === 'impressions' ? 'Impressions' : name === 'clicks' ? 'Clicks' : 'CTR %'
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="impressions" fill="hsl(var(--primary))" name="Impressions" />
                  <Bar dataKey="clicks" fill="hsl(var(--chart-2))" name="Clicks" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Impressions Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Impressions by Ad Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.impressionsByType.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.impressionsByType}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analytics.impressionsByType.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number) => [value.toLocaleString(), 'Impressions']}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Targeting Segments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* By Gender */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Performance by Gender Target
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.byGender.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={analytics.byGender}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="label" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="impressions" fill="hsl(var(--primary))" name="Impressions" />
                  <Bar dataKey="clicks" fill="hsl(var(--chart-2))" name="Clicks" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* By Experience Level */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Performance by Experience Target
            </CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.byExperience.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={analytics.byExperience}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="label" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="impressions" fill="hsl(var(--primary))" name="Impressions" />
                  <Bar dataKey="clicks" fill="hsl(var(--chart-2))" name="Clicks" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Ads */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Top Performing Ads
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.topAds.length > 0 ? (
              analytics.topAds.map((ad, index) => (
                <div 
                  key={ad.id} 
                  className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 border"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{ad.title}</p>
                    <p className="text-sm text-muted-foreground">{ad.sponsor_name}</p>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <Badge variant="outline" className="gap-1">
                      <Eye className="h-3 w-3" />
                      {ad.impressions.toLocaleString()}
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      <MousePointer className="h-3 w-3" />
                      {ad.clicks.toLocaleString()}
                    </Badge>
                    <Badge 
                      variant={ad.ctr > 2 ? 'default' : 'secondary'}
                      className="gap-1"
                    >
                      <TrendingUp className="h-3 w-3" />
                      {ad.ctr.toFixed(2)}%
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No ads to display
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}