import { useState } from 'react';
import { 
  Megaphone, 
  Search, 
  Plus, 
  MoreVertical, 
  Eye, 
  MousePointerClick,
  Calendar,
  Pencil,
  Trash2,
  Power,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  useAdminAds, 
  useDeleteAd, 
  useToggleAdActive,
  Advertisement,
  adTypeLabels,
  AdType
} from '@/hooks/use-admin-ads';
import { AdDialog } from '@/components/admin/AdDialog';
import { format } from 'date-fns';

export default function AdminAds() {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedAd, setSelectedAd] = useState<Advertisement | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [adToDelete, setAdToDelete] = useState<Advertisement | null>(null);

  const { data: ads = [], isLoading } = useAdminAds(search, typeFilter, statusFilter);
  const deleteAd = useDeleteAd();
  const toggleActive = useToggleAdActive();

  const handleEdit = (ad: Advertisement) => {
    setSelectedAd(ad);
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setSelectedAd(null);
    setDialogOpen(true);
  };

  const handleDelete = (ad: Advertisement) => {
    setAdToDelete(ad);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (adToDelete) {
      await deleteAd.mutateAsync(adToDelete.id);
      setDeleteDialogOpen(false);
      setAdToDelete(null);
    }
  };

  const handleToggleActive = async (ad: Advertisement) => {
    await toggleActive.mutateAsync({ id: ad.id, is_active: !ad.is_active });
  };

  const getAdStatus = (ad: Advertisement) => {
    const today = new Date().toISOString().split('T')[0];
    
    if (!ad.is_active) return { label: 'Inactive', variant: 'secondary' as const };
    if (ad.start_date > today) return { label: 'Scheduled', variant: 'outline' as const };
    if (ad.end_date && ad.end_date < today) return { label: 'Expired', variant: 'destructive' as const };
    return { label: 'Active', variant: 'default' as const };
  };

  // Calculate totals
  const totalImpressions = ads.reduce((sum, ad) => sum + ad.impressions, 0);
  const totalClicks = ads.reduce((sum, ad) => sum + ad.clicks, 0);
  const activeAds = ads.filter(ad => ad.is_active).length;

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Megaphone className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Advertisements</h1>
            <p className="text-slate-400">Manage sponsored posts and ads</p>
          </div>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Create Ad
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Total Ads</CardTitle>
            <Megaphone className="h-4 w-4 text-slate-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{ads.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Active Ads</CardTitle>
            <Power className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{activeAds}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Total Impressions</CardTitle>
            <Eye className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalImpressions.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Total Clicks</CardTitle>
            <MousePointerClick className="h-4 w-4 text-amber-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalClicks.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search ads..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[180px] bg-slate-900 border-slate-600 text-white">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                <SelectItem value="all">All Types</SelectItem>
                {Object.entries(adTypeLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[150px] bg-slate-900 border-slate-600 text-white">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Ads Table */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full bg-slate-700" />
              ))}
            </div>
          ) : ads.length === 0 ? (
            <div className="text-center py-12">
              <Megaphone className="h-12 w-12 text-slate-500 mx-auto mb-4" />
              <h3 className="font-semibold mb-2 text-white">No advertisements found</h3>
              <p className="text-sm text-slate-400 mb-4">
                Create your first ad to start promoting content in the feed.
              </p>
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Create Ad
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700 hover:bg-slate-800/50">
                    <TableHead className="text-slate-300">Ad</TableHead>
                    <TableHead className="text-slate-300">Type</TableHead>
                    <TableHead className="text-slate-300">Sponsor</TableHead>
                    <TableHead className="text-slate-300">Schedule</TableHead>
                    <TableHead className="text-slate-300">Status</TableHead>
                    <TableHead className="text-center text-slate-300">Impressions</TableHead>
                    <TableHead className="text-center text-slate-300">Clicks</TableHead>
                    <TableHead className="text-center text-slate-300">CTR</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ads.map((ad) => {
                    const status = getAdStatus(ad);
                    const ctr = ad.impressions > 0 
                      ? ((ad.clicks / ad.impressions) * 100).toFixed(2) 
                      : '0.00';

                    return (
                      <TableRow key={ad.id} className="border-slate-700 hover:bg-slate-800/50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {ad.photos[0] ? (
                              <img
                                src={ad.photos[0]}
                                alt={ad.title}
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-lg bg-slate-700 flex items-center justify-center">
                                <Megaphone className="h-5 w-5 text-slate-400" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium line-clamp-1 text-white">{ad.title}</p>
                              {ad.description && (
                                <p className="text-sm text-slate-400 line-clamp-1">
                                  {ad.description}
                                </p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="border-slate-600 text-slate-300">
                            {adTypeLabels[ad.ad_type as AdType] || ad.ad_type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {ad.sponsor_logo && (
                              <img
                                src={ad.sponsor_logo}
                                alt={ad.sponsor_name}
                                className="w-6 h-6 rounded-full object-cover"
                              />
                            )}
                            <span className="text-sm text-slate-300">{ad.sponsor_name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-slate-400">
                            <Calendar className="h-3 w-3" />
                            <span>{format(new Date(ad.start_date), 'MMM d')}</span>
                            {ad.end_date && (
                              <>
                                <span>-</span>
                                <span>{format(new Date(ad.end_date), 'MMM d')}</span>
                              </>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={status.variant}>{status.label}</Badge>
                        </TableCell>
                        <TableCell className="text-center text-slate-300">
                          {ad.impressions.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-center text-slate-300">
                          {ad.clicks.toLocaleString()}
                        </TableCell>
                        <TableCell className="text-center text-slate-300">
                          {ctr}%
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(ad)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleToggleActive(ad)}>
                                <Power className="h-4 w-4 mr-2" />
                                {ad.is_active ? 'Deactivate' : 'Activate'}
                              </DropdownMenuItem>
                              {ad.cta_url && (
                                <DropdownMenuItem asChild>
                                  <a href={ad.cta_url} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    View CTA Link
                                  </a>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handleDelete(ad)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AdDialog
        isOpen={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setSelectedAd(null);
        }}
        ad={selectedAd}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Advertisement</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{adToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
