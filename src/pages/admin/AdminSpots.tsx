import { useState, useMemo } from 'react';
import { Search, MoreVertical, MapPin, Star, Eye, Trash2, CheckCircle, XCircle, Globe, Lock, Plus, Pencil, Upload, Filter, ChevronDown, Waves, Droplets } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminSpots, useVerifySpot, useToggleSpotPublic, useBulkDeleteSpots, useBulkVerifySpots, useBulkTogglePublic, useBulkUpdateAreaType } from '@/hooks/use-admin-spots';
import { SpotDetailsModal } from '@/components/admin/SpotDetailsModal';
import { DeleteSpotDialog } from '@/components/admin/DeleteSpotDialog';
import { AddSpotDialog } from '@/components/admin/AddSpotDialog';
import { EditSpotDialog } from '@/components/admin/EditSpotDialog';
import { ImportSpotsDialog } from '@/components/admin/ImportSpotsDialog';

type SpotType = NonNullable<ReturnType<typeof useAdminSpots>['data']>[number];

type FilterStatus = 'all' | 'verified' | 'unverified';
type FilterVisibility = 'all' | 'public' | 'private';
type FilterRating = 'all' | 'high' | 'medium' | 'low' | 'unrated';

export default function AdminSpots() {
  const [search, setSearch] = useState('');
  const { data: spots, isLoading } = useAdminSpots(search);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [visibilityFilter, setVisibilityFilter] = useState<FilterVisibility>('all');
  const [ratingFilter, setRatingFilter] = useState<FilterRating>('all');

  // Selection states
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState<'delete' | 'verify' | 'unverify' | 'public' | 'private' | 'freshwater' | 'saltwater' | null>(null);

  // Modal states
  const [selectedSpot, setSelectedSpot] = useState<SpotType | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  // Mutations
  const { mutate: verifySpot, isPending: verifyPending } = useVerifySpot();
  const { mutate: togglePublic, isPending: publicPending } = useToggleSpotPublic();
  const { mutate: bulkDelete, isPending: bulkDeletePending } = useBulkDeleteSpots();
  const { mutate: bulkVerify, isPending: bulkVerifyPending } = useBulkVerifySpots();
  const { mutate: bulkTogglePublic, isPending: bulkPublicPending } = useBulkTogglePublic();
  const { mutate: bulkUpdateAreaType, isPending: bulkAreaTypePending } = useBulkUpdateAreaType();

  const isBulkPending = bulkDeletePending || bulkVerifyPending || bulkPublicPending || bulkAreaTypePending;

  // Apply filters
  const filteredSpots = useMemo(() => {
    if (!spots) return [];
    
    return spots.filter(spot => {
      // Status filter
      if (statusFilter === 'verified' && !spot.is_verified) return false;
      if (statusFilter === 'unverified' && spot.is_verified) return false;
      
      // Visibility filter
      if (visibilityFilter === 'public' && !spot.is_public) return false;
      if (visibilityFilter === 'private' && spot.is_public) return false;
      
      // Rating filter
      if (ratingFilter === 'high' && (spot.rating_avg || 0) < 4) return false;
      if (ratingFilter === 'medium' && ((spot.rating_avg || 0) < 2.5 || (spot.rating_avg || 0) >= 4)) return false;
      if (ratingFilter === 'low' && (spot.rating_avg || 0) >= 2.5) return false;
      if (ratingFilter === 'unrated' && spot.rating_avg !== null && spot.rating_count !== 0) return false;
      
      return true;
    });
  }, [spots, statusFilter, visibilityFilter, ratingFilter]);

  const allSelected = filteredSpots.length > 0 && filteredSpots.every(spot => selectedIds.has(spot.id));
  const someSelected = selectedIds.size > 0;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredSpots.map(spot => spot.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectSpot = (spotId: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(spotId);
    } else {
      newSelected.delete(spotId);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkAction = () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0 || !bulkAction) return;

    switch (bulkAction) {
      case 'delete':
        bulkDelete(ids, { onSuccess: () => setSelectedIds(new Set()) });
        break;
      case 'verify':
        bulkVerify({ spotIds: ids, verified: true }, { onSuccess: () => setSelectedIds(new Set()) });
        break;
      case 'unverify':
        bulkVerify({ spotIds: ids, verified: false }, { onSuccess: () => setSelectedIds(new Set()) });
        break;
      case 'public':
        bulkTogglePublic({ spotIds: ids, isPublic: true }, { onSuccess: () => setSelectedIds(new Set()) });
        break;
      case 'private':
        bulkTogglePublic({ spotIds: ids, isPublic: false }, { onSuccess: () => setSelectedIds(new Set()) });
        break;
      case 'freshwater':
        bulkUpdateAreaType({ spotIds: ids, areaType: 'freshwater' }, { onSuccess: () => setSelectedIds(new Set()) });
        break;
      case 'saltwater':
        bulkUpdateAreaType({ spotIds: ids, areaType: 'saltwater' }, { onSuccess: () => setSelectedIds(new Set()) });
        break;
    }
    setBulkAction(null);
  };

  const handleViewDetails = (spot: SpotType) => {
    setSelectedSpot(spot);
    setDetailsOpen(true);
  };

  const handleDeleteSpot = (spot: SpotType) => {
    setSelectedSpot(spot);
    setDeleteDialogOpen(true);
  };

  const handleEditSpot = (spot: SpotType) => {
    setSelectedSpot(spot);
    setEditDialogOpen(true);
  };

  const handleVerifySpot = (spot: SpotType) => {
    verifySpot({ spotId: spot.id, verified: !spot.is_verified });
  };

  const handleTogglePublic = (spot: SpotType) => {
    togglePublic({ spotId: spot.id, isPublic: !spot.is_public });
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setVisibilityFilter('all');
    setRatingFilter('all');
  };

  const hasActiveFilters = statusFilter !== 'all' || visibilityFilter !== 'all' || ratingFilter !== 'all';

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Fishing Spots</h1>
          <p className="text-slate-400 mt-1">Manage all fishing spots on the platform</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setImportDialogOpen(true)}
            className="bg-cyan-600 hover:bg-cyan-700"
          >
            <Upload className="w-4 h-4 mr-2" />
            Import CSV
          </Button>
          <Button 
            onClick={() => setAddDialogOpen(true)}
            className="bg-cyan-600 hover:bg-cyan-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Spot
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search spots by name or location..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as FilterStatus)}>
            <SelectTrigger className="w-[140px] bg-slate-800 border-slate-700 text-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all" className="text-slate-300">All Status</SelectItem>
              <SelectItem value="verified" className="text-slate-300">Verified</SelectItem>
              <SelectItem value="unverified" className="text-slate-300">Unverified</SelectItem>
            </SelectContent>
          </Select>

          <Select value={visibilityFilter} onValueChange={(v) => setVisibilityFilter(v as FilterVisibility)}>
            <SelectTrigger className="w-[140px] bg-slate-800 border-slate-700 text-white">
              <SelectValue placeholder="Visibility" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all" className="text-slate-300">All Visibility</SelectItem>
              <SelectItem value="public" className="text-slate-300">Public</SelectItem>
              <SelectItem value="private" className="text-slate-300">Private</SelectItem>
            </SelectContent>
          </Select>

          <Select value={ratingFilter} onValueChange={(v) => setRatingFilter(v as FilterRating)}>
            <SelectTrigger className="w-[140px] bg-slate-800 border-slate-700 text-white">
              <SelectValue placeholder="Rating" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all" className="text-slate-300">All Ratings</SelectItem>
              <SelectItem value="high" className="text-slate-300">High (4+)</SelectItem>
              <SelectItem value="medium" className="text-slate-300">Medium (2.5-4)</SelectItem>
              <SelectItem value="low" className="text-slate-300">Low (&lt;2.5)</SelectItem>
              <SelectItem value="unrated" className="text-slate-300">Unrated</SelectItem>
            </SelectContent>
          </Select>

          {hasActiveFilters && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearFilters}
              className="text-slate-400 hover:text-white"
            >
              Clear filters
            </Button>
          )}
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {someSelected && (
        <div className="flex items-center gap-4 mb-4 p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
          <span className="text-cyan-400 font-medium">{selectedIds.size} selected</span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setBulkAction('verify')}
              disabled={isBulkPending}
              className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/20"
            >
              <CheckCircle className="w-4 h-4 mr-1" />
              Verify
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setBulkAction('unverify')}
              disabled={isBulkPending}
              className="border-amber-500/50 text-amber-400 hover:bg-amber-500/20"
            >
              <XCircle className="w-4 h-4 mr-1" />
              Unverify
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setBulkAction('public')}
              disabled={isBulkPending}
              className="border-slate-500/50 text-slate-300 hover:bg-slate-500/20"
            >
              <Globe className="w-4 h-4 mr-1" />
              Make Public
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setBulkAction('private')}
              disabled={isBulkPending}
              className="border-slate-500/50 text-slate-300 hover:bg-slate-500/20"
            >
              <Lock className="w-4 h-4 mr-1" />
              Make Private
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setBulkAction('freshwater')}
              disabled={isBulkPending}
              className="border-blue-500/50 text-blue-400 hover:bg-blue-500/20"
            >
              <Droplets className="w-4 h-4 mr-1" />
              Freshwater
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setBulkAction('saltwater')}
              disabled={isBulkPending}
              className="border-teal-500/50 text-teal-400 hover:bg-teal-500/20"
            >
              <Waves className="w-4 h-4 mr-1" />
              Saltwater
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setBulkAction('delete')}
              disabled={isBulkPending}
              className="border-rose-500/50 text-rose-400 hover:bg-rose-500/20"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSelectedIds(new Set())}
            className="ml-auto text-slate-400 hover:text-white"
          >
            Clear selection
          </Button>
        </div>
      )}

      {/* Select All */}
      {!isLoading && filteredSpots.length > 0 && (
        <div className="flex items-center gap-2 mb-4">
          <Checkbox 
            id="select-all"
            checked={allSelected}
            onCheckedChange={handleSelectAll}
            className="border-slate-600 data-[state=checked]:bg-cyan-600"
          />
          <label htmlFor="select-all" className="text-sm text-slate-400 cursor-pointer">
            Select all ({filteredSpots.length})
          </label>
        </div>
      )}

      {/* Spots Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 9 }).map((_, i) => (
            <Skeleton key={i} className="h-64 bg-slate-800" />
          ))
        ) : filteredSpots.length === 0 ? (
          <div className="col-span-full bg-slate-800/50 rounded-xl p-12 text-center border border-slate-700/50">
            <MapPin className="w-12 h-12 text-slate-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No spots found</h3>
            <p className="text-slate-400">No fishing spots match your filters.</p>
          </div>
        ) : (
          filteredSpots.map((spot) => (
            <div
              key={spot.id}
              className={`bg-slate-800/50 rounded-xl overflow-hidden border transition-colors ${
                selectedIds.has(spot.id) 
                  ? 'border-cyan-500/50 ring-1 ring-cyan-500/30' 
                  : 'border-slate-700/50 hover:border-slate-600'
              }`}
            >
              {/* Spot Image */}
              <div className="aspect-video bg-slate-700 relative">
                {/* Selection checkbox */}
                <div className="absolute top-2 left-2 z-10">
                  <Checkbox 
                    checked={selectedIds.has(spot.id)}
                    onCheckedChange={(checked) => handleSelectSpot(spot.id, !!checked)}
                    className="border-white/50 bg-black/30 data-[state=checked]:bg-cyan-600"
                  />
                </div>
                {spot.photos?.[0] ? (
                  <img
                    src={spot.photos[0]}
                    alt={spot.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <MapPin className="w-8 h-8 text-slate-500" />
                  </div>
                )}
                <div className="absolute top-2 right-2 flex gap-2">
                  {spot.is_verified && (
                    <Badge className="bg-cyan-500/20 text-cyan-400 border-0">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                  {!spot.is_public && (
                    <Badge className="bg-amber-500/20 text-amber-400 border-0">
                      <Lock className="w-3 h-3 mr-1" />
                      Private
                    </Badge>
                  )}
                </div>
              </div>

              {/* Spot Info */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white truncate">{spot.name}</h3>
                    <p className="text-sm text-slate-400 flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      {spot.location_name || 'Unknown location'}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white flex-shrink-0">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                        <DropdownMenuItem 
                          onClick={() => handleEditSpot(spot)}
                          className="text-slate-300 focus:text-white focus:bg-slate-700"
                        >
                          <Pencil className="w-4 h-4 mr-2" />
                          Edit Spot
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleViewDetails(spot)}
                          className="text-slate-300 focus:text-white focus:bg-slate-700"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-slate-700" />
                      <DropdownMenuItem 
                        onClick={() => handleVerifySpot(spot)}
                        disabled={verifyPending}
                        className={spot.is_verified 
                          ? "text-amber-400 focus:text-amber-300 focus:bg-slate-700"
                          : "text-cyan-400 focus:text-cyan-300 focus:bg-slate-700"
                        }
                      >
                        {spot.is_verified ? (
                          <>
                            <XCircle className="w-4 h-4 mr-2" />
                            Remove Verification
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Verify Spot
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleTogglePublic(spot)}
                        disabled={publicPending}
                        className="text-slate-300 focus:text-white focus:bg-slate-700"
                      >
                        {spot.is_public ? (
                          <>
                            <Lock className="w-4 h-4 mr-2" />
                            Make Private
                          </>
                        ) : (
                          <>
                            <Globe className="w-4 h-4 mr-2" />
                            Make Public
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-slate-700" />
                      <DropdownMenuItem 
                        onClick={() => handleDeleteSpot(spot)}
                        className="text-rose-400 focus:text-rose-300 focus:bg-slate-700"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Spot
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-amber-400">
                    <Star className="w-4 h-4 fill-current" />
                    <span>{spot.rating_avg?.toFixed(1) || 'N/A'}</span>
                    <span className="text-slate-500">({spot.rating_count || 0})</span>
                  </div>
                  <span className="text-slate-500">
                    {format(new Date(spot.created_at), 'MMM d, yyyy')}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bulk Action Confirmation Dialog */}
      <AlertDialog open={!!bulkAction} onOpenChange={() => setBulkAction(null)}>
        <AlertDialogContent className="bg-slate-800 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">
              {bulkAction === 'delete' && 'Delete Selected Spots'}
              {bulkAction === 'verify' && 'Verify Selected Spots'}
              {bulkAction === 'unverify' && 'Unverify Selected Spots'}
              {bulkAction === 'public' && 'Make Spots Public'}
              {bulkAction === 'private' && 'Make Spots Private'}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              {bulkAction === 'delete' 
                ? `Are you sure you want to delete ${selectedIds.size} fishing spots? This action cannot be undone.`
                : `This will update ${selectedIds.size} fishing spots.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-700 text-white border-slate-600 hover:bg-slate-600">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkAction}
              className={bulkAction === 'delete' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-cyan-600 hover:bg-cyan-700'}
            >
              {bulkAction === 'delete' ? 'Delete' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Modals */}
      <SpotDetailsModal 
        spot={selectedSpot} 
        open={detailsOpen} 
        onOpenChange={setDetailsOpen} 
      />
      <DeleteSpotDialog 
        spot={selectedSpot} 
        open={deleteDialogOpen} 
        onOpenChange={setDeleteDialogOpen} 
      />
      <AddSpotDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
      />
      <EditSpotDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        spot={selectedSpot}
      />
      <ImportSpotsDialog
        open={importDialogOpen}
        onOpenChange={setImportDialogOpen}
      />
    </div>
  );
}